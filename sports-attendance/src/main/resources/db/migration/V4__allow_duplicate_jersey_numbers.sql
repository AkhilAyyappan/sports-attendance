-- Allow jersey numbers to be reused across players in the same sport
ALTER TABLE players DROP CONSTRAINT IF EXISTS uk_player_jersey_sport;
