// Team types for fan-facing features

export interface TeamBasic {
  id: string;
  name: string;
  mascot: string;
  city: string;
  state: string;
  classification: string; // "6A", "5A", etc.
  district: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string | null;
}

export interface TeamProfile extends TeamBasic {
  record: string; // "8-1"
  wins: number;
  losses: number;
  district_wins: number;
  district_losses: number;
  points_for: number;
  points_against: number;
  current_streak: string; // "W5", "L2", etc.
  coach_name: string;
  coach_title: string;
  stadium: string | null;
  school_enrollment: number | null;
  conference: string | null;
  state_championships: number | null;
}

export interface TeamSchedule {
  team_id: string;
  team_name: string;
  games: TeamGame[];
}

export interface TeamGame {
  id: string;
  week: number;
  date: string;
  time: string;
  opponent_id: string;
  opponent_name: string;
  opponent_mascot: string;
  is_home: boolean;
  location: string;
  result: 'W' | 'L' | null;
  score: string | null; // "35-28" or null if upcoming
  is_district: boolean;
  is_playoff: boolean;
  classification: string;
}

export interface TeamRoster {
  team_id: string;
  team_name: string;
  players: RosterPlayer[];
}

export interface RosterPlayer {
  id: string;
  number: string;
  name: string;
  position: string;
  grade: string; // "9", "10", "11", "12"
  height: string | null;
  weight: string | null;
  hometown: string | null;
}

export interface TeamSeasonStats {
  team_id: string;
  team_name: string;
  season: string; // "2025"
  games_played: number;
  // Offensive stats
  total_points: number;
  points_per_game: number;
  total_yards: number;
  yards_per_game: number;
  passing_yards: number;
  rushing_yards: number;
  turnovers: number;
  // Defensive stats
  points_allowed: number;
  points_allowed_per_game: number;
  yards_allowed: number;
  yards_allowed_per_game: number;
  takeaways: number;
  sacks: number;
  // Efficiency
  third_down_pct: number;
  fourth_down_pct: number;
  red_zone_pct: number;
  turnover_margin: number;
}

export interface TeamLeaders {
  team_id: string;
  passing: PlayerStatLine[];
  rushing: PlayerStatLine[];
  receiving: PlayerStatLine[];
  tackles: PlayerStatLine[];
  sacks: PlayerStatLine[];
}

export interface PlayerStatLine {
  player_id: string;
  player_name: string;
  player_number: string;
  player_position: string;
  stat_value: number;
  stat_label: string; // "Passing Yards", "Rushing TDs", etc.
}
