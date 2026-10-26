import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Target, TrendingUp } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Palette, Radius } from '@/constants/theme';
import { recommendationsApi } from '@/features/recommendations/api/recommendations-api';
import { RecommendedJobCard } from '@/features/recommendations/components/recommended-job-card';
import type { RecommendedJob } from '@/features/recommendations/types';
import { useTheme } from '@/hooks/use-theme';

export default function PhuHopScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<RecommendedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (mode: 'initial' | 'refresh') => {
    if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const next = await recommendationsApi.getRecommendations();
      setItems(next);
      setError(null);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : 'Không thể tải việc làm phù hợp.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void recommendationsApi
      .getRecommendations()
      .then((next) => {
        if (!active) return;
        setItems(next);
        setError(null);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : 'Không thể tải việc làm phù hợp.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const highCount = items.filter((item) => item.matchPercent >= 66).length;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void load('refresh')}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }>
        {/* Page header — Web AdminPageHeader: icon box + Target + "Việc làm phù hợp" */}
        <View style={styles.pageHeader}>
          <View style={[styles.pageIconBox, { backgroundColor: theme.muted }]}>
            <Target size={22} color={theme.primary} />
          </View>
          <View style={styles.pageTitleCopy}>
            <ThemedText style={[styles.pageTitle, { color: theme.text }]}>
              Việc làm phù hợp
            </ThemedText>
            <ThemedText style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
              Xếp hạng theo kỹ năng, vị trí, lương và địa điểm trong hồ sơ của bạn.
            </ThemedText>
          </View>
        </View>

        {error && items.length === 0 ? (
          <View
            style={[
              styles.errorBanner,
              { borderColor: theme.border, backgroundColor: theme.backgroundSelected },
            ]}>
            <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>{error}</ThemedText>
            <Pressable accessibilityRole="button" onPress={() => void load('initial')}>
              <ThemedText style={[styles.retryText, { color: theme.primary }]}>Thử lại</ThemedText>
            </Pressable>
          </View>
        ) : null}

        {/* Stats — Web: 3 ô Tổng gợi ý / Phù hợp cao / Từ 50% trở lên */}
        {!loading && items.length > 0 ? (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: `${theme.primary}0D` }]}>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Tổng gợi ý
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.text }]}>{items.length}</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: `${Palette.sage}1A` }]}>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>
                Phù hợp cao
              </ThemedText>
              <ThemedText style={[styles.statValue, { color: Palette.sage }]}>{highCount}</ThemedText>
            </View>
            <View style={[styles.statBox, { backgroundColor: `${theme.primary}0D` }]}>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Từ 50% trở lên</ThemedText>
              <ThemedText style={[styles.statValue, { color: theme.text }]}>
                {items.filter((item) => item.matchPercent >= 50).length}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <View style={styles.sectionRow}>
          <View style={[styles.sectionIcon, { backgroundColor: theme.muted }]}>
            <TrendingUp size={15} color={theme.primary} />
          </View>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Dành cho bạn</ThemedText>
          {!loading && !error ? (
            <Badge variant="secondary" textStyle={styles.countBadge}>
              {`${items.length} tin`}
            </Badge>
          ) : null}
        </View>

        {loading ? (
          <View style={[styles.stateBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ActivityIndicator color={theme.primary} />
          </View>
        ) : items.length === 0 ? (
          <View style={[styles.stateBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={styles.stateTitle}>Chưa có kết quả phù hợp</ThemedText>
            <ThemedText style={[styles.stateMessage, { color: theme.textSecondary }]}>
              Hệ thống sẽ phân tích và gợi ý việc làm phù hợp khi có dữ liệu.
            </ThemedText>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push('/')}
              style={[styles.stateButton, { backgroundColor: theme.backgroundSelected }]}>
              <ThemedText style={[styles.stateButtonText, { color: theme.primary }]}>
                Tìm thêm việc
              </ThemedText>
            </Pressable>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((item) => (
              <RecommendedJobCard key={item.job.id} item={item} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  pageIconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageTitleCopy: { flex: 1, minWidth: 0, gap: 3 },
  pageTitle: { fontFamily: font('semibold'), fontSize: 24, lineHeight: 30, letterSpacing: -0.5 },
  pageSubtitle: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19 },
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
  statsRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  statLabel: { fontFamily: font('regular'), fontSize: 11 },
  statValue: { fontFamily: font('semibold'), fontSize: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: { fontFamily: font('semibold'), fontSize: 17, flex: 1 },
  countBadge: { fontFamily: font('semibold'), fontSize: 11 },
  list: { gap: 14 },
  stateBox: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 24,
    gap: 10,
    minHeight: 160,
    justifyContent: 'center',
  },
  stateTitle: { fontFamily: font('semibold'), fontSize: 16, textAlign: 'center' },
  stateMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  stateButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg },
  stateButtonText: { fontFamily: font('bold'), fontSize: 13 },
});
