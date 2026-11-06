import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  ListFilter,
  RefreshCw,
  X,
} from 'lucide-react-native';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { font, Palette, Radius, Shadows } from '@/constants/theme';
import { applicationsApi } from '@/features/applications/api/applications-api';
import { ApplicationCard } from '@/features/applications/components/application-card';
import { ApplicationStatusSheet } from '@/features/applications/components/application-status-sheet';
import { APPLICATION_STATUSES } from '@/features/applications/constants';
import { useApplications } from '@/features/applications/hooks/use-applications';
import type { ApplicationSummary } from '@/features/applications/types';
import { useTheme } from '@/hooks/use-theme';

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

export default function ApplicationsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<ApplicationSummary>>(null);
  const {
    statusFilter,
    setStatusFilter,
    items,
    totalCount,
    hasMore,
    status,
    error,
    loadMoreError,
    refresh,
    loadMore,
    retry,
    markWithdrawn,
  } = useApplications();

  const [filterOpen, setFilterOpen] = useState(false);
  const [withdrawTarget, setWithdrawTarget] = useState<ApplicationSummary | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const activeStatus =
    statusFilter === null
      ? null
      : APPLICATION_STATUSES.find((item) => item.code === statusFilter) ?? null;
  const filterLabel = activeStatus?.label ?? 'Tất cả trạng thái';
  const loading = status === 'loading';

  const handleSelectStatus = (statusCode: number | null) => {
    setStatusFilter(statusCode);
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  };

  const handleWithdraw = () => {
    const target = withdrawTarget;
    if (!target || withdrawingId) return;

    setWithdrawingId(target.id);
    setWithdrawError(null);
    applicationsApi
      .withdraw(target.id)
      .then((result) => {
        markWithdrawn(target.id);
        setNotice(result.message);
        setWithdrawTarget(null);
        refresh();
      })
      .catch((reason: unknown) => {
        setWithdrawError(errorMessage(reason, 'Không thể rút đơn ứng tuyển.'));
        setWithdrawTarget(null);
      })
      .finally(() => setWithdrawingId(null));
  };

  const listHeader = (
    <View style={styles.headerContent}>
      {notice ? (
        <View style={[styles.notice, { backgroundColor: `${Palette.sage}1F` }]}>
          <CheckCircle2 size={16} color={Palette.sage} />
          <ThemedText style={[styles.noticeText, { color: theme.text }]}>{notice}</ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng thông báo"
            hitSlop={8}
            onPress={() => setNotice(null)}>
            <X size={15} color={theme.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      {withdrawError ? (
        <View style={[styles.errorBanner, { borderColor: `${theme.destructive}55` }]}>
          <ThemedText style={[styles.errorBannerText, { color: theme.destructive }]}>
            {withdrawError}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Đóng lỗi"
            hitSlop={8}
            onPress={() => setWithdrawError(null)}>
            <X size={15} color={theme.destructive} />
          </Pressable>
        </View>
      ) : null}

      {error && items.length > 0 ? (
        <View style={[styles.errorBanner, { borderColor: `${theme.destructive}55` }]}>
          <ThemedText style={[styles.errorBannerText, { color: theme.destructive }]}>
            {error}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tải lại danh sách"
            hitSlop={8}
            onPress={refresh}>
            <RefreshCw size={15} color={theme.destructive} />
          </Pressable>
        </View>
      ) : null}

      <ThemedText style={[styles.intro, { color: theme.textSecondary }]}>
        Theo dõi trạng thái hồ sơ, xem lại tin đã nộp và chủ động rút đơn khi cần.
      </ThemedText>

      <View style={styles.filterRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Lọc trạng thái: ${filterLabel}`}
          onPress={() => setFilterOpen(true)}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: activeStatus ? theme.primary : theme.border,
              opacity: pressed ? 0.7 : 1,
            },
          ]}>
          <ListFilter size={15} color={activeStatus ? theme.primary : theme.textSecondary} />
          <ThemedText
            numberOfLines={1}
            style={[
              styles.filterText,
              { color: activeStatus ? theme.primary : theme.text },
            ]}>
            {filterLabel}
          </ThemedText>
          <ChevronDown size={15} color={theme.textSecondary} />
        </Pressable>

        <View style={[styles.countPill, { backgroundColor: theme.backgroundSelected }]}>
          {loading || status === 'refreshing' ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <ThemedText style={[styles.countText, { color: theme.primary }]}>
              {totalCount} đơn
            </ThemedText>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StackHeader title="Việc đã ứng tuyển" />

      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ApplicationCard
            application={item}
            withdrawing={withdrawingId === item.id}
            onView={() => router.push(`/jobs/${item.jobId}`)}
            onWithdraw={() => {
              setWithdrawError(null);
              setWithdrawTarget(item);
            }}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            {loading ? (
              <ApplicationSkeleton />
            ) : status === 'error' ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: `${theme.destructive}14` }]}>
                  <BriefcaseBusiness size={24} color={theme.destructive} />
                </View>
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                  Không tải được đơn ứng tuyển
                </ThemedText>
                <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
                  {error ?? 'Vui lòng kiểm tra kết nối và thử lại.'}
                </ThemedText>
                <Button variant="outline" size="sm" pill onPress={retry} style={styles.emptyAction}>
                  Thử lại
                </Button>
              </View>
            ) : activeStatus ? (
              <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}14` }]}>
                  <ListFilter size={24} color={theme.primary} />
                </View>
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                  Không có đơn ở trạng thái này
                </ThemedText>
                <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
                  Thử chọn trạng thái khác hoặc xem toàn bộ đơn ứng tuyển.
                </ThemedText>
                <Button
                  variant="outline"
                  size="sm"
                  pill
                  onPress={() => handleSelectStatus(null)}
                  style={styles.emptyAction}>
                  Bỏ lọc
                </Button>
              </View>
            ) : (
              <View style={[styles.emptyCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
                <View style={[styles.emptyIcon, { backgroundColor: `${theme.primary}14` }]}>
                  <BriefcaseBusiness size={24} color={theme.primary} />
                </View>
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
                  Chưa có đơn ứng tuyển
                </ThemedText>
                <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
                  Khi bạn nộp CV cho một tin tuyển dụng, trạng thái xử lý sẽ xuất hiện tại đây.
                </ThemedText>
                <Button size="sm" pill onPress={() => router.replace('/')} style={styles.emptyAction}>
                  Tìm việc ngay
                </Button>
              </View>
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
                <ThemedText style={[styles.loadMoreErrorText, { color: theme.destructive }]}>
                  {loadMoreError} · Thử lại
                </ThemedText>
              </Pressable>
            ) : !hasMore && items.length > 0 ? (
              <ThemedText style={[styles.endText, { color: theme.textSecondary }]}>
                Đã hiển thị tất cả đơn ứng tuyển
              </ThemedText>
            ) : null}
          </View>
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 20 },
          items.length === 0 && styles.listContentEmpty,
        ]}
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
        keyboardShouldPersistTaps="handled"
      />

      <ApplicationStatusSheet
        visible={filterOpen}
        selected={statusFilter}
        onSelect={handleSelectStatus}
        onClose={() => setFilterOpen(false)}
      />

      <ConfirmDialog
        visible={withdrawTarget !== null}
        title="Rút đơn ứng tuyển?"
        message={
          withdrawTarget
            ? `Bạn có chắc muốn rút đơn cho "${withdrawTarget.jobTitle}"? Bạn sẽ không thể tác động lại đơn này.`
            : ''
        }
        confirmLabel="Rút đơn"
        cancelLabel="Giữ lại"
        destructive
        busy={withdrawingId !== null}
        onConfirm={handleWithdraw}
        onCancel={() => {
          if (!withdrawingId) setWithdrawTarget(null);
        }}
      />
    </View>
  );
}

function ApplicationSkeleton() {
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
          <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '30%' }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '78%', height: 16 }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '52%' }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '66%' }]} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  listContentEmpty: {
    flexGrow: 1,
  },
  headerContent: {
    gap: 12,
    marginBottom: 16,
  },
  intro: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 19,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  filterButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterText: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 13,
  },
  countPill: {
    minHeight: 44,
    minWidth: 72,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontFamily: font('bold'),
    fontSize: 12,
  },
  notice: {
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 12,
    lineHeight: 17,
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
  errorBannerText: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 12,
    lineHeight: 17,
  },
  separator: {
    height: 12,
  },
  emptyWrap: {
    flex: 1,
    paddingTop: 8,
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
  loadMoreErrorText: {
    fontFamily: font('medium'),
    fontSize: 12,
  },
  endText: {
    fontFamily: font('regular'),
    fontSize: 12,
  },
  skeletonList: {
    gap: 12,
  },
  skeletonCard: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 16,
    gap: 10,
    ...Shadows.filter,
  },
  skeletonLine: {
    height: 12,
    borderRadius: Radius.pill,
  },
});
