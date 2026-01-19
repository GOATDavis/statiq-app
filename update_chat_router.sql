-- Update chat router query to use username instead of name
-- Replace the queries in /home/rhettserver/statiq-backend/app/routers/chat.py

-- OLD QUERY (line ~200 in get_messages):
-- SELECT cm.id, cm.room_id, cm.user_id, u.name as user_name, ...

-- NEW QUERY:
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
ORDER BY cm.created_at ASC;

-- This ensures usernames are used, falling back to email prefix if username is null
