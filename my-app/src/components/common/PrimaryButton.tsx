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
  testID?: string;
}

const VARIANT_STYLES: Record<
  ButtonVariant,
  { backgroundColor: string; borderColor: string; textColor: string }
> = {
  primary: {
    backgroundColor: AppColors.primary,
    borderColor: AppColors.primary,
    textColor: AppColors.accent,
  },
  secondary: {
    backgroundColor: AppColors.surfaceMuted,
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
  testID,
}: PrimaryButtonProps) {
  const palette = VARIANT_STYLES[variant];
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.backgroundColor,
          borderColor: palette.borderColor,
          opacity: isDisabled ? 0.55 : 1,
          transform: [{ scale: pressed ? motionTokens.pressedScale : 1 }],
        },
        pressed && !isDisabled ? styles.buttonPressed : null,
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
    paddingHorizontal: spacingTokens.lg + spacingTokens.xxs,
    paddingVertical: spacingTokens.sm + spacingTokens.xxs,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 18,
    elevation: 2,
  },
  buttonPressed: {
    shadowOpacity: 0,
    elevation: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  label: {
    fontSize: typographyTokens.bodyLg,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
