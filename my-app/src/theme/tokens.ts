export const colorTokens = {
  background: '#FFF8F1',
  backgroundAccent: '#FFE5D3',
  surface: '#FFFDF8',
  surfaceMuted: '#FFF1E7',
  text: '#17120D',
  textSecondary: '#5E4738',
  textMuted: '#8D6D5A',
  border: '#F2D7C6',
  primary: '#FF8A3D',
  primaryPressed: '#F26D21',
  primarySoft: '#FFE3CF',
  accent: '#231A14',
  warning: '#C26A12',
  warningSoft: '#FFF0D6',
  success: '#2F8F4E',
  successSoft: '#E1F6E7',
  danger: '#CC4B37',
  dangerSoft: '#FDE2DC',
  infoSoft: '#FCEBD9',
  shadow: 'rgba(41, 25, 12, 0.08)',
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
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 28,
  hero: 34,
  pill: 999,
} as const;

export const typographyTokens = {
  caption: 12,
  bodySm: 13,
  body: 15,
  bodyLg: 16,
  titleSm: 17,
  titleMd: 19,
  titleLg: 22,
  headline: 34,
  lineHeightSm: 20,
  lineHeightMd: 22,
  lineHeightLg: 24,
} as const;

export const motionTokens = {
  pressedScale: 0.985,
} as const;

export const accessibilityTokens = {
  minTouchTarget: 48,
} as const;
