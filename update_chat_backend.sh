#!/bin/bash
# Script to update chat router to use usernames instead of full names
# Run on server: bash update_chat_backend.sh

echo "Updating chat router to use @handles..."

# Backup the original file
cp /home/rhettserver/statiq-backend/app/routers/chat.py /home/rhettserver/statiq-backend/app/routers/chat.py.backup

# Update the get_messages query
sed -i "s/u\.name as user_name,/COALESCE(u.username, LOWER(SPLIT_PART(u.email, '@', 1))) as user_name,/g" \
    /home/rhettserver/statiq-backend/app/routers/chat.py

# Update the send_message user_name assignment
sed -i "s/user_name = user_row\['name'\]/user_name = user_row.get('username') or user_row['email'].split('@')[0].lower()/g" \
    /home/rhettserver/statiq-backend/app/routers/chat.py

echo "✅ Chat router updated!"
echo "Now run the database migration and restart the service:"
echo ""
echo "psql -U rhettserver -d statiq_db << 'EOF'"
echo "ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;"
echo "CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);"
echo "UPDATE users SET username = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', '')) WHERE username IS NULL;"
echo "EOF"
echo ""
echo "sudo systemctl restart statiq-backend"
