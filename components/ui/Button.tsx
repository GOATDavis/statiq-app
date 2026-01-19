/**
 * Reusable Button Component
 * 
 * Usage:
 * <Button variant="primary" onPress={() => {}}>
 *   Press Me
 * </Button>
 */

import React from 'react';
import { Pressable, Text, StyleSheet, PressableStateCallbackType, ViewStyle, TextStyle } from 'react-native';
import { Colors, BorderRadius, Spacing, Typography } from '@/src/constants/design';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'small' | 'medium' | 'large';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  style,
  textStyle,
  icon,
}: ButtonProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'secondary':
        return {
          container: styles.secondary,
          text: styles.secondaryText,
        };
      case 'ghost':
        return {
          container: styles.ghost,
          text: styles.ghostText,
        };
      default:
        return {
          container: styles.primary,
          text: styles.primaryText,
        };
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: styles.small,
          text: styles.smallText,
        };
      case 'large':
        return {
          container: styles.large,
          text: styles.largeText,
        };
      default:
        return {
          container: styles.medium,
          text: styles.mediumText,
        };
    }
  };

  const variantStyles = getVariantStyles();
  const sizeStyles = getSizeStyles();

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }: PressableStateCallbackType) => [
        styles.base,
        variantStyles.container,
        sizeStyles.container,
        pressed && !disabled && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
    >
      {icon}
      <Text style={[variantStyles.text, sizeStyles.text, disabled && styles.disabledText, textStyle]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: BorderRadius.SM,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.XS,
  },

  // Variants
  primary: {
    backgroundColor: Colors.SURGE,
  },
  primaryText: {
    ...Typography.LABEL_LARGE,
    color: Colors.VOID,
  },

  secondary: {
    backgroundColor: Colors.CHARCOAL,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  secondaryText: {
    ...Typography.LABEL_LARGE,
    color: Colors.TEXT_PRIMARY,
  },

  ghost: {
    backgroundColor: 'transparent',
  },
  ghostText: {
    ...Typography.LABEL_LARGE,
    color: Colors.SURGE,
  },

  // Sizes
  small: {
    paddingHorizontal: Spacing.SM,
    paddingVertical: Spacing.XS,
    minHeight: 36,
  },
  smallText: {
    ...Typography.LABEL,
  },

  medium: {
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.SM,
    minHeight: 44,
  },
  mediumText: {
    ...Typography.LABEL_LARGE,
  },

  large: {
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.MD,
    minHeight: 56,
  },
  largeText: {
    ...Typography.H4,
  },

  // States
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: Colors.TEXT_DISABLED,
  },
});
