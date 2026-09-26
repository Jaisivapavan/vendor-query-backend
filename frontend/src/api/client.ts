const API_BASE = '';

export function getAuthToken(): string {
  return localStorage.getItem('vendorquery_token') || '';
}

export function setAuthToken(token: string): void {
  localStorage.setItem('vendorquery_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('vendorquery_token');
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string; pagination?: any }> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    return {
      success: false,
      error: json.error || `HTTP error ${response.status}`,
    };
  }

  return json;
}
