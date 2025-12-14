/**
 * Client-side Authentication Utilities
 * 
 * Provides methods for checking authentication status,
 * logging out, and refreshing tokens from the client.
 */

'use client';

interface AuthStatus {
  authenticated: boolean;
  user?: {
    phone: string;
    name: string;
    email: string;
  };
  deviceName?: string;
}

/**
 * Check if the current user is authenticated
 * This calls the auto-login API which checks cookies on the server
 */
export async function checkAuthStatus(): Promise<AuthStatus> {
  try {
    const response = await fetch('/api/auth/status', {
      method: 'GET',
      credentials: 'include', // Important: include cookies
    });

    if (response.ok) {
      const data = await response.json();
      return {
        authenticated: data.authenticated,
        user: data.user,
        deviceName: data.deviceName,
      };
    }

    return { authenticated: false };
  } catch (error) {
    console.error('[Auth Client] Failed to check auth status:', error);
    return { authenticated: false };
  }
}

/**
 * Attempt to refresh the access token using the refresh token
 * This is called when an API request returns 401
 */
export async function refreshAuth(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      credentials: 'include', // Important: include cookies
    });

    return response.ok;
  } catch (error) {
    console.error('[Auth Client] Failed to refresh auth:', error);
    return false;
  }
}

/**
 * Log out the current user
 * This clears the authentication cookies and revokes the refresh token
 */
export async function logout(): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include', // Important: include cookies
    });

    return response.ok;
  } catch (error) {
    console.error('[Auth Client] Failed to logout:', error);
    return false;
  }
}

/**
 * Make an authenticated API request with automatic token refresh
 * If the request fails with 401, attempts to refresh the token and retry
 */
export async function authenticatedFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include', // Always include cookies
  };

  let response = await fetch(url, fetchOptions);

  // If unauthorized, try to refresh and retry
  if (response.status === 401) {
    const refreshed = await refreshAuth();
    if (refreshed) {
      // Retry the original request
      response = await fetch(url, fetchOptions);
    }
  }

  return response;
}
