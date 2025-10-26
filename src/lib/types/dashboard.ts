export interface DashboardPayload {
  team: {
    id: string;
    name: string;
    mascot: string;
    city: string;
    record: string;
    logo_url: string;
  };
  last_game: {
    date: string;
    opponent: string;
    location: string;
    score: { [key: string]: number };
    result: string;
    summary: string;
  };
  upcoming_game: {
    date: string;
    opponent: string;
    location: string;
    kickoff_time: string;
    preview: string;
  };
  player_availability: {
    cleared: Array<{ number: number; name: string; position: string }>;
    limited: Array<{ number: number; name: string; position: string; note: string }>;
    out: Array<{ number: number; name: string; position: string; note: string }>;
  };
  key_performers: Array<{
    player_id: string;
    name: string;
    position: string;
    statline: string;
  }>;
  team_stats: {
    points_per_game: number;
    yards_per_game: number;
    turnover_margin: string;
    third_down_pct: number;
    red_zone_efficiency: number;
  };
  coach_notes: Array<{
    id: string;
    author: string;
    body: string;
    created_at: string;
  }>;
}