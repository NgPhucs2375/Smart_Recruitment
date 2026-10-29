import { ActivityIndicator, Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import {
  Building2,
  CalendarDays,
  ExternalLink,
  FileText,
  MapPin,
  MessageSquareText,
  Undo2,
  Wallet,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { font, Palette, Radius, Shadows } from '@/constants/theme';
import {
  canWithdrawApplication,
  getToneColors,
} from '@/features/applications/constants';
import type { ApplicationSummary } from '@/features/applications/types';
import { useTheme } from '@/hooks/use-theme';

type Props = {
  application: ApplicationSummary;
  withdrawing?: boolean;
  onView: () => void;
  onWithdraw: () => void;
};

export function ApplicationCard({ application, withdrawing = false, onView, onWithdraw }: Props) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const tone = getToneColors(application.statusTone, scheme);
  const canWithdraw = canWithdrawApplication(application.statusCode);
  const responseText = application.feedback || application.conclusion;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        Shadows.filter,
      ]}>
      <View style={styles.topRow}>
        <Badge
          variant={application.statusTone}
          backgroundColor={tone.background}
          color={tone.text}
          textStyle={[
            styles.badgeText,
            application.statusTone === 'outline' && { borderColor: tone.border },
          ]}>
          {application.statusLabel}
        </Badge>
        <View style={styles.dateRow}>
          <CalendarDays size={13} color={theme.textSecondary} />
          <ThemedText style={[styles.dateText, { color: theme.textSecondary }]}>
            {application.appliedAt}
          </ThemedText>
        </View>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Xem tin ${application.jobTitle}`}
        onPress={onView}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}>
        <ThemedText numberOfLines={2} style={[styles.title, { color: theme.text }]}>
          {application.jobTitle}
        </ThemedText>
      </Pressable>

      <View style={styles.metaGroup}>
        <View style={styles.metaRow}>
          <Building2 size={14} color={theme.textSecondary} />
          <ThemedText numberOfLines={1} style={[styles.metaText, { color: theme.textSecondary }]}>
            {application.company}
          </ThemedText>
        </View>
        <View style={styles.metaRow}>
          <MapPin size={14} color={theme.textSecondary} />
          <ThemedText numberOfLines={1} style={[styles.metaText, { color: theme.textSecondary }]}>
            {application.location}
          </ThemedText>
        </View>
        {application.salary ? (
          <View style={[styles.salaryPill, { backgroundColor: `${Palette.sage}26` }]}>
            <Wallet size={12} color={theme.primary} />
            <ThemedText style={[styles.salaryText, { color: theme.primary }]}>
              {application.salary}
            </ThemedText>
          </View>
        ) : null}
      </View>

      <View style={[styles.cvBox, { backgroundColor: theme.muted }]}>
        <FileText size={15} color={theme.primary} />
        <View style={styles.cvCopy}>
          <ThemedText style={[styles.cvLabel, { color: theme.textSecondary }]}>CV ĐÃ NỘP</ThemedText>
          <ThemedText numberOfLines={1} style={[styles.cvName, { color: theme.text }]}>
            {application.cvName}
          </ThemedText>
        </View>
      </View>

      {responseText ? (
        <View style={[styles.feedbackBox, { borderColor: theme.border }]}>
          <View style={styles.feedbackHeading}>
            <MessageSquareText size={14} color={theme.primary} />
            <ThemedText style={[styles.feedbackLabel, { color: theme.primary }]}>
              PHẢN HỒI TỪ NHÀ TUYỂN DỤNG
            </ThemedText>
          </View>
          <ThemedText style={[styles.feedbackText, { color: theme.text }]}>
            {responseText}
          </ThemedText>
        </View>
      ) : null}

      <View style={[styles.actions, { borderTopColor: theme.border }]}>
        <Button
          variant="outline"
          size="sm"
          pill
          onPress={onView}
          icon={<ExternalLink size={14} color={theme.text} />}>
          Xem tin
        </Button>
        {canWithdraw ? (
          <Button
            variant="destructive"
            size="sm"
            pill
            disabled={withdrawing}
            onPress={onWithdraw}
            icon={
              withdrawing ? (
                <ActivityIndicator size="small" color={theme.destructive} />
              ) : (
                <Undo2 size={14} color={theme.destructive} />
              )
            }>
            {withdrawing ? 'Đang rút...' : 'Rút đơn'}
          </Button>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  badgeText: {
    fontFamily: font('medium'),
    fontSize: 11,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
  },
  dateText: {
    fontFamily: font('regular'),
    fontSize: 12,
  },
  title: {
    fontFamily: font('semibold'),
    fontSize: 17,
    lineHeight: 23,
  },
  metaGroup: {
    gap: 7,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  metaText: {
    flex: 1,
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 18,
  },
  salaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginTop: 1,
  },
  salaryText: {
    fontFamily: font('bold'),
    fontSize: 12,
  },
  cvBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 11,
    paddingVertical: 9,
    borderRadius: Radius.xl,
  },
  cvCopy: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  cvLabel: {
    fontFamily: font('semibold'),
    fontSize: 9,
    letterSpacing: 0.8,
  },
  cvName: {
    fontFamily: font('medium'),
    fontSize: 13,
  },
  feedbackBox: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 11,
    gap: 5,
  },
  feedbackHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  feedbackLabel: {
    fontFamily: font('semibold'),
    fontSize: 9,
    letterSpacing: 0.8,
  },
  feedbackText: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 8,
  },
});
