import AsyncStorage from '@react-native-async-storage/async-storage';

const RECENT_SEARCHES_KEY = '@statiq_recent_searches';
const MAX_RECENT = 10;

export interface RecentSearch {
  type: 'player' | 'team';
  id: string;
  name: string;
  number?: string;
  position?: string;
  team?: string;
  mascot?: string;
  primary_color?: string;
  timestamp: number;
}

export async function saveRecentSearch(search: Omit<RecentSearch, 'timestamp'>): Promise<void> {
  try {
    const existingData = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    const existing: RecentSearch[] = existingData ? JSON.parse(existingData) : [];
    
    // Remove duplicate if exists
    const filtered = existing.filter(item => item.id !== search.id);
    
    // Add new search at the beginning
    const updated = [
      { ...search, timestamp: Date.now() },
      ...filtered
    ].slice(0, MAX_RECENT);
    
    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving recent search:', error);
  }
}

export async function getRecentSearches(): Promise<RecentSearch[]> {
  try {
    const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading recent searches:', error);
    return [];
  }
}

export async function deleteRecentSearch(id: string): Promise<void> {
  try {
    const data = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
    if (!data) return;

    const searches: RecentSearch[] = JSON.parse(data);
    const filtered = searches.filter(search => search.id !== id);

    await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting recent search:', error);
  }
}

export async function clearRecentSearches(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
  } catch (error) {
    console.error('Error clearing recent searches:', error);
  }
}
