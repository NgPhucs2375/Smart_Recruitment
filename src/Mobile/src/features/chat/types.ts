/** Khớp contract PascalCase của ChatController (Application.Wrappers.Response). */
export type ChatContext = {
  CurrentUserId: number;
  CompanyId: number | null;
  CanCreate: boolean;
  CanSend: boolean;
};

export type ChatContact = {
  Id: number;
  Name: string;
  Role: string;
};

export type ChatConversation = {
  Id: number;
  Title: string;
  /** 0 = Direct, 1 = Group (Domain.Enums.TypeConversation) */
  Type: number;
  OtherUserId: number | null;
};

export type ChatMessage = {
  Id: number;
  ConversationId: string;
  SenderId: string;
  Content: string;
  Created: string;
};

export type ConversationKind = 'company' | 'direct';

export type ConnectionState = 'offline' | 'connecting' | 'online';

export const TYPE_DIRECT = 0;
export const TYPE_GROUP = 1;
