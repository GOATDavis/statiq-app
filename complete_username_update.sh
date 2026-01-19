#!/bin/bash
# Complete script to update chat system to use @handles
# Run on server: bash complete_username_update.sh

set -e

echo "🚀 Starting chat username update..."

# Step 1: Add username column to database
echo ""
echo "📊 Step 1: Updating database schema..."
psql -U rhettserver -d statiq_db << 'EOF'
-- Add username column
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Generate usernames from emails
UPDATE users 
SET username = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', ''))
WHERE username IS NULL;

-- Handle duplicates by appending user_id
UPDATE users u1
SET username = LOWER(REPLACE(SPLIT_PART(u1.email, '@', 1), '.', '')) || u1.id::text
WHERE EXISTS (
    SELECT 1 
    FROM users u2 
    WHERE u2.username = u1.username 
    AND u2.id < u1.id
);

-- Show results
SELECT id, email, username FROM users ORDER BY id LIMIT 10;
EOF

echo "✅ Database updated!"

# Step 2: Backup and update chat router
echo ""
echo "📝 Step 2: Updating chat router code..."
cd /home/rhettserver/statiq-backend/app/routers

# Backup
cp chat.py chat.py.backup_$(date +%Y%m%d_%H%M%S)

# Update get_messages query to use username
sed -i "s/u\.name as user_name/COALESCE(u.username, LOWER(SPLIT_PART(u.email, '@', 1))) as user_name/g" chat.py

# Update send_message to use username
sed -i "s/user_name = user_row\['name'\]/user_name = user_row.get('username') or user_row['email'].split('@')[0].lower()/g" chat.py

echo "✅ Chat router updated!"

# Step 3: Restart backend service
echo ""
echo "🔄 Step 3: Restarting backend service..."
sudo systemctl restart statiq-backend

# Wait a moment for service to start
sleep 2

# Check service status
echo ""
echo "📊 Service status:"
sudo systemctl status statiq-backend --no-pager | head -15

echo ""
echo "✅ Complete! Chat now uses @handles instead of full names."
echo "Test by sending a message in the app!"
