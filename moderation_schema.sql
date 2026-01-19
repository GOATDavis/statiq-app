-- ============================================================================
-- STATIQ MODERATION SYSTEM - DATABASE SCHEMA
-- Phase 1 & 2: Admin Moderation Tools with Auto-flagging
-- ============================================================================

-- Add role column to users table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'fan';
    END IF;
END $$;

-- Add account_status column to users table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'account_status'
    ) THEN
        ALTER TABLE users ADD COLUMN account_status VARCHAR(20) DEFAULT 'active';
    END IF;
END $$;

-- Update your admin account (replace with your actual email)
UPDATE users SET role = 'admin' WHERE email = 'getstatiq@gmail.com';

-- ============================================================================
-- FLAGGED CONTENT TABLE
-- Tracks user reports and auto-flagged content
-- ============================================================================
CREATE TABLE IF NOT EXISTS flagged_content (
    id SERIAL PRIMARY KEY,
    message_id INTEGER NOT NULL REFERENCES chat_messages(id) ON DELETE CASCADE,
    flagged_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    flag_type VARCHAR(50) NOT NULL, -- 'user_report', 'auto_profanity', 'auto_spam', 'auto_threat', etc.
    flag_reason TEXT,
    flag_details TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed', 'actioned'
    reviewed_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP,
    action_taken VARCHAR(50), -- 'none', 'warning', 'deleted', 'suspended', 'banned'
    admin_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_flagged_content_status ON flagged_content(status);
CREATE INDEX idx_flagged_content_message ON flagged_content(message_id);
CREATE INDEX idx_flagged_content_created ON flagged_content(created_at DESC);

-- ============================================================================
-- MODERATION LOG TABLE
-- Tracks all moderation actions for audit trail
-- ============================================================================
CREATE TABLE IF NOT EXISTS moderation_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL, -- 'warn', 'suspend', 'ban', 'delete_message', 'dismiss_flag', 'unsuspend'
    action_reason TEXT,
    moderator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    related_message_id INTEGER REFERENCES chat_messages(id) ON DELETE SET NULL,
    related_flag_id INTEGER REFERENCES flagged_content(id) ON DELETE SET NULL,
    expires_at TIMESTAMP, -- For temporary suspensions
    metadata JSONB, -- Flexible field for additional context
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_moderation_log_user ON moderation_log(user_id);
CREATE INDEX idx_moderation_log_created ON moderation_log(created_at DESC);
CREATE INDEX idx_moderation_log_expires ON moderation_log(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================================================
-- USER WARNINGS TABLE
-- Track warning count for 3-strike system
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_warnings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    warning_count INTEGER DEFAULT 0,
    last_warning_at TIMESTAMP,
    notes TEXT
);

CREATE UNIQUE INDEX idx_user_warnings_user ON user_warnings(user_id);

-- Initialize warnings for existing users
INSERT INTO user_warnings (user_id, warning_count)
SELECT id, 0 FROM users
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- PROFANITY FILTER TABLE
-- Customizable list of words/phrases to auto-flag
-- ============================================================================
CREATE TABLE IF NOT EXISTS profanity_filters (
    id SERIAL PRIMARY KEY,
    word_or_phrase TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    auto_delete BOOLEAN DEFAULT FALSE, -- Auto-delete messages with this word?
    is_active BOOLEAN DEFAULT TRUE,
    added_by_admin_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_profanity_filters_active ON profanity_filters(is_active);

-- ============================================================================
-- STARTER PROFANITY LIST (customize as needed)
-- ============================================================================
INSERT INTO profanity_filters (word_or_phrase, severity, auto_delete) VALUES
-- Critical - auto-delete
('fuck', 'critical', TRUE),
('shit', 'high', TRUE),
('bitch', 'high', TRUE),
('ass', 'medium', FALSE),
('damn', 'low', FALSE),
('crap', 'low', FALSE),
('hell', 'low', FALSE),
-- Threats
('kill', 'critical', TRUE),
('murder', 'critical', TRUE),
('shoot', 'high', TRUE),
('attack', 'high', FALSE),
-- Add more as needed
('nigger', 'critical', TRUE),
('nigga', 'high', TRUE),
('faggot', 'critical', TRUE),
('retard', 'high', TRUE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to check if user is currently suspended
CREATE OR REPLACE FUNCTION is_user_suspended(user_id_param INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    active_suspension BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM moderation_log
        WHERE user_id = user_id_param
        AND action_type = 'suspend'
        AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
        ORDER BY created_at DESC
        LIMIT 1
    ) INTO active_suspension;
    
    RETURN active_suspension;
END;
$$ LANGUAGE plpgsql;

-- Function to increment warning count
CREATE OR REPLACE FUNCTION increment_warning_count(user_id_param INTEGER)
RETURNS INTEGER AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE user_warnings
    SET warning_count = warning_count + 1,
        last_warning_at = CURRENT_TIMESTAMP
    WHERE user_id = user_id_param
    RETURNING warning_count INTO new_count;
    
    -- If no record exists, create one
    IF new_count IS NULL THEN
        INSERT INTO user_warnings (user_id, warning_count, last_warning_at)
        VALUES (user_id_param, 1, CURRENT_TIMESTAMP)
        RETURNING warning_count INTO new_count;
    END IF;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- Function to check if message contains profanity
CREATE OR REPLACE FUNCTION check_profanity(message_text_param TEXT)
RETURNS TABLE(
    found_word TEXT,
    severity VARCHAR(20),
    should_delete BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pf.word_or_phrase,
        pf.severity,
        pf.auto_delete
    FROM profanity_filters pf
    WHERE pf.is_active = TRUE
    AND LOWER(message_text_param) LIKE '%' || LOWER(pf.word_or_phrase) || '%'
    ORDER BY 
        CASE pf.severity
            WHEN 'critical' THEN 1
            WHEN 'high' THEN 2
            WHEN 'medium' THEN 3
            WHEN 'low' THEN 4
        END
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- Active suspensions
CREATE OR REPLACE VIEW active_suspensions AS
SELECT 
    ml.user_id,
    u.email,
    u.username,
    ml.action_reason,
    ml.expires_at,
    ml.created_at as suspended_at,
    ml.moderator_id
FROM moderation_log ml
JOIN users u ON ml.user_id = u.id
WHERE ml.action_type = 'suspend'
AND (ml.expires_at IS NULL OR ml.expires_at > CURRENT_TIMESTAMP)
AND NOT EXISTS (
    SELECT 1 FROM moderation_log ml2
    WHERE ml2.user_id = ml.user_id
    AND ml2.action_type = 'unsuspend'
    AND ml2.created_at > ml.created_at
);

-- Pending flags summary
CREATE OR REPLACE VIEW pending_flags_summary AS
SELECT 
    fc.id,
    fc.message_id,
    cm.message_text,
    cm.room_id,
    cm.user_id as message_author_id,
    u.username as message_author_username,
    fc.flag_type,
    fc.flag_reason,
    fc.flagged_by_user_id,
    fc.created_at,
    COALESCE(flagger.username, 'System') as flagged_by_username
FROM flagged_content fc
JOIN chat_messages cm ON fc.message_id = cm.id
JOIN users u ON cm.user_id = u.id
LEFT JOIN users flagger ON fc.flagged_by_user_id = flagger.id
WHERE fc.status = 'pending'
ORDER BY fc.created_at DESC;

-- User moderation history
CREATE OR REPLACE VIEW user_moderation_history AS
SELECT 
    u.id as user_id,
    u.username,
    u.email,
    u.role,
    u.account_status,
    uw.warning_count,
    uw.last_warning_at,
    (SELECT COUNT(*) FROM flagged_content fc 
     JOIN chat_messages cm ON fc.message_id = cm.id 
     WHERE cm.user_id = u.id) as total_flags,
    (SELECT COUNT(*) FROM moderation_log ml WHERE ml.user_id = u.id) as total_mod_actions,
    (SELECT created_at FROM moderation_log ml 
     WHERE ml.user_id = u.id 
     ORDER BY created_at DESC LIMIT 1) as last_action_date
FROM users u
LEFT JOIN user_warnings uw ON u.id = uw.user_id;

COMMENT ON TABLE flagged_content IS 'Stores all flagged messages from user reports and auto-detection';
COMMENT ON TABLE moderation_log IS 'Audit trail of all moderation actions taken by admins';
COMMENT ON TABLE user_warnings IS 'Tracks warning counts for 3-strike system';
COMMENT ON TABLE profanity_filters IS 'Customizable list of words/phrases to auto-flag or censor';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON flagged_content TO your_app_user;
-- GRANT SELECT, INSERT ON moderation_log TO your_app_user;
-- GRANT SELECT, UPDATE ON user_warnings TO your_app_user;
-- GRANT SELECT ON profanity_filters TO your_app_user;
