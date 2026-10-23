import type { ReactNode } from 'react';
import {
  Pressable,
  StyleSheet,
  Switch,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { font, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ProfileFieldProps = TextInputProps & {
  label: string;
  icon?: ReactNode;
  error?: string | null;
  suffix?: string;
  required?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export function ProfileField({
  label,
  icon,
  error,
  suffix,
  required = false,
  containerStyle,
  style,
  multiline,
  ...inputProps
}: ProfileFieldProps) {
  const theme = useTheme();

  return (
    <View style={containerStyle}>
      <View style={styles.labelRow}>
        <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
        {required ? (
          <ThemedText style={[styles.required, { color: theme.destructive }]}>*</ThemedText>
        ) : null}
      </View>
      <View
        style={[
          styles.inputWrap,
          multiline && styles.inputWrapMultiline,
          {
            backgroundColor: theme.backgroundElement,
            borderColor: error ? theme.destructive : theme.input,
          },
        ]}>
        {icon ? <View style={[styles.icon, multiline && styles.iconMultiline]}>{icon}</View> : null}
        <TextInput
          autoCorrect={false}
          multiline={multiline}
          placeholderTextColor={theme.textSecondary}
          selectionColor={theme.primary}
          style={[
            styles.input,
            multiline && styles.inputMultiline,
            suffix ? styles.inputWithSuffix : null,
            { color: theme.text },
            style,
          ]}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...inputProps}
        />
        {suffix ? (
          <ThemedText style={[styles.suffix, { color: theme.textSecondary }]}>{suffix}</ThemedText>
        ) : null}
      </View>
      {error ? (
        <ThemedText style={[styles.error, { color: theme.destructive }]}>{error}</ThemedText>
      ) : null}
    </View>
  );
}

type ProfileChoiceChipsProps = {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
};

export function ProfileChoiceChips({
  label,
  value,
  options,
  onChange,
}: ProfileChoiceChipsProps) {
  const theme = useTheme();

  return (
    <View>
      <ThemedText style={[styles.label, { color: theme.textSecondary }]}>{label}</ThemedText>
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? theme.primary : theme.backgroundElement,
                  borderColor: selected ? theme.primary : theme.input,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <ThemedText
                style={[
                  styles.chipText,
                  { color: selected ? theme.primaryForeground : theme.textSecondary },
                ]}>
                {option.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

type ProfileSwitchRowProps = {
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ProfileSwitchRow({
  title,
  description,
  value,
  onValueChange,
}: ProfileSwitchRowProps) {
  const theme = useTheme();

  return (
    <View
      style={[
        styles.switchRow,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={styles.switchCopy}>
        <ThemedText style={[styles.switchTitle, { color: theme.text }]}>{title}</ThemedText>
        <ThemedText style={[styles.switchDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      </View>
      <Switch
        accessibilityLabel={title}
        onValueChange={onValueChange}
        thumbColor={value ? theme.primaryForeground : theme.backgroundElement}
        trackColor={{ false: theme.muted, true: theme.primary }}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  label: {
    fontFamily: font('medium'),
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  required: { fontFamily: font('semibold'), fontSize: 12 },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 46,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputWrapMultiline: { alignItems: 'flex-start', minHeight: 112, paddingVertical: 10 },
  icon: { marginRight: 10 },
  iconMultiline: { marginTop: 2 },
  input: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 10 },
  inputMultiline: { minHeight: 90, paddingTop: 0 },
  inputWithSuffix: { paddingRight: 8 },
  suffix: { fontFamily: font('medium'), fontSize: 13 },
  error: { fontFamily: font('regular'), fontSize: 12, lineHeight: 17, marginTop: 5 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    minHeight: 38,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: { fontFamily: font('medium'), fontSize: 13 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 16,
  },
  switchCopy: { flex: 1, gap: 3 },
  switchTitle: { fontFamily: font('semibold'), fontSize: 14 },
  switchDescription: { fontFamily: font('regular'), fontSize: 12, lineHeight: 18 },
});
