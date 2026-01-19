-- Import 5A Division I Schools and Create Teams
-- Classification: 5A-D1 (128 schools)
-- Run with: sudo -u postgres psql -d statiq -f import_5a_d1.sql

-- Create a temporary table for the import
CREATE TEMP TABLE temp_5a_d1 (
    name VARCHAR(255),
    city VARCHAR(100),
    mascot VARCHAR(100) DEFAULT 'TBD'
);

-- Insert all 5A-D1 schools
INSERT INTO temp_5a_d1 (name, city) VALUES
-- District 1 (El Paso)
('El Paso Americas', 'El Paso'),
('El Paso Bel Air', 'El Paso'),
('El Paso El Dorado', 'El Paso'),
('El Paso Parkland', 'El Paso'),
-- District 2 (Panhandle)
('Abilene', 'Abilene'),
('Amarillo', 'Amarillo'),
('Amarillo Caprock', 'Amarillo'),
('Amarillo Tascosa', 'Amarillo'),
('Lubbock', 'Lubbock'),
('Lubbock Coronado', 'Lubbock'),
('Lubbock Monterey', 'Lubbock'),
-- District 3 (DFW North)
('Aledo', 'Aledo'),
('Azle', 'Azle'),
('Denton', 'Denton'),
('Denton Ryan', 'Denton'),
('Granbury', 'Granbury'),
('Keller Fossil Ridge', 'Keller'),
('North Richland Hills Birdville', 'North Richland Hills'),
('North Richland Hills Richland', 'North Richland Hills'),
('White Settlement Brewer', 'White Settlement'),
-- District 4 (Fort Worth ISD)
('Fort Worth Arlington Heights', 'Fort Worth'),
('Fort Worth North Side', 'Fort Worth'),
('Fort Worth Paschal', 'Fort Worth'),
('Fort Worth Polytechnic', 'Fort Worth'),
('Fort Worth South Hills', 'Fort Worth'),
('Fort Worth Trimble Tech', 'Fort Worth'),
('Fort Worth Wyatt', 'Fort Worth'),
('Saginaw Chisholm Trail', 'Saginaw'),
-- District 5 (Frisco)
('Frisco', 'Frisco'),
('Frisco Centennial', 'Frisco'),
('Frisco Heritage', 'Frisco'),
('Frisco Lebanon Trail', 'Frisco'),
('Frisco Lone Star', 'Frisco'),
('Frisco Reedy', 'Frisco'),
('Frisco Wakeland', 'Frisco'),
('McKinney North', 'McKinney'),
('Sherman', 'Sherman'),
-- District 6 (Dallas)
('Carrollton Creekview', 'Carrollton'),
('Carrollton Smith', 'Carrollton'),
('Carrollton Turner', 'Carrollton'),
('Dallas Adams', 'Dallas'),
('Dallas Molina', 'Dallas'),
('Dallas Sunset', 'Dallas'),
('Dallas White', 'Dallas'),
('North Mesquite', 'Mesquite'),
('West Mesquite', 'Mesquite'),
-- District 7 (Mixed)
('Burleson Centennial', 'Burleson'),
('Cleburne', 'Cleburne'),
('Dallas Highland Park', 'Dallas'),
('Joshua', 'Joshua'),
('Lufkin', 'Lufkin'),
('Midlothian', 'Midlothian'),
('Red Oak', 'Red Oak'),
('Tyler', 'Tyler'),
-- District 8 (Central Texas)
('Cedar Park', 'Cedar Park'),
('Georgetown', 'Georgetown'),
('Georgetown East View', 'Georgetown'),
('Killeen Chaparral', 'Killeen'),
('Lake Belton', 'Temple'),
('Leander', 'Leander'),
('Leander Glenn', 'Leander'),
('Leander Rouse', 'Leander'),
-- District 9 (Southeast Texas)
('Angleton', 'Angleton'),
('Baytown Sterling', 'Baytown'),
('Beaumont United', 'Beaumont'),
('Beaumont West Brook', 'Beaumont'),
('Galveston Ball', 'Galveston'),
('Barbers Hill', 'Mont Belvieu'),
('Port Arthur Memorial', 'Port Arthur'),
-- District 10 (Houston ISD)
('Galena Park', 'Galena Park'),
('Houston Austin', 'Houston'),
('Houston Madison', 'Houston'),
('Houston Milby', 'Houston'),
('Houston Sharpstown', 'Houston'),
('Houston Sterling', 'Houston'),
('Houston Waltrip', 'Houston'),
('Houston Westbury', 'Houston'),
-- District 11 (Houston Suburbs)
('Crosby', 'Crosby'),
('Fort Bend Kempner', 'Sugar Land'),
('Friendswood', 'Friendswood'),
('Houston Spring Woods', 'Houston'),
('Kingwood Park', 'Kingwood'),
('La Porte', 'La Porte'),
('New Caney Porter', 'New Caney'),
('Pasadena', 'Pasadena'),
-- District 12 (Austin/Bryan)
('Austin Anderson', 'Austin'),
('Cedar Creek', 'Bastrop'),
('Buda Hays', 'Buda'),
('College Station', 'College Station'),
('A&M Consolidated', 'College Station'),
('Kyle Lehman', 'Kyle'),
('Lockhart', 'Lockhart'),
('Pflugerville Hendrickson', 'Pflugerville'),
('Pflugerville Weiss', 'Pflugerville'),
-- District 13 (San Antonio/Hill Country)
('Boerne Champion', 'Boerne'),
('Pieper', 'New Braunfels'),
('Smithson Valley', 'Spring Branch'),
('New Braunfels', 'New Braunfels'),
('San Antonio MacArthur', 'San Antonio'),
('San Antonio Wagner', 'San Antonio'),
('Seguin', 'Seguin'),
('Victoria East', 'Victoria'),
-- District 14 (San Antonio/Border)
('Eagle Pass Winn', 'Eagle Pass'),
('Laredo Cigarroa', 'Laredo'),
('Laredo Martin', 'Laredo'),
('Laredo Nixon', 'Laredo'),
('San Antonio Jay', 'San Antonio'),
('San Antonio Southside', 'San Antonio'),
('San Antonio Southwest', 'San Antonio'),
('South San Antonio', 'San Antonio'),
('Southwest Legacy', 'San Antonio'),
-- District 15 (RGV North)
('Brownsville Rivera', 'Brownsville'),
('Corpus Christi Flour Bluff', 'Corpus Christi'),
('Corpus Christi Veterans Memorial', 'Corpus Christi'),
('Donna', 'Donna'),
('Donna North', 'Donna'),
('Harlingen South', 'Harlingen'),
('PSJA Memorial', 'Pharr'),
('PSJA North', 'Pharr'),
('Weslaco East', 'Weslaco'),
-- District 16 (RGV South)
('Edinburg Vela', 'Edinburg'),
('La Joya Juarez-Lincoln', 'La Joya'),
('La Joya Palmview', 'Mission'),
('McAllen', 'McAllen'),
('McAllen Memorial', 'McAllen'),
('McAllen Rowe', 'McAllen'),
('Mission', 'Mission'),
('Rio Grande City', 'Rio Grande City');

-- Insert schools that don't already exist
INSERT INTO schools (name, classification, city, state, wins, losses)
SELECT t.name, '5A-D1', t.city, 'TX', 0, 0
FROM temp_5a_d1 t
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name = t.name);

-- Update existing schools to 5A-D1 classification
UPDATE schools s
SET classification = '5A-D1'
FROM temp_5a_d1 t
WHERE s.name = t.name;

-- Create teams for schools that don't have teams yet
INSERT INTO teams (name, mascot, level, wins, losses, school_id, primary_color, background_color)
SELECT 
    s.name,
    COALESCE(s.mascot, 'TBD'),
    'Varsity',
    s.wins,
    s.losses,
    s.id,
    '#1a1a1a',  -- Default dark primary
    '#FFFFFF'   -- Default white background
FROM schools s
WHERE s.classification = '5A-D1'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.school_id = s.id);

-- Show summary
SELECT 'Schools imported:' as status, COUNT(*) as count FROM schools WHERE classification = '5A-D1'
UNION ALL
SELECT 'Teams created:', COUNT(*) FROM teams t JOIN schools s ON t.school_id = s.id WHERE s.classification = '5A-D1';
