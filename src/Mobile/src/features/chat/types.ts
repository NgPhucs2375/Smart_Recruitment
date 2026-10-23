export type ChatConversationType = 0 | 1;

export type ChatContext = {
  currentUserId: number;
  companyId: number;
  canCreate: boolean;
  canSend: boolean;
};

export type ChatContact = {
  id: number;
  name: string;
  role: string;
};

export type ChatConversation = {
  id: number;
  title: string;
  type: ChatConversationType;
  otherUserId: number | null;
};

export type ChatMessage = {
  id: number;
  conversationId: string;
  senderId: string;
  content: string;
  created: string;
  createdAtValue: number;
};

export type CreateConversationInput = {
  type: ChatConversationType;
  title?: string;
  recipientId?: number;
};

export type ChatMessagesPage = {
  messages: ChatMessage[];
};
