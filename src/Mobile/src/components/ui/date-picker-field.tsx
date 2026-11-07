import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { CalendarDays } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { isoToVnDate, vnToIsoDate } from '@/features/location/date-format';

export function DatePickerField({
  label,
  value,
  onChange,
  valueFormat = 'iso',
  disabled,
  error,
  style,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  valueFormat?: 'iso' | 'vn';
  disabled?: boolean;
  error?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const iso = valueFormat === 'iso' ? value.slice(0, 10) : vnToIsoDate(value);
  const date = iso ? new Date(`${iso}T12:00:00`) : new Date();

  const handleChange = (event: DateTimePickerEvent, next?: Date) => {
    if (Platform.OS !== 'ios') setVisible(false);
    if (event.type !== 'set' || !next) return;
    const selectedIso = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-${String(next.getDate()).padStart(2, '0')}`;
    onChange(valueFormat === 'iso' ? selectedIso : isoToVnDate(selectedIso));
  };

  return (
    <View style={[styles.group, style]}>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]} type="small">{label}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${valueFormat === 'iso' ? isoToVnDate(value) : value || 'chưa chọn'}`}
        disabled={disabled}
        onPress={() => setVisible(true)}
        style={({ pressed }) => [styles.value, {
          borderColor: error ? theme.destructive : theme.input,
          backgroundColor: theme.backgroundElement,
          opacity: disabled ? 0.55 : pressed ? 0.8 : 1,
        }]}
      >
        <ThemedText style={{ color: iso ? theme.text : theme.textSecondary }}>
          {iso ? isoToVnDate(iso) : 'dd/MM/yyyy'}
        </ThemedText>
        <CalendarDays size={17} color={theme.primary} />
      </Pressable>
      {error ? <ThemedText style={{ color: theme.destructive }} type="code">{error}</ThemedText> : null}
      {visible ? (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'compact' : 'default'}
          onChange={handleChange}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600' },
  value: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
});
