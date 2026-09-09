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
