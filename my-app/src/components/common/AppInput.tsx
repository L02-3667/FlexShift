import {
  StyleSheet,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from 'react-native';

import { AppColors } from '@/src/constants/colors';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

interface AppInputProps extends TextInputProps {
  label: string;
  hint?: string;
  error?: string | null;
}

export function AppInput({
  label,
  hint,
  error,
  style,
  ...props
}: AppInputProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={AppColors.textMuted}
        style={[styles.input, props.multiline ? styles.multiline : null, style]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacingTokens.xs,
  },
  label: {
    fontSize: typographyTokens.body,
    fontWeight: '700',
    color: AppColors.text,
  },
  hint: {
    fontSize: typographyTokens.caption,
    color: AppColors.textMuted,
  },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.md,
    paddingHorizontal: spacingTokens.md + spacingTokens.xxs,
    paddingVertical: spacingTokens.md,
    fontSize: typographyTokens.bodyLg,
    color: AppColors.text,
  },
  multiline: {
    minHeight: 112,
    textAlignVertical: 'top',
  },
  error: {
    fontSize: typographyTokens.caption,
    color: AppColors.danger,
  },
});
