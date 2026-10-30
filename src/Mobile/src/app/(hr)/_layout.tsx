import { Bell, Briefcase, CircleUser, LayoutDashboard, Users } from 'lucide-react-native';
import { Tabs } from 'expo-router';

import { Palette } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function HRLayout() {
  const colors = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
      }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tổng quan',
          tabBarIcon: ({ color, focused, size }) => <LayoutDashboard size={size} color={focused ? Palette.mist : color} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title: 'Tin tuyển',
          tabBarIcon: ({ color, focused, size }) => <Briefcase size={size} color={focused ? Palette.sand : color} />,
        }}
      />
      <Tabs.Screen
        name="applicants"
        options={{
          title: 'Ứng viên',
          tabBarIcon: ({ color, focused, size }) => <Users size={size} color={focused ? Palette.sage : color} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          // Ẩn khỏi footer — lối tắt Tin nhắn nằm ở AppHeader (góc phải).
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, focused, size }) => <Bell size={size} color={focused ? Palette.bronze : color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Tài khoản',
          tabBarIcon: ({ color, focused, size }) => <CircleUser size={size} color={focused ? Palette.marine : color} />,
        }}
      />
    </Tabs>
  );
}
