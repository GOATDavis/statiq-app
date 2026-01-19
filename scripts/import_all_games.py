#!/usr/bin/env python3
"""
Comprehensive 5A-D1 Game Importer

This script:
1. Parses SI.com score text
2. Identifies ALL games involving 5A-D1 teams
3. Tracks opponent classifications
4. Generates SQL for:
   - Adding missing opponent teams with classifications
   - Inserting all games

Usage:
1. Paste week's scores into the SCORES variable
2. Set the GAME_DATE
3. Run: python3 import_all_games.py
4. Copy/paste the generated SQL into psql
"""

import re
from collections import defaultdict

# =============================================================================
# 5A-D1 TEAMS - Complete roster with database IDs
# =============================================================================
TEAMS_5A_D1 = {
    # Format: "Display Name": (id, canonical_db_name)
    
    # A
    "A&M Consolidated": (34, "A&M Consolidated"),
    "Abilene": (35, "Abilene"),
    "Aledo": (36, "Aledo"),
    "Amarillo": (37, "Amarillo"),
    "Amarillo Caprock": (310, "Amarillo Caprock"),
    "Caprock": (310, "Amarillo Caprock"),
    "Amarillo Tascosa": (228, "Amarillo Tascosa"),
    "Tascosa": (228, "Amarillo Tascosa"),
    "Americas": (38, "Americas"),
    "Anderson": (39, "Anderson"),
    "Angleton": (40, "Angleton"),
    "Austin Anderson": (226, "Austin Anderson"),
    "Azle": (180, "Azle"),
    
    # B
    "Barbers Hill": (42, "Barbers Hill"),
    "Baytown Sterling": (277, "Baytown Sterling"),
    "Beaumont United": (43, "Beaumont United"),
    "Beaumont West Brook": (271, "Beaumont West Brook"),
    "Bel Air": (44, "Bel Air"),
    "Birdville": (186, "Birdville"),
    "Boerne Champion": (158, "Boerne Champion"),
    "Boerne-Champion": (158, "Boerne Champion"),
    "Brewer": (46, "Brewer"),
    "Brownsville Rivera": (245, "Brownsville Rivera"),
    "Rivera": (245, "Brownsville Rivera"),
    "Buda Hays": (312, "Buda Hays"),
    "Hays": (312, "Buda Hays"),
    
    # C
    "Carrollton Creekview": (258, "Carrollton Creekview"),
    "Carrollton Smith": (275, "Carrollton Smith"),
    "Carrollton Turner": (289, "Carrollton Turner"),
    "Cedar Creek": (232, "Cedar Creek"),
    "Cedar Park": (47, "Cedar Park"),
    "Centennial": (5, "Centennial"),
    "Chisholm Trail": (48, "Chisholm Trail"),
    "Cleburne": (6, "Cleburne"),
    "College Station": (49, "College Station"),
    "Corpus Christi Flour Bluff": (298, "Corpus Christi Flour Bluff"),
    "Flour Bluff": (298, "Corpus Christi Flour Bluff"),
    "Corpus Christi Veterans Memorial": (234, "Corpus Christi Veterans Memorial"),
    "CC Veterans Memorial": (234, "Corpus Christi Veterans Memorial"),
    "Veterans Memorial": (234, "Corpus Christi Veterans Memorial"),
    "Creekview": (94, "Creekview"),
    "Crosby": (52, "Crosby"),
    
    # D
    "Dallas Adams": (282, "Dallas Adams"),
    "Dallas Highland Park": (215, "Dallas Highland Park"),
    "Dallas Molina": (272, "Dallas Molina"),
    "Molina": (272, "Dallas Molina"),
    "Dallas Sunset": (309, "Dallas Sunset"),
    "Dallas White": (216, "Dallas White"),
    "Denton": (181, "Denton"),
    "Denton Ryan": (79, "Denton Ryan"),
    "Ryan": (79, "Denton Ryan"),
    "Donna": (165, "Donna"),
    "Donna North": (169, "Donna North"),
    
    # E
    "Eagle Pass Winn": (276, "Eagle Pass Winn"),
    "Winn": (276, "Eagle Pass Winn"),
    "East View": (53, "East View"),
    "Edinburg": (412, "Edinburg"),
    "Edinburg North": (170, "Edinburg North"),
    "Edinburg Vela": (291, "Edinburg Vela"),
    "Vela": (291, "Edinburg Vela"),
    "El Dorado": (54, "El Dorado"),
    "El Paso Americas": (283, "El Paso Americas"),
    "El Paso Bel Air": (252, "El Paso Bel Air"),
    "El Paso Burges": (358, "El Paso Burges"),
    "Burges": (358, "El Paso Burges"),
    "El Paso Canutillo": (361, "El Paso Canutillo"),
    "Canutillo": (361, "El Paso Canutillo"),
    "El Paso Del Valle": (362, "El Paso Del Valle"),
    "El Paso Eastwood": (360, "El Paso Eastwood"),
    "Eastwood": (360, "El Paso Eastwood"),
    "El Paso El Dorado": (294, "El Paso El Dorado"),
    "El Paso Hanks": (355, "El Paso Hanks"),
    "Hanks": (355, "El Paso Hanks"),
    "El Paso Irvin": (356, "El Paso Irvin"),
    "Irvin": (356, "El Paso Irvin"),
    "El Paso Montwood": (357, "El Paso Montwood"),
    "Montwood": (357, "El Paso Montwood"),
    "El Paso Parkland": (300, "El Paso Parkland"),
    "Parkland": (93, "Parkland"),
    "El Paso Ysleta": (359, "El Paso Ysleta"),
    "Ysleta": (359, "El Paso Ysleta"),
    
    # F
    "Fort Bend Kempner": (220, "Fort Bend Kempner"),
    "Kempner": (220, "Fort Bend Kempner"),
    "Fort Worth Arlington Heights": (274, "Fort Worth Arlington Heights"),
    "Arlington Heights": (274, "Fort Worth Arlington Heights"),
    "Fort Worth North Side": (233, "Fort Worth North Side"),
    "North Side": (233, "Fort Worth North Side"),
    "Fort Worth Paschal": (265, "Fort Worth Paschal"),
    "Paschal": (265, "Fort Worth Paschal"),
    "Fort Worth Polytechnic": (255, "Fort Worth Polytechnic"),
    "Polytechnic": (255, "Fort Worth Polytechnic"),
    "Poly": (255, "Fort Worth Polytechnic"),
    "Fort Worth South Hills": (217, "Fort Worth South Hills"),
    "South Hills": (217, "Fort Worth South Hills"),
    "Fort Worth Trimble Tech": (238, "Fort Worth Trimble Tech"),
    "Trimble Tech": (238, "Fort Worth Trimble Tech"),
    "Fort Worth Wyatt": (288, "Fort Worth Wyatt"),
    "Fossil Ridge": (184, "Fossil Ridge"),
    "Friendswood": (56, "Friendswood"),
    "Frisco": (57, "Frisco"),
    "Frisco Centennial": (295, "Frisco Centennial"),
    "Frisco Heritage": (214, "Frisco Heritage"),
    "Heritage": (214, "Frisco Heritage"),
    "Frisco Lebanon Trail": (250, "Frisco Lebanon Trail"),
    "Lebanon Trail": (250, "Frisco Lebanon Trail"),
    "Frisco Lone Star": (251, "Frisco Lone Star"),
    "Frisco Reedy": (229, "Frisco Reedy"),
    "Frisco Wakeland": (263, "Frisco Wakeland"),
    
    # G
    "Galena Park": (58, "Galena Park"),
    "Galveston Ball": (260, "Galveston Ball"),
    "Ball": (260, "Galveston Ball"),
    "Georgetown": (59, "Georgetown"),
    "Georgetown East View": (303, "Georgetown East View"),
    "Granbury": (185, "Granbury"),
    
    # H
    "Harlingen": (413, "Harlingen"),
    "Harlingen South": (60, "Harlingen South"),
    "Highland Park": (15, "Highland Park"),
    "Houston Austin": (261, "Houston Austin"),
    "Houston Madison": (311, "Houston Madison"),
    "Houston Milby": (224, "Houston Milby"),
    "Milby": (224, "Houston Milby"),
    "Houston Sharpstown": (278, "Houston Sharpstown"),
    "Sharpstown": (278, "Houston Sharpstown"),
    "Houston Spring Woods": (218, "Houston Spring Woods"),
    "Spring Woods": (218, "Houston Spring Woods"),
    "Houston Sterling": (254, "Houston Sterling"),
    "Houston Waltrip": (281, "Houston Waltrip"),
    "Houston Westbury": (223, "Houston Westbury"),
    
    # J
    "Joshua": (16, "Joshua"),
    
    # K
    "Keller Fossil Ridge": (222, "Keller Fossil Ridge"),
    "Killeen Chaparral": (269, "Killeen Chaparral"),
    "Chaparral": (269, "Killeen Chaparral"),
    "Kingwood Park": (287, "Kingwood Park"),
    "Kyle Lehman": (235, "Kyle Lehman"),
    "Lehman": (235, "Kyle Lehman"),
    
    # L
    "La Joya Juarez-Lincoln": (264, "La Joya Juarez-Lincoln"),
    "Juarez-Lincoln": (264, "La Joya Juarez-Lincoln"),
    "La Joya Palmview": (299, "La Joya Palmview"),
    "Palmview": (299, "La Joya Palmview"),
    "Lake Belton": (63, "Lake Belton"),
    "Lancaster": (183, "Lancaster"),
    "La Porte": (62, "La Porte"),
    "Laredo Cigarroa": (305, "Laredo Cigarroa"),
    "Cigarroa": (305, "Laredo Cigarroa"),
    "Laredo Martin": (256, "Laredo Martin"),
    "Laredo Nixon": (284, "Laredo Nixon"),
    "Nixon": (284, "Laredo Nixon"),
    "Leander": (131, "Leander"),
    "Leander Glenn": (297, "Leander Glenn"),
    "Glenn": (297, "Leander Glenn"),
    "Leander Rouse": (240, "Leander Rouse"),
    "Rouse": (240, "Leander Rouse"),
    "Lockhart": (230, "Lockhart"),
    "Lone Star": (64, "Lone Star"),
    "Lubbock": (192, "Lubbock"),
    "Lubbock Coronado": (244, "Lubbock Coronado"),
    "Coronado": (244, "Lubbock Coronado"),
    "Lubbock Monterey": (292, "Lubbock Monterey"),
    "Monterey": (292, "Lubbock Monterey"),
    "Lufkin": (19, "Lufkin"),
    
    # M
    "Madison": (65, "Madison"),
    "McAllen": (66, "McAllen"),
    "McAllen Memorial": (67, "McAllen Memorial"),
    "McAllen Rowe": (262, "McAllen Rowe"),
    "Rowe": (262, "McAllen Rowe"),
    "McKinney North": (293, "McKinney North"),
    "Midlothian": (22, "Midlothian"),
    "Mission": (68, "Mission"),
    
    # N
    "New Braunfels": (70, "New Braunfels"),
    "New Caney Porter": (241, "New Caney Porter"),
    "Porter": (241, "New Caney Porter"),
    "Newman Smith": (71, "Newman Smith"),
    "North Mesquite": (73, "North Mesquite"),
    "North Richland Hills Birdville": (266, "North Richland Hills Birdville"),
    "North Richland Hills Richland": (268, "North Richland Hills Richland"),
    
    # P
    "Pasadena": (285, "Pasadena"),
    "Pflugerville Hendrickson": (302, "Pflugerville Hendrickson"),
    "Hendrickson": (302, "Pflugerville Hendrickson"),
    "Pflugerville Weiss": (290, "Pflugerville Weiss"),
    "Pieper": (76, "Pieper"),
    "Port Arthur Memorial": (23, "Port Arthur Memorial"),
    "PSJA Memorial": (286, "PSJA Memorial"),
    "PSJA North": (257, "PSJA North"),
    
    # R
    "Red Oak": (25, "Red Oak"),
    "Reedy": (77, "Reedy"),
    "Richland": (78, "Richland"),
    "Rio Grande City": (177, "Rio Grande City"),
    "Roma": (364, "Roma"),
    
    # S
    "Saginaw": (80, "Saginaw"),
    "Saginaw Chisholm Trail": (236, "Saginaw Chisholm Trail"),
    "San Angelo Central": (363, "San Angelo Central"),
    "San Antonio Jay": (227, "San Antonio Jay"),
    "Jay": (227, "San Antonio Jay"),
    "San Antonio MacArthur": (246, "San Antonio MacArthur"),
    "MacArthur": (246, "San Antonio MacArthur"),
    "San Antonio Southside": (304, "San Antonio Southside"),
    "Southside": (304, "San Antonio Southside"),
    "San Antonio Southwest": (267, "San Antonio Southwest"),
    "Southwest": (267, "San Antonio Southwest"),
    "San Antonio Wagner": (242, "San Antonio Wagner"),
    "Wagner": (242, "San Antonio Wagner"),
    "Seguin": (29, "Seguin"),
    "Sherman": (248, "Sherman"),
    "Smithson Valley": (81, "Smithson Valley"),
    "South San Antonio": (152, "South San Antonio"),
    "South San": (152, "South San Antonio"),
    "Southwest Legacy": (153, "Southwest Legacy"),
    
    # T
    "Tyler": (31, "Tyler"),
    "Tyler Legacy": (32, "Tyler Legacy"),
    
    # V
    "Victoria East": (128, "Victoria East"),
    
    # W
    "Wakeland": (87, "Wakeland"),
    "Waltrip": (98, "Waltrip"),
    "Weiss": (89, "Weiss"),
    "Weslaco East": (167, "Weslaco East"),
    "West Brook": (99, "West Brook"),
    "Westbury": (91, "Westbury"),
    "West Mesquite": (90, "West Mesquite"),
    "White Settlement Brewer": (249, "White Settlement Brewer"),
    "Wyatt": (92, "Wyatt"),
    
    # Added opponents that are actually 5A-D1
    "Denison": (414, "Denison"),
}

# Known opponent teams already in database (non-5A-D1)
KNOWN_OPPONENTS = {
    "Guyer": (182, "6A"),
    "Cedar Hill": (4, "6A"),
    "Rockwall-Heath": (26, "6A"),
    "Waco": (33, "5A-D2"),
    "Andress": (406, "5A-D2"),
    "Nimitz": (416, "6A"),
    "Eaton": (365, "6A"),
    "Dekaney": (366, "6A"),
    "Boerne": (367, "5A-D2"),
    "Argyle": (368, "5A-D2"),
    "New Caney": (369, "5A-D2"),
    "Roosevelt": (370, "6A"),
    "Bellaire": (371, "6A"),
    "Clear Lake": (372, "6A"),
    "Grapevine": (373, "5A-D2"),
    "United South": (374, "6A"),
    "Deer Park": (375, "6A"),
    "Crowley": (376, "5A-D2"),
    "Haltom": (377, "6A"),
    "Braswell": (378, "6A"),
    "Dumas": (379, "4A-D1"),
    "Fort Bend Marshall": (380, "5A-D2"),
    "Dayton": (381, "5A-D2"),
    "Pebble Hills": (382, "6A"),
    "Midland Legacy": (383, "6A"),
    "St. John Bosco": (384, "Out of State"),
    "Medina Valley": (386, "5A-D2"),
    "Lake Dallas": (387, "5A-D2"),
    "Fabens": (388, "4A-D1"),
    "Chapin": (389, "6A"),
    "Fort Bend Willowridge": (390, "5A-D2"),
    "Kingwood": (392, "6A"),
    "Garland": (393, "6A"),
    "San Antonio Lee": (394, "6A"),
    "New Braunfels Canyon": (395, "6A"),
    "Brazoswood": (396, "6A"),
    "Colleyville Heritage": (7, "5A-D2"),
    "Decatur": (398, "4A-D1"),
    "Port Neches-Groves": (399, "5A-D2"),
    "Vandegrift": (400, "6A"),
    "Forney": (402, "5A-D2"),
    "Legacy School of Sport Sciences": (403, "5A-D2"),
    "Mansfield Legacy": (404, "6A"),
    "Magnolia": (405, "5A-D2"),
    "Johnson": (407, "6A"),
    "Belton": (129, "6A"),
    "Iowa Colony": (409, "5A-D2"),
    "Mercedes": (410, "5A-D2"),
    "Clemens": (411, "6A"),
    "Midland": (415, "6A"),
    "Pampa": (417, "4A-D1"),
    "Huntsville": (418, "5A-D2"),
    "Independence": (419, "6A"),
    "Del Rio": (420, "5A-D2"),
    "Fort Bend Hightower": (421, "6A"),
    "Sharyland": (422, "5A-D2"),
    "Permian": (190, "6A"),
    "Davenport": (424, "6A"),
    "Horizon": (426, "5A-D2"),
    "Mountain View": (427, "5A-D2"),
    "Palo Duro": (187, "6A"),
    "Silsbee": (429, "4A-D1"),
    "Legacy": (188, "6A"),
    "Del Valle": (431, "5A-D2"),
    "Eastlake": (432, "6A"),
    "Walnut Grove": (433, "5A-D2"),
    "Pace": (434, "5A-D2"),
    "El Paso Jefferson": (435, "5A-D2"),
    "Jefferson": (435, "5A-D2"),
    "El Paso Bowie": (436, "5A-D2"),
    "Churchill": (437, "6A"),
    "Fulshear": (0, "6A"),  # Need ID
    "Lake View": (0, "4A-D1"),  # Need ID
    "Emerson": (0, "5A-D2"),  # Need ID
    "Horn": (0, "6A"),  # Need ID
    "Laredo LBJ": (0, "5A-D2"),  # Need ID
    "Petersburg": (0, "2A"),  # Need ID
    "Odessa": (0, "6A"),  # Need ID
    "Ellison": (0, "6A"),  # Need ID
    "Canyon Lake": (0, "4A-D1"),  # Need ID
    "Alexander": (0, "6A"),  # Need ID - Laredo Alexander
    "Memphis": (0, "2A"),  # Need ID
    "Pulaski Academy": (0, "Out of State"),  # Need ID - Arkansas
}

def parse_score_line(line):
    """Parse a score line like 'Team A 42, Team B 21' into components."""
    pattern = r'^(.+?)\s+(\d+),\s+(.+?)\s+(\d+)$'
    match = re.match(pattern, line.strip())
    if match:
        return {
            'winner_name': match.group(1).strip(),
            'winner_score': int(match.group(2)),
            'loser_name': match.group(3).strip(),
            'loser_score': int(match.group(4))
        }
    return None

def find_5a_d1_team(name):
    """Find a 5A-D1 team by name, returning (id, canonical_name) or None."""
    if name in TEAMS_5A_D1:
        return TEAMS_5A_D1[name]
    return None

def find_known_opponent(name):
    """Find a known opponent team, returning (id, classification) or None."""
    if name in KNOWN_OPPONENTS:
        info = KNOWN_OPPONENTS[name]
        if info[0] != 0:  # Has valid ID
            return info
    return None

def guess_classification(name):
    """Guess classification based on team name patterns."""
    name_lower = name.lower()
    
    # Private school indicators
    if any(x in name_lower for x in ['christian', 'catholic', 'academy', 'prep', 'episcopal',
                                       'jesuit', 'st.', 'saint', 'lutheran', 'trinity']):
        return "Private"
    
    # Out of state indicators
    if any(x in name_lower for x in ['arkansas', 'oklahoma', 'louisiana', 'new mexico', 'pulaski']):
        return "Out of State"
    
    return "Unknown"

def process_scores(score_text, game_date):
    """Process score text and categorize all games involving 5A-D1 teams."""
    lines = score_text.strip().split('\n')
    
    games_5a_d1_vs_5a_d1 = []
    games_5a_d1_vs_known = []
    games_5a_d1_vs_unknown = []
    unknown_opponents = {}
    
    for line in lines:
        line = line.strip()
        if not line or line.startswith('#') or line.startswith('--'):
            continue
            
        parsed = parse_score_line(line)
        if not parsed:
            continue
        
        winner_5a = find_5a_d1_team(parsed['winner_name'])
        loser_5a = find_5a_d1_team(parsed['loser_name'])
        
        if winner_5a and loser_5a:
            games_5a_d1_vs_5a_d1.append({
                'home_id': winner_5a[0],
                'home_name': winner_5a[1],
                'away_id': loser_5a[0],
                'away_name': loser_5a[1],
                'home_score': parsed['winner_score'],
                'away_score': parsed['loser_score'],
                'original': line
            })
        elif winner_5a:
            opponent = find_known_opponent(parsed['loser_name'])
            if opponent:
                games_5a_d1_vs_known.append({
                    'team_id': winner_5a[0],
                    'team_name': winner_5a[1],
                    'team_score': parsed['winner_score'],
                    'opponent_id': opponent[0],
                    'opponent_name': parsed['loser_name'],
                    'opponent_score': parsed['loser_score'],
                    'opponent_class': opponent[1],
                    'is_home': True,
                    'result': 'WIN',
                    'original': line
                })
            else:
                guessed_class = guess_classification(parsed['loser_name'])
                games_5a_d1_vs_unknown.append({
                    'team_id': winner_5a[0],
                    'team_name': winner_5a[1],
                    'team_score': parsed['winner_score'],
                    'opponent_name': parsed['loser_name'],
                    'opponent_score': parsed['loser_score'],
                    'guessed_class': guessed_class,
                    'is_home': True,
                    'result': 'WIN',
                    'original': line
                })
                unknown_opponents[parsed['loser_name']] = guessed_class
                
        elif loser_5a:
            opponent = find_known_opponent(parsed['winner_name'])
            if opponent:
                games_5a_d1_vs_known.append({
                    'team_id': loser_5a[0],
                    'team_name': loser_5a[1],
                    'team_score': parsed['loser_score'],
                    'opponent_id': opponent[0],
                    'opponent_name': parsed['winner_name'],
                    'opponent_score': parsed['winner_score'],
                    'opponent_class': opponent[1],
                    'is_home': False,
                    'result': 'LOSS',
                    'original': line
                })
            else:
                guessed_class = guess_classification(parsed['winner_name'])
                games_5a_d1_vs_unknown.append({
                    'team_id': loser_5a[0],
                    'team_name': loser_5a[1],
                    'team_score': parsed['loser_score'],
                    'opponent_name': parsed['winner_name'],
                    'opponent_score': parsed['winner_score'],
                    'guessed_class': guessed_class,
                    'is_home': False,
                    'result': 'LOSS',
                    'original': line
                })
                unknown_opponents[parsed['winner_name']] = guessed_class
    
    # Generate output
    print("=" * 80)
    print(f"WEEK ANALYSIS: {game_date}")
    print("=" * 80)
    print(f"\n5A-D1 vs 5A-D1 games: {len(games_5a_d1_vs_5a_d1)}")
    print(f"5A-D1 vs Known Opponents: {len(games_5a_d1_vs_known)}")
    print(f"5A-D1 vs Unknown Opponents: {len(games_5a_d1_vs_unknown)}")
    print(f"TOTAL 5A-D1 games: {len(games_5a_d1_vs_5a_d1) + len(games_5a_d1_vs_known) + len(games_5a_d1_vs_unknown)}")
    
    # Unknown opponents
    if unknown_opponents:
        print("\n" + "=" * 80)
        print("UNKNOWN OPPONENTS - Need to add these teams first:")
        print("=" * 80)
        print("\n-- Add these teams (verify classifications!):")
        print("INSERT INTO teams (name, mascot, level, conference, wins, losses) VALUES")
        values = []
        for name, guessed_class in sorted(unknown_opponents.items()):
            safe_name = name.replace("'", "''")
            values.append(f"('{safe_name}', 'TBD', 'High School', '{guessed_class}', 0, 0)")
        print(',\n'.join(values) + "\nON CONFLICT (name) DO NOTHING;")
        
        print("\n-- Get IDs after adding:")
        names = ', '.join([f"'{n}'" for n in sorted(unknown_opponents.keys())])
        print(f"SELECT id, name FROM teams WHERE name IN ({names});")
    
    # 5A-D1 vs 5A-D1 SQL
    if games_5a_d1_vs_5a_d1:
        print("\n" + "=" * 80)
        print("5A-D1 vs 5A-D1 GAMES SQL:")
        print("=" * 80)
        print("\nINSERT INTO games (home_team_id, away_team_id, home_score, away_score, kickoff_at, status, game_type) VALUES")
        values = []
        for g in games_5a_d1_vs_5a_d1:
            values.append(f"({g['home_id']}, {g['away_id']}, {g['home_score']}, {g['away_score']}, '{game_date} 19:00:00', 'final', 'regular')  -- {g['home_name']} {g['home_score']}, {g['away_name']} {g['away_score']}")
        print(',\n'.join(values) + ';')
    
    # 5A-D1 vs Known Opponents SQL
    if games_5a_d1_vs_known:
        print("\n" + "=" * 80)
        print("5A-D1 vs KNOWN OPPONENTS SQL:")
        print("=" * 80)
        print("\nINSERT INTO games (home_team_id, away_team_id, home_score, away_score, kickoff_at, status, game_type) VALUES")
        values = []
        for g in games_5a_d1_vs_known:
            if g['is_home']:
                values.append(f"({g['team_id']}, {g['opponent_id']}, {g['team_score']}, {g['opponent_score']}, '{game_date} 19:00:00', 'final', 'regular')  -- {g['team_name']} {g['team_score']}, {g['opponent_name']} {g['opponent_score']} [{g['opponent_class']}]")
            else:
                values.append(f"({g['opponent_id']}, {g['team_id']}, {g['opponent_score']}, {g['team_score']}, '{game_date} 19:00:00', 'final', 'regular')  -- {g['opponent_name']} {g['opponent_score']}, {g['team_name']} {g['team_score']} [{g['opponent_class']}]")
        print(',\n'.join(values) + ';')
    
    # Unknown opponents
    if games_5a_d1_vs_unknown:
        print("\n" + "=" * 80)
        print("5A-D1 vs UNKNOWN OPPONENTS (need IDs after adding teams):")
        print("=" * 80)
        for g in games_5a_d1_vs_unknown:
            if g['is_home']:
                print(f"-- ({g['team_id']}, ???, {g['team_score']}, {g['opponent_score']}, '{game_date} 19:00:00', 'final', 'regular')  -- {g['team_name']} {g['team_score']}, {g['opponent_name']} {g['opponent_score']} [{g['result']}]")
            else:
                print(f"-- (???, {g['team_id']}, {g['opponent_score']}, {g['team_score']}, '{game_date} 19:00:00', 'final', 'regular')  -- {g['opponent_name']} {g['opponent_score']}, {g['team_name']} {g['team_score']} [{g['result']}]")
    
    return {
        '5a_d1_vs_5a_d1': games_5a_d1_vs_5a_d1,
        '5a_d1_vs_known': games_5a_d1_vs_known,
        '5a_d1_vs_unknown': games_5a_d1_vs_unknown,
        'unknown_opponents': unknown_opponents
    }


# =============================================================================
# PASTE SCORES HERE - Change GAME_DATE and SCORES for each week
# =============================================================================
if __name__ == "__main__":
    GAME_DATE = "2025-09-19"  # Week 4
    
    SCORES = """
A&M Consolidated 38, College Station 21
Chisholm Trail 63, Trimble Tech 3
Cleburne 27, Port Arthur Memorial 17
Denton 35, Azle 23
Flour Bluff 79, Donna 0
Frisco 56, Heritage 28
Lone Star 47, Centennial 0
Lufkin 28, Tyler 21
Madison 26, Westbury 7
McKinney North 33, Sherman 14
New Braunfels 35, MacArthur 7
Nixon 22, Southside 18
Paschal 59, North Side 0
Pieper 48, Wagner 13
Richland 42, Brewer 14
Seguin 38, Victoria East 21
Smithson Valley 41, Boerne-Champion 14
South San Antonio 50, Cigarroa 9
Vela 49, Mission 3
Veterans Memorial 57, Donna North 7
Weiss 87, Lehman 0
West Mesquite 48, North Mesquite 13
Ball 49, Westside 7
Hanks 24, Horizon 13
Highland Park 58, Pulaski Academy 26
Lancaster 30, Horn 14
Monterey 49, Odessa 21
Palo Duro 35, Amarillo 14
Red Oak 39, Ellison 26
San Angelo Central 49, Belton 21
Seguin 28, Grapevine 25
West Brook 49, Silsbee 14
Ysleta 52, Mountain View 15
Legacy 42, Abilene 28
Emerson 31, Denison 21
Fulshear 49, Centennial 14
Lake View 50, Lubbock 49
Laredo LBJ 28, Veterans Memorial 27
Alexander 17, Veterans Memorial 2
Canyon Lake 49, Veterans Memorial 14
"""
    
    process_scores(SCORES, GAME_DATE)
