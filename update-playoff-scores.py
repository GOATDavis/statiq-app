#!/usr/bin/env python3
"""
Script to update 5A-D1 playoff scores for Week 1 (Bi-District)
Run with: python3 update-playoff-scores.py
"""

import requests
import time

API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1"

games = [
    # Region 1
    {"home": "El Dorado", "away": "Amarillo", "homeScore": 77, "awayScore": 76},
    {"home": "Richland", "away": "OD Wyatt", "homeScore": 77, "awayScore": 43},
    {"home": "Abilene", "away": "Bel Air", "homeScore": 84, "awayScore": 25},
    {"home": "Denton Ryan", "away": "Chisholm Trail", "homeScore": 59, "awayScore": 7},
    {"home": "Aledo", "away": "Saginaw", "homeScore": 80, "awayScore": 12},
    {"home": "Tascosa", "away": "Parkland", "homeScore": 84, "awayScore": 13},
    {"home": "Arlington Heights", "away": "Brewer", "homeScore": 36, "awayScore": 23},
    {"home": "Monterey", "away": "Americas", "homeScore": 50, "awayScore": 32},
    
    # Region 2
    {"home": "Lone Star", "away": "North Mesquite", "homeScore": 49, "awayScore": 6},
    {"home": "Georgetown", "away": "Centennial", "homeScore": 41, "awayScore": 11},
    {"home": "West Mesquite", "away": "Frisco", "homeScore": 28, "awayScore": 24},
    {"home": "Midlothian", "away": "East View", "homeScore": 36, "awayScore": 16},
    {"home": "Highland Park", "away": "Lake Belton", "homeScore": 56, "awayScore": 13},
    {"home": "Reedy", "away": "Creekview", "homeScore": 24, "awayScore": 3},
    {"home": "Cedar Park", "away": "Tyler", "homeScore": 50, "awayScore": 43},
    {"home": "Wakeland", "away": "Newman Smith", "homeScore": 28, "awayScore": 12},
    
    # Region 3
    {"home": "Port Arthur Memorial", "away": "Galena Park", "homeScore": 42, "awayScore": 0},
    {"home": "A&M Consolidated", "away": "Crosby", "homeScore": 27, "awayScore": 26},
    {"home": "Beaumont United", "away": "Madison", "homeScore": 27, "awayScore": 19},
    {"home": "College Station", "away": "Angleton", "homeScore": 42, "awayScore": 23},
    {"home": "Weiss", "away": "La Porte", "homeScore": 42, "awayScore": 35},
    {"home": "Lufkin", "away": "Westbury", "homeScore": 35, "awayScore": 10},
    {"home": "Anderson", "away": "Friendswood", "homeScore": 35, "awayScore": 34},
    {"home": "Barbers Hill", "away": "Waltrip", "homeScore": 57, "awayScore": 7},
    
    # Region 4
    {"home": "Smithson Valley", "away": "Southside", "homeScore": 49, "awayScore": 0},
    {"home": "Corpus Christi Veterans Memorial", "away": "Vela", "homeScore": 31, "awayScore": 26},
    {"home": "Pieper", "away": "Jay", "homeScore": 33, "awayScore": 14},
    {"home": "Flour Bluff", "away": "McAllen", "homeScore": 45, "awayScore": 7},
    {"home": "Pharr-San Juan-Alamo", "away": "Mission", "homeScore": 65, "awayScore": 14},
    {"home": "Boerne-Champion", "away": "Southwest", "homeScore": 41, "awayScore": 14},
    {"home": "McAllen Memorial", "away": "Harlingen South", "homeScore": 35, "awayScore": 21},
    {"home": "New Braunfels", "away": "Nixon", "homeScore": 49, "awayScore": 14},
]

def update_game(game):
    try:
        # First, fetch all games to find the matching game ID
        response = requests.get(
            f"{API_BASE}/playoff-bracket",
            params={"conference": "5A D1"},
            headers={"ngrok-skip-browser-warning": "true"}
        )
        
        if response.status_code != 200:
            print(f"Failed to fetch bracket: {response.status_code}")
            return
        
        bracket_data = response.json()
        
        # Find the Bi-District round
        bi_district_round = None
        for round_data in bracket_data.get("rounds", []):
            if round_data["round"] == "Bi-District":
                bi_district_round = round_data
                break
        
        if not bi_district_round:
            print("No Bi-District round found")
            return
        
        # Find matching game by team names
        matching_game = None
        for g in bi_district_round.get("games", []):
            home_match = (game["home"] in g["home_team"]["name"] or 
                         g["home_team"]["name"] in game["home"])
            away_match = (game["away"] in g["away_team"]["name"] or 
                         g["away_team"]["name"] in game["away"])
            
            if home_match and away_match:
                matching_game = g
                break
        
        if not matching_game:
            print(f"Game not found: {game['home']} vs {game['away']}")
            return
        
        print(f"Updating game {matching_game['id']}: {game['home']} {game['homeScore']} - {game['awayScore']} {game['away']}")
        
        # Update the game with scores
        update_response = requests.patch(
            f"{API_BASE}/games/{matching_game['id']}",
            headers={
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true"
            },
            json={
                "home_score": game["homeScore"],
                "away_score": game["awayScore"],
                "status": "final"
            }
        )
        
        if update_response.status_code not in [200, 204]:
            print(f"Failed to update game: {update_response.status_code}")
            return
        
        print(f"✓ Updated: {game['home']} {game['homeScore']} - {game['awayScore']} {game['away']}")
        
    except Exception as e:
        print(f"Error updating {game['home']} vs {game['away']}: {str(e)}")

def main():
    print("Starting to update 5A-D1 playoff scores...\n")
    
    for game in games:
        update_game(game)
        # Add small delay to avoid rate limiting
        time.sleep(0.5)
    
    print("\n✓ All games processed!")

if __name__ == "__main__":
    main()
