import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { ChevronDown, MessageCircle, Sparkles, UserRound } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Palette, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type PotentialCandidate = {
  id: string;
  name: string;
  role: string;
  score: number;
  note: string;
};

// Mock "Ứng viên tiềm năng — Đánh giá AI cao" (minh họa, không gọi API).
const MOCK_CANDIDATES: PotentialCandidate[] = [
  {
    id: 'ai-94',
    name: 'Nguyễn Minh Khôi',
    role: 'Backend Developer',
    score: 94,
    note: 'Khớp 8/9 kỹ năng yêu cầu, 4 năm kinh nghiệm Spring Boot',
  },
  {
    id: 'ai-91',
    name: 'Trần Thảo Vy',
    role: 'Data Analyst',
    score: 91,
    note: 'Đúng ngành học, thành thạo SQL/Python, 3 năm kinh nghiệm',
  },
  {
    id: 'ai-88',
    name: 'Lê Hoàng Nam',
    role: 'Frontend Developer',
    score: 88,
    note: 'Portfolio React nổi bật, địa điểm thuận tiện',
  },
];

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(-2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function scoreColor(score: number): string {
  if (score >= 90) return Palette.navy;
  if (score >= 85) return Palette.sage;
  return Palette.bronze;
}

/**
 * Khối "🌟 Ứng viên tiềm năng (Đánh giá AI cao)" — hiển thị ở Tổng quan HR
 * và danh sách ứng viên. Dữ liệu mock cố định.
 */
export function PotentialCandidatesCard({
  collapsible = false,
  defaultExpanded = true,
}: {
  collapsible?: boolean;
  defaultExpanded?: boolean;
}) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const viewProfile = (candidate: PotentialCandidate) => {
    Alert.alert(
      candidate.name,
      `Điểm đánh giá AI ${candidate.score}/100 — hồ sơ chi tiết nằm trong danh sách ứng viên của tin tuyển dụng.`,
    );
  };

  const messageCandidate = () => {
    Alert.alert('Bản demo', 'Nhắn tin ứng viên sẽ được kết nối khi dữ liệu thật được bật.');
  };

  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <Pressable
        accessibilityRole={collapsible ? 'button' : undefined}
        accessibilityLabel={collapsible ? 'Mở hoặc thu gọn ứng viên tiềm năng' : undefined}
        accessibilityState={collapsible ? { expanded } : undefined}
        disabled={!collapsible}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => [styles.headingRow, collapsible && { opacity: pressed ? 0.75 : 1 }]}
      >
        <View style={[styles.headingIcon, { backgroundColor: `${theme.primary}14` }]}>
          <Sparkles size={15} color={theme.primary} />
        </View>
        <View style={styles.headingTexts}>
          <ThemedText style={[styles.headingTitle, { color: theme.text }]}>
            Ứng viên tiềm năng (Đánh giá AI cao)
          </ThemedText>
          <ThemedText style={{ color: theme.textSecondary }} type="code">
            Gợi ý từ hệ thống đánh giá hồ sơ tự động
          </ThemedText>
        </View>
        <Badge variant="outline" color={theme.primary}>
          DEMO
        </Badge>
        {collapsible ? (
          <ChevronDown
            size={18}
            color={theme.textSecondary}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        ) : null}
      </Pressable>

      {expanded ? <View style={styles.list}>
        {MOCK_CANDIDATES.map((candidate) => (
          <View
            key={candidate.id}
            style={[styles.row, { borderColor: theme.border, backgroundColor: theme.background }]}>
            <View style={[styles.avatar, { backgroundColor: `${theme.primary}18` }]}>
              <ThemedText style={{ color: theme.primary, fontFamily: font('semibold'), fontSize: 13 }}>
                {initialsOf(candidate.name)}
              </ThemedText>
            </View>

            <View style={styles.body}>
              <View style={styles.rowHead}>
                <ThemedText style={{ color: theme.text, flexShrink: 1 }} type="smallBold" numberOfLines={1}>
                  {candidate.name}
                </ThemedText>
                <View
                  style={[
                    styles.scoreBadge,
                    { backgroundColor: `${scoreColor(candidate.score)}1F`, borderColor: `${scoreColor(candidate.score)}55` },
                  ]}>
                  <Sparkles size={10} color={scoreColor(candidate.score)} />
                  <ThemedText style={[styles.scoreText, { color: scoreColor(candidate.score) }]}>
                    {`${candidate.score}/100`}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={{ color: theme.textSecondary }} type="code" numberOfLines={1}>
                {candidate.role}
              </ThemedText>
              <ThemedText style={{ color: theme.textSecondary }} type="small" numberOfLines={2}>
                {candidate.note}
              </ThemedText>

              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Xem hồ sơ ${candidate.name}`}
                  onPress={() => viewProfile(candidate)}
                  style={({ pressed }) => [
                    styles.actionButton,
                    { borderColor: theme.primary, backgroundColor: `${theme.primary}12`, opacity: pressed ? 0.75 : 1 },
                  ]}>
                  <UserRound size={13} color={theme.primary} />
                  <ThemedText style={[styles.actionText, { color: theme.primary }]}>Xem hồ sơ</ThemedText>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Nhắn tin ${candidate.name}`}
                  onPress={messageCandidate}
                  style={({ pressed }) => [
                    styles.actionButton,
                    { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.75 : 1 },
                  ]}>
                  <MessageCircle size={13} color={theme.text} />
                  <ThemedText style={[styles.actionText, { color: theme.text }]}>Nhắn tin</ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        ))}
      </View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: Radius['2xl'],
    padding: 16,
    gap: 12,
  },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headingIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingTexts: { flex: 1, gap: 1, minWidth: 0 },
  headingTitle: { fontFamily: font('semibold'), fontSize: 15 },
  list: { gap: 9 },
  row: {
    flexDirection: 'row',
    gap: 10,
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: 11,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 3, minWidth: 0 },
  rowHead: { flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'space-between' },
  scoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scoreText: { fontFamily: font('bold'), fontSize: 11 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderWidth: 1,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  actionText: { fontFamily: font('semibold'), fontSize: 12 },
});
