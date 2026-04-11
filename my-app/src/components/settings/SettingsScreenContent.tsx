import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/common/EmptyState';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import { APP_CONFIG } from '@/src/constants/config';
import { ROLE_LABELS } from '@/src/constants/options';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useAppState } from '@/src/hooks/use-app-state';
import { useAsyncData } from '@/src/hooks/use-async-data';
import {
  getSettingsData,
  saveSettingsData,
} from '@/src/services/flexshift-service';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import type { AppThemePreference, UserSetting } from '@/src/types/models';
import { formatIsoDateTime, joinInlineText } from '@/src/utils/text';

interface SettingsScreenContentProps {
  title: string;
  subtitle: string;
}

function createDefaultSettings(userId = ''): UserSetting {
  return {
    userId,
    notificationsEnabled: true,
    approvalUpdatesEnabled: true,
    openShiftAlertsEnabled: true,
    remindersEnabled: true,
    reminderMinutesBefore: 60,
    language: 'vi',
    theme: 'system',
    updatedAt: '',
  };
}

function ToggleRow({
  title,
  description,
  value,
  disabled,
  onValueChange,
}: {
  title: string;
  description: string;
  value: boolean;
  disabled?: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingTextBlock}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
      </View>
      <Switch
        disabled={disabled}
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: AppColors.border, true: AppColors.primarySoft }}
        thumbColor={value ? AppColors.primary : AppColors.white}
      />
    </View>
  );
}

function ChoiceChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.choiceChip, selected ? styles.choiceChipActive : null]}
    >
      <Text
        style={[
          styles.choiceChipText,
          selected ? styles.choiceChipTextActive : null,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function SettingsScreenContent({
  title,
  subtitle,
}: SettingsScreenContentProps) {
  const db = useSQLiteContext();
  const { currentUser, logout } = useAppState();
  const [settings, setSettings] = useState<UserSetting>(
    createDefaultSettings(),
  );
  const [saving, setSaving] = useState(false);

  const { data, error, loading, reload } = useAsyncData(
    () => getSettingsData(db, currentUser?.id ?? ''),
    [db, currentUser?.id],
    createDefaultSettings(currentUser?.id ?? ''),
  );

  useEffect(() => {
    setSettings(data);
  }, [data]);

  if (!currentUser) {
    return null;
  }

  const savePatch = async (patch: Partial<UserSetting>) => {
    const nextSettings = {
      ...settings,
      ...patch,
      userId: currentUser.id,
    };

    setSettings(nextSettings);
    setSaving(true);

    try {
      const saved = await saveSettingsData(db, currentUser.id, patch);
      setSettings(saved);
    } catch (saveError) {
      setSettings(data);
      Alert.alert(
        APP_COPY.common.saveFailedTitle,
        saveError instanceof Error
          ? saveError.message
          : APP_COPY.common.tryAgain,
      );
    } finally {
      setSaving(false);
    }
  };

  const onSelectTheme = (theme: AppThemePreference) => {
    void savePatch({ theme });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroCopy}>
              <Text style={styles.heroEyebrow}>Settings</Text>
              <SectionHeader title={title} subtitle={subtitle} />
            </View>
            <View style={styles.heroOrb} />
          </View>
        </View>

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>{APP_COPY.settings.loading}</Text>
          </View>
        ) : error ? (
          <EmptyState
            title={APP_COPY.settings.loadFailedTitle}
            description={error}
            actionLabel={APP_COPY.common.retry}
            onAction={reload}
          />
        ) : (
          <>
            <View style={styles.accountCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {currentUser.fullName.slice(0, 1)}
                </Text>
              </View>
              <View style={styles.accountBody}>
                <Text style={styles.accountName}>{currentUser.fullName}</Text>
                <Text style={styles.accountMeta}>
                  {joinInlineText(
                    [ROLE_LABELS[currentUser.role], currentUser.email],
                    ', ',
                  )}
                </Text>
                <Text style={styles.accountMeta}>{currentUser.phone}</Text>
              </View>
              <View style={styles.accountBadge}>
                <Text style={styles.accountBadgeText}>Active</Text>
              </View>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupTitle}>
                {APP_COPY.settings.notificationsGroup}
              </Text>
              <ToggleRow
                title={APP_COPY.settings.notificationsEnabledTitle}
                description={APP_COPY.settings.notificationsEnabledDescription}
                value={settings.notificationsEnabled}
                disabled={saving}
                onValueChange={(value) => {
                  void savePatch({ notificationsEnabled: value });
                }}
              />
              <ToggleRow
                title={APP_COPY.settings.approvalUpdatesTitle}
                description={APP_COPY.settings.approvalUpdatesDescription}
                value={settings.approvalUpdatesEnabled}
                disabled={saving || !settings.notificationsEnabled}
                onValueChange={(value) => {
                  void savePatch({ approvalUpdatesEnabled: value });
                }}
              />
              <ToggleRow
                title={APP_COPY.settings.openShiftAlertsTitle}
                description={APP_COPY.settings.openShiftAlertsDescription}
                value={settings.openShiftAlertsEnabled}
                disabled={saving || !settings.notificationsEnabled}
                onValueChange={(value) => {
                  void savePatch({ openShiftAlertsEnabled: value });
                }}
              />
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupTitle}>
                {APP_COPY.settings.remindersGroup}
              </Text>
              <ToggleRow
                title={APP_COPY.settings.remindersEnabledTitle}
                description={APP_COPY.settings.remindersEnabledDescription}
                value={settings.remindersEnabled}
                disabled={saving}
                onValueChange={(value) => {
                  void savePatch({ remindersEnabled: value });
                }}
              />

              <View style={styles.inlineChoices}>
                {APP_CONFIG.reminderMinuteOptions.map((minutes) => (
                  <ChoiceChip
                    key={minutes}
                    label={`${minutes} phut`}
                    selected={settings.reminderMinutesBefore === minutes}
                    onPress={() => {
                      void savePatch({ reminderMinutesBefore: minutes });
                    }}
                  />
                ))}
              </View>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupTitle}>
                {APP_COPY.settings.appearanceGroup}
              </Text>
              <Text style={styles.choiceLabel}>
                {APP_COPY.settings.languageLabel}
              </Text>
              <View style={styles.inlineChoices}>
                <ChoiceChip
                  label={APP_COPY.settings.languageVietnamese}
                  selected={settings.language === 'vi'}
                  onPress={() => {
                    void savePatch({ language: 'vi' });
                  }}
                />
              </View>

              <Text style={styles.choiceLabel}>
                {APP_COPY.settings.themeLabel}
              </Text>
              <View style={styles.inlineChoices}>
                <ChoiceChip
                  label={APP_COPY.settings.themeSystem}
                  selected={settings.theme === 'system'}
                  onPress={() => onSelectTheme('system')}
                />
                <ChoiceChip
                  label={APP_COPY.settings.themeLight}
                  selected={settings.theme === 'light'}
                  onPress={() => onSelectTheme('light')}
                />
              </View>
            </View>

            <View style={styles.groupCard}>
              <Text style={styles.groupTitle}>
                {APP_COPY.settings.supportGroup}
              </Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {APP_COPY.settings.contactLabel}
                </Text>
                <Text style={styles.infoValue}>{APP_CONFIG.supportEmail}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {APP_COPY.settings.privacyLabel}
                </Text>
                <Text style={styles.infoValue}>
                  {APP_COPY.settings.privacyValue}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {APP_COPY.settings.versionLabel}
                </Text>
                <Text style={styles.infoValue}>
                  {Constants.expoConfig?.version ??
                    APP_CONFIG.fallbackAppVersion}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>
                  {APP_COPY.settings.updatedAtLabel}
                </Text>
                <Text style={styles.infoValue}>
                  {settings.updatedAt
                    ? formatIsoDateTime(settings.updatedAt)
                    : APP_COPY.settings.updatedJustNow}
                </Text>
              </View>
            </View>

            <PrimaryButton
              label={APP_COPY.common.signOut}
              variant="secondary"
              onPress={() => {
                void logout().finally(() => {
                  router.replace('/(auth)/login');
                });
              }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: spacingTokens.xl,
    gap: spacingTokens.lg + spacingTokens.xxs,
    paddingBottom: spacingTokens.xxxl,
  },
  heroCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.hero,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl + spacingTokens.xxs,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowRadius: 24,
    elevation: 3,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacingTokens.md,
  },
  heroCopy: {
    flex: 1,
  },
  heroEyebrow: {
    fontSize: typographyTokens.bodySm,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: spacingTokens.sm,
  },
  heroOrb: {
    width: 72,
    height: 72,
    borderRadius: radiusTokens.pill,
    backgroundColor: AppColors.primarySoft,
    borderWidth: 10,
    borderColor: AppColors.primary,
    borderTopColor: 'transparent',
    borderLeftColor: 'transparent',
    transform: [{ rotate: '12deg' }],
  },
  stateBox: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl + spacingTokens.xxs,
    alignItems: 'center',
    gap: spacingTokens.sm + spacingTokens.xxs,
  },
  stateText: {
    fontSize: typographyTokens.body,
    color: AppColors.textSecondary,
  },
  accountCard: {
    backgroundColor: AppColors.surfaceMuted,
    borderRadius: radiusTokens.hero,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl,
    flexDirection: 'row',
    gap: spacingTokens.lg,
    alignItems: 'center',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: AppColors.primary,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.accent,
  },
  accountBody: {
    flex: 1,
    gap: spacingTokens.xxs,
  },
  accountName: {
    fontSize: typographyTokens.titleLg,
    fontWeight: '800',
    color: AppColors.text,
  },
  accountMeta: {
    fontSize: typographyTokens.bodySm,
    color: AppColors.textSecondary,
  },
  accountBadge: {
    borderRadius: radiusTokens.pill,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.sm,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  accountBadgeText: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.accent,
    textTransform: 'uppercase',
  },
  groupCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xxl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.lg + spacingTokens.sm / 2,
    gap: spacingTokens.lg,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 18,
    elevation: 2,
  },
  groupTitle: {
    fontSize: typographyTokens.titleMd,
    fontWeight: '800',
    color: AppColors.text,
  },
  settingRow: {
    flexDirection: 'row',
    gap: spacingTokens.md + spacingTokens.xxs,
    alignItems: 'center',
  },
  settingTextBlock: {
    flex: 1,
    gap: spacingTokens.xxs,
  },
  settingTitle: {
    fontSize: typographyTokens.bodyLg,
    fontWeight: '700',
    color: AppColors.text,
  },
  settingDescription: {
    fontSize: typographyTokens.bodySm,
    lineHeight: typographyTokens.lineHeightSm,
    color: AppColors.textSecondary,
  },
  choiceLabel: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.textMuted,
    textTransform: 'uppercase',
  },
  inlineChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingTokens.sm + spacingTokens.xxs,
  },
  choiceChip: {
    borderRadius: radiusTokens.pill,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surfaceMuted,
    paddingHorizontal: spacingTokens.md + spacingTokens.xxs,
    paddingVertical: spacingTokens.sm + spacingTokens.xxs / 2,
  },
  choiceChipActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primarySoft,
  },
  choiceChipText: {
    fontSize: typographyTokens.bodySm,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  choiceChipTextActive: {
    color: AppColors.primary,
  },
  infoRow: {
    gap: spacingTokens.xxs,
  },
  infoLabel: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.textMuted,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: typographyTokens.body,
    lineHeight: typographyTokens.lineHeightMd,
    color: AppColors.text,
  },
});
