import { router } from 'expo-router';
import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import {
  Bookmark,
  Building2,
  Clock,
  Home,
  Laptop,
  MapPin,
  SlidersHorizontal,
} from 'lucide-react-native';

import { Badge } from '@/components/ui/badge';
import { Card, Monogram } from '@/components/ui/card';
import { SalaryPill } from '@/components/ui/pill';
import { ThemedText } from '@/components/themed-text';
import { font, Palette, Radius } from '@/constants/theme';
import { useBookmarks } from '@/features/bookmarks/bookmark-provider';
import type { Job } from '@/features/jobs/types';
import { useTheme } from '@/hooks/use-theme';

// Level pills — 3 nhóm màu tĩnh như Web (bg-teal/10, bg-mist/20, bg-navy, bg-sand/25).
function levelColors(level: string): { bg: string; fg: string } {
  switch (level) {
    case 'Intern':
    case 'Fresher':
    case 'Junior':
      return { bg: `${Palette.sage}1A`, fg: Palette.navy }; // sage @10%
    case 'Mid':
      return { bg: `${Palette.mist}33`, fg: Palette.navy }; // mist @20%
    case 'Senior':
    case 'Lead':
      return { bg: Palette.navy, fg: Palette.white };
    case 'Manager':
      return { bg: `${Palette.sand}40`, fg: Palette.charcoal }; // sand @25%
    default:
      return { bg: `${Palette.mist}33`, fg: Palette.navy };
  }
}

const WORK_MODE_ICON: Record<string, typeof Home> = {
  Remote: Home,
  Hybrid: Laptop,
  Onsite: Building2,
  Flexible: SlidersHorizontal,
};

export const JobCard = memo(function JobCard({ job }: { job: Job }) {
  const theme = useTheme();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const saved = isBookmarked(job.id);

  const monogram = job.company.trim().slice(0, 1).toUpperCase() || '?';
  const lv = levelColors(job.level);
  const WorkModeIcon = WORK_MODE_ICON[job.workMode] ?? Building2;
  const shownSkills = job.skills.slice(0, 3);

  return (
    <Card style={styles.card} onPress={() => router.push(`/jobs/${job.id}`)}>
      <View style={styles.row}>
        <Monogram label={monogram} size={52} radius={Radius['2xl']} fontSize={16} />

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={styles.titleBlock}>
              <Pressable onPress={() => router.push(`/jobs/${job.id}`)}>
                <View style={styles.titleWrap}>
                  <TitleText text={job.title} />
                </View>
              </Pressable>
              <SubtleText text={job.company} />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Bỏ lưu' : 'Lưu việc làm'}
              accessibilityState={{ selected: saved }}
              hitSlop={8}
              onPress={() => toggleBookmark(job.id)}
              style={[
                styles.bookmark,
                saved
                  ? { backgroundColor: Palette.navy, borderColor: Palette.navy }
                  : { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <Bookmark
                size={16}
                color={saved ? Palette.white : Palette.mist}
                fill={saved ? Palette.white : 'transparent'}
              />
            </Pressable>
          </View>

          <View style={styles.metaRow}>
            <SalaryPill>{job.salary}</SalaryPill>
            <View style={styles.location}>
              <MapPin size={14} color={theme.primary} />
              <SubtleText text={job.location} size={14} />
            </View>
            <View
              style={[
                styles.workMode,
                { backgroundColor: theme.muted, borderColor: theme.border },
              ]}>
              <WorkModeIcon size={12} color={Palette.sage} />
              <WorkModeText text={job.workMode} />
            </View>
          </View>

          <View style={styles.badges}>
            <Badge backgroundColor={lv.bg} color={lv.fg} textStyle={styles.levelBadge}>
              {job.level}
            </Badge>
            <Badge variant="outline" textStyle={styles.outlineBadge}>
              {job.employmentType}
            </Badge>
            {shownSkills.map((skill) => (
              <Badge key={skill} variant="outline" textStyle={styles.outlineBadge}>
                {skill}
              </Badge>
            ))}
            {job.skills.length > 3 ? (
              <Badge variant="outline" textStyle={styles.outlineBadge}>
                {`+${job.skills.length - 3}`}
              </Badge>
            ) : null}
          </View>

          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <View style={styles.footerItem}>
              <Clock size={14} color={Palette.mist} />
              <SubtleText text={job.postedAt} size={12} />
            </View>
            {saved ? (
              <View style={styles.savedTag}>
                <Bookmark size={12} color={theme.primary} fill={Palette.marine} />
                <SavedText />
              </View>
            ) : null}
          </View>
        </View>
      </View>
    </Card>
  );
});

// Tách nhỏ text để ThemedText tự map fontFamily đúng weight.
function TitleText({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <ThemedText
      numberOfLines={1}
      style={[styles.title, { color: theme.text }]}
      themeColor="text">
      {text}
    </ThemedText>
  );
}

function SubtleText({ text, size = 13 }: { text: string; size?: number }) {
  const theme = useTheme();
  return (
    <ThemedText
      numberOfLines={1}
      themeColor="textSecondary"
      style={[styles.subtle, { color: theme.textSecondary, fontSize: size }]}>
      {text}
    </ThemedText>
  );
}

function WorkModeText({ text }: { text: string }) {
  const theme = useTheme();
  return (
    <ThemedText
      numberOfLines={1}
      themeColor="textSecondary"
      style={[styles.workModeText, { color: theme.textSecondary }]}>
      {text}
    </ThemedText>
  );
}

function SavedText() {
  const theme = useTheme();
  return (
    <ThemedText style={[styles.savedText, { color: theme.primary }]}>Đã lưu</ThemedText>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12, padding: 20 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 16 },
  body: { flex: 1, minWidth: 0, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  titleBlock: { flex: 1, minWidth: 0, gap: 2 },
  titleWrap: {},
  title: { fontFamily: font('semibold'), fontSize: 18, lineHeight: 24, letterSpacing: -0.2 },
  subtle: { fontFamily: font('medium') },
  bookmark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  location: { flexDirection: 'row', alignItems: 'center', gap: 5, flexShrink: 1 },
  workMode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  workModeText: { fontFamily: font('medium'), fontSize: 11 },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  levelBadge: { fontFamily: font('semibold'), fontSize: 11 },
  outlineBadge: { fontFamily: font('medium'), fontSize: 11 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  savedTag: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto' },
  savedText: { fontFamily: font('semibold'), fontSize: 11 },
});
