from fastapi import APIRouter, Query
from typing import List, Literal

router = APIRouter(prefix="/api/v1", tags=["search"])

# Data structures
class SearchResult:
    def __init__(self, type: str, id: str, name: str, **kwargs):
        self.type = type
        self.id = id
        self.name = name
        for key, value in kwargs.items():
            setattr(self, key, value)
    
    def to_dict(self):
        return {k: v for k, v in self.__dict__.items() if v is not None}

# Teams data
TEAMS = [
    {"id": "1", "name": "Highland Park", "mascot": "Scots", "district": "District 7-5A", "record": "8-2"},
    {"id": "2", "name": "Joshua", "mascot": "Owls", "district": "District 7-5A", "record": "4-3"},
    {"id": "3", "name": "Red Oak", "mascot": "Hawks", "district": "District 7-5A", "record": "4-4"},
    {"id": "4", "name": "Tyler", "mascot": "Lions", "district": "District 7-5A", "record": "2-6"},
    {"id": "5", "name": "Midlothian", "mascot": "Panthers", "district": "District 7-5A", "record": "5-3"},
    {"id": "6", "name": "Centennial", "mascot": "Titans", "district": "District 7-5A", "record": "3-5"},
    {"id": "7", "name": "Cleburne", "mascot": "Yellow Jackets", "district": "District 7-5A", "record": "1-8"},
]

# Joshua Roster
JOSHUA_PLAYERS = [
    {"number": "0", "name": "Eryk Martinez", "position": "LB"},
    {"number": "1", "name": "Aaron Martinez", "position": "Slot"},
    {"number": "2", "name": "JD Smith", "position": "DL"},
    {"number": "3", "name": "Dre Wilson", "position": "DB"},
    {"number": "4", "name": "Malachi Berry", "position": "WR"},
    {"number": "5", "name": "Alex Rubacalba", "position": "Slot"},
    {"number": "6", "name": "Joe Strother", "position": "RB"},
    {"number": "7", "name": "Jaxon Wells", "position": "LB"},
    {"number": "8", "name": "Lucas Liles", "position": "Slot"},
    {"number": "9", "name": "Brayden Payne", "position": "QB"},
    {"number": "10", "name": "Cash Criner", "position": "Slot"},
    {"number": "11", "name": "Gavin McManus", "position": "DL"},
    {"number": "12", "name": "Colin Leeman", "position": "WR"},
    {"number": "13", "name": "John Pigg", "position": "LB"},
    {"number": "14", "name": "Jacob Allred", "position": "Slot"},
    {"number": "15", "name": "Kade Boone", "position": "DB"},
    {"number": "16", "name": "Don Burrell", "position": "QB"},
    {"number": "17", "name": "Trey Pennell", "position": "DB"},
    {"number": "18", "name": "Ryan Winsett", "position": "Slot"},
    {"number": "19", "name": "Dylan Spann", "position": "TE"},
    {"number": "20", "name": "Max Mata", "position": "DB"},
    {"number": "21", "name": "Esteban Salas", "position": "RB"},
    {"number": "22", "name": "Colin O'Callahan", "position": "Slot"},
    {"number": "23", "name": "Bentley Beltran", "position": "Slot"},
    {"number": "24", "name": "Sergio Mata", "position": "DB"},
    {"number": "25", "name": "Jayden Lottie", "position": "DB"},
    {"number": "26", "name": "Taji Matthews", "position": "RB"},
    {"number": "27", "name": "Tyler Evans", "position": "RB"},
    {"number": "28", "name": "Tony Coleman", "position": "LB"},
    {"number": "30", "name": "Granger Quinn", "position": "K"},
    {"number": "31", "name": "Ishmel Robles", "position": "K"},
    {"number": "32", "name": "Max Neil", "position": "DB"},
    {"number": "34", "name": "Elijah Alvarez", "position": "DL"},
    {"number": "35", "name": "Ethan Phan", "position": "LB"},
    {"number": "36", "name": "Nathan Shuler", "position": "TE"},
    {"number": "38", "name": "Jaelynn Wilson", "position": "DL"},
    {"number": "40", "name": "Carson Kilcoin", "position": "K"},
    {"number": "41", "name": "Jesse Soto", "position": "DL"},
    {"number": "42", "name": "Will Lentz", "position": "DL"},
    {"number": "44", "name": "Aiden Buck", "position": "DL"},
    {"number": "45", "name": "Colin Haught", "position": "DL"},
    {"number": "54", "name": "Dylan Lummus", "position": "OL"},
    {"number": "55", "name": "Roger Cruz", "position": "OL"},
    {"number": "56", "name": "Trent Meyer", "position": "OL"},
    {"number": "58", "name": "Alex Jiminez", "position": "OL"},
    {"number": "62", "name": "Gustavo Blacno", "position": "OL"},
    {"number": "64", "name": "Carson Childress", "position": "OL"},
    {"number": "65", "name": "Adam Bowers", "position": "OL"},
    {"number": "70", "name": "Bohlden Tholkes", "position": "OL"},
    {"number": "72", "name": "Louis King", "position": "OL"},
    {"number": "76", "name": "Cooper Wyatt", "position": "OL"},
    {"number": "77", "name": "Aiden Figueroa", "position": "OL"},
    {"number": "80", "name": "Michael Goins", "position": "DB"},
    {"number": "81", "name": "Luther Matt", "position": "K"},
    {"number": "86", "name": "Arthur Knutson", "position": "TE"},
    {"number": "90", "name": "Mikey Duran", "position": "DL"},
    {"number": "99", "name": "Noah Shuler", "position": "OL"},
]

# Joshua Coaches
JOSHUA_COACHES = [
    {"name": "Danny Dearman", "title": "AD/Head Coach"},
    {"name": "Doughtery", "title": "DC"},
    {"name": "Carnes", "title": "OC & OL"},
    {"name": "Payne", "title": "Safeties & Assoc. HC"},
    {"name": "Wortham", "title": "LB"},
    {"name": "Gillmore", "title": "OL"},
    {"name": "Williams", "title": "DE"},
    {"name": "Hood", "title": "DT"},
    {"name": "Woolard", "title": "QB & RB/FB"},
    {"name": "Nickels", "title": "Slots"},
    {"name": "Harkness", "title": "WR"},
]

@router.get("/search")
def search(q: str = Query(..., min_length=1)):
    """
    Search for teams, players, and coaches
    """
    query = q.lower()
    results = []
    
    # Search teams
    for team in TEAMS:
        if query in team["name"].lower() or query in team["mascot"].lower():
            results.append({
                "type": "team",
                "id": team["id"],
                "name": team["name"],
                "mascot": team["mascot"],
                "district": team["district"],
                "record": team["record"]
            })
    
    # Search players (Joshua only for now)
    for player in JOSHUA_PLAYERS:
        if query in player["name"].lower() or query in player["number"]:
            results.append({
                "type": "player",
                "id": f"player_{player['number']}",
                "name": player["name"],
                "number": player["number"],
                "position": player["position"],
                "team": "Joshua Owls"
            })
    
    # Search coaches (Joshua only for now)
    for coach in JOSHUA_COACHES:
        if query in coach["name"].lower() or query in coach["title"].lower():
            results.append({
                "type": "coach",
                "id": f"coach_{coach['name'].replace(' ', '_')}",
                "name": coach["name"],
                "title": coach["title"],
                "team": "Joshua Owls"
            })
    
    return results