const { IOSConfig, withInfoPlist } = require('expo/config-plugins');

const GOOGLE_CLIENT_SUFFIX = '.apps.googleusercontent.com';

module.exports = function withGoogleSignIn(config) {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() ?? '';
  if (!iosClientId.endsWith(GOOGLE_CLIENT_SUFFIX)) return config;

  const scheme = `com.googleusercontent.apps.${iosClientId.slice(0, -GOOGLE_CLIENT_SUFFIX.length)}`;

  return withInfoPlist(config, (modConfig) => {
    if (!IOSConfig.Scheme.hasScheme(scheme, modConfig.modResults)) {
      modConfig.modResults = IOSConfig.Scheme.appendScheme(scheme, modConfig.modResults);
    }
    return modConfig;
  });
};
