import { Feather } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import type { ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeProvider';

const TAB_BAR_HEIGHT = 49;

export default function TabsLayout() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const icon =
    (name: React.ComponentProps<typeof Feather>['name']) =>
    ({ color }: { color: ColorValue }) => <Feather name={name} size={24} color={color} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.brand.primary,
        tabBarInactiveTintColor: theme.colors.text.tertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.bg.surface,
          borderTopColor: theme.colors.border.subtle,
          borderTopWidth: 1,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
        tabBarLabelStyle: {
          fontSize: theme.typography.micro.fontSize,
          lineHeight: theme.typography.micro.lineHeight,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: '홈', tabBarIcon: icon('home') }} />
      <Tabs.Screen name="list" options={{ title: '목록', tabBarIcon: icon('list') }} />
      <Tabs.Screen name="stats" options={{ title: '통계', tabBarIcon: icon('bar-chart-2') }} />
      <Tabs.Screen name="settings" options={{ title: '설정', tabBarIcon: icon('sliders') }} />
    </Tabs>
  );
}
