import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppIcon } from '@/src/components/common/AppIcon';
import { AppInput } from '@/src/components/common/AppInput';
import { EmptyState } from '@/src/components/common/EmptyState';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { AppColors } from '@/src/constants/colors';
import { BRANDING } from '@/src/constants/branding';
import { APP_COPY } from '@/src/constants/copy';
import { DEV_SEED_ACCOUNTS } from '@/src/constants/config';
import { useAppState } from '@/src/hooks/use-app-state';
import { getSessionSnapshot } from '@/src/services/session/session-store';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import { getHomeRouteForRole } from '@/src/utils/routes';

export function LoginScreen() {
  const {
    authError,
    bootstrapError,
    currentUser,
    isAuthenticating,
    login,
    retryBootstrap,
  } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setFormError(APP_COPY.login.missingCredentials);
      return;
    }

    try {
      setFormError(null);
      await login({
        email: email.trim().toLowerCase(),
        password,
      });

      const nextUser = getSessionSnapshot().session?.user ?? currentUser;

      if (nextUser) {
        router.replace(getHomeRouteForRole(nextUser.role));
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : APP_COPY.login.failed,
      );
    }
  };

  const errorMessage = formError ?? authError;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <AppIcon name="sparkles" size={18} color={AppColors.primary} />
              <Text style={styles.heroBadgeText}>{BRANDING.appName}</Text>
            </View>

            <Text style={styles.title}>{BRANDING.slogan}</Text>
            <Text style={styles.description}>
              {APP_COPY.login.heroDescription}
            </Text>
          </View>

          {bootstrapError ? (
            <EmptyState
              title={APP_COPY.login.bootstrapTitle}
              description={bootstrapError}
              actionLabel={APP_COPY.common.retry}
              onAction={() => {
                void retryBootstrap();
              }}
            />
          ) : null}

          <View style={styles.formCard}>
            <Text style={styles.sectionTitle}>
              {APP_COPY.login.sectionTitle}
            </Text>
            <Text style={styles.sectionSubtitle}>
              {APP_COPY.login.sectionSubtitle}
            </Text>

            <AppInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="name@company.com"
            />

            <AppInput
              label="Mat khau"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder={APP_COPY.login.passwordPlaceholder}
            />

            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}

            <PrimaryButton
              label="Dang nhap"
              onPress={() => void onSubmit()}
              loading={isAuthenticating}
            />
          </View>

          {__DEV__ ? (
            <View style={styles.devCard}>
              <Text style={styles.devTitle}>{APP_COPY.login.devTitle}</Text>
              <Text style={styles.devDescription}>
                {APP_COPY.login.devDescription}
              </Text>

              {DEV_SEED_ACCOUNTS.map((account) => (
                <Pressable
                  key={account.email}
                  onPress={() => {
                    setEmail(account.email);
                    setPassword(account.password);
                  }}
                  style={({ pressed }) => [
                    styles.seedRow,
                    pressed ? styles.seedRowPressed : null,
                  ]}
                >
                  <View style={styles.seedTextBlock}>
                    <Text style={styles.seedLabel}>{account.label}</Text>
                    <Text style={styles.seedMeta}>{account.email}</Text>
                  </View>
                  <AppIcon
                    name="chevronRight"
                    size={18}
                    color={AppColors.textMuted}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: spacingTokens.xl,
    gap: spacingTokens.lg + spacingTokens.xxs,
    paddingBottom: spacingTokens.xxxl,
  },
  heroCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.hero,
    padding: spacingTokens.xl + spacingTokens.xxs,
    gap: spacingTokens.md + spacingTokens.xxs,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
    backgroundColor: AppColors.primarySoft,
    paddingHorizontal: spacingTokens.sm + spacingTokens.xxs,
    paddingVertical: spacingTokens.xs,
    borderRadius: radiusTokens.pill,
  },
  heroBadgeText: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.primary,
  },
  title: {
    fontSize: typographyTokens.headline,
    lineHeight: 38,
    fontWeight: '800',
    color: AppColors.text,
  },
  description: {
    fontSize: typographyTokens.bodyLg,
    lineHeight: typographyTokens.lineHeightLg,
    color: AppColors.textSecondary,
  },
  formCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xxl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl,
    gap: spacingTokens.md + spacingTokens.xxs,
  },
  sectionTitle: {
    fontSize: typographyTokens.titleLg,
    fontWeight: '800',
    color: AppColors.text,
  },
  sectionSubtitle: {
    fontSize: typographyTokens.body,
    lineHeight: typographyTokens.lineHeightMd,
    color: AppColors.textSecondary,
  },
  errorText: {
    fontSize: typographyTokens.bodySm,
    color: AppColors.danger,
  },
  devCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xxl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl,
    gap: spacingTokens.md,
  },
  devTitle: {
    fontSize: typographyTokens.titleSm,
    fontWeight: '800',
    color: AppColors.text,
  },
  devDescription: {
    fontSize: typographyTokens.bodySm,
    lineHeight: typographyTokens.lineHeightSm,
    color: AppColors.textSecondary,
  },
  seedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacingTokens.md,
    borderRadius: radiusTokens.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.md + spacingTokens.xxs,
  },
  seedRowPressed: {
    backgroundColor: AppColors.surfaceMuted,
  },
  seedTextBlock: {
    flex: 1,
    gap: spacingTokens.xxs,
  },
  seedLabel: {
    fontSize: typographyTokens.bodyLg,
    fontWeight: '700',
    color: AppColors.text,
  },
  seedMeta: {
    fontSize: typographyTokens.bodySm,
    color: AppColors.textSecondary,
  },
});
