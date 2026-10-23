import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  FileText,
  Star,
  Trash2,
} from 'lucide-react-native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { StackHeader } from '@/components/stack-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { font, Palette, Radius } from '@/constants/theme';
import { cvApi } from '@/features/cv/api/cv-api';
import {
  CvDetailBody,
  CvVersionsSection,
} from '@/features/cv/components/cv-detail-sections';
import { formatCvDate, sourceLabel } from '@/features/cv/cv-format';
import type { CvDetail, CvVersion } from '@/features/cv/types';
import { useTheme } from '@/hooks/use-theme';

type Notice = {
  kind: 'success' | 'error';
  text: string;
};

type BusyAction = 'default' | 'download' | 'delete' | null;

function getParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

function latestVersion(versions: CvVersion[]): CvVersion | null {
  if (versions.length === 0) return null;
  return versions.reduce((latest, current) =>
    current.number > latest.number ? current : latest,
  );
}

function safeFileName(name: string, id: string): string {
  const base = name.replace(/[\\/:*?"<>|]+/g, '-').trim() || `CV-${id}`;
  return /\.[a-z0-9]{2,5}$/i.test(base) ? base : `${base}.pdf`;
}

function mimeTypeFor(name: string): string {
  return /\.docx$/i.test(name)
    ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    : 'application/pdf';
}

export default function CvDetailScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = getParam(params.id);

  const [detail, setDetail] = useState<CvDetail | null>(null);
  const [versions, setVersions] = useState<CvVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState<BusyAction>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('Thiếu mã CV cần xem.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const [detailResult, versionsResult] = await Promise.allSettled([
        cvApi.getById(id),
        cvApi.getVersions(id),
      ]);

      if (detailResult.status === 'rejected') throw detailResult.reason;
      setDetail(detailResult.value);
      setVersions(versionsResult.status === 'fulfilled' ? versionsResult.value : []);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Không thể tải thông tin CV. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const handleSetDefault = async () => {
    if (!detail || detail.isDefault) return;
    setBusy('default');
    setNotice(null);
    try {
      const message = await cvApi.setDefault(detail.id);
      setDetail({ ...detail, isDefault: true });
      setNotice({ kind: 'success', text: message });
    } catch (reason) {
      setNotice({
        kind: 'error',
        text:
          reason instanceof Error
            ? reason.message
            : 'Không thể đặt CV làm mặc định.',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    if (!detail) return;
    setBusy('download');
    setNotice(null);

    try {
      const hasOriginal =
        detail.method === 2 || versions.some((version) => version.hasOriginal);
      const target = await cvApi.getDownloadUrl(detail.id, {
        original: hasOriginal,
      });
      const fileName = safeFileName(target.name, detail.id);

      if (Platform.OS === 'web') {
        await Linking.openURL(target.url);
        return;
      }

      const FileSystem = await import('expo-file-system/legacy');
      const Sharing = await import('expo-sharing');
      if (!FileSystem.cacheDirectory) {
        throw new Error('Thiết bị không hỗ trợ bộ nhớ tạm để tải CV.');
      }

      const downloaded = await FileSystem.downloadAsync(
        target.url,
        `${FileSystem.cacheDirectory}${fileName}`,
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloaded.uri, {
          mimeType: mimeTypeFor(fileName),
          dialogTitle: 'Chia sẻ hoặc lưu CV',
        });
      } else {
        setNotice({
          kind: 'success',
          text: 'Đã tải CV vào bộ nhớ tạm của thiết bị.',
        });
      }
    } catch (reason) {
      setNotice({
        kind: 'error',
        text:
          reason instanceof Error
            ? reason.message
            : 'Không thể tải CV xuống. Vui lòng thử lại.',
      });
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async () => {
    if (!detail) return;
    setBusy('delete');
    setNotice(null);
    try {
      await cvApi.deleteCv(detail.id);
      setConfirmDelete(false);
      router.replace('/cvs');
    } catch (reason) {
      setConfirmDelete(false);
      setNotice({
        kind: 'error',
        text:
          reason instanceof Error
            ? reason.message
            : 'Không thể xóa CV. Vui lòng thử lại.',
      });
    } finally {
      setBusy(null);
    }
  };

  const latest = latestVersion(versions);
  const updatedAt = latest
    ? formatCvDate(latest.createdAt)
    : detail
      ? detail.uploadedAt
      : '';

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StackHeader title="Chi tiết CV" />
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
            Đang tải thông tin CV
          </ThemedText>
        </View>
      ) : error || !detail ? (
        <View style={styles.stateWrap}>
          <Card style={styles.stateCard}>
            <AlertCircle size={30} color={theme.destructive} />
            <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
              Không thể mở CV
            </ThemedText>
            <ThemedText style={[styles.stateText, { color: theme.textSecondary }]}>
              {error || 'CV không tồn tại hoặc bạn không có quyền xem.'}
            </ThemedText>
            <Button variant="outline" onPress={load}>
              Thử lại
            </Button>
          </Card>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <Card style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={[styles.heroIcon, { backgroundColor: `${theme.primary}16` }]}>
                <FileText size={26} color={theme.primary} />
              </View>
              <View style={styles.heroCopy}>
                <ThemedText style={[styles.heroName, { color: theme.text }]}>
                  {detail.name}
                </ThemedText>
                <ThemedText style={[styles.heroRole, { color: theme.textSecondary }]}>
                  {detail.role || 'Chưa cập nhật vị trí ứng tuyển'}
                </ThemedText>
                <View style={styles.heroBadges}>
                  {detail.isDefault ? (
                    <Badge
                      variant="secondary"
                      backgroundColor={`${Palette.sage}1F`}
                      color={Palette.sage}
                      textStyle={styles.heroBadgeText}>
                      Mặc định
                    </Badge>
                  ) : null}
                  <Badge variant="secondary" textStyle={styles.heroBadgeText}>
                    {sourceLabel(detail.source)}
                  </Badge>
                </View>
              </View>
            </View>

            <View style={[styles.heroMeta, { borderTopColor: theme.border }]}>
              <Clock3 size={14} color={theme.textSecondary} />
              <ThemedText style={[styles.heroMetaText, { color: theme.textSecondary }]}>
                {updatedAt ? `Cập nhật ${updatedAt}` : 'Chưa xác định ngày cập nhật'}
              </ThemedText>
            </View>

            {notice ? (
              <View
                style={[
                  styles.notice,
                  {
                    backgroundColor:
                      notice.kind === 'success'
                        ? `${Palette.sage}16`
                        : `${theme.destructive}12`,
                    borderColor:
                      notice.kind === 'success'
                        ? `${Palette.sage}40`
                        : `${theme.destructive}33`,
                  },
                ]}>
                {notice.kind === 'success' ? (
                  <CheckCircle2 size={16} color={Palette.sage} />
                ) : (
                  <AlertCircle size={16} color={theme.destructive} />
                )}
                <ThemedText
                  style={[
                    styles.noticeText,
                    {
                      color:
                        notice.kind === 'success' ? Palette.sage : theme.destructive,
                    },
                  ]}>
                  {notice.text}
                </ThemedText>
              </View>
            ) : null}

            <View style={styles.actions}>
              <Button
                variant={detail.isDefault ? 'secondary' : 'outline'}
                disabled={detail.isDefault || busy !== null}
                onPress={handleSetDefault}
                icon={<Star size={15} color={detail.isDefault ? Palette.sage : theme.primary} />}
                style={styles.action}>
                {detail.isDefault ? 'CV mặc định' : 'Đặt mặc định'}
              </Button>
              <Button
                disabled={busy !== null}
                onPress={handleDownload}
                icon={
                  busy === 'download' ? (
                    <ActivityIndicator size="small" color={theme.primaryForeground} />
                  ) : (
                    <Download size={15} color={theme.primaryForeground} />
                  )
                }
                style={styles.action}>
                Tải xuống
              </Button>
              <Button
                variant="destructive"
                disabled={busy !== null}
                onPress={() => setConfirmDelete(true)}
                icon={<Trash2 size={15} color={theme.destructive} />}
                style={styles.action}>
                Xóa
              </Button>
            </View>
          </Card>

          <CvDetailBody detail={detail} />
          <CvVersionsSection versions={versions} />
        </ScrollView>
      )}

      <ConfirmDialog
        visible={confirmDelete}
        title="Xóa CV?"
        message={`CV “${detail?.name ?? ''}” sẽ bị xóa khỏi danh sách. Thao tác này không thể hoàn tác.`}
        confirmLabel="Xóa CV"
        destructive
        busy={busy === 'delete'}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
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
    gap: 22,
  },
  hero: {
    padding: 16,
    gap: 12,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroName: {
    fontFamily: font('bold'),
    fontSize: 17,
    lineHeight: 23,
  },
  heroRole: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 19,
  },
  heroBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 2,
  },
  heroBadgeText: {
    fontFamily: font('medium'),
    fontSize: 10,
    lineHeight: 14,
  },
  heroMeta: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  heroMetaText: {
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 16,
  },
  notice: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  action: {
    flexGrow: 1,
  },
});
