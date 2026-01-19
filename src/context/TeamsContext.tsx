import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getAllTeams, type PowerRanking } from '@/src/lib/api';

interface TeamsContextType {
  teams: PowerRanking[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const TeamsContext = createContext<TeamsContextType | undefined>(undefined);

export function TeamsProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<PowerRanking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAllTeams();
      setTeams(data);
    } catch (err) {
      console.error('Error loading teams:', err);
      setError('Failed to load teams');
    } finally {
      setIsLoading(false);
    }
  };

  // Load teams on app start
  useEffect(() => {
    loadTeams();
  }, []);

  return (
    <TeamsContext.Provider value={{ teams, isLoading, error, refresh: loadTeams }}>
      {children}
    </TeamsContext.Provider>
  );
}

export function useTeams() {
  const context = useContext(TeamsContext);
  if (context === undefined) {
    throw new Error('useTeams must be used within a TeamsProvider');
  }
  return context;
}
