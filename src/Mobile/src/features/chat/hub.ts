import {
  HttpTransportType,
  HubConnectionBuilder,
  LogLevel,
  type HubConnection,
} from '@microsoft/signalr';

import { getWebOrigin } from '@/features/cv/preview-url';
import { getAccessToken } from '@/services/api/client';

/**
 * Hub chat nội bộ: `{webOrigin}/api/hubs/chat` (Next proxy route
 * `app/api/hubs/[...path]`). LongPolling như Web — tránh WebSocket upgrade
 * trên Android emulator.
 */
export function createChatHub(): HubConnection {
  return new HubConnectionBuilder()
    .withUrl(`${getWebOrigin()}/api/hubs/chat`, {
      accessTokenFactory: () => getAccessToken().then((token) => token ?? ''),
      transport: HttpTransportType.LongPolling,
    })
    .withAutomaticReconnect()
    .configureLogging(LogLevel.Warning)
    .build();
}
