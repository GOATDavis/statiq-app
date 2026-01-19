-- Create a coach account for testing iPhone coach version
-- Run this on your PostgreSQL database

-- First, generate a bcrypt hash for password 'coach123'
-- The hash below is for password: coach123
-- You can generate a new one using Python: 
-- from passlib.context import CryptContext
-- pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
-- print(pwd_context.hash("coach123"))

INSERT INTO users (email, username, first_name, last_name, password_hash, role, created_at)
VALUES (
    'coach@statiq.app',
    'coachtest',
    'Test',
    'Coach',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qlCRHOG.AUWH0W',  -- password: coach123
    'coach',
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'coach',
    password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qlCRHOG.AUWH0W';

-- Also create a second coach account
INSERT INTO users (email, username, first_name, last_name, password_hash, role, created_at)
VALUES (
    'rhett@statiq.app',
    'rhettcoach',
    'Rhett',
    'Davis',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qlCRHOG.AUWH0W',  -- password: coach123
    'coach',
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'coach',
    password_hash = '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qlCRHOG.AUWH0W';

-- Verify the accounts
SELECT id, email, username, first_name, last_name, role FROM users WHERE role = 'coach';
