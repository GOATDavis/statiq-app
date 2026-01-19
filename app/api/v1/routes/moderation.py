"""
StatIQ Moderation API Router
Phase 1 & 2: Admin moderation tools with auto-flagging
"""

from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import os

router = APIRouter(prefix="/api/v1/moderation", tags=["moderation"])

# Database connection
def get_db():
    conn = psycopg2.connect(
        host=os.getenv("DB_HOST", "localhost"),
        database=os.getenv("DB_NAME", "statiq"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        cursor_factory=RealDictCursor
    )
    try:
        yield conn
    finally:
        conn.close()

# ============================================================================
# PYDANTIC MODELS
# ============================================================================

class UserSearchResult(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    account_status: str
    warning_count: int
    total_flags: int
    total_mod_actions: int
    last_active: Optional[datetime]
    created_at: datetime

class FlaggedMessage(BaseModel):
    flag_id: int
    message_id: int
    message_text: str
    room_id: int
    message_author_id: int
    message_author_username: str
    flag_type: str
    flag_reason: Optional[str]
    flagged_by_user_id: Optional[int]
    flagged_by_username: str
    created_at: datetime
    
class ChatMessageDetail(BaseModel):
    id: int
    room_id: int
    user_id: int
    user_name: str
    message_text: str
    was_censored: bool
    created_at: datetime

class ModerationAction(BaseModel):
    action_type: str  # 'warn', 'suspend', 'ban', 'delete_message', 'dismiss_flag'
    reason: str
    duration_days: Optional[int] = None  # For temporary suspensions
    admin_notes: Optional[str] = None

class UserProfile(BaseModel):
    user_id: int
    username: str
    email: str
    role: str
    account_status: str
    created_at: datetime
    warning_count: int
    last_warning_at: Optional[datetime]
    total_flags: int
    total_mod_actions: int
    recent_messages: List[ChatMessageDetail]
    moderation_history: List[dict]
    is_suspended: bool
    suspension_expires: Optional[datetime]

class ModerationStats(BaseModel):
    pending_flags: int
    total_warnings_today: int
    total_suspensions_today: int
    active_suspensions: int
    messages_deleted_today: int
    top_flagged_users: List[dict]

# ============================================================================
# AUTH MIDDLEWARE (ADMIN ONLY)
# ============================================================================

async def verify_admin(token: str = Query(..., description="Admin email token")):
    """Verify that the requesting user is an admin"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT id, email, role FROM users WHERE email = %s
        """, (token,))
        user = cursor.fetchone()
        
        if not user or user['role'] != 'admin':
            raise HTTPException(status_code=403, detail="Admin access required")
        
        return user
    finally:
        cursor.close()

# ============================================================================
# MODERATION DASHBOARD
# ============================================================================

@router.get("/dashboard", response_model=ModerationStats)
async def get_moderation_dashboard(admin = Depends(verify_admin)):
    """Get overview stats for the moderation dashboard"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        # Pending flags
        cursor.execute("SELECT COUNT(*) as count FROM flagged_content WHERE status = 'pending'")
        pending_flags = cursor.fetchone()['count']
        
        # Today's warnings
        cursor.execute("""
            SELECT COUNT(*) as count FROM moderation_log 
            WHERE action_type = 'warn' 
            AND created_at >= CURRENT_DATE
        """)
        warnings_today = cursor.fetchone()['count']
        
        # Today's suspensions
        cursor.execute("""
            SELECT COUNT(*) as count FROM moderation_log 
            WHERE action_type = 'suspend' 
            AND created_at >= CURRENT_DATE
        """)
        suspensions_today = cursor.fetchone()['count']
        
        # Active suspensions
        cursor.execute("SELECT COUNT(*) as count FROM active_suspensions")
        active_suspensions = cursor.fetchone()['count']
        
        # Messages deleted today
        cursor.execute("""
            SELECT COUNT(*) as count FROM moderation_log 
            WHERE action_type = 'delete_message' 
            AND created_at >= CURRENT_DATE
        """)
        deleted_today = cursor.fetchone()['count']
        
        # Top flagged users (last 7 days)
        cursor.execute("""
            SELECT 
                cm.user_id,
                u.username,
                COUNT(*) as flag_count
            FROM flagged_content fc
            JOIN chat_messages cm ON fc.message_id = cm.id
            JOIN users u ON cm.user_id = u.id
            WHERE fc.created_at >= CURRENT_DATE - INTERVAL '7 days'
            GROUP BY cm.user_id, u.username
            ORDER BY flag_count DESC
            LIMIT 5
        """)
        top_flagged = cursor.fetchall()
        
        return {
            "pending_flags": pending_flags,
            "total_warnings_today": warnings_today,
            "total_suspensions_today": suspensions_today,
            "active_suspensions": active_suspensions,
            "messages_deleted_today": deleted_today,
            "top_flagged_users": [dict(row) for row in top_flagged]
        }
    finally:
        cursor.close()

# ============================================================================
# FLAGGED CONTENT QUEUE
# ============================================================================

@router.get("/flags/pending", response_model=List[FlaggedMessage])
async def get_pending_flags(
    limit: int = Query(50, le=200),
    admin = Depends(verify_admin)
):
    """Get all pending flagged content"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM pending_flags_summary
            LIMIT %s
        """, (limit,))
        
        flags = cursor.fetchall()
        return [dict(row) for row in flags]
    finally:
        cursor.close()

@router.get("/flags/{flag_id}/context")
async def get_flag_context(
    flag_id: int,
    context_messages: int = Query(5, description="Number of surrounding messages"),
    admin = Depends(verify_admin)
):
    """Get the flagged message with surrounding context"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        # Get the flagged message details
        cursor.execute("""
            SELECT 
                fc.id as flag_id,
                fc.message_id,
                fc.flag_type,
                fc.flag_reason,
                fc.flag_details,
                cm.room_id,
                cm.created_at as message_created_at
            FROM flagged_content fc
            JOIN chat_messages cm ON fc.message_id = cm.id
            WHERE fc.id = %s
        """, (flag_id,))
        
        flag_info = cursor.fetchone()
        if not flag_info:
            raise HTTPException(status_code=404, detail="Flag not found")
        
        # Get surrounding messages
        cursor.execute("""
            SELECT 
                cm.id,
                cm.room_id,
                cm.user_id,
                COALESCE(u.username, LOWER(SPLIT_PART(u.email, '@', 1))) as user_name,
                cm.message_text,
                cm.was_censored,
                cm.created_at
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.room_id = %s
            AND cm.created_at BETWEEN %s - INTERVAL '5 minutes' 
                                  AND %s + INTERVAL '5 minutes'
            ORDER BY cm.created_at ASC
        """, (
            flag_info['room_id'],
            flag_info['message_created_at'],
            flag_info['message_created_at']
        ))
        
        messages = cursor.fetchall()
        
        return {
            "flag_info": dict(flag_info),
            "context_messages": [dict(row) for row in messages],
            "flagged_message_id": flag_info['message_id']
        }
    finally:
        cursor.close()

# ============================================================================
# USER SEARCH & PROFILE
# ============================================================================

@router.get("/users/search", response_model=List[UserSearchResult])
async def search_users(
    query: str = Query(..., min_length=2),
    limit: int = Query(20, le=100),
    admin = Depends(verify_admin)
):
    """Search users by username, email, or ID"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM user_moderation_history
            WHERE 
                username ILIKE %s
                OR email ILIKE %s
                OR CAST(user_id AS TEXT) = %s
            ORDER BY last_action_date DESC NULLS LAST
            LIMIT %s
        """, (f"%{query}%", f"%{query}%", query, limit))
        
        users = cursor.fetchall()
        return [dict(row) for row in users]
    finally:
        cursor.close()

@router.get("/users/{user_id}", response_model=UserProfile)
async def get_user_profile(
    user_id: int,
    admin = Depends(verify_admin)
):
    """Get detailed user profile for moderation"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        # Get user basic info
        cursor.execute("""
            SELECT * FROM user_moderation_history WHERE user_id = %s
        """, (user_id,))
        user = cursor.fetchone()
        
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Get recent messages (last 50)
        cursor.execute("""
            SELECT 
                cm.id,
                cm.room_id,
                cm.user_id,
                COALESCE(u.username, LOWER(SPLIT_PART(u.email, '@', 1))) as user_name,
                cm.message_text,
                cm.was_censored,
                cm.created_at
            FROM chat_messages cm
            JOIN users u ON cm.user_id = u.id
            WHERE cm.user_id = %s
            ORDER BY cm.created_at DESC
            LIMIT 50
        """, (user_id,))
        recent_messages = cursor.fetchall()
        
        # Get moderation history
        cursor.execute("""
            SELECT 
                ml.id,
                ml.action_type,
                ml.action_reason,
                ml.created_at,
                ml.expires_at,
                ml.related_message_id,
                admin.username as moderator_username
            FROM moderation_log ml
            JOIN users admin ON ml.moderator_id = admin.id
            WHERE ml.user_id = %s
            ORDER BY ml.created_at DESC
            LIMIT 20
        """, (user_id,))
        mod_history = cursor.fetchall()
        
        # Check if currently suspended
        cursor.execute("SELECT is_user_suspended(%s)", (user_id,))
        is_suspended = cursor.fetchone()['is_user_suspended']
        
        # Get suspension expiry if exists
        suspension_expires = None
        if is_suspended:
            cursor.execute("""
                SELECT expires_at FROM moderation_log
                WHERE user_id = %s AND action_type = 'suspend'
                AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
                ORDER BY created_at DESC
                LIMIT 1
            """, (user_id,))
            result = cursor.fetchone()
            if result:
                suspension_expires = result['expires_at']
        
        return {
            **dict(user),
            "recent_messages": [dict(row) for row in recent_messages],
            "moderation_history": [dict(row) for row in mod_history],
            "is_suspended": is_suspended,
            "suspension_expires": suspension_expires
        }
    finally:
        cursor.close()

# ============================================================================
# MODERATION ACTIONS
# ============================================================================

@router.post("/users/{user_id}/warn")
async def warn_user(
    user_id: int,
    action: ModerationAction,
    admin = Depends(verify_admin)
):
    """Issue a warning to a user (increments warning count)"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        # Increment warning count
        cursor.execute("SELECT increment_warning_count(%s)", (user_id,))
        new_warning_count = cursor.fetchone()['increment_warning_count']
        
        # Log the action
        cursor.execute("""
            INSERT INTO moderation_log 
            (user_id, action_type, action_reason, moderator_id, metadata)
            VALUES (%s, 'warn', %s, %s, %s)
            RETURNING id
        """, (
            user_id,
            action.reason,
            admin['id'],
            f'{{"warning_count": {new_warning_count}}}'
        ))
        
        conn.commit()
        
        # Auto-suspend if 3 warnings
        if new_warning_count >= 3:
            return {
                "success": True,
                "warning_count": new_warning_count,
                "message": "User has reached 3 warnings. Consider suspension.",
                "auto_action_suggested": "suspend"
            }
        
        return {
            "success": True,
            "warning_count": new_warning_count,
            "message": f"Warning issued. User now has {new_warning_count} warning(s)."
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.post("/users/{user_id}/suspend")
async def suspend_user(
    user_id: int,
    action: ModerationAction,
    admin = Depends(verify_admin)
):
    """Suspend a user (temporary or permanent)"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        expires_at = None
        if action.duration_days:
            expires_at = datetime.now() + timedelta(days=action.duration_days)
        
        # Update user account status
        cursor.execute("""
            UPDATE users SET account_status = 'suspended' WHERE id = %s
        """, (user_id,))
        
        # Log the action
        cursor.execute("""
            INSERT INTO moderation_log 
            (user_id, action_type, action_reason, moderator_id, expires_at, metadata)
            VALUES (%s, 'suspend', %s, %s, %s, %s)
            RETURNING id
        """, (
            user_id,
            action.reason,
            admin['id'],
            expires_at,
            f'{{"duration_days": {action.duration_days}, "notes": "{action.admin_notes}"}}'
        ))
        
        conn.commit()
        
        duration_msg = f"{action.duration_days} days" if action.duration_days else "permanently"
        return {
            "success": True,
            "message": f"User suspended for {duration_msg}.",
            "expires_at": expires_at
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.post("/users/{user_id}/ban")
async def ban_user(
    user_id: int,
    action: ModerationAction,
    admin = Depends(verify_admin)
):
    """Permanently ban a user (account_status = 'banned')"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE users SET account_status = 'banned' WHERE id = %s
        """, (user_id,))
        
        cursor.execute("""
            INSERT INTO moderation_log 
            (user_id, action_type, action_reason, moderator_id, metadata)
            VALUES (%s, 'ban', %s, %s, %s)
        """, (
            user_id,
            action.reason,
            admin['id'],
            f'{{"notes": "{action.admin_notes}"}}'
        ))
        
        conn.commit()
        return {"success": True, "message": "User permanently banned."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.post("/messages/{message_id}/delete")
async def delete_message(
    message_id: int,
    action: ModerationAction,
    admin = Depends(verify_admin)
):
    """Delete a chat message"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        # Get message details first
        cursor.execute("""
            SELECT user_id, room_id, message_text FROM chat_messages WHERE id = %s
        """, (message_id,))
        message = cursor.fetchone()
        
        if not message:
            raise HTTPException(status_code=404, detail="Message not found")
        
        # Delete the message
        cursor.execute("DELETE FROM chat_messages WHERE id = %s", (message_id,))
        
        # Log the action
        cursor.execute("""
            INSERT INTO moderation_log 
            (user_id, action_type, action_reason, moderator_id, related_message_id, metadata)
            VALUES (%s, 'delete_message', %s, %s, %s, %s)
        """, (
            message['user_id'],
            action.reason,
            admin['id'],
            message_id,
            f'{{"message_text": "{message["message_text"][:100]}"}}'
        ))
        
        conn.commit()
        return {"success": True, "message": "Message deleted."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.post("/flags/{flag_id}/dismiss")
async def dismiss_flag(
    flag_id: int,
    action: ModerationAction,
    admin = Depends(verify_admin)
):
    """Dismiss a flag as false positive"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            UPDATE flagged_content
            SET status = 'dismissed',
                reviewed_by_admin_id = %s,
                reviewed_at = CURRENT_TIMESTAMP,
                admin_notes = %s
            WHERE id = %s
        """, (admin['id'], action.admin_notes, flag_id))
        
        conn.commit()
        return {"success": True, "message": "Flag dismissed."}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.post("/flags/{flag_id}/action")
async def action_flag(
    flag_id: int,
    action: ModerationAction,
    admin = Depends(verify_admin)
):
    """Mark a flag as actioned and take the specified action"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        # Get flag details
        cursor.execute("""
            SELECT fc.message_id, cm.user_id
            FROM flagged_content fc
            JOIN chat_messages cm ON fc.message_id = cm.id
            WHERE fc.id = %s
        """, (flag_id,))
        flag = cursor.fetchone()
        
        if not flag:
            raise HTTPException(status_code=404, detail="Flag not found")
        
        # Update flag status
        cursor.execute("""
            UPDATE flagged_content
            SET status = 'actioned',
                action_taken = %s,
                reviewed_by_admin_id = %s,
                reviewed_at = CURRENT_TIMESTAMP,
                admin_notes = %s
            WHERE id = %s
        """, (action.action_type, admin['id'], action.admin_notes, flag_id))
        
        conn.commit()
        return {
            "success": True,
            "message": f"Flag marked as actioned: {action.action_type}",
            "user_id": flag['user_id'],
            "message_id": flag['message_id']
        }
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

# ============================================================================
# AUTO-FLAGGING (called from chat router on message send)
# ============================================================================

@router.post("/auto-flag-check")
async def check_message_for_flags(message_id: int, message_text: str):
    """
    Internal endpoint - called by chat router to check new messages for auto-flags
    This should be called whenever a new message is created
    """
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        # Check for profanity
        cursor.execute("SELECT * FROM check_profanity(%s)", (message_text,))
        profanity_result = cursor.fetchone()
        
        if profanity_result:
            # Auto-flag the message
            cursor.execute("""
                INSERT INTO flagged_content 
                (message_id, flag_type, flag_reason, flag_details, status)
                VALUES (%s, %s, %s, %s, 'pending')
            """, (
                message_id,
                f"auto_{profanity_result['severity']}",
                f"Profanity detected: {profanity_result['found_word']}",
                message_text[:500],
            ))
            
            should_delete = profanity_result['should_delete']
            
            conn.commit()
            
            return {
                "flagged": True,
                "should_delete": should_delete,
                "severity": profanity_result['severity'],
                "found_word": profanity_result['found_word']
            }
        
        # Check for spam (repeated messages)
        cursor.execute("""
            SELECT COUNT(*) as count
            FROM chat_messages
            WHERE user_id = (SELECT user_id FROM chat_messages WHERE id = %s)
            AND message_text = %s
            AND created_at > CURRENT_TIMESTAMP - INTERVAL '5 minutes'
        """, (message_id, message_text))
        
        spam_count = cursor.fetchone()['count']
        
        if spam_count > 3:
            cursor.execute("""
                INSERT INTO flagged_content 
                (message_id, flag_type, flag_reason, status)
                VALUES (%s, 'auto_spam', 'Repeated message detected', 'pending')
            """, (message_id,))
            conn.commit()
            
            return {
                "flagged": True,
                "should_delete": False,
                "severity": "medium",
                "found_word": None
            }
        
        return {"flagged": False}
        
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

# ============================================================================
# PROFANITY FILTER MANAGEMENT
# ============================================================================

@router.get("/profanity-filters")
async def get_profanity_filters(admin = Depends(verify_admin)):
    """Get all profanity filters"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            SELECT * FROM profanity_filters ORDER BY severity DESC, word_or_phrase ASC
        """)
        return cursor.fetchall()
    finally:
        cursor.close()

@router.post("/profanity-filters")
async def add_profanity_filter(
    word: str,
    severity: str,
    auto_delete: bool = False,
    admin = Depends(verify_admin)
):
    """Add a new profanity filter"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        cursor.execute("""
            INSERT INTO profanity_filters 
            (word_or_phrase, severity, auto_delete, added_by_admin_id)
            VALUES (%s, %s, %s, %s)
            RETURNING id
        """, (word.lower(), severity, auto_delete, admin['id']))
        
        conn.commit()
        return {"success": True, "message": f"Added '{word}' to profanity filters"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()

@router.delete("/profanity-filters/{filter_id}")
async def delete_profanity_filter(
    filter_id: int,
    admin = Depends(verify_admin)
):
    """Remove a profanity filter"""
    conn = next(get_db())
    cursor = conn.cursor()
    
    try:
        cursor.execute("DELETE FROM profanity_filters WHERE id = %s", (filter_id,))
        conn.commit()
        return {"success": True, "message": "Filter removed"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cursor.close()
