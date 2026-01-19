from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any

router = APIRouter(prefix="/api/v1", tags=["players"])

# Joshua 2025-26 Season - REAL STATS from PDF
JOSHUA_PLAYERS: Dict[str, Dict[str, Any]] = {
    "1": {
        "number": "1", "name": "Aaron Martinez", "position": "Slot", "class": "Senior", 
        "height": "5'10\"", "weight": "165 lbs",
        "stats": {"receptions": 3, "receiving_yards": 36, "receiving_tds": 0, "receiving_avg": 12.0}
    },
    "4": {
        "number": "4", "name": "Malachi Berry", "position": "WR", "class": "Senior", 
        "height": "6'1\"", "weight": "180 lbs",
        "stats": {
            "rushing_yards": 99, "rushing_tds": 0, "rushing_attempts": 12, "rushing_avg": 8.25,
            "receptions": 1, "receiving_yards": 33, "receiving_tds": 1, "receiving_avg": 33.0
        }
    },
    "6": {
        "number": "6", "name": "Joe Strother", "position": "RB", "class": "Senior", 
        "height": "5'10\"", "weight": "185 lbs",
        "stats": {"rushing_yards": 249, "rushing_tds": 3, "rushing_attempts": 62, "rushing_avg": 4.02, "rushing_long": 41}
    },
    "8": {
        "number": "8", "name": "Lucas Liles", "position": "Slot", "class": "Sophomore", 
        "height": "5'11\"", "weight": "170 lbs",
        "stats": {
            "rushing_yards": 29, "rushing_tds": 0, "rushing_attempts": 13, "rushing_avg": 2.23,
            "receptions": 1, "receiving_yards": 27, "receiving_tds": 0, "receiving_avg": 27.0
        }
    },
    "9": {
        "number": "9", "name": "Brayden Payne", "position": "QB", "class": "Senior", 
        "height": "6'2\"", "weight": "195 lbs", "gpa": "3.8",
        "stats": {
            "passing_yards": 115, "passing_tds": 2, "passing_completions": 10, "passing_attempts": 26,
            "passing_completion_pct": 38.5, "passing_ints": 0,
            "rushing_yards": 237, "rushing_tds": 2, "rushing_attempts": 76, "rushing_avg": 3.12
        }
    },
    "10": {
        "number": "10", "name": "Cash Criner", "position": "Slot", "class": "Junior", 
        "height": "5'10\"", "weight": "165 lbs",
        "stats": {
            "rushing_yards": 316, "rushing_tds": 1, "rushing_attempts": 41, "rushing_avg": 7.71, "rushing_long": 52,
            "receptions": 2, "receiving_yards": 6, "receiving_tds": 0, "receiving_avg": 3.0
        }
    },
    "12": {
        "number": "12", "name": "Colin Leeman", "position": "WR", "class": "Senior", 
        "height": "6'0\"", "weight": "175 lbs"
    },
    "14": {
        "number": "14", "name": "Jacob Allred", "position": "Slot", "class": "Sophomore", 
        "height": "5'9\"", "weight": "155 lbs"
    },
    "16": {
        "number": "16", "name": "Don Burrell", "position": "QB", "class": "Junior", 
        "height": "6'1\"", "weight": "190 lbs",
        "stats": {
            "passing_yards": 28, "passing_tds": 0, "passing_completions": 1, "passing_attempts": 9,
            "passing_completion_pct": 11.1, "passing_ints": 1,
            "rushing_yards": 35, "rushing_tds": 1, "rushing_attempts": 5, "rushing_avg": 7.0
        }
    },
    "17": {
        "number": "17", "name": "Trey Pennell", "position": "DB", "class": "Senior", 
        "height": "6'0\"", "weight": "180 lbs",
        "stats": {"receptions": 3, "receiving_yards": 40, "receiving_tds": 0, "receiving_avg": 13.3}
    },
    "18": {
        "number": "18", "name": "Ryan Winsett", "position": "Slot", "class": "Junior", 
        "height": "5'10\"", "weight": "165 lbs"
    },
    "20": {
        "number": "20", "name": "Max Mata", "position": "DB", "class": "Junior", 
        "height": "5'10\"", "weight": "170 lbs",
        "stats": {"rushing_yards": 3, "rushing_tds": 0, "rushing_attempts": 3, "rushing_avg": 1.0}
    },
    "21": {
        "number": "21", "name": "Esteban Salas", "position": "RB", "class": "Junior", 
        "height": "5'11\"", "weight": "180 lbs",
        "stats": {"rushing_yards": 382, "rushing_tds": 3, "rushing_attempts": 74, "rushing_avg": 5.16, "rushing_long": 95}
    },
    "22": {
        "number": "22", "name": "Colin O'Callahan", "position": "Slot", "class": "Sophomore", 
        "height": "5'9\"", "weight": "160 lbs"
    },
    "23": {
        "number": "23", "name": "Bentley Beltran", "position": "Slot", "class": "Junior", 
        "height": "5'10\"", "weight": "165 lbs",
        "stats": {"rushing_yards": 15, "rushing_tds": 0, "rushing_attempts": 1, "rushing_avg": 15.0}
    },
    "26": {
        "number": "26", "name": "Taji Matthews", "position": "RB", "class": "Senior", 
        "height": "5'10\"", "weight": "190 lbs", "gpa": "3.5",
        "stats": {"rushing_yards": 281, "rushing_tds": 4, "rushing_attempts": 66, "rushing_avg": 4.26, "rushing_long": 46}
    },
    "27": {
        "number": "27", "name": "Tyler Evans", "position": "RB", "class": "Junior", 
        "height": "5'11\"", "weight": "185 lbs",
        "stats": {"rushing_yards": 26, "rushing_tds": 0, "rushing_attempts": 6, "rushing_avg": 4.33}
    },
    "30": {
        "number": "30", "name": "Granger Quinn", "position": "K", "class": "Junior", 
        "height": "5'11\"", "weight": "170 lbs",
        "stats": {
            "fg_made": 2, "fg_attempts": 2, "fg_pct": 100.0, "fg_long": 49,
            "xp_made": 12, "xp_attempts": 15,
            "punt_yards": 527, "punts": 17, "punt_avg": 31.0
        }
    },
    "31": {
        "number": "31", "name": "Ishmel Robles", "position": "K", "class": "Sophomore", 
        "height": "5'10\"", "weight": "165 lbs",
        "stats": {"xp_made": 3, "xp_attempts": 3}
    },
    "40": {
        "number": "40", "name": "Carson Kilcoin", "position": "K", "class": "Senior", 
        "height": "6'0\"", "weight": "175 lbs",
        "stats": {"xp_made": 1, "xp_attempts": 1}
    },
    "81": {
        "number": "81", "name": "Luther Matt", "position": "K", "class": "Sophomore", 
        "height": "5'11\"", "weight": "170 lbs",
        "stats": {
            "rushing_yards": 5, "rushing_tds": 0, "rushing_attempts": 1, "rushing_avg": 5.0,
            "fg_made": 1, "fg_attempts": 1, "fg_pct": 100.0, "fg_long": 31
        }
    },
}

# Add all other players without offensive stats
REMAINING_PLAYERS = {
    "0": {"number": "0", "name": "Eryk Martinez", "position": "LB", "class": "Junior", "height": "6'0\"", "weight": "185 lbs"},
    "2": {"number": "2", "name": "JD Smith", "position": "DL", "class": "Senior", "height": "6'2\"", "weight": "245 lbs"},
    "3": {"number": "3", "name": "Dre Wilson", "position": "DB", "class": "Junior", "height": "5'11\"", "weight": "175 lbs"},
    "5": {"number": "5", "name": "Alex Rubacalba", "position": "Slot", "class": "Junior", "height": "5'9\"", "weight": "160 lbs",
          "stats": {"rushing_yards": 50, "rushing_tds": 0, "rushing_attempts": 11, "rushing_avg": 4.55, "receptions": 1, "receiving_yards": 1, "receiving_tds": 1, "receiving_avg": 1.0}},
    "7": {"number": "7", "name": "Jaxon Wells", "position": "LB", "class": "Junior", "height": "6'0\"", "weight": "190 lbs"},
    "11": {"number": "11", "name": "Gavin McManus", "position": "DL", "class": "Senior", "height": "6'3\"", "weight": "260 lbs"},
    "13": {"number": "13", "name": "John Pigg", "position": "LB", "class": "Junior", "height": "6'1\"", "weight": "200 lbs"},
    "15": {"number": "15", "name": "Kade Boone", "position": "DB", "class": "Junior", "height": "5'11\"", "weight": "170 lbs"},
    "19": {"number": "19", "name": "Dylan Spann", "position": "TE", "class": "Senior", "height": "6'3\"", "weight": "210 lbs"},
    "24": {"number": "24", "name": "Sergio Mata", "position": "DB", "class": "Senior", "height": "5'11\"", "weight": "175 lbs"},
    "25": {"number": "25", "name": "Jayden Lottie", "position": "DB", "class": "Junior", "height": "6'0\"", "weight": "180 lbs"},
    "28": {"number": "28", "name": "Tony Coleman", "position": "LB", "class": "Senior", "height": "6'1\"", "weight": "205 lbs"},
    "32": {"number": "32", "name": "Max Neil", "position": "DB", "class": "Junior", "height": "6'0\"", "weight": "175 lbs"},
    "34": {"number": "34", "name": "Elijah Alvarez", "position": "DL", "class": "Senior", "height": "6'2\"", "weight": "240 lbs"},
    "35": {"number": "35", "name": "Ethan Phan", "position": "LB", "class": "Junior", "height": "5'11\"", "weight": "185 lbs"},
    "36": {"number": "36", "name": "Nathan Shuler", "position": "TE", "class": "Senior", "height": "6'4\"", "weight": "220 lbs"},
    "38": {"number": "38", "name": "Jaelynn Wilson", "position": "DL", "class": "Junior", "height": "6'1\"", "weight": "235 lbs"},
    "41": {"number": "41", "name": "Jesse Soto", "position": "DL", "class": "Junior", "height": "6'2\"", "weight": "250 lbs"},
    "42": {"number": "42", "name": "Will Lentz", "position": "DL", "class": "Senior", "height": "6'3\"", "weight": "255 lbs"},
    "44": {"number": "44", "name": "Aiden Buck", "position": "DL", "class": "Junior", "height": "6'1\"", "weight": "240 lbs"},
    "45": {"number": "45", "name": "Colin Haught", "position": "DL", "class": "Senior", "height": "6'2\"", "weight": "245 lbs"},
    "54": {"number": "54", "name": "Dylan Lummus", "position": "OL", "class": "Senior", "height": "6'3\"", "weight": "270 lbs"},
    "55": {"number": "55", "name": "Roger Cruz", "position": "OL", "class": "Junior", "height": "6'2\"", "weight": "265 lbs"},
    "56": {"number": "56", "name": "Trent Meyer", "position": "OL", "class": "Senior", "height": "6'4\"", "weight": "280 lbs"},
    "58": {"number": "58", "name": "Alex Jiminez", "position": "OL", "class": "Junior", "height": "6'3\"", "weight": "275 lbs"},
    "62": {"number": "62", "name": "Gustavo Blacno", "position": "OL", "class": "Senior", "height": "6'2\"", "weight": "260 lbs"},
    "64": {"number": "64", "name": "Carson Childress", "position": "OL", "class": "Junior", "height": "6'4\"", "weight": "285 lbs"},
    "65": {"number": "65", "name": "Adam Bowers", "position": "OL", "class": "Senior", "height": "6'3\"", "weight": "270 lbs"},
    "70": {"number": "70", "name": "Bohlden Tholkes", "position": "OL", "class": "Junior", "height": "6'5\"", "weight": "295 lbs"},
    "72": {"number": "72", "name": "Louis King", "position": "OL", "class": "Senior", "height": "6'3\"", "weight": "275 lbs"},
    "76": {"number": "76", "name": "Cooper Wyatt", "position": "OL", "class": "Junior", "height": "6'4\"", "weight": "280 lbs"},
    "77": {"number": "77", "name": "Aiden Figueroa", "position": "OL", "class": "Senior", "height": "6'2\"", "weight": "265 lbs"},
    "80": {"number": "80", "name": "Michael Goins", "position": "DB", "class": "Junior", "height": "6'0\"", "weight": "175 lbs"},
    "86": {"number": "86", "name": "Arthur Knutson", "position": "TE", "class": "Senior", "height": "6'3\"", "weight": "215 lbs"},
    "90": {"number": "90", "name": "Mikey Duran", "position": "DL", "class": "Junior", "height": "6'2\"", "weight": "240 lbs"},
    "99": {"number": "99", "name": "Noah Shuler", "position": "OL", "class": "Senior", "height": "6'4\"", "weight": "290 lbs"},
}

# Merge remaining players
for num, player in REMAINING_PLAYERS.items():
    if num not in JOSHUA_PLAYERS:
        JOSHUA_PLAYERS[num] = player

@router.get("/players/{player_id}")
def get_player(player_id: str):
    """
    Get a specific player by ID (jersey number)
    """
    # Extract number from player_id
    if player_id.startswith("player_"):
        number = player_id.replace("player_", "")
    elif player_id.isdigit():
        number = player_id
    else:
        # Try to find by name slug
        name_slug = player_id.replace("-", " ").lower()
        for num, player in JOSHUA_PLAYERS.items():
            if player["name"].lower() == name_slug:
                number = num
                break
        else:
            raise HTTPException(status_code=404, detail="Player not found")
    
    player = JOSHUA_PLAYERS.get(number)
    if not player:
        raise HTTPException(status_code=404, detail="Player not found")
    
    # Add team info
    result = {
        **player,
        "id": f"player_{number}",
        "team": "Joshua",
        "mascot": "Owls",
        "gpa": player.get("gpa", "N/A")
    }
    
    return result

@router.get("/players")
def list_players(team: Optional[str] = None):
    """
    List all players
    """
    players = []
    for number, player in JOSHUA_PLAYERS.items():
        players.append({
            **player,
            "id": f"player_{number}",
            "team": "Joshua",
            "mascot": "Owls"
        })
    
    return players
