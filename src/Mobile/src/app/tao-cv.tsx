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
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, FilePlus2, LayoutTemplate, Sparkles, Upload } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { safeBack } from '@/utils/navigation';
import { Badge, PillBadge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { cvApi } from '@/features/cv/api/cv-api';
import { runCvImport, stashImportedContent } from '@/features/cv/components/import-cv';
import type { CvSummary } from '@/features/cv/types';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 10;

export default function CvListScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<CvSummary[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [source, setSource] = useState<'api' | 'demo'>('api');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const mountedRef = useRef(true);

  const reload = useCallback(async (targetPage: number, mode: 'initial' | 'refresh' | 'more') => {
    if (mode === 'more') setLoadingMore(true);
    else if (mode === 'refresh') setRefreshing(true);
    else setLoading(true);
    try {
      const result = await cvApi.listPage({ page: targetPage, pageSize: PAGE_SIZE });
      if (!mountedRef.current) return;
      setItems((current) => (targetPage === 1 ? result.items : [...current, ...result.items]));
      setHasMore(result.hasMore);
      setSource(result.source);
      setPage(targetPage);
      setError(null);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải danh sách CV.');
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    const timer = setTimeout(() => {
      void reload(1, 'initial');
    }, 0);
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [reload]);

  const openCv = (id: string) => {
    router.push({ pathname: '/tao-cv/[id]', params: { id } });
  };

  const handleImport = () => {
    if (importing) return;
    setImporting(true);
    void (async () => {
      try {
        const hoSoId = await cvApi.getHoSoId();
        const outcome = await runCvImport(hoSoId);
        if (!outcome) return;
        if (outcome.kind === 'content') {
          stashImportedContent({
            partial: outcome.partial,
            sessionId: outcome.sessionId,
            fileName: outcome.fileName,
          });
          router.push({ pathname: '/tao-cv/[id]', params: { id: 'new' } });
        } else {
          router.push({
            pathname: '/tao-cv/[id]',
            params: {
              id: 'new',
              importSession: outcome.sessionId,
              importFile: outcome.fileName,
            },
          });
        }
      } catch (reason) {
        Alert.alert(
          'Chưa thể nhập CV',
          reason instanceof Error ? reason.message : 'Vui lòng thử lại.',
        );
      } finally {
        setImporting(false);
      }
    })();
  };

  const handleSetDefault = (item: CvSummary) => {
    void (async () => {
      try {
        await cvApi.setDefault(item.id);
        if (mountedRef.current) await reload(1, 'refresh');
        Alert.alert('Đã đặt CV mặc định', 'CV này sẽ được dùng cho gợi ý việc làm.');
      } catch (reason) {
        Alert.alert('Không thể đặt CV mặc định', reason instanceof Error ? reason.message : 'Thử lại sau.');
      }
    })();
  };

  const handleRemove = (item: CvSummary) => {
    Alert.alert(
      `Xóa "${item.name}"?`,
      'CV và các phiên bản đã lưu sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await cvApi.remove(item.id);
                if (mountedRef.current) await reload(1, 'refresh');
              } catch (reason) {
                Alert.alert('Xóa CV thất bại', reason instanceof Error ? reason.message : 'Thử lại sau.');
              }
            })();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleDuplicate = (item: CvSummary) => {
    void (async () => {
      try {
        const hoSoId = await cvApi.getHoSoId();
        const newId = await cvApi.duplicate(item.id, hoSoId);
        if (mountedRef.current) await reload(1, 'refresh');
        openCv(newId);
      } catch (reason) {
        Alert.alert('Nhân bản CV thất bại', reason instanceof Error ? reason.message : 'Thử lại sau.');
      }
    })();
  };

  const rowMenu = (item: CvSummary) => {
    const buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
      { text: 'Xem phân tích', onPress: () => router.push({ pathname: '/cv-phan-tich/[id]', params: { id: item.id } }) },
      { text: 'Nhân bản', onPress: () => handleDuplicate(item) },
    ];
    if (!item.isDefault) {
      buttons.unshift({ text: 'Đặt làm mặc định', onPress: () => handleSetDefault(item) });
    }
    buttons.push(
      { text: 'Xóa', style: 'destructive', onPress: () => handleRemove(item) },
      { text: 'Hủy', style: 'cancel' },
    );
    Alert.alert(item.name, item.role, buttons, { cancelable: true });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <Button
          variant="ghost"
          size="icon"
          onPress={() => safeBack('/')}
          accessibilityLabel="Quay lại"
          icon={<ArrowLeft size={18} color={theme.text} />}
        />
        <ThemedText style={{ color: theme.text }} type="subtitle">
          CV của tôi
        </ThemedText>
        {items.length > 0 ? <Badge variant="secondary">{`${items.length} CV`}</Badge> : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void reload(1, 'refresh')}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.backgroundElement}
          />
        }>
        <View style={styles.actionsRow}>
          <Button
            onPress={() => router.push({ pathname: '/tao-cv/[id]', params: { id: 'new' } })}
            style={styles.actionGrow}
            accessibilityLabel="Tạo CV mới">
            <FilePlus2 size={16} color={theme.primaryForeground} />
            Tạo CV mới
          </Button>
          <Button
            variant="outline"
            onPress={handleImport}
            disabled={importing}
            style={styles.actionGrow}
            accessibilityLabel="Nhập CV từ file">
            <Upload size={16} color={theme.text} />
            {importing ? 'Đang nhập…' : 'Nhập CV'}
          </Button>
          <Button
            variant="outline"
            onPress={() => router.push('/mau-cv')}
            style={styles.actionGrow}
            accessibilityLabel="Kho mẫu CV">
            <LayoutTemplate size={16} color={theme.text} />
            Kho mẫu
          </Button>
        </View>

        <Button
          variant="outline"
          onPress={() => router.push('/tao-cv/ai')}
          accessibilityLabel="Tạo CV với AI">
          <Sparkles size={16} color={theme.primary} />
          Tạo CV với AI — dán nội dung, AI dựng CV
        </Button>

        {source === 'demo' ? (
          <View style={styles.demoRow}>
            <Badge variant="secondary">DỮ LIỆU MINH HỌA</Badge>
          </View>
        ) : null}

        {error ? (
          <ThemedText style={[styles.error, { color: theme.destructive }]}>{error}</ThemedText>
        ) : null}

        {loading && items.length === 0 && !error ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : null}

        {!loading && items.length === 0 && !error ? (
          <View style={styles.emptyBox}>
            <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
              Chưa có CV nào
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              Tạo CV mới, chọn mẫu trong kho, hoặc nhập file CV sẵn có để bắt đầu.
            </ThemedText>
            <Button
              onPress={() => router.push({ pathname: '/tao-cv/[id]', params: { id: 'new' } })}
              style={{ marginTop: 8 }}>
              <FilePlus2 size={16} color={theme.primaryForeground} />
              Tạo CV mới
            </Button>
          </View>
        ) : null}

        {items.map((item) => (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            onPress={() => openCv(item.id)}
            onLongPress={() => rowMenu(item)}
            delayLongPress={350}
            style={({ pressed }) => [{ opacity: pressed ? 0.94 : 1 }]}>
            <Card style={styles.cvCard} elevated>
              <View style={styles.cvCardHead}>
                <ThemedText
                  style={{ color: theme.text, flex: 1 }}
                  type="smallBold"
                  numberOfLines={1}>
                  {item.name}
                </ThemedText>
                {item.isDefault ? <PillBadge>Mặc định</PillBadge> : null}
              </View>
              <ThemedText style={{ color: theme.textSecondary }} type="small" numberOfLines={1}>
                {item.role}
              </ThemedText>
              <View style={styles.cvCardMeta}>
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  {item.uploadedAt}
                </ThemedText>
                {item.templateId ? (
                  <ThemedText style={{ color: theme.textSecondary }} type="code">
                    • {item.templateId}
                  </ThemedText>
                ) : null}
                <ThemedText style={{ color: theme.primary }} type="code">
                  Nhấn để sửa • giữ để thao tác
                </ThemedText>
              </View>
            </Card>
          </Pressable>
        ))}

        {hasMore ? (
          <Pressable
            accessibilityRole="button"
            disabled={loadingMore}
            onPress={() => {
              setLoadingMore(true);
              void reload(page + 1, 'more');
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  actionsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  actionGrow: { flexGrow: 1, flexBasis: 0 },
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
  cvCard: { padding: 14, gap: 6, borderRadius: Radius.xl },
  cvCardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  cvCardMeta: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', alignItems: 'center' },
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
