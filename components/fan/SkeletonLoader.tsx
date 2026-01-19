import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Colors, Spacing, BorderRadius } from '@/src/constants/design';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLoader({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonLoaderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function GameCardSkeleton() {
  return (
    <View style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <SkeletonLoader width={80} height={16} />
        <SkeletonLoader width={40} height={16} />
      </View>
      
      <View style={styles.teamRow}>
        <SkeletonLoader width="60%" height={20} />
        <SkeletonLoader width={30} height={24} />
      </View>
      
      <View style={styles.teamRow}>
        <SkeletonLoader width="65%" height={20} />
        <SkeletonLoader width={30} height={24} />
      </View>
      
      <View style={styles.gameFooter}>
        <SkeletonLoader width="70%" height={14} />
      </View>
    </View>
  );
}

export function TeamCardSkeleton() {
  return (
    <View style={styles.teamCard}>
      <View style={styles.teamHeader}>
        <View style={styles.teamInfo}>
          <SkeletonLoader width="70%" height={20} style={{ marginBottom: 6 }} />
          <SkeletonLoader width="40%" height={16} />
        </View>
        <SkeletonLoader width={50} height={28} borderRadius={BorderRadius.SM} />
      </View>
      
      <View style={styles.teamDetails}>
        <SkeletonLoader width={100} height={14} />
        <SkeletonLoader width={80} height={14} />
        <SkeletonLoader width={120} height={14} />
      </View>
      
      <View style={styles.teamFooter}>
        <SkeletonLoader width={80} height={16} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: Colors.GRAPHITE,
  },
  gameCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.SM,
  },
  teamRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.XS,
  },
  gameFooter: {
    marginTop: Spacing.XS,
    paddingTop: Spacing.XS,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAPHITE,
  },
  teamCard: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.LG,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  teamHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.SM,
  },
  teamInfo: {
    flex: 1,
  },
  teamDetails: {
    flexDirection: 'row',
    gap: Spacing.SM,
    marginBottom: Spacing.SM,
  },
  teamFooter: {
    paddingTop: Spacing.XS,
    borderTopWidth: 1,
    borderTopColor: Colors.GRAPHITE,
  },
});
