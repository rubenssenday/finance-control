export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Attach active account ID & Accept-Language from localStorage if available in browser
  if (typeof window !== 'undefined') {
    const activeAccountId = localStorage.getItem('active_account_id');
    if (activeAccountId && !headers['X-Account-Id']) {
      headers['X-Account-Id'] = activeAccountId;
    }

    if (!headers['Accept-Language']) {
      const activeLocale = localStorage.getItem('financial_control_locale') || 'pt-BR';
      headers['Accept-Language'] = activeLocale;
    }
  }

  const config: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Automatically sends HttpOnly cookies
  };

  try {
    const response = await fetch(url, config);

    // If 401 Unauthorized and not already refreshing, attempt refresh token rotation
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/register') && !endpoint.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise<T>((resolve, reject) => {
          failedQueue.push({ resolve: () => resolve(apiClient<T>(endpoint, options)), reject });
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
        });

        if (refreshRes.ok) {
          processQueue(null);
          return await apiClient<T>(endpoint, options);
        } else {
          processQueue(new Error('Session expired'));
          if (
            typeof window !== 'undefined' &&
            !window.location.pathname.startsWith('/login') &&
            !window.location.pathname.startsWith('/register')
          ) {
            window.location.href = '/login';
          }
          throw new Error('Session expired. Please log in again.');
        }
      } catch (refreshErr) {
        processQueue(refreshErr);
        if (
          typeof window !== 'undefined' &&
          !window.location.pathname.startsWith('/login') &&
          !window.location.pathname.startsWith('/register')
        ) {
          window.location.href = '/login';
        }
        throw refreshErr;
      } finally {
        isRefreshing = false;
      }
    }

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'An error occurred during API request.');
    }

    return data;
  } catch (error: any) {
    throw error;
  }
}
