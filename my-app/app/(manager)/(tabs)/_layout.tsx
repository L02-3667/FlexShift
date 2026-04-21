import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { AppIcon } from '@/src/components/common/AppIcon';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';

export default function ManagerTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.accent,
        tabBarInactiveTintColor: AppColors.textMuted,
        tabBarActiveBackgroundColor: AppColors.primarySoft,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          borderRadius: 18,
          marginHorizontal: 2,
        },
        tabBarStyle: {
          height: 78,
          paddingTop: 8,
          paddingBottom: 10,
          backgroundColor: AppColors.surface,
          borderTopColor: AppColors.border,
          borderTopWidth: 1,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: APP_COPY.navigation.managerTabs.dashboard,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="dashboard" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: APP_COPY.navigation.managerTabs.calendar,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-open-shift"
        options={{
          title: APP_COPY.navigation.managerTabs.createOpenShift,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="add" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="approvals"
        options={{
          title: APP_COPY.navigation.managerTabs.approvals,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="approval" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: APP_COPY.navigation.managerTabs.statistics,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="chart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: APP_COPY.navigation.managerTabs.settings,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="settings" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="schedule" options={{ href: null }} />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
