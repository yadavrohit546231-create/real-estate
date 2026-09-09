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

export async function mobileUploadImage(
  uri: string,
  assetName?: string,
  assetMimeType?: string,
  base64?: string
): Promise<string> {
  let filename = assetName || uri.split('/').pop() || `photo_${Date.now()}.jpg`;
  filename = filename.split('?')[0];

  let type = assetMimeType;
  if (!type || type === 'image') {
    const match = /\.(\w+)$/.exec(filename);
    const ext = match ? match[1].toLowerCase() : 'jpg';
    if (ext === 'jpg' || ext === 'jpeg') {
      type = 'image/jpeg';
    } else if (ext === 'png') {
      type = 'image/png';
    } else if (ext === 'webp') {
      type = 'image/webp';
    } else if (ext === 'heic') {
      type = 'image/heic';
    } else {
      type = 'image/jpeg';
    }
  }

  if (!filename.includes('.')) {
    const extPart = type.split('/')[1] || 'jpg';
    filename = `${filename}.${extPart === 'jpeg' ? 'jpg' : extPart}`;
  }

  const uploadUrl = `${API_URL}/upload`;

  // Strategy 1: Direct JSON base64 upload if provided by ImagePicker (immune to all FormData bugs)
  if (base64) {
    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          base64,
          fileName: filename,
          mimeType: type,
        }),
      });

      const json = await response.json();
      if (response.ok && json.success) {
        return resolveImageUrl(json.data.url);
      }
    } catch (base64Err) {
      console.warn('Direct base64 upload failed, trying blob conversion:', base64Err);
    }
  }

  // Strategy 2: Convert local URI to Base64 via FileReader to bypass React Native FormData bugs
  try {
    const blobResponse = await fetch(uri);
    const blob = await blobResponse.blob();

    const base64FromBlob = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const resStr = reader.result as string;
        const b64 = resStr.includes(',') ? resStr.split(',')[1] : resStr;
        resolve(b64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({
        base64: base64FromBlob,
        fileName: filename,
        mimeType: type,
      }),
    });

    const json = await response.json();
    if (response.ok && json.success) {
      return resolveImageUrl(json.data.url);
    }
  } catch (convErr) {
    console.warn('Blob to Base64 conversion failed, falling back to RN FormData:', convErr);
  }

  // Strategy 3: RN object fallback
  try {
    const fallbackFormData = new FormData();
    fallbackFormData.append('file', {
      uri,
      name: filename,
      type,
    } as any);

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: fallbackFormData,
      headers: {
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
    });

    const json = await response.json();
    if (!response.ok || !json.success) {
      throw new Error(json.message || 'Image upload failed');
    }

    return resolveImageUrl(json.data.url);
  } catch (err: any) {
    throw new Error(err.message || 'Could not upload photo from device.');
  }
}

