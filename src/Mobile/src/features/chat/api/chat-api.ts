import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { apiRequest } from '@/services/api/client';

import type {
  ChatContact,
  ChatContext,
  ChatConversation,
  ChatMessage,
} from '../types';

const BASE = 'chat';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const body = await apiRequest<Record<string, unknown>>(`${BASE}${path}`, init);
  if (body && typeof body === 'object' && ('Data' in body || 'data' in body)) {
    return (body.Data ?? body.data) as T;
  }
  return body as T;
}

function jsonInit(method: string, payload: unknown): RequestInit {
  return { method, body: JSON.stringify(payload) };
}

/* ------------------------------------------------------------------ */
/* Mock (dev) — danh sách + lịch sử giả lập, hub không dùng được.      */
/* ------------------------------------------------------------------ */

const MOCK_CONTEXT: ChatContext = {
  CurrentUserId: 1,
  CompanyId: 1,
  CanCreate: true,
  CanSend: true,
};

const MOCK_CONTACTS: ChatContact[] = [
  { Id: 2, Name: 'Nguyễn Văn An', Role: 'NGUOI_DAI_DIEN' },
  { Id: 3, Name: 'Trần Thị Bích', Role: 'NHAN_SU' },
];

const MOCK_CONVERSATIONS: ChatConversation[] = [
  { Id: 1, Title: 'Phòng tuyển dụng IT', Type: 1, OtherUserId: null },
  { Id: 2, Title: 'Trao đổi riêng', Type: 0, OtherUserId: 3 },
];

const MOCK_MESSAGES: Record<number, ChatMessage[]> = {
  1: [
    {
      Id: 1,
      ConversationId: '1',
      SenderId: '3',
      Content: 'Chào anh, mình đã lọc được 8 hồ sơ phù hợp cho vị trí Backend.',
      Created: new Date(Date.now() - 3_600_000).toISOString(),
    },
    {
      Id: 2,
      ConversationId: '1',
      SenderId: '1',
      Content: 'Tốt lắm, chiều nay mình sẽ xem lại danh sách.',
      Created: new Date(Date.now() - 3_000_000).toISOString(),
    },
  ],
  2: [
    {
      Id: 3,
      ConversationId: '2',
      SenderId: '3',
      Content: 'Anh ơi, chị ứng viên kia hỏi lịch phỏng vấn tuần sau.',
      Created: new Date(Date.now() - 86_400_000).toISOString(),
    },
  ],
};

let mockMessageSeq = 100;

/* ------------------------------------------------------------------ */
/* API thật                                                            */
/* ------------------------------------------------------------------ */

export const chatApi = {
  async getContext(): Promise<ChatContext> {
    if (USE_MOCK_JOBS) return MOCK_CONTEXT;
    return request<ChatContext>('/context');
  },

  async getContacts(): Promise<ChatContact[]> {
    if (USE_MOCK_JOBS) return MOCK_CONTACTS;
    return request<ChatContact[]>('/contacts');
  },

  async getConversations(): Promise<ChatConversation[]> {
    if (USE_MOCK_JOBS) return MOCK_CONVERSATIONS;
    return request<ChatConversation[]>('/conversations');
  },

  async createConversation(input: {
    kind: 'direct' | 'group';
    recipientId?: number | null;
    title?: string;
  }): Promise<ChatConversation> {
    if (USE_MOCK_JOBS) {
      if (input.kind === 'group') {
        return {
          Id: Date.now(),
          Title: input.title?.trim() || 'Phòng chung',
          Type: 1,
          OtherUserId: null,
        };
      }
      const contact = MOCK_CONTACTS.find((c) => c.Id === input.recipientId);
      return { Id: Date.now(), Title: 'Trao đổi riêng', Type: 0, OtherUserId: contact?.Id ?? null };
    }
    const payload =
      input.kind === 'direct'
        ? { Type: 0, RecipientId: input.recipientId }
        : { Type: 1, Title: input.title?.trim() };
    return request<ChatConversation>('/conversations', jsonInit('POST', payload));
  },

  async getMessages(
    conversationId: number,
    options?: { take?: number; beforeId?: number },
  ): Promise<ChatMessage[]> {
    if (USE_MOCK_JOBS) {
      const list = MOCK_MESSAGES[conversationId] ?? [];
      const before = options?.beforeId;
      return list.filter((m) => (before ? m.Id < before : true));
    }
    const take = options?.take ?? 100;
    const before = options?.beforeId ? `&beforeId=${options.beforeId}` : '';
    return request<ChatMessage[]>(
      `/conversations/${conversationId}/messages?take=${take}${before}`,
    );
  },

  /** Mock: gửi local (không qua hub) — chỉ dùng khi USE_MOCK_JOBS bật. */
  createMockMessage(conversationId: number, currentUserId: number, content: string): ChatMessage {
    return {
      Id: ++mockMessageSeq,
      ConversationId: String(conversationId),
      SenderId: String(currentUserId),
      Content: content,
      Created: new Date().toISOString(),
    };
  },
};
