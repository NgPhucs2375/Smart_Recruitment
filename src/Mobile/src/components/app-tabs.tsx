import { Bell, Bookmark, Search, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';

import { font } from '@/constants/theme';

export default function AppTabs() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#355C8C',
        tabBarInactiveTintColor: '#6D7480',
        tabBarStyle: {
          backgroundColor: '#FFFDF9',
          borderTopColor: '#DDD4C7',
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontFamily: font('semibold'),
          fontWeight: '600',
          fontSize: 12,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Việc làm',
          tabBarIcon: ({ color, size }) => <Search size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: 'Đã lưu',
          tabBarIcon: ({ color, size }) => <Bookmark size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          // Ẩn khỏi footer — lối tắt Tin nhắn nằm ở AppHeader (góc phải).
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Thông báo',
          tabBarIcon: ({ color, size }) => <Bell size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Hồ sơ',
          tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
        }}
      />
      <Tabs.Screen name="applications" options={{ href: null }} />
      <Tabs.Screen name="settings" options={{ href: null }} />
      <Tabs.Screen name="profile-edit" options={{ href: null }} />
      <Tabs.Screen name="phu-hop" options={{ href: null }} />
    </Tabs>
  );
}