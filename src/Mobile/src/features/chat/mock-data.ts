import type {
  ChatContact,
  ChatContext,
  ChatConversation,
  ChatMessage,
  CreateConversationInput,
} from './types';

const MOCK_NOW = Date.now();
const CURRENT_USER_ID = 101;

const MOCK_CONTEXT: ChatContext = {
  currentUserId: CURRENT_USER_ID,
  companyId: 5,
  canCreate: true,
  canSend: true,
};

const MOCK_CONTACTS: ChatContact[] = [
  { id: 102, name: 'Nguyễn Minh Anh', role: 'NHAN_SU' },
  { id: 103, name: 'Trần Hoàng Nam', role: 'NGUOI_DAI_DIEN' },
  { id: 104, name: 'Lê Thu Hà', role: 'NHAN_SU' },
];

function createMessage(
  id: number,
  conversationId: number,
  senderId: number,
  content: string,
  minutesAgo: number,
): ChatMessage {
  const createdAtValue = MOCK_NOW - minutesAgo * 60_000;
  return {
    id,
    conversationId: String(conversationId),
    senderId: String(senderId),
    content,
    created: new Date(createdAtValue).toISOString(),
    createdAtValue,
  };
}

type MockConversationState = {
  conversation: ChatConversation;
  lastActivity: number;
};

let mockConversations: MockConversationState[] = [
  {
    conversation: {
      id: 5001,
      title: 'Trao đổi tuyển dụng',
      type: 1,
      otherUserId: null,
    },
    lastActivity: MOCK_NOW - 18 * 60_000,
  },
  {
    conversation: {
      id: 5002,
      title: 'Nguyễn Minh Anh',
      type: 0,
      otherUserId: 102,
    },
    lastActivity: MOCK_NOW - 65 * 60_000,
  },
  {
    conversation: {
      id: 5003,
      title: 'Trần Hoàng Nam',
      type: 0,
      otherUserId: 103,
    },
    lastActivity: MOCK_NOW - 26 * 60 * 60_000,
  },
];

let mockMessages: Record<number, ChatMessage[]> = {
  5001: [
    createMessage(7001, 5001, 102, 'Chào mọi người, tin React Native đã được duyệt.', 48),
    createMessage(7002, 5001, 101, 'Mình đã kiểm tra và đăng lên trang chủ.', 35),
    createMessage(
      7003,
      5001,
      103,
      'Có 3 ứng viên mới, mình sẽ gửi danh sách chiều nay.',
      18,
    ),
  ],
  5002: [
    createMessage(
      7004,
      5002,
      102,
      'Anh xem giúp em CV bạn Nguyễn Minh Anh nhé.',
      80,
    ),
    createMessage(
      7005,
      5002,
      101,
      'Anh đang xem, chiều nay phản hồi em.',
      65,
    ),
  ],
  5003: [
    createMessage(7006, 5003, 103, 'Lịch họp tuyển dụng 14:00 nhé.', 26 * 60 + 8),
    createMessage(7007, 5003, 101, 'Ok em.', 26 * 60),
  ],
};

let nextConversationId = 5100;
let nextMessageId = 7100;

function sortedConversations(): ChatConversation[] {
  return [...mockConversations]
    .sort((left, right) => right.lastActivity - left.lastActivity)
    .map((entry) => entry.conversation);
}

export function getMockChatContext(): ChatContext {
  return { ...MOCK_CONTEXT };
}

export function listMockChatContacts(): ChatContact[] {
  return MOCK_CONTACTS.map((contact) => ({ ...contact }));
}

export function listMockChatConversations(): ChatConversation[] {
  return sortedConversations();
}

export function listMockChatMessages(
  conversationId: number,
  beforeId?: number,
  take = 100,
): ChatMessage[] {
  const rows = mockMessages[conversationId];
  if (!rows) throw new Error('Không tìm thấy hội thoại.');

  const safeTake = Math.min(200, Math.max(1, Math.floor(take)));
  const filtered = beforeId
    ? rows.filter((message) => message.id < beforeId)
    : rows;

  return filtered.slice(-safeTake).map((message) => ({ ...message }));
}

export function createMockChatConversation(
  input: CreateConversationInput,
): ChatConversation {
  if (input.type === 0) {
    const contact = MOCK_CONTACTS.find((item) => item.id === input.recipientId);
    if (!contact) throw new Error('Không tìm thấy đồng nghiệp trong doanh nghiệp.');

    const existing = mockConversations.find(
      (entry) =>
        entry.conversation.type === 0 &&
        entry.conversation.otherUserId === contact.id,
    );
    if (existing) {
      existing.lastActivity = Date.now();
      return { ...existing.conversation };
    }

    const conversation: ChatConversation = {
      id: ++nextConversationId,
      title: contact.name,
      type: 0,
      otherUserId: contact.id,
    };
    mockConversations.unshift({ conversation, lastActivity: Date.now() });
    mockMessages[conversation.id] = [];
    return { ...conversation };
  }

  const title = input.title?.trim() ?? '';
  if (!title || title.length > 120) {
    throw new Error('Tên phòng chung phải từ 1 đến 120 ký tự.');
  }

  const conversation: ChatConversation = {
    id: ++nextConversationId,
    title,
    type: 1,
    otherUserId: null,
  };
  mockConversations.unshift({ conversation, lastActivity: Date.now() });
  mockMessages[conversation.id] = [];
  return { ...conversation };
}

export function sendMockChatMessage(
  conversationId: number,
  content: string,
): ChatMessage {
  const trimmed = content.trim();
  if (!trimmed || trimmed.length > 4000) {
    throw new Error('Tin nhắn phải từ 1 đến 4.000 ký tự.');
  }

  const entry = mockConversations.find(
    (item) => item.conversation.id === conversationId,
  );
  if (!entry) throw new Error('Không tìm thấy hội thoại.');

  const createdAtValue = Date.now();
  const message: ChatMessage = {
    id: ++nextMessageId,
    conversationId: String(conversationId),
    senderId: String(CURRENT_USER_ID),
    content: trimmed,
    created: new Date(createdAtValue).toISOString(),
    createdAtValue,
  };

  mockMessages[conversationId] = [
    ...(mockMessages[conversationId] ?? []),
    message,
  ];
  entry.lastActivity = createdAtValue;
  return { ...message };
}
