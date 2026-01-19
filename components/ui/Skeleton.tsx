/**
 * Skeleton Loader Component
 * 
 * Usage:
 * <Skeleton width={200} height={20} />
 * <Skeleton circle size={40} />
 */

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { Colors, BorderRadius } from '@/src/constants/design';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  circle?: boolean;
  size?: number;
  style?: ViewStyle;
  shimmer?: boolean;
}

export function Skeleton({ 
  width = '100%', 
  height = 20, 
  circle = false,
  size,
  style,
  shimmer = true
}: SkeletonProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shimmer) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const skeletonStyle: ViewStyle = {
    width: circle ? size : width,
    height: circle ? size : height,
    borderRadius: circle ? (size ? size / 2 : 0) : BorderRadius.SM,
    backgroundColor: Colors.GRAPHITE,
  };

  return (
    <Animated.View style={[skeletonStyle, { opacity: shimmer ? opacity : 0.5 }, style]} />
  );
}

/**
 * Skeleton Card - Common card loading pattern
 */
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width="60%" height={16} style={styles.marginBottom} />
      <Skeleton width="100%" height={24} style={styles.marginBottom} />
      <Skeleton width="80%" height={16} />
    </View>
  );
}

/**
 * Skeleton Game Card - Game-specific loading
 */
export function SkeletonGameCard() {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.row}>
        <Skeleton width={100} height={14} />
        <Skeleton width={60} height={14} />
      </View>
      
      {/* Teams */}
      <View style={[styles.row, styles.marginTop]}>
        <Skeleton width="60%" height={20} />
        <Skeleton width={40} height={28} />
      </View>
      <View style={[styles.row, styles.marginTop]}>
        <Skeleton width="60%" height={20} />
        <Skeleton width={40} height={28} />
      </View>
      
      {/* Footer */}
      <View style={[styles.row, styles.marginTop]}>
        <Skeleton width={120} height={12} />
      </View>
    </View>
  );
}

/**
 * Skeleton Player Card - Player list loading
 */
export function SkeletonPlayerCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Skeleton circle size={50} />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Skeleton width="70%" height={18} style={styles.marginBottom} />
          <Skeleton width="50%" height={14} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.MD,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marginBottom: {
    marginBottom: 8,
  },
  marginTop: {
    marginTop: 8,
  },
});
