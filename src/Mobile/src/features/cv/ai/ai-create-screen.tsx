import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  FileText,
  RotateCcw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { safeBack } from '@/utils/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { font, Palette, Radius } from '@/constants/theme';
import {
  buildSuggestThemesPayload,
  parseCvText,
  suggestThemes,
  themeScorePercent,
  type ParsedCv,
  type SuggestedTheme,
} from '@/features/cv/ai/ai-api';
import { parsedToCvFormData } from '@/features/cv/ai/mapping';
import { CvInput } from '@/features/cv/components/fields';
import { stashImportedContent } from '@/features/cv/components/import-cv';
import type { CvFormData } from '@/features/cv/types';
import { useTheme } from '@/hooks/use-theme';

type Step = 'input' | 'parsing' | 'result';

export function AiCreateScreen() {
  const theme = useTheme();
  const mountedRef = useRef(true);
  const cancelRef = useRef(false);

  const [step, setStep] = useState<Step>('input');
  const [rawText, setRawText] = useState('');
  const [viTri, setViTri] = useState('');
  const [nganh, setNganh] = useState('');
  const [capBac, setCapBac] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedCv | null>(null);
  const [form, setForm] = useState<CvFormData | null>(null);
  const [themes, setThemes] = useState<SuggestedTheme[] | null>(null);
  const [suggesting, setSuggesting] = useState(false);
  const [suggestError, setSuggestError] = useState<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cancelRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (step !== 'parsing') return;
    setElapsed(0);
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 500);
    return () => clearInterval(timer);
  }, [step]);

  const trimmed = rawText.trim();
  const busy = step === 'parsing';

  const handleParse = () => {
    if (!trimmed || busy) return;
    setParseError(null);
    setParsed(null);
    setForm(null);
    setThemes(null);
    setSuggestError(null);
    cancelRef.current = false;
    setStep('parsing');
    void (async () => {
      try {
        const result = await parseCvText({
          fileName: 'cv-dan.txt',
          fileType: 'text/plain',
          fileSize: trimmed.length,
          rawText: trimmed,
        });
        if (cancelRef.current || !mountedRef.current) return;
        const mapped = parsedToCvFormData(result);
        if (!mapped) {
          setParseError(
            'AI chưa trích xuất được nội dung nào. Hãy dán nội dung chi tiết hơn (họ tên, kinh nghiệm, kỹ năng…) rồi thử lại.',
          );
          setStep('input');
          return;
        }
        setParsed(result);
        setForm(mapped);
        setViTri((prev) => prev || result.noiDung.thongTinLienHe.viTriUngTuyen);
        setStep('result');
      } catch (reason) {
        if (cancelRef.current || !mountedRef.current) return;
        setParseError(
          reason instanceof Error
            ? reason.message
            : 'Không phân tích được CV. Thử lại hoặc nhập nội dung thủ công.',
        );
        setStep('input');
      }
    })();
  };

  const handleCancelParse = () => {
    cancelRef.current = true;
    setStep('input');
    setElapsed(0);
  };

  const handleReset = () => {
    cancelRef.current = true;
    setParsed(null);
    setForm(null);
    setThemes(null);
    setParseError(null);
    setSuggestError(null);
    setStep('input');
  };

  const openBuilder = (templateId?: string) => {
    if (!form) return;
    stashImportedContent({
      partial: form,
      sessionId: '',
      fileName: form.tenFile || 'CV từ AI',
    });
    router.push({
      pathname: '/tao-cv/[id]',
      params: { id: 'new', ...(templateId ? { template: templateId } : {}) },
    });
  };

  const handleSuggest = () => {
    if (!form || suggesting) return;
    setSuggesting(true);
    setSuggestError(null);
    void (async () => {
      try {
        const result = await suggestThemes(
          buildSuggestThemesPayload({
            viTri,
            nganh,
            capBac,
            kyNang: form.kyNang.map((item) => item.tenKyNang).filter(Boolean),
          }),
        );
        if (!mountedRef.current) return;
        setThemes(result);
        if (result.length === 0) {
          setSuggestError('Chưa tìm được mẫu phù hợp. Thử nhập thêm vị trí/ngành rồi gợi ý lại.');
        }
      } catch (reason) {
        if (!mountedRef.current) return;
        setSuggestError(
          reason instanceof Error ? reason.message : 'Không gợi ý được mẫu CV. Thử lại sau.',
        );
      } finally {
        if (mountedRef.current) setSuggesting(false);
      }
    })();
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.root, { backgroundColor: theme.background }]}>
      <View
        style={[
          styles.topBar,
          { borderBottomColor: theme.border, backgroundColor: theme.backgroundElement },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          onPress={() => safeBack('/tao-cv')}
          hitSlop={8}
          style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}>
          <ArrowLeft size={20} color={theme.text} />
        </Pressable>
        <ThemedText style={[styles.topBarTitle, { color: theme.text }]} numberOfLines={1}>
          Tạo CV với AI
        </ThemedText>
        <View style={styles.backButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {step !== 'result' ? (
            <>
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <ThemedText style={{ color: theme.text }} type="smallBold">
                  Nội dung CV
                </ThemedText>
                <TextInput
                  value={rawText}
                  onChangeText={(value) => {
                    setRawText(value);
                    setParseError(null);
                  }}
                  placeholder="Dán nội dung CV (hoặc mô tả bạn muốn AI dựng CV)…"
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  editable={!busy}
                  textAlignVertical="top"
                  style={[
                    styles.multiline,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.input,
                      color: theme.text,
                    },
                  ]}
                />
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  Chép nội dung CV rồi paste vào ô trên — ứng dụng không đọc trực tiếp file
                  PDF/DOCX.
                </ThemedText>
                <View style={styles.rowEnd}>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={busy || !rawText}
                    onPress={() => {
                      setRawText('');
                      setParseError(null);
                    }}
                    icon={<Trash2 size={14} color={theme.textSecondary} />}
                    accessibilityLabel="Xóa nội dung đã dán">
                    Xóa
                  </Button>
                </View>
              </View>

              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    detailsOpen ? 'Ẩn thông tin gợi ý mẫu' : 'Thêm thông tin gợi ý mẫu'
                  }
                  onPress={() => setDetailsOpen((open) => !open)}
                  style={styles.collapsibleHeader}>
                  <ThemedText style={{ color: theme.text }} type="smallBold">
                    Thông tin gợi ý mẫu (không bắt buộc)
                  </ThemedText>
                  {detailsOpen ? (
                    <ChevronDown size={16} color={theme.textSecondary} />
                  ) : (
                    <ChevronRight size={16} color={theme.textSecondary} />
                  )}
                </Pressable>
                {detailsOpen ? (
                  <View style={styles.stack}>
                    <CvInput
                      label="Vị trí"
                      value={viTri}
                      onChangeText={setViTri}
                      placeholder="VD: Frontend Developer"
                      disabled={busy}
                    />
                    <CvInput
                      label="Ngành"
                      value={nganh}
                      onChangeText={setNganh}
                      placeholder="VD: Công nghệ thông tin"
                      disabled={busy}
                    />
                    <CvInput
                      label="Cấp bậc"
                      value={capBac}
                      onChangeText={setCapBac}
                      placeholder="VD: Junior / Middle / Senior"
                      disabled={busy}
                    />
                  </View>
                ) : null}
              </View>

              {parseError ? (
                <View
                  style={[
                    styles.errorBox,
                    {
                      borderColor: `${theme.destructive}66`,
                      backgroundColor: `${theme.destructive}14`,
                    },
                  ]}>
                  <View style={styles.rowGap}>
                    <AlertTriangle size={16} color={theme.destructive} />
                    <ThemedText style={{ color: theme.destructive }} type="smallBold">
                      Không phân tích được CV
                    </ThemedText>
                  </View>
                  <ThemedText style={{ color: theme.text }} type="small">
                    {parseError}
                  </ThemedText>
                  <ThemedText style={{ color: theme.textSecondary }} type="code">
                    Thử lại hoặc nhập nội dung thủ công trong trình tạo CV.
                  </ThemedText>
                </View>
              ) : null}

              {busy ? (
                <View
                  style={[
                    styles.card,
                    styles.centered,
                    { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                  ]}>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <ThemedText
                    style={{ color: theme.text, textAlign: 'center' }}
                    type="small">
                    {`Đang phân tích CV bằng AI (30–90 giây)…\nđã chờ ${elapsed} giây`}
                  </ThemedText>
                  <Button variant="outline" onPress={handleCancelParse}>
                    Hủy phân tích
                  </Button>
                </View>
              ) : (
                <Button
                  size="lg"
                  onPress={handleParse}
                  disabled={!trimmed}
                  icon={<Sparkles size={16} color={theme.primaryForeground} />}
                  accessibilityLabel="Phân tích CV bằng AI">
                  Phân tích CV
                </Button>
              )}
            </>
          ) : null}

          {step === 'result' && parsed && form ? (
            <>
              <View
                style={[
                  styles.card,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                ]}>
                <View style={styles.rowBetween}>
                  <View style={styles.rowGap}>
                    <FileText size={16} color={theme.primary} />
                    <ThemedText
                      style={{ color: theme.text, flexShrink: 1 }}
                      type="smallBold"
                      numberOfLines={1}>
                      {parsed.tenFile || 'cv-dan.txt'}
                    </ThemedText>
                  </View>
                  <Badge variant="secondary">Đã phân tích</Badge>
                </View>
                <ThemedText style={{ color: theme.text }} type="small">
                  {parsed.noiDung.thongTinLienHe.hoTen || 'Chưa nhận diện được họ tên'}
                  {parsed.noiDung.thongTinLienHe.sdt
                    ? ` · ${parsed.noiDung.thongTinLienHe.sdt}`
                    : ''}
                </ThemedText>
                <View style={styles.badgeRow}>
                  <Badge variant="outline">{`${form.kinhNghiemLamViec.length} kinh nghiệm`}</Badge>
                  <Badge variant="outline">{`${form.hocVan.length} học vấn`}</Badge>
                  <Badge variant="outline">{`${form.kyNang.length} kỹ năng`}</Badge>
                  {form.duAn.length > 0 ? (
                    <Badge variant="outline">{`${form.duAn.length} dự án`}</Badge>
                  ) : null}
                  {form.chungChi.length > 0 ? (
                    <Badge variant="outline">{`${form.chungChi.length} chứng chỉ`}</Badge>
                  ) : null}
                </View>
                {parsed.canhBao.length > 0 ? (
                  <View style={styles.stack}>
                    {parsed.canhBao.map((warning, index) => (
                      <View
                        key={`${warning.field}-${index}`}
                        style={[styles.rowGap, styles.alignStart]}>
                        <AlertTriangle size={14} color={Palette.bronze} style={styles.warnIcon} />
                        <ThemedText
                          style={{ color: theme.textSecondary, flex: 1 }}
                          type="code">
                          {warning.message || warning.field}
                        </ThemedText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              <Button
                size="lg"
                onPress={() => openBuilder()}
                icon={<Wand2 size={16} color={theme.primaryForeground} />}
                accessibilityLabel="Áp dụng và mở trình tạo CV">
                Áp dụng &amp; mở trình tạo CV
              </Button>
              <Button
                variant="outline"
                size="lg"
                onPress={handleSuggest}
                disabled={suggesting}
                icon={<Sparkles size={16} color={theme.text} />}
                accessibilityLabel="Gợi ý mẫu CV">
                {suggesting ? 'Đang gợi ý…' : 'Gợi ý mẫu CV'}
              </Button>

              {suggesting ? (
                <View style={[styles.centered, styles.rowGap]}>
                  <ActivityIndicator color={theme.primary} />
                  <ThemedText style={{ color: theme.textSecondary }} type="code">
                    Đang gợi ý mẫu CV phù hợp…
                  </ThemedText>
                </View>
              ) : null}

              {suggestError && !suggesting ? (
                <ThemedText style={{ color: theme.destructive }} type="code">
                  {suggestError}
                </ThemedText>
              ) : null}

              {themes && !suggesting
                ? themes.map((item) => (
                    <View
                      key={item.slug}
                      style={[
                        styles.card,
                        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
                      ]}>
                      <View style={styles.rowBetween}>
                        <ThemedText
                          style={{ color: theme.text, flexShrink: 1 }}
                          type="smallBold"
                          numberOfLines={1}>
                          {item.ten}
                        </ThemedText>
                        <Badge variant="secondary">{`${themeScorePercent(item)}%`}</Badge>
                      </View>
                      {item.moTaNgan ? (
                        <ThemedText style={{ color: theme.textSecondary }} type="code">
                          {item.moTaNgan}
                        </ThemedText>
                      ) : null}
                      {item.lyDo ? (
                        <ThemedText style={{ color: theme.text }} type="small">
                          {item.lyDo}
                        </ThemedText>
                      ) : null}
                      <View style={styles.badgeRow}>
                        {item.thanThienATS ? (
                          <Badge variant="ghost">Thân thiện ATS</Badge>
                        ) : null}
                        {item.viTri ? <Badge variant="outline">{item.viTri}</Badge> : null}
                        {item.capBac ? <Badge variant="outline">{item.capBac}</Badge> : null}
                      </View>
                      {item.canhBao.map((warning, index) => (
                        <View
                          key={`${item.slug}-warn-${index}`}
                          style={[styles.rowGap, styles.alignStart]}>
                          <AlertTriangle size={14} color={Palette.bronze} style={styles.warnIcon} />
                          <ThemedText style={{ color: theme.textSecondary, flex: 1 }} type="code">
                            {warning}
                          </ThemedText>
                        </View>
                      ))}
                      <Button
                        size="sm"
                        onPress={() => openBuilder(item.slug)}
                        accessibilityLabel={`Dùng mẫu ${item.ten}`}>
                        Dùng mẫu
                      </Button>
                    </View>
                  ))
                : null}

              <Button
                variant="ghost"
                onPress={handleReset}
                icon={<RotateCcw size={14} color={theme.textSecondary} />}>
                Phân tích lại
              </Button>
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: font('semibold'),
    fontSize: 15,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { padding: 16, gap: 12, paddingBottom: 48 },
  card: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 14,
    gap: 10,
  },
  multiline: {
    minHeight: 160,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: font('regular'),
    fontSize: 14,
    lineHeight: 20,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  stack: { gap: 8 },
  rowGap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  alignStart: { alignItems: 'flex-start' },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  rowEnd: { flexDirection: 'row', justifyContent: 'flex-end' },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  centered: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 12,
    gap: 6,
  },
  warnIcon: { marginTop: 2 },
});
