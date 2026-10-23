import { Image } from 'expo-image';
import { Camera, Trash2, UserRound } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProfileAvatarPickerProps = {
  previewUri?: string;
  initials: string;
  busy?: boolean;
  onPick: () => void;
  onRemove: () => void;
};

export function ProfileAvatarPicker({
  previewUri,
  initials,
  busy = false,
  onPick,
  onRemove,
}: ProfileAvatarPickerProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Chọn ảnh đại diện"
        disabled={busy}
        onPress={onPick}
        style={({ pressed }) => [styles.avatarWrap, { opacity: pressed ? 0.8 : 1 }]}>
        <View style={[styles.avatar, { backgroundColor: `${theme.primary}1A` }]}>
          {previewUri ? (
            <Image source={{ uri: previewUri }} contentFit="cover" transition={150} style={styles.image} />
          ) : initials ? (
            <ThemedText style={[styles.initials, { color: theme.primary }]}>{initials}</ThemedText>
          ) : (
            <UserRound size={30} color={theme.primary} />
          )}
        </View>
        <View
          style={[
            styles.cameraBadge,
            { backgroundColor: theme.primary, borderColor: theme.backgroundElement },
          ]}>
          <Camera size={14} color={theme.primaryForeground} />
        </View>
      </Pressable>

      <View style={styles.copy}>
        <ThemedText style={[styles.title, { color: theme.text }]}>Ảnh đại diện</ThemedText>
        <ThemedText style={[styles.helper, { color: theme.textSecondary }]}>
          JPG, PNG, WEBP hoặc GIF, tối đa 5MB. Ảnh giúp nhà tuyển dụng nhận diện bạn nhanh hơn.
        </ThemedText>
        <View style={styles.actions}>
          <Button
            disabled={busy}
            onPress={onPick}
            size="sm"
            variant="outline"
            icon={<Camera size={14} color={theme.text} />}>
            {previewUri ? 'Đổi ảnh' : 'Chọn ảnh'}
          </Button>
          {previewUri ? (
            <Button
              disabled={busy}
              onPress={onRemove}
              size="sm"
              variant="ghost"
              icon={<Trash2 size={14} color={theme.destructive} />}>
              Xoá ảnh
            </Button>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 16,
  },
  avatarWrap: { width: 88, height: 88 },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  initials: { fontFamily: font('bold'), fontSize: 28 },
  cameraBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: Radius.pill,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0, gap: 5 },
  title: { fontFamily: font('semibold'), fontSize: 14 },
  helper: { fontFamily: font('regular'), fontSize: 12, lineHeight: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginTop: 3 },
});
