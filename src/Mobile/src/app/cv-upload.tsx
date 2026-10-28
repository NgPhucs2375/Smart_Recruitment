import * as DocumentPicker from 'expo-document-picker';
import { router, useFocusEffect } from 'expo-router';
import { AlertCircle, CheckCircle2, FileText, Star, Upload, X } from 'lucide-react-native';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { font, Palette, Radius } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { cvApi } from '@/features/cv/api/cv-api';
import { formatCvFileSize } from '@/features/cv/cv-format';
import type { CvUploadFile } from '@/features/cv/types';
import { profileApi } from '@/features/profile/api/profile-api';
import type { CandidateProfile } from '@/features/profile/types';
import { useTheme } from '@/hooks/use-theme';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const PDF_MIME = 'application/pdf';
const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback;
}

function extensionOf(name: string): string {
  return name.split('.').pop()?.toLowerCase() ?? '';
}

function mimeForExtension(extension: string): string {
  return extension === 'pdf' ? PDF_MIME : DOCX_MIME;
}

export default function CvUploadScreen() {
  const theme = useTheme();
  const { user } = useAuth();
  const fallbackName = user?.fullname || user?.userName || user?.email || 'Người dùng';
  const fallbackEmail = user?.email ?? '';

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [file, setFile] = useState<CvUploadFile | null>(null);
  const [fileError, setFileError] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stage, setStage] = useState('');

  const fallback = useMemo(
    () => ({ name: fallbackName, email: fallbackEmail }),
    [fallbackEmail, fallbackName],
  );

  const loadContext = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [profileResult, cvsResult] = await Promise.allSettled([
        profileApi.getMine(fallback),
        cvApi.listMine(),
      ]);

      if (profileResult.status === 'rejected') throw profileResult.reason;
      setProfile(profileResult.value.profile);
      if (cvsResult.status === 'fulfilled') {
        setIsDefault(cvsResult.value.items.length === 0);
      }
    } catch (reason) {
      setLoadError(
        errorMessage(reason, 'Không thể tải hồ sơ ứng viên. Vui lòng thử lại.'),
      );
    } finally {
      setLoading(false);
    }
  }, [fallback]);

  useFocusEffect(
    useCallback(() => {
      void loadContext();
    }, [loadContext]),
  );

  const pickFile = async () => {
    setFileError('');
    setSubmitError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [PDF_MIME, DOCX_MIME],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const extension = extensionOf(asset.name);
      if (extension !== 'pdf' && extension !== 'docx') {
        setFileError('Chỉ chấp nhận CV định dạng PDF hoặc DOCX.');
        return;
      }
      if (asset.size && asset.size > MAX_FILE_SIZE) {
        setFileError('Dung lượng CV tối đa là 10 MB.');
        return;
      }

      setFile({
        uri: asset.uri,
        name: asset.name,
        size: asset.size ?? 0,
        mimeType: mimeForExtension(extension),
        file: asset.file,
      });
      setSessionId(null);
    } catch (reason) {
      setFileError(errorMessage(reason, 'Không thể chọn tệp. Vui lòng thử lại.'));
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileError('');
    setSubmitError('');
    setSessionId(null);
  };

  const submit = async () => {
    setSubmitError('');
    const hoSoUngVienId = profile?.id ? Number(profile.id) : 0;
    if (!hoSoUngVienId) {
      setSubmitError('Bạn cần hoàn thiện hồ sơ ứng viên trước khi tải CV lên.');
      return;
    }
    if (!file) {
      setFileError('Vui lòng chọn tệp CV PDF hoặc DOCX.');
      return;
    }

    setSubmitting(true);
    try {
      let currentSession = sessionId;
      if (!currentSession) {
        setStage('Đang chuẩn bị tệp');
        const prepared = await cvApi.prepareImport(hoSoUngVienId, file);
        currentSession = prepared.sessionId;
        setSessionId(currentSession);
      }

      setStage('Đang mở trình chỉnh sửa CV');
      router.replace({
        pathname: '/tao-cv/[id]',
        params: {
          id: 'new',
          importSession: currentSession,
          importFile: file.name,
        },
      });
    } catch (reason) {
      setSubmitError(
        errorMessage(reason, 'Không thể tải CV lên. Vui lòng thử lại.'),
      );
    } finally {
      setSubmitting(false);
      setStage('');
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StackHeader title="Tải CV lên" />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Đang chuẩn bị biểu mẫu
          </ThemedText>
        </View>
      ) : loadError ? (
        <View style={styles.stateWrap}>
          <Card style={styles.stateCard}>
            <AlertCircle size={30} color={theme.destructive} />
            <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
              Không thể tải biểu mẫu
            </ThemedText>
            <ThemedText style={[styles.stateText, { color: theme.textSecondary }]}>
              {loadError}
            </ThemedText>
            <Button variant="outline" onPress={loadContext}>
              Thử lại
            </Button>
          </Card>
        </View>
      ) : !profile?.id ? (
        <View style={styles.stateWrap}>
          <Card style={styles.stateCard}>
            <FileText size={30} color={theme.primary} />
            <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
              Cần hồ sơ ứng viên
            </ThemedText>
            <ThemedText style={[styles.stateText, { color: theme.textSecondary }]}>
              Hãy tạo hoặc cập nhật hồ sơ trước, sau đó quay lại để tải CV lên.
            </ThemedText>
            <Button onPress={() => router.push('/profile-edit')}>Cập nhật hồ sơ</Button>
          </Card>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <View style={styles.intro}>
            <ThemedText style={[styles.heading, { color: theme.text }]}>
              Tải CV của bạn lên
            </ThemedText>
            <ThemedText style={[styles.caption, { color: theme.textSecondary }]}>
              Hệ thống lưu nguyên bản tệp và dùng thông tin hồ sơ hiện tại để điền phần liên hệ.
            </ThemedText>
          </View>

          <Card style={styles.formCard}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>
              TỆP CV
            </ThemedText>
            {file ? (
              <View
                style={[
                  styles.fileCard,
                  { borderColor: theme.border, backgroundColor: theme.muted },
                ]}>
                <View style={[styles.fileIcon, { backgroundColor: `${theme.primary}16` }]}>
                  <FileText size={22} color={theme.primary} />
                </View>
                <View style={styles.fileCopy}>
                  <ThemedText numberOfLines={2} style={[styles.fileName, { color: theme.text }]}>
                    {file.name}
                  </ThemedText>
                  <ThemedText style={[styles.fileMeta, { color: theme.textSecondary }]}>
                    {`${extensionOf(file.name).toUpperCase()} · ${formatCvFileSize(file.size)}`}
                  </ThemedText>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Bỏ tệp đã chọn"
                  hitSlop={8}
                  disabled={submitting}
                  onPress={removeFile}
                  style={({ pressed }) => [
                    styles.removeButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}>
                  <X size={18} color={theme.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => void pickFile()}
                style={({ pressed }) => [
                  styles.dropzone,
                  {
                    borderColor: fileError ? theme.destructive : theme.border,
                    backgroundColor: theme.muted,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}>
                <View style={[styles.uploadIcon, { backgroundColor: `${theme.primary}14` }]}>
                  <Upload size={24} color={theme.primary} />
                </View>
                <ThemedText style={[styles.dropTitle, { color: theme.text }]}>
                  Chọn tệp PDF hoặc DOCX
                </ThemedText>
                <ThemedText style={[styles.dropHint, { color: theme.textSecondary }]}>
                  Dung lượng tối đa 10 MB
                </ThemedText>
              </Pressable>
            )}

            {fileError ? (
              <View style={styles.inlineError}>
                <AlertCircle size={15} color={theme.destructive} />
                <ThemedText style={[styles.inlineErrorText, { color: theme.destructive }]}>
                  {fileError}
                </ThemedText>
              </View>
            ) : null}

            {file ? (
              <Button
                variant="outline"
                size="sm"
                disabled={submitting}
                onPress={() => void pickFile()}
                style={styles.changeFile}>
                Chọn tệp khác
              </Button>
            ) : null}
          </Card>

          <Card style={styles.formCard}>
            <View style={styles.switchRow}>
              <View style={[styles.switchIcon, { backgroundColor: `${Palette.sand}33` }]}>
                <Star size={18} color={Palette.bronze} />
              </View>
              <View style={styles.switchCopy}>
                <ThemedText style={[styles.switchTitle, { color: theme.text }]}>
                  Đặt làm CV mặc định
                </ThemedText>
                <ThemedText style={[styles.switchHint, { color: theme.textSecondary }]}>
                  CV mặc định được chọn sẵn khi ứng tuyển.
                </ThemedText>
              </View>
              <Switch
                value={isDefault}
                onValueChange={setIsDefault}
                disabled={submitting}
                trackColor={{ false: theme.border, true: `${theme.primary}80` }}
                thumbColor={isDefault ? theme.primary : theme.backgroundElement}
              />
            </View>
          </Card>

          {submitError ? (
            <View
              style={[
                styles.submitError,
                {
                  backgroundColor: `${theme.destructive}12`,
                  borderColor: `${theme.destructive}33`,
                },
              ]}>
              <AlertCircle size={16} color={theme.destructive} />
              <ThemedText style={[styles.submitErrorText, { color: theme.destructive }]}>
                {submitError}
              </ThemedText>
            </View>
          ) : null}

          <View style={styles.submitBlock}>
            <Button
              size="lg"
              disabled={submitting}
              onPress={() => void submit()}
              icon={
                submitting ? (
                  <ActivityIndicator size="small" color={theme.primaryForeground} />
                ) : (
                  <CheckCircle2 size={18} color={theme.primaryForeground} />
                )
              }>
              {submitting
                ? stage || 'Đang tải CV'
                : sessionId
                  ? 'Thử lưu lại'
                  : 'Tải CV lên'}
            </Button>
            <ThemedText style={[styles.privacy, { color: theme.textSecondary }]}>
              Bằng cách tải lên, bạn xác nhận tệp thuộc quyền sử dụng của mình.
            </ThemedText>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: font('regular'),
    fontSize: 13,
  },
  stateWrap: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  stateCard: {
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  stateTitle: {
    fontFamily: font('semibold'),
    fontSize: 17,
  },
  stateText: {
    textAlign: 'center',
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 36,
    gap: 16,
  },
  intro: {
    gap: 6,
  },
  heading: {
    fontFamily: font('bold'),
    fontSize: 24,
    lineHeight: 31,
  },
  caption: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
  },
  formCard: {
    padding: 16,
    gap: 10,
  },
  label: {
    fontFamily: font('semibold'),
    fontSize: 10,
    lineHeight: 15,
    letterSpacing: 1,
  },
  dropzone: {
    minHeight: 150,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 18,
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  dropTitle: {
    fontFamily: font('semibold'),
    fontSize: 14,
  },
  dropHint: {
    fontFamily: font('regular'),
    fontSize: 12,
  },
  fileCard: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  fileIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileCopy: {
    flex: 1,
    gap: 2,
  },
  fileName: {
    fontFamily: font('semibold'),
    fontSize: 13,
    lineHeight: 18,
  },
  fileMeta: {
    fontFamily: font('regular'),
    fontSize: 11,
  },
  removeButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeFile: {
    alignSelf: 'flex-start',
  },
  inlineError: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  inlineErrorText: {
    flex: 1,
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 18,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchIcon: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchCopy: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontFamily: font('semibold'),
    fontSize: 14,
  },
  switchHint: {
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 17,
  },
  submitError: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  submitErrorText: {
    flex: 1,
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 18,
  },
  submitBlock: {
    gap: 8,
    marginTop: 2,
  },
  privacy: {
    textAlign: 'center',
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 16,
  },
});