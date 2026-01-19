import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAllTeams, type PowerRanking } from '@/src/lib/api';

interface AppDataContextType {
  // Teams data
  teams: PowerRanking[];
  teamsLoaded: boolean;
  
  // Loading state
  isFullyLoaded: boolean;
  loadingProgress: number; // 0-100
  loadingMessage: string;
  
  // Refresh
  refreshTeams: () => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<PowerRanking[]>([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingMessage, setLoadingMessage] = useState('Starting up...');

  const loadTeams = async () => {
    try {
      setLoadingMessage('Loading teams...');
      setLoadingProgress(30);
      const data = await getAllTeams();
      setTeams(data);
      setTeamsLoaded(true);
      setLoadingProgress(100);
      setLoadingMessage('Ready!');
    } catch (err) {
      console.error('Error loading teams:', err);
      setLoadingMessage('Failed to load teams');
      // Still mark as loaded so app can proceed
      setTeamsLoaded(true);
      setLoadingProgress(100);
    }
  };

  // Load all data on app start
  useEffect(() => {
    const loadAllData = async () => {
      setLoadingProgress(10);
      setLoadingMessage('Initializing...');
      
      // Small delay for smooth animation
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Load teams
      await loadTeams();
    };

    loadAllData();
  }, []);

  const isFullyLoaded = teamsLoaded;

  return (
    <AppDataContext.Provider
      value={{
        teams,
        teamsLoaded,
        isFullyLoaded,
        loadingProgress,
        loadingMessage,
        refreshTeams: loadTeams,
      }}
    >
      {children}
    </AppDataContext.Provider>
  );
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}

// Re-export useTeams for backward compatibility
export function useTeams() {
  const { teams, teamsLoaded, refreshTeams } = useAppData();
  return {
    teams,
    isLoading: !teamsLoaded,
    error: null,
    refresh: refreshTeams,
  };
}
