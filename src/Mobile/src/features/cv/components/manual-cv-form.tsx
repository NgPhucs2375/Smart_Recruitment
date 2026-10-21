import { useRef, useState, type ReactNode } from 'react';
import { Image, StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import {
  Award,
  Briefcase,
  Eye,
  EyeOff,
  FileText,
  FolderGit2,
  GraduationCap,
  Plus,
  Trash,
  Wrench,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { FormSelect } from '@/features/hr/components/form-field';

import type {
  CvDatePrecision,
  CvFormData,
  DuAnItem,
  HocVanItem,
  KinhNghiemItem,
  KyNangItem,
  ChungChiItem,
  LienHe,
} from '../types';
import { formatVndInput } from '../format-vnd';
import { normalizeLayoutConfig, type CvSectionId } from '../resume-layout';
import { maskMonthYear, newId } from '../manual/cv-data';
import {
  MSG_EMAIL,
  MSG_PHONE,
  MSG_URL,
  isValidEmail,
  isValidHttpUrl,
  isValidVnPhone,
} from '../manual/validation';
import {
  CheckRow,
  ChipInput,
  CvInput,
  DateField,
  FieldError,
  PartialDateField,
  PrecisionToggle,
  Row,
  WritingTips,
  rangeErrorText,
} from './fields';
import { CV_MAX_LENGTH } from './character-counter';

const SKILL_LEVEL_OPTIONS = [
  { value: '0', label: 'Cơ bản' },
  { value: '1', label: 'Trung bình' },
  { value: '2', label: 'Thành thạo' },
  { value: '3', label: 'Chuyên gia' },
];

type ListKey = 'hocVan' | 'kinhNghiemLamViec' | 'duAn' | 'kyNang' | 'chungChi';

function SectionShell({
  title,
  icon,
  order,
  countLabel,
  visible,
  onToggleVisibility,
  onLayout,
  actions,
  children,
}: {
  title: string;
  icon: ReactNode;
  order?: number;
  countLabel?: string;
  visible?: boolean;
  onToggleVisibility?: () => void;
  onLayout?: (event: LayoutChangeEvent) => void;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const theme = useTheme();
  const dimmed = visible === false;
  return (
    <View onLayout={onLayout} style={[styles.section, dimmed && styles.sectionHidden]}>
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.sectionIcon,
            { backgroundColor: theme.backgroundSelected },
          ]}
        >
          {icon}
        </View>
        <View style={styles.sectionTitleWrap}>
          <View style={styles.sectionTitleRow}>
            {order && order > 0 ? (
              <Badge variant="outline">{String(order)}</Badge>
            ) : null}
            <ThemedText style={{ color: theme.text }} type="smallBold">
              {title}
            </ThemedText>
          </View>
          {countLabel ? (
            <ThemedText style={{ color: theme.textSecondary }} type="code">
              {countLabel}
            </ThemedText>
          ) : null}
        </View>
        <View style={styles.sectionActions}>
          {actions}
          {onToggleVisibility ? (
            <Button
              variant="ghost"
              size="icon"
              onPress={onToggleVisibility}
              accessibilityLabel={dimmed ? `Hiện ${title}` : `Ẩn ${title}`}
              icon={
                dimmed ? (
                  <EyeOff size={16} color={theme.textSecondary} />
                ) : (
                  <Eye size={16} color={theme.textSecondary} />
                )
              }
            />
          ) : null}
        </View>
      </View>
      {dimmed ? (
        <ThemedText style={{ color: theme.textSecondary }} type="code">
          Section đang ẩn — bật lại bằng biểu tượng mắt để hiển thị trên CV.
        </ThemedText>
      ) : null}
      {children}
    </View>
  );
}

function EmptyHint({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.empty, { backgroundColor: theme.backgroundSelected }]}>
      <FileText size={16} color={theme.textSecondary} />
      <ThemedText style={{ color: theme.textSecondary }} type="small">
        {text}
      </ThemedText>
    </View>
  );
}

function ItemCard({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <Card style={[styles.itemCard, { borderColor: theme.border }]}>{children}</Card>
  );
}

function DeleteButton({ onPress, label }: { onPress: () => void; label: string }) {
  const theme = useTheme();
  return (
    <Button
      variant="ghost"
      size="icon"
      onPress={onPress}
      accessibilityLabel={label}
      icon={<Trash size={16} color={theme.destructive} />}
    />
  );
}

function QuickActionBar({
  value,
  maxLength,
  onApply,
}: {
  value: string;
  maxLength: number;
  onApply: (next: string) => void;
}) {
  const overSafe = value.length > maxLength;
  if (!overSafe) return null;
  const shorten = () => {
    const cut = value.slice(0, maxLength);
    const lastSpace = cut.lastIndexOf(' ');
    onApply(lastSpace > maxLength * 0.5 ? cut.slice(0, lastSpace) : cut);
  };
  return (
    <View style={styles.quickActions}>
      <Button variant="outline" size="sm" onPress={shorten}>
        ⚡ Rút gọn câu
      </Button>
    </View>
  );
}

export function ManualCvForm({
  data,
  onChange,
  profileAvatarUrl,
  onSectionLayout,
}: {
  data: CvFormData;
  onChange: (next: CvFormData) => void;
  /** Ảnh hồ sơ để gắn nhanh vào CV (không upload ảnh trên mobile). */
  profileAvatarUrl?: string | null;
  /** Báo tọa độ Y của từng section để chip điều hướng cuộn tới. */
  onSectionLayout?: (id: string, y: number) => void;
}) {
  const theme = useTheme();
  const lh = data.thongTinLienHe;
  const [dateMode, setDateMode] = useState<Record<string, CvDatePrecision>>({});
  const monthStash = useRef<Record<string, string>>({});

  const emailErr = lh.email.trim() && !isValidEmail(lh.email) ? MSG_EMAIL : null;
  const phoneErr = lh.sdt.trim() && !isValidVnPhone(lh.sdt) ? MSG_PHONE : null;
  const urlErr = (value: string) =>
    value.trim() && !isValidHttpUrl(value) ? MSG_URL : null;

  const setLienHe = (field: keyof LienHe, value: string) =>
    onChange({ ...data, thongTinLienHe: { ...lh, [field]: value } });

  const layout = normalizeLayoutConfig(data.layoutConfig);

  const updateList = (key: ListKey, id: string, field: string, value: unknown) => {
    const list = (data[key] as { id: string }[]).map((item) =>
      item.id === id ? { ...item, [field]: value } : item,
    );
    onChange({ ...data, [key]: list } as CvFormData);
  };

  const setCurrentFlag = (
    key: 'hocVan' | 'kinhNghiemLamViec' | 'duAn',
    id: string,
    value: boolean,
  ) => {
    const list = (data[key] as { id: string }[]).map((item) =>
      item.id === id
        ? { ...item, isHienTai: value, ...(value ? { denNgay: '' } : {}) }
        : item,
    );
    onChange({ ...data, [key]: list } as CvFormData);
  };

  const removeFrom = (key: ListKey, id: string) => {
    const list = (data[key] as { id: string }[]).filter((item) => item.id !== id);
    setDateMode((current) => {
      if (!(id in current)) return current;
      const next = { ...current };
      delete next[id];
      return next;
    });
    onChange({ ...data, [key]: list });
  };

  const modeFor = (
    id: string,
    tu: string,
    den: string,
    defaultMode: CvDatePrecision = 'month_year',
  ): CvDatePrecision => {
    const override = dateMode[id];
    if (override) return override;
    const t = (tu || '').trim();
    const d = (den || '').trim();
    if (/^\d{4}$/.test(t) && (d === '' || /^\d{4}$/.test(d))) return 'year_only';
    return defaultMode;
  };

  const convertForPrecision = (
    id: string,
    field: string,
    value: string,
    next: CvDatePrecision,
  ): string => {
    const key = `${id}:${field}`;
    const t = (value || '').trim();
    if (next === 'year_only') {
      const parsed = parseIntoYear(t);
      if (parsed === null) return t === '' ? '' : value;
      if (!/^\d{4}$/.test(t)) monthStash.current[key] = value;
      return String(parsed);
    }
    if (/^\d{4}$/.test(t)) {
      const stashed = monthStash.current[key];
      if (stashed && parseIntoYear(stashed) === Number(t)) return stashed;
      return '';
    }
    return value;
  };

  const switchRangePrecision = (
    key: ListKey,
    id: string,
    tuField: string,
    denField: string | null,
    next: CvDatePrecision,
  ) => {
    const converted = (data[key] as Record<string, unknown>[]).map((item) => {
      if ((item as { id: string }).id !== id) return item;
      const copy = { ...item } as Record<string, unknown>;
      copy[tuField] = convertForPrecision(
        id,
        tuField,
        String(item[tuField] ?? ''),
        next,
      );
      if (denField) {
        copy[denField] = convertForPrecision(
          id,
          denField,
          String(item[denField] ?? ''),
          next,
        );
      }
      return copy;
    });
    setDateMode((current) => ({ ...current, [id]: next }));
    onChange({ ...data, [key]: converted } as CvFormData);
  };

  const toggleSection = (id: CvSectionId) => {
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

  const orderOf = (id: CvSectionId): number => layout.sectionOrder.indexOf(id) + 1;
  const countLabel = (n: number, unit: string): string | undefined =>
    n > 0 ? `${n} ${unit}` : undefined;
  const isSectionVisible = (id: CvSectionId): boolean =>
    layout.sections[id]?.isVisible !== false;
  const report = (id: string) => (event: LayoutChangeEvent) =>
    onSectionLayout?.(id, event.nativeEvent.layout.y);

  const sectionHeaderButton = (title: string, onPress: () => void) => (
    <Button variant="outline" size="sm" onPress={onPress} accessibilityLabel={title}>
      <Plus size={14} color={theme.text} />
      Thêm
    </Button>
  );

  const contactSection = (
    <SectionShell
      title="Thông tin liên hệ"
      icon={<FileText size={16} color={theme.primary} />}
      onLayout={report('contact')}
    >
      <View style={styles.avatarRow}>
        <View style={[styles.avatarBox, { backgroundColor: theme.muted }]}>
          {lh.anhDaiDienUrl?.trim() ? (
            <Image
              source={{ uri: lh.anhDaiDienUrl.trim() }}
              style={styles.avatarImage}
              accessibilityLabel="Ảnh đại diện"
            />
          ) : (
            <ThemedText style={{ color: theme.textSecondary }} type="smallBold">
              Ảnh
            </ThemedText>
          )}
        </View>
        <View style={styles.avatarMeta}>
          <ThemedText style={{ color: theme.text }} type="small">
            Ảnh đại diện
          </ThemedText>
          <ThemedText style={{ color: theme.textSecondary }} type="code">
            JPG/PNG/WEBP/GIF ≤ 5MB. Dán URL ảnh (dùng chung với hồ sơ ứng viên).
          </ThemedText>
          {profileAvatarUrl?.trim() && !lh.anhDaiDienUrl?.trim() ? (
            <Button
              variant="outline"
              size="sm"
              style={{ alignSelf: 'flex-start', marginTop: 6 }}
              onPress={() => setLienHe('anhDaiDienUrl', profileAvatarUrl)}
            >
              Dùng ảnh hồ sơ
            </Button>
          ) : null}
          {lh.anhDaiDienUrl?.trim() ? (
            <Button
              variant="ghost"
              size="sm"
              style={{ alignSelf: 'flex-start' }}
              onPress={() => setLienHe('anhDaiDienUrl', '')}
            >
              Gỡ ảnh khỏi CV
            </Button>
          ) : null}
        </View>
      </View>
      <CvInput
        label="Ảnh đại diện (URL)"
        value={lh.anhDaiDienUrl ?? ''}
        onChangeText={(next) => setLienHe('anhDaiDienUrl', next)}
        placeholder="https://..."
        error={urlErr(lh.anhDaiDienUrl ?? '')}
        autoCapitalize="none"
        keyboardType="url"
      />
      <CvInput
        label="Họ và tên"
        required
        value={lh.hoTen}
        onChangeText={(next) => setLienHe('hoTen', next)}
        placeholder="Nguyễn Văn An"
      />
      <Row>
        <CvInput
          label="Email"
          required
          value={lh.email}
          onChangeText={(next) => setLienHe('email', next)}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          error={emailErr}
        />
        <CvInput
          label="Số điện thoại"
          required
          value={lh.sdt}
          onChangeText={(next) => setLienHe('sdt', next)}
          placeholder="090 123 4567"
          keyboardType="phone-pad"
          error={phoneErr}
        />
      </Row>
      <Row>
        <DateField
          label="Ngày sinh"
          value={lh.ngaySinh}
          onChange={(next) => setLienHe('ngaySinh', next)}
        />
        <CvInput
          label="Giới tính"
          value={lh.gioiTinh}
          onChangeText={(next) => setLienHe('gioiTinh', next)}
          placeholder="Nam / Nữ"
        />
      </Row>
      <CvInput
        label="Địa chỉ"
        value={lh.diaChi}
        onChangeText={(next) => setLienHe('diaChi', next)}
        placeholder="Hà Nội, Việt Nam"
      />
      <Row>
        <CvInput
          label="GitHub"
          value={lh.github}
          onChangeText={(next) => setLienHe('github', next)}
          placeholder="https://github.com/..."
          autoCapitalize="none"
          keyboardType="url"
          error={urlErr(lh.github)}
        />
        <CvInput
          label="LinkedIn"
          value={lh.linkedIn}
          onChangeText={(next) => setLienHe('linkedIn', next)}
          placeholder="https://linkedin.com/in/..."
          autoCapitalize="none"
          keyboardType="url"
          error={urlErr(lh.linkedIn)}
        />
      </Row>
      <Row>
        <CvInput
          label="Portfolio"
          value={lh.portfolio}
          onChangeText={(next) => setLienHe('portfolio', next)}
          placeholder="https://..."
          autoCapitalize="none"
          keyboardType="url"
          error={urlErr(lh.portfolio)}
        />
        <CvInput
          label="Vị trí ứng tuyển"
          value={lh.viTriUngTuyen}
          onChangeText={(next) => setLienHe('viTriUngTuyen', next)}
          placeholder="VD: Backend .NET"
          maxLength={CV_MAX_LENGTH.shortTitle}
        />
      </Row>
      <CvInput
        label="Tiêu đề hiển thị trên CV"
        value={data.tieuDeHienThi ?? ''}
        onChangeText={(next) => onChange({ ...data, tieuDeHienThi: next })}
        placeholder="VD: Hồ sơ ứng viên — để trống dùng mặc định của mẫu"
        maxLength={CV_MAX_LENGTH.shortTitle}
      />
      <CvInput
        label="Mức lương mong muốn"
        value={lh.mucLuongMongMuon}
        onChangeText={(next) => setLienHe('mucLuongMongMuon', formatVndInput(next))}
        placeholder="VD: 15.000.000"
        keyboardType="number-pad"
      />
      <WritingTips items={['2–3 câu nêu bật thế mạnh, không dùng đại từ nhân xưng']} />
      <CvInput
        label="Giới thiệu bản thân"
        value={lh.gioiThieuBanThan}
        onChangeText={(next) => setLienHe('gioiThieuBanThan', next)}
        placeholder="Tóm tắt mục tiêu nghề nghiệp và điểm mạnh..."
        multiline
        numberOfLines={4}
        maxLength={CV_MAX_LENGTH.summary}
        showCounter
      />
    </SectionShell>
  );

  const experienceSection = (
    <SectionShell
      title="Kinh nghiệm làm việc"
      icon={<Briefcase size={16} color={theme.primary} />}
      order={orderOf('experience')}
      countLabel={countLabel(data.kinhNghiemLamViec.length, 'kinh nghiệm')}
      visible={isSectionVisible('experience')}
      onToggleVisibility={() => toggleSection('experience')}
      onLayout={report('experience')}
      actions={sectionHeaderButton('Thêm kinh nghiệm', () => {
        const item: KinhNghiemItem = {
          id: newId(),
          congTy: '',
          chucDanh: '',
          tuNgay: '',
          denNgay: '',
          isHienTai: false,
          moTa: '',
          kyNangSuDung: [],
        };
        onChange({ ...data, kinhNghiemLamViec: [...data.kinhNghiemLamViec, item] });
      })}
    >
      <WritingTips items={['Bắt đầu bằng động từ hành động, nêu rõ kết quả định lượng']} />
      {data.kinhNghiemLamViec.length === 0 ? (
        <EmptyHint text='Chưa có kinh nghiệm nào. Nhấn "Thêm" để bắt đầu.' />
      ) : (
        data.kinhNghiemLamViec.map((item) => {
          const mode = modeFor(item.id, item.tuNgay, item.denNgay);
          const err = rangeErrorText(item.tuNgay, item.denNgay, item.isHienTai);
          return (
            <ItemCard key={item.id}>
              <Row>
                <CvInput
                  value={item.congTy}
                  onChangeText={(next) =>
                    updateList('kinhNghiemLamViec', item.id, 'congTy', next)
                  }
                  placeholder="Công ty *"
                  maxLength={CV_MAX_LENGTH.shortTitle}
                  style={styles.flex1}
                />
                <CvInput
                  value={item.chucDanh}
                  onChangeText={(next) =>
                    updateList('kinhNghiemLamViec', item.id, 'chucDanh', next)
                  }
                  placeholder="Chức danh *"
                  style={styles.flex1}
                />
                <DeleteButton
                  label="Xóa kinh nghiệm"
                  onPress={() => removeFrom('kinhNghiemLamViec', item.id)}
                />
              </Row>
              <PrecisionToggle
                mode={mode}
                onSwitch={(next) =>
                  switchRangePrecision('kinhNghiemLamViec', item.id, 'tuNgay', 'denNgay', next)
                }
              />
              <Row>
                <PartialDateField
                  label="Thời gian bắt đầu"
                  precision={mode}
                  value={item.tuNgay}
                  onChange={(next) =>
                    updateList('kinhNghiemLamViec', item.id, 'tuNgay', next)
                  }
                />
                <PartialDateField
                  label="Thời gian kết thúc"
                  precision={mode}
                  value={item.denNgay}
                  disabled={item.isHienTai}
                  onChange={(next) =>
                    updateList('kinhNghiemLamViec', item.id, 'denNgay', next)
                  }
                />
              </Row>
              <CheckRow
                label="Tôi hiện vẫn đang làm việc ở đây"
                checked={item.isHienTai}
                onToggle={(next) =>
                  setCurrentFlag('kinhNghiemLamViec', item.id, next)
                }
              />
              <FieldError message={err} />
              <CvInput
                value={item.moTa}
                onChangeText={(next) =>
                  updateList('kinhNghiemLamViec', item.id, 'moTa', next)
                }
                placeholder="Mô tả công việc, thành tựu..."
                multiline
                numberOfLines={3}
                maxLength={CV_MAX_LENGTH.bullet}
                showCounter
              />
              <QuickActionBar
                value={item.moTa}
                maxLength={CV_MAX_LENGTH.bullet}
                onApply={(next) => updateList('kinhNghiemLamViec', item.id, 'moTa', next)}
              />
              <ChipInput
                values={item.kyNangSuDung}
                onChange={(next) =>
                  updateList('kinhNghiemLamViec', item.id, 'kyNangSuDung', next)
                }
                placeholder="Kỹ năng sử dụng — gõ rồi nhấn Done"
                maxLength={CV_MAX_LENGTH.skillTag}
              />
            </ItemCard>
          );
        })
      )}
    </SectionShell>
  );

  const educationSection = (
    <SectionShell
      title="Học vấn"
      icon={<GraduationCap size={16} color={theme.primary} />}
      order={orderOf('education')}
      countLabel={countLabel(data.hocVan.length, 'học vấn')}
      visible={isSectionVisible('education')}
      onToggleVisibility={() => toggleSection('education')}
      onLayout={report('education')}
      actions={sectionHeaderButton('Thêm học vấn', () => {
        const item: HocVanItem = {
          id: newId(),
          truong: '',
          chuyenNganh: '',
          tuNgay: '',
          denNgay: '',
          moTa: '',
        };
        onChange({ ...data, hocVan: [...data.hocVan, item] });
      })}
    >
      <WritingTips items={['Ghi rõ niên khóa, chuyên ngành và thành tích nổi bật nếu có']} />
      {data.hocVan.length === 0 ? (
        <EmptyHint text='Chưa có học vấn nào. Nhấn "Thêm" để bắt đầu.' />
      ) : (
        data.hocVan.map((item) => {
          const mode = modeFor(item.id, item.tuNgay, item.denNgay, 'year_only');
          const err = rangeErrorText(item.tuNgay, item.denNgay, item.isHienTai);
          return (
            <ItemCard key={item.id}>
              <Row>
                <CvInput
                  value={item.truong}
                  onChangeText={(next) => updateList('hocVan', item.id, 'truong', next)}
                  placeholder="Trường *"
                  maxLength={120}
                  style={styles.flex1}
                />
                <CvInput
                  value={item.chuyenNganh}
                  onChangeText={(next) =>
                    updateList('hocVan', item.id, 'chuyenNganh', next)
                  }
                  placeholder="Chuyên ngành"
                  maxLength={120}
                  style={styles.flex1}
                />
                <DeleteButton label="Xóa học vấn" onPress={() => removeFrom('hocVan', item.id)} />
              </Row>
              <PrecisionToggle
                mode={mode}
                onSwitch={(next) => switchRangePrecision('hocVan', item.id, 'tuNgay', 'denNgay', next)}
              />
              <Row>
                <PartialDateField
                  label="Thời gian bắt đầu"
                  precision={mode}
                  value={item.tuNgay}
                  onChange={(next) => updateList('hocVan', item.id, 'tuNgay', next)}
                />
                <PartialDateField
                  label="Thời gian kết thúc"
                  precision={mode}
                  value={item.denNgay}
                  disabled={item.isHienTai}
                  onChange={(next) => updateList('hocVan', item.id, 'denNgay', next)}
                />
              </Row>
              <CheckRow
                label="Tôi hiện vẫn đang học tập ở đây"
                checked={item.isHienTai === true}
                onToggle={(next) => setCurrentFlag('hocVan', item.id, next)}
              />
              <FieldError message={err} />
              <CvInput
                value={item.moTa}
                onChangeText={(next) => updateList('hocVan', item.id, 'moTa', next)}
                placeholder="Mô tả thêm..."
                multiline
                numberOfLines={2}
                maxLength={CV_MAX_LENGTH.bullet}
                showCounter
              />
            </ItemCard>
          );
        })
      )}
    </SectionShell>
  );

  const skillsSection = (
    <SectionShell
      title="Kỹ năng"
      icon={<Wrench size={16} color={theme.primary} />}
      order={orderOf('skills')}
      countLabel={countLabel(data.kyNang.length, 'kỹ năng')}
      visible={isSectionVisible('skills')}
      onToggleVisibility={() => toggleSection('skills')}
      onLayout={report('skills')}
      actions={sectionHeaderButton('Thêm kỹ năng', () => {
        const item: KyNangItem = {
          id: newId(),
          tenKyNang: '',
          mucDoThanhThao: '0',
          soNamKinhNghiem: '',
        };
        onChange({ ...data, kyNang: [...data.kyNang, item] });
      })}
    >
      {data.kyNang.length === 0 ? (
        <EmptyHint text='Chưa có kỹ năng nào. Nhấn "Thêm" để bắt đầu.' />
      ) : (
        data.kyNang.map((item) => (
          <ItemCard key={item.id}>
            <Row>
              <CvInput
                value={item.tenKyNang}
                onChangeText={(next) => updateList('kyNang', item.id, 'tenKyNang', next)}
                placeholder="Tên kỹ năng *"
                maxLength={CV_MAX_LENGTH.skillTag}
                style={styles.flex2}
              />
              <DeleteButton label="Xóa kỹ năng" onPress={() => removeFrom('kyNang', item.id)} />
            </Row>
            <Row>
              <View style={styles.flex1}>
                <FormSelect
                  label="Mức độ thành thạo"
                  value={item.mucDoThanhThao || '0'}
                  placeholder="Chọn mức độ"
                  options={SKILL_LEVEL_OPTIONS}
                  onSelect={(next) => updateList('kyNang', item.id, 'mucDoThanhThao', next)}
                />
              </View>
              <CvInput
                label="Số năm"
                value={item.soNamKinhNghiem}
                onChangeText={(next) =>
                  updateList('kyNang', item.id, 'soNamKinhNghiem', next.replace(/[^\d.]/g, ''))
                }
                placeholder="VD: 3"
                keyboardType="decimal-pad"
                style={styles.flex1}
              />
            </Row>
          </ItemCard>
        ))
      )}
    </SectionShell>
  );

  const projectsSection = (
    <SectionShell
      title="Dự án"
      icon={<FolderGit2 size={16} color={theme.primary} />}
      order={orderOf('projects')}
      countLabel={countLabel(data.duAn.length, 'dự án')}
      visible={isSectionVisible('projects')}
      onToggleVisibility={() => toggleSection('projects')}
      onLayout={report('projects')}
      actions={sectionHeaderButton('Thêm dự án', () => {
        const item: DuAnItem = {
          id: newId(),
          tenDuAn: '',
          vaiTro: '',
          congNghe: [],
          link: '',
          moTa: '',
          tuNgay: '',
          denNgay: '',
        };
        onChange({ ...data, duAn: [...data.duAn, item] });
      })}
    >
      {data.duAn.length === 0 ? (
        <EmptyHint text="Chưa có dự án nào." />
      ) : (
        data.duAn.map((item) => {
          const mode = modeFor(item.id, item.tuNgay, item.denNgay);
          const err = rangeErrorText(item.tuNgay, item.denNgay, item.isHienTai);
          return (
            <ItemCard key={item.id}>
              <Row>
                <CvInput
                  value={item.tenDuAn}
                  onChangeText={(next) => updateList('duAn', item.id, 'tenDuAn', next)}
                  placeholder="Tên dự án *"
                  maxLength={CV_MAX_LENGTH.shortTitle}
                  style={styles.flex1}
                />
                <CvInput
                  value={item.vaiTro}
                  onChangeText={(next) => updateList('duAn', item.id, 'vaiTro', next)}
                  placeholder="Vai trò"
                  style={styles.flex1}
                />
                <DeleteButton label="Xóa dự án" onPress={() => removeFrom('duAn', item.id)} />
              </Row>
              <PrecisionToggle
                mode={mode}
                onSwitch={(next) => switchRangePrecision('duAn', item.id, 'tuNgay', 'denNgay', next)}
              />
              <Row>
                <PartialDateField
                  label="Thời gian bắt đầu"
                  precision={mode}
                  value={item.tuNgay}
                  onChange={(next) => updateList('duAn', item.id, 'tuNgay', next)}
                />
                <PartialDateField
                  label="Thời gian kết thúc"
                  precision={mode}
                  value={item.denNgay}
                  disabled={item.isHienTai}
                  onChange={(next) => updateList('duAn', item.id, 'denNgay', next)}
                />
              </Row>
              <CheckRow
                label="Đang thực hiện"
                checked={item.isHienTai === true}
                onToggle={(next) => setCurrentFlag('duAn', item.id, next)}
              />
              <FieldError message={err} />
              <ChipInput
                values={item.congNghe}
                onChange={(next) => updateList('duAn', item.id, 'congNghe', next)}
                placeholder="Công nghệ — gõ rồi nhấn Done"
                maxLength={CV_MAX_LENGTH.skillTag}
              />
              <CvInput
                value={item.link}
                onChangeText={(next) => updateList('duAn', item.id, 'link', next)}
                placeholder="Link dự án"
                autoCapitalize="none"
                keyboardType="url"
                error={urlErr(item.link)}
                style={styles.gapTight}
              />
              <CvInput
                value={item.moTa}
                onChangeText={(next) => updateList('duAn', item.id, 'moTa', next)}
                placeholder="Mô tả dự án..."
                multiline
                numberOfLines={2}
                maxLength={CV_MAX_LENGTH.bullet}
                showCounter
              />
              <QuickActionBar
                value={item.moTa}
                maxLength={CV_MAX_LENGTH.bullet}
                onApply={(next) => updateList('duAn', item.id, 'moTa', next)}
              />
            </ItemCard>
          );
        })
      )}
    </SectionShell>
  );

  const certificatesSection = (
    <SectionShell
      title="Chứng chỉ"
      icon={<Award size={16} color={theme.primary} />}
      order={orderOf('certificates')}
      countLabel={countLabel(data.chungChi.length, 'chứng chỉ')}
      visible={isSectionVisible('certificates')}
      onToggleVisibility={() => toggleSection('certificates')}
      onLayout={report('certificates')}
      actions={sectionHeaderButton('Thêm chứng chỉ', () => {
        const item: ChungChiItem = {
          id: newId(),
          tenChungChi: '',
          donViCap: '',
          ngayCap: '',
          maXacMinh: '',
        };
        onChange({ ...data, chungChi: [...data.chungChi, item] });
      })}
    >
      {data.chungChi.length === 0 ? (
        <EmptyHint text="Chưa có chứng chỉ nào." />
      ) : (
        data.chungChi.map((item) => {
          const mode = modeFor(item.id, item.ngayCap, '');
          return (
            <ItemCard key={item.id}>
              <Row>
                <CvInput
                  value={item.tenChungChi}
                  onChangeText={(next) =>
                    updateList('chungChi', item.id, 'tenChungChi', next)
                  }
                  placeholder="Tên chứng chỉ *"
                  maxLength={120}
                  style={styles.flex1}
                />
                <CvInput
                  value={item.donViCap}
                  onChangeText={(next) => updateList('chungChi', item.id, 'donViCap', next)}
                  placeholder="Đơn vị cấp"
                  maxLength={120}
                  style={styles.flex1}
                />
                <DeleteButton
                  label="Xóa chứng chỉ"
                  onPress={() => removeFrom('chungChi', item.id)}
                />
              </Row>
              <PrecisionToggle
                mode={mode}
                onSwitch={(next) => switchRangePrecision('chungChi', item.id, 'ngayCap', null, next)}
              />
              <Row>
                <PartialDateField
                  label="Ngày cấp"
                  precision={mode}
                  value={item.ngayCap}
                  onChange={(next) => updateList('chungChi', item.id, 'ngayCap', next)}
                />
                <CvInput
                  label="Mã xác minh"
                  value={item.maXacMinh}
                  onChangeText={(next) => updateList('chungChi', item.id, 'maXacMinh', next)}
                  placeholder="Mã xác minh"
                  maxLength={80}
                />
              </Row>
              <Row>
                <CvInput
                  label="Ngày hết hạn"
                  value={item.ngayHetHan ?? ''}
                  onChangeText={(next) =>
                    updateList('chungChi', item.id, 'ngayHetHan', maskMonthYear(next))
                  }
                  placeholder="MM/YYYY hoặc để trống"
                  keyboardType="number-pad"
                  maxLength={7}
                />
                <CvInput
                  label="Link xác minh"
                  value={item.credentialUrl ?? ''}
                  onChangeText={(next) => updateList('chungChi', item.id, 'credentialUrl', next)}
                  placeholder="https://..."
                  autoCapitalize="none"
                  keyboardType="url"
                  error={urlErr(item.credentialUrl ?? '')}
                />
              </Row>
            </ItemCard>
          );
        })
      )}
    </SectionShell>
  );

  return (
    <View style={styles.stack}>
      {contactSection}
      {experienceSection}
      {educationSection}
      {skillsSection}
      {projectsSection}
      {certificatesSection}
    </View>
  );
}

function parseIntoYear(value: string): number | null {
  const t = (value || '').trim();
  if (!t) return null;
  if (/^\d{4}$/.test(t)) return Number(t);
  const monthYear = /^(\d{1,2})\/(\d{4})$/.exec(t);
  if (monthYear) return Number(monthYear[2]);
  const day = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (day) return Number(day[3]);
  return null;
}

const styles = StyleSheet.create({
  stack: { gap: 14 },
  section: {
    gap: 10,
    padding: 14,
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    backgroundColor: 'transparent',
  },
  sectionHidden: { opacity: 0.7 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sectionIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleWrap: { flex: 1, gap: 2 },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  itemCard: {
    padding: 12,
    marginBottom: 10,
    gap: 10,
    borderRadius: Radius.xl,
  },
  empty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
  },
  quickActions: { flexDirection: 'row', marginTop: -2 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarBox: {
    width: 72,
    height: 72,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: { width: 72, height: 72, borderRadius: 999 },
  avatarMeta: { flex: 1, gap: 2 },
  flex1: { flex: 1 },
  flex2: { flex: 2 },
  gapTight: { marginBottom: 0 },
});
