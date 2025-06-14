/**
 * Centralized Design Tokens System
 * Single source of truth for typography, spacing, and layout constants
 */

export const Typography = {
  display: { 
    fontSize: 36, 
    fontWeight: '800' as const,
    lineHeight: 44,
  },
  h1: { 
    fontSize: 28, 
    fontWeight: '700' as const,
    lineHeight: 34,
  },
  h2: { 
    fontSize: 24, 
    fontWeight: '600' as const,
    lineHeight: 30,
  },
  h3: { 
    fontSize: 20, 
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  bodyLarge: { 
    fontSize: 18, 
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  body: { 
    fontSize: 16, 
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: { 
    fontSize: 15, 
    fontWeight: '400' as const,
    lineHeight: 21,
  },
  caption: { 
    fontSize: 14, 
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  small: { 
    fontSize: 12, 
    fontWeight: '400' as const,
    lineHeight: 18,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
  },
  buttonLarge: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 22,
  },
};

export const Spacing = {
  micro: 4,
  small: 8,
  medium: 16,
  large: 24,
  xlarge: 40,
  xxlarge: 64,
};

export const BorderRadius = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 999,
};

export const Shadows = {
  small: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const Layout = {
  containerPadding: Spacing.medium,
  headerHeight: 60,
  buttonHeight: 48,
  buttonHeightLarge: 56,
  switchWidth: 60,
  switchHeight: 32,
  modalMaxWidth: 340,
  hudTopPadding: 60, // For status bar + padding
};

export const Animation = {
  fast: 150,
  normal: 300,
  slow: 500,
  easing: 'ease-out' as const,
};