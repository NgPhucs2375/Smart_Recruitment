import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';

import { BookmarkProvider } from '@/features/bookmarks/bookmark-provider';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <BookmarkProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="jobs/[id]"
            options={{ headerShown: true, title: 'Chi tiết việc làm' }}
          />
        </Stack>
      </ThemeProvider>
    </BookmarkProvider>
  );
}
