import {
  HttpTransportType,
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { getAccessToken } from '@/services/api/client';
import { getSignalRHubUrl } from '@/services/api/signalr';

/**
 * Hub chat nội bộ: `{origin}/api/hubs/chat`, dùng đúng base API hiện tại
 * (đã bỏ `/api` hoặc `/api/dotnet` trước khi ghép đường dẫn hub).
 */
export function createChatHub(): HubConnection {
  const hubUrl = getSignalRHubUrl('chat');
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
