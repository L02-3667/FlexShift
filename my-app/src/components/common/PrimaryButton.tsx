import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { AppIcon, type AppIconName } from '@/src/components/common/AppIcon';
import { AppColors } from '@/src/constants/colors';
import {
  accessibilityTokens,
  motionTokens,
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: ButtonVariant;
  leadingIcon?: AppIconName;
  style?: ViewStyle;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { backgroundColor: string; borderColor: string; textColor: string }
> = {
  primary: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    textColor: AppColors.white,
  },
  secondary: {
    backgroundColor: AppColors.surface,
    borderColor: AppColors.border,
    textColor: AppColors.text,
  },
  danger: {
    backgroundColor: AppColors.danger,
    borderColor: AppColors.danger,
    textColor: AppColors.white,
  },
  ghost: {
    backgroundColor: 'transparent',
    borderColor: 'transparent',
    textColor: AppColors.primary,
  },
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  variant = 'primary',
  leadingIcon,
  style,
}: PrimaryButtonProps) {
  const palette = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled ? 0.55 : 1,
          transform: [{ scale: pressed ? motionTokens.pressedScale : 1 }],
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={palette.textColor} />
      ) : (
        <View style={styles.content}>
          {leadingIcon ? (
            <AppIcon name={leadingIcon} size={18} color={palette.textColor} />
          ) : null}
          <Text style={[styles.label, { color: palette.textColor }]}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radiusTokens.md,
    borderWidth: 1,
    minHeight: accessibilityTokens.minTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacingTokens.lg,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  label: {
    fontSize: typographyTokens.bodyLg,
    fontWeight: '700',
  },
});
