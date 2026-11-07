import {
  HttpTransportType,
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { getAccessToken } from '@/services/api/client';
import { getSignalRHubUrl } from '@/services/api/signalr';

/**
 * Mobile thường gọi REST qua Next proxy nhưng SignalR hub phải đi thẳng backend;
 * cho phép cấu hình URL hub riêng, nếu không sẽ suy ra từ API base như trước.
 */
export function createChatHub(): HubConnection {
  const hubUrl = getSignalRHubUrl('chat', process.env.EXPO_PUBLIC_CHAT_SIGNALR_URL);
  if (!hubUrl) {
    throw new Error('Chưa cấu hình địa chỉ API để kết nối chat.');
  }

  return new HubConnectionBuilder()
    .withUrl(hubUrl, {
      accessTokenFactory: () => getAccessToken().then((token) => token ?? ''),
      transport: HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
