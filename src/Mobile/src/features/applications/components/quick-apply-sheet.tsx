import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Briefcase, FileText, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { PillBadge } from '@/components/ui/badge';
import { font, Radius } from '@/constants/theme';
import { applicationsApi } from '@/features/applications/api/applications-api';
import type { ApplyResult } from '@/features/applications/types';
import { cvApi } from '@/features/cv/api/cv-api';
import type { CvSummary } from '@/features/cv/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  jobId: string;
  jobTitle: string;
  company: string;
  location: string;
  salary: string;
  onClose: () => void;
  onApplied: (result: ApplyResult) => void;
};

type CvLoadState =
  | { status: 'loading'; items: CvSummary[]; source: 'api' | 'demo' }
  | { status: 'ready'; items: CvSummary[]; source: 'api' | 'demo' }
  | { status: 'error'; items: CvSummary[]; source: 'api' | 'demo'; message: string };

export function QuickApplySheet({
  visible,
  jobId,
  jobTitle,
  company,
  location,
  salary,
  onClose,
  onApplied,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const requestRef = useRef(0);
  const [loadState, setLoadState] = useState<CvLoadState>({
    status: 'loading',
    items: [],
    source: 'api',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadCvs = useCallback(() => {
    const requestId = requestRef.current + 1;
    requestRef.current = requestId;
    setLoadState({ status: 'loading', items: [], source: 'api' });
    setSelectedId(null);
    setSubmitError(null);

    cvApi
      .listMine()
      .then((result) => {
        if (requestRef.current !== requestId) return;
        setLoadState({ status: 'ready', items: result.items, source: result.source });
        setSelectedId(
          result.items.find((cv) => cv.isDefault)?.id ?? result.items[0]?.id ?? null,
        );
      })
      .catch((reason: unknown) => {
        if (requestRef.current !== requestId) return;
        setLoadState({
          status: 'error',
          items: [],
          source: 'api',
          message:
            reason instanceof Error ? reason.message : 'Không thể tải danh sách CV.',
        });
      });
  }, []);

  const handleShow = () => {
    setSubmitting(false);
    setSubmitError(null);
    loadCvs();
  };

  const handleClose = () => {
    if (submitting) return;
    onClose();
  };

  const handleApply = () => {
    const selectedCv = loadState.items.find((cv) => cv.id === selectedId);
    if (!selectedCv || submitting) return;

    setSubmitting(true);
    setSubmitError(null);
    applicationsApi
      .apply({
        jobId,
        cvId: selectedCv.id,
        jobTitle,
        company,
        location,
        salary,
        cvName: selectedCv.name,
      })
      .then((result) => {
        setSubmitting(false);
        onApplied(result);
        onClose();
      })
      .catch((reason: unknown) => {
        setSubmitting(false);
        setSubmitError(
          reason instanceof Error ? reason.message : 'Không thể nộp hồ sơ. Vui lòng thử lại.',
        );
      });
  };

  const canApply =
    loadState.status === 'ready' && Boolean(selectedId) && !submitting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      onShow={handleShow}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng"
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.backgroundElement,
              borderColor: theme.border,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <FileText size={18} color={theme.primary} />
              <ThemedText style={styles.title} numberOfLines={2}>
                Chọn CV để ứng tuyển
              </ThemedText>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Đóng"
              hitSlop={10}
              disabled={submitting}
              onPress={handleClose}
              style={({ pressed }) => [styles.closeButton, { opacity: pressed ? 0.6 : 1 }]}>
              <X size={18} color={theme.textSecondary} />
            </Pressable>
          </View>
          <ThemedText style={[styles.description, { color: theme.textSecondary }]}>
            Đơn sẽ đính kèm bản mới nhất của CV bạn chọn. Mỗi hồ sơ chỉ nộp 1 đơn cho mỗi
            tin.
          </ThemedText>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}>
            {loadState.status === 'loading' ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.primary} />
                <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
                  Đang tải danh sách CV...
                </ThemedText>
              </View>
            ) : loadState.status === 'error' ? (
              <View style={styles.stateBox}>
                <ThemedText style={styles.stateTitle}>Không tải được CV</ThemedText>
                <ThemedText style={[styles.stateText, { color: theme.textSecondary }]}>
                  {loadState.message}
                </ThemedText>
                <Pressable
                  accessibilityRole="button"
                  onPress={loadCvs}
                  style={[styles.retryButton, { backgroundColor: theme.backgroundSelected }]}>
                  <ThemedText style={[styles.retryText, { color: theme.primary }]}>
                    Thử lại
                  </ThemedText>
                </Pressable>
              </View>
            ) : loadState.items.length === 0 ? (
              <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                <Briefcase size={24} color={theme.textSecondary} />
                <ThemedText style={styles.stateTitle}>Bạn chưa có CV nào</ThemedText>
                <ThemedText style={[styles.stateText, { color: theme.textSecondary }]}>
                  Tạo CV trước rồi quay lại nộp đơn.
                </ThemedText>
              </View>
            ) : (
              loadState.items.map((cv) => {
                const selected = cv.id === selectedId;
                return (
                  <Pressable
                    key={cv.id}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setSelectedId(cv.id)}
                    style={[
                      styles.cvOption,
                      {
                        borderColor: selected ? theme.primary : theme.border,
                        backgroundColor: selected ? `${theme.primary}0D` : 'transparent',
                      },
                    ]}>
                    <FileText size={16} color={theme.primary} style={styles.cvIcon} />
                    <View style={styles.cvCopy}>
                      <ThemedText numberOfLines={1} style={styles.cvName}>
                        {cv.name}
                      </ThemedText>
                      <ThemedText
                        numberOfLines={1}
                        style={[styles.cvMeta, { color: theme.textSecondary }]}>
                        {cv.role}
                      </ThemedText>
                    </View>
                    {cv.isDefault ? <PillBadge>Mặc định</PillBadge> : null}
                  </Pressable>
                );
              })
            )}
          </ScrollView>

          {loadState.status === 'ready' && loadState.source === 'demo' ? (
            <ThemedText style={[styles.demoNote, { color: theme.textSecondary }]}>
              Danh sách CV đang dùng dữ liệu minh họa.
            </ThemedText>
          ) : null}

          {submitError ? (
            <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
              {submitError}
            </ThemedText>
          ) : null}

          <View
            style={[
              styles.footer,
              { borderTopColor: theme.border, borderTopWidth: StyleSheet.hairlineWidth },
            ]}>
            <Pressable
              accessibilityRole="button"
              disabled={submitting}
              onPress={handleClose}
              style={({ pressed }) => [
                styles.cancelButton,
                { backgroundColor: pressed ? theme.muted : 'transparent' },
              ]}>
              <ThemedText style={[styles.cancelText, { color: theme.textSecondary }]}>
                Huỷ
              </ThemedText>
            </Pressable>
            <Button
              pill
              size="lg"
              disabled={!canApply}
              onPress={handleApply}
              icon={
                submitting ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : undefined
              }>
              {submitting ? 'Đang nộp...' : 'Xác nhận nộp đơn'}
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius['2xl'] + 8, // rounded-3xl = 24
    borderTopRightRadius: Radius['2xl'] + 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontFamily: font('semibold'),
    fontSize: 17,
    lineHeight: 24,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 22,
    marginTop: 4,
  },
  scroll: { flexShrink: 1, marginTop: 16 },
  list: { gap: 8, paddingBottom: 8 },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  loadingText: { fontFamily: font('medium'), fontSize: 13 },
  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 24,
  },
  emptyBox: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    borderStyle: 'dashed',
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
  },
  stateTitle: { fontFamily: font('medium'), fontSize: 14, textAlign: 'center' },
  stateText: { fontFamily: font('regular'), fontSize: 12, textAlign: 'center' },
  retryButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.pill, marginTop: 4 },
  retryText: { fontFamily: font('semibold'), fontSize: 12 },
  cvOption: {
    minHeight: 60,
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cvIcon: { flexShrink: 0 },
  cvCopy: { flex: 1, minWidth: 0, gap: 2 },
  cvName: { fontFamily: font('semibold'), fontSize: 14 },
  cvMeta: { fontFamily: font('regular'), fontSize: 12 },
  demoNote: { fontFamily: font('regular'), fontSize: 11, textAlign: 'center', marginTop: 6 },
  errorText: { fontFamily: font('medium'), fontSize: 12, lineHeight: 18, marginTop: 10 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 14,
    paddingTop: 14,
  },
  cancelButton: {
    minHeight: 40,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: { fontFamily: font('medium'), fontSize: 14 },
});
