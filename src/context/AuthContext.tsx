import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useSegments } from 'expo-router';
import { Platform, Dimensions } from 'react-native';
import { UserProfile, FanProfile, CoachProfile, PlayerProfile } from '../lib/types/user';

// Device detection - iPad gets sidebar layout, iPhone gets bottom tabs
// Primary: Platform.isPad (native iOS check, most reliable)
// Backup: Dimension check for edge cases
const getIsTablet = () => {
  // Platform.isPad is the most reliable native check
  if (Platform.OS !== 'ios') return false;
  
  // Use native isPad first - this is set by iOS itself
  if (Platform.isPad === true) {
    console.log('[DEVICE] Platform.isPad is TRUE - routing to iPad interface');
    return true;
  }
  
  if (Platform.isPad === false) {
    console.log('[DEVICE] Platform.isPad is FALSE - routing to iPhone interface');
    return false;
  }
  
  // Fallback to dimensions only if isPad is undefined (shouldn't happen)
  const { width, height } = Dimensions.get('window');
  const minDimension = Math.min(width, height);
  const isTablet = minDimension >= 600;
  console.log(`[DEVICE] Fallback check: width=${width}, height=${height}, minDimension=${minDimension}, isTablet=${isTablet}`);
  return isTablet;
};
const isIPad = getIsTablet();

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, username: string, password: string, firstName: string, lastName: string, zipCode?: string) => Promise<void>;
  selectRole: (role: 'fan' | 'coach' | 'player') => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const BACKEND_URL = 'https://catechismal-cyndy-teacherly.ngrok-free.dev';

// ============================================
// DEV MODE CONTROLS
// ============================================
const DEV_MODE = __DEV__; // true in development
const SKIP_AUTH = false; // Skip login screen in dev
const DEV_USER_ROLE: 'fan' | 'coach' | 'player' = 'fan'; // Toggle this to test different roles
const MOCK_BACKEND = false; // Use real backend with new auth system
// ============================================

// Auth version - increment this to force all users to re-login
const AUTH_VERSION = '2';

// Mock users for development
const MOCK_FAN: FanProfile = {
  id: 'dev-fan-1',
  email: 'dev@fan.com',
  userType: 'fan',
  createdAt: new Date().toISOString(),
  favoriteTeams: ['team-1', 'team-2'],
  adFree: false,
  subscriptionStatus: 'free',
  notificationPreferences: {
    scores: true,
    bigPlays: true,
    gameStart: true,
  },
};

const MOCK_COACH: CoachProfile = {
  id: 'dev-coach-1',
  email: 'dev@coach.com',
  userType: 'coach',
  createdAt: new Date().toISOString(),
  teamId: 'team-1',
  schoolId: 'school-1',
  position: 'Head Coach',
  subscriptionStatus: 'active',
};

const MOCK_PLAYER: PlayerProfile = {
  id: 'dev-player-1',
  email: 'dev@player.com',
  userType: 'player',
  createdAt: new Date().toISOString(),
  playerId: 'player-1',
  teamId: 'team-1',
  schoolId: 'school-1',
  grade: '11',
  position: 'QB',
  jerseyNumber: '7',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Debug: Check AsyncStorage immediately
    const debugStorage = async () => {
      try {
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('[AUTH DEBUG] All AsyncStorage keys:', allKeys);
        const token = await AsyncStorage.getItem('auth_token');
        console.log('[AUTH DEBUG] Token value:', token);
      } catch (e) {
        console.error('[AUTH DEBUG] Error reading storage:', e);
      }
    };
    debugStorage();
    checkAuthStatus();
  }, []);

  // Auto-navigate based on user role
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inRoleSelect = segments[0] === '(auth)' && (segments[1] === 'role-select' as any);

    // Check if user has logged in but not selected a role (MOCK_BACKEND only)
    const checkRoleSelection = async () => {
      // Only check role selection for mock backend mode
      if (MOCK_BACKEND) {
        const email = await AsyncStorage.getItem('user_email');
        const hasRole = await AsyncStorage.getItem('selected_role');
        
        if (email && !hasRole && !inRoleSelect) {
          // User logged in but no role selected - go to role selector
          router.replace('/(auth)/role-select' as any);
          return;
        }
      }

      if (!user && !inAuthGroup) {
        // Not logged in, redirect to auth
        router.replace('/(auth)/login');
      } else if (user) {
        // Check if coach is on wrong interface for their device
        const inCoachIPad = segments[0] === '(coach)';
        const inCoachPhone = segments[0] === '(coach-phone)';
        
        if (user.userType === 'coach') {
          const isTabletNow = getIsTablet(); // Recalculate at routing time
          console.log('[ROUTING] Coach detected, isTabletNow:', isTabletNow, 'inCoachIPad:', inCoachIPad, 'inCoachPhone:', inCoachPhone);
          
          // iPhone coach on iPad interface -> redirect to phone interface
          if (!isTabletNow && inCoachIPad) {
            console.log('[ROUTING] iPhone coach on iPad interface, redirecting to phone...');
            router.replace('/(coach-phone)/dashboard');
            return;
          }
          // iPad coach on phone interface -> redirect to iPad interface
          if (isTabletNow && inCoachPhone) {
            console.log('[ROUTING] iPad coach on phone interface, redirecting to iPad...');
            router.replace('/(coach)/dashboard');
            return;
          }
        }
        
        // Logged in with role, redirect to appropriate home
        if (inAuthGroup) {
          switch (user.userType) {
            case 'fan':
              router.replace('/(fan)/scores');
              break;
            case 'coach':
              // Route to iPad version (sidebar) or iPhone version (bottom tabs)
              const isTabletForLogin = getIsTablet();
              console.log('[LOGIN REDIRECT] Coach login, isTablet:', isTabletForLogin);
              if (isTabletForLogin) {
                router.replace('/(coach)/dashboard');
              } else {
                router.replace('/(coach-phone)/dashboard');
              }
              break;
            case 'player':
              router.replace('/(player)/my-stats');
              break;
          }
        }
      }
    };

    checkRoleSelection();
  }, [user, segments, isLoading]);

  const checkAuthStatus = async () => {
    try {
      // Check auth version - force re-login if version changed
      const storedVersion = await AsyncStorage.getItem('auth_version');
      if (storedVersion !== AUTH_VERSION) {
        console.log('[AUTH] Auth version mismatch, forcing re-login');
        await AsyncStorage.multiRemove(['auth_token', 'user_email', 'mock_user', 'user_name', 'selected_role']);
        await AsyncStorage.setItem('auth_version', AUTH_VERSION);
        setIsLoading(false);
        return;
      }

      // DEV MODE: Auto-login with mock user
      if (DEV_MODE && SKIP_AUTH) {
        let mockUser: UserProfile;
        switch (DEV_USER_ROLE) {
          case 'coach':
            mockUser = MOCK_COACH;
            break;
          case 'player':
            mockUser = MOCK_PLAYER;
            break;
          case 'fan':
          default:
            mockUser = MOCK_FAN;
            break;
        }
        setUser(mockUser);
        setIsLoading(false);
        return;
      }

      // Check for stored user (persistent login)
      if (MOCK_BACKEND) {
        const mockUserJson = await AsyncStorage.getItem('mock_user');
        if (mockUserJson) {
          setUser(JSON.parse(mockUserJson));
        }
        setIsLoading(false);
        return;
      }

      // Real backend auth check with new auth system
      const token = await AsyncStorage.getItem('auth_token');
      console.log('[AUTH] Checking stored token:', token ? 'Token found' : 'No token');
      
      if (token) {
        try {
          const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
          });

          console.log('[AUTH] /auth/me response status:', response.status);

          if (response.ok) {
            const backendUser = await response.json();
            console.log('[AUTH] User data retrieved:', backendUser.email);
            
            // Map backend user to app user profile
            let userProfile: UserProfile;
            switch (backendUser.role) {
              case 'coach':
                userProfile = {
                  id: backendUser.id.toString(),
                  email: backendUser.email,
                  username: backendUser.username,
                  firstName: backendUser.first_name,
                  lastName: backendUser.last_name,
                  userType: 'coach',
                  createdAt: backendUser.created_at || new Date().toISOString(),
                  teamId: '',
                  schoolId: backendUser.school || '',
                  position: 'Coach',
                  subscriptionStatus: 'active',
                } as CoachProfile;
                break;
              case 'player':
                userProfile = {
                  id: backendUser.id.toString(),
                  email: backendUser.email,
                  username: backendUser.username,
                  firstName: backendUser.first_name,
                  lastName: backendUser.last_name,
                  userType: 'player',
                  createdAt: backendUser.created_at || new Date().toISOString(),
                  playerId: backendUser.id.toString(),
                  teamId: '',
                  schoolId: backendUser.school || '',
                  grade: '',
                  position: '',
                  jerseyNumber: '',
                } as PlayerProfile;
                break;
              case 'fan':
              default:
                userProfile = {
                  id: backendUser.id.toString(),
                  email: backendUser.email,
                  username: backendUser.username,
                  firstName: backendUser.first_name,
                  lastName: backendUser.last_name,
                  userType: 'fan',
                  createdAt: backendUser.created_at || new Date().toISOString(),
                  favoriteTeams: [],
                  adFree: false,
                  subscriptionStatus: 'free',
                  notificationPreferences: {
                    scores: true,
                    bigPlays: true,
                    gameStart: true,
                  },
                } as FanProfile;
                break;
            }
            setUser(userProfile);
            console.log('[AUTH] User logged in successfully');
          } else {
            // Only clear token if it's definitely invalid (401/403)
            if (response.status === 401 || response.status === 403) {
              console.log('[AUTH] Token invalid, clearing...');
              await AsyncStorage.removeItem('auth_token');
            } else {
              // For other errors (500, network issues), keep the token
              // User might be offline or backend might be down temporarily
              console.log('[AUTH] Auth check failed but keeping token for retry');
            }
          }
        } catch (fetchError) {
          // Network error or backend unreachable - keep the token for next time
          console.log('[AUTH] Network error during auth check, keeping token:', fetchError);
        }
      }
    } catch (error) {
      console.error('[AUTH] Auth check failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      if (MOCK_BACKEND) {
        // Mock login - REQUIRE valid credentials
        const validUsers: Record<string, { password: string; name: string }> = {
          'rhett@statiq.app': { password: 'test123', name: 'Rhett Davis' },
          'landon@statiq.app': { password: 'test123', name: 'Landon Ledbetter' },
        };
        
        const userEntry = validUsers[email.toLowerCase()];
        if (!userEntry || userEntry.password !== password) {
          throw new Error('Invalid email or password');
        }
        
        // Store email for role selection
        await AsyncStorage.setItem('user_email', email.toLowerCase());
        await AsyncStorage.setItem('user_name', userEntry.name);
        
        // Don't set user yet - wait for role selection
        // User will be set after role is chosen
        return;
      }

      // Real backend login with new auth system
      console.log('[AUTH] Attempting login for:', email);
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `username=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Login failed' }));
        console.log('[AUTH] Login failed:', errorData);
        throw new Error(errorData.detail || 'Login failed');
      }

      const data = await response.json();
      console.log('[AUTH] Login response:', data);
      console.log('[AUTH] Access token:', data.access_token ? 'Present' : 'Missing');
      
      // Store token and email with error handling to ensure they're saved
      try {
        await AsyncStorage.setItem('auth_token', data.access_token);
        await AsyncStorage.setItem('user_email', email.toLowerCase()); // Store email for chat API
        await AsyncStorage.setItem('auth_version', AUTH_VERSION); // Store current auth version
        // Verify token was stored
        const storedToken = await AsyncStorage.getItem('auth_token');
        console.log('[AUTH] Token stored:', storedToken ? 'Success' : 'FAILED');
        console.log('[AUTH] Email stored:', email.toLowerCase());
      } catch (storageError) {
        console.error('[AUTH] Failed to store token:', storageError);
        throw new Error('Failed to save login credentials');
      }
      
      // Now fetch user data using the token
      console.log('[AUTH] Fetching user data from /auth/me...');
      const meResponse = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${data.access_token}` },
      });

      console.log('[AUTH] /auth/me response status:', meResponse.status);
      
      if (!meResponse.ok) {
        const errorText = await meResponse.text();
        console.error('[AUTH] /auth/me failed:', errorText);
        throw new Error(`Failed to fetch user data: ${meResponse.status}`);
      }

      const backendUser = await meResponse.json();
      console.log('[AUTH] User data retrieved:', JSON.stringify(backendUser, null, 2));
      
      // Map backend user to app user profile
      let userProfile: UserProfile;
      
      switch (backendUser.role) {
        case 'coach':
          userProfile = {
            id: backendUser.id.toString(),
            email: backendUser.email,
            username: backendUser.username,
            firstName: backendUser.first_name,
            lastName: backendUser.last_name,
            userType: 'coach',
            createdAt: new Date().toISOString(),
            teamId: '', // Will be set later
            schoolId: backendUser.school || '',
            position: 'Coach',
            subscriptionStatus: 'active',
          } as CoachProfile;
          break;
        case 'player':
          userProfile = {
            id: backendUser.id.toString(),
            email: backendUser.email,
            username: backendUser.username,
            firstName: backendUser.first_name,
            lastName: backendUser.last_name,
            userType: 'player',
            createdAt: new Date().toISOString(),
            playerId: backendUser.id.toString(),
            teamId: '', // Will be set later
            schoolId: backendUser.school || '',
            grade: '',
            position: '',
            jerseyNumber: '',
          } as PlayerProfile;
          break;
        case 'fan':
        default:
          userProfile = {
            id: backendUser.id.toString(),
            email: backendUser.email,
            username: backendUser.username,
            firstName: backendUser.first_name,
            lastName: backendUser.last_name,
            userType: 'fan',
            createdAt: new Date().toISOString(),
            favoriteTeams: [],
            adFree: false,
            subscriptionStatus: 'free',
            notificationPreferences: {
              scores: true,
              bigPlays: true,
              gameStart: true,
            },
          } as FanProfile;
          break;
      }
      
      console.log('[AUTH] User profile created:', userProfile.email, userProfile.userType);
      setUser(userProfile);
    } catch (error: any) {
      console.error('[AUTH] Login error (raw):', error);
      console.error('[AUTH] Login error (stringified):', JSON.stringify(error));
      console.error('[AUTH] Login error (toString):', error?.toString?.());
      console.error('[AUTH] Login error (message):', error?.message);
      console.error('[AUTH] Login error (keys):', Object.keys(error || {}));
      
      // Try multiple ways to extract the error message
      let errorMessage = 'Login failed';
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.detail) {
        errorMessage = error.detail;
      } else if (error?.toString && typeof error.toString === 'function') {
        errorMessage = error.toString();
      }
      
      console.error('[AUTH] Final error message:', errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signup = async (email: string, username: string, password: string, firstName: string, lastName: string, zipCode?: string) => {
    try {
      if (MOCK_BACKEND) {
        // Mock signup - always creates a fan account
        const mockUser: FanProfile = {
          id: `fan-${Date.now()}`,
          email: email,
          userType: 'fan',
          createdAt: new Date().toISOString(),
          favoriteTeams: [],
          adFree: false,
          subscriptionStatus: 'free',
          notificationPreferences: {
            scores: true,
            bigPlays: true,
            gameStart: true,
          },
        };
        await AsyncStorage.setItem('mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
        return;
      }

      // Real backend signup with new auth system
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email,
          username: username.toLowerCase(),
          first_name: firstName,
          last_name: lastName,
          password,
          role: 'fan',
          team_id: null
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Signup failed');
      }

      const data = await response.json();
      
      // After signup, log them in
      await login(email, password);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const selectRole = async (role: 'fan' | 'coach' | 'player') => {
    try {
      const email = await AsyncStorage.getItem('user_email');
      const name = await AsyncStorage.getItem('user_name');
      
      if (!email) {
        throw new Error('No user email found');
      }

      let mockUser: UserProfile;
      switch (role) {
        case 'coach':
          mockUser = { ...MOCK_COACH, email, id: `${role}-${email}` };
          break;
        case 'player':
          mockUser = { ...MOCK_PLAYER, email, id: `${role}-${email}` };
          break;
        case 'fan':
        default:
          mockUser = { ...MOCK_FAN, email, id: `${role}-${email}` };
          break;
      }
      
      await AsyncStorage.setItem('mock_user', JSON.stringify(mockUser));
      await AsyncStorage.setItem('selected_role', role);
      setUser(mockUser);
    } catch (error) {
      console.error('Role selection error:', error);
      throw error;
    }
  };

  const logout = async () => {
    if (MOCK_BACKEND) {
      await AsyncStorage.removeItem('mock_user');
      await AsyncStorage.removeItem('user_email');
      await AsyncStorage.removeItem('user_name');
      await AsyncStorage.removeItem('selected_role');
    } else {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user_email');
    }
    setUser(null);
    router.replace('/(auth)/login');
  };

  const refreshUser = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) return;

      const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const backendUser = await response.json();
        
        // Update user profile with new data
        let userProfile: UserProfile;
        switch (backendUser.role) {
          case 'coach':
            userProfile = {
              id: backendUser.id.toString(),
              email: backendUser.email,
              username: backendUser.username,
              firstName: backendUser.first_name,
              lastName: backendUser.last_name,
              userType: 'coach',
              createdAt: backendUser.created_at || new Date().toISOString(),
              teamId: '',
              schoolId: backendUser.school || '',
              position: 'Coach',
              subscriptionStatus: 'active',
            } as CoachProfile;
            break;
          case 'player':
            userProfile = {
              id: backendUser.id.toString(),
              email: backendUser.email,
              username: backendUser.username,
              firstName: backendUser.first_name,
              lastName: backendUser.last_name,
              userType: 'player',
              createdAt: backendUser.created_at || new Date().toISOString(),
              playerId: backendUser.id.toString(),
              teamId: '',
              schoolId: backendUser.school || '',
              grade: '',
              position: '',
              jerseyNumber: '',
            } as PlayerProfile;
            break;
          case 'fan':
          default:
            userProfile = {
              id: backendUser.id.toString(),
              email: backendUser.email,
              username: backendUser.username,
              firstName: backendUser.first_name,
              lastName: backendUser.last_name,
              userType: 'fan',
              createdAt: backendUser.created_at || new Date().toISOString(),
              favoriteTeams: [],
              adFree: false,
              subscriptionStatus: 'free',
              notificationPreferences: {
                scores: true,
                bigPlays: true,
                gameStart: true,
              },
            } as FanProfile;
            break;
        }
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, signup, selectRole, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
