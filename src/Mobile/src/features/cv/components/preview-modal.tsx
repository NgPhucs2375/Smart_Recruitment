import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { Printer, RotateCw, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/use-theme';

import { exportCvPdf } from '../export-pdf';
import { buildCvRenderUrl } from '../preview-url';
import type { CvFormData } from '../types';

const FIT_SCRIPT = `(() => {
  const fit = () => {
    if (!document.body) return false;
    const width = window.innerWidth || 375;
    document.body.style.zoom = Math.max(0.2, width / 794);
    return true;
  };
  if (!fit()) setTimeout(fit, 250);
  setTimeout(fit, 1200);
  true;
})();`;

export function PreviewModal({
  visible,
  onClose,
  data,
  templateId,
  title = 'Xem trước CV',
}: {
  visible: boolean;
  onClose: () => void;
  data: CvFormData;
  templateId?: string;
  title?: string;
}) {
  const theme = useTheme();
  const [nonce, setNonce] = useState(0);
  const [exporting, setExporting] = useState(false);

  const url = useMemo(() => buildCvRenderUrl(data, templateId), [data, templateId]);

  const handleExport = () => {
    if (exporting) return;
    setExporting(true);
    void exportCvPdf(data)
      .then(({ shared }) => {
        if (!shared) {
          Alert.alert('Đã tạo PDF', `File đã lưu tại: ${data.tenFile.trim() || 'CV'}.pdf`);
        }
      })
      .catch((reason: unknown) => {
        Alert.alert(
          'Không thể xuất PDF',
          reason instanceof Error ? reason.message : 'Vui lòng thử lại.',
        );
      })
      .finally(() => setExporting(false));
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
          <Button variant="ghost" size="icon" onPress={onClose} accessibilityLabel="Đóng">
            <X size={18} color={theme.text} />
          </Button>
          <ThemedText style={{ color: theme.text, flex: 1 }} type="smallBold" numberOfLines={1}>
            {title}
          </ThemedText>
          <View style={styles.topActions}>
            <Button
              variant="outline"
              size="icon"
              onPress={() => setNonce((n) => n + 1)}
              accessibilityLabel="Tải lại bản xem trước"
            >
              <RotateCw size={16} color={theme.text} />
            </Button>
            <Button
              variant={exporting ? 'secondary' : 'default'}
              size="sm"
              onPress={handleExport}
              disabled={exporting}
              accessibilityLabel="Xuất PDF"
            >
              <Printer size={14} color={exporting ? theme.textSecondary : theme.primaryForeground} />
              {exporting ? 'Đang xuất…' : 'Xuất PDF'}
            </Button>
          </View>
        </View>
        <WebView
          key={`preview-${nonce}`}
          source={{ uri: url }}
          originWhitelist={['*']}
          startInLoadingState
          injectedJavaScript={FIT_SCRIPT}
          renderLoading={() => (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={{ color: theme.textSecondary }} type="small">
                Đang tải bản xem trước…
              </ThemedText>
            </View>
          )}
          style={[styles.webview, { backgroundColor: theme.backgroundSelected }]}
        />
      </View>
    </Modal>
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
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 'auto', flexShrink: 1 },
  webview: { flex: 1 },
  loading: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
