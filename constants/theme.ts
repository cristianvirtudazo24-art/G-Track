import { Platform } from 'react-native';

// G!Track Brand Colors
const primaryBlue = '#1E2F97';
const primaryOrange = '#F97316';
const accentRed = '#E8313A';
const successGreen = '#059669';
const warningYellow = '#D97706';

// Neutral Colors
const slate50 = '#F8FAFC';
const slate100 = '#F1F5F9';
const slate200 = '#E2E8F0';
const slate300 = '#CBD5E1';
const slate400 = '#94A3B8';
const slate500 = '#64748B';
const slate600 = '#475569';
const slate700 = '#334155';
const slate800 = '#1E293B';
const slate900 = '#0F172A';

export const Colors = {
  // Brand Colors
  primary: primaryBlue,
  primaryLight: '#EBF1FF',
  secondary: primaryOrange,
  accent: accentRed,
  success: successGreen,
  warning: warningYellow,

  // Neutral Palette
  slate: {
    50: slate50,
    100: slate100,
    200: slate200,
    300: slate300,
    400: slate400,
    500: slate500,
    600: slate600,
    700: slate700,
    800: slate800,
    900: slate900,
  },

  // Semantic Colors
  background: {
    primary: '#FFFFFF',
    secondary: slate50,
    tertiary: slate100,
    overlay: 'rgba(0, 0, 0, 0.5)',
  },

  text: {
    primary: slate900,
    secondary: slate600,
    tertiary: slate500,
    inverse: '#FFFFFF',
    muted: slate400,
  },

  border: {
    light: slate200,
    medium: slate300,
    dark: slate400,
  },

  // Component Colors
  card: {
    background: '#FFFFFF',
    shadow: 'rgba(30, 47, 151, 0.1)',
  },

  button: {
    primary: primaryBlue,
    secondary: primaryOrange,
    danger: accentRed,
    success: successGreen,
    disabled: slate300,
  },

  input: {
    background: '#FFFFFF',
    border: slate300,
    focus: primaryBlue,
    error: accentRed,
    placeholder: slate400,
  },

  // Status Colors
  status: {
    safe: successGreen,
    help: accentRed,
    blackout: primaryOrange,
    offline: slate400,
    online: successGreen,
  },

  // White with alpha
  whiteAlpha: {
    15: 'rgba(255,255,255,0.15)',
    85: 'rgba(255,255,255,0.85)',
  },

  // Black with alpha
  blackAlpha: {
    50: 'rgba(0,0,0,0.5)',
  },

  light: {
    text: slate900,
    background: '#FFFFFF',
    tint: primaryBlue,
    icon: slate500,
    tabIconDefault: slate400,
    tabIconSelected: primaryBlue,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: primaryOrange,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: primaryOrange,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

export const BorderRadius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  xl: {
    shadowColor: Colors.card.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};

export const Typography = {
  // Font Sizes
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  // Font Weights
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line Heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'System',
    serif: 'Georgia',
    rounded: 'SF-Pro-Rounded',
    mono: 'SF-Mono',
  },
  default: {
    sans: 'Roboto',
    serif: 'serif',
    rounded: 'Roboto',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    mono: "SFMono-Regular, 'SF Mono', Monaco, Inconsolata, 'Roboto Mono', Consolas, monospace",
  },
});
