-- Add username column for @handle support in chat
-- Run this on the server: psql -U rhettserver -d statiq_db -f add_username_to_users.sql

-- Add username column
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

-- Create index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Generate initial usernames from email (before @ symbol)
UPDATE users 
SET username = LOWER(REPLACE(SPLIT_PART(email, '@', 1), '.', ''))
WHERE username IS NULL;

-- For duplicate usernames, append user_id
UPDATE users u1
SET username = LOWER(REPLACE(SPLIT_PART(u1.email, '@', 1), '.', '')) || u1.id::text
WHERE EXISTS (
    SELECT 1 
    FROM users u2 
    WHERE u2.username = u1.username 
    AND u2.id < u1.id
);

-- Verify the changes
SELECT id, email, username FROM users ORDER BY id LIMIT 10;
