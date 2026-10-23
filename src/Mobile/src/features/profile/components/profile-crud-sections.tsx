import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { jobsApi } from '@/features/jobs/api/jobs-api';
import {
  profileExtrasApi,
  type ExperienceEntry,
  type SkillEntry,
} from '@/features/profile/api/profile-extra-api';
import {
  ListSurface,
  ProfileEmptyState,
  ProfileSkeletonRows,
} from '@/features/profile/components/profile-sections';
import { isoToMonthYear, isoToVnDate, maskDateVn, vnToIsoDate } from '@/features/profile/format-date';
import { useTheme } from '@/hooks/use-theme';

type Notice = { type: 'success' | 'error'; message: string } | null;

function ErrorBanner({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.banner,
        { borderColor: `${theme.destructive}4D`, backgroundColor: `${theme.destructive}0D` },
      ]}>
      <ThemedText style={[styles.bannerText, { color: theme.destructive }]}>{message}</ThemedText>
    </View>
  );
}

function SuccessBanner({ message }: { message: string }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.banner,
        { borderColor: `${theme.primary}4D`, backgroundColor: `${theme.primary}0D` },
      ]}>
      <ThemedText style={[styles.bannerText, { color: theme.primary }]}>{message}</ThemedText>
    </View>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <ThemedText style={styles.fieldLabel}>
        {label}
        {required ? <ThemedText style={{ color: theme.destructive }}> *</ThemedText> : null}
      </ThemedText>
      {children}
    </View>
  );
}

function TextInputBox({
  value,
  onChangeText,
  placeholder,
  editable = true,
  multiline = false,
  keyboardType,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
  editable?: boolean;
  multiline?: boolean;
  keyboardType?: 'number-pad' | 'decimal-pad' | 'default';
}) {
  const theme = useTheme();
  if (multiline) {
    return (
      <TextInput
        editable={editable}
        multiline
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.primary}
        style={[
          styles.textarea,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: theme.input,
            color: theme.text,
          },
        ]}
        textAlignVertical="top"
        value={value}
      />
    );
  }
  return (
    <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
      <TextInput
        editable={editable}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        selectionColor={theme.primary}
        style={[styles.input, { color: theme.text }]}
        value={value}
      />
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* 3. KINH NGHIỆM LÀM VIỆC (clone Web /kinh-nghiem)              */
/* ══════════════════════════════════════════════════════════════ */

const EMPTY_EXPERIENCE_FORM = {
  tenCongTy: '',
  diaChi: '',
  tuNgay: '',
  denNgay: '',
  moTa: '',
  isHienTai: false,
};

type ExperienceForm = typeof EMPTY_EXPERIENCE_FORM;

export function ExperienceSection() {
  const theme = useTheme();
  const [items, setItems] = useState<ExperienceEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<ExperienceEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ExperienceForm>(EMPTY_EXPERIENCE_FORM);

  const load = useCallback(() => {
    return profileExtrasApi
      .listExperience()
      .then((rows) => {
        setItems(rows);
        setLoadError('');
      })
      .catch((error: unknown) => {
        setLoadError(error instanceof Error ? error.message : 'Không tải được kinh nghiệm.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setNotice(null);
    setEditing(null);
    setForm(EMPTY_EXPERIENCE_FORM);
    setShowForm(true);
  };

  const openEdit = (item: ExperienceEntry) => {
    setNotice(null);
    setEditing(item);
    setForm({
      tenCongTy: item.tenCongTy,
      diaChi: item.diaChi,
      tuNgay: isoToVnDate(item.tuNgay),
      denNgay: isoToVnDate(item.denNgay),
      moTa: item.moTa,
      isHienTai: item.isHienTai,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_EXPERIENCE_FORM);
    setShowForm(false);
  };

  const tuNgayInvalid = form.tuNgay.trim() !== '' && vnToIsoDate(form.tuNgay) === '';
  const denNgayInvalid =
    !form.isHienTai && form.denNgay.trim() !== '' && vnToIsoDate(form.denNgay) === '';

  const handleSubmit = () => {
    if (!form.tenCongTy.trim()) {
      setNotice({ type: 'error', message: 'Tên công ty không được để trống' });
      return;
    }
    if (tuNgayInvalid || denNgayInvalid) {
      setNotice({ type: 'error', message: 'Ngày không hợp lệ (dd/mm/yyyy).' });
      return;
    }

    const payload = {
      tenCongTy: form.tenCongTy.trim(),
      diaChi: form.diaChi.trim(),
      tuNgay: vnToIsoDate(form.tuNgay),
      denNgay: vnToIsoDate(form.denNgay),
      moTa: form.moTa.trim(),
      isHienTai: form.isHienTai,
    };

    void (async () => {
      setSaving(true);
      setNotice(null);
      try {
        const message = editing
          ? await profileExtrasApi.updateExperience(editing.id, payload)
          : await profileExtrasApi.createExperience(payload);
        resetForm();
        setNotice({
          type: 'success',
          message: message || (editing ? 'Cập nhật thành công.' : 'Thêm kinh nghiệm thành công.'),
        });
        await load();
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : 'Không thể lưu',
        });
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleDelete = (item: ExperienceEntry) => {
    Alert.alert(
      'Xóa kinh nghiệm?',
      `Xóa kinh nghiệm tại "${item.tenCongTy}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setNotice(null);
              try {
                const message = await profileExtrasApi.removeExperience(item.id);
                if (editing?.id === item.id) resetForm();
                setNotice({ type: 'success', message: message || 'Xóa thành công.' });
                await load();
              } catch (error) {
                setNotice({
                  type: 'error',
                  message: error instanceof Error ? error.message : 'Không thể xóa',
                });
              }
            })();
          },
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          3. KINH NGHIỆM LÀM VIỆC
        </ThemedText>
        <Button
          disabled={loading || saving}
          onPress={openCreate}
          size="sm"
          style={styles.addButton}
          variant="outline">
          + Thêm
        </Button>
      </View>

      {notice?.type === 'error' ? <ErrorBanner message={notice.message} /> : null}
      {notice?.type === 'success' ? <SuccessBanner message={notice.message} /> : null}

      {showForm ? (
        <View style={[styles.formCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <ThemedText style={[styles.formTitle, { color: theme.text }]}>
                {editing ? 'Chỉnh sửa kinh nghiệm' : 'Thêm kinh nghiệm mới'}
              </ThemedText>
              <ThemedText style={[styles.formCaption, { color: theme.textSecondary }]}>
                {editing ? 'Cập nhật thông tin kinh nghiệm.' : 'Thêm kinh nghiệm làm việc vào hồ sơ.'}
              </ThemedText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" hitSlop={8} onPress={resetForm}>
              <ThemedText style={[styles.formClose, { color: theme.textSecondary }]}>✕</ThemedText>
            </Pressable>
          </View>

          <Field label="TÊN CÔNG TY" required>
            <TextInputBox
              editable={!saving}
              onChangeText={(text) => setForm((prev) => ({ ...prev, tenCongTy: text }))}
              placeholder="VD: FPT Software"
              value={form.tenCongTy}
            />
          </Field>

          <Field label="ĐỊA CHỈ">
            <TextInputBox
              editable={!saving}
              onChangeText={(text) => setForm((prev) => ({ ...prev, diaChi: text }))}
              placeholder="VD: Hà Nội"
              value={form.diaChi}
            />
          </Field>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <Field label="TỪ NGÀY">
                <TextInputBox
                  editable={!saving}
                  keyboardType="number-pad"
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, tuNgay: maskDateVn(text) }))
                  }
                  placeholder="dd/mm/yyyy"
                  value={form.tuNgay}
                />
                {tuNgayInvalid ? (
                  <ThemedText style={[styles.fieldError, { color: theme.destructive }]}>
                    Ngày không hợp lệ
                  </ThemedText>
                ) : null}
              </Field>
            </View>
            <View style={styles.fieldHalf}>
              <Field label="ĐẾN NGÀY">
                <TextInputBox
                  editable={!saving && !form.isHienTai}
                  keyboardType="number-pad"
                  onChangeText={(text) =>
                    setForm((prev) => ({ ...prev, denNgay: maskDateVn(text) }))
                  }
                  placeholder={form.isHienTai ? 'Đang làm tại đây' : 'dd/mm/yyyy'}
                  value={form.isHienTai ? '' : form.denNgay}
                />
                {denNgayInvalid ? (
                  <ThemedText style={[styles.fieldError, { color: theme.destructive }]}>
                    Ngày không hợp lệ
                  </ThemedText>
                ) : null}
              </Field>
            </View>
          </View>

          <Pressable
            accessibilityRole="checkbox"
            accessibilityState={{ checked: form.isHienTai }}
            disabled={saving}
            onPress={() => setForm((prev) => ({ ...prev, isHienTai: !prev.isHienTai }))}
            style={[
              styles.checkboxRow,
              { borderColor: theme.border, backgroundColor: theme.muted },
            ]}>
            <View
              style={[
                styles.checkbox,
                {
                  backgroundColor: form.isHienTai ? theme.primary : theme.backgroundElement,
                  borderColor: form.isHienTai ? theme.primary : theme.input,
                },
              ]}>
              {form.isHienTai ? (
                <ThemedText style={[styles.checkMark, { color: theme.primaryForeground }]}>✓</ThemedText>
              ) : null}
            </View>
            <ThemedText style={[styles.checkboxText, { color: theme.text }]}>
              Đang làm tại đây
            </ThemedText>
          </Pressable>

          <Field label="MÔ TẢ CÔNG VIỆC">
            <TextInputBox
              editable={!saving}
              multiline
              onChangeText={(text) => setForm((prev) => ({ ...prev, moTa: text }))}
              placeholder="Mô tả trách nhiệm và thành tích..."
              value={form.moTa}
            />
          </Field>

          <View style={styles.formActions}>
            <Button disabled={saving} onPress={resetForm} style={styles.formButton} variant="outline">
              Hủy
            </Button>
            <Button
              disabled={saving}
              icon={
                saving ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : undefined
              }
              onPress={handleSubmit}
              style={styles.formButton}>
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm kinh nghiệm'}
            </Button>
          </View>
        </View>
      ) : null}

      <View style={styles.listHeader}>
        <ThemedText style={[styles.listCaption, { color: theme.textSecondary }]}>
          {`${items.length} kinh nghiệm trong hồ sơ`}
        </ThemedText>
      </View>

      <ListSurface>
        {loading ? (
          <ProfileSkeletonRows count={2} />
        ) : loadError ? (
          <ProfileEmptyState
            actionLabel="Thử lại"
            message={loadError}
            onAction={() => {
              setLoading(true);
              setLoadError('');
              void load();
            }}
            title="Không tải được kinh nghiệm"
          />
        ) : items.length === 0 ? (
          <ProfileEmptyState
            actionLabel="Thêm kinh nghiệm"
            message="Thêm kinh nghiệm làm việc để nhà tuyển dụng hiểu rõ hơn về bạn."
            onAction={openCreate}
            title="Chưa có kinh nghiệm"
          />
        ) : (
          items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
              ]}>
              <View style={styles.itemCopy}>
                <ThemedText style={[styles.itemTitle, { color: theme.text }]}>
                  {item.tenCongTy}
                </ThemedText>
                <ThemedText style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {item.diaChi || '—'}
                </ThemedText>
                <ThemedText style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {`${isoToMonthYear(item.tuNgay)} — ${item.isHienTai ? 'Hiện tại' : isoToMonthYear(item.denNgay)}`}
                </ThemedText>
                {item.moTa ? (
                  <ThemedText numberOfLines={2} style={[styles.itemDesc, { color: theme.textSecondary }]}>
                    {item.moTa}
                  </ThemedText>
                ) : null}
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={() => openEdit(item)}
                  style={({ pressed }) => [
                    styles.actionPill,
                    { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <ThemedText style={[styles.actionText, { color: theme.text }]}>Sửa</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={() => handleDelete(item)}
                  style={({ pressed }) => [
                    styles.actionPill,
                    {
                      borderColor: `${theme.destructive}66`,
                      backgroundColor: `${theme.destructive}0D`,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <ThemedText style={[styles.actionText, { color: theme.destructive }]}>Xóa</ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ListSurface>
    </View>
  );
}

/* ══════════════════════════════════════════════════════════════ */
/* 4. KỸ NĂNG CỦA TÔI (clone Web /ky-nang-ung-vien)              */
/* ══════════════════════════════════════════════════════════════ */

type CatalogSkill = { id: number; name: string };

export function SkillsSection() {
  const theme = useTheme();
  const [catalog, setCatalog] = useState<CatalogSkill[]>([]);
  const [items, setItems] = useState<SkillEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [notice, setNotice] = useState<Notice>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<SkillEntry | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState(0);
  const [search, setSearch] = useState('');
  const [soNam, setSoNam] = useState('');

  const nameOf = useCallback(
    (kyNangId: number) => catalog.find((skill) => skill.id === kyNangId)?.name ?? `Kỹ năng #${kyNangId}`,
    [catalog],
  );

  const load = useCallback(() => {
    return Promise.allSettled([jobsApi.getFilterOptions(), profileExtrasApi.listSkills()])
      .then(([optionsResult, skillsResult]) => {
        if (optionsResult.status === 'fulfilled') {
          setCatalog(optionsResult.value.skills);
        }
        if (skillsResult.status === 'fulfilled') {
          setItems(skillsResult.value);
          setLoadError('');
        } else {
          setLoadError(
            skillsResult.reason instanceof Error
              ? skillsResult.reason.message
              : 'Không tải được danh sách kỹ năng.',
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const usedIds = new Set(items.map((skill) => skill.kyNangId));
  const available = catalog.filter(
    (skill) => !usedIds.has(skill.id) || (editing !== null && editing.kyNangId === skill.id),
  );
  const filtered = available.filter((skill) =>
    search.trim() ? skill.name.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')) : true,
  );

  const openCreate = () => {
    setNotice(null);
    setEditing(null);
    setSelectedId(available[0]?.id ?? 0);
    setSoNam('');
    setSearch('');
    setShowForm(true);
  };

  const openEdit = (item: SkillEntry) => {
    setNotice(null);
    setEditing(item);
    setSelectedId(item.kyNangId);
    setSoNam(item.soNamKinhNghiem !== null ? String(item.soNamKinhNghiem) : '');
    setSearch('');
    setShowForm(true);
  };

  const resetForm = () => {
    setEditing(null);
    setSelectedId(0);
    setSoNam('');
    setSearch('');
    setShowForm(false);
  };

  const handleSubmit = () => {
    if (!selectedId) {
      setNotice({ type: 'error', message: 'Vui lòng chọn kỹ năng' });
      return;
    }
    let years: number | null = null;
    if (soNam.trim()) {
      const parsed = Number(soNam.trim().replace(',', '.'));
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 50) {
        setNotice({ type: 'error', message: 'Số năm kinh nghiệm phải từ 0 đến 50.' });
        return;
      }
      years = parsed;
    }

    void (async () => {
      setSaving(true);
      setNotice(null);
      try {
        const message = editing
          ? await profileExtrasApi.updateSkill(editing.id, selectedId, years)
          : await profileExtrasApi.addSkill(selectedId, years);
        resetForm();
        setNotice({
          type: 'success',
          message: message || (editing ? 'Cập nhật thành công.' : 'Thêm kỹ năng thành công.'),
        });
        await load();
      } catch (error) {
        setNotice({
          type: 'error',
          message: error instanceof Error ? error.message : 'Không thể lưu',
        });
      } finally {
        setSaving(false);
      }
    })();
  };

  const handleDelete = (item: SkillEntry) => {
    const name = nameOf(item.kyNangId);
    Alert.alert('Xóa kỹ năng?', `Xóa kỹ năng "${name}" khỏi hồ sơ?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setNotice(null);
            try {
              const message = await profileExtrasApi.removeSkill(item.id);
              if (editing?.id === item.id) resetForm();
              setNotice({ type: 'success', message: message || 'Xóa kỹ năng thành công.' });
              await load();
            } catch (error) {
              setNotice({
                type: 'error',
                message: error instanceof Error ? error.message : 'Không thể xóa',
              });
            }
          })();
        },
      },
    ]);
  };

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          4. KỸ NĂNG CỦA TÔI
        </ThemedText>
        <Button
          disabled={loading || saving || (available.length === 0 && !editing)}
          onPress={openCreate}
          size="sm"
          style={styles.addButton}
          variant="outline">
          + Thêm
        </Button>
      </View>

      {notice?.type === 'error' ? <ErrorBanner message={notice.message} /> : null}
      {notice?.type === 'success' ? <SuccessBanner message={notice.message} /> : null}

      {showForm ? (
        <View style={[styles.formCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
          <View style={styles.formHeader}>
            <View style={styles.formHeaderCopy}>
              <ThemedText style={[styles.formTitle, { color: theme.text }]}>
                {editing ? 'Chỉnh sửa kỹ năng' : 'Thêm kỹ năng mới'}
              </ThemedText>
              <ThemedText style={[styles.formCaption, { color: theme.textSecondary }]}>
                {editing
                  ? 'Cập nhật số năm kinh nghiệm.'
                  : 'Chọn kỹ năng từ từ điển và điền số năm kinh nghiệm.'}
              </ThemedText>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" hitSlop={8} onPress={resetForm}>
              <ThemedText style={[styles.formClose, { color: theme.textSecondary }]}>✕</ThemedText>
            </Pressable>
          </View>

          <Field label="KỸ NĂNG" required>
            {editing ? (
              <View
                style={[
                  styles.inputWrap,
                  { backgroundColor: theme.muted, borderColor: theme.input },
                ]}>
                <ThemedText style={[styles.input, { color: theme.textSecondary }]}>
                  {nameOf(editing.kyNangId)}
                </ThemedText>
              </View>
            ) : (
              <View style={styles.pickerBox}>
                <View style={[styles.inputWrap, { backgroundColor: theme.backgroundElement, borderColor: theme.input }]}>
                  <TextInput
                    editable={!saving}
                    onChangeText={setSearch}
                    placeholder="Tìm kỹ năng..."
                    placeholderTextColor={theme.textSecondary}
                    selectionColor={theme.primary}
                    style={[styles.input, { color: theme.text }]}
                    value={search}
                  />
                </View>
                <ScrollView
                  nestedScrollEnabled
                  style={[styles.pickerList, { borderColor: theme.border, backgroundColor: theme.background }]}
                  keyboardShouldPersistTaps="handled">
                  {filtered.length === 0 ? (
                    <ThemedText style={[styles.pickerEmpty, { color: theme.textSecondary }]}>
                      {search.trim() ? 'Không tìm thấy kỹ năng.' : 'Đã thêm hết kỹ năng trong từ điển.'}
                    </ThemedText>
                  ) : (
                    filtered.map((skill) => {
                      const active = selectedId === skill.id;
                      return (
                        <Pressable
                          key={skill.id}
                          accessibilityRole="button"
                          disabled={saving}
                          onPress={() => setSelectedId(skill.id)}
                          style={[
                            styles.pickerItem,
                            {
                              backgroundColor: active ? theme.backgroundSelected : 'transparent',
                            },
                          ]}>
                          <View
                            style={[
                              styles.radio,
                              {
                                borderColor: active ? theme.primary : theme.input,
                                backgroundColor: active ? theme.primary : theme.backgroundElement,
                              },
                            ]}>
                            {active ? (
                              <ThemedText style={[styles.checkMark, { color: theme.primaryForeground }]}>
                                ✓
                              </ThemedText>
                            ) : null}
                          </View>
                          <ThemedText style={[styles.pickerItemText, { color: theme.text }]}>
                            {skill.name}
                          </ThemedText>
                        </Pressable>
                      );
                    })
                  )}
                </ScrollView>
                {selectedId ? (
                  <ThemedText style={[styles.pickedHint, { color: theme.primary }]}>
                    {`Đã chọn: ${nameOf(selectedId)}`}
                  </ThemedText>
                ) : null}
              </View>
            )}
          </Field>

          <Field label="SỐ NĂM KINH NGHIỆM">
            <TextInputBox
              editable={!saving}
              keyboardType="decimal-pad"
              onChangeText={setSoNam}
              placeholder="VD: 2.5"
              value={soNam}
            />
          </Field>

          <View style={styles.formActions}>
            <Button disabled={saving} onPress={resetForm} style={styles.formButton} variant="outline">
              Hủy
            </Button>
            <Button
              disabled={saving}
              icon={
                saving ? <ActivityIndicator size="small" color={theme.primaryForeground} /> : undefined
              }
              onPress={handleSubmit}
              style={styles.formButton}>
              {saving ? 'Đang lưu...' : editing ? 'Lưu thay đổi' : 'Thêm kỹ năng'}
            </Button>
          </View>
        </View>
      ) : null}

      <View style={styles.listHeader}>
        <ThemedText style={[styles.listCaption, { color: theme.textSecondary }]}>
          {`${items.length} kỹ năng trong hồ sơ`}
        </ThemedText>
      </View>

      <ListSurface>
        {loading ? (
          <ProfileSkeletonRows count={2} />
        ) : loadError ? (
          <ProfileEmptyState
            actionLabel="Thử lại"
            message={loadError}
            onAction={() => {
              setLoading(true);
              setLoadError('');
              void load();
            }}
            title="Không tải được kỹ năng"
          />
        ) : items.length === 0 ? (
          <ProfileEmptyState
            actionLabel="Thêm kỹ năng"
            message="Thêm kỹ năng để tăng cơ hội việc làm."
            onAction={openCreate}
            title="Chưa có kỹ năng"
          />
        ) : (
          items.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.itemRow,
                index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
              ]}>
              <View style={styles.itemCopy}>
                <ThemedText style={[styles.itemTitle, { color: theme.text }]}>
                  {nameOf(item.kyNangId)}
                </ThemedText>
                <ThemedText style={[styles.itemMeta, { color: theme.textSecondary }]}>
                  {item.soNamKinhNghiem !== null
                    ? `${item.soNamKinhNghiem} năm kinh nghiệm`
                    : 'Chưa có số năm'}
                </ThemedText>
              </View>
              <View style={styles.itemActions}>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={() => openEdit(item)}
                  style={({ pressed }) => [
                    styles.actionPill,
                    { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
                  ]}>
                  <ThemedText style={[styles.actionText, { color: theme.text }]}>Sửa</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={() => handleDelete(item)}
                  style={({ pressed }) => [
                    styles.actionPill,
                    {
                      borderColor: `${theme.destructive}66`,
                      backgroundColor: `${theme.destructive}0D`,
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}>
                  <ThemedText style={[styles.actionText, { color: theme.destructive }]}>Xóa</ThemedText>
                </Pressable>
              </View>
            </View>
          ))
        )}
      </ListSurface>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  headingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sectionTitle: { fontFamily: font('semibold'), fontSize: 11, letterSpacing: 1.2, flex: 1 },
  addButton: { borderRadius: Radius.pill },
  listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listCaption: { fontFamily: font('medium'), fontSize: 12 },
  banner: { borderWidth: 1, borderRadius: Radius.xl, paddingHorizontal: 12, paddingVertical: 10 },
  bannerText: { fontFamily: font('medium'), fontSize: 12, lineHeight: 18, flex: 1 },
  formCard: { borderWidth: 1, borderRadius: Radius['2xl'], padding: 14, gap: 12 },
  formHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 },
  formHeaderCopy: { flex: 1, gap: 2 },
  formTitle: { fontFamily: font('semibold'), fontSize: 14 },
  formCaption: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17 },
  formClose: { fontFamily: font('medium'), fontSize: 14, paddingHorizontal: 6 },
  field: { gap: 6 },
  fieldLabel: {
    fontFamily: font('medium'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  fieldError: { fontFamily: font('medium'), fontSize: 11 },
  fieldRow: { flexDirection: 'row', gap: 10 },
  fieldHalf: { flex: 1 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  input: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 10 },
  textarea: {
    minHeight: 96,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: font('regular'),
    fontSize: 14,
    lineHeight: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { fontFamily: font('bold'), fontSize: 11, lineHeight: 14 },
  checkboxText: { fontFamily: font('medium'), fontSize: 13, flex: 1 },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  formButton: { borderRadius: Radius.xl },
  pickerBox: { gap: 8 },
  pickerList: {
    maxHeight: 208,
    borderRadius: Radius.xl,
    borderWidth: 1,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  pickerItemText: { fontFamily: font('medium'), fontSize: 13, flex: 1 },
  pickerEmpty: {
    fontFamily: font('regular'),
    fontSize: 13,
    paddingVertical: 16,
    paddingHorizontal: 14,
    textAlign: 'center',
  },
  pickedHint: { fontFamily: font('medium'), fontSize: 12 },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemRow: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  itemCopy: { gap: 2 },
  itemTitle: { fontFamily: font('semibold'), fontSize: 14, lineHeight: 20, flexShrink: 1 },
  itemMeta: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17 },
  itemDesc: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17, marginTop: 4 },
  itemActions: { flexDirection: 'row', gap: 8 },
  actionPill: {
    minHeight: 32,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  actionText: { fontFamily: font('semibold'), fontSize: 12 },
});
