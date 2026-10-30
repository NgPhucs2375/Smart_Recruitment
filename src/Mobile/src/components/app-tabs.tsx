import { Bell, Bookmark, MessageCircle, Search, User } from 'lucide-react-native';
import { Tabs } from 'expo-router';

import { font } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { canUseInternalChat } from '@/features/chat/roles';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const { user } = useAuth();
  const theme = useTheme();
  const canChat = canUseInternalChat(user?.roles);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarStyle: {
          backgroundColor: theme.backgroundElement,
          borderTopColor: theme.border,
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
        options={
          canChat
            ? {
                title: 'Tin nhắn',
                tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
              }
            : { href: null }
        }
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
