-- V6: Multi-sport player model refinements — college context
-- Athletes belong to a university department (e.g. CSE, ECE, ME) for the unified profile view.

ALTER TABLE players ADD COLUMN IF NOT EXISTS department VARCHAR(100);