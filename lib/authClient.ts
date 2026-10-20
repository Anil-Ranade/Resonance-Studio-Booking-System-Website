/**
 * Client-side Authentication Utilities
 * 
 * Provides a method for checking authentication status from the client.
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

