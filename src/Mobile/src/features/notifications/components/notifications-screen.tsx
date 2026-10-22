import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Bell, CalendarDays, CheckCheck, FileText, Trash2 } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Palette, Radius } from '@/constants/theme';
import { notificationsApi } from '@/features/notifications/api/notifications-api';
import type { NotificationItem, NotificationsResult } from '@/features/notifications/types';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 15;
const POLL_INTERVAL = 30_000;

type Tab = 'all' | 'unread';
type TypeFilter = 'all' | 0 | 1 | 3;

const TYPE_META: Record<number, { label: string; colorKey: 'primary' | 'sage' | 'textSecondary' }> = {
  0: { label: 'Chung', colorKey: 'textSecondary' },
  1: { label: 'Lịch phỏng vấn', colorKey: 'sage' },
  3: { label: 'Đơn ứng tuyển', colorKey: 'primary' },
};

const SECTION_LABELS: Record<NotificationItem['section'], string> = {
  today: 'Hôm nay',
  yesterday: 'Hôm qua',
  older: 'Cũ hơn',
};

type NotificationsScreenProps = {
  /** Deep-link khác nhau theo portal. */
  onOpenJob?: (jobId: number) => void;
};

export function NotificationsScreen({ onOpenJob }: NotificationsScreenProps) {
  const theme = useTheme();

  const [tab, setTab] = useState<Tab>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState<'api' | 'demo'>('api');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);

  const fetchPage = useCallback(
    async (targetPage: number): Promise<NotificationsResult> => {
      return notificationsApi.list({
        unreadOnly: tab === 'unread',
        pageNumber: targetPage,
        pageSize: PAGE_SIZE,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
    },
    [tab, typeFilter],
  );

  const reload = useCallback(
    async (targetPage = 1) => {
      try {
        const result = await fetchPage(targetPage);
        if (!mountedRef.current) return;
        setItems((prev) => (targetPage === 1 ? result.items : dedupe([...prev, ...result.items])));
        setUnreadCount(result.unreadCount);
        setTotalCount(result.totalCount);
        setSource(result.source);
        setPage(targetPage);
        setError('');
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Không thể tải thông báo.');
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
          setLoadingMore(false);
        }
      }
    },
    [fetchPage],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Tải lại khi đổi tab/filter.
  useEffect(() => {
    setLoading(true);
    void reload(1);
  }, [reload]);

  // Poll 30s như Web (notification-bell fallback).
  useEffect(() => {
    const timer = setInterval(() => {
      void reload(1);
    }, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [reload]);

  const handleRefresh = () => {
    setRefreshing(true);
    void reload(1);
  };

  const handleMarkRead = async (item: NotificationItem) => {
    if (item.isRead) return;
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isRead: true } : row)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await notificationsApi.markRead(item.id);
    } catch {
      /* Best-effort — hàng đã hiển thị đã đọc. */
    }
    if (item.jobId && onOpenJob) onOpenJob(item.jobId);
  };

  const handleMarkAllRead = async () => {
    setItems((prev) => prev.map((row) => ({ ...row, isRead: true })));
    setUnreadCount(0);
    try {
      await notificationsApi.markAllRead();
    } catch {
      /* Best-effort. */
    }
  };

  const handleRemove = async (item: NotificationItem) => {
    setItems((prev) => prev.filter((row) => row.id !== item.id));
    if (!item.isRead) setUnreadCount((count) => Math.max(0, count - 1));
    try {
      await notificationsApi.remove(item.id);
    } catch {
      /* Best-effort. */
    }
  };

  const hasMore = items.length < totalCount;
  const sections = groupSections(items);

  return (
    <View style={[styles.flex, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.backgroundElement}
          />
        }>
        <View style={styles.titleRow}>
          <ThemedText style={styles.title}>Thông báo</ThemedText>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            disabled={unreadCount === 0}
            onPress={() => void handleMarkAllRead()}
            style={styles.markAllButton}>
            <CheckCheck size={14} color={unreadCount > 0 ? theme.primary : theme.textSecondary} />
            <ThemedText
              style={[
                styles.markAllText,
                { color: unreadCount > 0 ? theme.primary : theme.textSecondary },
              ]}>
              Đọc tất cả
            </ThemedText>
          </Pressable>
        </View>

        <View style={styles.tabsRow}>
          {(['all', 'unread'] as Tab[]).map((value) => {
            const active = tab === value;
            return (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                onPress={() => setTab(value)}
                style={[
                  styles.tabChip,
                  active && { backgroundColor: theme.primary, borderColor: theme.primary },
                ]}>
                <ThemedText
                  style={[
                    styles.tabChipText,
                    { color: active ? theme.primaryForeground : theme.textSecondary },
                  ]}
                  numberOfLines={1}>
                  {value === 'all' ? 'Tất cả' : `Chưa đọc${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.typeRow}>
          {([
            { value: 'all' as TypeFilter, label: 'Tất cả loại' },
            { value: 0 as TypeFilter, label: 'Chung' },
            { value: 1 as TypeFilter, label: 'Lịch phỏng vấn' },
            { value: 3 as TypeFilter, label: 'Đơn ứng tuyển' },
          ]).map((option) => {
            const active = typeFilter === option.value;
            return (
              <Pressable
                key={String(option.value)}
                accessibilityRole="button"
                onPress={() => setTypeFilter(option.value)}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: active ? theme.backgroundSelected : theme.muted,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.typeChipText,
                    { color: active ? theme.primaryHover : theme.textSecondary },
                  ]}>
                  {option.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        {source === 'demo' ? (
          <View style={styles.demoRow}>
            <Badge variant="secondary">DỮ LIỆU MINH HỌA</Badge>
          </View>
        ) : null}

        {error ? (
          <ThemedText style={[styles.error, { color: theme.destructive }]}>{error}</ThemedText>
        ) : null}

        {loading && items.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : null}

        {!loading && items.length === 0 ? (
          <View style={styles.emptyBox}>
            <Bell size={28} color={theme.textSecondary} />
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              {tab === 'unread' ? 'Không còn thông báo chưa đọc.' : 'Chưa có thông báo nào.'}
            </ThemedText>
          </View>
        ) : null}

        {sections.map((section) => (
          <View key={section.key} style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              {SECTION_LABELS[section.key]}
            </ThemedText>
            <View style={[styles.list, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              {section.rows.map((item) => {
                const meta = TYPE_META[item.type] ?? TYPE_META[0];
                const iconColor =
                  meta.colorKey === 'primary'
                    ? theme.primary
                    : meta.colorKey === 'sage'
                      ? Palette.sage
                      : theme.textSecondary;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.row,
                      {
                        borderBottomColor: theme.border,
                        backgroundColor: item.isRead ? theme.backgroundElement : theme.backgroundSelected,
                      },
                    ]}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => void handleMarkRead(item)}
                      style={styles.rowMain}>
                      <View style={[styles.iconWrap, { backgroundColor: `${iconColor}1A` }]}>
                        {item.type === 1 ? (
                          <CalendarDays size={16} color={iconColor} />
                        ) : item.type === 3 ? (
                          <FileText size={16} color={iconColor} />
                        ) : (
                          <Bell size={16} color={iconColor} />
                        )}
                      </View>
                      <View style={styles.rowBody}>
                        <ThemedText style={[styles.rowMessage, { color: theme.text }]}>
                          {item.message}
                        </ThemedText>
                        <View style={styles.rowMeta}>
                          <Badge variant={item.type === 3 ? 'secondary' : 'outline'}>
                            {meta.label}
                          </Badge>
                          <ThemedText style={[styles.rowTime, { color: theme.textSecondary }]}>
                            {item.createdLabel}
                          </ThemedText>
                          {!item.isRead ? <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} /> : null}
                        </View>
                      </View>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Xóa thông báo"
                      hitSlop={8}
                      onPress={() => void handleRemove(item)}
                      style={styles.deleteButton}>
                      <Trash2 size={15} color={theme.textSecondary} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

        {hasMore ? (
          <Pressable
            accessibilityRole="button"
            disabled={loadingMore}
            onPress={() => {
              setLoadingMore(true);
              void reload(page + 1);
            }}
            style={[styles.loadMore, { borderColor: theme.border }]}>
            {loadingMore ? (
              <ActivityIndicator size="small" color={theme.primary} />
            ) : (
              <ThemedText style={[styles.loadMoreText, { color: theme.primary }]}>
                Tải thêm
              </ThemedText>
            )}
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

function dedupe(rows: NotificationItem[]): NotificationItem[] {
  const seen = new Set<number>();
  const result: NotificationItem[] = [];
  for (const row of rows) {
    if (seen.has(row.id)) continue;
    seen.add(row.id);
    result.push(row);
  }
  return result;
}

function groupSections(rows: NotificationItem[]): { key: NotificationItem['section']; rows: NotificationItem[] }[] {
  const order: NotificationItem['section'][] = ['today', 'yesterday', 'older'];
  return order
    .map((key) => ({ key, rows: rows.filter((row) => row.section === key) }))
    .filter((section) => section.rows.length > 0);
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  markAllButton: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 4 },
  markAllText: { fontFamily: font('semibold'), fontSize: 13 },
  tabsRow: { flexDirection: 'row', gap: 8 },
  tabChip: {
    flex: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabChipText: { fontFamily: font('semibold'), fontSize: 13 },
  typeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  typeChip: {
    minHeight: 30,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  typeChipText: { fontFamily: font('medium'), fontSize: 12 },
  demoRow: { alignItems: 'flex-start' },
  error: { fontFamily: font('medium'), fontSize: 13, lineHeight: 20 },
  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  emptyBox: { alignItems: 'center', gap: 10, paddingVertical: 48 },
  emptyText: { fontFamily: font('medium'), fontSize: 14 },
  section: { gap: 6 },
  sectionTitle: {
    fontFamily: font('semibold'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  list: { borderRadius: Radius['2xl'], borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingRight: 8,
  },
  rowMain: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14 },
  iconWrap: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  rowBody: { flex: 1, gap: 6 },
  rowMessage: { fontFamily: font('medium'), fontSize: 13, lineHeight: 19 },
  rowMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowTime: { fontFamily: font('regular'), fontSize: 12 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  deleteButton: { padding: 8 },
  loadMore: {
    minHeight: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loadMoreText: { fontFamily: font('semibold'), fontSize: 13 },
});
