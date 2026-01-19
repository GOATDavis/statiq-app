// Player types for fan-facing features

export interface PlayerBasic {
  id: string;
  number: string;
  name: string;
  position: string;
  team_id: string;
  team_name: string;
  team_mascot: string;
}

export interface PlayerProfile extends PlayerBasic {
  grade: string; // "9", "10", "11", "12"
  height: string | null; // "6'2\"" or null
  weight: string | null; // "195 lbs" or null
  hometown: string | null;
  photo_url: string | null;
  jersey_photo_url: string | null;
  bio: string | null;
  highlights_url: string | null;
}

export interface PlayerSeasonStats {
  player_id: string;
  player_name: string;
  season: string; // "2025"
  games_played: number;
  games_started: number;
  
  // Passing stats
  passing_completions: number | null;
  passing_attempts: number | null;
  passing_yards: number | null;
  passing_tds: number | null;
  passing_ints: number | null;
  passing_completion_pct: number | null;
  
  // Rushing stats
  rushing_attempts: number | null;
  rushing_yards: number | null;
  rushing_tds: number | null;
  rushing_avg: number | null;
  rushing_long: number | null;
  
  // Receiving stats
  receptions: number | null;
  receiving_yards: number | null;
  receiving_tds: number | null;
  receiving_avg: number | null;
  receiving_long: number | null;
  receiving_targets: number | null;
  
  // Defensive stats
  tackles: number | null;
  tackles_for_loss: number | null;
  sacks: number | null;
  interceptions: number | null;
  forced_fumbles: number | null;
  fumble_recoveries: number | null;
  pass_breakups: number | null;
  
  // Kicking stats
  field_goals_made: number | null;
  field_goals_attempted: number | null;
  field_goal_pct: number | null;
  field_goal_long: number | null;
  extra_points_made: number | null;
  extra_points_attempted: number | null;
  
  // Punting stats
  punts: number | null;
  punt_yards: number | null;
  punt_avg: number | null;
  punt_long: number | null;
  punts_inside_20: number | null;
}

export interface PlayerGameLog {
  player_id: string;
  player_name: string;
  games: PlayerGameStats[];
}

export interface PlayerGameStats {
  game_id: string;
  date: string;
  opponent_id: string;
  opponent_name: string;
  opponent_mascot: string;
  is_home: boolean;
  result: 'W' | 'L';
  team_score: number;
  opponent_score: number;
  
  // Game-specific stats (same structure as season stats but for one game)
  passing_completions: number | null;
  passing_attempts: number | null;
  passing_yards: number | null;
  passing_tds: number | null;
  passing_ints: number | null;
  
  rushing_attempts: number | null;
  rushing_yards: number | null;
  rushing_tds: number | null;
  rushing_long: number | null;
  
  receptions: number | null;
  receiving_yards: number | null;
  receiving_tds: number | null;
  receiving_long: number | null;
  
  tackles: number | null;
  tackles_for_loss: number | null;
  sacks: number | null;
  interceptions: number | null;
}

export interface PlayerComparison {
  player1: PlayerSeasonStats;
  player2: PlayerSeasonStats;
  comparison_category: 'passing' | 'rushing' | 'receiving' | 'defense';
}
