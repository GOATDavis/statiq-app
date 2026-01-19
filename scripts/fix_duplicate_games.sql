-- ============================================================================
-- StatIQ: Fix Duplicate Games
-- Run this on your PostgreSQL database
-- ============================================================================

-- Step 1: Find all duplicate games (same teams, same scores)
-- This helps you see what will be affected before making changes
SELECT 
    g1.id as keep_id,
    g2.id as duplicate_id,
    t1.name as team1,
    t2.name as team2,
    g1.home_score,
    g1.away_score,
    g1.kickoff_at as keep_date,
    g2.kickoff_at as duplicate_date
FROM games g1
JOIN games g2 ON (
    -- Same matchup (either direction)
    ((g1.home_team_id = g2.home_team_id AND g1.away_team_id = g2.away_team_id)
    OR (g1.home_team_id = g2.away_team_id AND g1.away_team_id = g2.home_team_id))
    -- Same scores (accounting for home/away swap)
    AND ((g1.home_score = g2.home_score AND g1.away_score = g2.away_score)
        OR (g1.home_score = g2.away_score AND g1.away_score = g2.home_score))
    -- Different game IDs
    AND g1.id < g2.id
)
JOIN teams t1 ON g1.home_team_id = t1.id
JOIN teams t2 ON g1.away_team_id = t2.id
ORDER BY g1.kickoff_at;

-- ============================================================================
-- Step 2: Delete duplicates (keeps the EARLIEST entry by ID)
-- UNCOMMENT THE LINES BELOW AFTER REVIEWING STEP 1 OUTPUT
-- ============================================================================

-- BEGIN;

-- DELETE FROM games
-- WHERE id IN (
--     SELECT g2.id
--     FROM games g1
--     JOIN games g2 ON (
--         ((g1.home_team_id = g2.home_team_id AND g1.away_team_id = g2.away_team_id)
--         OR (g1.home_team_id = g2.away_team_id AND g1.away_team_id = g2.home_team_id))
--         AND ((g1.home_score = g2.home_score AND g1.away_score = g2.away_score)
--             OR (g1.home_score = g2.away_score AND g1.away_score = g2.home_score))
--         AND g1.id < g2.id
--     )
-- );

-- COMMIT;

-- ============================================================================
-- Step 3: Add constraint to prevent future duplicates
-- This prevents games with the same teams on the same date
-- ============================================================================

-- Create a function to normalize team order (smaller ID first)
CREATE OR REPLACE FUNCTION normalize_game_teams(team1_id INTEGER, team2_id INTEGER)
RETURNS TEXT AS $$
BEGIN
    IF team1_id < team2_id THEN
        RETURN team1_id::TEXT || '-' || team2_id::TEXT;
    ELSE
        RETURN team2_id::TEXT || '-' || team1_id::TEXT;
    END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add unique constraint on normalized teams + date
-- (prevents same two teams playing twice on the same date)
-- ALTER TABLE games ADD CONSTRAINT unique_game_matchup 
--     UNIQUE (normalize_game_teams(home_team_id, away_team_id), DATE(kickoff_at));

-- Alternative: simpler approach using a generated column (PostgreSQL 12+)
-- ALTER TABLE games ADD COLUMN game_matchup_key TEXT 
--     GENERATED ALWAYS AS (
--         CASE WHEN home_team_id < away_team_id 
--             THEN home_team_id::TEXT || '-' || away_team_id::TEXT || '-' || DATE(kickoff_at)::TEXT
--             ELSE away_team_id::TEXT || '-' || home_team_id::TEXT || '-' || DATE(kickoff_at)::TEXT
--         END
--     ) STORED;
-- 
-- ALTER TABLE games ADD CONSTRAINT unique_game_matchup_key UNIQUE (game_matchup_key);

-- ============================================================================
-- Step 4: Verify Azle's games are clean
-- ============================================================================

SELECT 
    g.id,
    ht.name as home_team,
    at.name as away_team,
    g.home_score,
    g.away_score,
    g.kickoff_at,
    g.status
FROM games g
JOIN teams ht ON g.home_team_id = ht.id
JOIN teams at ON g.away_team_id = at.id
WHERE ht.name = 'Azle' OR at.name = 'Azle'
ORDER BY g.kickoff_at;
