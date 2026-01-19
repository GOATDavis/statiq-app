import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { Colors } from '@/src/constants/design';
import { getAdUnitId, AD_CONFIG } from '@/src/lib/ads/config';

// Conditionally import AdMob - it won't work in Expo Go
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;

// Try to import the AdMob module
try {
  const AdMob = require('react-native-google-mobile-ads');
  BannerAd = AdMob.BannerAd;
  BannerAdSize = AdMob.BannerAdSize;
  TestIds = AdMob.TestIds;
} catch (error) {
  console.log('[Ads] react-native-google-mobile-ads not available (expected in Expo Go)');
}

interface SmallBannerAdProps {
  style?: any;
}

export function SmallBannerAd({ style }: SmallBannerAdProps) {
  const [adError, setAdError] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // If AdMob isn't available, show placeholder in dev
  if (!BannerAd) {
    if (__DEV__) {
      return (
        <View style={[styles.placeholderContainer, styles.smallBanner, style]}>
          <Text style={styles.placeholderText}>Ad Space (Dev Mode)</Text>
          <Text style={styles.placeholderSubtext}>320×50 Banner</Text>
        </View>
      );
    }
    return null;
  }

  if (adError) {
    return null; // Hide if ad fails to load
  }

  const adUnitId = getAdUnitId('SCORES_BANNER');

  return (
    <View style={[styles.adContainer, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('[Ad] Small banner loaded');
          setAdLoaded(true);
        }}
        onAdFailedToLoad={(error: any) => {
          console.log('[Ad] Small banner failed:', error);
          setAdError(true);
        }}
      />
    </View>
  );
}

interface LargeBlockAdProps {
  style?: any;
}

export function LargeBlockAd({ style }: LargeBlockAdProps) {
  const [adError, setAdError] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  // If AdMob isn't available, show placeholder in dev
  if (!BannerAd) {
    if (__DEV__) {
      return (
        <View style={[styles.placeholderContainer, styles.largeBlock, style]}>
          <Text style={styles.placeholderText}>Ad Space (Dev Mode)</Text>
          <Text style={styles.placeholderSubtext}>300×250 Large Block</Text>
        </View>
      );
    }
    return null;
  }

  if (adError) {
    return null; // Hide if ad fails to load
  }

  const adUnitId = getAdUnitId('LARGE_BLOCK');

  return (
    <View style={[styles.adContainer, styles.largeBlockContainer, style]}>
      <BannerAd
        unitId={adUnitId}
        size={BannerAdSize.MEDIUM_RECTANGLE}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
        onAdLoaded={() => {
          console.log('[Ad] Large block loaded');
          setAdLoaded(true);
        }}
        onAdFailedToLoad={(error: any) => {
          console.log('[Ad] Large block failed:', error);
          setAdError(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.CHARCOAL,
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  largeBlockContainer: {
    paddingVertical: 8,
  },
  placeholderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2A',
    marginVertical: 8,
    marginHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#444',
    borderStyle: 'dashed',
  },
  smallBanner: {
    height: 50,
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
  },
  largeBlock: {
    height: 250,
    width: 300,
    alignSelf: 'center',
  },
  placeholderText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  placeholderSubtext: {
    color: '#666',
    fontSize: 10,
    marginTop: 4,
  },
});
