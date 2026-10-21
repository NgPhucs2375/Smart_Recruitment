import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Building2, MapPin, Search, Star, Users, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Card, Monogram } from '@/components/ui/card';
import { font, Palette, Radius } from '@/constants/theme';
import { companyInitials, companiesApi } from '@/features/companies/api/companies-api';
import { useFollowedCompanies } from '@/features/companies/followed-companies';
import type { Company } from '@/features/companies/types';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 10;

export default function CompaniesScreen() {
  const theme = useTheme();
  const { isFollowed, toggle } = useFollowedCompanies();
  const [keyword, setKeyword] = useState('');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(async (nextPage: number, mode: 'initial' | 'refresh' | 'more') => {
    if (mode === 'more') setLoadingMore(true);
    else if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const result = await companiesApi.getCompanies({ page: nextPage, pageSize: PAGE_SIZE });
      setCompanies((current) =>
        nextPage === 1 ? result.companies : [...current, ...result.companies],
      );
      setHasMore(result.hasNext);
      setError(null);
      setPage(result.page);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách công ty.');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void companiesApi
      .getCompanies({ page: 1, pageSize: PAGE_SIZE })
      .then((result) => {
        if (!active) return;
        setCompanies(result.companies);
        setHasMore(result.hasNext);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách công ty.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Lọc phía client theo Web (deferred keyword trên toàn danh sách đã tải).
  const visible = useMemo(() => {
    const query = keyword.trim().toLocaleLowerCase('vi');
    if (!query) return companies;
    return companies.filter((company) =>
      `${company.name} ${company.industry} ${company.address} ${company.description}`
        .toLocaleLowerCase('vi')
        .includes(query),
    );
  }, [companies, keyword]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore && !loading) void load(page + 1, 'more');
  }, [hasMore, load, loading, loadingMore, page]);

  const handleRefresh = useCallback(() => {
    void load(1, 'refresh');
  }, [load]);

  const handleToggleFollow = useCallback(
    (id: number) => toggle(id),
    [toggle],
  );

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Top bar — back + tiêu đề (routes ngoài tabs cần header riêng). */}
      <View style={[styles.topBar, { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => router.back()}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={styles.topBarTitle}>Khám phá công ty</ThemedText>
        <View style={styles.backButton} />
      </View>

      <FlatList
        data={visible}
        keyExtractor={(company) => String(company.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={6}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.hero, { backgroundColor: theme.primary }]}>
              <View style={styles.heroLabelRow}>
                <Building2 size={14} color={Palette.white} />
                <ThemedText style={styles.heroLabel}>Danh bạ tuyển dụng</ThemedText>
              </View>
              <ThemedText style={styles.heroTitle}>Khám phá doanh nghiệp</ThemedText>
              <ThemedText style={styles.heroSubtitle}>
                Tìm hiểu môi trường làm việc và cơ hội nghề nghiệp phù hợp với bạn.
              </ThemedText>
            </View>

            <View
              style={[
                styles.searchBox,
                { backgroundColor: theme.muted, borderColor: theme.border },
              ]}>
              <Search size={16} color={theme.textSecondary} />
              <TextInput
                accessibilityLabel="Tìm công ty"
                value={keyword}
                onChangeText={setKeyword}
                placeholder="Tìm tên, lĩnh vực hoặc địa điểm..."
                placeholderTextColor={theme.textSecondary}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.text }]}
              />
              {keyword ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Xóa từ khóa"
                  hitSlop={8}
                  onPress={() => setKeyword('')}>
                  <X size={16} color={theme.textSecondary} />
                </Pressable>
              ) : null}
            </View>

            <View style={styles.countRow}>
              <ThemedText style={[styles.countText, { color: theme.textSecondary }]}>
                {loading ? 'Đang tải...' : `${visible.length} kết quả`}
              </ThemedText>
            </View>

            {error ? (
              <View
                style={[
                  styles.errorBanner,
                  { borderColor: theme.border, backgroundColor: theme.backgroundSelected },
                ]}>
                <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>{error}</ThemedText>
                <Pressable accessibilityRole="button" onPress={() => void load(1, 'refresh')}>
                  <ThemedText style={[styles.retryText, { color: theme.primary }]}>Thử lại</ThemedText>
                </Pressable>
              </View>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={[styles.stateBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : (
            <View style={[styles.stateBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <ThemedText style={styles.stateTitle}>Không tìm thấy công ty</ThemedText>
              <ThemedText style={[styles.stateMessage, { color: theme.textSecondary }]}>
                Thử từ khóa khác hoặc tải lại danh sách.
              </ThemedText>
              <Pressable
                accessibilityRole="button"
                onPress={() => setKeyword('')}
                style={[styles.stateButton, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={[styles.stateButtonText, { color: theme.primary }]}>
                  Xóa tìm kiếm
                </ThemedText>
              </Pressable>
            </View>
          )
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.footerState}>
              <ActivityIndicator color={theme.primary} />
            </View>
          ) : hasMore ? (
            <Pressable
              accessibilityRole="button"
              onPress={handleLoadMore}
              style={[styles.loadMoreButton, { borderColor: theme.border }]}>
              <ThemedText style={[styles.loadMoreText, { color: theme.primary }]}>Tải thêm</ThemedText>
            </Pressable>
          ) : visible.length > 0 ? (
            <ThemedText style={[styles.footerMessage, { color: theme.textSecondary }]}>
              {`Đã hiển thị tất cả ${visible.length} công ty.`}
            </ThemedText>
          ) : null
        }
        renderItem={({ item }) => (
          <CompanyRow
            company={item}
            followed={isFollowed(item.id)}
            onToggleFollow={handleToggleFollow}
            onPress={() => router.push(`/companies/${item.id}`)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function CompanyRow({
  company,
  followed,
  onToggleFollow,
  onPress,
}: {
  company: Company;
  followed: boolean;
  onToggleFollow: (id: number) => void;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Card style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Monogram label={companyInitials(company.name)} size={52} radius={Radius.xl} fontSize={16} />
        <View style={styles.cardTitleBlock}>
          <Pressable onPress={onPress}>
            <ThemedText numberOfLines={1} style={[styles.companyName, { color: theme.text }]}>
              {company.name}
            </ThemedText>
          </Pressable>
          {company.industry ? (
            <ThemedText numberOfLines={1} style={[styles.companyIndustry, { color: theme.textSecondary }]}>
              {company.industry}
            </ThemedText>
          ) : null}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={followed ? 'Bỏ theo dõi công ty' : 'Theo dõi công ty'}
          accessibilityState={{ selected: followed }}
          hitSlop={8}
          onPress={() => onToggleFollow(company.id)}
          style={[styles.starButton, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          <Star
            size={17}
            color={followed ? Palette.sand : theme.textSecondary}
            fill={followed ? Palette.sand : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={styles.metaRow}>
        {company.size ? (
          <View style={[styles.metaPill, { backgroundColor: theme.muted, borderColor: theme.border }]}>
            <Users size={12} color={Palette.sage} />
            <ThemedText numberOfLines={1} style={[styles.metaText, { color: theme.textSecondary }]}>
              {company.size}
            </ThemedText>
          </View>
        ) : null}
        {company.address ? (
          <View style={[styles.metaPill, { backgroundColor: theme.muted, borderColor: theme.border }]}>
            <MapPin size={12} color={Palette.sage} />
            <ThemedText numberOfLines={1} style={[styles.metaText, { color: theme.textSecondary }]}>
              {company.address}
            </ThemedText>
          </View>
        ) : null}
      </View>

      {company.description ? (
        <ThemedText numberOfLines={2} style={[styles.companyDescription, { color: theme.textSecondary }]}>
          {company.description}
        </ThemedText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: { fontFamily: font('semibold'), fontSize: 15 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, flexGrow: 1 },
  header: { gap: 12, marginBottom: 4 },
  hero: { borderRadius: Radius['3xl'], padding: 20, gap: 6 },
  heroLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  heroLabel: {
    fontFamily: font('semibold'),
    fontSize: 11,
    color: Palette.white,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  heroTitle: { fontFamily: font('semibold'), fontSize: 24, color: Palette.white, letterSpacing: -0.5 },
  heroSubtitle: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, color: `${Palette.white}BF` },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 48,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  searchInput: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 0 },
  countRow: { flexDirection: 'row', alignItems: 'center' },
  countText: { fontFamily: font('medium'), fontSize: 13, flex: 1 },
  errorBanner: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  errorText: { fontSize: 12, lineHeight: 17, flex: 1 },
  retryText: { fontFamily: font('bold'), fontSize: 12 },
  card: { marginBottom: 12, padding: 16, gap: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardTitleBlock: { flex: 1, minWidth: 0, gap: 2 },
  companyName: { fontFamily: font('semibold'), fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  companyIndustry: { fontFamily: font('medium'), fontSize: 13 },
  starButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  metaText: { fontFamily: font('medium'), fontSize: 11, flexShrink: 1 },
  companyDescription: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19 },
  stateBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 24,
    gap: 10,
    minHeight: 150,
    justifyContent: 'center',
    marginTop: 4,
  },
  stateTitle: { fontFamily: font('semibold'), fontSize: 16, textAlign: 'center' },
  stateMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  stateButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, marginTop: 3 },
  stateButtonText: { fontFamily: font('bold'), fontSize: 13 },
  footerState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 22 },
  footerMessage: { fontSize: 12, lineHeight: 18, textAlign: 'center', paddingVertical: 12 },
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
