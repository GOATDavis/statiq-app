#!/usr/bin/env python3
"""
StatIQ 5A-D1 Game Import Script v2
Updated with all current team IDs from database
"""

import re
from datetime import datetime

# =============================================================================
# CONFIGURATION - Update these for each week
# =============================================================================
GAME_DATE = "2025-09-12"  # Week 3 example
WEEK_NUMBER = 3

# Paste ALL scores from SI.com here (copy entire page)
SCORES = """
PASTE SCORES HERE - one per line like:
Aledo 54, Brewer 7
Highland Park 42, Dallas Jesuit 14
"""

# =============================================================================
# 5A-D1 TEAMS - All teams from database with IDs
# =============================================================================
TEAMS_5A_D1 = {
    # Team name variations -> (db_id, official_name)
    "abilene": (35, "Abilene"),
    "aledo": (36, "Aledo"),
    "amarillo": (37, "Amarillo"),
    "caprock": (310, "Amarillo Caprock"),
    "amarillo caprock": (310, "Amarillo Caprock"),
    "tascosa": (228, "Amarillo Tascosa"),
    "amarillo tascosa": (228, "Amarillo Tascosa"),
    "a&m consolidated": (34, "A&M Consolidated"),
    "a&m": (34, "A&M Consolidated"),
    "consol": (34, "A&M Consolidated"),
    "americas": (38, "Americas"),
    "ep americas": (283, "El Paso Americas"),
    "el paso americas": (283, "El Paso Americas"),
    "anderson": (39, "Anderson"),  # Could be Austin Anderson too
    "austin anderson": (226, "Austin Anderson"),
    "angleton": (40, "Angleton"),
    "azle": (180, "Azle"),
    "barbers hill": (42, "Barbers Hill"),
    "baytown sterling": (277, "Baytown Sterling"),
    "sterling": (277, "Baytown Sterling"),
    "beaumont united": (43, "Beaumont United"),
    "united": (43, "Beaumont United"),
    "west brook": (271, "Beaumont West Brook"),
    "beaumont west brook": (271, "Beaumont West Brook"),
    "bel air": (44, "Bel Air"),
    "el paso bel air": (252, "El Paso Bel Air"),
    "birdville": (186, "Birdville"),
    "boerne champion": (158, "Boerne Champion"),
    "boerne-champion": (158, "Boerne Champion"),
    "champion": (158, "Boerne Champion"),
    "brewer": (46, "Brewer"),
    "ft worth brewer": (249, "White Settlement Brewer"),
    "brownsville rivera": (245, "Brownsville Rivera"),
    "rivera": (245, "Brownsville Rivera"),
    "buda hays": (312, "Buda Hays"),
    "hays": (312, "Buda Hays"),
    "creekview": (258, "Carrollton Creekview"),
    "carrollton creekview": (258, "Carrollton Creekview"),
    "smith": (275, "Carrollton Smith"),
    "carrollton smith": (275, "Carrollton Smith"),
    "turner": (289, "Carrollton Turner"),
    "carrollton turner": (289, "Carrollton Turner"),
    "cedar creek": (232, "Cedar Creek"),
    "cedar park": (47, "Cedar Park"),
    "centennial": (5, "Centennial"),
    "burleson centennial": (5, "Centennial"),
    "frisco centennial": (295, "Frisco Centennial"),
    "chisholm trail": (48, "Chisholm Trail"),
    "saginaw chisholm trail": (236, "Saginaw Chisholm Trail"),
    "cleburne": (6, "Cleburne"),
    "college station": (49, "College Station"),
    "flour bluff": (298, "Corpus Christi Flour Bluff"),
    "cc flour bluff": (298, "Corpus Christi Flour Bluff"),
    "corpus christi flour bluff": (298, "Corpus Christi Flour Bluff"),
    "cc veterans memorial": (234, "Corpus Christi Veterans Memorial"),
    "corpus christi veterans memorial": (234, "Corpus Christi Veterans Memorial"),
    "crosby": (52, "Crosby"),
    "dallas adams": (282, "Dallas Adams"),
    "adams": (282, "Dallas Adams"),
    "highland park": (215, "Dallas Highland Park"),
    "dallas highland park": (215, "Dallas Highland Park"),
    "hp": (215, "Dallas Highland Park"),
    "molina": (272, "Dallas Molina"),
    "dallas molina": (272, "Dallas Molina"),
    "sunset": (309, "Dallas Sunset"),
    "dallas sunset": (309, "Dallas Sunset"),
    "white": (216, "Dallas White"),
    "dallas white": (216, "Dallas White"),
    "denton": (181, "Denton"),
    "ryan": (79, "Denton Ryan"),
    "denton ryan": (79, "Denton Ryan"),
    "donna": (165, "Donna"),
    "donna north": (169, "Donna North"),
    "eagle pass winn": (276, "Eagle Pass Winn"),
    "winn": (276, "Eagle Pass Winn"),
    "east view": (53, "East View"),
    "georgetown east view": (303, "Georgetown East View"),
    "vela": (291, "Edinburg Vela"),
    "edinburg vela": (291, "Edinburg Vela"),
    "el dorado": (54, "El Dorado"),
    "el paso el dorado": (294, "El Paso El Dorado"),
    "parkland": (300, "El Paso Parkland"),
    "el paso parkland": (300, "El Paso Parkland"),
    "kempner": (220, "Fort Bend Kempner"),
    "fort bend kempner": (220, "Fort Bend Kempner"),
    "arlington heights": (274, "Fort Worth Arlington Heights"),
    "ft worth arlington heights": (274, "Fort Worth Arlington Heights"),
    "north side": (233, "Fort Worth North Side"),
    "ft worth north side": (233, "Fort Worth North Side"),
    "paschal": (265, "Fort Worth Paschal"),
    "ft worth paschal": (265, "Fort Worth Paschal"),
    "polytechnic": (255, "Fort Worth Polytechnic"),
    "poly": (255, "Fort Worth Polytechnic"),
    "south hills": (217, "Fort Worth South Hills"),
    "trimble tech": (238, "Fort Worth Trimble Tech"),
    "wyatt": (288, "Fort Worth Wyatt"),
    "fossil ridge": (184, "Fossil Ridge"),
    "keller fossil ridge": (222, "Keller Fossil Ridge"),
    "friendswood": (56, "Friendswood"),
    "frisco": (57, "Frisco"),
    "heritage": (214, "Frisco Heritage"),
    "frisco heritage": (214, "Frisco Heritage"),
    "lebanon trail": (250, "Frisco Lebanon Trail"),
    "frisco lebanon trail": (250, "Frisco Lebanon Trail"),
    "lone star": (251, "Frisco Lone Star"),
    "frisco lone star": (251, "Frisco Lone Star"),
    "reedy": (229, "Frisco Reedy"),
    "frisco reedy": (229, "Frisco Reedy"),
    "wakeland": (263, "Frisco Wakeland"),
    "frisco wakeland": (263, "Frisco Wakeland"),
    "galena park": (58, "Galena Park"),
    "ball": (260, "Galveston Ball"),
    "galveston ball": (260, "Galveston Ball"),
    "georgetown": (59, "Georgetown"),
    "granbury": (185, "Granbury"),
    "harlingen south": (60, "Harlingen South"),
    "houston austin": (261, "Houston Austin"),
    "madison": (311, "Houston Madison"),
    "houston madison": (311, "Houston Madison"),
    "milby": (224, "Houston Milby"),
    "houston milby": (224, "Houston Milby"),
    "sharpstown": (278, "Houston Sharpstown"),
    "spring woods": (218, "Houston Spring Woods"),
    "houston sterling": (254, "Houston Sterling"),
    "waltrip": (281, "Houston Waltrip"),
    "houston waltrip": (281, "Houston Waltrip"),
    "westbury": (223, "Houston Westbury"),
    "houston westbury": (223, "Houston Westbury"),
    "joshua": (16, "Joshua"),
    "chaparral": (269, "Killeen Chaparral"),
    "killeen chaparral": (269, "Killeen Chaparral"),
    "kingwood park": (287, "Kingwood Park"),
    "lehman": (235, "Kyle Lehman"),
    "kyle lehman": (235, "Kyle Lehman"),
    "juarez-lincoln": (264, "La Joya Juarez-Lincoln"),
    "palmview": (299, "La Joya Palmview"),
    "la joya palmview": (299, "La Joya Palmview"),
    "lake belton": (63, "Lake Belton"),
    "lancaster": (183, "Lancaster"),
    "la porte": (62, "La Porte"),
    "laporte": (62, "La Porte"),
    "cigarroa": (305, "Laredo Cigarroa"),
    "laredo cigarroa": (305, "Laredo Cigarroa"),
    "laredo martin": (256, "Laredo Martin"),
    "nixon": (284, "Laredo Nixon"),
    "laredo nixon": (284, "Laredo Nixon"),
    "leander": (131, "Leander"),
    "glenn": (297, "Leander Glenn"),
    "leander glenn": (297, "Leander Glenn"),
    "rouse": (240, "Leander Rouse"),
    "leander rouse": (240, "Leander Rouse"),
    "lockhart": (230, "Lockhart"),
    "lubbock": (192, "Lubbock"),
    "coronado": (244, "Lubbock Coronado"),
    "lubbock coronado": (244, "Lubbock Coronado"),
    "monterey": (292, "Lubbock Monterey"),
    "lubbock monterey": (292, "Lubbock Monterey"),
    "lufkin": (19, "Lufkin"),
    "mcallen": (66, "McAllen"),
    "mcallen memorial": (67, "McAllen Memorial"),
    "mcallen rowe": (262, "McAllen Rowe"),
    "rowe": (262, "McAllen Rowe"),
    "mckinney north": (293, "McKinney North"),
    "midlothian": (22, "Midlothian"),
    "mission": (68, "Mission"),
    "new braunfels": (70, "New Braunfels"),
    "new caney porter": (241, "New Caney Porter"),
    "porter": (241, "New Caney Porter"),
    "newman smith": (71, "Newman Smith"),
    "north mesquite": (73, "North Mesquite"),
    "n mesquite": (73, "North Mesquite"),
    "north richland hills birdville": (266, "North Richland Hills Birdville"),
    "nrh richland": (268, "North Richland Hills Richland"),
    "richland": (268, "North Richland Hills Richland"),
    "pasadena": (285, "Pasadena"),
    "hendrickson": (302, "Pflugerville Hendrickson"),
    "pflugerville hendrickson": (302, "Pflugerville Hendrickson"),
    "weiss": (290, "Pflugerville Weiss"),
    "pflugerville weiss": (290, "Pflugerville Weiss"),
    "pieper": (76, "Pieper"),
    "port arthur memorial": (23, "Port Arthur Memorial"),
    "pa memorial": (23, "Port Arthur Memorial"),
    "psja memorial": (286, "PSJA Memorial"),
    "psja veterans memorial": (286, "PSJA Memorial"),
    "psja north": (257, "PSJA North"),
    "pharr north": (257, "PSJA North"),
    "red oak": (25, "Red Oak"),
    "rio grande city": (177, "Rio Grande City"),
    "saginaw": (80, "Saginaw"),
    "sa jay": (227, "San Antonio Jay"),
    "san antonio jay": (227, "San Antonio Jay"),
    "jay": (227, "San Antonio Jay"),
    "sa macarthur": (246, "San Antonio MacArthur"),
    "san antonio macarthur": (246, "San Antonio MacArthur"),
    "macarthur": (246, "San Antonio MacArthur"),
    "southside": (304, "San Antonio Southside"),
    "sa southside": (304, "San Antonio Southside"),
    "san antonio southside": (304, "San Antonio Southside"),
    "southwest": (267, "San Antonio Southwest"),
    "sa southwest": (267, "San Antonio Southwest"),
    "wagner": (242, "San Antonio Wagner"),
    "sa wagner": (242, "San Antonio Wagner"),
    "san antonio wagner": (242, "San Antonio Wagner"),
    "seguin": (29, "Seguin"),
    "sherman": (248, "Sherman"),
    "smithson valley": (81, "Smithson Valley"),
    "south san antonio": (152, "South San Antonio"),
    "south san": (152, "South San Antonio"),
    "southwest legacy": (153, "Southwest Legacy"),
    "tyler": (31, "Tyler"),
    "tyler legacy": (32, "Tyler Legacy"),
    "victoria east": (128, "Victoria East"),
    "west mesquite": (90, "West Mesquite"),
    "w mesquite": (90, "West Mesquite"),
    
    # El Paso teams added
    "hanks": (355, "El Paso Hanks"),
    "el paso hanks": (355, "El Paso Hanks"),
    "irvin": (356, "El Paso Irvin"),
    "el paso irvin": (356, "El Paso Irvin"),
    "montwood": (357, "El Paso Montwood"),
    "el paso montwood": (357, "El Paso Montwood"),
    "burges": (358, "El Paso Burges"),
    "el paso burges": (358, "El Paso Burges"),
    "ysleta": (359, "El Paso Ysleta"),
    "el paso ysleta": (359, "El Paso Ysleta"),
    "eastwood": (360, "El Paso Eastwood"),
    "el paso eastwood": (360, "El Paso Eastwood"),
    "canutillo": (361, "Canutillo"),
    "del valle": (362, "Del Valle"),
    "ep del valle": (362, "Del Valle"),
    "san angelo central": (363, "San Angelo Central"),
    "sa central": (363, "San Angelo Central"),
    "central": (363, "San Angelo Central"),
    "roma": (364, "Roma"),
}

# Known non-5A-D1 opponents with IDs and classifications
KNOWN_OPPONENTS = {
    "argyle": (368, "5A-D2"),
    "boerne": (367, "5A-D2"),
    "dekaney": (366, "6A"),
    "haltom": (377, "5A-D2"),
    "lake dallas": (387, "5A-D2"),
    "pebble hills": (382, "6A"),
    "united south": (374, "6A"),
    "grapevine": (373, "5A-D2"),
    "horizon": (426, "5A-D2"),
    "mountain view": (427, "5A-D2"),
    "silsbee": (429, "4A-D1"),
    "belton": (129, "6A"),
    "longview": (142, "6A"),
    "abilene cooper": (453, "6A"),
    "zapata": (455, "4A-D1"),
    "somerset": (146, "4A-D1"),
    "edcouch-elsa": (173, "4A-D1"),
    "st. john bosco": (384, "Out of State"),
    "princeton": (454, "5A-D2"),
    "denison": (414, "5A-D2"),
    "forney": (402, "6A"),
    "dallas jesuit": (406, "6A"),
    "jesuit": (406, "6A"),
    "the colony": (433, "5A-D2"),
    "midland legacy": (188, "6A"),
    "legacy": (188, "6A"),
    "dripping springs": (468, "6A"),
    "clemens": (469, "6A"),
    "sa clemens": (469, "6A"),
    "harlan": (470, "6A"),
    "sa harlan": (470, "6A"),
    "johnson": (471, "6A"),
    "sa johnson": (471, "6A"),
    "victoria west": (473, "5A-D2"),
    "weatherford": (485, "6A"),
    "ennis": (11, "6A"),
    "cedar hill": (4, "6A"),
    "hebron": (488, "6A"),
    "san marcos": (489, "6A"),
    "brazoswood": (396, "5A-D2"),
    "harlingen": (413, "5A-D2"),
    "del rio": (420, "5A-D2"),
    "fort bend hightower": (421, "6A"),
    "odessa": (198, "6A"),
    "medina valley": (386, "5A-D2"),
    "little rock southwest": (144, "Out of State"),
    "el paso chapin": (458, "6A"),
    "chapin": (458, "6A"),
    "nacogdoches": (143, "4A-D1"),
    "lumberton": (482, "4A-D1"),
    "canyon": (483, "5A-D2"),
    "texas city": (457, "5A-D2"),
    "magnolia": (405, "5A-D2"),
    "edinburg": (412, "5A-D2"),
    "weslaco east": (167, "5A-D2"),
    "mercedes": (410, "5A-D2"),
    "palmview": (176, "5A-D2"),
    "sa houston": (491, "4A-D1"),
    "houston": (491, "4A-D1"),
    "sa churchill": (492, "6A"),
    "churchill": (492, "6A"),
    "sa macarthur": (490, "6A"),
    "aledo": (36, "5A-D1"),  # Actually 5A-D1 but list for matching
}

def normalize_team_name(name):
    """Normalize team name for matching"""
    name = name.lower().strip()
    # Remove common prefixes/suffixes
    name = re.sub(r'^(el paso|fort worth|ft worth|ft\.|san antonio|sa|corpus christi|cc|dallas|houston|frisco)\s+', '', name)
    name = re.sub(r'\s+(high school|hs)$', '', name)
    return name

def parse_score_line(line):
    """Parse a score line like 'Aledo 54, Brewer 7' """
    # Match patterns like "Team1 XX, Team2 YY" or "Team1 XX Team2 YY"
    pattern = r'^(.+?)\s+(\d+),?\s+(.+?)\s+(\d+)$'
    match = re.match(pattern, line.strip())
    if match:
        team1 = match.group(1).strip()
        score1 = int(match.group(2))
        team2 = match.group(3).strip()
        score2 = int(match.group(4))
        return (team1, score1, team2, score2)
    return None

def find_team(name):
    """Find team in our databases"""
    norm_name = normalize_team_name(name)
    
    # Check 5A-D1 teams first
    if norm_name in TEAMS_5A_D1:
        team_id, official_name = TEAMS_5A_D1[norm_name]
        return (team_id, official_name, "5A-D1")
    
    # Check known opponents
    if norm_name in KNOWN_OPPONENTS:
        team_id, classification = KNOWN_OPPONENTS[norm_name]
        return (team_id, name, classification)
    
    # Try original name in lowercase
    name_lower = name.lower().strip()
    if name_lower in TEAMS_5A_D1:
        team_id, official_name = TEAMS_5A_D1[name_lower]
        return (team_id, official_name, "5A-D1")
    
    if name_lower in KNOWN_OPPONENTS:
        team_id, classification = KNOWN_OPPONENTS[name_lower]
        return (team_id, name, classification)
    
    return None

def main():
    games_5a_d1_vs_5a_d1 = []
    games_5a_d1_vs_known = []
    games_5a_d1_vs_unknown = []
    unknown_teams = set()
    
    for line in SCORES.strip().split('\n'):
        line = line.strip()
        if not line or line.startswith('#') or line.startswith('PASTE'):
            continue
            
        parsed = parse_score_line(line)
        if not parsed:
            continue
            
        team1_name, score1, team2_name, score2 = parsed
        
        team1_info = find_team(team1_name)
        team2_info = find_team(team2_name)
        
        # Check if at least one team is 5A-D1
        team1_is_5ad1 = team1_info and team1_info[2] == "5A-D1"
        team2_is_5ad1 = team2_info and team2_info[2] == "5A-D1"
        
        if not team1_is_5ad1 and not team2_is_5ad1:
            continue  # Neither team is 5A-D1, skip
        
        # Both 5A-D1
        if team1_is_5ad1 and team2_is_5ad1:
            games_5a_d1_vs_5a_d1.append({
                'home_id': team1_info[0],
                'away_id': team2_info[0],
                'home_score': score1,
                'away_score': score2,
                'home_name': team1_info[1],
                'away_name': team2_info[1]
            })
        # One is 5A-D1, other is known
        elif (team1_is_5ad1 and team2_info) or (team2_is_5ad1 and team1_info):
            if team1_is_5ad1:
                d1_team = team1_info
                d1_score = score1
                other_team = team2_info
                other_score = score2
                other_name = team2_name
            else:
                d1_team = team2_info
                d1_score = score2
                other_team = team1_info
                other_score = score1
                other_name = team1_name
            
            games_5a_d1_vs_known.append({
                'd1_id': d1_team[0],
                'd1_name': d1_team[1],
                'd1_score': d1_score,
                'opp_id': other_team[0],
                'opp_name': other_team[1],
                'opp_score': other_score,
                'opp_class': other_team[2],
                'is_home': team1_is_5ad1
            })
        # One is 5A-D1, other is unknown
        else:
            if team1_is_5ad1:
                d1_team = team1_info
                d1_score = score1
                unknown_name = team2_name
                unknown_score = score2
                is_home = True
            else:
                d1_team = team2_info
                d1_score = score2
                unknown_name = team1_name
                unknown_score = score1
                is_home = False
            
            games_5a_d1_vs_unknown.append({
                'd1_id': d1_team[0],
                'd1_name': d1_team[1],
                'd1_score': d1_score,
                'unknown_name': unknown_name,
                'unknown_score': unknown_score,
                'is_home': is_home,
                'won': d1_score > unknown_score
            })
            unknown_teams.add(unknown_name)
    
    # Output results
    print("=" * 80)
    print(f"WEEK {WEEK_NUMBER} ANALYSIS: {GAME_DATE}")
    print("=" * 80)
    print(f"\n5A-D1 vs 5A-D1 games: {len(games_5a_d1_vs_5a_d1)}")
    print(f"5A-D1 vs Known Opponents: {len(games_5a_d1_vs_known)}")
    print(f"5A-D1 vs Unknown Opponents: {len(games_5a_d1_vs_unknown)}")
    print(f"TOTAL 5A-D1 games: {len(games_5a_d1_vs_5a_d1) + len(games_5a_d1_vs_known) + len(games_5a_d1_vs_unknown)}")
    
    if unknown_teams:
        print("\n" + "=" * 80)
        print("UNKNOWN OPPONENTS - Need to add these teams first:")
        print("=" * 80)
        print("\n-- Add these teams (verify classifications!):")
        print("INSERT INTO teams (name, mascot, level, conference, wins, losses) VALUES")
        for i, team in enumerate(sorted(unknown_teams)):
            comma = "," if i < len(unknown_teams) - 1 else ""
            print(f"('{team}', 'TBD', 'High School', 'Unknown', 0, 0){comma}")
        print("ON CONFLICT (name) DO NOTHING;")
        print(f"\n-- Get IDs after adding:")
        teams_list = "', '".join(sorted(unknown_teams))
        print(f"SELECT id, name FROM teams WHERE name IN ('{teams_list}');")
    
    if games_5a_d1_vs_5a_d1:
        print("\n" + "=" * 80)
        print("5A-D1 vs 5A-D1 GAMES SQL:")
        print("=" * 80)
        print("\nINSERT INTO games (home_team_id, away_team_id, home_score, away_score, kickoff_at, status, game_type) VALUES")
        for i, g in enumerate(games_5a_d1_vs_5a_d1):
            comma = "," if i < len(games_5a_d1_vs_5a_d1) - 1 else ";"
            print(f"({g['home_id']}, {g['away_id']}, {g['home_score']}, {g['away_score']}, '{GAME_DATE} 19:00:00', 'final', 'regular'){comma}  -- {g['home_name']} {g['home_score']}, {g['away_name']} {g['away_score']}")
    
    if games_5a_d1_vs_known:
        print("\n" + "=" * 80)
        print("5A-D1 vs KNOWN OPPONENTS SQL:")
        print("=" * 80)
        print("\nINSERT INTO games (home_team_id, away_team_id, home_score, away_score, kickoff_at, status, game_type) VALUES")
        for i, g in enumerate(games_5a_d1_vs_known):
            comma = "," if i < len(games_5a_d1_vs_known) - 1 else ";"
            if g['is_home']:
                home_id, away_id = g['d1_id'], g['opp_id']
                home_score, away_score = g['d1_score'], g['opp_score']
                home_name, away_name = g['d1_name'], g['opp_name']
            else:
                home_id, away_id = g['opp_id'], g['d1_id']
                home_score, away_score = g['opp_score'], g['d1_score']
                home_name, away_name = g['opp_name'], g['d1_name']
            print(f"({home_id}, {away_id}, {home_score}, {away_score}, '{GAME_DATE} 19:00:00', 'final', 'regular'){comma}  -- {home_name} {home_score}, {away_name} {away_score} [{g['opp_class']}]")
    
    if games_5a_d1_vs_unknown:
        print("\n" + "=" * 80)
        print("5A-D1 vs UNKNOWN OPPONENTS (need IDs after adding teams):")
        print("=" * 80)
        for g in games_5a_d1_vs_unknown:
            result = "WIN" if g['won'] else "LOSS"
            if g['is_home']:
                print(f"-- ({g['d1_id']}, ???, {g['d1_score']}, {g['unknown_score']}, '{GAME_DATE} 19:00:00', 'final', 'regular')  -- {g['d1_name']} {g['d1_score']}, {g['unknown_name']} {g['unknown_score']} [{result}]")
            else:
                print(f"-- (???, {g['d1_id']}, {g['unknown_score']}, {g['d1_score']}, '{GAME_DATE} 19:00:00', 'final', 'regular')  -- {g['unknown_name']} {g['unknown_score']}, {g['d1_name']} {g['d1_score']} [{result}]")

if __name__ == "__main__":
    main()
