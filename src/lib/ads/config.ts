import { Platform } from 'react-native';

// AdMob App ID (configured in app.json)
export const ADMOB_APP_ID = 'ca-app-pub-3093861711098965~4691531382';

// Ad Unit IDs
export const AD_UNITS = {
  // Small banner for scores feed (320x50)
  SCORES_BANNER: Platform.select({
    ios: 'ca-app-pub-3093861711098965/9752286375',
    android: 'ca-app-pub-3093861711098965/9752286375', // Update with Android ID when created
  }) as string,
  
  // Large block for between games (300x250)
  LARGE_BLOCK: Platform.select({
    ios: 'ca-app-pub-3093861711098965/3597941567',
    android: 'ca-app-pub-3093861711098965/3597941567', // Update with Android ID when created
  }) as string,
  
  // App open ad (shown on app launch, 1x daily)
  APP_OPEN: Platform.select({
    ios: 'ca-app-pub-3093861711098965/2284859898',
    android: 'ca-app-pub-3093861711098965/2284859898', // Update with Android ID when created
  }) as string,
};

// Test Ad Unit IDs (use these during development)
export const TEST_AD_UNITS = {
  BANNER: Platform.select({
    ios: 'ca-app-pub-3940256099942544/2934735716',
    android: 'ca-app-pub-3940256099942544/6300978111',
  }) as string,
  
  INTERSTITIAL: Platform.select({
    ios: 'ca-app-pub-3940256099942544/4411468910',
    android: 'ca-app-pub-3940256099942544/1033173712',
  }) as string,
  
  APP_OPEN: Platform.select({
    ios: 'ca-app-pub-3940256099942544/5575463023',
    android: 'ca-app-pub-3940256099942544/9257395921',
  }) as string,
};

// Ad placement configuration
export const AD_CONFIG = {
  // Show ad after every N games in the feed
  GAMES_BETWEEN_ADS: 8,
  
  // Maximum ads per session
  MAX_ADS_PER_SESSION: 5,
  
  // App open ad cooldown (milliseconds) - 24 hours
  APP_OPEN_COOLDOWN: 24 * 60 * 60 * 1000,
  
  // Use test ads in development
  USE_TEST_ADS: __DEV__,
};

// Helper to get the correct ad unit ID based on environment
export function getAdUnitId(type: keyof typeof AD_UNITS): string {
  if (AD_CONFIG.USE_TEST_ADS) {
    switch (type) {
      case 'SCORES_BANNER':
      case 'LARGE_BLOCK':
        return TEST_AD_UNITS.BANNER;
      case 'APP_OPEN':
        return TEST_AD_UNITS.APP_OPEN;
      default:
        return TEST_AD_UNITS.BANNER;
    }
  }
  return AD_UNITS[type];
}
