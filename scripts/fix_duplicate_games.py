#!/usr/bin/env python3
"""
StatIQ: Fix Duplicate Games Script
Finds and removes duplicate game entries from the database.

Usage:
    python fix_duplicate_games.py --dry-run    # Preview what would be deleted
    python fix_duplicate_games.py --delete     # Actually delete duplicates
"""

import argparse
import psycopg2
from psycopg2.extras import RealDictCursor

# Update with your database connection details
DB_CONFIG = {
    "host": "localhost",
    "database": "statiq",
    "user": "statiq",
    "password": "your_password_here"  # Update this
}

def get_connection():
    return psycopg2.connect(**DB_CONFIG)

def find_duplicates(cursor):
    """Find all duplicate games (same teams, same scores)"""
    query = """
    SELECT 
        g1.id as keep_id,
        g2.id as duplicate_id,
        t1.name as home_team,
        t2.name as away_team,
        g1.home_score,
        g1.away_score,
        g1.kickoff_at as keep_date,
        g2.kickoff_at as duplicate_date
    FROM games g1
    JOIN games g2 ON (
        -- Same matchup (either direction)
        ((g1.home_team_id = g2.home_team_id AND g1.away_team_id = g2.away_team_id)
        OR (g1.home_team_id = g2.away_team_id AND g1.away_team_id = g2.home_team_id))
        -- Same scores (accounting for home/away swap)
        AND ((g1.home_score = g2.home_score AND g1.away_score = g2.away_score)
            OR (g1.home_score = g2.away_score AND g1.away_score = g2.home_score))
        -- Different game IDs, keep the lower one
        AND g1.id < g2.id
    )
    JOIN teams t1 ON g1.home_team_id = t1.id
    JOIN teams t2 ON g1.away_team_id = t2.id
    ORDER BY g1.kickoff_at;
    """
    cursor.execute(query)
    return cursor.fetchall()

def delete_duplicates(cursor, duplicate_ids):
    """Delete duplicate games by ID"""
    if not duplicate_ids:
        return 0
    
    query = "DELETE FROM games WHERE id = ANY(%s)"
    cursor.execute(query, (duplicate_ids,))
    return cursor.rowcount

def main():
    parser = argparse.ArgumentParser(description='Fix duplicate games in StatIQ database')
    parser.add_argument('--dry-run', action='store_true', help='Preview duplicates without deleting')
    parser.add_argument('--delete', action='store_true', help='Actually delete duplicates')
    args = parser.parse_args()
    
    if not args.dry_run and not args.delete:
        print("Please specify --dry-run or --delete")
        return
    
    conn = get_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    print("\n" + "=" * 70)
    print("StatIQ Duplicate Games Finder")
    print("=" * 70)
    
    duplicates = find_duplicates(cursor)
    
    if not duplicates:
        print("\n✅ No duplicate games found!")
        cursor.close()
        conn.close()
        return
    
    print(f"\n⚠️  Found {len(duplicates)} duplicate game(s):\n")
    
    duplicate_ids = []
    for dup in duplicates:
        print(f"  KEEP:   ID {dup['keep_id']:4} | {dup['home_team']} vs {dup['away_team']} "
              f"({dup['home_score']}-{dup['away_score']}) on {dup['keep_date']}")
        print(f"  DELETE: ID {dup['duplicate_id']:4} | (same game) on {dup['duplicate_date']}")
        print()
        duplicate_ids.append(dup['duplicate_id'])
    
    if args.delete:
        confirm = input(f"Delete {len(duplicate_ids)} duplicate game(s)? (yes/no): ")
        if confirm.lower() == 'yes':
            deleted = delete_duplicates(cursor, duplicate_ids)
            conn.commit()
            print(f"\n✅ Deleted {deleted} duplicate game(s)")
        else:
            print("\n❌ Cancelled")
    else:
        print(f"\n📋 DRY RUN: Would delete {len(duplicate_ids)} game(s)")
        print("   Run with --delete to actually remove them")
    
    cursor.close()
    conn.close()

if __name__ == "__main__":
    main()
