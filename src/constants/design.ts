/**
 * StatIQ Design Tokens
 * 
 * Central source of truth for all design values.
 * Import and use throughout the app for consistency.
 */

// ============================================================================
// COLORS
// ============================================================================

export const Colors = {
  // Brand Colors
  SURGE: '#B4D836',      // Primary green - CTAs, highlights, wins
  BLAZE: '#FF3636',      // Secondary red - live indicators, alerts
  HALO: '#F3F3F7',       // Light neutral - rarely used on dark
  BASALT: '#262626',     // Deep black - rarely used, prefer VOID
  
  // Background Hierarchy
  VOID: '#0A0A0A',       // Deepest black - main background
  SHADOW: '#1a1a1a',     // Primary background - screen base
  CHARCOAL: '#2a2a2a',   // Card backgrounds - elevated surfaces
  GRAPHITE: '#3a3a3a',   // Borders, dividers - subtle separation
  SLATE: '#4a4a4a',      // Hover states, subtle borders
  
  // Text Hierarchy
  TEXT_PRIMARY: '#FFFFFF',   // Primary text
  TEXT_SECONDARY: '#999999', // Secondary text
  TEXT_TERTIARY: '#666666',  // Tertiary text, labels
  TEXT_DISABLED: '#4a4a4a',  // Disabled text
  
  // Semantic Colors
  SUCCESS: '#B4D836',    // Same as SURGE
  ERROR: '#FF3636',      // Same as BLAZE
  WARNING: '#FFB020',    // Warning states
  INFO: '#4A90E2',       // Info states
  
  // Alpha Variants (for overlays)
  SURGE_10: 'rgba(180, 216, 54, 0.1)',
  SURGE_20: 'rgba(180, 216, 54, 0.2)',
  BLAZE_10: 'rgba(255, 54, 54, 0.1)',
  BLACK_50: 'rgba(0, 0, 0, 0.5)',
  BLACK_70: 'rgba(0, 0, 0, 0.7)',
};

// ============================================================================
// SPACING
// ============================================================================

export const Spacing = {
  XXS: 4,
  XS: 8,
  SM: 12,
  MD: 16,
  LG: 24,
  XL: 32,
  XXL: 48,
  XXXL: 64,
};

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const Typography = {
  // Display (Hero text)
  DISPLAY_LARGE: {
    fontSize: 48,
    fontWeight: '800' as const,
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  DISPLAY_MEDIUM: {
    fontSize: 40,
    fontWeight: '700' as const,
    lineHeight: 44,
    letterSpacing: -0.5,
  },
  
  // Headlines
  H1: {
    fontSize: 32,
    fontWeight: '700' as const,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  H2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 30,
    letterSpacing: -0.3,
  },
  H3: {
    fontSize: 20,
    fontWeight: '700' as const,
    lineHeight: 26,
    letterSpacing: -0.2,
  },
  H4: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  
  // Body
  BODY_LARGE: {
    fontSize: 18,
    fontWeight: '400' as const,
    lineHeight: 26,
    letterSpacing: 0,
  },
  BODY: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
    letterSpacing: 0,
  },
  BODY_MEDIUM: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  BODY_SMALL: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
    letterSpacing: 0,
  },
  
  // Labels
  LABEL_LARGE: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  LABEL: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  LABEL_SMALL: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.3,
  },
  LABEL_TINY: {
    fontSize: 11,
    fontWeight: '600' as const,
    lineHeight: 14,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },
  
  // Scores (Tabular numbers)
  SCORE_HERO: {
    fontSize: 56,
    fontWeight: '800' as const,
    lineHeight: 60,
  },
  SCORE_LARGE: {
    fontSize: 36,
    fontWeight: '700' as const,
    lineHeight: 40,
  },
  SCORE_MEDIUM: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  SCORE_SMALL: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
};

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BorderRadius = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  FULL: 999,
};

// ============================================================================
// SHADOWS
// ============================================================================

export const Shadows = {
  SMALL: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  MEDIUM: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  LARGE: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ============================================================================
// ANIMATION
// ============================================================================

export const Animation = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 250,
  DURATION_SLOW: 350,
  DURATION_VERY_SLOW: 500,
};

// ============================================================================
// COMPONENT STYLES
// ============================================================================

export const ComponentStyles = {
  // Cards
  CARD_DEFAULT: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
  },
  CARD_ELEVATED: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    ...Shadows.MEDIUM,
  },
  CARD_HIGHLIGHTED: {
    backgroundColor: Colors.CHARCOAL,
    borderRadius: BorderRadius.MD,
    padding: Spacing.MD,
    borderWidth: 2,
    borderColor: Colors.SURGE,
  },
  
  // Badges
  BADGE_LIVE: {
    backgroundColor: Colors.BLAZE,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 4,
    borderRadius: BorderRadius.XS,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 6,
  },
  BADGE_WIN: {
    backgroundColor: Colors.SURGE,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.FULL,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  BADGE_LOSS: {
    backgroundColor: Colors.GRAPHITE,
    width: 32,
    height: 32,
    borderRadius: BorderRadius.FULL,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  BADGE_DISTRICT: {
    backgroundColor: Colors.SURGE_10,
    borderWidth: 1,
    borderColor: Colors.SURGE,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  BADGE_PLAYOFF: {
    backgroundColor: 'rgba(255, 176, 32, 0.1)',
    borderWidth: 1,
    borderColor: Colors.WARNING,
    paddingHorizontal: Spacing.XS,
    paddingVertical: 2,
    borderRadius: BorderRadius.XS,
  },
  
  // Buttons
  BUTTON_PRIMARY: {
    backgroundColor: Colors.SURGE,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 44,
  },
  BUTTON_SECONDARY: {
    backgroundColor: Colors.CHARCOAL,
    paddingHorizontal: Spacing.LG,
    paddingVertical: Spacing.SM,
    borderRadius: BorderRadius.SM,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 44,
  },
  
  // Chips
  CHIP_DEFAULT: {
    backgroundColor: Colors.CHARCOAL,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.FULL,
    borderWidth: 1,
    borderColor: Colors.GRAPHITE,
  },
  CHIP_ACTIVE: {
    backgroundColor: Colors.SURGE,
    paddingHorizontal: Spacing.MD,
    paddingVertical: Spacing.XS,
    borderRadius: BorderRadius.FULL,
    borderWidth: 1,
    borderColor: Colors.SURGE,
  },
};

// ============================================================================
// LAYOUT
// ============================================================================

export const Layout = {
  SCREEN_PADDING: Spacing.MD,
  SECTION_SPACING: Spacing.MD,
  CARD_GAP: Spacing.SM,
  SAFE_AREA_TOP: 60,
  SAFE_AREA_BOTTOM: 34,
  MIN_TOUCH_TARGET: 44,
};
