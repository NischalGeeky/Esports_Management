-- Drop existing tables and sequences if they exist, to ensure a clean setup
-- This is useful for re-running the script multiple times during testing.
BEGIN
   FOR c IN (SELECT table_name FROM user_tables) LOOP
      EXECUTE IMMEDIATE 'DROP TABLE ' || c.table_name || ' CASCADE CONSTRAINTS';
   END LOOP;
   FOR s IN (SELECT sequence_name FROM user_sequences) LOOP
      EXECUTE IMMEDIATE 'DROP SEQUENCE ' || s.sequence_name;
   END LOOP;
END;
/

-- ====================================================================
-- CREATE SEQUENCES
-- These will act as auto-incrementing IDs for the primary keys.
-- ====================================================================
CREATE SEQUENCE player_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE team_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE game_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE tournament_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE match_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE stats_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE timeline_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE official_seq START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE sponsor_seq START WITH 1 INCREMENT BY 1;

-- ====================================================================
-- CREATE TABLES (Based on your ER Diagram)
-- ====================================================================

-- Player Table
CREATE TABLE Player (
    player_id NUMBER PRIMARY KEY,
    player_name VARCHAR2(100) NOT NULL,
    username VARCHAR2(100) NOT NULL,
    country VARCHAR2(100) NOT NULL
);

-- Team Table
CREATE TABLE Team (
    team_id NUMBER PRIMARY KEY,
    team_name VARCHAR2(100) NOT NULL
);

-- Game Table
CREATE TABLE Game (
    game_id NUMBER PRIMARY KEY,
    game_name VARCHAR2(100) NOT NULL,
    genre VARCHAR2(50) NOT NULL,
    publisher VARCHAR2(100) NOT NULL
);

-- Tournament Table
CREATE TABLE Tournament (
    tournament_id NUMBER PRIMARY KEY,
    tournament_name VARCHAR2(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    prize_pool NUMBER(15,2) NOT NULL
);

-- Match Table
CREATE TABLE Match (
    match_id NUMBER PRIMARY KEY,
    result VARCHAR2(50),
    scheduled_time TIMESTAMP NOT NULL,
    team1_id NUMBER REFERENCES Team(team_id),
    team2_id NUMBER REFERENCES Team(team_id),
    game_id NUMBER REFERENCES Game(game_id),
    tournament_id NUMBER REFERENCES Tournament(tournament_id)
);

-- Player_Stats Table
CREATE TABLE Player_Stats (
    stats_id NUMBER PRIMARY KEY,
    points_scored NUMBER NOT NULL,
    player_ranking NUMBER,
    player_id NUMBER REFERENCES Player(player_id),
    match_id NUMBER REFERENCES Match(match_id)
);

-- Junction Table: Player_Team (Many-to-Many relationship)
CREATE TABLE Player_Team (
    player_id NUMBER,
    team_id NUMBER,
    PRIMARY KEY (player_id, team_id),
    FOREIGN KEY (player_id) REFERENCES Player(player_id),
    FOREIGN KEY (team_id) REFERENCES Team(team_id)
);

-- Junction Table: Team_Tournament (Many-to-Many relationship)
CREATE TABLE Team_Tournament (
    team_id NUMBER,
    tournament_id NUMBER,
    PRIMARY KEY (team_id, tournament_id),
    FOREIGN KEY (team_id) REFERENCES Team(team_id),
    FOREIGN KEY (tournament_id) REFERENCES Tournament(tournament_id)
);

-- ====================================================================
-- INSERT INITIAL DATA
-- This data is needed for the dropdowns on your website to work.
-- ====================================================================

-- Insert some sample games
INSERT INTO Game (game_id, game_name, genre, publisher) VALUES (game_seq.NEXTVAL, 'Valorant', 'Tactical Shooter', 'Riot Games');
INSERT INTO Game (game_id, game_name, genre, publisher) VALUES (game_seq.NEXTVAL, 'Dota 2', 'MOBA', 'Valve');
INSERT INTO Game (game_id, game_name, genre, publisher) VALUES (game_seq.NEXTVAL, 'Apex Legends', 'Battle Royale', 'Electronic Arts');
INSERT INTO Game (game_id, game_name, genre, publisher) VALUES (game_seq.NEXTVAL, 'League of Legends', 'MOBA', 'Riot Games');
INSERT INTO Game (game_id, game_name, genre, publisher) VALUES (game_seq.NEXTVAL, 'Counter-Strike: GO', 'Tactical Shooter', 'Valve');
INSERT INTO Game (game_id, game_name, genre, publisher) VALUES (game_seq.NEXTVAL, 'Rocket League', 'Sports', 'Psyonix');

-- Insert some sample tournaments for the registration page dropdown
INSERT INTO Tournament (tournament_id, tournament_name, start_date, end_date, prize_pool) VALUES (tournament_seq.NEXTVAL, 'God Mode: Valorant Nexus', TO_DATE('2025-11-01', 'YYYY-MM-DD'), TO_DATE('2025-11-05', 'YYYY-MM-DD'), 50000);
INSERT INTO Tournament (tournament_id, tournament_name, start_date, end_date, prize_pool) VALUES (tournament_seq.NEXTVAL, 'God Mode: Dota Eclipse', TO_DATE('2025-11-15', 'YYYY-MM-DD'), TO_DATE('2025-11-20', 'YYYY-MM-DD'), 100000);
INSERT INTO Tournament (tournament_id, tournament_name, start_date, end_date, prize_pool) VALUES (tournament_seq.NEXTVAL, 'Apex Predator Series', TO_DATE('2025-12-01', 'YYYY-MM-DD'), TO_DATE('2025-12-07', 'YYYY-MM-DD'), 80000);

COMMIT;

