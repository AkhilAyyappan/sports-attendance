-- V3__simplify_schema_to_sports_only.sql
-- Transform hierarchy from Camp -> Team -> Sport to direct Sport-centric model

-- 1. Add captain_id to sports
ALTER TABLE sports ADD COLUMN IF NOT EXISTS captain_id BIGINT REFERENCES users(id) ON DELETE SET NULL;

-- 2. Add sport_id to players and training_sessions
ALTER TABLE players ADD COLUMN IF NOT EXISTS sport_id BIGINT REFERENCES sports(id) ON DELETE CASCADE;
ALTER TABLE training_sessions ADD COLUMN IF NOT EXISTS sport_id BIGINT REFERENCES sports(id) ON DELETE CASCADE;

-- 3. Migrate existing data from teams
UPDATE players p
SET sport_id = t.sport_id
FROM teams t
WHERE p.team_id = t.id AND p.sport_id IS NULL;

-- Default any unmigrated player to first sport
UPDATE players
SET sport_id = (SELECT id FROM sports LIMIT 1)
WHERE sport_id IS NULL;

UPDATE training_sessions s
SET sport_id = t.sport_id
FROM teams t
WHERE s.team_id = t.id AND s.sport_id IS NULL;

-- Default any unmigrated session to first sport
UPDATE training_sessions
SET sport_id = (SELECT id FROM sports LIMIT 1)
WHERE sport_id IS NULL;

UPDATE sports sp
SET captain_id = t.captain_id
FROM teams t
WHERE t.sport_id = sp.id AND t.captain_id IS NOT NULL AND sp.captain_id IS NULL;

-- 4. Adjust constraints
ALTER TABLE players ALTER COLUMN sport_id SET NOT NULL;
ALTER TABLE training_sessions ALTER COLUMN sport_id SET NOT NULL;

-- Drop old constraints & foreign keys
ALTER TABLE players DROP CONSTRAINT IF EXISTS uk_player_jersey_team;
ALTER TABLE players DROP CONSTRAINT IF EXISTS players_team_id_fkey;
ALTER TABLE players DROP COLUMN IF EXISTS team_id;
ALTER TABLE players ADD CONSTRAINT uk_player_jersey_sport UNIQUE (jersey_number, sport_id);

ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_camp_id_fkey;
ALTER TABLE training_sessions DROP CONSTRAINT IF EXISTS training_sessions_team_id_fkey;
ALTER TABLE training_sessions DROP COLUMN IF EXISTS camp_id;
ALTER TABLE training_sessions DROP COLUMN IF EXISTS team_id;

ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_user_team;
ALTER TABLE users DROP COLUMN IF EXISTS team_id;

-- Drop unused tables
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS camps CASCADE;
DROP SEQUENCE IF EXISTS camp_id_seq;
DROP SEQUENCE IF EXISTS team_id_seq;
