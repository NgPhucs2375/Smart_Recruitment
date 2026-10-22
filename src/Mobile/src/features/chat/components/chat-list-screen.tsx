import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Building2, Plus, RefreshCw, Search, UserRound, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { chatApi } from '@/features/chat/api/chat-api';
import {
  TYPE_DIRECT,
  TYPE_GROUP,
  type ChatContact,
  type ChatContext,
  type ChatConversation,
  type ConversationKind,
} from '@/features/chat/types';
import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import {
  Chip,
  HrEmptyState,
  HrErrorState,
  HrLoadingState,
  HrScreenShell,
  HrTopBar,
} from '@/features/hr/components/hr-primitives';
import { useTheme } from '@/hooks/use-theme';

function contactRoleLabel(role: string): string {
  const key = role.trim().toUpperCase();
  if (key === 'NGUOI_DAI_DIEN') return 'Người đại diện';
  if (key === 'NHAN_SU') return 'Nhân sự';
  return role || 'Thành viên';
}

function initials(title: string, type: number): string {
  if (type === TYPE_GROUP) return '';
  return (title || 'NV').slice(0, 2).toUpperCase();
}

export function ChatListScreen() {
  const theme = useTheme();

  const [context, setContext] = useState<ChatContext | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [kind, setKind] = useState<ConversationKind>('company');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState<'direct' | 'group'>('direct');
  const [recipient, setRecipient] = useState<number | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);
  const [dialogError, setDialogError] = useState('');

  const mountedRef = useRef(true);

  const refresh = useCallback(async () => {
    try {
      const [current, people, rooms] = await Promise.all([
        chatApi.getContext(),
        chatApi.getContacts(),
        chatApi.getConversations(),
      ]);
      if (!mountedRef.current) return;
      setContext(current);
      setContacts(people);
      setConversations(rooms);
      setError('');
    } catch (reason) {
      if (!mountedRef.current) return;
      setError(reason instanceof Error ? reason.message : 'Không thể tải chat.');
      setContext(null);
      setContacts([]);
      setConversations([]);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    void refresh().finally(() => {
      if (mountedRef.current) setLoading(false);
    });
    const interval = setInterval(() => void refresh(), 30_000);
    return () => {
      mountedRef.current = false;
      clearInterval(interval);
    };
  }, [refresh]);

  const handleRefresh = () => {
    setRefreshing(true);
    void refresh().finally(() => {
      if (mountedRef.current) setRefreshing(false);
    });
  };

  const openDialog = (nextKind: 'direct' | 'group') => {
    setDialogKind(nextKind);
    setRecipient(null);
    setContactSearch('');
    setNewTitle('');
    setDialogError('');
    setDialogOpen(true);
  };

  const createConversation = async () => {
    if (creating) return;
    setCreating(true);
    setDialogError('');
    try {
      const room = await chatApi.createConversation({
        kind: dialogKind,
        recipientId: recipient,
        title: newTitle,
      });
      if (!mountedRef.current) return;
      setConversations((previous) => [room, ...previous.filter((item) => item.Id !== room.Id)]);
      setDialogOpen(false);
      router.push({
        pathname: '/hr/messages/[id]',
        params: { id: String(room.Id), title: room.Title },
      });
    } catch (reason) {
      if (mountedRef.current) {
        setDialogError(reason instanceof Error ? reason.message : 'Không thể tạo hội thoại.');
      }
    } finally {
      if (mountedRef.current) setCreating(false);
    }
  };

  const visible = conversations.filter(
    (room) =>
      room.Type === (kind === 'direct' ? TYPE_DIRECT : TYPE_GROUP) &&
      room.Title.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi')),
  );
  const people = contacts.filter((person) =>
    person.Name.toLocaleLowerCase('vi').includes(contactSearch.trim().toLocaleLowerCase('vi')),
  );
  const canCreate = context?.CanCreate ?? false;

  return (
    <HrScreenShell>
      <HrTopBar
        title="Tin nhắn nội bộ"
        right={
          <View style={styles.topActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Làm mới danh sách hội thoại"
              onPress={handleRefresh}
              hitSlop={8}
              style={({ pressed }) => [styles.iconButton, { opacity: pressed ? 0.6 : 1 }]}
            >
              <RefreshCw size={18} color={theme.text} />
            </Pressable>
            <Button
              size="sm"
              pill
              disabled={!canCreate}
              icon={<Plus size={14} color={canCreate ? theme.primaryForeground : theme.textSecondary} />}
              onPress={() => openDialog('direct')}
            >
              Tạo mới
            </Button>
          </View>
        }
      />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
            progressBackgroundColor={theme.backgroundElement}
          />
        }
      >
        <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]} type="small">
          Không gian trao đổi riêng của đội ngũ HR.
        </ThemedText>

        {USE_MOCK_JOBS ? (
          <View style={styles.demoRow}>
            <Badge variant="secondary">DỮ LIỆU MINH HỌA</Badge>
          </View>
        ) : null}

        {error ? <HrErrorState message={error} onRetry={() => void refresh()} /> : null}

        <View style={styles.toolbar}>
          <View style={styles.kindGroup}>
            <Chip
              label="Phòng chung"
              active={kind === 'company'}
              onPress={() => setKind('company')}
            />
            <Chip label="Chat riêng" active={kind === 'direct'} onPress={() => setKind('direct')} />
          </View>
          <View style={[styles.searchBox, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <Search size={15} color={theme.textSecondary} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Tìm hội thoại..."
              placeholderTextColor={theme.textSecondary}
              style={[styles.searchInput, { color: theme.text }]}
              autoCapitalize="none"
              returnKeyType="search"
            />
          </View>
        </View>

        {loading && conversations.length === 0 && !error ? (
          <HrLoadingState label="Đang tải hội thoại…" />
        ) : !loading && visible.length === 0 && !error ? (
          <HrEmptyState
            title={search ? 'Không tìm thấy hội thoại' : 'Chưa có cuộc trò chuyện'}
            description={
              search
                ? 'Thử đổi từ khóa tìm kiếm.'
                : 'Tạo nhóm trao đổi hoặc nhắn tin trực tiếp với các thành viên tuyển dụng trong doanh nghiệp của bạn.'
            }
            action={
              !search ? (
                <Button
                  size="sm"
                  pill
                  variant="outline"
                  disabled={!canCreate}
                  onPress={() => openDialog(kind === 'direct' ? 'direct' : 'group')}
                >
                  Bắt đầu hội thoại mới
                </Button>
              ) : undefined
            }
          />
        ) : (
          <View style={[styles.listCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            {visible.map((room, index) => (
              <Pressable
                key={room.Id}
                accessibilityRole="button"
                onPress={() =>
                  router.push({
                    pathname: '/hr/messages/[id]',
                    params: { id: String(room.Id), title: room.Title },
                  })
                }
                style={({ pressed }) => [
                  styles.roomRow,
                  {
                    borderTopColor: theme.border,
                    borderTopWidth: index === 0 ? 0 : StyleSheet.hairlineWidth,
                    backgroundColor: pressed ? theme.backgroundSelected : 'transparent',
                  },
                ]}
              >
                <View style={[styles.roomAvatar, { backgroundColor: theme.backgroundSelected }]}>
                  {room.Type === TYPE_GROUP ? (
                    <Building2 size={18} color={theme.primary} />
                  ) : (
                    <ThemedText style={[styles.roomInitials, { color: theme.primary }]}>
                      {initials(room.Title, room.Type)}
                    </ThemedText>
                  )}
                </View>
                <View style={styles.roomBody}>
                  <ThemedText style={styles.roomTitle} numberOfLines={1} type="smallBold">
                    {room.Title}
                  </ThemedText>
                  <ThemedText
                    style={[styles.roomMeta, { color: theme.textSecondary }]}
                    numberOfLines={1}
                    type="small"
                  >
                    {room.Type === TYPE_GROUP ? 'Mọi thành viên doanh nghiệp' : 'Chỉ hai người tham gia'}
                  </ThemedText>
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={dialogOpen} transparent animationType="fade" onRequestClose={() => setDialogOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <ThemedText type="subtitle">Cuộc trò chuyện mới</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }} type="small">
                  Chọn không gian trao đổi trong doanh nghiệp của bạn.
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                disabled={creating}
                onPress={() => setDialogOpen(false)}
                hitSlop={8}
                style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
              >
                <X size={20} color={theme.text} />
              </Pressable>
            </View>

            <View style={styles.kindToggle}>
              <Button
                size="sm"
                variant={dialogKind === 'direct' ? 'default' : 'outline'}
                icon={<UserRound size={14} color={dialogKind === 'direct' ? theme.primaryForeground : theme.text} />}
                disabled={creating}
                onPress={() => {
                  setDialogKind('direct');
                  setDialogError('');
                }}
              >
                Chat riêng 1–1
              </Button>
              <Button
                size="sm"
                variant={dialogKind === 'group' ? 'default' : 'outline'}
                icon={<Building2 size={14} color={dialogKind === 'group' ? theme.primaryForeground : theme.text} />}
                disabled={creating}
                onPress={() => {
                  setDialogKind('group');
                  setDialogError('');
                }}
              >
                Phòng chung
              </Button>
            </View>

            {dialogKind === 'direct' ? (
              <View style={styles.modalSection}>
                <ThemedText type="smallBold">Người nhận</ThemedText>
                <TextInput
                  value={contactSearch}
                  onChangeText={setContactSearch}
                  placeholder="Tìm đồng nghiệp theo tên..."
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.modalInput,
                    { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                />
                <ScrollView style={styles.contactList} nestedScrollEnabled>
                  {people.map((person) => {
                    const active = recipient === person.Id;
                    return (
                      <Pressable
                        key={person.Id}
                        accessibilityRole="button"
                        disabled={creating}
                        onPress={() => setRecipient(person.Id)}
                        style={({ pressed }) => [
                          styles.contactRow,
                          {
                            backgroundColor: active
                              ? theme.backgroundSelected
                              : pressed
                                ? theme.muted
                                : 'transparent',
                            borderColor: active ? theme.primary : theme.border,
                            opacity: pressed ? 0.85 : 1,
                          },
                        ]}
                      >
                        <View style={[styles.roomAvatar, { backgroundColor: theme.backgroundSelected }]}>
                          <ThemedText style={[styles.roomInitials, { color: theme.primary }]}>
                            {person.Name.slice(0, 2).toUpperCase()}
                          </ThemedText>
                        </View>
                        <View style={styles.roomBody}>
                          <ThemedText style={styles.roomTitle} numberOfLines={1} type="smallBold">
                            {person.Name}
                          </ThemedText>
                          <ThemedText style={{ color: theme.textSecondary }} type="small" numberOfLines={1}>
                            {contactRoleLabel(person.Role)}
                          </ThemedText>
                        </View>
                        {active ? <Badge>Đã chọn</Badge> : null}
                      </Pressable>
                    );
                  })}
                  {!people.length ? (
                    <ThemedText style={styles.contactEmpty} type="small">
                      {contacts.length
                        ? 'Không tìm thấy đồng nghiệp phù hợp.'
                        : 'Chưa có đồng nghiệp đang hoạt động. Người đại diện cần mời nhân sự vào doanh nghiệp trước.'}
                    </ThemedText>
                  ) : null}
                </ScrollView>
                <ThemedText style={{ color: theme.textSecondary }} type="small">
                  Hội thoại chỉ hiển thị với hai người. Nếu đã có cuộc trò chuyện, hệ thống mở lại hội
                  thoại đó.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.modalSection}>
                <ThemedText type="smallBold">Tên phòng chung</ThemedText>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  maxLength={120}
                  placeholder="Ví dụ: Trao đổi tuyển dụng"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.modalInput,
                    { color: theme.text, backgroundColor: theme.background, borderColor: theme.border },
                  ]}
                />
                <ThemedText style={{ color: theme.textSecondary }} type="small">
                  Phòng chung hiển thị cho mọi thành viên HR trong doanh nghiệp.
                </ThemedText>
              </View>
            )}

            {dialogError ? (
              <ThemedText style={[styles.dialogError, { color: theme.destructive }]} type="small">
                {dialogError}
              </ThemedText>
            ) : null}

            <View style={styles.modalActions}>
              <Button variant="outline" disabled={creating} onPress={() => setDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                disabled={creating || (dialogKind === 'direct' ? !recipient : !newTitle.trim())}
                onPress={() => void createConversation()}
              >
                {creating ? 'Đang tạo…' : dialogKind === 'direct' ? 'Bắt đầu chat' : 'Tạo phòng chung'}
              </Button>
            </View>
          </View>
        </View>
      </Modal>
    </HrScreenShell>
  );
}

const styles = StyleSheet.create({
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 4 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  subtitle: {},
  demoRow: { alignItems: 'flex-start' },
  toolbar: { gap: 8 },
  kindGroup: { flexDirection: 'row', gap: 8 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    minHeight: 42,
  },
  searchInput: { flex: 1, fontFamily: font('regular'), fontSize: 14, paddingVertical: 8 },
  listCard: {
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  roomRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 64 },
  roomAvatar: {
    width: 40,
    height: 40,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomInitials: { fontFamily: font('semibold'), fontSize: 13 },
  roomBody: { flex: 1, minWidth: 0, gap: 2 },
  roomTitle: { fontFamily: font('semibold') },
  roomMeta: { fontSize: 12 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: '#00000066',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    borderRadius: Radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 20,
    gap: 14,
  },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  modalHeaderText: { flex: 1, minWidth: 0, gap: 4 },
  kindToggle: { flexDirection: 'row', gap: 8 },
  modalSection: { gap: 8 },
  modalInput: {
    minHeight: 44,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    fontFamily: font('regular'),
    fontSize: 14,
    paddingVertical: 10,
  },
  contactList: { maxHeight: 240 },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.lg,
    padding: 10,
    marginBottom: 6,
  },
  contactEmpty: { textAlign: 'center', paddingVertical: 18 },
  dialogError: {},
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
});
