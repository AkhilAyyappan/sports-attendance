-- V4__add_multiple_captains_to_sport.sql
-- Allow up to 3 captains per sport via a join table

CREATE TABLE IF NOT EXISTS sport_captains (
    sport_id   BIGINT NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    captain_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    PRIMARY KEY (sport_id, captain_id)
);

-- Migrate existing single-captain assignments into the join table
INSERT INTO sport_captains (sport_id, captain_id)
SELECT id, captain_id
FROM sports
WHERE captain_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Drop the old single-captain column
ALTER TABLE sports DROP COLUMN IF EXISTS captain_id;
