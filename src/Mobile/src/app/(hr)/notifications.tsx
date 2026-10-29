import { useState } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { BadgeCheck, ChevronRight, Sparkles, UserPlus } from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { font, Radius, Shadows } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type HrNotification = {
  id: number;
  title: string;
  body: string;
  tag: string;
  time: string;
  unread: boolean;
  href: '/applicants' | '/jobs';
  icon: 'apply' | 'ai' | 'approve';
};

const MOCK_NOTIFICATIONS: HrNotification[] = [
  {
    id: 1,
    title: 'Đơn ứng tuyển mới',
    body: 'Trần Minh Đức đã ứng tuyển vị trí .NET Core Developer.',
    tag: 'Ứng tuyển',
    time: '2 phút trước',
    unread: true,
    href: '/applicants',
    icon: 'apply',
  },
  {
    id: 2,
    title: 'AI đã phân tích 5 hồ sơ',
    body: 'Kết quả phân tích CV cho tin React Native Developer đã sẵn sàng.',
    tag: 'AI',
    time: '1 giờ trước',
    unread: true,
    href: '/jobs',
    icon: 'ai',
  },
  {
    id: 3,
    title: 'Tin tuyển dụng được duyệt',
    body: 'Tin Senior Frontend Developer đã được quản trị viên phê duyệt và hiển thị công khai.',
    tag: 'Tin tuyển',
    time: 'Hôm qua',
    unread: false,
    href: '/jobs',
    icon: 'approve',
  },
];

const ICONS = {
  apply: UserPlus,
  ai: Sparkles,
  approve: BadgeCheck,
} as const;

export default function HRNotificationsScreen() {
  const theme = useTheme();
  const [items, setItems] = useState<HrNotification[]>(MOCK_NOTIFICATIONS);

  const handlePress = (item: HrNotification) => {
    if (item.unread) {
      setItems((prev) => prev.map((entry) => (entry.id === item.id ? { ...entry, unread: false } : entry)));
    }
    router.push(item.href);
  };

  const unreadCount = items.filter((item) => item.unread).length;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.title}>Thông báo</ThemedText>
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
          {unreadCount > 0
            ? `Bạn có ${unreadCount} thông báo chưa đọc.`
            : 'Bạn đã xem hết thông báo tuyển dụng.'}
        </ThemedText>

        <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
          GẦN ĐÂY
        </ThemedText>

        {items.map((item) => {
          const Icon = ICONS[item.icon];
          return (
            <TouchableOpacity
              key={item.id}
              accessibilityRole="button"
              accessibilityLabel={`${item.unread ? 'Chưa đọc. ' : ''}${item.title}. ${item.body}`}
              activeOpacity={0.7}
              onPress={() => handlePress(item)}
              style={[
                styles.card,
                Shadows.filter,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: item.unread ? `${theme.primary}45` : theme.border,
                },
              ]}>
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: item.unread ? `${theme.primary}14` : theme.backgroundSelected },
                ]}>
                <Icon size={18} color={item.unread ? theme.primary : theme.textSecondary} />
              </View>

              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <ThemedText
                    numberOfLines={1}
                    style={[
                      styles.cardTitle,
                      { color: item.unread ? theme.text : theme.textSecondary },
                      !item.unread && styles.cardTitleRead,
                    ]}>
                    {item.title}
                  </ThemedText>
                  {item.unread ? (
                    <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                  ) : null}
                </View>

                <ThemedText numberOfLines={2} style={[styles.cardBody, { color: theme.textSecondary }]}>
                  {item.body}
                </ThemedText>

                <View style={styles.metaRow}>
                  <Badge variant={item.unread ? 'default' : 'outline'}>{item.tag}</Badge>
                  <ThemedText style={[styles.time, { color: theme.textSecondary }]}>{item.time}</ThemedText>
                  <ChevronRight size={14} color={theme.textSecondary} />
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 38 },
  title: { fontFamily: font('semibold'), fontSize: 24, letterSpacing: -0.4 },
  subtitle: { fontFamily: font('regular'), fontSize: 13, lineHeight: 19, marginTop: -4 },
  sectionTitle: { fontFamily: font('semibold'), fontSize: 11, letterSpacing: 1.4, marginTop: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: 14,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0, gap: 5 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontFamily: font('semibold'), fontSize: 14, lineHeight: 20 },
  cardTitleRead: { fontFamily: font('medium') },
  unreadDot: { width: 7, height: 7, borderRadius: 4 },
  cardBody: { fontFamily: font('regular'), fontSize: 12.5, lineHeight: 18 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  time: { flex: 1, fontFamily: font('regular'), fontSize: 11 },
});
