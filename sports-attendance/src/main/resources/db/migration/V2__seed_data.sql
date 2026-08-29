-- V2__seed_data.sql
-- Seed: one admin user + sample data

-- Admin user: username=admin, password=admin123
INSERT INTO users (username, password_hash, full_name, email, role, enabled)
VALUES (
    'admin',
    '$2a$10$KtMPNPrOj0NQZTgh3xUbDevqmUjk/H68M1n7RSxhy.CirOMzy.vtW',
    'System Administrator',
    'admin@sportscamp.com',
    'ROLE_ADMIN',
    TRUE
);

-- Sports
INSERT INTO sports (name, description) VALUES
    ('Football',   'Association football / soccer'),
    ('Cricket',    'Cricket training camp'),
    ('Basketball', 'Basketball training camp'),
    ('Athletics',  'Track and field athletics');

-- Sample camp
INSERT INTO camps (name, description, start_date, end_date, location, status) VALUES
    ('Summer Elite Camp 2025', 'Annual summer elite training camp',
     '2025-06-01', '2025-06-30', 'National Sports Complex', 'UPCOMING');
