-- Import 4A Division I Schools and Create Teams
-- Classification: 4A-D1 (16 districts, ~96 schools)
-- Run with: sudo -u postgres psql -d statiq -f import_4a_d1.sql

-- Create a temporary table for the import
CREATE TEMP TABLE temp_4a_d1 (
    name VARCHAR(255),
    city VARCHAR(100),
    district INTEGER
);

-- Insert all 4A-D1 schools
INSERT INTO temp_4a_d1 (name, city, district) VALUES

-- ============================================================================
-- REGION 1
-- ============================================================================

-- District 1
('Fort Stockton', 'Fort Stockton', 1),
('Midland Greenwood', 'Midland', 1),
('Monahans', 'Monahans', 1),
('Seminole', 'Seminole', 1),
('Snyder', 'Snyder', 1),

-- District 2
('Borger', 'Borger', 2),
('Levelland', 'Levelland', 2),
('Lubbock Cooper', 'Lubbock', 2),
('Lubbock Estacado', 'Lubbock', 2),
('Perryton', 'Perryton', 2),

-- District 3
('Bridgeport', 'Bridgeport', 3),
('Brock', 'Brock', 3),
('Burkburnett', 'Burkburnett', 3),
('Eagle Mountain', 'Fort Worth', 3),
('Graham', 'Graham', 3),
('Mineral Wells', 'Mineral Wells', 3),

-- District 4
('Fort Worth Benbrook', 'Fort Worth', 4),
('Fort Worth Dunbar', 'Fort Worth', 4),
('Glen Rose', 'Glen Rose', 4),
('Godley', 'Godley', 4),
('Hillsboro', 'Hillsboro', 4),
('Venus', 'Venus', 4),

-- ============================================================================
-- REGION 2
-- ============================================================================

-- District 5
('Bonham', 'Bonham', 5),
('Caddo Mills', 'Caddo Mills', 5),
('Farmersville', 'Farmersville', 5),
('Gainesville', 'Gainesville', 5),
('Krum', 'Krum', 5),
('Sanger', 'Sanger', 5),
('Van Alstyne', 'Van Alstyne', 5),

-- District 6
('Canton', 'Canton', 6),
('Ferris', 'Ferris', 6),
('Kemp', 'Kemp', 6),
('Quinlan Ford', 'Quinlan', 6),
('Sunnyvale', 'Sunnyvale', 6),
('Wills Point', 'Wills Point', 6),

-- District 7
('Gilmer', 'Gilmer', 7),
('Longview Spring Hill', 'Longview', 7),
('Paris North Lamar', 'Paris', 7),
('Pittsburg', 'Pittsburg', 7),
('Texarkana Pleasant Grove', 'Texarkana', 7),
('Van', 'Van', 7),

-- District 8
('Athens', 'Athens', 8),
('Brownsboro', 'Brownsboro', 8),
('Bullard', 'Bullard', 8),
('Carthage', 'Carthage', 8),
('Center', 'Center', 8),
('Rusk', 'Rusk', 8),

-- ============================================================================
-- REGION 3
-- ============================================================================

-- District 9
('Cleveland Tarkington', 'Cleveland', 9),
('Hamshire-Fannett', 'Hamshire', 9),
('Jasper', 'Jasper', 9),
('Shepherd', 'Shepherd', 9),
('Silsbee', 'Silsbee', 9),
('West Orange-Stark', 'Orange', 9),

-- District 10
('Harmony School of Innovation', 'Houston', 10),
('Katy Harmony', 'Katy', 10),
('La Marque', 'La Marque', 10),
('Royal', 'Brookshire', 10),
('Sweeny', 'Sweeny', 10),
('West Columbia Columbia', 'West Columbia', 10),
('Wharton', 'Wharton', 10),

-- District 11
('Bellville', 'Bellville', 11),
('Caldwell', 'Caldwell', 11),
('Giddings', 'Giddings', 11),
('La Grange', 'La Grange', 11),
('Madisonville', 'Madisonville', 11),
('Sealy', 'Sealy', 11),

-- District 12
('China Spring', 'Waco', 12),
('Gatesville', 'Gatesville', 12),
('Lorena', 'Lorena', 12),
('Robinson', 'Robinson', 12),
('Waco Connally', 'Waco', 12),
('Waco La Vega', 'Waco', 12),

-- ============================================================================
-- REGION 4
-- ============================================================================

-- District 13
('Geronimo Navarro', 'Geronimo', 13),
('Gonzales', 'Gonzales', 13),
('Jarrell', 'Jarrell', 13),
('Lago Vista', 'Lago Vista', 13),
('Salado', 'Salado', 13),
('Smithville', 'Smithville', 13),
('Wimberley', 'Wimberley', 13),

-- District 14
('Bandera', 'Bandera', 14),
('Carrizo Springs', 'Carrizo Springs', 14),
('Devine', 'Devine', 14),
('Pearsall', 'Pearsall', 14),
('San Antonio Memorial', 'San Antonio', 14),

-- District 15
('Cuero', 'Cuero', 15),
('Ingleside', 'Ingleside', 15),
('Robstown', 'Robstown', 15),
('Rockport-Fulton', 'Rockport', 15),
('Sinton', 'Sinton', 15),

-- District 16
('Kingsville King', 'Kingsville', 16),
('La Feria', 'La Feria', 16),
('Port Isabel', 'Port Isabel', 16),
('Rio Grande City Grulla', 'Rio Grande City', 16);

-- Insert schools that don't already exist
INSERT INTO schools (name, classification, city, state, wins, losses, district)
SELECT t.name, '4A-D1', t.city, 'TX', 0, 0, t.district
FROM temp_4a_d1 t
WHERE NOT EXISTS (SELECT 1 FROM schools s WHERE s.name = t.name);

-- Update existing schools to 4A-D1 classification and set district
UPDATE schools s
SET classification = '4A-D1',
    district = t.district
FROM temp_4a_d1 t
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
WHERE s.classification = '4A-D1'
AND NOT EXISTS (SELECT 1 FROM teams t WHERE t.school_id = s.id);

-- Show summary
SELECT '4A-D1 Import Summary' as status, '' as count
UNION ALL
SELECT 'Schools imported:', COUNT(*)::text FROM schools WHERE classification = '4A-D1'
UNION ALL
SELECT 'Teams created:', COUNT(*)::text FROM teams t JOIN schools s ON t.school_id = s.id WHERE s.classification = '4A-D1'
UNION ALL
SELECT 'By District:', ''
UNION ALL
SELECT CONCAT('  District ', district, ':'), COUNT(*)::text FROM schools WHERE classification = '4A-D1' GROUP BY district ORDER BY district;
