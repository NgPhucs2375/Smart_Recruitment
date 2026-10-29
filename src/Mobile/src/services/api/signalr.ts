import { getApiBaseUrl } from './client';

export function getSignalRHubUrl(
  hubName: string,
  explicitUrl?: string | null,
): string | null {
  const explicit = explicitUrl?.trim();
  if (explicit) return explicit;

  const apiBase = getApiBaseUrl();
  if (!apiBase) return null;

  try {
    const url = new URL(apiBase);
    let path = url.pathname.replace(/\/+$/, '');
    const suffix = ['/api/dotnet', '/api'].find((item) => path.endsWith(item));
    if (!suffix) return null;
    path = path.slice(0, -suffix.length);
    return `${url.origin}${path}/api/hubs/${hubName}`;
  } catch {
    return null;
  }
}
