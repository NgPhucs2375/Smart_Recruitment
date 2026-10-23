import { StyleSheet, Text, View } from 'react-native';
import { Users } from 'lucide-react-native';

import { font, Palette } from '@/constants/theme';
import { chatInitials } from '@/features/chat/chat-format';

const TONES = [
  { background: Palette.softSage, foreground: Palette.sage },
  { background: Palette.sandsoft, foreground: Palette.bronze },
  { background: `${Palette.marine}1A`, foreground: Palette.marine },
  { background: `${Palette.mist}33`, foreground: Palette.navy },
];

function toneFor(name: string) {
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = (hash + name.charCodeAt(index)) % 997;
  }
  return TONES[hash % TONES.length];
}

type ChatAvatarProps = {
  name: string;
  size?: number;
  group?: boolean;
};

export function ChatAvatar({ name, size = 44, group = false }: ChatAvatarProps) {
  const tone = toneFor(name);

  return (
    <View
      accessible={false}
      style={[
        styles.root,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: group ? `${Palette.navy}14` : tone.background,
        },
      ]}>
      {group ? (
        <Users size={size * 0.42} color={Palette.navy} />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            {
              color: tone.foreground,
              fontSize: size * 0.34,
            },
          ]}>
          {chatInitials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  label: {
    fontFamily: font('bold'),
    letterSpacing: -0.3,
  },
});
