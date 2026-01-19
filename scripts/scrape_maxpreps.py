#!/usr/bin/env python3
"""
Scrape 2025 5A-D1 Texas High School Football records from MaxPreps
Requires: pip install requests beautifulsoup4 selenium webdriver-manager
"""

import json
import time
import psycopg2
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Database connection
DB_CONFIG = {
    'dbname': 'statiq',
    'user': 'postgres',
    'host': 'localhost'
}

# MaxPreps 5A-D1 rankings URL (2025 season)
RANKINGS_URL = "https://www.maxpreps.com/tx/football/25-26/division/division-5a-1/rankings/1/?statedivisionid=0b246ef4-b2fc-4087-ad9e-d0d8764e29cc"

def setup_driver():
    """Setup headless Chrome driver"""
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver

def scrape_rankings(driver, page=1):
    """Scrape team rankings and records from a page"""
    url = f"https://www.maxpreps.com/tx/football/25-26/division/division-5a-1/rankings/{page}/?statedivisionid=0b246ef4-b2fc-4087-ad9e-d0d8764e29cc"
    print(f"Scraping page {page}: {url}")
    
    driver.get(url)
    time.sleep(3)  # Wait for JS to render
    
    teams = []
    
    try:
        # Wait for table to load
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr"))
        )
        
        rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
        
        for row in rows:
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) >= 3:
                    rank = cells[0].text.strip()
                    
                    # Team name is usually in a link
                    team_link = cells[1].find_element(By.TAG_NAME, "a")
                    team_name = team_link.text.strip()
                    team_url = team_link.get_attribute("href")
                    
                    record = cells[2].text.strip()  # e.g., "12-0"
                    
                    if team_name and record:
                        wins, losses = record.split('-')
                        teams.append({
                            'rank': int(rank) if rank.isdigit() else 0,
                            'name': team_name,
                            'wins': int(wins),
                            'losses': int(losses),
                            'url': team_url
                        })
                        print(f"  {rank}. {team_name}: {record}")
            except Exception as e:
                print(f"  Error parsing row: {e}")
                continue
                
    except Exception as e:
        print(f"Error scraping page {page}: {e}")
    
    return teams

def scrape_team_schedule(driver, team_url):
    """Scrape a team's full schedule"""
    schedule_url = team_url.replace('/football/', '/football/schedule/') if '/schedule/' not in team_url else team_url
    print(f"  Scraping schedule: {schedule_url}")
    
    driver.get(schedule_url)
    time.sleep(2)
    
    games = []
    
    try:
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr"))
        )
        
        rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
        
        for row in rows:
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) >= 4:
                    date = cells[0].text.strip()
                    opponent = cells[1].text.strip()
                    result = cells[2].text.strip()  # W/L
                    score = cells[3].text.strip()
                    
                    if opponent and result:
                        games.append({
                            'date': date,
                            'opponent': opponent,
                            'result': result,
                            'score': score
                        })
            except:
                continue
                
    except Exception as e:
        print(f"  Error scraping schedule: {e}")
    
    return games

def update_database(teams):
    """Update team records in database"""
    conn = psycopg2.connect(**DB_CONFIG)
    cur = conn.cursor()
    
    updated = 0
    for team in teams:
        # Try exact match first
        cur.execute("""
            UPDATE teams SET wins = %s, losses = %s 
            WHERE LOWER(name) = LOWER(%s)
            RETURNING id, name
        """, (team['wins'], team['losses'], team['name']))
        
        result = cur.fetchone()
        if result:
            print(f"  Updated: {result[1]} -> {team['wins']}-{team['losses']}")
            updated += 1
        else:
            # Try partial match
            cur.execute("""
                UPDATE teams SET wins = %s, losses = %s 
                WHERE LOWER(name) LIKE LOWER(%s)
                RETURNING id, name
            """, (team['wins'], team['losses'], f"%{team['name']}%"))
            
            result = cur.fetchone()
            if result:
                print(f"  Updated (partial): {result[1]} -> {team['wins']}-{team['losses']}")
                updated += 1
            else:
                print(f"  NOT FOUND: {team['name']}")
    
    conn.commit()
    cur.close()
    conn.close()
    
    print(f"\nUpdated {updated}/{len(teams)} teams")

def main():
    print("=" * 60)
    print("MaxPreps 5A-D1 Scraper - 2025 Season")
    print("=" * 60)
    
    driver = setup_driver()
    all_teams = []
    
    try:
        # Scrape all pages (typically 5-6 pages for 129 teams)
        for page in range(1, 7):
            teams = scrape_rankings(driver, page)
            if not teams:
                break
            all_teams.extend(teams)
            time.sleep(2)
        
        print(f"\nTotal teams scraped: {len(all_teams)}")
        
        # Save to JSON for backup
        with open('5a_d1_records_2025.json', 'w') as f:
            json.dump(all_teams, f, indent=2)
        print("Saved to 5a_d1_records_2025.json")
        
        # Update database
        print("\nUpdating database...")
        update_database(all_teams)
        
    finally:
        driver.quit()

if __name__ == "__main__":
    main()
