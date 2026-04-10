export const colorTokens = {
  background: '#F3F7F8',
  backgroundAccent: '#E2F1EE',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  border: '#D8E1E7',
  primary: '#0F766E',
  primaryPressed: '#0C5F59',
  primarySoft: '#D1FAE5',
  accent: '#0369A1',
  warning: '#D97706',
  warningSoft: '#FEF3C7',
  success: '#15803D',
  successSoft: '#DCFCE7',
  danger: '#DC2626',
  dangerSoft: '#FEE2E2',
  infoSoft: '#DBEAFE',
  shadow: 'rgba(15, 23, 42, 0.08)',
  white: '#FFFFFF',
} as const;

export const spacingTokens = {
  xxs: 4,
  xs: 6,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radiusTokens = {
  sm: 12,
  md: 14,
  lg: 18,
  xl: 20,
  xxl: 24,
  hero: 28,
  pill: 999,
} as const;

export const typographyTokens = {
  caption: 12,
  bodySm: 13,
  body: 14,
  bodyLg: 15,
  titleSm: 16,
  titleMd: 17,
  titleLg: 20,
  headline: 30,
  lineHeightSm: 19,
  lineHeightMd: 20,
  lineHeightLg: 22,
} as const;

export const motionTokens = {
  pressedScale: 0.985,
} as const;

export const accessibilityTokens = {
  minTouchTarget: 48,
} as const;
