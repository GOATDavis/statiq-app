#!/usr/bin/env python3
"""
Script to update 5A-D1 playoff scores directly in the database
Run from backend server: python3 update_playoff_scores.py
"""

import psycopg2
from psycopg2 import sql

# Database connection settings
DB_CONFIG = {
    'dbname': 'statiq_db',
    'user': 'statiq',
    'password': 'your_password_here',  # UPDATE THIS
    'host': 'localhost',
    'port': 5432
}

# Game scores to update
games = [
    # Region 1
    {"home": "El Dorado", "away": "Amarillo", "home_score": 77, "away_score": 76},
    {"home": "Richland", "away": "Wyatt", "home_score": 77, "away_score": 43},
    {"home": "Abilene", "away": "Bel Air", "home_score": 84, "away_score": 25},
    {"home": "Ryan", "away": "Chisholm Trail", "home_score": 59, "away_score": 7},
    {"home": "Aledo", "away": "Saginaw", "home_score": 80, "away_score": 12},
    {"home": "Tascosa", "away": "Parkland", "home_score": 84, "away_score": 13},
    {"home": "Arlington Heights", "away": "Brewer", "home_score": 36, "away_score": 23},
    {"home": "Monterey", "away": "Americas", "home_score": 50, "away_score": 32},
    
    # Region 2
    {"home": "Lone Star", "away": "North Mesquite", "home_score": 49, "away_score": 6},
    {"home": "Georgetown", "away": "Centennial", "home_score": 41, "away_score": 11},
    {"home": "West Mesquite", "away": "Frisco", "home_score": 28, "away_score": 24},
    {"home": "Midlothian", "away": "East View", "home_score": 36, "away_score": 16},
    {"home": "Highland Park", "away": "Lake Belton", "home_score": 56, "away_score": 13},
    {"home": "Reedy", "away": "Creekview", "home_score": 24, "away_score": 3},
    {"home": "Cedar Park", "away": "Tyler", "home_score": 50, "away_score": 43},
    {"home": "Wakeland", "away": "Newman Smith", "home_score": 28, "away_score": 12},
    
    # Region 3
    {"home": "Port Arthur", "away": "Galena Park", "home_score": 42, "away_score": 0},
    {"home": "A&M Consolidated", "away": "Crosby", "home_score": 27, "away_score": 26},
    {"home": "Beaumont United", "away": "Madison", "home_score": 27, "away_score": 19},
    {"home": "College Station", "away": "Angleton", "home_score": 42, "away_score": 23},
    {"home": "Weiss", "away": "La Porte", "home_score": 42, "away_score": 35},
    {"home": "Lufkin", "away": "Westbury", "home_score": 35, "away_score": 10},
    {"home": "Anderson", "away": "Friendswood", "home_score": 35, "away_score": 34},
    {"home": "Barbers Hill", "away": "Waltrip", "home_score": 57, "away_score": 7},
    
    # Region 4
    {"home": "Smithson Valley", "away": "Southside", "home_score": 49, "away_score": 0},
    {"home": "Veterans Memorial", "away": "Vela", "home_score": 31, "away_score": 26},
    {"home": "Pieper", "away": "Jay", "home_score": 33, "away_score": 14},
    {"home": "Flour Bluff", "away": "McAllen", "home_score": 45, "away_score": 7},
    {"home": "Pharr", "away": "Mission", "home_score": 65, "away_score": 14},
    {"home": "Champion", "away": "Southwest", "home_score": 41, "away_score": 14},
    {"home": "McAllen Memorial", "away": "Harlingen", "home_score": 35, "away_score": 21},
    {"home": "New Braunfels", "away": "Nixon", "home_score": 49, "away_score": 14},
]

def update_game_score(cursor, game):
    """Update a single game's score in the database"""
    try:
        # Find the game by team names (using LIKE for partial matches)
        query = """
            UPDATE games 
            SET home_score = %s, away_score = %s, status = 'final'
            WHERE home_team_id = (SELECT id FROM teams WHERE name LIKE %s)
              AND away_team_id = (SELECT id FROM teams WHERE name LIKE %s)
            RETURNING id, home_score, away_score;
        """
        
        home_pattern = f"%{game['home']}%"
        away_pattern = f"%{game['away']}%"
        
        cursor.execute(query, (
            game['home_score'], 
            game['away_score'], 
            home_pattern, 
            away_pattern
        ))
        
        result = cursor.fetchone()
        
        if result:
            game_id, home_score, away_score = result
            print(f"✓ Updated game {game_id}: {game['home']} {home_score} - {away_score} {game['away']}")
            return True
        else:
            print(f"✗ Game not found: {game['home']} vs {game['away']}")
            return False
            
    except Exception as e:
        print(f"✗ Error updating {game['home']} vs {game['away']}: {e}")
        return False

def main():
    """Main function to update all playoff scores"""
    print("Starting to update 5A-D1 playoff scores...\n")
    
    try:
        # Connect to database
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        updated_count = 0
        failed_count = 0
        
        # Update each game
        for game in games:
            if update_game_score(cursor, game):
                updated_count += 1
            else:
                failed_count += 1
        
        # Commit all changes
        conn.commit()
        
        print(f"\n{'='*60}")
        print(f"✓ Successfully updated {updated_count} games")
        if failed_count > 0:
            print(f"✗ Failed to update {failed_count} games")
        print(f"{'='*60}")
        
        # Close connection
        cursor.close()
        conn.close()
        
    except psycopg2.Error as e:
        print(f"\n✗ Database error: {e}")
    except Exception as e:
        print(f"\n✗ Unexpected error: {e}")

if __name__ == "__main__":
    main()
