import { USE_MOCK_JOBS } from '@/features/jobs/api/jobs-api';
import { toTimestamp } from '@/features/jobs/format';
import { apiRequest } from '@/services/api/client';
import {
  asBoolean,
  asNumber,
  asRecord,
  asText,
  unwrapData,
} from '@/services/api/parse';

import {
  createMockChatConversation,
  getMockChatContext,
  listMockChatContacts,
  listMockChatConversations,
  listMockChatMessages,
  sendMockChatMessage,
} from '../mock-data';
import type {
  ChatContact,
  ChatContext,
  ChatConversation,
  ChatConversationType,
  ChatMessage,
  CreateConversationInput,
} from '../types';

const BASE_PATH = 'chat';
const MESSAGE_PAGE_SIZE = 100;

function nullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function parseContext(payload: unknown): ChatContext {
  const raw = asRecord(unwrapData(payload));
  if (!raw) throw new Error('Không đọc được thông tin phiên chat.');

  return {
    currentUserId: asNumber(raw.currentUserId ?? raw.CurrentUserId),
    companyId: asNumber(raw.companyId ?? raw.CompanyId),
    canCreate: asBoolean(raw.canCreate ?? raw.CanCreate),
    canSend: asBoolean(raw.canSend ?? raw.CanSend),
  };
}

function parseContact(value: unknown): ChatContact | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asNumber(raw.id ?? raw.Id);
  const name = asText(raw.name ?? raw.Name);
  if (!id || !name) return null;

  return {
    id,
    name,
    role: asText(raw.role ?? raw.Role, 'NHAN_SU'),
  };
}

function parseConversationType(value: unknown): ChatConversationType {
  return asNumber(value, 1) === 0 ? 0 : 1;
}

function parseConversation(value: unknown): ChatConversation | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asNumber(raw.id ?? raw.Id);
  if (!id) return null;

  return {
    id,
    title: asText(raw.title ?? raw.Title, 'Hội thoại'),
    type: parseConversationType(raw.type ?? raw.Type),
    otherUserId: nullableNumber(raw.otherUserId ?? raw.OtherUserId),
  };
}

export function parseChatMessage(value: unknown): ChatMessage | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const id = asNumber(raw.id ?? raw.Id);
  const content = asText(raw.content ?? raw.Content);
  if (!id || !content) return null;

  const created = asText(raw.created ?? raw.Created);
  const createdAtValue = toTimestamp(created) ?? 0;

  return {
    id,
    conversationId: asText(raw.conversationId ?? raw.ConversationId),
    senderId: asText(raw.senderId ?? raw.SenderId),
    content,
    created,
    createdAtValue,
  };
}

function parseConversations(payload: unknown): ChatConversation[] {
  const data = unwrapData(payload);
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => parseConversation(item))
    .filter((item): item is ChatConversation => item !== null);
}

function parseContacts(payload: unknown): ChatContact[] {
  const data = unwrapData(payload);
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => parseContact(item))
    .filter((item): item is ChatContact => item !== null);
}

function parseMessages(payload: unknown): ChatMessage[] {
  const data = unwrapData(payload);
  if (!Array.isArray(data)) return [];
  return data
    .map((item) => parseChatMessage(item))
    .filter((item): item is ChatMessage => item !== null);
}

async function getContext(): Promise<ChatContext> {
  if (USE_MOCK_JOBS) return getMockChatContext();
  const payload = await apiRequest<unknown>(`${BASE_PATH}/context`);
  return parseContext(payload);
}

async function listContacts(): Promise<ChatContact[]> {
  if (USE_MOCK_JOBS) return listMockChatContacts();
  const payload = await apiRequest<unknown>(`${BASE_PATH}/contacts`);
  return parseContacts(payload);
}

async function listConversations(): Promise<ChatConversation[]> {
  if (USE_MOCK_JOBS) return listMockChatConversations();
  const payload = await apiRequest<unknown>(`${BASE_PATH}/conversations`);
  return parseConversations(payload);
}

async function createConversation(
  input: CreateConversationInput,
): Promise<ChatConversation> {
  if (USE_MOCK_JOBS) return createMockChatConversation(input);

  const payload = await apiRequest<unknown>(`${BASE_PATH}/conversations`, {
    method: 'POST',
    body: JSON.stringify({
      Type: input.type,
      Title: input.title,
      RecipientId: input.recipientId,
    }),
  });
  const conversation = parseConversation(unwrapData(payload));
  if (!conversation) throw new Error('Không tạo được hội thoại.');
  return conversation;
}

async function listMessages(
  conversationId: number,
  beforeId?: number,
  take = MESSAGE_PAGE_SIZE,
): Promise<ChatMessage[]> {
  if (USE_MOCK_JOBS) {
    return listMockChatMessages(conversationId, beforeId, take);
  }

  const params = new URLSearchParams({ take: String(take) });
  if (beforeId) params.set('beforeId', String(beforeId));

  const payload = await apiRequest<unknown>(
    `${BASE_PATH}/conversations/${conversationId}/messages?${params.toString()}`,
  );
  return parseMessages(payload);
}

async function sendMockMessage(
  conversationId: number,
  content: string,
): Promise<ChatMessage> {
  if (!USE_MOCK_JOBS) {
    throw new Error('Tin nhắn thật được gửi qua SignalR.');
  }
  return sendMockChatMessage(conversationId, content);
}

export const chatApi = {
  getContext,
  listContacts,
  listConversations,
  createConversation,
  listMessages,
  sendMockMessage,
};
