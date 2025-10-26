// Coach/Staff types
export interface Coach {
  id: string;
  name: string;
  position: string; // "AD/Head Coach", "DC", "OC & OL", etc.
  team: string;
}

// Game/Schedule types
export interface Game {
  id: string;
  date: string; // "8/29/25"
  home_team: string;
  away_team: string;
  home_score?: number;
  away_score?: number;
  result?: "W" | "L"; // from perspective of querying team
  location?: string; // "vs." or "@"
}

export interface TeamSchedule {
  team: string;
  games: Game[];
}

// Player/Roster types
export interface Player {
  id: string;
  number: string;
  name: string;
  position: string; // "QB", "RB", "WR", "LB", "DB", "OL", "DL", "TE", "K", "Slot"
  team: string;
  grade?: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  mascot: string;
  district: string;
  record: string; // "4-3"
  wins: number;
  losses: number;
}

// Dashboard types (existing)
export interface DashboardPayload {
  team: {
    name: string;
    mascot: string;
    record: string;
  };
  last_game: {
    opponent: string;
    score: Record<string, number>;
    summary: string;
  };
  upcoming_game: {
    opponent: string;
  };
  player_availability: {
    out: Array<{ number: string; name: string; note: string; position: string }>;
    limited: Array<{ number: string; name: string; note: string; position: string }>;
    cleared: Array<{ number: string; name: string; note: string; position: string }>;
  };
}

// Search result type
export interface SearchResult {
  type: "team" | "player" | "coach";
  id: string;
  name: string;
  // Team fields
  mascot?: string;
  district?: string;
  record?: string;
  // Player fields
  number?: string;
  position?: string;
  team?: string;
  grade?: string;
  // Coach fields
  title?: string; // coach position/title
}