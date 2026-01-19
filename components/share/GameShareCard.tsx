import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/src/constants/design';

// Helper to lighten colors
function lightenColor(hex: string, amount: number = 0.85): string {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

// Helper to get contrast color
function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

interface GameShareCardProps {
  type: 'upcoming' | 'live' | 'final';
  homeTeamName: string;
  awayTeamName: string;
  homeRecord?: string;
  awayRecord?: string;
  homeScore?: number;
  awayScore?: number;
  homeColor: string;
  awayColor: string;
  gameDate?: string;
  gameTime?: string;
  quarter?: number | string;
  timeRemaining?: string;
  playoffRound?: string;
}

export const GameShareCard = forwardRef<View, GameShareCardProps>(({
  type,
  homeTeamName,
  awayTeamName,
  homeRecord,
  awayRecord,
  homeScore,
  awayScore,
  homeColor,
  awayColor,
  gameDate,
  gameTime,
  quarter,
  timeRemaining,
  playoffRound,
}, ref) => {
  const awayColorLight = lightenColor(awayColor, 0.7);
  
  // Format the status badge
  const getStatusBadge = () => {
    if (type === 'live') {
      return (
        <View style={styles.liveBadge}>
          <View style={styles.liveIndicator} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
      );
    } else if (type === 'final') {
      return (
        <View style={styles.finalBadge}>
          <Text style={styles.finalBadgeText}>FINAL</Text>
        </View>
      );
    } else {
      return (
        <View style={styles.upcomingBadge}>
          <Text style={styles.upcomingBadgeText}>UPCOMING</Text>
        </View>
      );
    }
  };

  return (
    <View ref={ref} style={styles.container} collapsable={false}>
      {/* Background gradient */}
      <LinearGradient
        colors={[homeColor, '#1a1a1a', '#1a1a1a', awayColorLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0, 0.3, 0.7, 1]}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>TEXAS HIGH SCHOOL FOOTBALL</Text>
          {getStatusBadge()}
        </View>

        {/* Playoff Round (if applicable) */}
        {playoffRound && (
          <View style={styles.playoffContainer}>
            <Text style={styles.playoffText}>{playoffRound.toUpperCase()}</Text>
          </View>
        )}

        {/* Teams Section */}
        <View style={styles.teamsContainer}>
          {/* Home Team */}
          <View style={styles.teamSection}>
            <View style={[styles.teamColorBar, { backgroundColor: homeColor }]} />
            <View style={styles.teamInfo}>
              <Text style={styles.teamName} numberOfLines={2}>{homeTeamName.toUpperCase()}</Text>
              {homeRecord && <Text style={styles.teamRecord}>{homeRecord}</Text>}
            </View>
            {(type === 'live' || type === 'final') && homeScore !== undefined && (
              <Text style={[
                styles.teamScore,
                homeScore > (awayScore || 0) && styles.winningScore
              ]}>{homeScore}</Text>
            )}
          </View>

          {/* VS / @ Divider */}
          <View style={styles.divider}>
            {type === 'upcoming' ? (
              <View style={styles.vsContainer}>
                <Text style={styles.vsText}>VS</Text>
              </View>
            ) : (
              <View style={styles.scoreContainer}>
                {type === 'live' && quarter && (
                  <Text style={styles.quarterText}>Q{quarter}</Text>
                )}
                {type === 'live' && timeRemaining && (
                  <Text style={styles.timeText}>{timeRemaining}</Text>
                )}
              </View>
            )}
          </View>

          {/* Away Team */}
          <View style={styles.teamSection}>
            <View style={[styles.teamColorBar, { backgroundColor: awayColor }]} />
            <View style={styles.teamInfo}>
              <Text style={styles.teamName} numberOfLines={2}>{awayTeamName.toUpperCase()}</Text>
              {awayRecord && <Text style={styles.teamRecord}>{awayRecord}</Text>}
            </View>
            {(type === 'live' || type === 'final') && awayScore !== undefined && (
              <Text style={[
                styles.teamScore,
                awayScore > (homeScore || 0) && styles.winningScore
              ]}>{awayScore}</Text>
            )}
          </View>
        </View>

        {/* Game Date/Time for upcoming */}
        {type === 'upcoming' && gameDate && (
          <View style={styles.dateTimeContainer}>
            <Text style={styles.dateText}>{gameDate}</Text>
            {gameTime && <Text style={styles.timeGameText}>{gameTime}</Text>}
          </View>
        )}

        {/* Footer with StatIQ branding */}
        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>Stat</Text>
              <Text style={[styles.logoText, styles.logoAccent]}>IQ</Text>
            </View>
          </View>
          <View style={styles.footerRight}>
            <Text style={styles.ctaText}>Get live stats & predictions</Text>
            <Text style={styles.urlText}>statiq.app</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    width: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradient: {
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    letterSpacing: 1.5,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.BLAZE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  finalBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  finalBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 1,
  },
  upcomingBadge: {
    backgroundColor: Colors.SURGE,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  upcomingBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000',
    letterSpacing: 1,
  },
  playoffContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  playoffText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.SURGE,
    letterSpacing: 1,
  },
  teamsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  teamSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  teamColorBar: {
    width: 6,
    height: 50,
    borderRadius: 3,
  },
  teamInfo: {
    flex: 1,
    gap: 4,
  },
  teamName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  teamRecord: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  teamScore: {
    fontSize: 44,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.5)',
  },
  winningScore: {
    color: '#fff',
  },
  divider: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  vsContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  vsText: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
  },
  scoreContainer: {
    alignItems: 'center',
    gap: 2,
  },
  quarterText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.SURGE,
    letterSpacing: 1,
  },
  timeText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  dateTimeContainer: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  timeGameText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.SURGE,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
  },
  logoAccent: {
    color: Colors.SURGE,
  },
  footerRight: {
    alignItems: 'flex-end',
    gap: 2,
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.6)',
  },
  urlText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.SURGE,
  },
});

export default GameShareCard;
