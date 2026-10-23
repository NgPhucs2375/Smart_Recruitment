import {
  ResponseType,
  useAuthRequest,
  type AuthSessionResult,
} from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useMemo, useState, type ReactNode } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Button } from '@/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { font } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  getGithubRedirectUri,
  githubClientId,
  githubDiscovery,
  googleIosClientId,
  googleWebClientId,
  isGithubConfigured,
  isGoogleConfigured,
} from '../social-config';

WebBrowser.maybeCompleteAuthSession();

type SocialLoginButtonsProps = {
  disabled?: boolean;
  onGoogleIdToken: (idToken: string) => Promise<void> | void;
  onGithubCode: (code: string, redirectUri: string) => Promise<void> | void;
  onError: (message: string) => void;
};

function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill="#4285F4"
        d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.3-2.1 3.8-5.2 3.8-8.6z"
      />
      <Path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-3.7 2.9c2 3.9 6 6.7 10.5 6.7z"
      />
      <Path
        fill="#FBBC05"
        d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4L1.5 6.7C.5 8.7 0 10.3 0 12s.5 3.3 1.5 4.7l3.7-2.3z"
      />
      <Path
        fill="#EA4335"
        d="M12 4.6c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.5 0 3.5 2.6 1.5 6.6l3.7 2.9c1-2.8 3.7-4.9 6.8-4.9z"
      />
    </Svg>
  );
}

type SocialButtonProps = {
  label: string;
  icon: ReactNode;
  disabled?: boolean;
  loading?: boolean;
  onPress: () => void;
};

function GitHubMark({ color }: { color: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
      />
    </Svg>
  );
}

function SocialButton({ label, icon, disabled, loading, onPress }: SocialButtonProps) {  const theme = useTheme();

  return (
    <Button
      variant="outline"
      size="lg"
      disabled={disabled || loading}
      icon={
        loading ? <ActivityIndicator size="small" color={theme.textSecondary} /> : icon
      }
      onPress={onPress}
      style={styles.socialButton}>
      {label}
    </Button>
  );
}

function authErrorMessage(result: AuthSessionResult, fallback: string): string {
  if (result.type !== 'error') return fallback;
  return result.error?.message ?? result.params.error_description ?? fallback;
}

function GoogleNativeButton({
  disabled,
  onGoogleIdToken,
  onError,
}: Omit<SocialLoginButtonsProps, 'onGithubCode'>) {
  const [busy, setBusy] = useState(false);

  const handlePress = async () => {
    if (!isGoogleConfigured()) {
      onError('Đăng nhập Google chưa được cấu hình cho nền tảng này.');
      return;
    }

    setBusy(true);
    let google: typeof import('@react-native-google-signin/google-signin') | null = null;
    try {
      google = await import('@react-native-google-signin/google-signin');
      google.GoogleSignin.configure({
        webClientId: googleWebClientId,
        iosClientId: Platform.OS === 'ios' ? googleIosClientId : undefined,
        scopes: ['profile', 'email'],
      });

      if (Platform.OS === 'android') {
        await google.GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      }

      const response = await google.GoogleSignin.signIn();
      if (google.isCancelledResponse(response)) return;

      if (!google.isSuccessResponse(response)) {
        onError('Đăng nhập Google không hoàn tất. Vui lòng thử lại.');
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        onError('Google không trả về idToken. Vui lòng thử lại.');
        return;
      }

      await onGoogleIdToken(idToken);
    } catch (error) {
      if (google?.isErrorWithCode(error)) {
        if (
          error.code === google.statusCodes.SIGN_IN_CANCELLED ||
          error.code === google.statusCodes.IN_PROGRESS
        ) {
          return;
        }
        if (error.code === google.statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          onError('Google Play Services không khả dụng hoặc cần cập nhật.');
          return;
        }
      }

      const message =
        error instanceof Error ? error.message : 'Đăng nhập Google thất bại. Vui lòng thử lại.';
      onError(
        /not implemented|native module|RNGoogleSignIn|TurboModule/i.test(message)
          ? 'Đăng nhập Google cần development build (không chạy trong Expo Go).'
          : message,
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <SocialButton
      label="Tiếp tục với Google"
      icon={<GoogleMark />}
      disabled={disabled}
      loading={busy}
      onPress={handlePress}
    />
  );
}

function GoogleWebButton({
  disabled,
  onGoogleIdToken,
  onError,
}: Omit<SocialLoginButtonsProps, 'onGithubCode'>) {
  const [busy, setBusy] = useState(false);
  const [request, , promptAsync] = Google.useIdTokenAuthRequest({
    webClientId: googleWebClientId,
    selectAccount: true,
  });

  const handlePress = async () => {
    if (!request) return;

    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const idToken = result.params.id_token;
        if (!idToken) {
          onError('Google không trả về idToken. Vui lòng thử lại.');
          return;
        }
        await onGoogleIdToken(idToken);
        return;
      }

      if (result.type === 'error') {
        onError(authErrorMessage(result, 'Đăng nhập Google thất bại. Vui lòng thử lại.'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SocialButton
      label="Tiếp tục với Google"
      icon={<GoogleMark />}
      disabled={disabled || !request}
      loading={busy}
      onPress={handlePress}
    />
  );
}

function GoogleButton(props: Omit<SocialLoginButtonsProps, 'onGithubCode'>) {
  if (Platform.OS === 'web') {
    if (!googleWebClientId) {
      return (
        <SocialButton
          label="Tiếp tục với Google"
          icon={<GoogleMark />}
          disabled={props.disabled}
          onPress={() =>
            props.onError('Đăng nhập Google chưa được cấu hình (thiếu EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID).')
          }
        />
      );
    }

    return <GoogleWebButton {...props} />;
  }

  return <GoogleNativeButton {...props} />;
}

function GitHubButton({
  disabled,
  onGithubCode,
  onError,
}: Omit<SocialLoginButtonsProps, 'onGoogleIdToken'>) {
  const [busy, setBusy] = useState(false);
  const theme = useTheme();
  const redirectUri = useMemo(() => getGithubRedirectUri(), []);
  const [request, , promptAsync] = useAuthRequest(
    {
      clientId: githubClientId,
      redirectUri,
      responseType: ResponseType.Code,
      usePKCE: false,
      scopes: ['read:user', 'user:email'],
    },
    githubDiscovery,
  );

  const handlePress = async () => {
    if (!request) return;

    setBusy(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const code = result.params.code;
        if (!code) {
          onError('GitHub không trả về authorization code. Vui lòng thử lại.');
          return;
        }
        await onGithubCode(code, redirectUri);
        return;
      }

      if (result.type === 'error') {
        onError(authErrorMessage(result, 'Đăng nhập GitHub thất bại. Vui lòng thử lại.'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <SocialButton
      label="Tiếp tục với GitHub"
      icon={<GitHubMark color={theme.text} />}
      disabled={disabled || !request}
      loading={busy}
      onPress={handlePress}
    />
  );
}

export function SocialLoginButtons({
  disabled,
  onGoogleIdToken,
  onGithubCode,
  onError,
}: SocialLoginButtonsProps) {
  const theme = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
        <ThemedText style={[styles.dividerText, { color: theme.textSecondary }]}>
          hoặc tiếp tục với
        </ThemedText>
        <View style={[styles.dividerLine, { backgroundColor: theme.border }]} />
      </View>

      <GoogleButton
        disabled={disabled}
        onGoogleIdToken={onGoogleIdToken}
        onError={onError}
      />

      {isGithubConfigured() ? (
        <GitHubButton
          disabled={disabled}
          onGithubCode={onGithubCode}
          onError={onError}
        />
      ) : (
        <SocialButton
          label="Tiếp tục với GitHub"
          icon={<GitHubMark color={theme.text} />}
          disabled={disabled}
          onPress={() =>
            onError('Đăng nhập GitHub chưa được cấu hình (thiếu EXPO_PUBLIC_GITHUB_CLIENT_ID).')
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10, marginTop: 18 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
  dividerText: { fontFamily: font('regular'), fontSize: 12 },
  socialButton: { width: '100%', borderRadius: 12 },
});
