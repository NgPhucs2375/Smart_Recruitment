import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Lock, MessageCircle, Plus, Search, X } from 'lucide-react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { font, Radius } from '@/constants/theme';
import { ChatAvatar } from '@/features/chat/components/chat-avatar';
import { chatRoleLabel } from '@/features/chat/chat-format';
import type {
  ChatContact,
  ChatConversation,
  ChatConversationType,
  CreateConversationInput,
} from '@/features/chat/types';
import { useTheme } from '@/hooks/use-theme';

type NewChatSheetProps = {
  visible: boolean;
  contacts: ChatContact[];
  canCreate: boolean;
  creating: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (
    input: CreateConversationInput,
  ) => Promise<ChatConversation | null>;
};

export function NewChatSheet({
  visible,
  contacts,
  canCreate,
  creating,
  error,
  onClose,
  onCreate,
}: NewChatSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<ChatConversationType>(0);
  const [query, setQuery] = useState('');
  const [title, setTitle] = useState('');

  const reset = () => {
    setMode(0);
    setQuery('');
    setTitle('');
  };

  const close = () => {
    if (!creating) onClose();
  };

  const normalizedQuery = query.trim().toLocaleLowerCase('vi');
  const visibleContacts = contacts.filter(
    (contact) =>
      !normalizedQuery ||
      contact.name.toLocaleLowerCase('vi').includes(normalizedQuery),
  );

  const startDirect = async (contact: ChatContact) => {
    if (creating) return;
    const conversation = await onCreate({
      type: 0,
      recipientId: contact.id,
    });
    if (conversation) onClose();
  };

  const createGroup = async () => {
    if (creating || !title.trim()) return;
    const conversation = await onCreate({ type: 1, title: title.trim() });
    if (conversation) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={close}
      onShow={reset}
      statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Đóng tạo hội thoại"
          style={StyleSheet.absoluteFill}
          onPress={close}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 16),
              },
            ]}>
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            <View style={styles.header}>
              <View style={styles.headerCopy}>
                <ThemedText style={styles.title}>Hội thoại mới</ThemedText>
                <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
                  Chọn đồng nghiệp để chat riêng hoặc tạo phòng chung.
                </ThemedText>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Đóng"
                hitSlop={10}
                onPress={close}
                style={[styles.closeButton, { backgroundColor: theme.backgroundSelected }]}>
                <X size={17} color={theme.text} />
              </Pressable>
            </View>

            {!canCreate ? (
              <View style={[styles.locked, { backgroundColor: theme.muted }]}>
                <Lock size={18} color={theme.textSecondary} />
                <ThemedText style={[styles.lockedText, { color: theme.textSecondary }]}>
                  Tài khoản chưa được phép tạo hội thoại mới.
                </ThemedText>
              </View>
            ) : (
              <>
                <View
                  style={[
                    styles.segment,
                    { backgroundColor: theme.muted, borderColor: theme.border },
                  ]}>
                  <ModeButton
                    label="Chat riêng"
                    active={mode === 0}
                    onPress={() => setMode(0)}
                  />
                  <ModeButton
                    label="Phòng chung"
                    active={mode === 1}
                    onPress={() => setMode(1)}
                  />
                </View>

                {error ? (
                  <View
                    style={[
                      styles.error,
                      {
                        backgroundColor: `${theme.destructive}0F`,
                        borderColor: `${theme.destructive}44`,
                      },
                    ]}>
                    <ThemedText style={[styles.errorText, { color: theme.destructive }]}>
                      {error}
                    </ThemedText>
                  </View>
                ) : null}

                {mode === 0 ? (
                  <>
                    <View
                      style={[
                        styles.search,
                        { backgroundColor: theme.background, borderColor: theme.border },
                      ]}>
                      <Search size={16} color={theme.textSecondary} />
                      <TextInput
                        accessibilityLabel="Tìm đồng nghiệp"
                        value={query}
                        onChangeText={setQuery}
                        placeholder="Tìm đồng nghiệp..."
                        placeholderTextColor={theme.textSecondary}
                        autoCorrect={false}
                        returnKeyType="search"
                        style={[styles.searchInput, { color: theme.text }]}
                      />
                    </View>

                    <ScrollView
                      style={styles.contactScroll}
                      contentContainerStyle={styles.contactList}
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator={false}>
                      {visibleContacts.map((contact) => (
                        <Pressable
                          key={contact.id}
                          accessibilityRole="button"
                          accessibilityLabel={`Chat riêng với ${contact.name}`}
                          disabled={creating}
                          onPress={() => void startDirect(contact)}
                          style={({ pressed }) => [
                            styles.contactRow,
                            {
                              borderColor: theme.border,
                              backgroundColor: pressed
                                ? theme.backgroundSelected
                                : 'transparent',
                              opacity: creating ? 0.6 : 1,
                            },
                          ]}>
                          <ChatAvatar name={contact.name} size={38} />
                          <View style={styles.contactCopy}>
                            <ThemedText
                              numberOfLines={1}
                              style={[styles.contactName, { color: theme.text }]}>
                              {contact.name}
                            </ThemedText>
                            <ThemedText
                              numberOfLines={1}
                              style={[styles.contactRole, { color: theme.textSecondary }]}>
                              {chatRoleLabel(contact.role)}
                            </ThemedText>
                          </View>
                          {creating ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                          ) : (
                            <MessageCircle size={17} color={theme.primary} />
                          )}
                        </Pressable>
                      ))}

                      {visibleContacts.length === 0 ? (
                        <ThemedText
                          style={[styles.empty, { color: theme.textSecondary }]}>
                          Không tìm thấy đồng nghiệp phù hợp.
                        </ThemedText>
                      ) : null}
                    </ScrollView>
                  </>
                ) : (
                  <View style={styles.groupForm}>
                    <ThemedText style={[styles.label, { color: theme.text }]}>
                      Tên phòng chung
                    </ThemedText>
                    <TextInput
                      accessibilityLabel="Tên phòng chung"
                      value={title}
                      onChangeText={setTitle}
                      placeholder="Ví dụ: Trao đổi tuyển dụng"
                      placeholderTextColor={theme.textSecondary}
                      maxLength={120}
                      returnKeyType="done"
                      onSubmitEditing={() => void createGroup()}
                      style={[
                        styles.titleInput,
                        {
                          borderColor: theme.border,
                          backgroundColor: theme.background,
                          color: theme.text,
                        },
                      ]}
                    />
                    <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
                      Phòng chung hiển thị với toàn bộ nhân sự và người đại diện
                      trong doanh nghiệp.
                    </ThemedText>
                    <Button
                      pill
                      size="lg"
                      disabled={creating || !title.trim()}
                      onPress={() => void createGroup()}
                      icon={<Plus size={16} color={theme.primaryForeground} />}
                      style={styles.groupButton}>
                      {creating ? 'Đang tạo...' : 'Tạo phòng chung'}
                    </Button>
                  </View>
                )}
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function ModeButton({
  label,
  active,
  onPress,
}: {
  label: string;
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
        styles.modeButton,
        active && { backgroundColor: theme.backgroundElement },
      ]}>
      <ThemedText
        style={[
          styles.modeText,
          { color: active ? theme.text : theme.textSecondary },
          active && styles.modeTextActive,
        ]}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  keyboardView: { maxHeight: '92%' },
  sheet: {
    maxHeight: '100%',
    borderTopLeftRadius: Radius['2xl'] + 8,
    borderTopRightRadius: Radius['2xl'] + 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 12,
  },
  handle: {
    width: 42,
    height: 4,
    borderRadius: 99,
    alignSelf: 'center',
    marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerCopy: { flex: 1 },
  title: { fontFamily: font('semibold'), fontSize: 18 },
  subtitle: {
    fontFamily: font('regular'),
    fontSize: 12,
    lineHeight: 18,
    marginTop: 3,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segment: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
  },
  modeButton: {
    flex: 1,
    minHeight: 38,
    borderRadius: Radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeText: { fontFamily: font('medium'), fontSize: 13 },
  modeTextActive: { fontFamily: font('semibold') },
  error: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  errorText: {
    fontFamily: font('medium'),
    fontSize: 12,
    lineHeight: 17,
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 44,
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
  contactScroll: { flexShrink: 1 },
  contactList: { gap: 8, paddingBottom: 4 },
  contactRow: {
    minHeight: 58,
    borderRadius: Radius.xl,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  contactCopy: { flex: 1, minWidth: 0, gap: 2 },
  contactName: { fontFamily: font('semibold'), fontSize: 14 },
  contactRole: { fontFamily: font('regular'), fontSize: 11 },
  empty: {
    fontFamily: font('regular'),
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 18,
  },
  groupForm: { gap: 9, paddingBottom: 4 },
  label: { fontFamily: font('semibold'), fontSize: 13 },
  titleInput: {
    minHeight: 46,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontFamily: font('regular'),
    fontSize: 14,
  },
  hint: {
    fontFamily: font('regular'),
    fontSize: 11,
    lineHeight: 16,
  },
  groupButton: { marginTop: 4 },
  locked: {
    borderRadius: Radius.xl,
    paddingHorizontal: 14,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  lockedText: {
    flex: 1,
    fontFamily: font('medium'),
    fontSize: 12,
    lineHeight: 18,
  },
});
