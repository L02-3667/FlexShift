import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/src/components/common/AppIcon';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import { useSyncState } from '@/src/context/sync-context';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import { formatIsoDateTime, joinInlineText } from '@/src/utils/text';

function toStatusCopy(status: ReturnType<typeof useSyncState>['syncStatus']) {
  if (status.lifecycle === 'syncing') {
    return APP_COPY.syncBanner.syncing;
  }

  if (status.networkState === 'offline') {
    return APP_COPY.syncBanner.offline;
  }

  if (status.lastError) {
    return status.lastError;
  }

  if (status.lastSuccessfulSyncAt) {
    return `Da dong bo luc ${formatIsoDateTime(status.lastSuccessfulSyncAt)}.`;
  }

  return APP_COPY.syncBanner.ready;
}

export function SyncStatusBanner() {
  const { pendingAnnouncementCount, syncNow, syncStatus } = useSyncState();
  const isOffline = syncStatus.networkState === 'offline';

  return (
    <View style={styles.banner}>
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <AppIcon
            name={syncStatus.networkState === 'offline' ? 'warning' : 'sync'}
            size={18}
            color={isOffline ? AppColors.warning : AppColors.primary}
          />
          <Text style={styles.title}>{APP_COPY.syncBanner.title}</Text>
        </View>

        <PrimaryButton
          label={APP_COPY.syncBanner.syncNow}
          onPress={() => void syncNow()}
          leadingIcon="sync"
          variant="ghost"
        />
      </View>

      <Text style={styles.description}>{toStatusCopy(syncStatus)}</Text>
      <Text style={styles.meta}>
        {joinInlineText([
          `${syncStatus.pendingMutationCount} ${APP_COPY.syncBanner.pendingMutationsLabel}`,
          pendingAnnouncementCount > 0
            ? `${pendingAnnouncementCount} ${APP_COPY.syncBanner.pendingAcknowledgementsLabel}`
            : null,
        ])}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.lg + spacingTokens.xxs,
    gap: spacingTokens.md,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 18,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacingTokens.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
    flex: 1,
  },
  title: {
    fontSize: typographyTokens.bodyLg,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.1,
  },
  description: {
    fontSize: typographyTokens.body,
    lineHeight: typographyTokens.lineHeightMd,
    color: AppColors.textSecondary,
  },
  meta: {
    fontSize: typographyTokens.caption,
    color: AppColors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});
