import type { DashboardPayload } from "./types/dashboard";
import type {
  LiveGame,
  FinishedGame,
  UpcomingGame,
  DistrictStanding,
  GameDetail,
  Play,
  Classification,
  GameLeadersResponse,
  RankingTeam,
  ClassificationOption
} from "./types/game";
import type { 
  TeamProfile, 
  TeamSchedule, 
  TeamRoster, 
  TeamSeasonStats,
  TeamLeaders 
} from "./types/team";
import type { 
  PlayerProfile, 
  PlayerSeasonStats, 
  PlayerGameLog 
} from "./types/player";
import { getOrCreateDeviceId } from "./votes";

// Enable mock data mode for development
const USE_MOCK_DATA = false; // TEMPORARILY ENABLED - Set to false when /scores endpoint is ready

const API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api/v1";
const RANKINGS_API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev/api";
const ML_API_BASE = "https://catechismal-cyndy-teacherly.ngrok-free.dev"; // ML prediction backend (no /api/v1 prefix)

// ============================================================================
// MOCK DATA GENERATORS
// ============================================================================

function generateMockScores(): ScoresResponse {
  const now = new Date();
  
  return {
    live_games: [
      {
        id: 'live-1',
        home_team_id: 'team-1',
        away_team_id: 'team-2',
        home_team_name: 'Trinity Christian',
        away_team_name: 'Parish Episcopal',
        home_team_mascot: 'Eagles',
        away_team_mascot: 'Panthers',
        home_score: 28,
        away_score: 21,
        quarter: '3rd',
        time_remaining: '8:45',
        is_live: true,
        district: 'TAPPS D1 District 1',
        classification: 'TAPPS D1',
        location: 'Eagle Stadium',
        started_at: now.toISOString(),
        updated_at: now.toISOString(),
        broadcaster: 'NFHS Network',
      },
      {
        id: 'live-2',
        home_team_id: 'team-3',
        away_team_id: 'team-4',
        home_team_name: 'Highland Park',
        away_team_name: 'Lovejoy',
        home_team_mascot: 'Scots',
        away_team_mascot: 'Leopards',
        home_score: 35,
        away_score: 14,
        quarter: '4th',
        time_remaining: '3:12',
        is_live: true,
        district: '5A D1 District 7',
        classification: '5A D1',
        location: 'Highlander Stadium',
        started_at: now.toISOString(),
        updated_at: now.toISOString(),
        broadcaster: 'ESPN+',
      },
    ],
    upcoming_games: [
      {
        id: 'upcoming-1',
        home_team_id: 'team-5',
        away_team_id: 'team-6',
        home_team_name: 'Jesuit',
        away_team_name: 'Bishop Lynch',
        home_team_mascot: 'Rangers',
        away_team_mascot: 'Friars',
        date: new Date(now.getTime() + 86400000).toISOString().split('T')[0],
        time: '7:00 PM',
        location: 'Postell Stadium',
        district: '6A D1 District 9',
        classification: '6A D1',
        week: 10,
        broadcaster: 'NFHS Network',
      },
      {
        id: 'upcoming-2',
        home_team_id: 'team-7',
        away_team_id: 'team-8',
        home_team_name: 'Prestonwood',
        away_team_name: 'John Paul II',
        home_team_mascot: 'Lions',
        away_team_mascot: 'Cardinals',
        date: new Date(now.getTime() + 172800000).toISOString().split('T')[0],
        time: '7:30 PM',
        location: 'Lion Stadium',
        district: 'TAPPS D1 District 1',
        classification: 'TAPPS D1',
        week: 10,
        broadcaster: 'NFHS Network',
      },
    ],
    finished_games: [
      {
        id: 'finished-1',
        home_team_id: 'team-1',
        away_team_id: 'team-7',
        home_team_name: 'Trinity Christian',
        away_team_name: 'Prestonwood',
        home_team_mascot: 'Eagles',
        away_team_mascot: 'Lions',
        home_score: 35,
        away_score: 28,
        date: new Date(now.getTime() - 86400000).toISOString().split('T')[0],
        time: '7:00 PM',
        location: 'Eagle Stadium',
        district: 'TAPPS D1 District 1',
        classification: 'TAPPS D1',
        final_status: 'Final',
        broadcaster: 'NFHS Network',
      },
      {
        id: 'finished-2',
        home_team_id: 'team-4',
        away_team_id: 'team-3',
        home_team_name: 'Lovejoy',
        away_team_name: 'Highland Park',
        home_team_mascot: 'Leopards',
        away_team_mascot: 'Scots',
        home_score: 21,
        away_score: 42,
        date: new Date(now.getTime() - 172800000).toISOString().split('T')[0],
        time: '7:30 PM',
        location: 'Leopard Stadium',
        district: '5A D1 District 7',
        classification: '5A D1',
        final_status: 'Final',
        broadcaster: 'ESPN+',
      },
    ],
    updated_at: now.toISOString(),
  };
}

// Export API_BASE for external use
export { API_BASE };
export const API_BASE_URL = API_BASE;

// Helper to add ngrok header to all requests
const ngrokHeaders = {
  'ngrok-skip-browser-warning': 'true'
};

async function parseJSON<T = any>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${resp.statusText} — ${text}`);
  }
  return resp.json() as Promise<T>;
}

// ============================================================================
// SCORES & GAMES API
// ============================================================================

export interface ScoresResponse {
  live_games: LiveGame[];
  upcoming_games: UpcomingGame[];
  finished_games: FinishedGame[];
  updated_at: string;
}

/**
 * Get all games for the scores dashboard
 * Optionally filter by classification and/or date range
 */
export async function getScores(params?: {
  classification?: Classification;
  date_from?: string; // ISO date
  date_to?: string;
  following_only?: boolean;
}): Promise<ScoresResponse> {
  // Return mock data in development mode
  if (USE_MOCK_DATA) {
    console.log('[API] Using mock data for scores');
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
    return generateMockScores();
  }

  // Get device ID for vote filtering (optional - if fails, predictions won't be filtered)
  let deviceId: string | null = null;
  try {
    deviceId = await getOrCreateDeviceId();
  } catch (error) {
    console.warn('[API] Could not get device ID for vote filtering:', error);
  }

  const queryParams = new URLSearchParams();
  if (params?.classification) {
    // Convert frontend format (5A-D1) to backend format (5A Division 1)
    const backendClassification = params.classification
      .replace('-D1', ' Division 1')
      .replace('-D2', ' Division 2');
    queryParams.set('classification', backendClassification);
  }
  if (params?.date_from) queryParams.set('date_from', params.date_from);
  if (params?.date_to) queryParams.set('date_to', params.date_to);
  if (params?.following_only) queryParams.set('following_only', 'true');
  if (deviceId) queryParams.set('device_id', deviceId); // Add device_id for prediction filtering (optional)
  
  const url = `${API_BASE}/scores${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const resp = await fetch(url, { headers: ngrokHeaders });
  return parseJSON<ScoresResponse>(resp);
}

/**
 * Get detailed information about a specific game
 * Including real-time play-by-play data and ML predictions
 */
export async function getGame(gameId: string): Promise<GameDetail> {
  console.log(`[API] Fetching game ${gameId} from ${ML_API_BASE}/games/${gameId}`);

  // Fetch game data and analytics in parallel
  const [gameResp, analyticsResp] = await Promise.all([
    fetch(`${ML_API_BASE}/games/${gameId}`, { headers: ngrokHeaders }),
    fetch(`${ML_API_BASE}/games/${gameId}/analytics`, { headers: ngrokHeaders }),
  ]);

  const gameData: any = await parseJSON(gameResp);
  let analytics: any = null;
  
  try {
    analytics = await parseJSON(analyticsResp);
    console.log('[API] Analytics fetched:', analytics);
  } catch (err) {
    console.warn('[API] Analytics fetch failed, using defaults:', err);
    analytics = {
      away_win_probability: 48.0,
      home_win_probability: 52.0,
    };
  }

  console.log('[API] Game data received:', JSON.stringify(gameData, null, 2));
  console.log('[API] Home team ID:', gameData.home_team_id);
  console.log('[API] Away team ID:', gameData.away_team_id);

  // Fetch team names
  const [homeTeamResp2, awayTeamResp2] = await Promise.all([
    fetch(`${API_BASE}/teams/${gameData.home_team_id}`, { headers: ngrokHeaders }),
    fetch(`${API_BASE}/teams/${gameData.away_team_id}`, { headers: ngrokHeaders })
  ]);

  const homeTeam: any = await parseJSON(homeTeamResp2);
  const awayTeam: any = await parseJSON(awayTeamResp2);

  console.log('[API] Home team:', homeTeam.name, homeTeam.mascot);
  console.log('[API] Away team:', awayTeam.name, awayTeam.mascot);

  // Combine game data with team names and analytics
  const completeGameData: GameDetail = {
    ...gameData,
    home_team_name: homeTeam.name,
    away_team_name: awayTeam.name,
    home_team_mascot: homeTeam.mascot,
    away_team_mascot: awayTeam.mascot,
    home_primary_color: homeTeam.primary_color,
    away_primary_color: awayTeam.primary_color,
    // Add analytics from dedicated endpoint
    analytics: analytics,
  };

  console.log('[API] Complete game data with analytics:', JSON.stringify(completeGameData, null, 2));

  return completeGameData;
}

/**
 * Get play-by-play data for a game
 */
export async function getGamePlays(gameId: string, params?: {
  limit?: number;
  offset?: number;
}): Promise<{ plays: Play[]; total: number }> {
  const queryParams = new URLSearchParams();
  if (params?.limit) queryParams.set('limit', params.limit.toString());
  if (params?.offset) queryParams.set('offset', params.offset.toString());
  
  const url = `${API_BASE}/games/${gameId}/plays${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const resp = await fetch(url, { headers: ngrokHeaders });
  return parseJSON(resp);
}

/**
 * Get district standings for a specific district
 */
export async function getDistrictStandings(
  classification: string,
  district: string
): Promise<DistrictStanding[]> {
  const resp = await fetch(`${API_BASE}/standings/${classification}/${district}`, { headers: ngrokHeaders });
  return parseJSON<DistrictStanding[]>(resp);
}

/**
 * Get game leaders (top performers) for both teams in a game
 * Returns passing, rushing, receiving, tackles, and sacks leaders
 */
export async function getGameLeaders(gameId: string): Promise<GameLeadersResponse> {
  const resp = await fetch(`${API_BASE}/games/${gameId}/leaders`, { headers: ngrokHeaders });
  return parseJSON<GameLeadersResponse>(resp);
}

// ============================================================================
// GAME ROSTER & DISTRICT API
// ============================================================================

export interface GameRosterPlayer {
  id: number;
  first_name: string;
  last_name: string;
  name: string;
  jersey: number | null;
  position: string;
  class_year: string | null;
  height: string | null;
  weight: string | null;
}

export interface GameRosterTeam {
  id: number;
  name: string;
  mascot: string;
  primary_color: string;
  background_color: string;
  players: GameRosterPlayer[];
}

export interface GameRosterResponse {
  home_team: GameRosterTeam;
  away_team: GameRosterTeam;
}

export interface DistrictStandingTeam {
  team_id: number;
  team_name: string;
  mascot: string;
  primary_color: string;
  overall_wins: number;
  overall_losses: number;
  overall_record: string;
  district_wins: number;
  district_losses: number;
  district_record: string;
  streak: number;
  streak_type: 'W' | 'L';
  is_current_game: boolean;
  rank: number;
}

export interface DistrictGame {
  game_id: number;
  home_team_id: number;
  home_team_name: string;
  home_team_color: string;
  home_score: number | null;
  away_team_id: number;
  away_team_name: string;
  away_team_color: string;
  away_score: number | null;
  status: string;
  quarter: string | null;
  time_remaining: string | null;
  game_date: string | null;
}

export interface GameDistrictResponse {
  district_name: string;
  current_game: DistrictGame;
  standings: DistrictStandingTeam[];
  other_games: DistrictGame[];
}

/**
 * Get rosters for both teams in a game
 */
export async function getGameRoster(gameId: string): Promise<GameRosterResponse> {
  const resp = await fetch(`${API_BASE}/games/${gameId}/roster`, { headers: ngrokHeaders });
  return parseJSON<GameRosterResponse>(resp);
}

/**
 * Get district standings and other district games for a game
 */
export async function getGameDistrict(gameId: string): Promise<GameDistrictResponse> {
  const resp = await fetch(`${API_BASE}/games/${gameId}/district`, { headers: ngrokHeaders });
  return parseJSON<GameDistrictResponse>(resp);
}

// Team District types
export interface TeamDistrictStanding {
  team_id: number;
  team_name: string;
  mascot: string;
  primary_color: string;
  overall_wins: number;
  overall_losses: number;
  overall_record: string;
  district_wins: number;
  district_losses: number;
  district_record: string;
  points_for: number;
  points_against: number;
  streak: number;
  streak_type: 'W' | 'L';
  is_user_team: boolean;
  rank: number;
}

export interface TeamDistrictGame {
  game_id: number;
  home_team_id: number;
  home_team_name: string;
  home_team_color: string;
  home_score: number | null;
  away_team_id: number;
  away_team_name: string;
  away_team_color: string;
  away_score: number | null;
  status: string;
  game_date: string | null;
}

export interface TeamDistrictResponse {
  district_name: string;
  team_id: number;
  team_name: string;
  standings: TeamDistrictStanding[];
  recent_games: TeamDistrictGame[];
}

/**
 * Get district standings and recent games for a team
 */
export async function getTeamDistrict(teamId: number): Promise<TeamDistrictResponse> {
  const resp = await fetch(`${API_BASE}/teams/${teamId}/district`, { headers: ngrokHeaders });
  return parseJSON<TeamDistrictResponse>(resp);
}

// ============================================================================
// TEAM API
// ============================================================================

// Season Leaders Types
export interface SeasonLeader {
  player_id: number;
  name: string;
  position: string;
  jersey: number | null;
  yards: number;
  tds: number;
  // Passing specific
  completions?: number;
  attempts?: number;
  ints?: number;
  // Rushing specific
  long?: number;
  // Receiving specific
  receptions?: number;
}

export interface TeamSeasonLeadersResponse {
  team_id: number;
  team_name: string;
  team_color: string | null;
  passing_leader: SeasonLeader | null;
  rushing_leader: SeasonLeader | null;
  receiving_leader: SeasonLeader | null;
}

// Recent Games Types
export interface RecentGame {
  game_id: number;
  date: string; // "11/29"
  full_date: string; // ISO date
  opponent_id: number;
  opponent_name: string;
  opponent_mascot: string;
  opponent_color: string;
  team_score: number;
  opponent_score: number;
  result: 'W' | 'L' | 'T';
  is_home: boolean;
  location: 'vs' | '@';
}

export interface TeamRecentGamesResponse {
  team_id: number;
  team_name: string;
  games: RecentGame[];
}

/**
 * Get season statistical leaders for a team
 */
export async function getTeamSeasonLeaders(teamId: string | number): Promise<TeamSeasonLeadersResponse> {
  const resp = await fetch(`${API_BASE}/teams/${teamId}/season-leaders`, { headers: ngrokHeaders });
  return parseJSON<TeamSeasonLeadersResponse>(resp);
}

/**
 * Get recent games for a team (last N games)
 */
export async function getTeamRecentGames(teamId: string | number, limit: number = 6): Promise<TeamRecentGamesResponse> {
  const resp = await fetch(`${API_BASE}/teams/${teamId}/recent-games?limit=${limit}`, { headers: ngrokHeaders });
  return parseJSON<TeamRecentGamesResponse>(resp);
}

/**
 * Get detailed team profile
 */
export async function getTeam(teamId: string): Promise<TeamProfile> {
  const resp = await fetch(`${API_BASE}/teams/${teamId}`, { headers: ngrokHeaders });
  return parseJSON<TeamProfile>(resp);
}

/**
 * Get team schedule (past and upcoming games)
 */
export async function getTeamSchedule(teamId: string): Promise<TeamSchedule> {
  const resp = await fetch(`${API_BASE}/teams/${teamId}/schedule`, { headers: ngrokHeaders });
  return parseJSON<TeamSchedule>(resp);
}

/**
 * Get team roster
 */
export async function getTeamRoster(teamId: string): Promise<TeamRoster> {
  const resp = await fetch(`${API_BASE}/teams/${teamId}/roster`, { headers: ngrokHeaders });
  return parseJSON<TeamRoster>(resp);
}

/**
 * Get team season statistics
 */
export async function getTeamStats(teamId: string, season?: string): Promise<TeamSeasonStats> {
  const url = season
    ? `${API_BASE}/teams/${teamId}/stats?season=${season}`
    : `${API_BASE}/teams/${teamId}/stats`;
  const resp = await fetch(url, { headers: ngrokHeaders });
  return parseJSON<TeamSeasonStats>(resp);
}

/**
 * Get team statistical leaders
 */
export async function getTeamLeaders(teamId: string): Promise<TeamLeaders> {
  const resp = await fetch(`${API_BASE}/teams/${teamId}/leaders`, { headers: ngrokHeaders });
  return parseJSON<TeamLeaders>(resp);
}

// ============================================================================
// PLAYER API
// ============================================================================

/**
 * Get detailed player profile
 */
export async function getPlayer(playerId: string): Promise<PlayerProfile> {
  const resp = await fetch(`${API_BASE}/players/${playerId}`, { headers: ngrokHeaders });
  return parseJSON<PlayerProfile>(resp);
}

/**
 * Get player season statistics
 */
export async function getPlayerStats(playerId: string, season?: string): Promise<PlayerSeasonStats> {
  const url = season
    ? `${API_BASE}/players/${playerId}/stats?season=${season}`
    : `${API_BASE}/players/${playerId}/stats`;
  const resp = await fetch(url, { headers: ngrokHeaders });
  return parseJSON<PlayerSeasonStats>(resp);
}

/**
 * Get player game-by-game statistics
 */
export async function getPlayerGameLog(playerId: string, season?: string): Promise<PlayerGameLog> {
  const url = season
    ? `${API_BASE}/players/${playerId}/gamelog?season=${season}`
    : `${API_BASE}/players/${playerId}/gamelog`;
  const resp = await fetch(url, { headers: ngrokHeaders });
  return parseJSON<PlayerGameLog>(resp);
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
  // Return mock data in development mode
  if (USE_MOCK_DATA) {
    console.log('[API] Using mock data for search:', query);
    await new Promise(resolve => setTimeout(resolve, 300)); // Simulate network delay
    
    const lowerQuery = query.toLowerCase();
    const mockResults: SearchResult[] = [];
    
    // Mock teams
    const mockTeams = [
      { id: 'team-1', name: 'Trinity Christian', mascot: 'Eagles', district: 'TAPPS D1 District 1', record: '8-2', city: 'Cedar Hill', classification: 'TAPPS D1' },
      { id: 'team-2', name: 'Parish Episcopal', mascot: 'Panthers', district: 'TAPPS D1 District 1', record: '7-3', city: 'Dallas', classification: 'TAPPS D1' },
      { id: 'team-3', name: 'Highland Park', mascot: 'Scots', district: '5A D1 District 7', record: '9-1', city: 'Highland Park', classification: '5A D1' },
      { id: 'team-4', name: 'Lovejoy', mascot: 'Leopards', district: '5A D1 District 7', record: '6-4', city: 'Lucas', classification: '5A D1' },
      { id: 'team-5', name: 'Jesuit', mascot: 'Rangers', district: '6A D1 District 9', record: '8-2', city: 'Dallas', classification: '6A D1' },
      { id: 'team-7', name: 'Prestonwood', mascot: 'Lions', district: 'TAPPS D1 District 1', record: '7-3', city: 'Plano', classification: 'TAPPS D1' },
    ];
    
    mockTeams.forEach(team => {
      if (team.name.toLowerCase().includes(lowerQuery) || 
          team.mascot.toLowerCase().includes(lowerQuery) ||
          team.city.toLowerCase().includes(lowerQuery)) {
        mockResults.push({
          type: 'team',
          id: team.id,
          name: team.name,
          mascot: team.mascot,
          district: team.district,
          record: team.record,
          city: team.city,
          classification: team.classification,
        });
      }
    });
    
    // Mock players
    const mockPlayers = [
      { id: 'player-1', name: 'John Smith', number: '7', position: 'QB', team: 'Trinity Christian', grade: '12' },
      { id: 'player-2', name: 'Mike Johnson', number: '22', position: 'RB', team: 'Parish Episcopal', grade: '11' },
      { id: 'player-3', name: 'David Brown', number: '1', position: 'WR', team: 'Highland Park', grade: '12' },
      { id: 'player-4', name: 'Chris Davis', number: '44', position: 'LB', team: 'Lovejoy', grade: '11' },
      { id: 'player-5', name: 'Tyler Williams', number: '10', position: 'QB', team: 'Jesuit', grade: '12' },
    ];
    
    mockPlayers.forEach(player => {
      if (player.name.toLowerCase().includes(lowerQuery) ||
          player.position.toLowerCase().includes(lowerQuery) ||
          player.team.toLowerCase().includes(lowerQuery)) {
        mockResults.push({
          type: 'player',
          id: player.id,
          name: player.name,
          number: player.number,
          position: player.position,
          team: player.team,
          grade: player.grade,
        });
      }
    });
    
    // Mock coaches
    const mockCoaches = [
      { id: 'coach-1', name: 'Coach Davis', title: 'Head Coach', team: 'Trinity Christian' },
      { id: 'coach-2', name: 'Coach Thompson', title: 'Head Coach', team: 'Parish Episcopal' },
      { id: 'coach-3', name: 'Coach Anderson', title: 'Head Coach', team: 'Highland Park' },
    ];
    
    mockCoaches.forEach(coach => {
      if (coach.name.toLowerCase().includes(lowerQuery) ||
          coach.team.toLowerCase().includes(lowerQuery)) {
        mockResults.push({
          type: 'coach',
          id: coach.id,
          name: coach.name,
          title: coach.title,
          team: coach.team,
        });
      }
    });
    
    return mockResults;
  }
  
  const resp = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, { headers: ngrokHeaders });
  return parseJSON<SearchResult[]>(resp);
}

/**
 * Get recent searches for current user
 */
export async function getRecentSearches(): Promise<string[]> {
  const resp = await fetch(`${API_BASE}/search/recent`, { headers: ngrokHeaders });
  return parseJSON<string[]>(resp);
}

/**
 * Save a recent search
 */
export async function saveRecentSearch(query: string): Promise<void> {
  await fetch(`${API_BASE}/search/recent`, {
    method: "POST",
    headers: { ...ngrokHeaders, "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
}

// ============================================================================
// DASHBOARD API (for coaches)
// ============================================================================

export async function getDashboard(): Promise<DashboardPayload> {
  const resp = await fetch(`${API_BASE}/dashboard`, { headers: ngrokHeaders });
  return parseJSON<DashboardPayload>(resp);
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
  const resp = await fetch(`${API_BASE}/top-performers`, { headers: ngrokHeaders });
  return parseJSON<TopPerformersResponse>(resp);
}

// ============================================================================
// POWER RANKINGS API
// ============================================================================

export interface RankingClassification {
  classification: string;
}

export interface PowerRanking {
  rank: number;
  school_id: number;
  team_id: number; // Use this for navigation to team profiles
  school_name: string;
  mascot?: string;
  city?: string;
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
  rank_change?: number; // Negative = moved up, positive = moved down, 0 = no change
  previous_rank?: number | null; // Rank from previous week, null if new to rankings
}

/**
 * Get all teams for browse/search screen
 */
export async function getAllTeams(params?: {
  classification?: string;
}): Promise<PowerRanking[]> {
  const queryParams = new URLSearchParams();
  if (params?.classification) queryParams.set('classification', params.classification);

  const url = `${RANKINGS_API_BASE}/teams/all${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
  const resp = await fetch(url, { headers: ngrokHeaders });
  return parseJSON<PowerRanking[]>(resp);
}

/**
 * Get all available classifications for power rankings
 */
export async function getRankingsClassifications(season: string = '2025'): Promise<RankingClassification[]> {
  const resp = await fetch(`${RANKINGS_API_BASE}/rankings/classifications/?season=${season}`, {
    headers: ngrokHeaders
  });
  return parseJSON<RankingClassification[]>(resp);
}

/**
 * Get power rankings for all teams or filtered by classification
 */
export async function getPowerRankings(params?: {
  classification?: string;
  season?: string;
}): Promise<PowerRanking[]> {
  const queryParams = new URLSearchParams();
  if (params?.classification) queryParams.set('classification', params.classification);
  if (params?.season) queryParams.set('season', params.season || '2025');
  else queryParams.set('season', '2025');

  const url = `${RANKINGS_API_BASE}/rankings/${queryParams.toString() ? '?' + queryParams.toString() : '?season=2025'}`;
  const resp = await fetch(url, { headers: ngrokHeaders });
  return parseJSON<PowerRanking[]>(resp);
}

// ============================================================================
// FAVORITES/FOLLOWING API
// ============================================================================

export interface FollowingResponse {
  teams: string[]; // Array of team IDs
  players: string[]; // Array of player IDs
}

/**
 * Get user's followed teams and players
 */
export async function getFollowing(): Promise<FollowingResponse> {
  // For now, this will be stored locally via AsyncStorage
  throw new Error("Following API not implemented yet - use local storage");
}

/**
 * Follow a team
 */
export async function followTeam(teamId: string): Promise<void> {
  throw new Error("Following API not implemented yet - use local storage");
}

/**
 * Unfollow a team
 */
export async function unfollowTeam(teamId: string): Promise<void> {
  throw new Error("Following API not implemented yet - use local storage");
}

/**
 * Follow a player
 */
export async function followPlayer(playerId: string): Promise<void> {
  throw new Error("Following API not implemented yet - use local storage");
}

/**
 * Unfollow a player
 */
export async function unfollowPlayer(playerId: string): Promise<void> {
  throw new Error("Following API not implemented yet - use local storage");
}

// ============================================================================
// VOTING API
// ============================================================================

export interface VoteResponse {
  message: string;
  vote: 'home' | 'away';
}

export interface VotesResponse {
  home: number;
  away: number;
  home_percentage: number;
  away_percentage: number;
}

/**
 * Cast a vote for a game
 */
export async function castVote(
  gameId: string,
  deviceId: string,
  team: 'home' | 'away'
): Promise<VoteResponse> {
  const resp = await fetch(`${API_BASE}/games/${gameId}/vote`, {
    method: 'POST',
    headers: {
      ...ngrokHeaders,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      device_id: deviceId,
      predicted_winner: team,
    }),
  });
  
  return parseJSON<VoteResponse>(resp);
}

/**
 * Get vote statistics for a game
 */
export async function getVotes(gameId: string): Promise<VotesResponse> {
  const resp = await fetch(`${API_BASE}/games/${gameId}/votes`, {
    headers: ngrokHeaders,
  });
  
  return parseJSON<VotesResponse>(resp);
}

// ============================================================================
// RANKINGS API
// ============================================================================

/**
 * Get power rankings for a classification
 */
export async function getRankings(
  classification?: string,
  season: number = 2025
): Promise<RankingTeam[]> {
  const params = new URLSearchParams();
  if (classification) {
    params.set('classification', classification);
  }
  params.set('season', season.toString());

  const resp = await fetch(
    `${RANKINGS_API_BASE}/rankings/?${params.toString()}`,
    { headers: ngrokHeaders }
  );
  
  return parseJSON<RankingTeam[]>(resp);
}

/**
 * Get list of all classifications that have rankings
 */
export async function getClassifications(
  season: number = 2025
): Promise<ClassificationOption[]> {
  const params = new URLSearchParams();
  params.set('season', season.toString());

  const resp = await fetch(
    `${RANKINGS_API_BASE}/rankings/classifications/?${params.toString()}`,
    { headers: ngrokHeaders }
  );
  
  return parseJSON<ClassificationOption[]>(resp);
}