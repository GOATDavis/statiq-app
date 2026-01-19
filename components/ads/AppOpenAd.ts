import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAdUnitId, AD_CONFIG } from '@/src/lib/ads/config';

const LAST_APP_OPEN_AD_KEY = 'last_app_open_ad_shown';

// Conditionally import AdMob
let useAppOpenAd: any = null;

try {
  const AdMob = require('react-native-google-mobile-ads');
  useAppOpenAd = AdMob.useAppOpenAd;
} catch (error) {
  console.log('[Ads] react-native-google-mobile-ads not available (expected in Expo Go)');
}

export function useAppOpenAdManager() {
  const [canShowAd, setCanShowAd] = useState(false);
  const [isAdReady, setIsAdReady] = useState(false);

  // Check if enough time has passed since last app open ad
  const checkCooldown = useCallback(async () => {
    try {
      const lastShown = await AsyncStorage.getItem(LAST_APP_OPEN_AD_KEY);
      if (!lastShown) {
        setCanShowAd(true);
        return true;
      }

      const lastShownTime = parseInt(lastShown, 10);
      const now = Date.now();
      const timeSinceLastAd = now - lastShownTime;

      const canShow = timeSinceLastAd >= AD_CONFIG.APP_OPEN_COOLDOWN;
      setCanShowAd(canShow);
      return canShow;
    } catch (error) {
      console.log('[AppOpenAd] Error checking cooldown:', error);
      setCanShowAd(true);
      return true;
    }
  }, []);

  // Record that we showed an app open ad
  const recordAdShown = useCallback(async () => {
    try {
      await AsyncStorage.setItem(LAST_APP_OPEN_AD_KEY, Date.now().toString());
      setCanShowAd(false);
    } catch (error) {
      console.log('[AppOpenAd] Error recording ad shown:', error);
    }
  }, []);

  // If AdMob isn't available, return a no-op implementation
  if (!useAppOpenAd) {
    return {
      isLoaded: false,
      isClosed: false,
      load: () => {},
      show: () => Promise.resolve(),
      canShowAd: false,
      checkCooldown,
      recordAdShown,
    };
  }

  // Use the actual AdMob hook
  const adUnitId = getAdUnitId('APP_OPEN');
  const { isLoaded, isClosed, load, show, error } = useAppOpenAd(adUnitId, {
    requestNonPersonalizedAdsOnly: false,
  });

  useEffect(() => {
    checkCooldown();
  }, [checkCooldown]);

  useEffect(() => {
    if (canShowAd && !isLoaded && !error) {
      load();
    }
  }, [canShowAd, isLoaded, error, load]);

  useEffect(() => {
    if (isLoaded) {
      setIsAdReady(true);
    }
  }, [isLoaded]);

  useEffect(() => {
    if (isClosed) {
      recordAdShown();
    }
  }, [isClosed, recordAdShown]);

  const showAd = useCallback(async () => {
    if (isLoaded && canShowAd) {
      try {
        await show();
        return true;
      } catch (e) {
        console.log('[AppOpenAd] Error showing ad:', e);
        return false;
      }
    }
    return false;
  }, [isLoaded, canShowAd, show]);

  return {
    isLoaded,
    isClosed,
    load,
    show: showAd,
    canShowAd,
    checkCooldown,
    recordAdShown,
    isAdReady,
  };
}

// Re-export for convenience
export { useAppOpenAdManager as useAppOpenAd };
