/**
 * Empty State Component
 *
 * Usage:
 * <EmptyState
 *   icon="alert-circle-outline"
 *   title="No Games Yet"
 *   subtitle="Check back on Friday for live games"
 *   actionLabel="Refresh"
 *   onAction={() => refresh()}
 * />
 *
 * Note: For custom icons like FootballIcon, use them directly instead of this component
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/src/constants/design';
import { Button } from './Button';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, subtitle, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Ionicons name={icon} size={80} color={Colors.ASH} style={styles.icon} />
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {actionLabel && onAction && (
        <Button variant="secondary" onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.XXXL,
    paddingHorizontal: Spacing.XL,
  },
  icon: {
    marginBottom: Spacing.MD,
  },
  title: {
    ...Typography.H3,
    color: Colors.TEXT_PRIMARY,
    textAlign: 'center',
    marginBottom: Spacing.XS,
  },
  subtitle: {
    ...Typography.BODY,
    color: Colors.TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: Spacing.LG,
  },
  action: {
    marginTop: Spacing.MD,
  },
});
