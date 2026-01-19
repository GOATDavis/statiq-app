import React from 'react';
import { AD_CONFIG } from '@/src/lib/ads/config';
import { SmallBannerAd, LargeBlockAd } from './BannerAds';

interface AdPlacementProps {
  index: number;
  variant?: 'small' | 'large';
}

/**
 * AdPlacement component - renders an ad at specific intervals
 * Place this after game cards in a list to show ads between games
 */
export function AdPlacement({ index, variant = 'small' }: AdPlacementProps) {
  // Only show ad after every N games
  const shouldShowAd = (index + 1) % AD_CONFIG.GAMES_BETWEEN_ADS === 0;
  
  if (!shouldShowAd) {
    return null;
  }

  // Alternate between small banners and large blocks
  // Every other ad slot shows a large block
  const adSlotNumber = Math.floor((index + 1) / AD_CONFIG.GAMES_BETWEEN_ADS);
  const showLargeBlock = variant === 'large' || adSlotNumber % 2 === 0;

  if (showLargeBlock) {
    return <LargeBlockAd />;
  }

  return <SmallBannerAd />;
}

/**
 * Helper function to inject ads into a list of game elements
 * @param games - Array of game components/elements
 * @param gamesPerAd - Number of games between ads (default from config)
 * @returns Array with ads injected
 */
export function injectAdsIntoGameList<T>(
  games: T[],
  gamesPerAd: number = AD_CONFIG.GAMES_BETWEEN_ADS
): (T | React.ReactElement)[] {
  const result: (T | React.ReactElement)[] = [];
  let adsShown = 0;

  games.forEach((game, index) => {
    result.push(game);

    // Check if we should insert an ad after this game
    const gameNumber = index + 1;
    if (gameNumber % gamesPerAd === 0 && adsShown < AD_CONFIG.MAX_ADS_PER_SESSION) {
      // Alternate between small and large ads
      const showLarge = adsShown % 2 === 0;
      const adKey = `ad-${index}`;
      
      if (showLarge) {
        result.push(<LargeBlockAd key={adKey} />);
      } else {
        result.push(<SmallBannerAd key={adKey} />);
      }
      
      adsShown++;
    }
  });

  return result;
}
