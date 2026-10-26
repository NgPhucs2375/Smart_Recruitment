import {
  BeVietnamPro_400Regular,
  BeVietnamPro_500Medium,
  BeVietnamPro_600SemiBold,
  BeVietnamPro_700Bold,
  useFonts,
} from '@expo-google-fonts/be-vietnam-pro';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { ActivityIndicator, useColorScheme, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BookmarkProvider } from '@/features/bookmarks/bookmark-provider';
import { AuthProvider, useAuth } from '@/features/auth';
import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { NotificationProvider } from '@/features/notifications/notification-provider';
import { portalFor } from '@/features/auth/portal';

// Giữ splash cho đến khi font Be Vietnam Pro load xong, tránh nháy font hệ thống.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BeVietnamPro_400Regular,
    BeVietnamPro_500Medium,
    BeVietnamPro_600SemiBold,
    BeVietnamPro_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <BookmarkProvider>
      <AuthProvider>
        <NotificationProvider>
          <RootNavigator />
        </NotificationProvider>
      </AuthProvider>
    </BookmarkProvider>
  );
}

function RootNavigator() {
  const colorScheme = useColorScheme();
  const { status, user, signOut } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  // Sau khi đăng xuất, luôn đưa về trang đăng nhập. Các màn hình ứng viên
  // (cvs, applications, ...) nằm ngoài nhóm (auth) nên nếu không chặn,
  // Stack.Protected sẽ chọn chúng làm "first available screen" thay vì /login.
  useEffect(() => {
    if (status === 'signedOut' && segments[0] !== '(auth)') {
      router.replace('/login');
    }
  }, [status, segments, router]);

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
  const portal = user ? portalFor(user.roles) : null;

  // Admin: mobile không hỗ trợ portal quản trị — chặn + yêu cầu đăng xuất.
  if (isSignedIn && portal === 'admin') {
    const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', padding: 24, gap: 12 }}>
        <ThemedText style={{ fontWeight: '600', fontSize: 18, textAlign: 'center' }}>
          Quản trị viên
        </ThemedText>
        <ThemedText style={{ color: colors.textSecondary, textAlign: 'center', lineHeight: 20 }}>
          Tài khoản quản trị chỉ hỗ trợ trên web. Vui lòng đăng nhập bằng tài khoản ứng viên hoặc nhà tuyển dụng.
        </ThemedText>
        <Button onPress={() => void signOut()} style={{ marginTop: 8 }}>
          Đăng xuất
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={isSignedIn && portal === 'candidate'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="applications" options={{ headerShown: false }} />
          <Stack.Screen name="change-password" options={{ headerShown: false }} />
          <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="jobs/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="companies/index" options={{ headerShown: false }} />
          <Stack.Screen name="companies/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="cvs" options={{ headerShown: false }} />
          <Stack.Screen name="cv-agent" options={{ headerShown: false }} />
          <Stack.Screen name="cv-create" options={{ headerShown: false }} />
          <Stack.Screen name="cv-detail" options={{ headerShown: false }} />
          <Stack.Screen name="cv-upload" options={{ headerShown: false }} />
          <Stack.Screen name="notifications" options={{ headerShown: false }} />
          <Stack.Screen name="profile-edit" options={{ headerShown: false }} />
          <Stack.Screen name="tao-cv" options={{ headerShown: false }} />
          <Stack.Screen name="tao-cv/[id]" options={{ headerShown: false }} />
          <Stack.Screen name="tao-cv/ai" options={{ headerShown: false }} />
          <Stack.Screen name="mau-cv" options={{ headerShown: false }} />
          <Stack.Screen name="cv-phan-tich/[id]" options={{ headerShown: false }} />
        </Stack.Protected>

        <Stack.Protected guard={isSignedIn && portal === 'hr'}>
          <Stack.Screen name="(hr)" />
          <Stack.Screen name="hr/jobs-form" options={{ headerShown: false }} />
          <Stack.Screen name="hr/job-applicants" options={{ headerShown: false }} />
          <Stack.Screen name="hr/cv-viewer" options={{ headerShown: false }} />
          <Stack.Screen name="hr/approvals" options={{ headerShown: false }} />
          <Stack.Screen name="hr/nhan-su" options={{ headerShown: false }} />
          <Stack.Screen name="hr/reports" options={{ headerShown: false }} />
          <Stack.Screen name="hr/company" options={{ headerShown: false }} />
          <Stack.Screen name="hr/messages" options={{ headerShown: false }} />
          <Stack.Screen name="hr/messages/[id]" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
