import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Radius } from '@/constants/theme';
import { applicationsApi } from '@/features/applications/api/applications-api';
import type { ApplicationSummary } from '@/features/applications/types';
import { ApplicationRow, ListSurface } from '@/features/profile/components/profile-sections';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 10;

// Trạng thái cho phép rút đơn — đúng canRutDon của Web (0, 2, 3, 5).
const canWithdraw = (status: number) => status === 0 || status === 2 || status === 3 || status === 5;

const STATUS_FILTERS: { value: string; label: string; code?: number }[] = [
  { value: 'all', label: 'Tất cả' },
  { value: '2', label: 'Chờ xử lý', code: 2 },
  { value: '3', label: 'Đã xem', code: 3 },
  { value: '5', label: 'Phù hợp', code: 5 },
  { value: '6', label: 'Từ chối', code: 6 },
  { value: '4', label: 'Đã rút', code: 4 },
];

export default function ApplicationsScreen() {
  const theme = useTheme();

  const [items, setItems] = useState<ApplicationSummary[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [source, setSource] = useState<'api' | 'demo'>('api');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const selectedCode = STATUS_FILTERS.find((option) => option.value === filter)?.code;

  const fetchPage = useCallback(
    async (targetPage: number) => {
      return applicationsApi.listPage({
        page: targetPage,
        pageSize: PAGE_SIZE,
        statusCode: selectedCode,
      });
    },
    [selectedCode],
  );

  const reload = useCallback(
    async (targetPage = 1) => {
      try {
        const result = await fetchPage(targetPage);
        if (!mountedRef.current) return;
        setItems((prev) => (targetPage === 1 ? result.items : [...prev, ...result.items]));
        setTotalCount(result.totalCount);
        setSource(result.source);
        setPage(targetPage);
        setError('');
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách đơn ứng tuyển.');
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

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    void reload(1);
  }, [reload]);

  const handleRefresh = () => {
    setRefreshing(true);
    void reload(1);
  };

  const handleWithdraw = (item: ApplicationSummary) => {
    Alert.alert(
      `Rút đơn #${item.id}?`,
      'Bạn sẽ không xét lại được đơn này.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Rút đơn',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setWithdrawingId(item.id);
              try {
                await applicationsApi.withdraw(item.id);
                await reload(1);
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Không thể rút đơn.');
              } finally {
                setWithdrawingId(null);
              }
            })();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const hasMore = items.length < totalCount;

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
          <ThemedText style={styles.title}>Đã ứng tuyển</ThemedText>
          {totalCount > 0 ? (
            <Badge variant="secondary">{`${totalCount} đơn`}</Badge>
          ) : null}
        </View>

        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((option) => {
            const active = filter === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="button"
                onPress={() => setFilter(option.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: active ? theme.primary : theme.muted,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}>
                <ThemedText
                  style={[
                    styles.filterChipText,
                    { color: active ? theme.primaryForeground : theme.textSecondary },
                  ]}
                  numberOfLines={1}>
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

        {!loading && items.length === 0 && !error ? (
          <View style={styles.emptyBox}>
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              Chưa có đơn ứng tuyển
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Khi bạn nộp CV cho một tin tuyển dụng, trạng thái xử lý sẽ xuất hiện tại đây.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace('/')}
              style={[styles.emptyAction, { borderColor: theme.border }]}>
              <ThemedText style={[styles.emptyActionText, { color: theme.primary }]}>
                Tìm việc làm
              </ThemedText>
            </Pressable>
          </View>
        ) : null}

        {items.length > 0 ? (
          <ListSurface>
            {items.map((item, index) => (
              <View key={item.id}>
                {index > 0 ? (
                  <View style={[styles.separator, { backgroundColor: theme.border }]} />
                ) : null}
                <View style={styles.itemWrap}>
                  <ApplicationRow application={item} first={index === 0} />
                  {item.ketLuan ? (
                    <ThemedText style={[styles.ketLuan, { color: theme.textSecondary }]}>
                      Kết luận: {item.ketLuan}
                    </ThemedText>
                  ) : null}
                  <View style={styles.itemActions}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push(`/jobs/${item.jobId}`)}
                      style={({ pressed }) => [
                        styles.actionPill,
                        { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                      ]}>
                      <ThemedText style={[styles.actionPillText, { color: theme.text }]}>
                        Xem tin
                      </ThemedText>
                    </Pressable>
                    {canWithdraw(item.statusCode) ? (
                      <Pressable
                        accessibilityRole="button"
                        disabled={withdrawingId === item.id}
                        onPress={() => handleWithdraw(item)}
                        style={({ pressed }) => [
                          styles.actionPill,
                          {
                            borderColor: `${theme.destructive}66`,
                            backgroundColor: `${theme.destructive}0D`,
                            opacity: withdrawingId === item.id ? 0.5 : pressed ? 0.7 : 1,
                          },
                        ]}>
                        {withdrawingId === item.id ? (
                          <ActivityIndicator size="small" color={theme.destructive} />
                        ) : (
                          <ThemedText style={[styles.actionPillText, { color: theme.destructive }]}>
                            Rút đơn
                          </ThemedText>
                        )}
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              </View>
            ))}
          </ListSurface>
        ) : null}

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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  filterRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  filterChip: {
    minHeight: 30,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  filterChipText: { fontFamily: font('medium'), fontSize: 12 },
  demoRow: { alignItems: 'flex-start' },
  error: { fontFamily: font('medium'), fontSize: 13, lineHeight: 20 },
  loadingBox: { paddingVertical: 48, alignItems: 'center' },
  emptyBox: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyTitle: { fontFamily: font('semibold'), fontSize: 16 },
  emptyText: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  emptyAction: {
    minHeight: 36,
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    marginTop: 8,
  },
  emptyActionText: { fontFamily: font('semibold'), fontSize: 13 },
  separator: { height: StyleSheet.hairlineWidth, marginLeft: 14 },
  itemWrap: { padding: 14, gap: 8 },
  ketLuan: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17 },
  itemActions: { flexDirection: 'row', gap: 8 },
  actionPill: {
    minHeight: 32,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  actionPillText: { fontFamily: font('semibold'), fontSize: 12 },
  loadMore: {
    minHeight: 40,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadMoreText: { fontFamily: font('semibold'), fontSize: 13 },
});
