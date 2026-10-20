import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { SALARY_RANGES } from '@/features/jobs/constants';
import {
  hasActiveFilters,
  type JobFilterKey,
  type JobFilterOptions,
  type JobFilters,
} from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  filters: JobFilters;
  options: JobFilterOptions;
  onRemove: (key: JobFilterKey, value?: number) => void;
  onClear: () => void;
};

function salaryLabel(filters: JobFilters): string {
  const preset = SALARY_RANGES.find(
    (range) => range.min === filters.salaryMin && range.max === filters.salaryMax,
  );
  if (preset) return preset.label;

  const min =
    filters.salaryMin !== undefined ? `${Math.round(filters.salaryMin / 1_000_000)}tr` : '0';
  const max =
    filters.salaryMax !== undefined ? `${Math.round(filters.salaryMax / 1_000_000)}tr` : '200tr+';
  return `${min} – ${max}`;
}

function FilterChip({ label, onPress }: { label: string; onPress: () => void }) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Bỏ lọc ${label}`}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: theme.backgroundSelected }]}>
      <ThemedText numberOfLines={1} style={[styles.chipText, { color: theme.primary }]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.chipRemove, { color: theme.primary }]}>×</ThemedText>
    </Pressable>
  );
}

export function ActiveFilterChips({ filters, options, onRemove, onClear }: Props) {
  const theme = useTheme();

  if (!hasActiveFilters(filters)) return null;

  const categoryName =
    filters.categoryId !== undefined
      ? (options.categories.find((category) => category.id === filters.categoryId)?.name ??
        `Ngành #${filters.categoryId}`)
      : '';

  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}>
        {filters.location ? (
          <FilterChip label={filters.location} onPress={() => onRemove('location')} />
        ) : null}
        {filters.level ? (
          <FilterChip label={filters.level} onPress={() => onRemove('level')} />
        ) : null}
        {filters.employmentType ? (
          <FilterChip
            label={filters.employmentType}
            onPress={() => onRemove('employmentType')}
          />
        ) : null}
        {filters.workMode ? (
          <FilterChip label={filters.workMode} onPress={() => onRemove('workMode')} />
        ) : null}
        {filters.salaryMin !== undefined || filters.salaryMax !== undefined ? (
          <FilterChip label={salaryLabel(filters)} onPress={() => onRemove('salary')} />
        ) : null}
        {categoryName ? (
          <FilterChip label={categoryName} onPress={() => onRemove('categoryId')} />
        ) : null}
        {filters.skillIds.map((skillId) => {
          const name =
            options.skills.find((skill) => skill.id === skillId)?.name ?? `Kỹ năng #${skillId}`;
          return (
            <FilterChip key={skillId} label={name} onPress={() => onRemove('skill', skillId)} />
          );
        })}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Xóa tất cả bộ lọc"
          onPress={onClear}
          style={[styles.clearChip, { borderColor: theme.border }]}>
          <ThemedText style={[styles.clearText, { color: theme.textSecondary }]}>
            Xóa lọc
          </ThemedText>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: 12 },
  list: { gap: 8, paddingRight: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    maxWidth: 220,
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 99,
  },
  chipText: { fontSize: 12, fontWeight: '600', lineHeight: 16, flexShrink: 1 },
  chipRemove: { fontSize: 15, lineHeight: 18, fontWeight: '700' },
  clearChip: {
    minHeight: 32,
    paddingHorizontal: 11,
    borderRadius: 99,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearText: { fontSize: 12, fontWeight: '600' },
});
