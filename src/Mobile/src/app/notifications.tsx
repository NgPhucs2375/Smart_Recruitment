import { Redirect, router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCheck, Inbox, RefreshCw, X } from 'lucide-react-native';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { font, Radius, Shadows } from '@/constants/theme';
import { NotificationRow } from '@/features/notifications/components/notification-row';
import { useNotifications } from '@/features/notifications/hooks/use-notifications';
import { useNotificationCenter } from '@/features/notifications/notification-provider';
import {
  groupNotificationsByDate,
  NOTIFICATION_TYPE_OPTIONS,
  splitNotificationMessage,
} from '@/features/notifications/notifications-format';
import { notificationTarget } from '@/features/notifications/notification-target';
import type { NotificationItem } from '@/features/notifications/types';
import { useTheme } from '@/hooks/use-theme';

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

export default function NotificationsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { unreadCount } = useNotificationCenter();
  const {
    audience,
    unreadOnly,
    setUnreadOnly,
    typeFilter,
    setTypeFilter,
    items,
    totalCount,
    hasMore,
    status,
    error,
    loadMoreError,
    refresh,
    loadMore,
    retry,
    markRead,
    markAllRead,
    remove,
  } = useNotifications();

  const [actionError, setActionError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const sections = useMemo(() => groupNotificationsByDate(items), [items]);
  const loading = status === 'loading';

  if (!audience) {
    return <Redirect href="/" />;
  }

  const activeType = NOTIFICATION_TYPE_OPTIONS.find(
    (option) => option.value === typeFilter,
  );

  const handleOpen = (item: NotificationItem) => {
    setActionError(null);
    if (!item.isRead) {
      void markRead(item.id).catch((reason: unknown) => {
        setActionError(
          errorMessage(reason, 'Không thể đánh dấu thông báo đã đọc.'),
        );
      });
    }

    const target = notificationTarget(item, audience);
    if (target) router.push(target as Href);
  };

  const handleMarkAll = async () => {
    if (markingAll || unreadCount <= 0) return;
    setMarkingAll(true);
    setActionError(null);
    try {
      await markAllRead();
    } catch (reason: unknown) {
      setActionError(
        errorMessage(reason, 'Không thể đánh dấu tất cả là đã đọc.'),
      );
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async () => {
    const target = deleteTarget;
    if (!target || deletingId !== null) return;

    setDeletingId(target.id);
    setActionError(null);
    try {
      await remove(target.id);
    } catch (reason: unknown) {
      setActionError(errorMessage(reason, 'Không thể xoá thông báo.'));
    } finally {
      setDeleteTarget(null);
      setDeletingId(null);
    }
  };

  const listHeader = (
    <View style={styles.header}>
      {actionError ? (
        <View style={[styles.errorBanner, { borderColor: `${theme.destructive}55` }]}>
          <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
            {actionError}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo lỗi"
            hitSlop={8}
            onPress={() => setActionError(null)}>
            <X size={15} color={theme.destructive} />
          </Pressable>
        </View>
      ) : null}

      {error && items.length > 0 ? (
        <View style={[styles.errorBanner, { borderColor: `${theme.destructive}55` }]}>
          <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
            {error}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tải lại danh sách thông báo"
            hitSlop={8}
            onPress={refresh}>
            <RefreshCw size={15} color={theme.destructive} />
          </Pressable>
        </View>
      ) : null}

      <ThemedText style={[styles.intro, { color: theme.textSecondary }]}>
        Cập nhật đơn ứng tuyển, lịch phỏng vấn và gợi ý việc làm phù hợp với bạn.
      </ThemedText>

      <View style={styles.controls}>
        <View
          style={[
            styles.segment,
            { backgroundColor: theme.muted, borderColor: theme.border },
          ]}>
          <SegmentButton
            label="Tất cả"
            active={!unreadOnly}
            onPress={() => setUnreadOnly(false)}
          />
          <SegmentButton
            label="Chưa đọc"
            active={unreadOnly}
            count={unreadCount}
            onPress={() => setUnreadOnly(true)}
          />
        </View>

        {unreadCount > 0 ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đánh dấu tất cả là đã đọc"
            disabled={markingAll}
            onPress={() => void handleMarkAll()}
            hitSlop={6}
            style={({ pressed }) => [
              styles.markAll,
              {
                backgroundColor: theme.backgroundSelected,
                opacity: markingAll ? 0.6 : pressed ? 0.75 : 1,
              },
            ]}>
            {markingAll ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <CheckCheck size={14} color={theme.primary} />
            )}
            <ThemedText style={[styles.markAllText, { color: theme.primary }]}>
              Đọc tất cả
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}>
        {NOTIFICATION_TYPE_OPTIONS.map((option) => {
          const active = typeFilter === option.value;
          return (
            <Pressable
              key={option.value === null ? 'all' : String(option.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => setTypeFilter(option.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: active ? theme.primary : theme.backgroundElement,
                  borderColor: active ? theme.primary : theme.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <ThemedText
                style={[
                  styles.chipText,
                  { color: active ? theme.primaryForeground : theme.textSecondary },
                ]}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.countRow}>
        <ThemedText style={[styles.countText, { color: theme.textSecondary }]}>
          {loading ? 'Đang tải thông báo...' : `${totalCount} thông báo`}
        </ThemedText>
        {typeFilter !== null && activeType ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Bỏ lọc loại thông báo"
            hitSlop={8}
            onPress={() => setTypeFilter(null)}>
            <ThemedText style={[styles.clearFilter, { color: theme.primary }]}>
              Bỏ lọc
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StackHeader title="Thông báo" />

      <SectionList
        sections={sections}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <NotificationRow
            item={item}
            navigable={notificationTarget(item, audience) !== null}
            deleting={deletingId === item.id}
            onPress={() => handleOpen(item)}
            onDelete={() => {
              setActionError(null);
              setDeleteTarget(item);
            }}
          />
        )}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </ThemedText>
            <View style={[styles.sectionLine, { backgroundColor: theme.border }]} />
          </View>
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {loading ? (
              <NotificationSkeleton />
            ) : status === 'error' ? (
              <EmptyState
                icon={<RefreshCw size={24} color={theme.destructive} />}
                iconBackground={`${theme.destructive}14`}
                title="Chưa tải được thông báo"
                message={error ?? 'Vui lòng kiểm tra kết nối và thử lại.'}
                actionLabel="Thử lại"
                onAction={() => void retry()}
              />
            ) : unreadOnly ? (
              <EmptyState
                title="Không có thông báo chưa đọc"
                message="Bạn đã xem hết thông báo. Chuyển sang tab Tất cả để xem lại."
                actionLabel="Xem tất cả"
                onAction={() => setUnreadOnly(false)}
              />
            ) : typeFilter !== null ? (
              <EmptyState
                title="Không có thông báo loại này"
                message="Thử chọn loại thông báo khác hoặc bỏ bộ lọc."
                actionLabel="Bỏ lọc"
                onAction={() => setTypeFilter(null)}
              />
            ) : (
              <EmptyState
                title="Chưa có thông báo"
                message="Các cập nhật về đơn ứng tuyển, lịch phỏng vấn và gợi ý việc làm sẽ xuất hiện tại đây."
                actionLabel="Tải lại"
                onAction={refresh}
              />
            )}
          </View>
        }
        ListFooterComponent={
          <View style={styles.footer}>
            {status === 'loadingMore' ? (
              <ActivityIndicator color={theme.primary} />
            ) : loadMoreError ? (
              <Pressable
                accessibilityRole="button"
                onPress={loadMore}
                style={[styles.loadMoreError, { backgroundColor: `${theme.destructive}12` }]}>
                <ThemedText style={[styles.loadMoreText, { color: theme.destructive }]}>
                  {loadMoreError} Thử lại
                </ThemedText>
              </Pressable>
            ) : !hasMore && items.length > 0 ? (
              <ThemedText style={[styles.endText, { color: theme.textSecondary }]}>
                Đã hiển thị tất cả thông báo
              </ThemedText>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          sections.length === 0 && styles.listContentEmpty,
        ]}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={status === 'refreshing'}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.backgroundElement}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
      />

      <ConfirmDialog
        visible={deleteTarget !== null}
        title="Xoá thông báo?"
        message={
          deleteTarget
            ? `Bạn có chắc muốn xoá thông báo "${splitNotificationMessage(deleteTarget.message).title}"?`
            : ''
        }
        confirmLabel="Xoá"
        cancelLabel="Giữ lại"
        destructive
        busy={deletingId !== null}
        onConfirm={() => void handleDelete()}
        onCancel={() => {
          if (deletingId === null) setDeleteTarget(null);
        }}
      />
    </View>
  );
}

type SegmentButtonProps = {
  label: string;
  active: boolean;
  count?: number;
  onPress: () => void;
};

function SegmentButton({ label, active, count = 0, onPress }: SegmentButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.segmentButton,
        active && [
          styles.segmentButtonActive,
          { backgroundColor: theme.backgroundElement },
          Shadows.filter,
        ],
      ]}>
      <ThemedText
        style={[
          styles.segmentText,
          { color: active ? theme.text : theme.textSecondary },
          active && styles.segmentTextActive,
        ]}>
        {label}
      </ThemedText>
      {count > 0 ? (
        <View
          style={[
            styles.segmentCount,
            { backgroundColor: active ? theme.primary : theme.backgroundSelected },
          ]}>
          <Text
            style={[
              styles.segmentCountText,
              { color: active ? theme.primaryForeground : theme.textSecondary },
            ]}>
            {count > 99 ? '99+' : count}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

type EmptyStateProps = {
  icon?: React.ReactNode;
  iconBackground?: string;
  title: string;
  message: string;
  actionLabel: string;
  onAction: () => void;
};

function EmptyState({
  icon,
  iconBackground,
  title,
  message,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.emptyCard,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View
        style={[
          styles.emptyIcon,
          { backgroundColor: iconBackground ?? `${theme.primary}14` },
        ]}>
        {icon ?? <Inbox size={24} color={theme.primary} />}
      </View>
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
        {title}
      </ThemedText>
      <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
        {message}
      </ThemedText>
      <Button variant="outline" size="sm" pill onPress={onAction} style={styles.emptyAction}>
        {actionLabel}
      </Button>
    </View>
  );
}

function NotificationSkeleton() {
  const theme = useTheme();

  return (
    <View style={styles.skeletonList}>
      {Array.from({ length: 3 }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.skeletonCard,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <View style={[styles.skeletonIcon, { backgroundColor: theme.muted }]} />
          <View style={styles.skeletonBody}>
            <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '78%' }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '94%' }]} />
            <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '44%' }]} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  header: {
    gap: 12,
    marginBottom: 4,
  },
  intro: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 19,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: Radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  segmentButtonActive: {},
  segmentText: {
    fontFamily: font('medium'),
    fontSize: 13,
  },
  segmentTextActive: {
    fontFamily: font('semibold'),
  },
  segmentCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentCountText: {
    fontFamily: font('bold'),
    fontSize: 10,
  },
  markAll: {
    minHeight: 40,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  markAllText: {
    fontFamily: font('semibold'),
    fontSize: 11,
  },
  chips: {
    gap: 8,
    paddingRight: 8,
  },
  chip: {
    minHeight: 34,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: font('medium'),
    fontSize: 12,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -2,
  },
  countText: {
    fontFamily: font('regular'),
    fontSize: 12,
  },
  clearFilter: {
    fontFamily: font('semibold'),
    fontSize: 12,
  },
  errorBanner: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 12,
    lineHeight: 17,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 18,
    paddingBottom: 9,
  },
  sectionTitle: {
    fontFamily: font('semibold'),
    fontSize: 13,
  },
  sectionLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  separator: {
    height: 10,
  },
  footer: {
    paddingTop: 18,
    paddingBottom: 4,
    minHeight: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreError: {
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  loadMoreText: {
    fontFamily: font('medium'),
    fontSize: 12,
  },
  endText: {
    fontFamily: font('regular'),
    fontSize: 12,
  },
  emptyWrap: {
    flex: 1,
    paddingTop: 10,
  },
  emptyCard: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 34,
    alignItems: 'center',
    gap: 9,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: font('semibold'),
    fontSize: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyAction: {
    marginTop: 8,
  },
  skeletonList: {
    gap: 10,
  },
  skeletonCard: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 15,
    flexDirection: 'row',
    gap: 12,
    ...Shadows.filter,
  },
  skeletonIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.xl,
  },
  skeletonBody: {
    flex: 1,
    gap: 9,
    paddingTop: 2,
  },
  skeletonLine: {
    height: 11,
    borderRadius: Radius.pill,
  },
});
