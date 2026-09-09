const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; errors?: string[] }> {
  const token = localStorage.getItem('admin_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error(data.message || `Request failed with status ${res.status}`);
    }

    return data;
  } catch (err: any) {
    throw new Error(err.message || 'Network error, please try again.');
  }
}

export { API_BASE_URL };
