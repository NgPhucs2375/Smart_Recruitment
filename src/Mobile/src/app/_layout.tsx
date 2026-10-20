import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, useColorScheme, View } from 'react-native';

import { BookmarkProvider } from '@/features/bookmarks/bookmark-provider';
import { AuthProvider, useAuth } from '@/features/auth';
import { Colors } from '@/constants/theme';

export default function RootLayout() {
  return (
    <BookmarkProvider>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </BookmarkProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { status } = useAuth();

  // Đang khôi phục phiên đăng nhập: giữ màn hình chờ, tránh nháy màn hình đăng nhập.
  if (status === 'loading') {
    const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const isSignedIn = status === 'signedIn';

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="jobs/[id]"
            options={{ headerShown: true, title: 'Chi tiết việc làm' }}
          />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
