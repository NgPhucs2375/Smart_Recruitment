import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Check, ListChecks, Sparkles } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { normalizeLayoutConfig, SECTION_TITLES, type CvSectionId } from '../resume-layout';
import { TEMPLATE_REGISTRY, templateCategoryLabel } from '../template-registry';
import type { CvFormData } from '../types';

export function computeCvQuality(data: CvFormData): {
  progress: number;
  label: string;
  doneCount: number;
  items: { label: string; done: boolean }[];
} {
  const lh = data.thongTinLienHe;
  const items = [
    { label: 'Thông tin liên hệ (tên, email, SĐT)', done: Boolean(lh.hoTen && lh.email && lh.sdt) },
    { label: 'Giới thiệu bản thân', done: Boolean(lh.gioiThieuBanThan) },
    { label: 'Kinh nghiệm làm việc', done: data.kinhNghiemLamViec.length > 0 },
    { label: 'Học vấn', done: data.hocVan.length > 0 },
    { label: 'Kỹ năng', done: data.kyNang.length > 0 },
    {
      label: 'Dự án hoặc chứng chỉ',
      done: data.duAn.length > 0 || data.chungChi.length > 0,
    },
  ];
  const doneCount = items.filter((item) => item.done).length;
  const progress = Math.round((doneCount / items.length) * 100);
  const label =
    progress >= 100
      ? 'Xuất sắc'
      : progress >= 70
        ? 'Gần xong rồi'
        : progress >= 40
          ? 'Đang hoàn thiện'
          : 'Mới bắt đầu';
  return { progress, label, doneCount, items };
}

export function QualityCard({ progress, label }: { progress: number; label: string }) {
  const theme = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.qualityHead}>
        <View style={styles.rowCenter}>
          <Sparkles size={16} color={theme.primary} />
          <ThemedText style={{ color: theme.text }} type="smallBold">
            Độ hoàn thiện CV:{' '}
          </ThemedText>
          <ThemedText style={[styles.mono, { color: theme.primary }]}>{progress}%</ThemedText>
        </View>
        <ThemedText style={{ color: theme.textSecondary }} type="code">
          {label}
        </ThemedText>
      </View>
      <View
        style={[styles.track, { backgroundColor: theme.muted }]}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: progress }}>
        <View
          style={[
            styles.fill,
            { backgroundColor: theme.primary, width: `${Math.min(100, progress)}%` },
          ]}
        />
      </View>
    </Card>
  );
}

export function ChecklistCard({
  items,
  doneCount,
}: {
  items: { label: string; done: boolean }[];
  doneCount: number;
}) {
  const theme = useTheme();
  return (
    <Card style={styles.card}>
      <View style={styles.qualityHead}>
        <View style={styles.rowCenter}>
          <ListChecks size={16} color={theme.primary} />
          <ThemedText style={{ color: theme.text }} type="smallBold">
            Checklist hoàn thiện
          </ThemedText>
        </View>
        <Badge variant="secondary">{`${doneCount}/${items.length}`}</Badge>
      </View>
      <View style={styles.checklist}>
        {items.map((item) => (
          <View key={item.label} style={styles.checkItem}>
            <View
              style={[
                styles.checkDot,
                {
                  borderColor: item.done ? theme.primary : theme.border,
                  backgroundColor: item.done ? theme.primary : theme.muted,
                },
              ]}>
              <Check size={12} color={item.done ? theme.primaryForeground : 'transparent'} />
            </View>
            <ThemedText
              style={{ color: item.done ? theme.text : theme.textSecondary }}
              type="small">
              {item.label}
            </ThemedText>
          </View>
        ))}
      </View>
    </Card>
  );
}

export function TemplatePickerPanel({
  selectedId,
  onSelect,
}: {
  selectedId: string;
  onSelect: (templateId: string) => void;
}) {
  const theme = useTheme();
  const templates = useMemo(
    () =>
      Object.values(TEMPLATE_REGISTRY).sort((a, b) => a.label.localeCompare(b.label)),
    [],
  );

  return (
    <View style={styles.pickerWrap}>
      <ThemedText style={{ color: theme.textSecondary }} type="smallBold">
        Mẫu CV ({templates.length})
      </ThemedText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.templateHRow}>
        {templates.map((meta) => {
          const active = meta.id === selectedId;
          return (
            <Pressable
              key={meta.id}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              onPress={() => onSelect(meta.id)}
              style={({ pressed }) => [
                styles.templateCard,
                {
                  backgroundColor: active ? theme.backgroundSelected : theme.backgroundElement,
                  borderColor: active ? theme.primary : theme.border,
                  opacity: pressed ? 0.92 : 1,
                },
              ]}>
              <View style={styles.templateHead}>
                <ThemedText
                  style={{ color: active ? theme.primary : theme.text }}
                  type="smallBold"
                  numberOfLines={1}>
                  {meta.label}
                </ThemedText>
                {active ? <Check size={14} color={theme.primary} /> : null}
              </View>
              <ThemedText style={{ color: theme.textSecondary }} type="code" numberOfLines={2}>
                {templateCategoryLabel(meta)}
                {meta.columns ? ` • ${meta.columns} cột` : ''}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function LayoutPanel({
  data,
  onChange,
}: {
  data: CvFormData;
  onChange: (next: CvFormData) => void;
}) {
  const theme = useTheme();
  const layout = normalizeLayoutConfig(data.layoutConfig);

  const toggle = (id: CvSectionId) => {
    const section = layout.sections[id];
    onChange({
      ...data,
      layoutConfig: {
        sectionOrder: layout.sectionOrder,
        sections: {
          ...layout.sections,
          [id]: { ...section, isVisible: !section.isVisible },
        },
      },
    });
  };

  return (
    <View style={styles.pickerWrap}>
      <ThemedText style={{ color: theme.textSecondary }} type="smallBold">
        Hiển thị section trên CV
      </ThemedText>
      {layout.sectionOrder.map((id, index) => {
        const section = layout.sections[id];
        const title = SECTION_TITLES[id] ?? id;
        const visible = section?.isVisible !== false;
        return (
          <Pressable
            key={id}
            accessibilityRole="switch"
            accessibilityState={{ checked: visible }}
            onPress={() => toggle(id)}
            style={[
              styles.layoutRow,
              { borderColor: theme.border, backgroundColor: theme.backgroundElement },
            ]}>
            <Badge variant="outline">{String(index + 1)}</Badge>
            <ThemedText
              style={{ color: visible ? theme.text : theme.textSecondary, flex: 1 }}
              type="small">
              {title}
            </ThemedText>
            <ThemedText style={{ color: visible ? theme.primary : theme.textSecondary }} type="code">
              {visible ? 'Hiện' : 'Ẩn'}
            </ThemedText>
          </Pressable>
        );
      })}
      <ThemedText style={{ color: theme.textSecondary }} type="code">
        Thứ tự section theo mẫu CV; dùng biểu tượng mắt ở từng mục để ẩn/hiện.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: 14, gap: 10 },
  qualityHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mono: { fontFamily: font('bold'), fontSize: 13 },
  track: { height: 8, borderRadius: Radius.pill, overflow: 'hidden' },
  fill: { height: 8, borderRadius: Radius.pill },
  checklist: { gap: 8 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  checkDot: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerWrap: { gap: 8 },
  templateHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  templateHRow: { gap: 8, paddingRight: 4 },
  templateCard: {
    width: 168,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 12,
    gap: 4,
    minHeight: 74,
    justifyContent: 'center',
  },
  layoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
});
