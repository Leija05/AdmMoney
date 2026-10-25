import { getApiHost } from '../services/api';
import { APP_CONFIG } from '../config/appConfig';

/**
 * Resolves any image URL (local file://, content://, base64, or backend relative path /uploads/...)
 * into a fully-qualified URI that React Native Image can display on both Android and iOS.
 */
export function resolveReceiptImageUrl(
  url?: string | null,
  customBackendUrl?: string | null
): string | null {
  if (!url) return null;
  const trimmed = String(url).trim();
  if (!trimmed) return null;

  // Already an absolute URL, base64, or local file scheme
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('file://') ||
    trimmed.startsWith('content://') ||
    trimmed.startsWith('data:')
  ) {
    return trimmed;
  }

  // Determine backend base url without /api suffix
  let rawHost = customBackendUrl || getApiHost() || APP_CONFIG.DEFAULT_API_HOST;
  if (!rawHost) {
    rawHost = 'https://admmoney-backend.onrender.com';
  }
  const base = rawHost.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${base}${cleanPath}`;
}
