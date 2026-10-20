import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, useColorScheme, View } from 'react-native';
import {
  Calendar,
  DollarSign,
  FileText,
  Mail,
  MapPin,
  Phone,
  Wallet,
} from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Palette, Radius, Shadows } from '@/constants/theme';
import { getToneColors } from '@/features/applications/constants';
import type { ApplicationSummary } from '@/features/applications/types';
import type { CvSummary } from '@/features/cv/types';
import type { CandidateProfile } from '@/features/profile/types';
import { useTheme } from '@/hooks/use-theme';

/**
 * Card thông tin cá nhân — clone 1:1 từ ho-so-view.tsx (Section 1):
 * avatar rounded-2xl bg primary/10, tên, vị trí, badge trạng thái,
 * các hàng info icon navy, khối Giới thiệu. KHÔNG có stats 3 cột (Web không có).
 */
export function ProfileInfoCard({ profile }: { profile: CandidateProfile }) {
  const theme = useTheme();

  const initials = profile.fullName
    ? profile.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(-2)
        .join('')
        .toUpperCase()
    : 'UV';

  const rows: { icon: typeof Mail; value: string }[] = [
    { icon: Mail, value: profile.email || 'Chưa có email' },
    { icon: Phone, value: profile.phone || 'Chưa có SĐT' },
    {
      icon: Calendar,
      value: profile.birthDate ? profile.birthDate : 'Chưa cập nhật ngày sinh',
    },
    { icon: MapPin, value: profile.location || 'Chưa có địa chỉ' },
    {
      icon: DollarSign,
      value: profile.expectedSalary > 0
        ? `Mong muốn: ${profile.expectedSalary.toLocaleString('vi-VN')} VNĐ/tháng`
        : 'Mong muốn: Thương lượng',
    },
  ];

  const seeking = profile.openToWork;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        Shadows.filter,
      ]}>
      <View style={styles.identity}>
        <View style={[styles.avatar, { backgroundColor: `${theme.primary}1A` }]}>
          {profile.avatarUrl ? (
            <Image
              source={{ uri: profile.avatarUrl }}
              contentFit="cover"
              transition={180}
              style={styles.avatarImage}
            />
          ) : (
            <ThemedText style={[styles.avatarInitials, { color: theme.primary }]}>
              {initials}
            </ThemedText>
          )}
        </View>
        <View style={styles.identityCopy}>
          <ThemedText numberOfLines={1} style={[styles.name, { color: theme.text }]}>
            {profile.fullName || 'Người dùng'}
          </ThemedText>
          <ThemedText numberOfLines={1} style={[styles.position, { color: theme.textSecondary }]}>
            {profile.title || 'Chưa cập nhật vị trí'}
          </ThemedText>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: seeking ? `${Palette.sage}1A` : theme.muted },
            ]}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: seeking ? Palette.sage : theme.textSecondary },
              ]}
            />
            <ThemedText
              style={[
                styles.statusText,
                { color: seeking ? Palette.sage : theme.textSecondary },
              ]}>
              {seeking ? 'Đang bật tìm việc' : 'Tạm dừng tìm việc'}
            </ThemedText>
          </View>
        </View>
      </View>

      <View style={[styles.infoBlock, { borderTopColor: `${theme.border}80` }]}>
        {rows.map((row, index) => {
          const Icon = row.icon;
          return (
            <View key={index} style={styles.infoRow}>
              <Icon size={16} color={theme.primary} />
              <ThemedText
                numberOfLines={1}
                style={[styles.infoText, { color: theme.textSecondary }]}>
                {row.value}
              </ThemedText>
            </View>
          );
        })}
      </View>

      {profile.bio ? (
        <View style={[styles.bioBlock, { borderTopColor: `${theme.border}80` }]}>
          <ThemedText style={[styles.bioHeading, { color: theme.textSecondary }]}>
            GIỚI THIỆU
          </ThemedText>
          <ThemedText style={[styles.bioText, { color: theme.text }]}>
            {profile.bio}
          </ThemedText>
        </View>
      ) : null}
    </View>
  );
}

/**
 * Section heading — Web: text-xs font-semibold uppercase tracking-[0.14em]
 * text-muted-foreground, có badge count.
 */
export function SectionHeading({
  title,
  caption,
  badge,
}: {
  title: string;
  caption?: string;
  badge?: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionHeadingCopy}>
        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          {title.toUpperCase()}
        </ThemedText>
        {caption ? (
          <ThemedText style={[styles.sectionCaption, { color: theme.textSecondary }]}>
            {caption}
          </ThemedText>
        ) : null}
      </View>
      {badge ? (
        <View style={[styles.countBadge, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText style={[styles.countBadgeText, { color: theme.primary }]}>{badge}</ThemedText>
        </View>
      ) : null}
    </View>
  );
}

/** ListSurface — Web: divide-y rounded-2xl border bg-card shadow-sm. */
export function ListSurface({ children }: { children: ReactNode }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.listSurface,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
        Shadows.filter,
      ]}>
      {children}
    </View>
  );
}

/**
 * ApplicationRow — clone item của applied-jobs.tsx:
 * badge variant Web, tiêu đề 15/600, meta company • location • ngày, salary pill, "Xem tin".
 */
export function ApplicationRow({
  application,
  first = false,
  onPress,
}: {
  application: ApplicationSummary;
  first?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const tone = getToneColors(application.statusTone, scheme);

  const meta = [application.company, application.location, application.appliedAt]
    .filter(Boolean)
    .join(' • ');

  return (
    <View
      style={[
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
      ]}>
      <View style={styles.appTop}>
        <Badge
          variant={application.statusTone}
          backgroundColor={tone.background}
          color={tone.text}
          textStyle={[
            styles.appBadge,
            application.statusTone === 'outline' && { borderColor: tone.border },
          ]}>
          {application.statusLabel}
        </Badge>
      </View>
      <Pressable
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress}
        onPress={onPress}>
        <ThemedText numberOfLines={1} style={[styles.appTitle, { color: theme.text }]}>
          {application.jobTitle}
        </ThemedText>
      </Pressable>
      <ThemedText numberOfLines={1} style={[styles.appMeta, { color: theme.textSecondary }]}>
        {meta}
      </ThemedText>
      {application.salary ? (
        <View style={[styles.salaryPill, { backgroundColor: `${Palette.sage}26` }]}>
          <Wallet size={12} color={theme.primary} />
          <ThemedText style={[styles.salaryText, { color: theme.primary }]}>
            {application.salary}
          </ThemedText>
        </View>
      ) : null}
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Xem tin ${application.jobTitle}`}
          onPress={onPress}
          style={({ pressed }) => [
            styles.viewPill,
            { borderColor: theme.border, opacity: pressed ? 0.7 : 1 },
          ]}>
          <ThemedText style={[styles.viewPillText, { color: theme.text }]}>Xem tin</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** CvRow — clone CV row của ho-so-view.tsx (read-only, không CRUD). */
export function CvRow({ cv, first = false }: { cv: CvSummary; first?: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.row,
        !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.border },
      ]}>
      <View style={styles.cvRow}>
        <View style={[styles.cvIconBox, { backgroundColor: `${theme.primary}1A` }]}>
          <FileText size={20} color={theme.primary} />
        </View>
        <View style={styles.cvCopy}>
          <View style={styles.cvTitleRow}>
            <ThemedText numberOfLines={1} style={[styles.cvName, { color: theme.text }]}>
              {cv.name}
            </ThemedText>
            {cv.isDefault ? (
              <Badge variant="secondary" textStyle={styles.cvDefaultBadge}>
                Mặc định
              </Badge>
            ) : null}
          </View>
          <ThemedText numberOfLines={1} style={[styles.cvMeta, { color: theme.textSecondary }]}>
            {`Mẫu ${cv.role || 'chuẩn'} • Cập nhật ${cv.uploadedAt}`}
          </ThemedText>
        </View>
      </View>
    </View>
  );
}

export function ProfileEmptyState({
  title,
  message,
  actionLabel,
  onAction,
}: {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={styles.emptyState}>
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>{title}</ThemedText>
      <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>{message}</ThemedText>
      {actionLabel && onAction ? (
        <Pressable
          accessibilityRole="button"
          onPress={onAction}
          style={[styles.emptyButton, { backgroundColor: theme.backgroundSelected }]}>
          <ThemedText style={[styles.emptyButtonText, { color: theme.primary }]}>
            {actionLabel}
          </ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

export function ProfileSkeletonRows({ count = 2 }: { count?: number }) {
  const theme = useTheme();
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.row,
            index > 0 && {
              borderTopWidth: StyleSheet.hairlineWidth,
              borderTopColor: theme.border,
            },
          ]}>
          <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '72%' }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '44%' }]} />
          <View style={[styles.skeletonLine, { backgroundColor: theme.muted, width: '58%' }]} />
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  identity: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarInitials: { fontFamily: font('bold'), fontSize: 24 },
  avatarImage: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  identityCopy: { flex: 1, minWidth: 0, gap: 3 },
  name: { fontFamily: font('semibold'), fontSize: 20, lineHeight: 26 },
  position: { fontSize: 14, lineHeight: 20 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginTop: 4,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontFamily: font('medium'), fontSize: 12 },
  infoBlock: {
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoText: { fontFamily: font('regular'), fontSize: 14, flex: 1 },
  bioBlock: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 16, gap: 8 },
  bioHeading: {
    fontFamily: font('semibold'),
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  bioText: { fontFamily: font('regular'), fontSize: 14, lineHeight: 22 },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 26,
    marginBottom: 12,
  },
  sectionHeadingCopy: { flex: 1, gap: 4 },
  sectionTitle: { fontFamily: font('semibold'), fontSize: 11, letterSpacing: 1.6 },
  sectionCaption: { fontSize: 12, lineHeight: 17 },
  countBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.pill },
  countBadgeText: { fontFamily: font('bold'), fontSize: 11 },
  listSurface: { borderRadius: Radius['2xl'], borderWidth: 1, overflow: 'hidden' },
  row: { paddingHorizontal: 16, paddingVertical: 16, gap: 6 },
  appTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  appBadge: { fontFamily: font('medium'), fontSize: 11 },
  appTitle: { fontFamily: font('semibold'), fontSize: 15, lineHeight: 21 },
  appMeta: { fontSize: 13, lineHeight: 19 },
  salaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    marginTop: 2,
  },
  salaryText: { fontFamily: font('bold'), fontSize: 12 },
  viewPill: {
    alignSelf: 'flex-start',
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  viewPillText: { fontFamily: font('semibold'), fontSize: 12 },
  cvRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cvIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cvCopy: { flex: 1, minWidth: 0, gap: 3 },
  cvTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cvName: { fontFamily: font('medium'), fontSize: 14, flexShrink: 1 },
  cvDefaultBadge: { fontFamily: font('medium'), fontSize: 11 },
  cvMeta: { fontSize: 12, lineHeight: 17 },
  emptyState: { alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  emptyTitle: { fontFamily: font('semibold'), fontSize: 15, textAlign: 'center' },
  emptyMessage: { fontSize: 13, lineHeight: 19, textAlign: 'center', maxWidth: 300 },
  emptyButton: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.lg, marginTop: 4 },
  emptyButtonText: { fontFamily: font('bold'), fontSize: 13 },
  skeletonLine: { height: 12, borderRadius: Radius.pill },
});
