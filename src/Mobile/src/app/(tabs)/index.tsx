import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Briefcase, Search, SlidersHorizontal, X } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Radius, Shadows } from '@/constants/theme';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { ActiveFilterChips } from '@/features/jobs/components/active-filter-chips';
import { JobCard } from '@/features/jobs/components/job-card';
import { JobFiltersSheet } from '@/features/jobs/components/job-filters-sheet';
import { useJobFilterOptions } from '@/features/jobs/hooks/use-job-filter-options';
import { useJobSearch } from '@/features/jobs/hooks/use-job-search';
import {
  countActiveFilters,
  type Job,
  type JobFilterKey,
  type JobFilterOptions,
  type JobFilters,
} from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

type JobsHeaderProps = {
  keyword: string;
  onChangeKeyword: (value: string) => void;
  onSearch: () => void;
  onClearKeyword: () => void;
  onOpenFilters: () => void;
  activeFilterCount: number;
  filters: JobFilters;
  options: JobFilterOptions;
  onRemoveFilter: (key: JobFilterKey, value?: number) => void;
  onClearFilters: () => void;
  totalCount: number;
  loading: boolean;
  error: string | null;
  onRetryRefresh: () => void;
  savedCount: number;
  onOpenSaved: () => void;
};

function JobsHeader({
  keyword,
  onChangeKeyword,
  onSearch,
  onClearKeyword,
  onOpenFilters,
  activeFilterCount,
  filters,
  options,
  onRemoveFilter,
  onClearFilters,
  totalCount,
  loading,
  error,
  onRetryRefresh,
  savedCount,
  onOpenSaved,
}: JobsHeaderProps) {
  const theme = useTheme();

  // Pill bộ lọc theo Web: hiển thị giá trị hiện tại, bấm mở sheet.
  const categoryLabel = filters.categoryId
    ? (options.categories.find((c) => c.id === filters.categoryId)?.name ?? 'Ngành nghề')
    : 'Ngành nghề';

  const pills: { key: string; label: string; active: boolean }[] = [
    { key: 'category', label: categoryLabel, active: filters.categoryId !== undefined },
    { key: 'location', label: filters.location || 'Địa điểm', active: !!filters.location },
    { key: 'level', label: filters.level || 'Cấp bậc', active: !!filters.level },
    { key: 'employment', label: filters.employmentType || 'Hình thức', active: !!filters.employmentType },
    { key: 'workMode', label: filters.workMode || 'Cách thức', active: !!filters.workMode },
    {
      key: 'salary',
      label:
        filters.salaryMin !== undefined || filters.salaryMax !== undefined
          ? 'Mức lương'
          : 'Mức lương',
      active: filters.salaryMin !== undefined || filters.salaryMax !== undefined,
    },
    { key: 'advanced', label: 'Lọc nâng cao', active: false },
  ];

  return (
    <View style={styles.header}>
      {/* Page header — Web: icon box size-11 + Briefcase, h1 "Tìm Việc Làm", pill "Việc đã lưu" */}
      <View style={styles.pageHeader}>
        <View style={styles.pageTitleRow}>
          <View style={[styles.pageIconBox, { backgroundColor: theme.muted }]}>
            <Briefcase size={22} color={theme.primary} />
          </View>
          <PageTitle />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Việc đã lưu"
          onPress={onOpenSaved}
          style={[styles.savedPill, { borderColor: theme.border }]}>
          <ThemedText style={[styles.savedPillText, { color: theme.text }]}>
            {`Việc đã lưu (${savedCount})`}
          </ThemedText>
        </Pressable>
      </View>

      {/* Search + filter card — Web: rounded-[1.75rem] border bg-card p-4 shadow */}
      <View
        style={[
          styles.filterCard,
          { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          Shadows.filter,
        ]}>
        <View style={styles.searchRow}>
          <View
            style={[
              styles.searchBox,
              { backgroundColor: theme.muted, borderColor: theme.border },
            ]}>
            <Search size={16} color={theme.textSecondary} />
            <TextInput
              accessibilityLabel="Tìm việc, kỹ năng hoặc công ty"
              value={keyword}
              onChangeText={onChangeKeyword}
              onSubmitEditing={onSearch}
              placeholder="Tìm việc, kỹ năng hoặc công ty..."
              placeholderTextColor={theme.textSecondary}
              returnKeyType="search"
              style={[styles.searchInput, { color: theme.text }]}
            />
            {keyword ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Xóa từ khóa" hitSlop={8} onPress={onClearKeyword}>
                <X size={16} color={theme.textSecondary} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tìm việc làm"
            onPress={onSearch}
            style={[styles.searchButton, { backgroundColor: theme.primary }]}>
            <Search size={16} color={theme.primaryForeground} />
            <ThemedText style={[styles.searchButtonText, { color: theme.primaryForeground }]}>
              Tìm việc
            </ThemedText>
          </Pressable>
        </View>

        {/* Filter pills — horizontal scroll theo Web */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}>
          {pills.map((pill) => (
            <Pressable
              key={pill.key}
              accessibilityRole="button"
              accessibilityLabel={`Bộ lọc ${pill.label}`}
              onPress={onOpenFilters}
              style={[
                styles.filterPill,
                {
                  backgroundColor: pill.active ? theme.backgroundSelected : theme.muted,
                  borderColor: pill.active ? theme.primary : theme.border,
                },
              ]}>
              {pill.key === 'advanced' ? (
                <SlidersHorizontal size={13} color={pill.active ? theme.primary : theme.textSecondary} />
              ) : null}
              <ThemedText
                numberOfLines={1}
                style={[
                  styles.filterPillText,
                  { color: pill.active ? theme.primary : theme.textSecondary },
                ]}>
                {pill.label}
              </ThemedText>
            </Pressable>
          ))}
          {activeFilterCount > 0 ? (
            <Pressable
              accessibilityRole="button"
              onPress={onClearFilters}
              style={[styles.clearPill, { borderColor: theme.border }]}>
              <ThemedText style={[styles.clearPillText, { color: theme.destructive }]}>
                {`Xóa lọc (${activeFilterCount})`}
              </ThemedText>
            </Pressable>
          ) : null}
        </ScrollView>
      </View>

      {/* Entry chips — shortcut tới Việc phù hợp + Danh bạ công ty (Web: nav section). */}
      <View style={styles.quickRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Việc làm phù hợp"
          onPress={() => router.push('/phu-hop')}
          style={[styles.quickChip, { backgroundColor: theme.muted, borderColor: theme.border }]}>
          <ThemedText style={[styles.quickChipText, { color: theme.text }]}>Việc phù hợp</ThemedText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Khám phá công ty"
          onPress={() => router.push('/companies')}
          style={[styles.quickChip, { backgroundColor: theme.muted, borderColor: theme.border }]}>
          <ThemedText style={[styles.quickChipText, { color: theme.text }]}>Công ty</ThemedText>
        </Pressable>
      </View>

      <ActiveFilterChips
        filters={filters}
        options={options}
        onRemove={onRemoveFilter}
        onClear={onClearFilters}
      />

      {error ? (
        <View
          style={[
            styles.banner,
            { borderColor: theme.border, backgroundColor: theme.backgroundSelected },
          ]}>
          <ThemedText style={[styles.bannerText, { color: theme.textSecondary }]}>
            {error}
          </ThemedText>
          <Pressable accessibilityRole="button" onPress={onRetryRefresh}>
            <ThemedText style={[styles.bannerAction, { color: theme.primary }]}>Thử lại</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {/* Result count — Web: "Tìm thấy {n} việc làm phù hợp" border-t pt-3.5 */}
      {!error ? (
        <View style={[styles.countRow, { borderTopColor: theme.border }]}>
          <ThemedText style={[styles.countText, { color: theme.textSecondary }]}>
            {loading ? 'Đang tìm kiếm...' : `Tìm thấy ${totalCount} việc làm phù hợp`}
          </ThemedText>
          {USE_MOCK_JOBS ? (
            <Badge variant="secondary" textStyle={styles.demoBadge}>
              DEMO
            </Badge>
          ) : null}
        </View>
      ) : null}

      {USE_MOCK_JOBS ? (
        <ThemedText style={[styles.demoNotice, { color: theme.textSecondary }]}>
          Đang dùng việc làm mẫu trên thiết bị, chưa lấy dữ liệu từ backend.
        </ThemedText>
      ) : null}
    </View>
  );
}

function PageTitle() {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.pageTitle, { color: theme.text }]}>Tìm Việc Làm</ThemedText>
  );
}

type EmptyProps = {
  loading: boolean;
  error: string | null;
  hasFilters: boolean;
  onRetry: () => void;
  onClearFilters: () => void;
  onRefresh: () => void;
};

function JobsEmptyState({
  loading,
  error,
  hasFilters,
  onRetry,
  onClearFilters,
  onRefresh,
}: EmptyProps) {
  const theme = useTheme();

  return (
    <View style={[styles.emptyState, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      {loading ? (
        <ActivityIndicator color={theme.primary} />
      ) : (
        <>
          <ThemedText style={styles.emptyTitle}>
            {error
              ? 'Chưa tải được việc làm'
              : hasFilters
                ? 'Không có việc làm phù hợp'
                : 'Chưa tìm thấy vị trí phù hợp'}
          </ThemedText>
          <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
            {error ??
              (hasFilters
                ? 'Thử bỏ bớt bộ lọc hoặc chọn tiêu chí khác.'
                : 'Thử từ khóa khác hoặc tải lại danh sách.')}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            onPress={error ? onRetry : hasFilters ? onClearFilters : onRefresh}
            style={[styles.emptyButton, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText style={[styles.emptyButtonText, { color: theme.primary }]}>
              {error ? 'Thử lại' : hasFilters ? 'Xóa bộ lọc' : 'Tải lại'}
            </ThemedText>
          </Pressable>
        </>
      )}
    </View>
  );
}

type FooterProps = {
  visible: boolean;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  totalCount: number;
  onLoadMore: () => void;
  onRetry: () => void;
};

function JobsFooter({
  visible,
  loading,
  hasMore,
  error,
  totalCount,
  onLoadMore,
  onRetry,
}: FooterProps) {
  const theme = useTheme();

  if (!visible) return null;

  if (loading) {
    return (
      <View style={styles.footerState}>
        <ActivityIndicator color={theme.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.footerState}>
        <ThemedText style={[styles.footerMessage, { color: theme.textSecondary }]}>{error}</ThemedText>
        <Pressable accessibilityRole="button" onPress={onRetry}>
          <ThemedText style={[styles.footerAction, { color: theme.primary }]}>Thử lại</ThemedText>
        </Pressable>
      </View>
    );
  }

  if (hasMore) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onLoadMore}
        style={[styles.loadMoreButton, { borderColor: theme.border }]}>
        <ThemedText style={[styles.loadMoreText, { color: theme.primary }]}>Tải thêm</ThemedText>
      </Pressable>
    );
  }

  return (
    <ThemedText style={[styles.footerMessage, { color: theme.textSecondary }]}>
      {`Đã hiển thị tất cả ${totalCount} vị trí.`}
    </ThemedText>
  );
}

export default function JobsScreen() {
  const theme = useTheme();
  const listRef = useRef<FlatList<Job>>(null);
  const [keyword, setKeyword] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const { ids } = useBookmarks();

  const {
    query,
    items,
    totalCount,
    hasMore,
    status,
    error,
    loadMoreError,
    search,
    applyFilters,
    clearFilters,
    removeFilter,
    refresh,
    loadMore,
    retry,
  } = useJobSearch();
  const filterOptions = useJobFilterOptions();

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, []);

  const handleSearch = useCallback(() => {
    search(keyword);
    scrollToTop();
  }, [keyword, search, scrollToTop]);

  const handleClearKeyword = useCallback(() => {
    setKeyword('');
    search('');
    scrollToTop();
  }, [search, scrollToTop]);

  const handleOpenFilters = useCallback(() => setFiltersOpen(true), []);

  const handleApplyFilters = useCallback(
    (next: JobFilters) => {
      applyFilters(next);
      setFiltersOpen(false);
      scrollToTop();
    },
    [applyFilters, scrollToTop],
  );

  const handleRemoveFilter = useCallback(
    (key: JobFilterKey, value?: number) => {
      removeFilter(key, value);
      scrollToTop();
    },
    [removeFilter, scrollToTop],
  );

  const handleClearFilters = useCallback(() => {
    clearFilters();
    scrollToTop();
  }, [clearFilters, scrollToTop]);

  const activeFilterCount = countActiveFilters(query.filters);
  const isInitialLoading = status === 'loading' || (status === 'refreshing' && items.length === 0);

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />
      <FlatList
        ref={listRef}
        data={items}
        keyExtractor={(job) => job.id}
        renderItem={({ item }) => <JobCard job={item} />}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.listContent}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshing={status === 'refreshing'}
        onRefresh={refresh}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        ListHeaderComponent={
          <JobsHeader
            keyword={keyword}
            onChangeKeyword={setKeyword}
            onSearch={handleSearch}
            onClearKeyword={handleClearKeyword}
            onOpenFilters={handleOpenFilters}
            activeFilterCount={activeFilterCount}
            filters={query.filters}
            options={filterOptions.options}
            onRemoveFilter={handleRemoveFilter}
            onClearFilters={handleClearFilters}
            totalCount={totalCount}
            loading={isInitialLoading}
            error={items.length > 0 ? error : null}
            onRetryRefresh={refresh}
            savedCount={ids.length}
            onOpenSaved={() => router.push('/saved')}
          />
        }
        ListEmptyComponent={
          <JobsEmptyState
            loading={isInitialLoading}
            error={error}
            hasFilters={activeFilterCount > 0}
            onRetry={retry}
            onClearFilters={handleClearFilters}
            onRefresh={refresh}
          />
        }
        ListFooterComponent={
          <JobsFooter
            visible={items.length > 0}
            loading={status === 'loadingMore'}
            hasMore={hasMore}
            error={loadMoreError}
            totalCount={totalCount}
            onLoadMore={loadMore}
            onRetry={retry}
          />
        }
      />

      <JobFiltersSheet
        visible={filtersOpen}
        filters={query.filters}
        options={filterOptions.options}
        optionsLoading={filterOptions.loading}
        optionsError={filterOptions.error}
        onRetryOptions={filterOptions.retry}
        onClose={() => setFiltersOpen(false)}
        onApply={handleApplyFilters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 32, flexGrow: 1 },
  header: { paddingTop: 16, paddingBottom: 8 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 },
  pageTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  pageIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitleCopy: { flexShrink: 1, gap: 2 },
  pageTitle: { fontFamily: font('semibold'), fontSize: 26, lineHeight: 32, letterSpacing: -0.5 },
  savedPill: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  savedPillText: { fontFamily: font('medium'), fontSize: 13 },
  filterCard: {
    borderRadius: 28,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 0 },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 48,
    paddingHorizontal: 22,
    borderRadius: Radius.pill,
  },
  searchButtonText: { fontFamily: font('semibold'), fontSize: 14 },
  pillRow: { gap: 8, paddingRight: 4 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  filterPillText: { fontFamily: font('medium'), fontSize: 13 },
  clearPill: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearPillText: { fontFamily: font('semibold'), fontSize: 13 },
  quickRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickChipText: { fontFamily: font('semibold'), fontSize: 12 },
  banner: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  bannerText: { fontSize: 12, lineHeight: 17, flex: 1 },
  bannerAction: { fontFamily: font('bold'), fontSize: 12 },
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: 18,
    paddingTop: 14,
  },
  countText: { fontFamily: font('medium'), fontSize: 13, flex: 1 },
  demoBadge: { fontFamily: font('semibold'), fontSize: 10 },
  demoNotice: { fontSize: 12, lineHeight: 18, marginTop: 8 },
  emptyState: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 24,
    gap: 10,
    minHeight: 150,
    justifyContent: 'center',
    marginTop: 4,
  },
  emptyTitle: { fontFamily: font('semibold'), fontSize: 16, textAlign: 'center' },
  emptyMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  emptyButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, marginTop: 3 },
  emptyButtonText: { fontFamily: font('bold'), fontSize: 13 },
  footerState: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 22 },
  footerMessage: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  footerAction: { fontFamily: font('bold'), fontSize: 12 },
  loadMoreButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  loadMoreText: { fontFamily: font('semibold'), fontSize: 13 },
});
