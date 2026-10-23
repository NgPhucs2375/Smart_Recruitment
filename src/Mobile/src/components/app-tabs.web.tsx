import type { Href } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { canUseInternalChat } from '@/features/chat/roles';
import { useTheme } from '@/hooks/use-theme';

export default function AppTabs() {
  const theme = useTheme();
  const { user } = useAuth();
  const canChat = canUseInternalChat(user?.roles);

  return (
    <Tabs>
      <TabSlot style={styles.content} />
      <TabList style={[styles.tabList, { borderTopColor: theme.border, backgroundColor: theme.backgroundElement }]}>
        <TabTrigger name="index" href="/" asChild>
          <TabButton label="Việc làm" />
        </TabTrigger>
        <TabTrigger name="saved" href="/saved" asChild>
          <TabButton label="Đã lưu" />
        </TabTrigger>
        {canChat ? (
          <TabTrigger name="chat" href={'/chat' as Href} asChild>
            <TabButton label="Tin nhắn" />
          </TabTrigger>
        ) : null}
        <TabTrigger name="profile" href="/profile" asChild>
          <TabButton label="Hồ sơ" />
        </TabTrigger>
      </TabList>
    </Tabs>
  );
}

function TabButton({ label, isFocused, ...props }: TabTriggerSlotProps & { label: string }) {
  const theme = useTheme();

  return (
    <Pressable {...props} accessibilityRole="tab" style={styles.tabButton}>
      <ThemedView
        style={[
          styles.tabPill,
          { backgroundColor: isFocused ? theme.backgroundSelected : 'transparent' },
        ]}>
        <ThemedText
          style={[
            styles.tabLabel,
            { color: isFocused ? theme.primary : theme.textSecondary },
          ]}>
          {label}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1 },
  tabList: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: Spacing.two,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabButton: { flex: 1 },
  tabPill: {
    minHeight: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: { fontSize: 12, fontWeight: '600' },
});
