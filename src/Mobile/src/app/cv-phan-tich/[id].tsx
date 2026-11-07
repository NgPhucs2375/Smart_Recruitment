import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Award,
  BookOpen,
  Briefcase,
  CheckCircle2,
  CircleAlert,
  Compass,
  FileText,
  Lightbulb,
  Sparkles,
  Wrench,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { safeBack } from '@/utils/navigation';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import type { KetQuaPhanTichCv } from '@/features/cv/types';
import { apiRequest } from '@/services/api/client';
import { asBoolean, asNumber, asRecord, asText, unwrapList } from '@/services/api/parse';
import { useTheme } from '@/hooks/use-theme';

/** Kết quả demo ở chế độ dữ liệu minh họa để màn hình vẫn kiểm thử được. */
const DEMO_ANALYSIS: KetQuaPhanTichCv = {
  id: 1,
  cvUngVienId: 0,
  noiDungTrichXuat:
    'Ứng viên có 3 năm kinh nghiệm phát triển web, tập trung vào React/TypeScript và tích hợp API.\nĐiểm mạnh: dự án có số liệu đo lường rõ, vai trò ownership từ thiết kế tới triển khai.\nCần bổ sung: phần mô tả mục tiêu nghề nghiệp chưa nêu định hướng rõ ràng.',
  kyNangTrichXuat:
    'React, TypeScript, Next.js, Node.js, REST API, Git, unit test, CI/CD cơ bản.\nMức độ thể hiện: tự tin ở frontend, kinh nghiệm vừa phải ở backend.',
  kinhNghiemTrichXuat:
    'Fresher → Frontend Developer (2023–2024): xây landing page và dashboard nội bộ.\nFrontend Developer (2024–nay): phát triển tính năng thanh toán, tối ưu hiệu năng trang.',
  hocVanTrichXuat:
    'Đại học Công nghệ thông tin — Kỹ thuật phần mềm (2019–2023).\nGPA 3.4/4.0, tốt nghiệp loại khá.',
  phanTich: 'HoanThanh',
  diemTongQuan: 78,
  diemPhuHop: 0.72,
  matchingVersion: 'cbf-v7-idf',
  tinTuyenDungId: 1,
  nhanXet:
    'CV trình bày rõ kinh nghiệm frontend và có dự án kèm số liệu. Ứng viên khớp phần lớn kỹ năng bắt buộc của tin, chỉ còn thiếu kiến thức kiểm thử tự động nâng cao.',
  diemManh: 'Kinh nghiệm React/TypeScript gắn với dự án thật.\nCó số liệu đo lường kết quả công việc.',
  diemYeu: 'Chưa nêu rõ mục tiêu nghề nghiệp.\nThiếu bằng chứng về unit test và CI/CD.',
  goiY: 'ky-nang|Bổ sung ví dụ viết unit test cho một component.\nkinh-nghiem|Thêm kết quả định lượng cho từng dự án.\ntong-the|Nêu mục tiêu nghề nghiệp trong phần tóm tắt.',
  danhGiaLuc: null,
  daDanhGiaBangAi: true,
};

const SECTION_LABEL: Record<string, string> = {
  'ky-nang': 'Kỹ năng',
  'kinh-nghiem': 'Kinh nghiệm',
  'hoc-van': 'Học vấn',
  'du-an': 'Dự án',
  'tong-the': 'Tổng thể',
};

const numOrNull = (value: unknown): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

/** Gợi ý lưu dạng "phan|viec" mỗi dòng — hiển thị nhãn phần cho dễ đọc. */
function formatGoiY(text: string): string {
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [part, ...rest] = line.split('|');
      const label = SECTION_LABEL[part.trim()] ?? SECTION_LABEL['tong-the'];
      const viec = rest.join('|').trim() || part.trim();
      return `• ${label}: ${viec}`;
    })
    .join('\n');
}

function matchLabel(score: number): string {
  if (score >= 66) return 'Phù hợp cao';
  if (score >= 33) return 'Phù hợp trung bình';
  return 'Phù hợp thấp';
}

async function fetchPhanTich(cvId: string): Promise<KetQuaPhanTichCv | null> {
  if (USE_MOCK_JOBS) {
    return { ...DEMO_ANALYSIS, cvUngVienId: asNumber(cvId, 0) };
  }
  const idNum = Number(cvId);
  if (!Number.isFinite(idNum) || idNum <= 0) {
    throw new Error('CV không hợp lệ.');
  }
  const payload = await apiRequest<unknown>(
    `ketquaphantichcvs?CVUngVienId=${idNum}&_start=0&_end=1`,
  );
  const rows = unwrapList(payload);
  if (rows.length === 0) return null;
  const raw = asRecord(rows[0]) ?? {};
  return {
    id: asNumber(raw.id ?? raw.Id),
    cvUngVienId: asNumber(raw.cvUngVienId ?? raw.CVUngVienId, idNum),
    noiDungTrichXuat: asText(raw.noiDungTrichXuat ?? raw.NoiDungTrichXuat),
    kyNangTrichXuat: asText(raw.kyNangTrichXuat ?? raw.KyNangTrichXuat),
    kinhNghiemTrichXuat: asText(raw.kinhNghiemTrichXuat ?? raw.KinhNghiemTrichXuat),
    hocVanTrichXuat: asText(raw.hocVanTrichXuat ?? raw.HocVanTrichXuat),
    phanTich: asText(raw.phanTich ?? raw.PhanTich),
    diemTongQuan: numOrNull(raw.diemTongQuan ?? raw.DiemTongQuan),
    diemPhuHop: numOrNull(raw.diemPhuHop ?? raw.DiemPhuHop),
    matchingVersion: asText(raw.matchingVersion ?? raw.MatchingVersion),
    tinTuyenDungId: numOrNull(raw.tinTuyenDungId ?? raw.TinTuyenDungId),
    nhanXet: asText(raw.nhanXet ?? raw.NhanXet),
    diemManh: asText(raw.diemManh ?? raw.DiemManh),
    diemYeu: asText(raw.diemYeu ?? raw.DiemYeu),
    goiY: asText(raw.goiY ?? raw.GoiY),
    danhGiaLuc: asText(raw.danhGiaLuc ?? raw.DanhGiaLuc) || null,
    daDanhGiaBangAi: asBoolean(raw.daDanhGiaBangAi ?? raw.DaDanhGiaBangAi),
  };
}

function Section({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  const theme = useTheme();
  if (!body.trim()) return null;
  return (
    <View style={[styles.section, { borderColor: theme.border, backgroundColor: theme.background }]}>
      <View style={styles.sectionHead}>
        {icon}
        <ThemedText style={{ color: theme.textSecondary }} type="smallBold">
          {title}
        </ThemedText>
      </View>
      <ThemedText style={{ color: theme.text }} type="small">
        {body}
      </ThemedText>
    </View>
  );
}

export default function CvPhanTichScreen() {
  const theme = useTheme();
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const cvId = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  const [result, setResult] = useState<KetQuaPhanTichCv | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const data = await fetchPhanTich(cvId);
      setResult(data);
    } catch (reason) {
      setErr(reason instanceof Error ? reason.message : 'Lỗi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  }, [cvId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const hoanThanh = result != null && (result.phanTich === 'HoanThanh' || result.phanTich === '1');
  const diemTongQuan = result?.diemTongQuan ?? null;
  const matchPercent = result?.diemPhuHop != null ? Math.round(result.diemPhuHop * 100) : null;

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
          Phân tích CV
        </ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.hero, { borderColor: theme.border }]}>
          <View style={styles.heroBadge}>
            <Sparkles size={13} color={theme.primary} />
            <ThemedText style={{ color: theme.textSecondary }} type="code">
              {`Phân tích CV bằng AI — CV #${cvId}`}
            </ThemedText>
          </View>
          <ThemedText style={{ color: theme.text }} type="subtitle">
            Trích xuất & tóm tắt CV
          </ThemedText>
          <ThemedText style={{ color: theme.textSecondary }} type="small">
            Kết quả được tự động cập nhật mỗi lần bạn lưu CV. Dùng để kiểm tra nhanh kỹ năng,
            kinh nghiệm và học vấn trước khi ứng tuyển.
          </ThemedText>
        </View>

        {err ? (
          <View style={[styles.errorBox, { borderColor: theme.destructive }]}>
            <ThemedText style={{ color: theme.destructive }} type="small">
              {err}
            </ThemedText>
            <Button variant="outline" size="sm" onPress={() => void load()}>
              Thử lại
            </Button>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={{ color: theme.textSecondary }} type="small">
              Đang tải kết quả phân tích…
            </ThemedText>
          </View>
        ) : !result ? (
          !err ? (
            <View style={[styles.emptyBox, { borderColor: theme.border }]}>
              <FileText size={30} color={theme.primary} />
              <ThemedText style={{ color: theme.text }} type="smallBold">
                Chưa có kết quả phân tích
              </ThemedText>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>
                Lưu CV một lần để hệ thống trích xuất và phân tích nội dung.
              </ThemedText>
              <Button
                onPress={() =>
                  router.push({ pathname: '/tao-cv/[id]', params: { id: cvId || 'new' } })
                }>
                Mở CV để lưu
              </Button>
            </View>
          ) : null
        ) : (
          <View style={styles.sections}>
            {!hoanThanh ? (
              <View style={[styles.notice, { borderColor: theme.border }]}>
                <CircleAlert size={15} color={theme.textSecondary} />
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  Phân tích chưa hoàn tất — hãy lưu lại CV để làm mới kết quả.
                </ThemedText>
              </View>
            ) : null}

            {diemTongQuan != null ? (
              <>
                <View style={styles.reviewRow}>
                  <View style={[styles.scoreCard, { backgroundColor: theme.primary }]}>
                    <ThemedText style={{ color: theme.primaryForeground, opacity: 0.75 }} type="code">
                      ĐIỂM CHẤT LƯỢNG CV
                    </ThemedText>
                    <ThemedText style={{ color: theme.primaryForeground }} type="title">
                      {`${diemTongQuan}/100`}
                    </ThemedText>
                  </View>
                  <View
                    style={[
                      styles.matchCard,
                      { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                    ]}>
                    <ThemedText style={{ color: theme.textSecondary }} type="code">
                      MỨC PHÙ HỢP
                    </ThemedText>
                    <ThemedText style={{ color: theme.text }} type="title">
                      {matchPercent != null ? `${matchPercent}%` : '—'}
                    </ThemedText>
                    {matchPercent != null ? (
                      <ThemedText style={{ color: theme.textSecondary }} type="code">
                        {matchLabel(matchPercent)}
                      </ThemedText>
                    ) : null}
                  </View>
                </View>

                {result.daDanhGiaBangAi === false ? (
                  <View style={[styles.notice, { borderColor: theme.border }]}>
                    <CircleAlert size={15} color={theme.textSecondary} />
                    <ThemedText style={{ color: theme.textSecondary, flex: 1 }} type="code">
                      Đánh giá nhanh: AI chưa phản hồi nên hệ thống dùng bộ chấm tất định. Mở bản web
                      để chạy lại đánh giá đầy đủ.
                    </ThemedText>
                  </View>
                ) : null}

                <Section
                  icon={<Compass size={15} color={theme.primary} />}
                  title="Nhận xét của AI"
                  body={result.nhanXet ?? ''}
                />
                <Section
                  icon={<CheckCircle2 size={15} color={theme.primary} />}
                  title="Điểm mạnh"
                  body={result.diemManh ?? ''}
                />
                <Section
                  icon={<Wrench size={15} color={theme.primary} />}
                  title="Điểm cần cải thiện"
                  body={result.diemYeu ?? ''}
                />
                <Section
                  icon={<Lightbulb size={15} color={theme.primary} />}
                  title="Gợi ý cải thiện"
                  body={formatGoiY(result.goiY ?? '')}
                />

                <ThemedText style={{ color: theme.textSecondary, opacity: 0.8 }} type="code">
                  {[
                    result.tinTuyenDungId ? `Tin #${result.tinTuyenDungId}` : '',
                    result.danhGiaLuc
                      ? `Đánh giá lúc ${new Date(result.danhGiaLuc).toLocaleString('vi-VN')}`
                      : '',
                    result.matchingVersion ? `Bộ chấm ${result.matchingVersion}` : '',
                  ]
                    .filter(Boolean)
                    .join(' • ')}
                </ThemedText>
              </>
            ) : null}

            <Section
              icon={<FileText size={15} color={theme.primary} />}
              title="Tóm tắt"
              body={result.noiDungTrichXuat}
            />
            <Section
              icon={<Wrench size={15} color={theme.primary} />}
              title="Kỹ năng trích xuất"
              body={result.kyNangTrichXuat}
            />
            <Section
              icon={<Briefcase size={15} color={theme.primary} />}
              title="Kinh nghiệm trích xuất"
              body={result.kinhNghiemTrichXuat}
            />
            <Section
              icon={<BookOpen size={15} color={theme.primary} />}
              title="Học vấn trích xuất"
              body={result.hocVanTrichXuat}
            />

            <View style={[styles.footerCard, { borderColor: theme.border }]}>
              <Award size={20} color={theme.primary} />
              <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}>
                Dùng bản tóm tắt này để đối chiếu với yêu cầu tin tuyển dụng trước khi nộp đơn.
              </ThemedText>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => router.push('/phu-hop')}
                accessibilityLabel="Xem việc phù hợp">
                Việc phù hợp
              </Button>
            </View>
          </View>
        )}
      </ScrollView>
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
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  hero: {
    borderWidth: 1,
    borderRadius: Radius['3xl'],
    padding: 18,
    gap: 8,
  },
  heroBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorBox: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 12,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadingBox: { alignItems: 'center', gap: 10, paddingVertical: 48 },
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
  sections: { gap: 12 },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 12,
  },
  section: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 16,
    gap: 8,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  reviewRow: { flexDirection: 'row', gap: 12 },
  scoreCard: {
    flex: 1,
    borderRadius: Radius['2xl'],
    padding: 16,
    gap: 6,
  },
  matchCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 16,
    gap: 6,
  },
  footerCard: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 16,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerText: { flex: 1, minWidth: 180, fontFamily: font('regular'), fontSize: 13, lineHeight: 20 },
});
