import { Tabs } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { AppIcon } from '@/src/components/common/AppIcon';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';

export default function EmployeeTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: AppColors.primary,
        tabBarInactiveTintColor: AppColors.textMuted,
        tabBarButton: HapticTab,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: AppColors.border,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: APP_COPY.navigation.employeeTabs.dashboard,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: APP_COPY.navigation.employeeTabs.calendar,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="calendar" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="open-shifts"
        options={{
          title: APP_COPY.navigation.employeeTabs.openShifts,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="openShift" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: APP_COPY.navigation.employeeTabs.requests,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="request" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: APP_COPY.navigation.employeeTabs.statistics,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="chart" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: APP_COPY.navigation.employeeTabs.settings,
          tabBarIcon: ({ color, size }) => (
            <AppIcon name="settings" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="profile" options={{ href: null }} />
    </Tabs>
  );
}
