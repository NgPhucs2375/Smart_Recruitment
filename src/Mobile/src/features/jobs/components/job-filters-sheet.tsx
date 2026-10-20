import { useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import {
  EMPLOYMENT_TYPES,
  JOB_LEVELS,
  LOCATIONS,
  MAX_SKILLS,
  SALARY_RANGES,
  WORK_MODES,
  type SalaryRange,
} from '@/features/jobs/constants';
import {
  cloneFilters,
  countActiveFilters,
  createEmptyFilters,
  type JobFilterOptions,
  type JobFilters,
} from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  visible: boolean;
  filters: JobFilters;
  options: JobFilterOptions;
  optionsLoading: boolean;
  optionsError: string | null;
  onRetryOptions: () => void;
  onClose: () => void;
  onApply: (filters: JobFilters) => void;
};

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? theme.primary : theme.border,
          backgroundColor: selected ? theme.backgroundSelected : 'transparent',
        },
      ]}>
      <ThemedText
        numberOfLines={1}
        style={[styles.chipText, { color: selected ? theme.primary : theme.textSecondary }]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText style={styles.sectionTitle}>{title}</ThemedText>
      <View style={styles.chipRow}>{children}</View>
    </View>
  );
}

export function JobFiltersSheet({
  visible,
  filters,
  options,
  optionsLoading,
  optionsError,
  onRetryOptions,
  onClose,
  onApply,
}: Props) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState<JobFilters>(() => cloneFilters(filters));
  const [skillQuery, setSkillQuery] = useState('');

  const resetDraft = () => {
    setDraft(cloneFilters(filters));
    setSkillQuery('');
  };

  const patch = (changes: Partial<JobFilters>) => {
    setDraft((current) => ({ ...current, ...changes }));
  };

  const selectSalary = (range?: SalaryRange) => {
    setDraft((current) => ({
      ...current,
      salaryMin: range?.min,
      salaryMax: range?.max,
    }));
  };

  const toggleSkill = (skillId: number) => {
    setDraft((current) => {
      const selected = current.skillIds.includes(skillId);
      if (!selected && current.skillIds.length >= MAX_SKILLS) return current;
      const skillIds = selected
        ? current.skillIds.filter((id) => id !== skillId)
        : [...current.skillIds, skillId];
      return {
        ...current,
        skillIds,
        matchAllSkills: skillIds.length >= 2 ? current.matchAllSkills : false,
      };
    });
  };

  const normalizedSkillQuery = skillQuery.trim().toLocaleLowerCase('vi');
  const visibleSkills = options.skills
    .filter(
      (skill) =>
        !normalizedSkillQuery ||
        skill.name.toLocaleLowerCase('vi').includes(normalizedSkillQuery),
    )
    .slice(0, 40)
    .filter((skill) => !draft.skillIds.includes(skill.id));

  const activeCount = countActiveFilters(draft);
  const salarySelected = draft.salaryMin !== undefined || draft.salaryMax !== undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onShow={resetDraft}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng bộ lọc"
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <ThemedText style={styles.title}>Bộ lọc</ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Chọn tiêu chí rồi bấm Áp dụng.
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                hitSlop={10}
                onPress={onClose}
                style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                <ThemedText style={[styles.closeText, { color: theme.text }]}>×</ThemedText>
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Section title="Địa điểm">
                <FilterChip
                  label="Tất cả"
                  selected={!draft.location}
                  onPress={() => patch({ location: '' })}
                />
                {LOCATIONS.map((location) => (
                  <FilterChip
                    key={location}
                    label={location}
                    selected={draft.location === location}
                    onPress={() => patch({ location })}
                  />
                ))}
              </Section>

              <Section title="Cấp bậc">
                <FilterChip
                  label="Tất cả"
                  selected={!draft.level}
                  onPress={() => patch({ level: '' })}
                />
                {JOB_LEVELS.map((level) => (
                  <FilterChip
                    key={level}
                    label={level}
                    selected={draft.level === level}
                    onPress={() => patch({ level })}
                  />
                ))}
              </Section>

              <Section title="Hình thức làm việc">
                <FilterChip
                  label="Tất cả"
                  selected={!draft.employmentType}
                  onPress={() => patch({ employmentType: '' })}
                />
                {EMPLOYMENT_TYPES.map((employmentType) => (
                  <FilterChip
                    key={employmentType}
                    label={employmentType}
                    selected={draft.employmentType === employmentType}
                    onPress={() => patch({ employmentType })}
                  />
                ))}
              </Section>

              <Section title="Cách thức làm việc">
                <FilterChip
                  label="Tất cả"
                  selected={!draft.workMode}
                  onPress={() => patch({ workMode: '' })}
                />
                {WORK_MODES.map((workMode) => (
                  <FilterChip
                    key={workMode}
                    label={workMode}
                    selected={draft.workMode === workMode}
                    onPress={() => patch({ workMode })}
                  />
                ))}
              </Section>

              <Section title="Mức lương">
                <FilterChip
                  label="Tất cả"
                  selected={!salarySelected}
                  onPress={() => selectSalary()}
                />
                {SALARY_RANGES.map((range) => (
                  <FilterChip
                    key={range.label}
                    label={range.label}
                    selected={
                      draft.salaryMin === range.min && draft.salaryMax === range.max
                    }
                    onPress={() => selectSalary(range)}
                  />
                ))}
              </Section>

              <Section title="Ngành nghề">
                {optionsLoading ? (
                  <View style={styles.optionState}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <ThemedText style={[styles.helper, { color: theme.textSecondary }]}>
                      Đang tải ngành nghề...
                    </ThemedText>
                  </View>
                ) : optionsError ? (
                  <View style={styles.optionState}>
                    <ThemedText style={[styles.helper, { color: theme.textSecondary, flex: 1 }]}>
                      {optionsError}
                    </ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onRetryOptions}
                      style={styles.retryButton}>
                      <ThemedText style={[styles.retryText, { color: theme.primary }]}>
                        Thử lại
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    <FilterChip
                      label="Tất cả"
                      selected={draft.categoryId === undefined}
                      onPress={() => patch({ categoryId: undefined })}
                    />
                    {options.categories.map((category) => (
                      <FilterChip
                        key={category.id}
                        label={category.name}
                        selected={draft.categoryId === category.id}
                        onPress={() => patch({ categoryId: category.id })}
                      />
                    ))}
                  </>
                )}
              </Section>

              <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Kỹ năng</ThemedText>
                {optionsLoading ? (
                  <View style={styles.optionState}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <ThemedText style={[styles.helper, { color: theme.textSecondary }]}>
                      Đang tải kỹ năng...
                    </ThemedText>
                  </View>
                ) : optionsError ? (
                  <View style={styles.optionState}>
                    <ThemedText style={[styles.helper, { color: theme.textSecondary, flex: 1 }]}>
                      {optionsError}
                    </ThemedText>
                    <Pressable
                      accessibilityRole="button"
                      onPress={onRetryOptions}
                      style={styles.retryButton}>
                      <ThemedText style={[styles.retryText, { color: theme.primary }]}>
                        Thử lại
                      </ThemedText>
                    </Pressable>
                  </View>
                ) : (
                  <>
                    {draft.skillIds.length > 0 ? (
                      <View style={styles.selectedSkills}>
                        {draft.skillIds.map((skillId) => {
                          const name =
                            options.skills.find((skill) => skill.id === skillId)?.name ??
                            `Kỹ năng #${skillId}`;
                          return (
                            <FilterChip
                              key={skillId}
                              label={`${name} ×`}
                              selected
                              onPress={() => toggleSkill(skillId)}
                            />
                          );
                        })}
                      </View>
                    ) : null}

                    <TextInput
                      accessibilityLabel="Tìm kỹ năng"
                      value={skillQuery}
                      onChangeText={setSkillQuery}
                      placeholder="Tìm kỹ năng"
                      placeholderTextColor={theme.textSecondary}
                      autoCorrect={false}
                      returnKeyType="search"
                      style={[
                        styles.search,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                          color: theme.text,
                        },
                      ]}
                    />

                    {visibleSkills.length > 0 ? (
                      <View style={styles.chipRow}>
                        {visibleSkills.map((skill) => (
                          <FilterChip
                            key={skill.id}
                            label={skill.name}
                            selected={false}
                            onPress={() => toggleSkill(skill.id)}
                          />
                        ))}
                      </View>
                    ) : (
                      <ThemedText style={[styles.helper, { color: theme.textSecondary }]}>
                        {options.skills.length === 0
                          ? 'Chưa có kỹ năng nào.'
                          : 'Không tìm thấy kỹ năng phù hợp.'}
                      </ThemedText>
                    )}

                    {draft.skillIds.length >= MAX_SKILLS ? (
                      <ThemedText style={[styles.helper, { color: theme.textSecondary }]}>
                        Đã chọn tối đa {MAX_SKILLS} kỹ năng.
                      </ThemedText>
                    ) : null}

                    {draft.skillIds.length >= 2 ? (
                      <View style={styles.switchRow}>
                        <ThemedText style={styles.switchLabel}>Khớp tất cả kỹ năng</ThemedText>
                        <Switch
                          accessibilityLabel="Khớp tất cả kỹ năng"
                          value={draft.matchAllSkills}
                          onValueChange={(value) => patch({ matchAllSkills: value })}
                          trackColor={{ false: theme.border, true: theme.primary }}
                          thumbColor="#FFFFFF"
                        />
                      </View>
                    ) : null}
                  </>
                )}
              </View>
            </ScrollView>

            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Xóa lọc"
                onPress={() => setDraft(createEmptyFilters())}
                style={({ pressed }) => [
                  styles.clearButton,
                  { backgroundColor: pressed ? theme.muted : 'transparent' },
                ]}>
                <X size={14} color={theme.textSecondary} />
                <ThemedText style={[styles.clearText, { color: theme.textSecondary }]}>
                  Xóa lọc{activeCount > 0 ? ` (${activeCount})` : ''}
                </ThemedText>
              </Pressable>
              <Button pill size="lg" onPress={() => onApply(draft)} style={styles.applyButton}>
                Áp dụng
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardView: { maxHeight: '92%' },
  sheet: {
    maxHeight: '100%',
    borderTopLeftRadius: Radius['2xl'] + 8,
    borderTopRightRadius: Radius['2xl'] + 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  handle: { width: 42, height: 4, borderRadius: 99, alignSelf: 'center', marginBottom: 12 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 10,
  },
  headerCopy: { flex: 1 },
  title: { fontFamily: font('semibold'), fontSize: 18 },
  subtitle: { fontFamily: font('regular'), fontSize: 12, lineHeight: 18, marginTop: 3 },
  closeButton: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontFamily: font('semibold'), fontSize: 20, lineHeight: 24 },
  scroll: { flexShrink: 1 },
  content: { paddingBottom: 14 },
  section: { paddingTop: 14, gap: 10 },
  sectionTitle: { fontFamily: font('semibold'), fontSize: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: font('semibold'), fontSize: 12, lineHeight: 16 },
  selectedSkills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  search: {
    minHeight: 42,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: font('regular'),
    fontSize: 13,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 4,
  },
  switchLabel: { fontFamily: font('medium'), fontSize: 13, flex: 1 },
  helper: { fontFamily: font('regular'), fontSize: 11, lineHeight: 16 },
  optionState: { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%' },
  retryButton: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  retryText: { fontFamily: font('semibold'), fontSize: 12 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    marginTop: 4,
  },
  clearButton: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    justifyContent: 'center',
  },
  clearText: { fontFamily: font('medium'), fontSize: 13 },
  applyButton: { flex: 1, height: 48 },
});
