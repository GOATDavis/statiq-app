// Game and Score types for fan-facing features

export interface LiveGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_mascot: string;
  away_team_mascot: string;
  home_score: number;
  away_score: number;
  quarter: string; // "1Q", "2Q", "3Q", "4Q", "FINAL", "HALFTIME"
  time_remaining: string; // "12:34" or "HALFTIME"
  is_live: boolean;
  district: string;
  classification: string; // "6A", "5A", "4A", etc.
  location: string;
  started_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
  // Team colors
  home_primary_color?: string;
  home_background_color?: string;
  away_primary_color?: string;
  away_background_color?: string;
  // Team rankings (for Score Feed display)
  home_state_rank?: number | null; // State ranking (e.g., #3 in Texas 6A)
  away_state_rank?: number | null;
  home_national_rank?: number | null; // National ranking (for top teams)
  away_national_rank?: number | null;
  // Broadcaster/Network info
  broadcaster?: string | null; // "ESPN+", "NFHS Network", "Local TV", etc.
  // Playoff seeds (for playoff games)
  playoff_seeds?: string; // Format: "W1El Dorado * F2Amarillo"
  home_playoff_seed?: string; // e.g., "W1", "R2", "F1"
  away_playoff_seed?: string; // e.g., "W2", "R1", "F2"
  notes?: string; // Fallback field for playoff seed info
  // Team logos
  home_team_logo?: string | null;
  away_team_logo?: string | null;
}

export interface FinishedGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_mascot: string;
  away_team_mascot: string;
  home_score: number;
  away_score: number;
  date: string; // "2025-11-01"
  time: string; // "7:30 PM"
  location: string;
  district: string;
  classification: string;
  final_status: string; // "FINAL", "FINAL/OT", etc.
  // Team colors
  home_primary_color?: string;
  home_background_color?: string;
  away_primary_color?: string;
  away_background_color?: string;
  // Team records
  home_record?: string;
  away_record?: string;
  // Broadcaster/Network info
  broadcaster?: string | null; // "ESPN+", "NFHS Network", "Local TV", etc.
  // Playoff seeds (for playoff games)
  playoff_seeds?: string; // Format: "W1El Dorado * F2Amarillo"
  home_playoff_seed?: string; // e.g., "W1", "R2", "F1"
  away_playoff_seed?: string; // e.g., "W2", "R1", "F2"
  notes?: string; // Fallback field for playoff seed info
  // Team logos
  home_team_logo?: string | null;
  away_team_logo?: string | null;
}

export interface UpcomingGame {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_team_name: string;
  away_team_name: string;
  home_team_mascot: string;
  away_team_mascot: string;
  date: string; // "2025-11-08"
  time: string; // "7:00 PM"
  location: string;
  district: string;
  classification: string;
  week: number;
  // Team colors
  home_primary_color?: string;
  home_background_color?: string;
  away_primary_color?: string;
  away_background_color?: string;
  // Team records
  home_record?: string;
  away_record?: string;
  // Broadcaster/Network info
  broadcaster?: string | null; // "ESPN+", "NFHS Network", "Local TV", etc.
  // Playoff seeds (for playoff games)
  playoff_seeds?: string; // Format: "W1El Dorado * F2Amarillo"
  home_playoff_seed?: string; // e.g., "W1", "R2", "F1"
  away_playoff_seed?: string; // e.g., "W2", "R1", "F2"
  notes?: string; // Fallback field for playoff seed info
  // Team logos
  home_team_logo?: string | null;
  away_team_logo?: string | null;
}

export interface DistrictStanding {
  team_id: string;
  team_name: string;
  team_mascot: string;
  wins: number;
  losses: number;
  district_wins: number;
  district_losses: number;
  points_for: number;
  points_against: number;
}

export interface GameDetail extends LiveGame {
  home_team_color_primary: string;
  home_team_color_secondary: string;
  away_team_color_primary: string;
  away_team_color_secondary: string;
  possession: 'home' | 'away' | null;
  down: number | null;
  distance: number | null;
  yard_line: number | null;
  yard_line_side: 'home' | 'away' | null;
  last_play: string | null;
  home_timeouts: number;
  away_timeouts: number;
  // StatIQ Analytics Engine predictions
  analytics?: {
    away_win_probability: number;
    home_win_probability: number;
    confidence: 'High' | 'Medium' | 'Low';
    last_updated: string;
  };
  // Fan predictions
  predictions?: {
    away_percentage: number;
    home_percentage: number;
    total_votes: number;
  };
}

export interface Play {
  id: string;
  game_id: string;
  quarter: number;
  time: string;
  team_id: string;
  team_name: string;
  play_type: string;
  yards: number;
  description: string;
  is_scoring_play: boolean;
  home_score_after: number;
  away_score_after: number;
  created_at: string;
}

export type Classification = '6A' | '5A' | '4A' | '3A' | '2A' | '1A' | 'TAPPS' | 'TCAL';

// ============================================================================
// GAME LEADERS TYPES (for StatIQ stat leaders)
// ============================================================================

export interface GameLeader {
  player_id: string;
  player_name: string;
  jersey_number: number | null;
  position: string;

  // Passing stats
  passing_yards: number | null;
  passing_completions: number | null;
  passing_attempts: number | null;
  passing_tds: number | null;

  // Rushing stats
  rushing_yards: number | null;
  rushing_carries: number | null;
  rushing_tds: number | null;

  // Receiving stats
  receiving_yards: number | null;
  receptions: number | null;
  receiving_tds: number | null;

  // Defensive stats
  tackles: number | null;
  sacks: number | null;
  interceptions: number | null;
}

export interface TeamLeaders {
  team_id: string;
  team_name: string;
  team_mascot: string;
  team_color: string | null;

  passing: GameLeader | null;
  rushing: GameLeader | null;
  receiving: GameLeader | null;
  tackles: GameLeader | null;
  sacks: GameLeader | null;
}

export interface GameLeadersResponse {
  game_id: string;
  home_team: TeamLeaders;
  away_team: TeamLeaders;
  updated_at: string;
}

// ============================================================================
// RANKINGS TYPES
// ============================================================================

export interface RankingTeam {
  rank: number;
  school_id: number;
  team_id: number;
  school_name: string;
  classification: string;
  power_rating: number;
  wins: number;
  losses: number;
  record: string;
  win_pct: number;
  sos: number;
  point_diff: number;
  is_incomplete: boolean;
  primary_color: string;
  background_color: string;
  rank_change: number;
  previous_rank: number | null;
}

export interface ClassificationOption {
  classification: string;
}
