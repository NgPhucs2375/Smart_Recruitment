import { useState, type ReactNode } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type KeyboardTypeOptions,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** Label trên input — mirror Field của Web (label + *bắt buộc). */
function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.label, { color: theme.textSecondary }]} type="small">
      {label}
      {required ? <ThemedText style={{ color: theme.destructive }}> *</ThemedText> : null}
    </ThemedText>
  );
}

function fieldContainer(theme: ReturnType<typeof useTheme>, invalid?: boolean) {
  return [
    styles.input,
    {
      backgroundColor: theme.backgroundElement,
      borderColor: invalid ? theme.destructive : theme.input,
      color: theme.text,
    },
  ];
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  required,
  invalid,
  keyboardType,
  autoCapitalize,
  multiline,
  editable = true,
  errorText,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  required?: boolean;
  invalid?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  multiline?: boolean;
  editable?: boolean;
  errorText?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.group}>
      <FieldLabel label={label} required={required} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textSecondary}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        multiline={multiline}
        editable={editable}
        style={[fieldContainer(theme, invalid), multiline && styles.multiline]}
      />
      {errorText ? (
        <ThemedText style={[styles.error, { color: theme.destructive }]} type="code">
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}

/** Input số tiền hiển thị có dấu chấm (15.000.000) — fmtMoneyInput của Web. */
export function MoneyField({
  label,
  value,
  onChange,
  required,
  invalid,
  errorText,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  required?: boolean;
  invalid?: boolean;
  errorText?: string;
}) {
  const theme = useTheme();
  const text = value > 0 ? formatMoney(value) : '';

  const handleChange = (raw: string) => {
    const digits = raw.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    onChange(digits ? Number(digits) : 0);
  };

  return (
    <View style={styles.group}>
      <FieldLabel label={label} required={required} />
      <TextInput
        value={text}
        onChangeText={handleChange}
        placeholder="0"
        placeholderTextColor={theme.textSecondary}
        keyboardType="number-pad"
        style={fieldContainer(theme, invalid)}
      />
      {errorText ? (
        <ThemedText style={[styles.error, { color: theme.destructive }]} type="code">
          {errorText}
        </ThemedText>
      ) : null}
    </View>
  );
}

function formatMoney(value: number): string {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Select kiểu modal — mirror Select của Web (danh mục, work mode, mức độ kỹ năng). */
export function FormSelect({
  label,
  value,
  placeholder,
  options,
  onSelect,
  required,
  invalid,
  errorText,
  disabled,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  required?: boolean;
  invalid?: boolean;
  errorText?: string;
  disabled?: boolean;
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.value === value);

  return (
    <View style={styles.group}>
      <FieldLabel label={label} required={required} />
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => setOpen(true)}
        style={({ pressed }) => [
          fieldContainer(theme, invalid),
          styles.select,
          { opacity: disabled ? 0.6 : pressed ? 0.9 : 1 },
        ]}
      >
        <ThemedText
          style={{ color: selected ? theme.text : theme.textSecondary }}
          numberOfLines={1}
          type="small"
        >
          {selected ? selected.label : placeholder}
        </ThemedText>
      </Pressable>
      {errorText ? (
        <ThemedText style={[styles.error, { color: theme.destructive }]} type="code">
          {errorText}
        </ThemedText>
      ) : null}

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setOpen(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <ThemedText style={[styles.modalTitle, { color: theme.text }]} type="smallBold">
              {label}
            </ThemedText>
            <ScrollView style={styles.modalList} bounces={false}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    onPress={() => {
                      onSelect(option.value);
                      setOpen(false);
                    }}
                    style={({ pressed }) => [
                      styles.modalItem,
                      {
                        backgroundColor: active ? theme.backgroundSelected : 'transparent',
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <ThemedText style={{ color: active ? theme.primary : theme.text }} type="small">
                      {option.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
            <Pressable onPress={() => setOpen(false)} style={styles.modalClose}>
              <ThemedText style={{ color: theme.textSecondary, fontFamily: font('medium') }} type="small">
                Đóng
              </ThemedText>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]} type="smallBold">
        {title}
      </ThemedText>
      {children}
    </View>
  );
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
  error: { fontSize: 11 },
  select: { justifyContent: 'center' },
  section: { gap: 12 },
  sectionTitle: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', paddingHorizontal: 24 },
  modalCard: { borderRadius: Radius.xl, borderWidth: 1, padding: 16, maxHeight: '75%' },
  modalTitle: { marginBottom: 8 },
  modalList: { flexGrow: 0 },
  modalItem: { paddingHorizontal: 10, paddingVertical: 12, borderRadius: Radius.md },
  modalClose: { alignItems: 'center', paddingVertical: 12, marginTop: 4 },
});
