import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';

export const googleWebClientId =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() ?? '';
export const googleIosClientId =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';
export const githubClientId = process.env.EXPO_PUBLIC_GITHUB_CLIENT_ID?.trim() ?? '';

const githubRedirectUriOverride =
  process.env.EXPO_PUBLIC_GITHUB_REDIRECT_URI?.trim() ?? '';

export const githubDiscovery = {
  authorizationEndpoint: 'https://github.com/login/oauth/authorize',
  tokenEndpoint: 'https://github.com/login/oauth/access_token',
};

export function isGoogleConfigured(): boolean {
  if (!googleWebClientId) return false;
  return Platform.OS !== 'ios' || Boolean(googleIosClientId);
}

export function isGithubConfigured(): boolean {
  return Boolean(githubClientId);
}

export function getGithubRedirectUri(): string {
  if (githubRedirectUriOverride) return githubRedirectUriOverride;
  return makeRedirectUri({ scheme: 'smartrecruitment', path: 'oauth/github' });
}
