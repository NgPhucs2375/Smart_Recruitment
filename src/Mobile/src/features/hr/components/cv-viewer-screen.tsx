import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { CheckCheck, RefreshCw, UserX } from 'lucide-react-native';
import { WebView } from 'react-native-webview';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { hrAppApi, hrCvApi, type CvRenderInfo } from '@/features/hr/api/hr-api';
import { useHrActionDialog } from '@/features/hr/components/action-dialog';
import {
  HrErrorState,
  HrLoadingState,
  HrScreenShell,
  HrTopBar,
  NoticeBar,
} from '@/features/hr/components/hr-primitives';
import { APP_TRIGGER } from '@/features/hr/constants';
import { useTheme } from '@/hooks/use-theme';

export function CvViewerScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ cvId?: string; name?: string; donId?: string }>();
  const cvId = Number(params.cvId) || 0;
  const donId = Number(params.donId) || 0;
  const { dialog, confirm, prompt } = useHrActionDialog();

  const [info, setInfo] = useState<CvRenderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [acting, setActing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    if (cvId <= 0) {
      setError('Thiếu tham số cvId.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setPageLoading(true);
    setError('');
    try {
      const result = await hrCvApi.getCvRenderInfo(cvId, donId > 0 ? donId : undefined);
      if (!mountedRef.current) return;
      setInfo(result);
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không tải được CV.');
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [cvId, donId]);

  // Tải ban đầu — hoãn 1 tick, không setState đồng bộ trong effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    const timer = setTimeout(() => void load(), 0);
    return () => clearTimeout(timer);
  }, [load]);

  const handleApprove = async () => {
    if (!donId || acting) return;
    const ok = await confirm({
      title: 'Duyệt phù hợp',
      description: 'Xác nhận đơn ứng tuyển này phù hợp với vị trí?',
      confirmLabel: 'Duyệt',
    });
    if (!ok) return;
    try {
      setActing(true);
      const message = await hrCvApi.approveFromCv(donId);
      if (mountedRef.current) setNotice(message || 'Đã duyệt phù hợp.');
    } catch (reason) {
      if (mountedRef.current) setNotice('');
      if (mountedRef.current) setError(reason instanceof Error ? reason.message : 'Không thể duyệt.');
    } finally {
      if (mountedRef.current) setActing(false);
    }
  };

  const handleReject = async () => {
    if (!donId || acting) return;
    const reason = await prompt({
      title: 'Từ chối đơn',
      description: 'Nhập lý do từ chối (được lưu vào ghi chú của đơn).',
      placeholder: 'VD: Chưa đủ kinh nghiệm cho vị trí này',
      confirmLabel: 'Từ chối',
      destructive: true,
    });
    if (reason === null) return;
    try {
      setActing(true);
      setError('');
      const message = await hrAppApi.fire(donId, APP_TRIGGER.TuChoi, reason || '');
      if (mountedRef.current) setNotice(message || 'Đã từ chối đơn.');
    } catch (e) {
      if (mountedRef.current) setError(e instanceof Error ? e.message : 'Không thể từ chối.');
    } finally {
      if (mountedRef.current) setActing(false);
    }
  };

  const title = params.name || info?.tenFile || `CV #${cvId || ''}`;

  return (
    <HrScreenShell>
      {dialog}
      <HrTopBar
        title={title}
        right={
          <View style={styles.topActions}>
            <Button
              variant="ghost"
              size="icon"
              accessibilityLabel="Tải lại CV"
              onPress={() => {
                setReloadKey((key) => key + 1);
                void load();
              }}
              icon={<RefreshCw size={17} color={theme.text} />}
            />
          </View>
        }
      />

      <View style={styles.actionBar}>
        <ThemedText style={{ color: theme.textSecondary }} type="code" numberOfLines={1}>
          {donId ? `Đơn ứng tuyển #${donId}` : 'Xem trước CV'}
        </ThemedText>
        {donId ? (
          <View style={styles.decisionRow}>
            <Button
              variant="outline"
              size="sm"
              disabled={acting}
              onPress={() => void handleReject()}
              icon={<UserX size={14} color={theme.destructive} />}>
              <ThemedText style={{ color: theme.destructive }} type="small">
                Từ chối
              </ThemedText>
            </Button>
            <Button
              size="sm"
              disabled={acting}
              onPress={() => void handleApprove()}
              icon={<CheckCheck size={14} color={theme.primaryForeground} />}>
              Duyệt phù hợp
            </Button>
          </View>
        ) : null}
      </View>

      {notice ? (
        <View style={styles.noticeWrap}>
          <NoticeBar kind="success" message={notice} />
        </View>
      ) : null}
      {error ? (
        <View style={styles.noticeWrap}>
          <NoticeBar kind="error" message={error} />
        </View>
      ) : null}

      {loading ? (
        <HrLoadingState label="Đang tải CV…" />
      ) : error && !info ? (
        <HrErrorState message={error} onRetry={() => void load()} />
      ) : info ? (
        <View style={styles.webWrap}>
          {pageLoading ? (
            <View style={styles.webLoading}>
              <HrLoadingState label="Đang render CV…" />
            </View>
          ) : null}
          <WebView
            key={`${cvId}-${reloadKey}`}
            source={{ uri: info.url }}
            style={styles.web}
            startInLoadingState={false}
            onLoadStart={() => setPageLoading(true)}
            onLoadEnd={() => setPageLoading(false)}
            onError={() => {
              setPageLoading(false);
              setError('Không tải được trang CV. Kiểm tra địa chỉ Web (webOrigin) trong .env.');
            }}
          />
        </View>
      ) : null}
    </HrScreenShell>
  );
}

const styles = StyleSheet.create({
  topActions: { flexDirection: 'row' },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000014',
  },
  decisionRow: { flexDirection: 'row', gap: 8 },
  noticeWrap: { paddingHorizontal: 16, paddingTop: 10 },
  webWrap: { flex: 1 },
  web: { flex: 1, backgroundColor: 'transparent' },
  webLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffffee',
    zIndex: 2,
  },
});
