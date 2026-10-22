import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Ellipsis, Eye, Info, Save, Sparkles } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Radius } from '@/constants/theme';
import { cvApi } from '@/features/cv/api/cv-api';
import {
  ChecklistCard,
  LayoutPanel,
  QualityCard,
  TemplatePickerPanel,
  computeCvQuality,
} from '@/features/cv/components/builder-panels';
import { ManualCvForm } from '@/features/cv/components/manual-cv-form';
import { PreviewModal } from '@/features/cv/components/preview-modal';
import {
  mergeImportedPartial,
  runCvImport,
  takeImportedContent,
} from '@/features/cv/components/import-cv';
import {
  AUTOSAVE_DELAY_MS,
  clearDraft,
  readDraft,
  writeDraft,
} from '@/features/cv/draft';
import { cloneCvData, defaultCvData } from '@/features/cv/manual/default-cv-data';
import { isoToVnDate } from '@/features/cv/manual/cv-data';
import { manualCvDetailToForm } from '@/features/cv/manual/manual-cv-mapper';
import { validateManualCv } from '@/features/cv/manual/manual-cv-validation';
import { exportCvPdf } from '@/features/cv/export-pdf';
import { isKnownTemplateId, resolveTemplateId } from '@/features/cv/template-registry';
import type { CvFormData } from '@/features/cv/types';
import { profileApi } from '@/features/profile/api/profile-api';
import type { CandidateProfile } from '@/features/profile/types';
import { useTheme } from '@/hooks/use-theme';

const SECTIONS: { id: string; label: string }[] = [
  { id: 'contact', label: 'Liên hệ' },
  { id: 'templates', label: 'Mẫu & bố cục' },
  { id: 'experience', label: 'Kinh nghiệm' },
  { id: 'education', label: 'Học vấn' },
  { id: 'skills', label: 'Kỹ năng' },
  { id: 'projects', label: 'Dự án' },
  { id: 'certificates', label: 'Chứng chỉ' },
];

type Phase = 'loading' | 'ready' | 'error';

function firstOf(value?: string | string[]): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function baseNameOf(fileName: string): string {
  return fileName.replace(/\.(pdf|docx?|json)$/i, '').trim();
}

export default function BuilderScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    importSession?: string;
    importFile?: string;
    template?: string;
  }>();

  const idParam = firstOf(params.id) ?? 'new';
  const templateParam = firstOf(params.template);
  const importSessionParam = firstOf(params.importSession);
  const importFileParam = firstOf(params.importFile);
  const loadKey = `${idParam}|${templateParam ?? ''}`;

  const [cvData, setCvData] = useState<CvFormData | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hoSoId, setHoSoId] = useState<number | null>(null);
  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [selectedCvId, setSelectedCvId] = useState<string | null>(
    idParam === 'new' ? null : idParam,
  );
  const [importSessionId, setImportSessionId] = useState<string | null>(
    importSessionParam ?? null,
  );
  const [lastSavedJson, setLastSavedJson] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [draftAt, setDraftAt] = useState<Date | null>(null);
  const [pendingDraft, setPendingDraft] = useState<{
    savedAt: number;
    data: CvFormData;
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('contact');
  const mountedRef = useRef(true);
  const scrollRef = useRef<ScrollView>(null);
  const sectionYs = useRef<Record<string, number>>({});
  const stackY = useRef(0);

  const phase: Phase =
    loadedKey === loadKey ? (loadError ? 'error' : 'ready') : 'loading';

  const dirty = useMemo(() => {
    if (!cvData || lastSavedJson === null) return false;
    return JSON.stringify(cvData) !== lastSavedJson;
  }, [cvData, lastSavedJson]);

  const saveStatus = saving ? 'saving' : dirty ? 'dirty' : 'saved';
  const quality = useMemo(
    () => (cvData ? computeCvQuality(cvData) : null),
    [cvData],
  );

  const loadBuilder = useCallback(async () => {
    setLoadedKey(null);
    setLoadError(null);
    try {
      let hoSo: number | null = null;
      let loadedProfile: CandidateProfile | null = null;
      try {
        hoSo = await cvApi.getHoSoId();
        const result = await profileApi.getMine({});
        loadedProfile = result.profile;
      } catch {
        hoSo = null;
      }
      if (!mountedRef.current) return;
      setHoSoId(hoSo);
      setProfile(loadedProfile);

      let form: CvFormData;
      let serverUpdatedAt: number | null = null;
      if (idParam !== 'new') {
        const detail = await cvApi.getDetail(idParam);
        if (!mountedRef.current) return;
        form = manualCvDetailToForm(detail, cloneCvData(defaultCvData));
        serverUpdatedAt = detail.ngayUpload ? Date.parse(detail.ngayUpload) : null;
        if (Number.isNaN(serverUpdatedAt ?? NaN)) serverUpdatedAt = null;
      } else {
        form = cloneCvData(defaultCvData);
        if (templateParam && isKnownTemplateId(templateParam)) {
          form.templateId = resolveTemplateId(templateParam);
        }
      }

      const stashed = takeImportedContent();
      if (stashed) {
        form = mergeImportedPartial(form, stashed.partial);
        setImportSessionId(stashed.sessionId);
      }
      if (importSessionParam) {
        setImportSessionId(importSessionParam);
        if (importFileParam && !form.tenFile.trim()) {
          form = { ...form, tenFile: baseNameOf(importFileParam) };
        }
      }

      setCvData(form);
      setLastSavedJson(JSON.stringify(form));
      setSelectedCvId(idParam === 'new' ? null : idParam);
      setLoadError(null);

      const draft = await readDraft(idParam);
      if (draft && JSON.stringify(draft.data) !== JSON.stringify(form)) {
        const newerThanServer =
          serverUpdatedAt === null ? idParam === 'new' : draft.savedAt > serverUpdatedAt;
        if (newerThanServer) {
          setPendingDraft(draft);
          setDraftAt(new Date(draft.savedAt));
        }
      }
      if (!mountedRef.current) return;
      setLoadedKey(loadKey);
    } catch (reason) {
      if (!mountedRef.current) return;
      setLoadError(
        reason instanceof Error ? reason.message : 'Không tải được dữ liệu CV.',
      );
      setLoadedKey(loadKey);
    }
  }, [loadKey, idParam, templateParam, importSessionParam, importFileParam]);

  useEffect(() => {
    mountedRef.current = true;
    const timer = setTimeout(() => {
      void loadBuilder();
    }, 0);
    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [loadBuilder]);

  useEffect(() => {
    if (phase !== 'ready' || saving || !dirty || !cvData) return;
    if (validateManualCv(cvData)) return;
    const snapshot = cvData;
    const owner = selectedCvId ?? 'new';
    const timer = setTimeout(() => {
      void writeDraft(owner, snapshot).then(() => {
        if (mountedRef.current) setDraftAt(new Date());
      });
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [cvData, dirty, phase, saving, selectedCvId]);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const y = (sectionYs.current[id] ?? 0) + stackY.current - 76;
    scrollRef.current?.scrollTo({ y: Math.max(0, y), animated: true });
  };

  const handleSave = () => {
    if (!cvData || saving) return;
    const validationError = validateManualCv(cvData);
    if (validationError) {
      Alert.alert('Chưa thể lưu CV', validationError);
      return;
    }
    setSaving(true);
    void (async () => {
      try {
        let hoSo = hoSoId;
        if (hoSo == null) {
          hoSo = await cvApi.getHoSoId();
          if (!mountedRef.current) return;
          setHoSoId(hoSo);
        }
        const result = await cvApi.saveCv({
          hoSoUngVienId: hoSo,
          cvId: selectedCvId,
          form: cvData,
          importSessionId,
        });
        if (!mountedRef.current) return;
        setSelectedCvId(result.cvId);
        setImportSessionId(null);
        setLastSavedJson(JSON.stringify(cvData));
        setSavedAt(new Date());
        setDraftAt(null);
        setPendingDraft(null);
        void clearDraft(selectedCvId ?? 'new');
        void clearDraft(result.cvId);
        Alert.alert('Đã lưu CV', `Đã lưu phiên bản ${result.soPhienBan} của CV.`);
      } catch (reason) {
        if (mountedRef.current) {
          Alert.alert(
            'Lưu CV thất bại',
            reason instanceof Error ? reason.message : 'Vui lòng thử lại.',
          );
        }
      } finally {
        if (mountedRef.current) setSaving(false);
      }
    })();
  };

  const handleExportPdf = () => {
    if (!cvData || exportingPdf) return;
    setExportingPdf(true);
    void exportCvPdf(cvData)
      .catch((reason: unknown) => {
        Alert.alert(
          'Không thể xuất PDF',
          reason instanceof Error ? reason.message : 'Vui lòng thử lại.',
        );
      })
      .finally(() => {
        if (mountedRef.current) setExportingPdf(false);
      });
  };

  const fillFromHoSo = () => {
    if (!cvData) return;
    void (async () => {
      try {
        const result = await profileApi.getMine({});
        const source = result.profile;
        if (!source) {
          Alert.alert('Chưa có hồ sơ', 'Tạo hồ sơ ứng viên trước khi đổ thông tin.');
          return;
        }
        if (!mountedRef.current) return;
        setProfile(source);
        setCvData((prev) =>
          prev
            ? {
                ...prev,
                thongTinLienHe: {
                  ...prev.thongTinLienHe,
                  hoTen: prev.thongTinLienHe.hoTen || source.fullName || '',
                  email: prev.thongTinLienHe.email || source.email || '',
                  sdt: prev.thongTinLienHe.sdt || source.phone || '',
                  diaChi: prev.thongTinLienHe.diaChi || source.location || '',
                  gioiTinh: prev.thongTinLienHe.gioiTinh || source.gender || '',
                  ngaySinh: prev.thongTinLienHe.ngaySinh || isoToVnDate(source.birthDate),
                  anhDaiDienUrl: prev.thongTinLienHe.anhDaiDienUrl || source.avatarUrl || '',
                },
              }
            : prev,
        );
        Alert.alert('Đã đổ thông tin từ hồ sơ');
      } catch (reason) {
        Alert.alert(
          'Không lấy được hồ sơ',
          reason instanceof Error ? reason.message : 'Vui lòng thử lại.',
        );
      }
    })();
  };

  const handleImportInBuilder = () => {
    if (!cvData) return;
    void (async () => {
      try {
        let hoSo = hoSoId;
        if (hoSo == null) {
          hoSo = await cvApi.getHoSoId();
          if (!mountedRef.current) return;
          setHoSoId(hoSo);
        }
        const outcome = await runCvImport(hoSo);
        if (!outcome || !mountedRef.current) return;
        if (outcome.kind === 'content') {
          setCvData((prev) =>
            prev ? mergeImportedPartial(prev, outcome.partial) : prev,
          );
          setImportSessionId(outcome.sessionId);
          Alert.alert('Đã nhập CV', 'Kiểm tra lại các trường rồi bấm Lưu CV.');
        } else {
          setImportSessionId(outcome.sessionId);
          const baseName = baseNameOf(outcome.fileName);
          setCvData((prev) =>
            prev && !prev.tenFile.trim() && baseName ? { ...prev, tenFile: baseName } : prev,
          );
          Alert.alert(
            'Đã lưu file CV gốc',
            'Bạn nhập nội dung thủ công — file gốc vẫn được đính kèm khi lưu.',
          );
        }
      } catch (reason) {
        if (mountedRef.current) {
          Alert.alert(
            'Nhập CV thất bại',
            reason instanceof Error ? reason.message : 'Vui lòng thử lại.',
          );
        }
      }
    })();
  };

  const openMenu = () => {
    const buttons: { text: string; style?: 'default' | 'cancel' | 'destructive'; onPress?: () => void }[] = [
      {
        text: 'CV mới',
        onPress: () => router.replace({ pathname: '/tao-cv/[id]', params: { id: 'new' } }),
      },
      { text: 'Đổ thông tin từ hồ sơ', onPress: fillFromHoSo },
      { text: 'Tải CV lên', onPress: handleImportInBuilder },
      { text: 'Xuất PDF', onPress: handleExportPdf },
    ];
    if (selectedCvId) {
      buttons.push({ text: 'Xóa CV', style: 'destructive', onPress: handleDelete });
    }
    buttons.push({ text: 'Hủy', style: 'cancel' });
    Alert.alert('Thao tác', 'Chọn thao tác với CV hiện tại.', buttons, { cancelable: true });
  };

  const handleDelete = () => {
    if (!selectedCvId) return;
    Alert.alert(
      'Xóa CV này?',
      'CV và các phiên bản đã lưu sẽ bị xóa vĩnh viễn.',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await cvApi.remove(selectedCvId);
                if (!mountedRef.current) return;
                router.replace({ pathname: '/tao-cv/[id]', params: { id: 'new' } });
              } catch (reason) {
                Alert.alert(
                  'Xóa CV thất bại',
                  reason instanceof Error ? reason.message : 'Vui lòng thử lại.',
                );
              }
            })();
          },
        },
      ],
      { cancelable: true },
    );
  };

  const applyDraft = () => {
    if (!pendingDraft) return;
    setCvData(pendingDraft.data);
    setPendingDraft(null);
    Alert.alert('Đã khôi phục bản nháp tự lưu');
  };

  const discardDraft = () => {
    void clearDraft(selectedCvId ?? 'new');
    setPendingDraft(null);
    setDraftAt(null);
  };

  const statusLabel =
    phase === 'loading'
      ? 'Đang tải...'
      : saveStatus === 'saving'
        ? 'Đang lưu...'
        : saveStatus === 'dirty'
          ? draftAt
            ? `Nháp ${draftAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
            : 'Chưa lưu'
          : savedAt
            ? `Đã lưu ${savedAt.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
            : 'Đã lưu';
  const statusColor =
    saveStatus === 'saving'
      ? theme.primary
      : saveStatus === 'dirty'
        ? '#b45309'
        : '#0d9488';

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.background }]}>
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <Button
          variant="ghost"
          size="icon"
          onPress={() => router.back()}
          accessibilityLabel="Quay lại"
          icon={<ArrowLeft size={18} color={theme.text} />}
        />
        <ThemedText style={{ color: theme.text, flex: 1 }} type="smallBold" numberOfLines={1}>
          Trình tạo CV
        </ThemedText>
        <View style={[styles.statusPill, { borderColor: theme.border }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <ThemedText style={{ color: theme.textSecondary }} type="code" numberOfLines={1}>
            {statusLabel}
          </ThemedText>
        </View>
        <View style={styles.topActions}>
          <Button
            variant="outline"
            size="icon"
            onPress={() => setPreviewOpen(true)}
            disabled={phase !== 'ready' || !cvData}
            accessibilityLabel="Xem trước CV"
            icon={<Eye size={16} color={theme.text} />}
          />
          <Button
            size="sm"
            onPress={handleSave}
            disabled={saving || phase !== 'ready'}
            accessibilityLabel="Lưu CV"
            icon={<Save size={14} color={theme.primaryForeground} />}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onPress={openMenu}
            accessibilityLabel="Thao tác"
            icon={<Ellipsis size={16} color={theme.text} />}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {phase === 'loading' ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={{ color: theme.textSecondary }} type="small">
              Đang tải trình tạo CV…
            </ThemedText>
          </View>
        ) : null}

        {phase === 'error' ? (
          <View style={[styles.errorBox, { borderColor: theme.border }]}>
            <ThemedText style={{ color: theme.text }} type="smallBold">
              Không tải được dữ liệu CV
            </ThemedText>
            <ThemedText style={{ color: theme.textSecondary }} type="small">
              {loadError}
            </ThemedText>
            <Button
              variant="outline"
              onPress={() => {
                void loadBuilder();
              }}
              style={{ marginTop: 8 }}>
              Thử lại
            </Button>
          </View>
        ) : null}

        {phase === 'ready' && cvData && quality ? (
          <>
            {pendingDraft ? (
              <View style={[styles.draftBanner, { borderColor: theme.border, backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={{ color: theme.text }} type="small">
                  Đã tìm thấy bản nháp tự lưu (chưa lưu lên server)
                  {pendingDraft.savedAt
                    ? ` lúc ${new Date(pendingDraft.savedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                    : ''}
                  . Khôi phục nội dung nháp?
                </ThemedText>
                <View style={styles.draftActions}>
                  <Button variant="outline" size="sm" onPress={discardDraft}>
                    Bỏ qua
                  </Button>
                  <Button size="sm" onPress={applyDraft}>
                    Khôi phục nháp
                  </Button>
                </View>
              </View>
            ) : null}

            <QualityCard progress={quality.progress} label={quality.label} />
            <ChecklistCard items={quality.items} doneCount={quality.doneCount} />

            <View>
              <ThemedText style={[styles.chipHint, { color: theme.textSecondary }]} type="code">
                Nhảy tới section:
              </ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}>
                {SECTIONS.map((section) => {
                  const active = activeSection === section.id;
                  return (
                    <Pressable
                      key={section.id}
                      accessibilityRole="button"
                      onPress={() => scrollToSection(section.id)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: active ? theme.primary : theme.backgroundElement,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}>
                      <ThemedText
                        style={{
                          color: active ? theme.primaryForeground : theme.textSecondary,
                        }}
                        type="code">
                        {section.label}
                      </ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>

            <View
              onLayout={(event) => {
                sectionYs.current.templates = event.nativeEvent.layout.y;
              }}
              style={[styles.section, { borderColor: theme.border }]}>
              <ThemedText style={{ color: theme.text }} type="smallBold">
                Mẫu & bố cục
              </ThemedText>
              <TemplatePickerPanel
                selectedId={cvData.templateId}
                onSelect={(templateId) =>
                  setCvData((prev) =>
                    prev ? { ...prev, templateId, giaoDien: undefined } : prev,
                  )
                }
              />
              <LayoutPanel data={cvData} onChange={setCvData} />
            </View>

            <View
              onLayout={(event) => {
                stackY.current = event.nativeEvent.layout.y;
              }}>
              <ManualCvForm
                data={cvData}
                onChange={setCvData}
                profileAvatarUrl={profile?.avatarUrl ?? null}
                onSectionLayout={(id, y) => {
                  sectionYs.current[id] = y;
                }}
              />
            </View>

            <View style={[styles.footerNote, { borderColor: theme.border }]}>
              <Info size={14} color={theme.primary} />
              <ThemedText style={{ color: theme.textSecondary, flex: 1 }} type="code">
                Lưu ý: Hãy kiểm tra lại thông tin trước khi bấm Lưu CV hoặc Xuất PDF.
              </ThemedText>
            </View>
          </>
        ) : null}
      </ScrollView>

      {cvData && previewOpen ? (
        <PreviewModal
          visible={previewOpen}
          onClose={() => setPreviewOpen(false)}
          data={cvData}
          templateId={cvData.templateId}
        />
      ) : null}

      {exportingPdf ? (
        <View style={[styles.exportingBar, { backgroundColor: theme.backgroundElement }]}>
          <Sparkles size={14} color={theme.primary} />
          <ThemedText style={{ color: theme.text }} type="code">
            Đang xuất PDF…
          </ThemedText>
          <Badge variant="secondary">Đang tạo file</Badge>
        </View>
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusDot: { width: 7, height: 7, borderRadius: 999 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 'auto', flexShrink: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 48 },
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 56 },
  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 16,
    alignItems: 'center',
    gap: 6,
    textAlign: 'center',
  },
  draftBanner: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 12,
    gap: 10,
  },
  draftActions: { flexDirection: 'row', gap: 8, justifyContent: 'flex-end' },
  chipHint: { marginBottom: 6 },
  chipRow: { gap: 8, paddingRight: 8 },
  chip: {
    minHeight: 32,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  section: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 14,
    gap: 12,
  },
  footerNote: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 10,
    alignItems: 'flex-start',
  },
  exportingBar: {
    position: 'absolute',
    bottom: 18,
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: '#0d9488',
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
  },
});
