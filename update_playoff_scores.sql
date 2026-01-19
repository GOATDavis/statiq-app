-- SQL Script to update 5A-D1 Bi-District playoff scores
-- Run with: psql -U statiq -d statiq_db -f update_playoff_scores.sql

-- Region 1 Games
UPDATE games SET home_score = 77, away_score = 76, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'El Dorado') AND away_team_id = (SELECT id FROM teams WHERE name = 'Amarillo');

UPDATE games SET home_score = 77, away_score = 43, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Richland') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%Wyatt%');

UPDATE games SET home_score = 84, away_score = 25, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Abilene') AND away_team_id = (SELECT id FROM teams WHERE name = 'Bel Air');

UPDATE games SET home_score = 59, away_score = 7, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Ryan%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Chisholm Trail');

UPDATE games SET home_score = 80, away_score = 12, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Aledo') AND away_team_id = (SELECT id FROM teams WHERE name = 'Saginaw');

UPDATE games SET home_score = 84, away_score = 13, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Tascosa') AND away_team_id = (SELECT id FROM teams WHERE name = 'Parkland');

UPDATE games SET home_score = 36, away_score = 23, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Arlington Heights%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Brewer');

UPDATE games SET home_score = 50, away_score = 32, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Monterey') AND away_team_id = (SELECT id FROM teams WHERE name = 'Americas');

-- Region 2 Games
UPDATE games SET home_score = 49, away_score = 6, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Lone Star') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%North Mesquite%');

UPDATE games SET home_score = 41, away_score = 11, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Georgetown') AND away_team_id = (SELECT id FROM teams WHERE name = 'Centennial');

UPDATE games SET home_score = 28, away_score = 24, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%West Mesquite%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Frisco');

UPDATE games SET home_score = 36, away_score = 16, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Midlothian') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%East View%');

UPDATE games SET home_score = 56, away_score = 13, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Highland Park%') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%Lake Belton%');

UPDATE games SET home_score = 24, away_score = 3, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Reedy') AND away_team_id = (SELECT id FROM teams WHERE name = 'Creekview');

UPDATE games SET home_score = 50, away_score = 43, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Cedar Park') AND away_team_id = (SELECT id FROM teams WHERE name = 'Tyler');

UPDATE games SET home_score = 28, away_score = 12, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Wakeland') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%Newman Smith%');

-- Region 3 Games
UPDATE games SET home_score = 42, away_score = 0, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Port Arthur%') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%Galena Park%');

UPDATE games SET home_score = 27, away_score = 26, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%A&M Consolidated%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Crosby');

UPDATE games SET home_score = 27, away_score = 19, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Beaumont United%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Madison');

UPDATE games SET home_score = 42, away_score = 23, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'College Station') AND away_team_id = (SELECT id FROM teams WHERE name = 'Angleton');

UPDATE games SET home_score = 42, away_score = 35, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Weiss') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%La Porte%');

UPDATE games SET home_score = 35, away_score = 10, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Lufkin') AND away_team_id = (SELECT id FROM teams WHERE name = 'Westbury');

UPDATE games SET home_score = 35, away_score = 34, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Anderson') AND away_team_id = (SELECT id FROM teams WHERE name = 'Friendswood');

UPDATE games SET home_score = 57, away_score = 7, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Barbers Hill%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Waltrip');

-- Region 4 Games
UPDATE games SET home_score = 49, away_score = 0, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Smithson Valley%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Southside');

UPDATE games SET home_score = 31, away_score = 26, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Veterans Memorial%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Vela');

UPDATE games SET home_score = 33, away_score = 14, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'Pieper') AND away_team_id = (SELECT id FROM teams WHERE name = 'Jay');

UPDATE games SET home_score = 45, away_score = 7, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Flour Bluff%') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%McAllen%' AND name NOT LIKE '%Memorial%');

UPDATE games SET home_score = 65, away_score = 14, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Pharr%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Mission');

UPDATE games SET home_score = 41, away_score = 14, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%Champion%') AND away_team_id = (SELECT id FROM teams WHERE name = 'Southwest');

UPDATE games SET home_score = 35, away_score = 21, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE '%McAllen Memorial%') AND away_team_id = (SELECT id FROM teams WHERE name LIKE '%Harlingen%');

UPDATE games SET home_score = 49, away_score = 14, status = 'final' WHERE home_team_id = (SELECT id FROM teams WHERE name = 'New Braunfels') AND away_team_id = (SELECT id FROM teams WHERE name = 'Nixon');
