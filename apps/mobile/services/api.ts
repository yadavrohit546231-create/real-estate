import { Platform } from 'react-native';
import Constants from 'expo-constants';

function getBaseApiUrl(): string {
  // If an explicit non-localhost URL is provided via env, use it
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // Auto-detect computer host from Expo development server
  // hostUri typically looks like "192.168.1.23:8081"
  const hostUri =
    Constants.expoConfig?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host) {
      return `http://${host}:5000/api`;
    }
  }

  // Fallback for Android emulator
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  // Fallback for physical devices on the local network
  return 'http://192.168.1.23:5000/api';
}

export const API_URL = getBaseApiUrl();

let authToken: string | null = null;

export function setApiAuthToken(token: string | null) {
  authToken = token;
}

export async function mobileApi<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: string[] }> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_URL}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || `Request failed with status ${res.status}`);
    }

    return json;
  } catch (err: any) {
    throw new Error(err.message || 'Network error: could not connect to server.');
  }
}

export function resolveImageUrl(url?: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const serverOrigin = API_URL.replace(/\/api\/?$/, '');
  return `${serverOrigin}${url.startsWith('/') ? '' : '/'}${url}`;
}

export async function mobileUploadImage(uri: string): Promise<string> {
  const filename = uri.split('/').pop() || `photo_${Date.now()}.jpg`;
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1].toLowerCase()}` : `image/jpeg`;

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: filename,
    type,
  } as any);

  const url = `${API_URL}/upload`;
  const headers: Record<string, string> = {};
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });

  const json = await response.json();
  if (!response.ok || !json.success) {
    throw new Error(json.message || 'Image upload failed');
  }

  return resolveImageUrl(json.data.url);
}

