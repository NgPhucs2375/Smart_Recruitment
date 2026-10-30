import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, SectionList, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { CheckCheck, Inbox } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { font, Radius } from '@/constants/theme';
import { NotificationRow } from '@/features/notifications/components/notification-row';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { useNotificationCenter } from '@/features/notifications/notification-provider';
import { groupNotificationsByDate } from '@/features/notifications/notifications-format';
import { notificationTarget } from '@/features/notifications/notification-target';
import type { NotificationItem } from '@/features/notifications/types';
import { useTheme } from '@/hooks/use-theme';

export default function HRNotificationsScreen() {
  const theme = useTheme();
  const { unreadCount } = useNotificationCenter();
  const {
    audience,
    items,
    hasMore,
    status,
    error,
    loadMoreError,
    refresh,
    loadMore,
    markRead,
    markAllRead,
  } = useNotifications();

  const [actionError, setActionError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const sections = useMemo(() => groupNotificationsByDate(items), [items]);
  const loading = status === 'loading';

  const handlePress = (item: NotificationItem) => {
    setActionError(null);
    if (!item.isRead) {
      void markRead(item.id).catch((reason: unknown) => {
        setActionError(
          reason instanceof Error ? reason.message : 'Không thể đánh dấu đã đọc.',
        );
      });
    }
    const target = notificationTarget(item, audience);
    if (target) router.push(target as never);
  };

  const handleMarkAll = async () => {
    if (markingAll || unreadCount <= 0) return;
    setMarkingAll(true);
    setActionError(null);
    try {
      await markAllRead();
    } catch (reason: unknown) {
      setActionError(
        reason instanceof Error ? reason.message : 'Không thể đánh dấu tất cả.',
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const subtitle =
    unreadCount > 0
      ? `Bạn có ${unreadCount} thông báo chưa đọc.`
      : 'Bạn đã xem hết thông báo.';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />

      <View style={styles.headerRow}>
        <View style={styles.headerTexts}>
          <ThemedText style={styles.title}>Thông báo</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            {subtitle}
          </ThemedText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đánh dấu tất cả đã đọc"
          disabled={unreadCount <= 0 || markingAll}
          onPress={() => void handleMarkAll()}
          style={({ pressed }) => [
            styles.markAll,
            {
              borderColor: theme.border,
              backgroundColor: theme.backgroundElement,
              opacity: pressed ? 0.75 : unreadCount > 0 ? 1 : 0.4,
            },
          ]}>
          {markingAll ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <>
              <CheckCheck size={14} color={theme.primary} />
              <ThemedText style={[styles.markAllText, { color: theme.primary }]}>
                Đã đọc hết
              </ThemedText>
            </>
          )}
        </Pressable>
      </View>

      {actionError ? (
        <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
          {actionError}
        </ThemedText>
      ) : null}
      {error && items.length > 0 ? (
        <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
          {error}
        </ThemedText>
      ) : null}

      {loading ? (
        <View style={styles.centerState}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : status === 'error' && items.length === 0 ? (
        <View style={styles.centerState}>
          <Inbox size={32} color={theme.textSecondary} />
          <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
            Không tải được thông báo
          </ThemedText>
          <ThemedText style={[styles.stateBody, { color: theme.textSecondary }]}>
            {error ?? 'Vui lòng thử lại sau.'}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={() => void refresh()}
            style={({ pressed }) => [
              styles.retryButton,
              { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 },
            ]}>
            <ThemedText style={[styles.retryText, { color: theme.primaryForeground }]}>
              Thử lại
            </ThemedText>
          </Pressable>
        </View>
      ) : items.length === 0 ? (
        <View style={styles.centerState}>
          <Inbox size={32} color={theme.textSecondary} />
          <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
            Không có thông báo
          </ThemedText>
          <ThemedText style={[styles.stateBody, { color: theme.textSecondary }]}>
            Khi có ứng viên mới hoặc tin được duyệt, bạn sẽ thấy tại đây.
          </ThemedText>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={status === 'refreshing'}
              onRefresh={refresh}
              tintColor={theme.primary}
            />
          }
          onEndReachedThreshold={0.4}
          onEndReached={() => {
            if (hasMore && status === 'ready') loadMore();
          }}
          ListFooterComponent={
            status === 'loadingMore' ? (
              <ActivityIndicator style={styles.footerLoader} color={theme.primary} />
            ) : loadMoreError ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void refresh()}
                style={styles.footerLoader}>
                <ThemedText style={{ color: theme.destructive }}>
                  {loadMoreError} — chạm để thử lại
                </ThemedText>
              </Pressable>
            ) : undefined
          }
          renderSectionHeader={({ section }) => (
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {section.title}
            </ThemedText>
          )}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              navigable={notificationTarget(item, audience) !== null}
              deleting={false}
              onPress={() => handlePress(item)}
              onDelete={() => undefined}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTexts: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  subtitle: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19 },
  markAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  markAllText: { fontFamily: font('semibold'), fontSize: 12 },
  errorText: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    fontFamily: font('regular'),
    fontSize: 12,
  },
  list: { paddingHorizontal: 16, paddingBottom: 32, gap: 8 },
  sectionTitle: {
    fontFamily: font('semibold'),
    fontSize: 11,
    letterSpacing: 1.4,
    marginTop: 12,
    marginBottom: 2,
  },
  centerState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 32,
  },
  stateTitle: { fontFamily: font('semibold'), fontSize: 16, textAlign: 'center' },
  stateBody: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, textAlign: 'center' },
  retryButton: {
    marginTop: 8,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  retryText: { fontFamily: font('semibold'), fontSize: 13 },
  footerLoader: { paddingVertical: 14, alignItems: 'center' },
});
