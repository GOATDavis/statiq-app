import type { DashboardPayload } from "./types/dashboard";

export const API_BASE = "http://192.168.1.197:8000/api/v1";

async function parseJSON<T = any>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`HTTP ${resp.status} ${resp.statusText} — ${text}`);
  }
  return resp.json() as Promise<T>;
}

export async function getDashboard(): Promise<DashboardPayload> {
  const resp = await fetch(`${API_BASE}/dashboard`);
  return parseJSON<DashboardPayload>(resp);
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

// Search API functions
export async function search(query: string): Promise<SearchResult[]> {
  const resp = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`);
  return parseJSON<SearchResult[]>(resp);
}

export async function getRecentSearches(): Promise<string[]> {
  const resp = await fetch(`${API_BASE}/search/recent`);
  return parseJSON<string[]>(resp);
}

export async function saveRecentSearch(query: string): Promise<void> {
  await fetch(`${API_BASE}/search/recent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
}