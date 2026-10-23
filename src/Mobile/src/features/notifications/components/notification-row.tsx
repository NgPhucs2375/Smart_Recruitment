import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  CalendarDays,
  ChevronRight,
  Info,
  Trash2,
  TrendingUp,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Palette, Radius, Shadows } from '@/constants/theme';
import { notificationTypeLabel, splitNotificationMessage, formatNotificationTime } from '@/features/notifications/notifications-format';
import type { NotificationItem, NotificationType } from '@/features/notifications/types';
import { useTheme } from '@/hooks/use-theme';

type TypeMeta = {
  icon: typeof Info;
  color: string;
  background: string;
};

const TYPE_META: Record<NotificationType, TypeMeta> = {
  0: {
    icon: Info,
    color: Palette.marine,
    background: `${Palette.mist}22`,
  },
  1: {
    icon: CalendarDays,
    color: Palette.bronze,
    background: `${Palette.sand}33`,
  },
  3: {
    icon: TrendingUp,
    color: Palette.sage,
    background: `${Palette.sage}1F`,
  },
};

type NotificationRowProps = {
  item: NotificationItem;
  navigable: boolean;
  deleting: boolean;
  onPress: () => void;
  onDelete: () => void;
};

export const NotificationRow = memo(function NotificationRow({
  item,
  navigable,
  deleting,
  onPress,
  onDelete,
}: NotificationRowProps) {
  const theme = useTheme();
  const meta = TYPE_META[item.type] ?? TYPE_META[0];
  const Icon = meta.icon;
  const { title, body } = splitNotificationMessage(item.message);
  const time = formatNotificationTime(item.createdAtValue);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.isRead ? '' : 'Chưa đọc. '}${item.message}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        Shadows.filter,
        {
          backgroundColor: item.isRead
            ? theme.backgroundElement
            : theme.backgroundSelected,
          borderColor: item.isRead ? theme.border : `${theme.primary}45`,
          opacity: pressed ? 0.96 : 1,
        },
      ]}>
      <View style={[styles.iconBox, { backgroundColor: meta.background }]}>
        <Icon size={19} color={meta.color} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <ThemedText
            numberOfLines={2}
            style={[
              styles.title,
              { color: theme.text },
              !item.isRead && styles.titleUnread,
            ]}>
            {title || 'Thông báo'}
          </ThemedText>
          {!item.isRead ? (
            <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
          ) : null}
        </View>

        {body ? (
          <ThemedText
            numberOfLines={3}
            style={[styles.message, { color: theme.textSecondary }]}>
            {body}
          </ThemedText>
        ) : null}

        <View style={styles.metaRow}>
          <Badge backgroundColor={meta.background} color={meta.color} textStyle={styles.typeBadge}>
            {notificationTypeLabel(item.type)}
          </Badge>
          {time ? (
            <ThemedText style={[styles.time, { color: theme.textSecondary }]}>
              {time}
            </ThemedText>
          ) : null}
          {navigable ? <ChevronRight size={14} color={theme.textSecondary} style={styles.arrow} /> : null}
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Xoá thông báo"
        accessibilityState={{ disabled: deleting }}
        disabled={deleting}
        hitSlop={8}
        onPress={(event) => {
          event.stopPropagation();
          onDelete();
        }}
        style={({ pressed }) => [
          styles.deleteButton,
          {
            backgroundColor: pressed ? `${theme.destructive}12` : 'transparent',
            opacity: deleting ? 0.4 : 1,
          },
        ]}>
        <Trash2 size={16} color={theme.textSecondary} />
      </Pressable>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 14,
    lineHeight: 20,
  },
  titleUnread: {
    fontFamily: font('semibold'),
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  message: {
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 1,
  },
  typeBadge: {
    fontFamily: font('semibold'),
    fontSize: 10,
    lineHeight: 14,
  },
  time: {
    fontFamily: font('regular'),
    fontSize: 11,
  },
  arrow: {
    marginLeft: 'auto',
  },
  deleteButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
