/**
 * Color utility functions for improving visibility of team colors
 * on dark backgrounds
 */

/**
 * Converts hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance (0-1)
 * https://www.w3.org/TR/WCAG20/#relativeluminancedef
 */
export function getLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;

  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
    const normalized = val / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Check if color is too dark for dark background
 */
export function isColorTooDark(hex: string, threshold: number = 0.20): boolean {
  return getLuminance(hex) < threshold;
}

/**
 * Lighten a dark color for better visibility
 */
export function lightenColor(hex: string, amount: number = 60): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const lighten = (val: number) => Math.min(255, val + amount);
  
  const r = lighten(rgb.r).toString(16).padStart(2, '0');
  const g = lighten(rgb.g).toString(16).padStart(2, '0');
  const b = lighten(rgb.b).toString(16).padStart(2, '0');

  return `#${r}${g}${b}`;
}

/**
 * Get display-ready color (lightens if too dark)
 * This is the main function to use throughout the app
 */
export function getDisplayColor(hex: string): string {
  if (!hex || hex === '#000000') {
    // Return a default neutral color for pure black
    return '#4A4A4A';
  }
  
  if (isColorTooDark(hex)) {
    return lightenColor(hex, 50); // Reduced from 80 to 50 for subtler lightening
  }
  
  return hex;
}
