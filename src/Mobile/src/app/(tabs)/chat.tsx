import { Redirect, router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  MessagesSquare,
  Plus,
  RefreshCw,
  Search,
  X,
} from 'lucide-react-native';

import { AppHeader } from '@/components/app-header';
import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { font, Palette, Radius, Shadows } from '@/constants/theme';
import { useAuth } from '@/features/auth';
import { ChatConversationRow } from '@/features/chat/components/chat-conversation-row';
import { NewChatSheet } from '@/features/chat/components/new-chat-sheet';
import { useChatConversations } from '@/features/chat/hooks/use-chat-conversations';
import { canUseInternalChat } from '@/features/chat/roles';
import type {
  ChatContact,
  ChatConversation,
  ChatConversationType,
  CreateConversationInput,
} from '@/features/chat/types';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { useTheme } from '@/hooks/use-theme';

type TypeFilter = 'all' | ChatConversationType;

export default function ChatListScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const allowed = canUseInternalChat(user?.roles);

  const {
    context,
    contacts,
    conversations,
    status,
    error,
    creating,
    createError,
    refresh,
    createConversation,
    clearCreateError,
  } = useChatConversations(allowed);

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [sheetOpen, setSheetOpen] = useState(false);

  const contactById = useMemo(() => {
    const map = new Map<number, ChatContact>();
    for (const contact of contacts) map.set(contact.id, contact);
    return map;
  }, [contacts]);

  const visibleConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi');
    return conversations.filter((item) => {
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;
      if (!normalizedQuery) return true;
      return item.title.toLocaleLowerCase('vi').includes(normalizedQuery);
    });
  }, [conversations, query, typeFilter]);

  if (!allowed) return <Redirect href="/" />;

  const loading =
    status === 'loading' || (status === 'refreshing' && conversations.length === 0);
  const directCount = conversations.filter((item) => item.type === 0).length;
  const groupCount = conversations.filter((item) => item.type === 1).length;

  const openConversation = (item: ChatConversation) => {
    router.push(`/chat/${item.id}` as Href);
  };

  const openSheet = () => {
    if (!context?.canCreate) return;
    clearCreateError();
    setSheetOpen(true);
  };

  const handleCreate = async (input: CreateConversationInput) => {
    const conversation = await createConversation(input);
    if (conversation) {
      setSheetOpen(false);
      router.push(`/chat/${conversation.id}` as Href);
    }
    return conversation;
  };

  const listHeader = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <View style={[styles.iconBox, { backgroundColor: Palette.softGold }]}>
          <MessagesSquare size={22} color={Palette.bronze} />
        </View>
        <View style={styles.titleCopy}>
          <ThemedText style={[styles.title, { color: theme.text }]}>
            Tin nhắn
          </ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Trao đổi nội bộ giữa nhân sự và người đại diện.
          </ThemedText>
        </View>
      </View>

      {USE_MOCK_JOBS ? (
        <View style={styles.demoRow}>
          <Badge variant="secondary" textStyle={styles.demoBadge}>
            DEMO
          </Badge>
          <ThemedText style={[styles.demoText, { color: theme.textSecondary }]}>
            Đang dùng hội thoại mẫu, chưa kết nối backend.
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.createRow}>
        <View
          style={[
            styles.search,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}>
          <Search size={16} color={theme.textSecondary} />
          <TextInput
            accessibilityLabel="Tìm hội thoại"
            value={query}
            onChangeText={setQuery}
            placeholder="Tìm hội thoại..."
            placeholderTextColor={theme.textSecondary}
            autoCorrect={false}
            returnKeyType="search"
            style={[styles.searchInput, { color: theme.text }]}
          />
          {query ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Xoá từ khoá tìm kiếm"
              hitSlop={8}
              onPress={() => setQuery('')}>
              <X size={15} color={theme.textSecondary} />
            </Pressable>
          ) : null}
        </View>

        <Button
          pill
          size="icon"
          accessibilityLabel="Tạo hội thoại mới"
          disabled={!context?.canCreate || creating}
          onPress={openSheet}
          style={styles.createButton}>
          <Plus size={19} color={theme.primaryForeground} />
        </Button>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filters}>
        <FilterChip
          label="Tất cả"
          count={conversations.length}
          active={typeFilter === 'all'}
          onPress={() => setTypeFilter('all')}
        />
        <FilterChip
          label="Chat riêng"
          count={directCount}
          active={typeFilter === 0}
          onPress={() => setTypeFilter(0)}
        />
        <FilterChip
          label="Phòng chung"
          count={groupCount}
          active={typeFilter === 1}
          onPress={() => setTypeFilter(1)}
        />
      </ScrollView>

      {error && conversations.length > 0 ? (
        <View
          style={[
            styles.errorBanner,
            { borderColor: `${theme.destructive}44`, backgroundColor: `${theme.destructive}0F` },
          ]}>
          <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
            {error}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tải lại danh sách hội thoại"
            hitSlop={8}
            onPress={refresh}>
            <RefreshCw size={15} color={theme.destructive} />
          </Pressable>
        </View>
      ) : null}

      {!loading ? (
        <ThemedText style={[styles.countText, { color: theme.textSecondary }]}>
          {`${visibleConversations.length} hội thoại`}
        </ThemedText>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <AppHeader />

      <FlatList
        data={visibleConversations}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <ChatConversationRow
            item={item}
            contact={
              item.otherUserId ? contactById.get(item.otherUserId) : undefined
            }
            onPress={() => openConversation(item)}
          />
        )}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={
          <ChatEmptyState
            loading={loading}
            error={error}
            hasConversations={conversations.length > 0}
            canCreate={Boolean(context?.canCreate)}
            onRetry={refresh}
            onClear={() => {
              setQuery('');
              setTypeFilter('all');
            }}
            onCreate={openSheet}
          />
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) },
          visibleConversations.length === 0 && styles.contentEmpty,
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={status === 'refreshing'}
            onRefresh={refresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.backgroundElement}
          />
        }
      />

      <NewChatSheet
        visible={sheetOpen}
        contacts={contacts}
        canCreate={Boolean(context?.canCreate)}
        creating={creating}
        error={createError}
        onClose={() => {
          setSheetOpen(false);
          clearCreateError();
        }}
        onCreate={handleCreate}
      />
    </View>
  );
}

function FilterChip({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? theme.primary : theme.backgroundElement,
          borderColor: active ? theme.primary : theme.border,
        },
      ]}>
      <ThemedText
        style={[
          styles.filterText,
          { color: active ? theme.primaryForeground : theme.textSecondary },
        ]}>
        {label}
      </ThemedText>
      <View
        style={[
          styles.filterCount,
          {
            backgroundColor: active
              ? `${theme.primaryForeground}26`
              : theme.muted,
          },
        ]}>
        <ThemedText
          style={[
            styles.filterCountText,
            { color: active ? theme.primaryForeground : theme.textSecondary },
          ]}>
          {count}
        </ThemedText>
      </View>
    </Pressable>
  );
}

function ChatEmptyState({
  loading,
  error,
  hasConversations,
  canCreate,
  onRetry,
  onClear,
  onCreate,
}: {
  loading: boolean;
  error: string | null;
  hasConversations: boolean;
  canCreate: boolean;
  onRetry: () => void;
  onClear: () => void;
  onCreate: () => void;
}) {
  const theme = useTheme();

  if (loading) {
    return (
      <View style={styles.skeletonList}>
        {Array.from({ length: 3 }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.skeletonCard,
              { backgroundColor: theme.backgroundElement, borderColor: theme.border },
            ]}>
            <View style={[styles.skeletonAvatar, { backgroundColor: theme.muted }]} />
            <View style={styles.skeletonBody}>
              <View
                style={[
                  styles.skeletonLine,
                  { backgroundColor: theme.muted, width: '62%' },
                ]}
              />
              <View
                style={[
                  styles.skeletonLine,
                  { backgroundColor: theme.muted, width: '38%' },
                ]}
              />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.emptyCard,
        { backgroundColor: theme.backgroundElement, borderColor: theme.border },
      ]}>
      <View style={[styles.emptyIcon, { backgroundColor: `${Palette.bronze}18` }]}>
        {error ? (
          <RefreshCw size={24} color={theme.destructive} />
        ) : (
          <MessagesSquare size={24} color={Palette.bronze} />
        )}
      </View>
      <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>
        {error
          ? 'Chưa tải được hội thoại'
          : hasConversations
            ? 'Không có hội thoại phù hợp'
            : 'Chưa có hội thoại nào'}
      </ThemedText>
      <ThemedText style={[styles.emptyMessage, { color: theme.textSecondary }]}>
        {error ??
          (hasConversations
            ? 'Thử từ khoá khác hoặc chọn lại bộ lọc.'
            : canCreate
              ? 'Bắt đầu chat riêng với đồng nghiệp hoặc tạo một phòng chung.'
              : 'Bạn chưa có quyền tạo hội thoại. Hãy liên hệ quản trị doanh nghiệp.')}
      </ThemedText>
      <Button
        variant="outline"
        size="sm"
        pill
        onPress={
          error ? onRetry : hasConversations ? onClear : canCreate ? onCreate : onRetry
        }
        style={styles.emptyAction}>
        {error ? 'Thử lại' : hasConversations ? 'Xoá bộ lọc' : canCreate ? 'Tạo hội thoại' : 'Tải lại'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    flexGrow: 1,
  },
  contentEmpty: {},
  header: { paddingTop: 18, paddingBottom: 14, gap: 12 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleCopy: { flex: 1, gap: 2 },
  title: {
    fontFamily: font('semibold'),
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.4,
  },
  subtitle: { fontFamily: font('regular'), fontSize: 12, lineHeight: 18 },
  demoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  demoBadge: { fontFamily: font('semibold'), fontSize: 10 },
  demoText: { fontFamily: font('regular'), fontSize: 11, flex: 1 },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 46,
    borderRadius: Radius.pill,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    fontFamily: font('regular'),
    fontSize: 13,
    paddingVertical: 0,
  },
  createButton: {
    width: 46,
    height: 46,
    minHeight: 46,
    minWidth: 46,
    borderRadius: Radius.pill,
  },
  filters: { gap: 8, paddingRight: 4 },
  filterChip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: Radius.pill,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  filterText: { fontFamily: font('medium'), fontSize: 12 },
  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterCountText: { fontFamily: font('bold'), fontSize: 10 },
  errorBanner: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 11,
    lineHeight: 16,
  },
  countText: {
    fontFamily: font('regular'),
    fontSize: 11,
    marginTop: -2,
  },
  separator: { height: 10 },
  skeletonList: { gap: 10, paddingTop: 4 },
  skeletonCard: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadows.filter,
  },
  skeletonAvatar: { width: 44, height: 44, borderRadius: 22 },
  skeletonBody: { flex: 1, gap: 9 },
  skeletonLine: { height: 11, borderRadius: Radius.pill },
  emptyCard: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
    gap: 9,
    marginTop: 4,
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: Radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: font('semibold'),
    fontSize: 16,
    textAlign: 'center',
  },
  emptyMessage: {
    fontFamily: font('regular'),
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 320,
  },
  emptyAction: { marginTop: 8 },
});
