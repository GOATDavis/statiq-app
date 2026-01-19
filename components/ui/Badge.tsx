/**
 * Reusable Badge Component
 * 
 * Usage:
 * <Badge variant="live">LIVE</Badge>
 * <Badge variant="win">W</Badge>
 * <Badge variant="district">District</Badge>
 */

import React from 'react';
import { View, Text, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/src/constants/design';

type BadgeVariant = 'live' | 'win' | 'loss' | 'district' | 'playoff' | 'classification';

interface BadgeProps {
  children: React.ReactNode;
  variant: BadgeVariant;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Badge({ children, variant, style, textStyle, icon }: BadgeProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'live':
        return {
          container: styles.live,
          text: styles.liveText,
        };
      case 'win':
        return {
          container: styles.win,
          text: styles.winText,
        };
      case 'loss':
        return {
          container: styles.loss,
          text: styles.lossText,
        };
      case 'district':
        return {
          container: styles.district,
          text: styles.districtText,
        };
      case 'playoff':
        return {
          container: styles.playoff,
          text: styles.playoffText,
        };
      case 'classification':
        return {
          container: styles.classification,
          text: styles.classificationText,
        };
      default:
        return {
          container: styles.live,
          text: styles.liveText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <View style={[variantStyles.container, style]}>
      {icon}
      <Text style={[variantStyles.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Live badge
  live: {
    backgroundColor: Colors.BLAZE,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 4,
    borderRadius: BorderRadius.XS,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveText: {
    ...Typography.LABEL_SMALL,
    color: Colors.TEXT_PRIMARY,
  },

  // Win badge
  win: {
    backgroundColor: Colors.SURGE,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.FULL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winText: {
    ...Typography.LABEL,
    color: Colors.VOID,
  },

  // Loss badge
  loss: {
    backgroundColor: Colors.GRAPHITE,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.FULL,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lossText: {
    ...Typography.LABEL,
    color: Colors.TEXT_TERTIARY,
  },

  // District badge
  district: {
    backgroundColor: Colors.SURGE_10,
    borderWidth: 1,
    borderColor: Colors.SURGE,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  districtText: {
    ...Typography.LABEL_TINY,
    color: Colors.SURGE,
  },

  // Playoff badge
  playoff: {
    backgroundColor: 'rgba(255, 176, 32, 0.1)',
    borderWidth: 1,
    borderColor: Colors.WARNING,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  playoffText: {
    ...Typography.LABEL_TINY,
    color: Colors.WARNING,
  },

  // Classification badge
  classification: {
    backgroundColor: Colors.SHADOW,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  classificationText: {
    ...Typography.LABEL_SMALL,
    color: Colors.TEXT_TERTIARY,
  },
});
