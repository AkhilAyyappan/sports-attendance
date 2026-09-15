-- Flyway Migration V9: Per-sport control over auto-created default sessions
-- Once a day's schedule is emptied by deleting its last session, auto-creation of
-- the Morning/Evening defaults is switched off for that sport, so deleted sessions
-- do not come back on the next date query.
ALTER TABLE sports ADD COLUMN IF NOT EXISTS default_sessions_enabled BOOLEAN NOT NULL DEFAULT TRUE;