-- V1__create_schema.sql
-- Full schema for Sports Camp Attendance System

-- Sequences

CREATE SEQUENCE IF NOT EXISTS user_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS camp_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS sport_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS team_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS player_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS session_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS attendance_id_seq START 1 INCREMENT 1;
CREATE SEQUENCE IF NOT EXISTS eval_id_seq START 1 INCREMENT 1;

-- Users

CREATE TABLE IF NOT EXISTS users (
    id            BIGINT       PRIMARY KEY DEFAULT nextval('user_id_seq'),
    username      VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name     VARCHAR(100) NOT NULL,
    phone         VARCHAR(20),
    email         VARCHAR(100),
    role          VARCHAR(20)  NOT NULL,
    enabled       BOOLEAN      NOT NULL DEFAULT TRUE,
    team_id       BIGINT,
    created_at    TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Sports

CREATE TABLE IF NOT EXISTS sports (
    id          BIGINT       PRIMARY KEY DEFAULT nextval('sport_id_seq'),
    name        VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_sport_name UNIQUE (name)
);

-- Camps

CREATE TABLE IF NOT EXISTS camps (
    id          BIGINT       PRIMARY KEY DEFAULT nextval('camp_id_seq'),
    name        VARCHAR(150) NOT NULL,
    description VARCHAR(500),
    start_date  DATE,
    end_date    DATE,
    location    VARCHAR(200),
    status      VARCHAR(20)  NOT NULL DEFAULT 'UPCOMING',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Teams

CREATE TABLE IF NOT EXISTS teams (
    id          BIGINT       PRIMARY KEY DEFAULT nextval('team_id_seq'),
    name        VARCHAR(100) NOT NULL,
    camp_id     BIGINT       NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
    sport_id    BIGINT       NOT NULL REFERENCES sports(id),
    captain_id  BIGINT       REFERENCES users(id) ON DELETE SET NULL,
    active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_team_name_camp UNIQUE (name, camp_id)
);

-- Add FK from users → teams (created after teams table)
ALTER TABLE users
    ADD CONSTRAINT fk_user_team
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- Players

CREATE TABLE IF NOT EXISTS players (
    id             BIGINT       PRIMARY KEY DEFAULT nextval('player_id_seq'),
    full_name      VARCHAR(150) NOT NULL,
    date_of_birth  DATE,
    jersey_number  INT,
    position       VARCHAR(200),
    phone          VARCHAR(20),
    email          VARCHAR(100),
    notes          VARCHAR(500),
    active         BOOLEAN      NOT NULL DEFAULT TRUE,
    team_id        BIGINT       NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    created_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_player_jersey_team UNIQUE (jersey_number, team_id)
);

-- Training sessions

CREATE TABLE IF NOT EXISTS training_sessions (
    id           BIGINT       PRIMARY KEY DEFAULT nextval('session_id_seq'),
    title        VARCHAR(200) NOT NULL,
    session_date DATE         NOT NULL,
    start_time   TIME,
    end_time     TIME,
    notes        VARCHAR(500),
    status       VARCHAR(20)  NOT NULL DEFAULT 'SCHEDULED',
    camp_id      BIGINT       NOT NULL REFERENCES camps(id) ON DELETE CASCADE,
    team_id      BIGINT       REFERENCES teams(id) ON DELETE CASCADE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Attendance

CREATE TABLE IF NOT EXISTS attendances (
    id          BIGINT      PRIMARY KEY DEFAULT nextval('attendance_id_seq'),
    player_id   BIGINT      NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    session_id  BIGINT      NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    status      VARCHAR(20) NOT NULL DEFAULT 'ABSENT',
    marked_by   BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    marked_at   TIMESTAMP,
    remarks     VARCHAR(500),
    created_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_attendance_player_session UNIQUE (player_id, session_id)
);

-- Player evaluations

CREATE TABLE IF NOT EXISTS player_evaluations (
    id               BIGINT      PRIMARY KEY DEFAULT nextval('eval_id_seq'),
    player_id        BIGINT      NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    session_id       BIGINT      NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    technical_score  INT         CHECK (technical_score BETWEEN 1 AND 10),
    physical_score   INT         CHECK (physical_score  BETWEEN 1 AND 10),
    attitude_score   INT         CHECK (attitude_score  BETWEEN 1 AND 10),
    comments         VARCHAR(1000),
    evaluation_date  DATE,
    evaluated_by     BIGINT      REFERENCES users(id) ON DELETE SET NULL,
    created_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP   NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_eval_player_session UNIQUE (player_id, session_id)
);
