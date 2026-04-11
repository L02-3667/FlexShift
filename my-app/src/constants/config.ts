export const APP_CONFIG = {
  supportEmail: 'support@flexshift.app',
  fallbackAppVersion: 'dev-local',
  defaultBackendPort: '3000',
  apiRequestTimeoutMs: 15_000,
  syncPollIntervalMs: 60_000,
  reminderMinuteOptions: [30, 60, 120] as const,
} as const;

export const DEV_SEED_ACCOUNTS = [
  {
    label: 'Quan ly',
    email: 'manager@flexshift.app',
    password: 'FlexShift123!',
  },
  {
    label: 'Nhan vien',
    email: 'an.nguyen@flexshift.app',
    password: 'FlexShift123!',
  },
] as const;
