import { useState, type ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import {
  compareCvPartialDates,
  isValidCvPartialDate,
  isValidVnDate,
  maskDateVn,
  maskMonthYear,
  maskYearOnly,
  parseCvPartialDate,
} from '../manual/cv-data';
import { MSG_DOB_FUTURE, isFutureVnDate } from '../manual/validation';
import { CharacterCounter } from './character-counter';

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.label, { color: theme.textSecondary }]} type="small">
      {label}
      {required ? <ThemedText style={{ color: theme.destructive }}> *</ThemedText> : null}
    </ThemedText>
  );
}

export function FieldError({ message }: { message: string | null }) {
  const theme = useTheme();
  if (!message) return null;
  return (
    <ThemedText style={[styles.error, { color: theme.destructive }]} type="code">
      {message}
    </ThemedText>
  );
}

type CvInputProps = {
  label?: string;
  required?: boolean;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  error?: string | null;
  maxLength?: number;
  showCounter?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  numberOfLines?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  inputStyle?: StyleProp<TextStyle>;
};

export function CvInput({
  label,
  required,
  value,
  onChangeText,
  placeholder,
  error,
  maxLength,
  showCounter = false,
  keyboardType,
  autoCapitalize,
  multiline = false,
  numberOfLines,
  disabled = false,
  style,
  inputStyle,
}: CvInputProps) {
  const theme = useTheme();
  const invalid = !!error;

  const field = (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={theme.textSecondary}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      multiline={multiline}
      numberOfLines={numberOfLines}
      editable={!disabled}
      maxLength={showCounter && maxLength ? undefined : maxLength}
      style={[
        styles.input,
        {
          backgroundColor: theme.backgroundElement,
          borderColor: invalid ? theme.destructive : theme.input,
          color: disabled ? theme.textSecondary : theme.text,
        },
        multiline && styles.multiline,
        inputStyle,
      ]}
    />
  );

  return (
    <View style={[styles.group, style]}>
      {label ? <FieldLabel label={label} required={required} /> : null}
      {showCounter && maxLength ? (
        <View style={styles.counterWrap}>
          {field}
          <CharacterCounter currentLength={value.length} maxLength={maxLength} />
        </View>
      ) : (
        field
      )}
      <FieldError message={error ?? null} />
    </View>
  );
}

export function DateField({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const badFormat = !isValidVnDate(value);
  const future = !badFormat && value.trim() !== '' && isFutureVnDate(value);
  const error = badFormat
    ? 'Ngày không hợp lệ (dd/mm/yyyy)'
    : future
      ? MSG_DOB_FUTURE
      : null;

  return (
    <CvInput
      label={label}
      value={value}
      onChangeText={(next) => onChange(maskDateVn(next))}
      placeholder="dd/mm/yyyy"
      keyboardType="number-pad"
      disabled={disabled}
      error={error}
    />
  );
}

export function PartialDateField({
  label,
  value,
  precision,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  precision: 'month_year' | 'year_only';
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  const invalid = !isValidCvPartialDate(value, precision);
  const hint = precision === 'year_only' ? 'YYYY' : 'MM/YYYY';

  return (
    <CvInput
      label={label}
      value={value}
      onChangeText={(next) =>
        onChange(precision === 'year_only' ? maskYearOnly(next) : maskMonthYear(next))
      }
      placeholder={hint}
      keyboardType="number-pad"
      disabled={disabled}
      error={invalid ? `Ngày không hợp lệ (${hint})` : null}
    />
  );
}

export function PrecisionToggle({
  mode,
  onSwitch,
}: {
  mode: 'month_year' | 'year_only';
  onSwitch: (next: 'month_year' | 'year_only') => void;
}) {
  const theme = useTheme();
  const renderButton = (next: 'month_year' | 'year_only', text: string) => (
    <Button
      key={next}
      variant={mode === next ? 'default' : 'ghost'}
      size="sm"
      pill
      onPress={() => onSwitch(next)}
      accessibilityLabel={`Định dạng ${text}`}
    >
      {text}
    </Button>
  );

  return (
    <View style={styles.precisionGroup}>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]} type="small">
        Định dạng thời gian
      </ThemedText>
      <View style={styles.precisionRow}>
        {renderButton('month_year', 'Tháng/Năm')}
        {renderButton('year_only', 'Năm')}
      </View>
    </View>
  );
}

export function rangeErrorText(
  tu: string,
  den: string,
  endDisabled?: boolean,
): string | null {
  if (endDisabled) return null;
  if (!tu.trim() || !den.trim()) return null;
  if (!parseCvPartialDate(tu) || !parseCvPartialDate(den)) return null;
  return compareCvPartialDates(tu, den) > 0
    ? 'Thời gian bắt đầu phải không sau thời gian kết thúc.'
    : null;
}

export function WritingTips({ items }: { items: string[] }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.tips,
        { borderColor: theme.border, backgroundColor: `${theme.backgroundSelected}80` },
      ]}
    >
      {items.map((tip) => (
        <View key={tip} style={styles.tipRow}>
          <ThemedText style={{ color: theme.primary }} type="code">
            ✓
          </ThemedText>
          <ThemedText style={{ color: theme.textSecondary }} type="code">
            {tip}
          </ThemedText>
        </View>
      ))}
    </View>
  );
}

export function ChipInput({
  values,
  onChange,
  placeholder,
  maxLength,
}: {
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxLength?: number;
}) {
  const theme = useTheme();
  const [draft, setDraft] = useState('');

  const commit = () => {
    const next = draft.trim();
    if (next && !values.includes(next)) onChange([...values, next]);
    setDraft('');
  };

  return (
    <View style={styles.group}>
      <View style={styles.chipInputRow}>
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder={placeholder}
          placeholderTextColor={theme.textSecondary}
          maxLength={maxLength}
          onSubmitEditing={commit}
          blurOnSubmit={false}
          returnKeyType="done"
          style={[
            styles.input,
            {
              flex: 1,
              backgroundColor: theme.backgroundElement,
              borderColor: theme.input,
              color: theme.text,
            },
          ]}
        />
        <Button
          variant="outline"
          size="icon"
          pill
          disabled={!draft.trim()}
          onPress={commit}
          accessibilityLabel="Thêm thẻ"
        >
          +
        </Button>
      </View>
      {values.length > 0 ? (
        <View style={styles.chipWrap}>
          {values.map((value) => (
            <View
              key={value}
              style={[
                styles.chip,
                { backgroundColor: theme.backgroundSelected, borderColor: theme.border },
              ]}
            >
              <ThemedText style={{ color: theme.primaryHover }} type="code">
                {value}
              </ThemedText>
              <Pressable
                accessibilityLabel={`Xóa ${value}`}
                hitSlop={8}
                onPress={() => onChange(values.filter((item) => item !== value))}
              >
                <ThemedText style={{ color: theme.textSecondary }} type="code">
                  ✕
                </ThemedText>
              </Pressable>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

export function CheckRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => onToggle(!checked)}
      style={styles.checkRow}
    >
      <View
        style={[
          styles.checkbox,
          {
            borderColor: checked ? theme.primary : theme.input,
            backgroundColor: checked ? theme.primary : theme.backgroundElement,
          },
        ]}
      >
        {checked ? (
          <ThemedText style={{ color: theme.primaryForeground, fontSize: 11 }} type="code">
            ✓
          </ThemedText>
        ) : null}
      </View>
      <ThemedText type="small" style={{ color: theme.text }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function Row({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  group: { gap: 6 },
  label: { fontSize: 13 },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: font('regular'),
    minHeight: 42,
  },
  multiline: { minHeight: 96, textAlignVertical: 'top' },
  counterWrap: { position: 'relative' },
  error: { fontSize: 11 },
  precisionGroup: { gap: 8, marginBottom: 4 },
  precisionRow: { flexDirection: 'row', gap: 6 },
  tips: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
    marginBottom: 10,
  },
  tipRow: { flexDirection: 'row', gap: 6 },
  chipInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4 },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
});
