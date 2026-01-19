#!/usr/bin/env python3
"""
Scrape team colors from MaxPreps for teams missing colors.
Run with: python3 scrape_team_colors.py
"""

import requests
from bs4 import BeautifulSoup
import psycopg2
import time
import re
import json

# Database connection
DB_CONFIG = {
    'dbname': 'statiq',
    'user': 'postgres',
    'host': 'localhost'
}

# Common Texas high school colors (fallback database)
KNOWN_COLORS = {
    # Major programs with well-known colors
    'Allen': '#FFD700',  # Gold
    'Aledo': '#FF6600',  # Orange
    'Southlake Carroll': '#004225',  # Green
    'Duncanville': '#006400',  # Dark Green
    'North Shore': '#800000',  # Maroon
    'Galena Park North Shore': '#800000',
    'Katy': '#CC0000',  # Red
    'Lake Travis': '#8B0000',  # Dark Red
    'Austin Lake Travis': '#8B0000',
    'Westlake': '#003366',  # Navy
    'Austin Westlake': '#003366',
    'Highland Park': '#0033A0',  # Blue
    'Dallas Highland Park': '#0033A0',
    'Denton Guyer': '#CC0000',  # Red
    'Denton Ryan': '#006400',  # Green
    'Cedar Hill': '#FF0000',  # Red
    'DeSoto': '#006400',  # Green
    'Prosper': '#000080',  # Navy
    'McKinney': '#800000',  # Maroon
    'McKinney Boyd': '#006400',  # Green
    'Plano': '#003366',  # Navy
    'Plano East': '#800000',  # Maroon
    'Plano West': '#FFD700',  # Gold
    'Lewisville': '#006400',  # Green
    'Flower Mound': '#0033A0',  # Blue
    'Lewisville Flower Mound': '#0033A0',
    'Marcus': '#800000',  # Maroon
    'Lewisville Marcus': '#800000',
    'Coppell': '#CC0000',  # Red
    'Euless Trinity': '#006400',  # Green
    'Hurst Bell': '#0033A0',  # Blue
    'Arlington Martin': '#CC0000',  # Red
    'Arlington Bowie': '#808080',  # Gray
    'Grand Prairie': '#000000',  # Black
    'South Grand Prairie': '#FFD700',  # Gold
    'Irving': '#FF6600',  # Orange
    'Irving MacArthur': '#CC0000',  # Red
    'Richardson': '#0033A0',  # Blue
    'Garland': '#FFD700',  # Gold
    'Mesquite': '#800000',  # Maroon
    'Rockwall': '#FFD700',  # Gold
    'Rockwall Heath': '#000080',  # Navy
    'Longview': '#800000',  # Maroon
    'Tyler': '#CC0000',  # Red
    'Tyler Legacy': '#CC0000',
    'Killeen': '#800000',  # Maroon
    'Temple': '#000000',  # Black
    'Waco': '#FFD700',  # Gold
    'Round Rock': '#003366',  # Navy
    'Cedar Park': '#006400',  # Green
    'Georgetown': '#0033A0',  # Blue
    'Conroe': '#FF6600',  # Orange
    'The Woodlands': '#006400',  # Green
    'Conroe The Woodlands': '#006400',
    'Klein': '#003366',  # Navy
    'Klein Collins': '#800000',  # Maroon
    'Klein Oak': '#006400',  # Green
    'Cy-Fair': '#CC0000',  # Red
    'Cypress Ranch': '#800000',  # Maroon
    'Cypress Woods': '#CC0000',  # Red
    'Spring': '#FFD700',  # Gold
    'Spring Westfield': '#800000',  # Maroon
    'Humble': '#003366',  # Navy
    'Atascocita': '#0033A0',  # Blue
    'Humble Atascocita': '#0033A0',
    'Kingwood': '#006400',  # Green
    'Humble Kingwood': '#006400',
    'Pearland': '#003366',  # Navy
    'Shadow Creek': '#800000',  # Maroon
    'Alvin Shadow Creek': '#800000',
    'Manvel': '#800000',  # Maroon
    'Dickinson': '#006400',  # Green
    'Clear Creek': '#CC0000',  # Red
    'League City Clear Creek': '#CC0000',
    'Clear Springs': '#006400',  # Green
    'League City Clear Springs': '#006400',
    'Clear Lake': '#000080',  # Navy
    'Houston Clear Lake': '#000080',
    'Deer Park': '#006400',  # Green
    'La Porte': '#003366',  # Navy
    'Pasadena': '#0033A0',  # Blue
    'San Antonio': '#CC0000',  # Red
    'Judson': '#FF6600',  # Orange
    'Converse Judson': '#FF6600',
    'Steele': '#FFD700',  # Gold
    'Cibolo Steele': '#FFD700',
    'Reagan': '#800000',  # Maroon
    'San Antonio Reagan': '#800000',
    'Johnson': '#0033A0',  # Blue (SA)
    'Churchill': '#006400',  # Green
    'San Antonio Churchill': '#006400',
    'Clark': '#CC0000',  # Red
    'Northside Clark': '#CC0000',
    'Brennan': '#800000',  # Maroon
    'Northside Brennan': '#800000',
    'O\'Connor': '#003366',  # Navy
    'Northside O\'Connor': '#003366',
    'Brandeis': '#0033A0',  # Blue
    'Northside Brandeis': '#0033A0',
    'Taft': '#CC0000',  # Red
    'Northside Taft': '#CC0000',
    'Stevens': '#FFD700',  # Gold
    'Northside Stevens': '#FFD700',
    'Warren': '#006400',  # Green
    'Northside Warren': '#006400',
    'Holmes': '#800000',  # Maroon
    'Northside Holmes': '#800000',
    'Marshall': '#800000',  # Maroon
    'Northside Marshall': '#800000',
    'Harlan': '#000080',  # Navy
    'Northside Harlan': '#000080',
    'Laredo': '#CC0000',  # Red
    'Laredo United': '#FF6600',  # Orange
    'Laredo Alexander': '#003366',  # Navy
    'Laredo Nixon': '#800000',  # Maroon
    'Edinburg': '#006400',  # Green
    'Edinburg North': '#0033A0',  # Blue
    'McAllen': '#003366',  # Navy
    'Mission': '#800000',  # Maroon
    'Weslaco': '#006400',  # Green
    'Harlingen': '#FFD700',  # Gold
    'Brownsville': '#800000',  # Maroon
    'El Paso': '#0033A0',  # Blue
    'El Paso Coronado': '#CC0000',  # Red
    'El Paso Eastwood': '#006400',  # Green
    'El Paso Franklin': '#003366',  # Navy
    'El Paso Montwood': '#800000',  # Maroon
    'El Paso Socorro': '#FFD700',  # Gold
    'El Paso Pebble Hills': '#CC0000',  # Red
    'Midland': '#800000',  # Maroon
    'Midland Legacy': '#003366',  # Navy
    'Odessa': '#CC0000',  # Red
    'Odessa Permian': '#000000',  # Black
    'Abilene': '#800080',  # Purple
    'Abilene Cooper': '#003366',  # Navy
    'Lubbock': '#000000',  # Black
    'Lubbock Coronado': '#FFD700',  # Gold
    'Lubbock Monterey': '#006400',  # Green
    'Amarillo': '#FFD700',  # Gold
    'Amarillo Tascosa': '#006400',  # Green
    'Amarillo Caprock': '#800000',  # Maroon
    # 4A Schools
    'China Spring': '#003366',  # Navy
    'Silsbee': '#FF6600',  # Orange
    'West Orange-Stark': '#800000',  # Maroon
    'Carthage': '#003366',  # Navy
    'Gilmer': '#003366',  # Navy
    'La Vega': '#800000',  # Maroon
    'Waco La Vega': '#800000',
    'Connally': '#006400',  # Green
    'Waco Connally': '#006400',
    'Stephenville': '#FFD700',  # Gold
    'Argyle': '#0033A0',  # Blue
    'Celina': '#006400',  # Green
    'Melissa': '#CC0000',  # Red
    'Anna': '#003366',  # Navy
    'Aubrey': '#006400',  # Green
    'Decatur': '#0033A0',  # Blue
    'Gainesville': '#800000',  # Maroon
    'Springtown': '#006400',  # Green
    'Glen Rose': '#FFD700',  # Gold
    'Godley': '#003366',  # Navy
    'Gatesville': '#800000',  # Maroon
    'Lorena': '#006400',  # Green
    'Robinson': '#003366',  # Navy
    'Bellville': '#003366',  # Navy
    'Sealy': '#800000',  # Maroon
    'La Grange': '#006400',  # Green
    'Giddings': '#003366',  # Navy
    'Caldwell': '#FFD700',  # Gold
    'Madisonville': '#800000',  # Maroon
    'Jasper': '#003366',  # Navy
    'Shepherd': '#800000',  # Maroon
    'Sweeny': '#003366',  # Navy
    'Columbia': '#006400',  # Green
    'Wharton': '#800000',  # Maroon
    'La Marque': '#800000',  # Maroon
    'Cuero': '#006400',  # Green
    'Sinton': '#CC0000',  # Red
    'Ingleside': '#800000',  # Maroon
    'Robstown': '#FFD700',  # Gold
    'Rockport-Fulton': '#003366',  # Navy
    'Kingsville': '#FFD700',  # Gold
    'Kingsville King': '#FFD700',
    'Port Isabel': '#FF6600',  # Orange
    'La Feria': '#006400',  # Green
    'Devine': '#FFD700',  # Gold
    'Pearsall': '#800000',  # Maroon
    'Carrizo Springs': '#003366',  # Navy
    'Bandera': '#003366',  # Navy
    'Wimberley': '#800080',  # Purple
    'Jarrell': '#003366',  # Navy
    'Salado': '#800000',  # Maroon
    'Smithville': '#FFD700',  # Gold
    'Gonzales': '#800000',  # Maroon
    'Navarro': '#006400',  # Green
    'Geronimo Navarro': '#006400',
    # Fort Worth area
    'Fort Worth': '#800080',  # Purple
    'Chisholm Trail': '#003366',  # Navy
    'Saginaw Chisholm Trail': '#003366',
    'Fossil Ridge': '#006400',  # Green
    'Keller Fossil Ridge': '#006400',
    'Richland': '#CC0000',  # Red
    'North Richland Hills Richland': '#CC0000',
    'Birdville': '#FFD700',  # Gold
    'North Richland Hills Birdville': '#FFD700',
    'Weatherford': '#003366',  # Navy
    'Crowley': '#0033A0',  # Blue
    'North Crowley': '#003366',  # Navy
    'Mansfield': '#FF6600',  # Orange
    'Mansfield Legacy': '#800000',  # Maroon
    'Mansfield Lake Ridge': '#003366',  # Navy
    'Burleson': '#006400',  # Green
    'Burleson Centennial': '#003366',  # Navy
    'Centennial': '#003366',
    'Joshua': '#FFD700',  # Gold
    'Cleburne': '#FFD700',  # Gold
    'Midlothian': '#003366',  # Navy
    'Red Oak': '#CC0000',  # Red
    'Waxahachie': '#800000',  # Maroon
    'Ennis': '#FFD700',  # Gold
    'Corsicana': '#FF6600',  # Orange
    'Lancaster': '#006400',  # Green
    # Dallas area
    'Dallas': '#0033A0',  # Blue
    'Skyline': '#CC0000',  # Red
    'Dallas Skyline': '#CC0000',
    'Kimball': '#006400',  # Green
    'Dallas Kimball': '#006400',
    # Houston area teams
    'Houston': '#CC0000',  # Red
    'Bellaire': '#800000',  # Maroon
    'Houston Bellaire': '#800000',
    'Lamar': '#800000',  # Maroon
    'Houston Lamar': '#800000',
    'Westside': '#FFD700',  # Gold
    'Houston Westside': '#FFD700',
    'Heights': '#003366',  # Navy
    'Houston Heights': '#003366',
    'Stratford': '#0033A0',  # Blue
    'Houston Stratford': '#0033A0',
    'Memorial': '#800000',  # Maroon
    'Houston Memorial': '#800000',
    'Jersey Village': '#006400',  # Green
    'Langham Creek': '#800000',  # Maroon
    'Cypress Falls': '#0033A0',  # Blue
    'Cypress Creek': '#003366',  # Navy
    'Cypress Ridge': '#800000',  # Maroon
    'Bridgeland': '#003366',  # Navy
    'Tomball': '#003366',  # Navy
    'Tomball Memorial': '#800000',  # Maroon
    'Magnolia': '#003366',  # Navy
    'Magnolia West': '#CC0000',  # Red
    'Klein Cain': '#003366',  # Navy
    'Klein Forest': '#006400',  # Green
    'Aldine': '#0033A0',  # Blue
    'Houston Aldine': '#0033A0',
    'Eisenhower': '#006400',  # Green
    'Houston Eisenhower': '#006400',
    'MacArthur': '#800000',  # Maroon
    'Houston MacArthur': '#800000',
    'Nimitz': '#003366',  # Navy
    'Houston Nimitz': '#003366',
    'Davis': '#FFD700',  # Gold
    'Houston Benjamin Davis': '#FFD700',
    'Dekaney': '#006400',  # Green
    'Spring Dekaney': '#006400',
    'Westfield': '#800000',  # Maroon
    'Willis': '#800000',  # Maroon
    'Caney Creek': '#006400',  # Green
    'Conroe Caney Creek': '#006400',
    'Oak Ridge': '#CC0000',  # Red
    'Conroe Oak Ridge': '#CC0000',
    'Grand Oaks': '#003366',  # Navy
    'Conroe Grand Oaks': '#003366',
    'College Park': '#800000',  # Maroon
    'Conroe Woodlands College Park': '#800000',
    'New Caney': '#0033A0',  # Blue
    'Porter': '#003366',  # Navy
    'New Caney Porter': '#003366',
    'Crosby': '#003366',  # Navy
    'Barbers Hill': '#0033A0',  # Blue
    'Baytown': '#006400',  # Green
    'Sterling': '#CC0000',  # Red
    'Baytown Sterling': '#CC0000',
    'Goose Creek Memorial': '#800000',  # Maroon
    'Baytown Goose Creek Memorial': '#800000',
    'Channelview': '#003366',  # Navy
    'Sheldon': '#006400',  # Green
    'King': '#800000',  # Maroon
    'Sheldon King': '#800000',
    'Summer Creek': '#003366',  # Navy
    'Humble Summer Creek': '#003366',
    'Elsik': '#003366',  # Navy
    'Alief Elsik': '#003366',
    'Hastings': '#CC0000',  # Red
    'Alief Hastings': '#CC0000',
    'Taylor': '#FFD700',  # Gold
    'Alief Taylor': '#FFD700',
    'Katy Taylor': '#800000',
    'Cinco Ranch': '#800000',  # Maroon
    'Katy Cinco Ranch': '#800000',
    'Seven Lakes': '#003366',  # Navy
    'Katy Seven Lakes': '#003366',
    'Morton Ranch': '#006400',  # Green
    'Katy Morton Ranch': '#006400',
    'Mayde Creek': '#800000',  # Maroon
    'Katy Mayde Creek': '#800000',
    'Tompkins': '#CC0000',  # Red
    'Katy Tompkins': '#CC0000',
    'Paetow': '#003366',  # Navy
    'Katy Paetow': '#003366',
    'Jordan': '#800000',  # Maroon
    'Katy Jordan': '#800000',
    'Fulshear': '#003366',  # Navy
    'Lamar Fulshear': '#003366',
    'Foster': '#006400',  # Green
    'Richmond Foster': '#006400',
    'George Ranch': '#800000',  # Maroon
    'Richmond George Ranch': '#800000',
    'Travis': '#CC0000',  # Red
    'Fort Bend Travis': '#CC0000',
    'Austin': '#800000',  # Maroon (Fort Bend)
    'Fort Bend Austin': '#800000',
    'Bush': '#003366',  # Navy
    'Fort Bend Bush': '#003366',
    'Clements': '#006400',  # Green
    'Fort Bend Clements': '#006400',
    'Dulles': '#003366',  # Navy
    'Fort Bend Dulles': '#003366',
    'Elkins': '#800000',  # Maroon
    'Fort Bend Elkins': '#800000',
    'Hightower': '#006400',  # Green
    'Fort Bend Hightower': '#006400',
    'Ridge Point': '#CC0000',  # Red
    'Fort Bend Ridge Point': '#CC0000',
    'Dobie': '#800000',  # Maroon
    'Pasadena Dobie': '#800000',
    'Rayburn': '#006400',  # Green
    'Pasadena Rayburn': '#006400',
    'South Houston': '#CC0000',  # Red
    'Pasadena South Houston': '#CC0000',
    'Dawson': '#0033A0',  # Blue
    'Pearland Dawson': '#0033A0',
    'Friendswood': '#003366',  # Navy
    'Clear Brook': '#006400',  # Green
    'Friendswood Clear Brook': '#006400',
    'Clear Falls': '#FFD700',  # Gold
    'League City Clear Falls': '#FFD700',
    'Brazoswood': '#800000',  # Maroon
    'Clute Brazoswood': '#800000',
    'Angleton': '#003366',  # Navy
    'Alvin': '#FFD700',  # Gold
    # Frisco area
    'Frisco': '#CC0000',  # Red
    'Frisco Centennial': '#003366',  # Navy
    'Frisco Heritage': '#800000',  # Maroon
    'Frisco Lebanon Trail': '#006400',  # Green
    'Frisco Liberty': '#CC0000',  # Red
    'Frisco Lone Star': '#800080',  # Purple
    'Frisco Memorial': '#003366',  # Navy
    'Frisco Panther Creek': '#000000',  # Black
    'Frisco Reedy': '#006400',  # Green
    'Frisco Wakeland': '#006400',  # Green
    'Frisco Emerson': '#FFD700',  # Gold
    # Others
    'Bryan': '#800000',  # Maroon
    'College Station': '#800000',  # Maroon
    'A&M Consolidated': '#800000',  # Maroon
    'Copperas Cove': '#003366',  # Navy
    'Harker Heights': '#006400',  # Green
    'Killeen Harker Heights': '#006400',
    'Shoemaker': '#800000',  # Maroon
    'Killeen Shoemaker': '#800000',
    'Ellison': '#006400',  # Green
    'Killeen Ellison': '#006400',
    'Chaparral': '#CC0000',  # Red
    'Killeen Chaparral': '#CC0000',
    'Belton': '#800000',  # Maroon
    'Lake Belton': '#800000',
    'Hutto': '#003366',  # Navy
    'Manor': '#800000',  # Maroon
    'Hendrickson': '#006400',  # Green
    'Pflugerville Hendrickson': '#006400',
    'Weiss': '#003366',  # Navy
    'Pflugerville Weiss': '#003366',
    'Vista Ridge': '#006400',  # Green
    'Cedar Park Vista Ridge': '#006400',
    'Vandegrift': '#800000',  # Maroon
    'Austin Vandegrift': '#800000',
    'Stony Point': '#003366',  # Navy
    'Round Rock Stony Point': '#003366',
    'McNeil': '#800000',  # Maroon
    'Round Rock McNeil': '#800000',
    'Westwood': '#006400',  # Green
    'Round Rock Westwood': '#006400',
    'Cedar Ridge': '#CC0000',  # Red
    'Round Rock Cedar Ridge': '#CC0000',
    'Del Valle': '#800000',  # Maroon
    'Dripping Springs': '#006400',  # Green
    'Akins': '#0033A0',  # Blue
    'Austin Akins': '#0033A0',
    'Bowie': '#800000',  # Maroon (Austin)
    'Austin Bowie': '#800000',
    'New Braunfels': '#003366',  # Navy
    'Canyon': '#003366',  # Navy (New Braunfels)
    'Comal Canyon': '#003366',
    'Smithson Valley': '#006400',  # Green
    'Pieper': '#800000',  # Maroon (already has color but including)
    'San Marcos': '#800000',  # Maroon
    'Seguin': '#FFD700',  # Gold
    'Clemens': '#006400',  # Green
    'Schertz Clemens': '#006400',
    'Wagner': '#003366',  # Navy
    'San Antonio Wagner': '#003366',
    'East Central': '#800000',  # Maroon
    'San Antonio East Central': '#800000',
    'Medina Valley': '#003366',  # Navy
    'Castroville Medina Valley': '#003366',
    'Boerne': '#003366',  # Navy
    'Boerne Champion': '#006400',  # Green
    'Victoria': '#CC0000',  # Red
    'Victoria East': '#CC0000',
    'Victoria West': '#006400',
    'Corpus Christi': '#FFD700',  # Gold
    'Miller': '#006400',  # Green
    'Ray': '#003366',  # Navy
    'King': '#800000',
    'Veterans Memorial': '#800000',  # Maroon
    'Corpus Christi Veterans Memorial': '#800000',
    'Flour Bluff': '#006400',  # Green
    'Corpus Christi Flour Bluff': '#006400',
    'Strake Jesuit': '#003366',  # Navy
    'Houston Strake Jesuit': '#003366',
    'Jesuit': '#003366',  # Navy
    'Dallas Jesuit': '#003366',
}

def get_db_connection():
    return psycopg2.connect(**DB_CONFIG)

def get_teams_needing_colors(conn):
    """Get all teams that need colors"""
    cur = conn.cursor()
    cur.execute("""
        SELECT id, name, primary_color 
        FROM teams 
        WHERE primary_color IS NULL 
           OR primary_color = '#1a1a1a' 
           OR primary_color = '#000000'
        ORDER BY name
    """)
    return cur.fetchall()

def update_team_color(conn, team_id, primary_color, background_color='#FFFFFF'):
    """Update a team's colors"""
    cur = conn.cursor()
    cur.execute("""
        UPDATE teams 
        SET primary_color = %s, background_color = %s
        WHERE id = %s
    """, (primary_color, background_color, team_id))
    conn.commit()

def find_color_match(team_name):
    """Try to find a color match from known colors"""
    # Direct match
    if team_name in KNOWN_COLORS:
        return KNOWN_COLORS[team_name]
    
    # Try without city prefix
    parts = team_name.split()
    if len(parts) > 1:
        # Try last word (school name)
        if parts[-1] in KNOWN_COLORS:
            return KNOWN_COLORS[parts[-1]]
        
        # Try last two words
        if len(parts) >= 2:
            last_two = ' '.join(parts[-2:])
            if last_two in KNOWN_COLORS:
                return KNOWN_COLORS[last_two]
    
    return None

def main():
    conn = get_db_connection()
    
    teams = get_teams_needing_colors(conn)
    print(f"Found {len(teams)} teams needing colors")
    
    updated = 0
    not_found = []
    
    for team_id, name, current_color in teams:
        color = find_color_match(name)
        
        if color:
            update_team_color(conn, team_id, color)
            print(f"✓ {name}: {color}")
            updated += 1
        else:
            not_found.append(name)
    
    print(f"\n{'='*60}")
    print(f"Updated: {updated} teams")
    print(f"Not found: {len(not_found)} teams")
    
    if not_found:
        print(f"\nTeams still needing colors:")
        for name in not_found[:50]:  # Show first 50
            print(f"  - {name}")
        if len(not_found) > 50:
            print(f"  ... and {len(not_found) - 50} more")
    
    conn.close()

if __name__ == "__main__":
    main()
