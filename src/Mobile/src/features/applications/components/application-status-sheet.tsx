import type { ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useColorScheme, View } from 'react-native';
import { Check, ListFilter, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Radius } from '@/constants/theme';
import {
  APPLICATION_STATUSES,
  getToneColors,
} from '@/features/applications/constants';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  selected: number | null;
  onSelect: (statusCode: number | null) => void;
  onClose: () => void;
};

export function ApplicationStatusSheet({ visible, selected, onSelect, onClose }: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const choose = (statusCode: number | null) => {
    onSelect(statusCode);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng bộ lọc trạng thái"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ListFilter size={18} color={theme.primary} />
              <ThemedText style={[styles.title, { color: theme.text }]}>
                Lọc theo trạng thái
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}>
              <X size={18} color={theme.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}>
            <StatusOption
              label="Tất cả trạng thái"
              selected={selected === null}
              onPress={() => choose(null)}
            />
            {APPLICATION_STATUSES.map((status) => {
              const tone = getToneColors(status.tone, scheme);
              return (
                <StatusOption
                  key={status.code}
                  label={status.label}
                  selected={selected === status.code}
                  onPress={() => choose(status.code)}
                  badge={
                    <Badge
                      variant={status.tone}
                      backgroundColor={tone.background}
                      color={tone.text}
                      textStyle={styles.badgeText}>
                      {status.label}
                    </Badge>
                  }
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function StatusOption({
  label,
  selected,
  badge,
  onPress,
}: {
  label: string;
  selected: boolean;
  badge?: ReactNode;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        {
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? `${theme.primary}0D` : pressed ? theme.muted : 'transparent',
        },
      ]}>
      <View style={styles.optionCopy}>
        {badge ?? (
          <ThemedText style={[styles.optionLabel, { color: theme.text }]}>{label}</ThemedText>
        )}
      </View>
      {selected ? <Check size={17} color={theme.primary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    maxHeight: '82%',
    borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'],
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: font('semibold'),
    fontSize: 17,
    lineHeight: 23,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flexShrink: 1,
  },
  list: {
    gap: 8,
    paddingBottom: 8,
  },
  option: {
    minHeight: 52,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  optionCopy: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {
    fontFamily: font('medium'),
    fontSize: 14,
  },
  badgeText: {
    fontFamily: font('medium'),
    fontSize: 11,
  },
});
