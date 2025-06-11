/**
 * Hyper-casual color palette system
 * Minimal, gradient-based color schemes that change per level
 */

export interface ColorScheme {
  primary: string;
  secondary: string;
  background: string;
  backgroundGradient: string[];
  text: string;
  shadow: string;
  particle: string;
}

export const COLOR_SCHEMES: ColorScheme[] = [
  // Level 1: Mint/Teal
  {
    primary: '#4ECDC4',
    secondary: '#44A3A0',
    background: '#F7FFF7',
    backgroundGradient: ['#F7FFF7', '#E0F2F1'],
    text: '#FFFFFF',
    shadow: 'rgba(0, 0, 0, 0.1)',
    particle: '#4ECDC4',
  },
  // Level 2: Burgundy/Red
  {
    primary: '#C1666B',
    secondary: '#973A3E',
    background: '#FFF5F5',
    backgroundGradient: ['#FFF5F5', '#FFE0E0'],
    text: '#FFFFFF',
    shadow: 'rgba(139, 0, 0, 0.15)',
    particle: '#FF6B6B',
  },
  // Level 3: Purple/Pink Space
  {
    primary: '#A374D5',
    secondary: '#7B4CAF',
    background: '#F5F0FF',
    backgroundGradient: ['#F5F0FF', '#E6D5FF'],
    text: '#FFFFFF',
    shadow: 'rgba(75, 0, 130, 0.12)',
    particle: '#D4A5FF',
  },
  // Level 4: Soft Pastel
  {
    primary: '#FFB6C1',
    secondary: '#FFA0B9',
    background: '#FFF0F5',
    backgroundGradient: ['#FFF0F5', '#FFE4E1'],
    text: '#FFFFFF',
    shadow: 'rgba(255, 182, 193, 0.2)',
    particle: '#FFD1DC',
  },
  // Level 5: Ocean Blue
  {
    primary: '#4A90E2',
    secondary: '#357ABD',
    background: '#F0F8FF',
    backgroundGradient: ['#F0F8FF', '#E1F5FE'],
    text: '#FFFFFF',
    shadow: 'rgba(0, 0, 139, 0.1)',
    particle: '#87CEEB',
  },
];

export const getColorScheme = (level: number): ColorScheme => {
  // Cycle through color schemes
  const index = (level - 1) % COLOR_SCHEMES.length;
  return COLOR_SCHEMES[index];
};

// Minimal UI colors (always consistent)
export const UI_COLORS = {
  scoreText: '#FFFFFF',
  scoreTextShadow: 'rgba(0, 0, 0, 0.3)',
  menuText: '#333333',
  menuTextLight: '#666666',
  tapToPlayBg: 'rgba(0, 0, 0, 0.05)',
};