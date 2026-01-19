// Development mode: set to true to use mock data (no backend required)
export const USE_MOCK_DATA = false; // Set to true when developing without backend

// API Base URL - update this for your environment
export const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";

// ============================================================================
// API CLIENT
// ============================================================================

async function parseJSON<T = any>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${resp.statusText}${text ? ` — ${text}` : ""}`);
  }
  return resp.json() as Promise<T>;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_DASHBOARD_DATA: DashboardData = {
  is_game_day: false,
  team: {
    id: "8f2c1b0d-3a9d-41c6-9f02-8e4e5e1c56a4",
    name: "Joshua",
    mascot: "Owls",
    city: "Joshua, TX",
    record: "3-2",
    logo_url: "https://statiq.app/assets/teams/joshua-owls.png",
    primary_color: "#0066cc",
    background_color: "#f5f0e8",
  },
  last_game: {
    game_id: 1,
    date: "2025-10-18",
    opponent: "Cleburne Yellowjackets",
    location: "Home",
    score: { "Joshua": 24, "Cleburne Yellowjackets": 21 },
    result: "W",
    summary: "QB J. Miller threw for 212 yards and 2 TDs as Joshua edged Cleburne 24-21.",
  },
  upcoming_game: {
    date: "2025-11-14",
    opponent: "Burleson Elks",
    location: "Away",
    kickoff_time: "2025-11-14T19:00:00+00:00",
    preview: "District rivalry on the road; emphasis on third-down efficiency.",
    primary_color: "#8b0000",
    background_color: "#f5f0e8",
  },
  player_availability: {
    cleared: [
      { number: 7, name: "J. Miller", position: "QB" },
      { number: 22, name: "T. Reed", position: "RB" },
      { number: 10, name: "K. Lopez", position: "WR" },
    ],
    limited: [
      { number: 11, name: "S. King", position: "WR", note: "ankle sprain" },
    ],
    out: [
      { number: 54, name: "M. Hall", position: "LB", note: "concussion protocol" },
    ],
  },
  key_performers: [
    {
      player_id: "9bcd14a1-22df-4ad2-bfa8-0a72a3cc9e2e",
      name: "T. Reed",
      position: "RB",
      statline: "18 rushes, 112 yds, 1 TD",
    },
    {
      player_id: "a642a97c-83b4-4b19-ae7e-1b665b6e2c58",
      name: "J. Miller",
      position: "QB",
      statline: "14/21, 212 yds, 2 TD, 0 INT",
    },
  ],
};

const MOCK_TOP_PERFORMERS: TopPerformersResponse = {
  season_leaders: {
    rushing_yards: [
      {
        player_id: 1,
        player_name: "T. Reed",
        jersey: 22,
        rushing_yards: 856,
        rushing_tds: 12,
        rushing_attempts: 142,
        passing_yards: 0,
        passing_tds: 0,
        passing_completions: 0,
        passing_attempts: 0,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        games_played: 5,
      },
    ],
    rushing_tds: [
      {
        player_id: 1,
        player_name: "T. Reed",
        jersey: 22,
        rushing_yards: 856,
        rushing_tds: 12,
        rushing_attempts: 142,
        passing_yards: 0,
        passing_tds: 0,
        passing_completions: 0,
        passing_attempts: 0,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        games_played: 5,
      },
    ],
    passing_yards: [
      {
        player_id: 2,
        player_name: "J. Miller",
        jersey: 7,
        rushing_yards: 48,
        rushing_tds: 1,
        rushing_attempts: 12,
        passing_yards: 1124,
        passing_tds: 14,
        passing_completions: 78,
        passing_attempts: 121,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        games_played: 5,
      },
    ],
    passing_tds: [
      {
        player_id: 2,
        player_name: "J. Miller",
        jersey: 7,
        rushing_yards: 48,
        rushing_tds: 1,
        rushing_attempts: 12,
        passing_yards: 1124,
        passing_tds: 14,
        passing_completions: 78,
        passing_attempts: 121,
        receiving_yards: 0,
        receiving_tds: 0,
        receptions: 0,
        games_played: 5,
      },
    ],
    receiving_yards: [
      {
        player_id: 3,
        player_name: "K. Lopez",
        jersey: 10,
        rushing_yards: 0,
        rushing_tds: 0,
        rushing_attempts: 0,
        passing_yards: 0,
        passing_tds: 0,
        passing_completions: 0,
        passing_attempts: 0,
        receiving_yards: 642,
        receiving_tds: 7,
        receptions: 38,
        games_played: 5,
      },
    ],
    receiving_tds: [
      {
        player_id: 3,
        player_name: "K. Lopez",
        jersey: 10,
        rushing_yards: 0,
        rushing_tds: 0,
        rushing_attempts: 0,
        passing_yards: 0,
        passing_tds: 0,
        passing_completions: 0,
        passing_attempts: 0,
        receiving_yards: 642,
        receiving_tds: 7,
        receptions: 38,
        games_played: 5,
      },
    ],
  },
  single_game_bests: {
    rushing_yards: {
      value: 182,
      player: "T. Reed",
      game_id: 1,
      opponent: "Cleburne Yellowjackets",
    },
    rushing_tds: {
      value: 3,
      player: "T. Reed",
      game_id: 1,
      opponent: "Cleburne Yellowjackets",
    },
    passing_yards: {
      value: 287,
      player: "J. Miller",
      game_id: 2,
      opponent: "Midlothian Panthers",
    },
    total_tds: {
      value: 4,
      player: "J. Miller",
      game_id: 2,
      opponent: "Midlothian Panthers",
    },
  },
};

const MOCK_GAME_TOP_PERFORMERS: GameTopPerformersResponse = {
  game_id: 1,
  top_rushers: [
    {
      player_id: 1,
      player_name: "T. Reed",
      jersey: 22,
      position: "RB",
      rushing_yards: 182,
      rushing_tds: 2,
      passing_yards: 0,
      passing_tds: 0,
      receiving_yards: 0,
      receiving_tds: 0,
      stat_line: "22 CAR, 182 YDS, 2 TD",
    },
  ],
  top_passers: [
    {
      player_id: 2,
      player_name: "J. Miller",
      jersey: 7,
      position: "QB",
      rushing_yards: 12,
      rushing_tds: 0,
      passing_yards: 212,
      passing_tds: 2,
      receiving_yards: 0,
      receiving_tds: 0,
      stat_line: "14/21, 212 YDS, 2 TD",
    },
  ],
  top_receivers: [
    {
      player_id: 3,
      player_name: "K. Lopez",
      jersey: 10,
      position: "WR",
      rushing_yards: 0,
      rushing_tds: 0,
      passing_yards: 0,
      passing_tds: 0,
      receiving_yards: 98,
      receiving_tds: 1,
      stat_line: "6 REC, 98 YDS, 1 TD",
    },
  ],
};

// ============================================================================
// COACH DASHBOARD API
// ============================================================================

export interface TeamData {
  id: string;
  name: string;
  mascot: string;
  city?: string;
  record?: string;
  logo_url?: string;
  primary_color?: string;
  background_color?: string;
}

export interface LastGameData {
  game_id?: number;
  date: string;
  opponent: string;
  location: "Home" | "Away" | "Neutral";
  score: { [key: string]: number };
  result: "W" | "L" | "T";
  summary?: string;
}

export interface UpcomingGameData {
  date: string;
  opponent: string;
  location: "Home" | "Away" | "Neutral";
  kickoff_time?: string;
  preview?: string;
  primary_color?: string;
  background_color?: string;
}

export interface PlayerAvailabilityItem {
  number: number;
  name: string;
  position?: string;
  note?: string;
}

export interface PlayerAvailabilityData {
  out: PlayerAvailabilityItem[];
  limited: PlayerAvailabilityItem[];
  cleared: PlayerAvailabilityItem[];
}

export interface KeyPerformerData {
  player_id: string;
  name: string;
  position?: string;
  statline: string;
}

export interface DistrictStandingData {
  team: string;
  wins: number;
  losses: number;
  inPlayoffs: boolean;
  movement: 'up' | 'down' | 'neutral';
}

export interface DashboardData {
  team: TeamData;
  last_game?: LastGameData;
  upcoming_game?: UpcomingGameData;
  player_availability?: PlayerAvailabilityData;
  key_performers?: KeyPerformerData[];
  is_game_day?: boolean;
  district_standings?: DistrictStandingData[];
}

/**
 * Get coach dashboard data
 */
export async function getDashboard(): Promise<DashboardData> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_DASHBOARD_DATA;
  }
  const resp = await fetch(`${API_BASE}/dashboard`, {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return parseJSON<DashboardData>(resp);
}

// ============================================================================
// TOP PERFORMERS API
// ============================================================================

export interface TopPerformersResponse {
  season_leaders: {
    rushing_yards: PlayerSeasonStat[];
    rushing_tds: PlayerSeasonStat[];
    passing_yards: PlayerSeasonStat[];
    passing_tds: PlayerSeasonStat[];
    receiving_yards: PlayerSeasonStat[];
    receiving_tds: PlayerSeasonStat[];
  };
  single_game_bests: {
    rushing_yards: SingleGameBest;
    rushing_tds: SingleGameBest;
    passing_yards: SingleGameBest;
    total_tds: SingleGameBest;
  };
}

export interface PlayerSeasonStat {
  player_id: number;
  player_name: string;
  jersey: number;
  rushing_yards: number;
  rushing_tds: number;
  rushing_attempts: number;
  passing_yards: number;
  passing_tds: number;
  passing_completions: number;
  passing_attempts: number;
  receiving_yards: number;
  receiving_tds: number;
  receptions: number;
  games_played: number;
}

export interface SingleGameBest {
  value: number;
  player: string | null;
  game_id: number | null;
  opponent?: string;
}

/**
 * Get top performers - season leaders and single-game bests
 */
export async function getTopPerformers(): Promise<TopPerformersResponse> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_TOP_PERFORMERS;
  }
  const resp = await fetch(`${API_BASE}/top-performers`, {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return parseJSON<TopPerformersResponse>(resp);
}

export interface GameTopPerformersResponse {
  game_id: number;
  top_rushers: GamePerformer[];
  top_passers: GamePerformer[];
  top_receivers: GamePerformer[];
}

export interface GamePerformer {
  player_id: number;
  player_name: string;
  jersey: number;
  position: string;
  rushing_yards: number;
  rushing_tds: number;
  passing_yards: number;
  passing_tds: number;
  receiving_yards: number;
  receiving_tds: number;
  stat_line: string;
}

/**
 * Get top performers from a specific game
 */
export async function getGameTopPerformers(gameId: number): Promise<GameTopPerformersResponse> {
  if (USE_MOCK_DATA) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_GAME_TOP_PERFORMERS;
  }
  const resp = await fetch(`${API_BASE}/games/${gameId}/top-performers`, {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return parseJSON<GameTopPerformersResponse>(resp);
}

// ============================================================================
// PLAYER API
// ============================================================================

export interface PlayerStats {
  // Passing stats
  passing_yards?: number;
  passing_tds?: number;
  passing_completions?: number;
  passing_attempts?: number;
  passing_completion_pct?: number;
  passing_ints?: number;
  qb_rating?: number;
  // Rushing stats
  rushing_yards?: number;
  rushing_tds?: number;
  rushing_attempts?: number;
  rushing_avg?: number;
  rushing_long?: number;
  // Receiving stats
  receiving_yards?: number;
  receiving_tds?: number;
  receptions?: number;
  targets?: number;
  receiving_avg?: number;
  receiving_long?: number;
  // Defense stats
  tackles?: number;
  tfl?: number;
  sacks?: number;
  qb_hurries?: number;
  interceptions?: number;
  pass_breakups?: number;
  forced_fumbles?: number;
  // Kicking stats
  fg_made?: number;
  fg_attempts?: number;
  fg_pct?: number;
  fg_long?: number;
  xp_made?: number;
  xp_attempts?: number;
}

export interface PlayerGame {
  opponent: string;
  date: string;
  result: "W" | "L";
  team_score: number;
  opponent_score: number;
  // Passing stats
  passing_completions?: number;
  passing_attempts?: number;
  passing_yards?: number;
  passing_tds?: number;
  // Rushing stats
  rushing_yards?: number;
  rushing_tds?: number;
  rushing_attempts?: number;
  // Receiving stats
  receptions?: number;
  receiving_yards?: number;
  receiving_tds?: number;
  // Defense stats
  tackles?: number;
  tfl?: number;
  sacks?: number;
  interceptions?: number;
  pass_breakups?: number;
  // Kicking stats
  fg_made?: number;
  fg_attempts?: number;
  xp_made?: number;
  xp_attempts?: number;
}

export interface PlayerData {
  number: string;
  name: string;
  position: string;
  class: string;
  height?: string;
  weight?: string;
  gpa?: string;
  team: string;
  stats?: PlayerStats;
  games?: PlayerGame[];
}

/**
 * Get player profile by number
 */
export async function getPlayer(playerNumber: string): Promise<PlayerData> {
  const resp = await fetch(`${API_BASE}/players/${playerNumber}`, {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return parseJSON<PlayerData>(resp);
}

// ============================================================================
// SEARCH API
// ============================================================================

export interface SearchResult {
  type: "team" | "player" | "coach";
  id: string;
  name: string;
  // Team fields
  mascot?: string;
  district?: string;
  record?: string;
  city?: string;
  classification?: string;
  // Player fields
  number?: string;
  position?: string;
  team?: string;
  grade?: string;
  // Coach fields
  title?: string;
}

/**
 * Search for teams, players, or coaches
 */
export async function search(query: string): Promise<SearchResult[]> {
  const resp = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return parseJSON<SearchResult[]>(resp);
}

// ============================================================================
// GAME RECAP API
// ============================================================================

export interface TeamGameStats {
  total_yards: number;
  passing_yards: number;
  rushing_yards: number;
  first_downs: number;
  third_down_conv: string;
  fourth_down_conv: string;
  turnovers: number;
  penalties: string;
  time_of_possession: string;
}

export interface ScoringPlay {
  quarter: number;
  time: string;
  team: string;
  description: string;
  away_score: number;
  home_score: number;
}

export interface PlayerPassingStats {
  player_id: number;
  name: string;
  jersey: number;
  completions: number;
  attempts: number;
  yards: number;
  tds: number;
  ints: number;
  rating?: number;
}

export interface PlayerRushingStats {
  player_id: number;
  name: string;
  jersey: number;
  carries: number;
  yards: number;
  tds: number;
  long: number;
  avg: number;
}

export interface PlayerReceivingStats {
  player_id: number;
  name: string;
  jersey: number;
  receptions: number;
  targets?: number;
  yards: number;
  tds: number;
  long: number;
  avg: number;
}

export interface PlayerDefenseStats {
  player_id: number;
  name: string;
  jersey: number;
  tackles: number;
  solo: number;
  tfl: number;
  sacks: number;
  ints: number;
  pbu: number;
}

export interface GameRecapTeam {
  id: number;
  name: string;
  mascot: string;
  score: number;
  primary_color: string;
  background_color: string;
}

export interface GameRecapData {
  game_id: number;
  game_date: string;
  location: string;
  home_team: GameRecapTeam;
  away_team: GameRecapTeam;
  quarter_scores: {
    home: number[];
    away: number[];
  };
  team_stats: {
    home: TeamGameStats;
    away: TeamGameStats;
  };
  scoring_plays: ScoringPlay[];
  passing: {
    home: PlayerPassingStats[];
    away: PlayerPassingStats[];
  };
  rushing: {
    home: PlayerRushingStats[];
    away: PlayerRushingStats[];
  };
  receiving: {
    home: PlayerReceivingStats[];
    away: PlayerReceivingStats[];
  };
  defense: {
    home: PlayerDefenseStats[];
    away: PlayerDefenseStats[];
  };
}

/**
 * Get full game recap with stats
 */
export async function getGameRecap(gameId: number): Promise<GameRecapData> {
  const resp = await fetch(`${API_BASE}/games/${gameId}/recap`, {
    headers: {
      'ngrok-skip-browser-warning': 'true'
    }
  });
  return parseJSON<GameRecapData>(resp);
}