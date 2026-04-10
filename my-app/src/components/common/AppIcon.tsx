import { Ionicons } from '@expo/vector-icons';
import { SymbolView, type SFSymbol } from 'expo-symbols';
import { type StyleProp, type ViewStyle } from 'react-native';

import { AppColors } from '@/src/constants/colors';

export type AppIconName =
  | 'add'
  | 'approval'
  | 'announcement'
  | 'calendar'
  | 'chart'
  | 'chevronRight'
  | 'dashboard'
  | 'employee'
  | 'home'
  | 'location'
  | 'note'
  | 'openShift'
  | 'request'
  | 'settings'
  | 'sparkles'
  | 'swap'
  | 'sync'
  | 'warning';

interface AppIconProps {
  name: AppIconName;
  size?: number;
  color?: string;
  decorative?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

const ICON_REGISTRY: Record<
  AppIconName,
  { ios: SFSymbol; fallback: keyof typeof Ionicons.glyphMap }
> = {
  add: {
    ios: 'plus.circle',
    fallback: 'add-circle-outline',
  },
  approval: {
    ios: 'checkmark.circle',
    fallback: 'checkmark-done-outline',
  },
  announcement: {
    ios: 'megaphone',
    fallback: 'megaphone-outline',
  },
  calendar: {
    ios: 'calendar',
    fallback: 'calendar-outline',
  },
  chart: {
    ios: 'chart.bar',
    fallback: 'bar-chart-outline',
  },
  chevronRight: {
    ios: 'chevron.right',
    fallback: 'chevron-forward',
  },
  dashboard: {
    ios: 'square.grid.2x2',
    fallback: 'grid-outline',
  },
  employee: {
    ios: 'person',
    fallback: 'person-outline',
  },
  home: {
    ios: 'house',
    fallback: 'home-outline',
  },
  location: {
    ios: 'building.2',
    fallback: 'business-outline',
  },
  note: {
    ios: 'text.bubble',
    fallback: 'chatbox-ellipses-outline',
  },
  openShift: {
    ios: 'bolt',
    fallback: 'flash-outline',
  },
  request: {
    ios: 'doc.text',
    fallback: 'document-text-outline',
  },
  settings: {
    ios: 'slider.horizontal.3',
    fallback: 'options-outline',
  },
  sparkles: {
    ios: 'sparkles',
    fallback: 'sparkles-outline',
  },
  swap: {
    ios: 'arrow.left.arrow.right',
    fallback: 'swap-horizontal-outline',
  },
  sync: {
    ios: 'arrow.triangle.2.circlepath',
    fallback: 'sync-outline',
  },
  warning: {
    ios: 'exclamationmark.triangle',
    fallback: 'warning-outline',
  },
};

export function AppIcon({
  name,
  size = 20,
  color = AppColors.textMuted,
  decorative = true,
  accessibilityLabel,
  style,
}: AppIconProps) {
  const icon = ICON_REGISTRY[name];
  const accessibilityProps = decorative
    ? {
        accessible: false,
        accessibilityElementsHidden: true,
        importantForAccessibility: 'no-hide-descendants' as const,
      }
    : {
        accessible: true,
        accessibilityLabel,
      };

  return (
    <SymbolView
      name={icon.ios}
      size={size}
      tintColor={color}
      style={style}
      fallback={
        <Ionicons
          name={icon.fallback}
          size={size}
          color={color}
          {...accessibilityProps}
        />
      }
      {...accessibilityProps}
    />
  );
}
