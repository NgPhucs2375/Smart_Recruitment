import { useLocalSearchParams } from 'expo-router';

import { ChatThreadScreen } from '@/features/chat/components/chat-thread-screen';

export default function HRMessagesThreadRoute() {
  const params = useLocalSearchParams<{ id?: string; title?: string }>();
  const id = Number(params.id);

  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }

  return <ChatThreadScreen conversationId={id} title={typeof params.title === 'string' ? params.title : undefined} />;
}
