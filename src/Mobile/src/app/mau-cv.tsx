import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Eye, Search, Tag } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { safeBack } from '@/utils/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { PreviewModal } from '@/features/cv/components/preview-modal';
import { CvTemplateMiniPreview, GALLERY_TEMPLATE_IDS } from '@/features/cv/components/cv-template-mini-preview';
import { sampleCvFormData } from '@/features/cv/sample-cv-data';
import {
  GALLERY_CHIP_LABELS,
  TEMPLATE_CATEGORIES,
  TEMPLATE_REGISTRY,
  resolveTemplateId,
  templateCategoryLabel,
  type ResumeTemplateMeta,
  type TemplateCategory,
} from '@/features/cv/template-registry';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 12;

type SortMode = 'recommended' | 'name';

export default function MauCvGalleryScreen() {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<TemplateCategory | 'all'>('all');
  const [sort, setSort] = useState<SortMode>('recommended');
  const [page, setPage] = useState(1);
  const [previewId, setPreviewId] = useState<string | null>(null);

  // Kho chỉ giữ 5 mẫu chủ đạo — lọc allowlist, không sửa registry part dùng chung.
  const templates = useMemo(
    () => GALLERY_TEMPLATE_IDS.map((id) => TEMPLATE_REGISTRY[id]).filter(Boolean),
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = templates.filter((t) => {
      if (category === 'one-column' || category === 'two-column') {
        if (String(t.columns ?? 1) !== (category === 'one-column' ? '1' : '2')) return false;
      } else if (category !== 'all' && !(t.categories ?? []).includes(category)) {
        return false;
      }
      if (!q) return true;
      return (
        t.label.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
    if (sort === 'name') {
      return [...list].sort((a, b) => a.label.localeCompare(b.label, 'vi'));
    }
    return list;
  }, [templates, query, category, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const preview: ResumeTemplateMeta | null = previewId
    ? (TEMPLATE_REGISTRY[resolveTemplateId(previewId)] ?? null)
    : null;

  const resetFilters = () => {
    setQuery('');
    setCategory('all');
    setSort('recommended');
    setPage(1);
  };

  const goUseTemplate = (templateId: string) => {
    router.push({
      pathname: '/tao-cv/ai',
      params: { templateId, templateName: TEMPLATE_REGISTRY[templateId]?.label ?? templateId },
    });
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <Button
          variant="ghost"
          size="icon"
          onPress={() => safeBack('/tao-cv')}
          accessibilityLabel="Quay lại"
          icon={<ArrowLeft size={18} color={theme.text} />}
        />
        <ThemedText style={{ color: theme.text, flex: 1 }} type="subtitle" numberOfLines={1}>
          Chọn mẫu CV
        </ThemedText>
        <View style={styles.topRight}>
          <View style={[styles.sortGroup, { borderColor: theme.border }]}>
            {(['recommended', 'name'] as const).map((mode) => {
              const active = sort === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  onPress={() => {
                    setSort(mode);
                    setPage(1);
                  }}
                  style={[
                    styles.sortSegment,
                    active && { backgroundColor: theme.primary },
                  ]}>
                  <ThemedText
                    style={{ color: active ? theme.primaryForeground : theme.textSecondary }}
                    type="code">
                    {mode === 'recommended' ? 'Đề xuất' : 'Tên A–Z'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
          <Badge variant="secondary">{`${filtered.length} mẫu`}</Badge>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <ThemedText style={{ color: theme.textSecondary }} type="code">
          Vuốt ngang để lọc:
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}>
          {TEMPLATE_CATEGORIES.map((item) => {
            const active = category === item.id;
            return (
              <Pressable
                key={item.id}
                accessibilityRole="button"
                onPress={() => {
                  setCategory(item.id);
                  setPage(1);
                }}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? theme.primary : theme.backgroundElement,
                    borderColor: active ? theme.primary : theme.border,
                  },
                ]}>
                <ThemedText
                  style={{ color: active ? theme.primaryForeground : theme.textSecondary }}
                  type="code"
                  numberOfLines={1}>
                  {GALLERY_CHIP_LABELS[item.id] ?? item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.input }]}>
          <Search size={15} color={theme.textSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm mẫu theo tên, slug, thẻ..."
            placeholderTextColor={theme.textSecondary}
            style={[styles.searchInput, { color: theme.text }]}
            autoCorrect={false}
            accessibilityLabel="Tìm mẫu CV"
          />
        </View>

        {filtered.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: theme.border }]}>
            <ThemedText style={{ color: theme.text }} type="smallBold">
              Không tìm thấy mẫu phù hợp
            </ThemedText>
            <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
              {`Thử từ khóa khác hoặc nới bộ lọc để xem toàn bộ thư viện ${templates.length} mẫu.`}
            </ThemedText>
            <Button variant="outline" onPress={resetFilters} style={{ marginTop: 6 }}>
              Xóa bộ lọc
            </Button>
          </View>
        ) : (
          <>
            {pageItems.map((template) => {
              const columns = template.columns ?? 1;
              return (
                <Card key={template.id} style={styles.card} elevated>
                  <View
                    style={[
                      styles.thumb,
                      { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
                    ]}>
                    <CvTemplateMiniPreview templateId={template.id} style={styles.thumbPaper} />
                    <ThemedText style={{ color: theme.textSecondary }} type="code">
                      {`A4 • ${columns} cột`}
                    </ThemedText>
                  </View>

                  <View style={styles.cardBody}>
                    <ThemedText
                      style={{ color: theme.text }}
                      type="smallBold"
                      numberOfLines={1}>
                      {template.label}
                    </ThemedText>
                    <ThemedText style={{ color: theme.textSecondary }} type="code">
                      {`Mẫu CV ${columns} cột`}
                    </ThemedText>
                    <View
                      style={[
                        styles.tagPill,
                        { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
                      ]}>
                      <Tag size={11} color={theme.primary} />
                      <ThemedText style={{ color: theme.primary, flexShrink: 1 }} type="code" numberOfLines={1}>
                        {`${templateCategoryLabel(template)} • ${columns} cột`}
                      </ThemedText>
                    </View>
                    <ThemedText
                      style={{ color: theme.textSecondary }}
                      type="small"
                      numberOfLines={2}>
                      {template.description}
                    </ThemedText>
                    <View style={styles.cardActions}>
                      <Button
                        variant="outline"
                        size="sm"
                        onPress={() => setPreviewId(template.id)}
                        style={styles.cardActionGrow}
                        accessibilityLabel={`Xem thử mẫu ${template.label}`}>
                        <Eye size={14} color={theme.text} />
                        Xem thử
                      </Button>
                      <Button
                        size="sm"
                        onPress={() => goUseTemplate(template.id)}
                        style={styles.cardActionGrow}
                        accessibilityLabel={`Dùng mẫu ${template.label}`}>
                        Dùng mẫu này
                      </Button>
                    </View>
                  </View>
                </Card>
              );
            })}

            {pageCount > 1 ? (
              <View style={styles.pager}>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage <= 1}
                  onPress={() => setPage(Math.max(1, safePage - 1))}>
                  Trước
                </Button>
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  {`Trang ${safePage}/${pageCount}`}
                </ThemedText>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={safePage >= pageCount}
                  onPress={() => setPage(Math.min(pageCount, safePage + 1))}>
                  Sau
                </Button>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>

      {preview ? (
        <PreviewModal
          visible
          onClose={() => setPreviewId(null)}
          data={sampleCvFormData}
          templateId={preview.id}
          title={`Xem thử: ${preview.label}`}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 1 },
  sortGroup: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: Radius.pill,
    overflow: 'hidden',
  },
  sortSegment: { paddingHorizontal: 10, paddingVertical: 6 },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    minHeight: 42,
  },
  searchInput: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 8 },
  emptyBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius['2xl'],
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { textAlign: 'center', fontFamily: font('regular'), fontSize: 13, lineHeight: 20 },
  card: { flexDirection: 'row', gap: 12, padding: 12, borderRadius: Radius['2xl'] },
  thumb: {
    width: 88,
    minHeight: 124,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 8,
  },
  thumbPaper: { alignSelf: 'stretch', flexGrow: 1 },
  cardBody: { flex: 1, gap: 4, minWidth: 0 },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    maxWidth: '100%',
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  cardActionGrow: { flexGrow: 1, flexBasis: 0 },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingTop: 4,
  },
});
