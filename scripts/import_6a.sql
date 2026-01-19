-- Import 6A Schools and Create Teams
-- Classification: 6A (32 districts, ~250 schools)
-- Run with: sudo -u postgres psql -d statiq -f import_6a.sql

CREATE TEMP TABLE temp_6a (
    name VARCHAR(255),
    city VARCHAR(100),
    district INTEGER
);

INSERT INTO temp_6a (name, city, district) VALUES

-- ============================================================================
-- REGION 1
-- ============================================================================

-- District 1 (El Paso)
('El Paso Coronado', 'El Paso', 1),
('El Paso Eastlake', 'El Paso', 1),
('El Paso Eastwood', 'El Paso', 1),
('El Paso Franklin', 'El Paso', 1),
('El Paso Montwood', 'El Paso', 1),
('El Paso Pebble Hills', 'El Paso', 1),
('El Paso Socorro', 'El Paso', 1),

-- District 2 (West Texas)
('Midland', 'Midland', 2),
('Midland Legacy', 'Midland', 2),
('Odessa', 'Odessa', 2),
('Odessa Permian', 'Odessa', 2),
('San Angelo Central', 'San Angelo', 2),
('Wolfforth Frenship', 'Wolfforth', 2),

-- District 3 (Crowley/Mansfield)
('Crowley', 'Crowley', 3),
('Fort Worth Boswell', 'Fort Worth', 3),
('Mansfield', 'Mansfield', 3),
('Mansfield Lake Ridge', 'Mansfield', 3),
('Mansfield Legacy', 'Mansfield', 3),
('North Crowley', 'Fort Worth', 3),
('Weatherford', 'Weatherford', 3),

-- District 4 (Keller/Southlake)
('Euless Trinity', 'Euless', 4),
('Hurst Bell', 'Hurst', 4),
('Keller', 'Keller', 4),
('Keller Central', 'Keller', 4),
('Keller Timber Creek', 'Keller', 4),
('Northwest', 'Justin', 4),
('Northwest Eaton', 'Haslet', 4),
('Northwest Nelson', 'Trophy Club', 4),
('Southlake Carroll', 'Southlake', 4),

-- District 5 (Lewisville)
('Coppell', 'Coppell', 5),
('Denton Braswell', 'Denton', 5),
('Denton Guyer', 'Denton', 5),
('Lewisville', 'Lewisville', 5),
('Lewisville Flower Mound', 'Flower Mound', 5),
('Lewisville Hebron', 'Lewisville', 5),
('Lewisville Marcus', 'Flower Mound', 5),
('Little Elm', 'Little Elm', 5),

-- District 6 (Plano/Allen)
('Allen', 'Allen', 6),
('McKinney', 'McKinney', 6),
('McKinney Boyd', 'McKinney', 6),
('Plano', 'Plano', 6),
('Plano East', 'Plano', 6),
('Plano West', 'Plano', 6),
('Princeton', 'Princeton', 6),
('Prosper', 'Prosper', 6),
('Prosper Rock Hill', 'Prosper', 6),

-- District 7 (Richardson/Irving)
('Dallas Jesuit', 'Dallas', 7),
('Irving', 'Irving', 7),
('Irving MacArthur', 'Irving', 7),
('Irving Nimitz', 'Irving', 7),
('Richardson', 'Richardson', 7),
('Richardson Berkner', 'Richardson', 7),
('Richardson Lake Highlands', 'Dallas', 7),
('Richardson Pearce', 'Richardson', 7),

-- District 8 (Arlington)
('Arlington', 'Arlington', 8),
('Arlington Bowie', 'Arlington', 8),
('Arlington Houston', 'Arlington', 8),
('Arlington Lamar', 'Arlington', 8),
('Arlington Martin', 'Arlington', 8),
('Grand Prairie', 'Grand Prairie', 8),
('Haltom City Haltom', 'Haltom City', 8),
('South Grand Prairie', 'Grand Prairie', 8),

-- ============================================================================
-- REGION 2
-- ============================================================================

-- District 9 (Garland)
('Garland', 'Garland', 9),
('Garland Lakeview Centennial', 'Garland', 9),
('Garland Naaman Forest', 'Garland', 9),
('Garland Rowlett', 'Rowlett', 9),
('Garland Sachse', 'Sachse', 9),
('North Garland', 'Garland', 9),
('South Garland', 'Garland', 9),
('Wylie', 'Wylie', 9),
('Wylie East', 'Wylie', 9),

-- District 10 (Rockwall/Forney)
('Forney', 'Forney', 10),
('Longview', 'Longview', 10),
('North Forney', 'Forney', 10),
('Rockwall', 'Rockwall', 10),
('Rockwall Heath', 'Rockwall', 10),
('Royse City', 'Royse City', 10),
('Tyler Legacy', 'Tyler', 10),

-- District 11 (Dallas South)
('Cedar Hill', 'Cedar Hill', 11),
('Dallas Skyline', 'Dallas', 11),
('DeSoto', 'DeSoto', 11),
('Duncanville', 'Duncanville', 11),
('Lancaster', 'Lancaster', 11),
('Mesquite', 'Mesquite', 11),
('Mesquite Horn', 'Mesquite', 11),
('Waxahachie', 'Waxahachie', 11),

-- District 12 (Central Texas)
('Bryan', 'Bryan', 12),
('Copperas Cove', 'Copperas Cove', 12),
('Killeen', 'Killeen', 12),
('Killeen Harker Heights', 'Harker Heights', 12),
('Killeen Shoemaker', 'Killeen', 12),
('Temple', 'Temple', 12),
('Waco Midway', 'Waco', 12),

-- District 13 (Conroe/Woodlands)
('Cleveland', 'Cleveland', 13),
('Conroe', 'Conroe', 13),
('Conroe Caney Creek', 'Conroe', 13),
('Conroe Grand Oaks', 'Spring', 13),
('Conroe Oak Ridge', 'Conroe', 13),
('Conroe The Woodlands', 'The Woodlands', 13),
('Conroe Woodlands College Park', 'The Woodlands', 13),
('New Caney', 'New Caney', 13),
('Willis', 'Willis', 13),

-- District 14 (Aldine/Spring)
('Houston Aldine', 'Houston', 14),
('Houston Benjamin Davis', 'Houston', 14),
('Houston Eisenhower', 'Houston', 14),
('Houston MacArthur', 'Houston', 14),
('Houston Nimitz', 'Houston', 14),
('Spring', 'Spring', 14),
('Spring Dekaney', 'Spring', 14),
('Spring Westfield', 'Spring', 14),

-- District 15 (Klein/Tomball)
('Klein', 'Klein', 15),
('Klein Cain', 'Houston', 15),
('Klein Collins', 'Spring', 15),
('Klein Forest', 'Houston', 15),
('Klein Oak', 'Spring', 15),
('Magnolia', 'Magnolia', 15),
('Magnolia West', 'Magnolia', 15),
('Tomball', 'Tomball', 15),
('Tomball Memorial', 'Tomball', 15),

-- District 16 (Cy-Fair West)
('Bridgeland', 'Cypress', 16),
('Cypress Lakes', 'Katy', 16),
('Cypress Park', 'Cypress', 16),
('Cypress Ranch', 'Cypress', 16),
('Cypress Springs', 'Cypress', 16),
('Cypress Woods', 'Cypress', 16),
('Langham Creek', 'Houston', 16),
('Waller', 'Waller', 16),

-- ============================================================================
-- REGION 3
-- ============================================================================

-- District 17 (Cy-Fair East)
('Cy-Fair', 'Houston', 17),
('Cypress Creek', 'Houston', 17),
('Cypress Falls', 'Houston', 17),
('Cypress Ridge', 'Houston', 17),
('Houston Memorial', 'Houston', 17),
('Houston Northbrook', 'Houston', 17),
('Houston Stratford', 'Houston', 17),
('Jersey Village', 'Houston', 17),

-- District 18 (Houston ISD)
('Houston Bellaire', 'Houston', 18),
('Houston Chavez', 'Houston', 18),
('Houston Heights', 'Houston', 18),
('Houston Lamar', 'Houston', 18),
('Houston Math Sci Tech', 'Houston', 18),
('Houston Westside', 'Houston', 18),
('Houston Wisdom', 'Houston', 18),

-- District 19 (Katy)
('Katy', 'Katy', 19),
('Katy Cinco Ranch', 'Katy', 19),
('Katy Jordan', 'Katy', 19),
('Katy Mayde Creek', 'Houston', 19),
('Katy Morton Ranch', 'Katy', 19),
('Katy Paetow', 'Katy', 19),
('Katy Seven Lakes', 'Katy', 19),
('Katy Taylor', 'Katy', 19),
('Katy Tompkins', 'Katy', 19),

-- District 20 (Fort Bend North)
('Alief Elsik', 'Houston', 20),
('Alief Hastings', 'Houston', 20),
('Alief Taylor', 'Houston', 20),
('Houston Strake Jesuit', 'Houston', 20),
('Lamar Fulshear', 'Fulshear', 20),
('Richmond Foster', 'Richmond', 20),
('Richmond George Ranch', 'Richmond', 20),

-- District 21 (Fort Bend South)
('Fort Bend Austin', 'Sugar Land', 21),
('Fort Bend Bush', 'Richmond', 21),
('Fort Bend Clements', 'Sugar Land', 21),
('Fort Bend Dulles', 'Sugar Land', 21),
('Fort Bend Elkins', 'Missouri City', 21),
('Fort Bend Hightower', 'Missouri City', 21),
('Fort Bend Ridge Point', 'Missouri City', 21),
('Fort Bend Travis', 'Richmond', 21),

-- District 22 (Pearland/Pasadena)
('Alvin', 'Alvin', 22),
('Alvin Shadow Creek', 'Pearland', 22),
('Manvel', 'Manvel', 22),
('Pasadena Dobie', 'Pasadena', 22),
('Pasadena Memorial', 'Pasadena', 22),
('Pasadena Rayburn', 'Pasadena', 22),
('Pasadena South Houston', 'South Houston', 22),
('Pearland', 'Pearland', 22),
('Pearland Dawson', 'Pearland', 22),

-- District 23 (Humble/Galena Park)
('Baytown Goose Creek Memorial', 'Baytown', 23),
('Channelview', 'Channelview', 23),
('Galena Park North Shore', 'Houston', 23),
('Humble', 'Humble', 23),
('Humble Atascocita', 'Humble', 23),
('Humble Kingwood', 'Kingwood', 23),
('Humble Summer Creek', 'Houston', 23),
('Sheldon King', 'Houston', 23),

-- District 24 (Clear Creek/Brazoswood)
('Clute Brazoswood', 'Clute', 24),
('Deer Park', 'Deer Park', 24),
('Dickinson', 'Dickinson', 24),
('Friendswood Clear Brook', 'Friendswood', 24),
('Houston Clear Lake', 'Houston', 24),
('League City Clear Creek', 'League City', 24),
('League City Clear Falls', 'League City', 24),
('League City Clear Springs', 'League City', 24),

-- ============================================================================
-- REGION 4
-- ============================================================================

-- District 25 (Round Rock)
('Austin Vandegrift', 'Austin', 25),
('Cedar Park Vista Ridge', 'Cedar Park', 25),
('Hutto', 'Hutto', 25),
('Manor', 'Manor', 25),
('Round Rock', 'Round Rock', 25),
('Round Rock McNeil', 'Austin', 25),
('Round Rock Stony Point', 'Round Rock', 25),
('Round Rock Westwood', 'Austin', 25),
('Round Rock Cedar Ridge', 'Round Rock', 25),

-- District 26 (Austin)
('Austin', 'Austin', 26),
('Austin Akins', 'Austin', 26),
('Austin Bowie', 'Austin', 26),
('Austin Lake Travis', 'Austin', 26),
('Del Valle', 'Del Valle', 26),
('Dripping Springs', 'Dripping Springs', 26),

-- District 27 (San Antonio North)
('Northside Brandeis', 'San Antonio', 27),
('Northside Clark', 'San Antonio', 27),
('San Antonio Churchill', 'San Antonio', 27),
('San Antonio Johnson', 'San Antonio', 27),
('San Antonio LEE', 'San Antonio', 27),
('San Antonio Madison', 'San Antonio', 27),
('San Antonio Reagan', 'San Antonio', 27),
('San Antonio Roosevelt', 'San Antonio', 27),

-- District 28 (Northside ISD)
('Northside Brennan', 'San Antonio', 28),
('Northside Harlan', 'San Antonio', 28),
('Northside Holmes', 'San Antonio', 28),
('Northside Marshall', 'San Antonio', 28),
('Northside O''Connor', 'San Antonio', 28),
('Northside Sotomayor', 'San Antonio', 28),
('Northside Stevens', 'San Antonio', 28),
('Northside Taft', 'San Antonio', 28),
('Northside Warren', 'San Antonio', 28),

-- District 29 (New Braunfels/Judson)
('Buda Johnson', 'Buda', 29),
('Cibolo Steele', 'Cibolo', 29),
('Comal Canyon', 'New Braunfels', 29),
('Converse Judson', 'Converse', 29),
('San Antonio East Central', 'San Antonio', 29),
('San Marcos', 'San Marcos', 29),
('Schertz Clemens', 'Schertz', 29),

-- District 30 (Laredo/Eagle Pass)
('Castroville Medina Valley', 'Castroville', 30),
('Del Rio', 'Del Rio', 30),
('Eagle Pass', 'Eagle Pass', 30),
('Laredo Alexander', 'Laredo', 30),
('Laredo Johnson', 'Laredo', 30),
('Laredo United', 'Laredo', 30),
('Laredo United South', 'Laredo', 30),

-- District 31 (Edinburg/PSJA)
('Edinburg', 'Edinburg', 31),
('Edinburg Economedes', 'Edinburg', 31),
('Edinburg North', 'Edinburg', 31),
('La Joya', 'La Joya', 31),
('Pharr-San Juan-Alamo', 'Pharr', 31),
('Weslaco', 'Weslaco', 31),

-- District 32 (Brownsville/Harlingen)
('Brownsville Hanna', 'Brownsville', 32),
('Brownsville Veterans Memorial', 'Brownsville', 32),
('Harlingen', 'Harlingen', 32),
('Los Fresnos', 'Los Fresnos', 32),
('San Benito', 'San Benito', 32);

-- Insert schools that don't already exist
INSERT INTO schools (name, classification, city, state, wins, losses, district)
SELECT t.name, '6A', t.city, 'TX', 0, 0, t.district
FROM temp_6a t
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name = t.name);

-- Update existing schools to 6A classification and set district
UPDATE schools s
SET classification = '6A', district = t.district
FROM temp_6a t
WHERE s.name = t.name;

-- Create teams for schools that don't have teams yet
INSERT INTO teams (name, mascot, level, wins, losses, school_id, primary_color, background_color)
SELECT s.name, COALESCE(s.mascot, 'TBD'), 'Varsity', s.wins, s.losses, s.id, '#1a1a1a', '#FFFFFF'
FROM schools s
WHERE s.classification = '6A'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.school_id = s.id)
AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.name = s.name);

-- Show summary
SELECT 'Schools:', COUNT(*)::text FROM schools WHERE classification = '6A'
UNION ALL
SELECT 'Teams:', COUNT(*)::text FROM teams t JOIN schools s ON t.school_id = s.id WHERE s.classification = '6A';
