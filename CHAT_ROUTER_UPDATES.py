"""
Update /home/rhettserver/statiq-backend/app/routers/chat.py

Find the get_messages endpoint (around line 180-220) and update the SQL query:
"""

# OLD CODE:
"""
cursor.execute('''
    SELECT cm.id, cm.room_id, cm.user_id, u.name as user_name,
           cm.message_text, cm.was_censored, cm.created_at
    FROM chat_messages cm
    JOIN users u ON cm.user_id = u.id
    WHERE cm.room_id = %s
    ORDER BY cm.created_at ASC
''', (room_id,))
"""

# NEW CODE:
"""
cursor.execute('''
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
    ORDER BY cm.created_at ASC
''', (room_id,))
"""

# Also update the send_message endpoint (around line 240-280):
# Change this line:
# user_name = user_row['name']
# To:
# user_name = user_row.get('username') or user_row['email'].split('@')[0].lower()
