-- Flyway Migration V5: Multi-sport players and single-sport captain constraint

-- 1. Create player_sports join table (M:N relationship)
CREATE TABLE IF NOT EXISTS player_sports (
    player_id  BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    sport_id   BIGINT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (player_id, sport_id)
);

-- 2. Migrate existing single-sport player associations into player_sports
INSERT INTO player_sports (player_id, sport_id)
SELECT id, sport_id FROM players WHERE sport_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Drop jersey number unique index per sport (since players can play multiple sports now)
ALTER TABLE players DROP CONSTRAINT IF EXISTS uk_player_jersey_sport;

-- 4. Drop the single sport_id column on players table
ALTER TABLE players DROP COLUMN IF EXISTS sport_id;

-- 5. Refactor sport_captains table to link directly to players instead of users
-- First, recreate or adjust the table structure
CREATE TABLE IF NOT EXISTS sport_captains_new (
    sport_id    BIGINT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    player_id   BIGINT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (sport_id, player_id),
    CONSTRAINT uk_captain_single_sport UNIQUE (player_id) -- Enforces 1 player = max 1 sport captain
);

-- Migrate any existing captains if possible by matching email/username, otherwise table starts clean
INSERT INTO sport_captains_new (sport_id, player_id)
SELECT sc.sport_id, p.id
FROM sport_captains sc
JOIN users u ON sc.captain_id = u.id
JOIN players p ON LOWER(p.email) = LOWER(u.email)
ON CONFLICT DO NOTHING;

-- Drop old table and rename new table
DROP TABLE IF EXISTS sport_captains CASCADE;
ALTER TABLE sport_captains_new RENAME TO sport_captains;