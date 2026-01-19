/**
 * Reusable Card Component
 * 
 * Usage:
 * <Card variant="default" onPress={() => {}}>
 *   <Text>Content</Text>
 * </Card>
 */

import React from 'react';
import { View, Pressable, StyleSheet, ViewStyle, PressableStateCallbackType } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadows } from '@/src/constants/design';

type CardVariant = 'default' | 'elevated' | 'highlighted';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  onPress?: () => void;
  style?: ViewStyle;
}

export function Card({ children, variant = 'default', onPress, style }: CardProps) {
  const getVariantStyle = () => {
    switch (variant) {
      case 'elevated':
        return styles.elevated;
      case 'highlighted':
        return styles.highlighted;
      default:
        return styles.default;
    }
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }: PressableStateCallbackType) => [
          styles.base,
          getVariantStyle(),
          style,
          pressed && styles.pressed,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={[styles.base, getVariantStyle(), style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    marginBottom: Spacing.SM,
  },
  default: {
    backgroundColor: Colors.CHARCOAL,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  elevated: {
    backgroundColor: Colors.CHARCOAL,
    ...Shadows.MEDIUM,
  },
  highlighted: {
    backgroundColor: Colors.CHARCOAL,
    borderWidth: 2,
    borderColor: Colors.SURGE,
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
});
