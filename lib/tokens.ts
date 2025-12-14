/**
 * Token Utilities for Secure Authentication
 * 
 * This module provides utilities for generating and verifying
 * access tokens and refresh tokens using JWT.
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Token expiry configuration
export const ACCESS_TOKEN_EXPIRY = '15m'; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_DAYS = 60; // 60 days
export const REFRESH_TOKEN_EXPIRY = `${REFRESH_TOKEN_EXPIRY_DAYS}d`;

// Cookie configuration
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
};

export const ACCESS_TOKEN_COOKIE = 'resonance_access_token';
export const REFRESH_TOKEN_COOKIE = 'resonance_refresh_token';

interface TokenPayload {
  phone: string;
  type: 'access' | 'refresh';
  iat: number;
  deviceFingerprint?: string;
}

/**
 * Get JWT secret for access tokens
 */
function getAccessTokenSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not configured');
  }
  return secret;
}

/**
 * Get JWT secret for refresh tokens
 */
function getRefreshTokenSecret(): string {
  const secret = process.env.REFRESH_TOKEN_SECRET;
  if (!secret) {
    // Fall back to JWT_SECRET + suffix if REFRESH_TOKEN_SECRET not set
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('Neither REFRESH_TOKEN_SECRET nor JWT_SECRET environment variable is configured');
    }
    return jwtSecret + '_refresh';
  }
  return secret;
}

/**
 * Generate an access token for a user
 */
export function generateAccessToken(phone: string): string {
  return jwt.sign(
    {
      phone,
      type: 'access',
      iat: Math.floor(Date.now() / 1000),
    },
    getAccessTokenSecret(),
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

/**
 * Generate a refresh token for a user
 */
export function generateRefreshToken(phone: string, deviceFingerprint?: string): string {
  return jwt.sign(
    {
      phone,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000),
      deviceFingerprint,
    },
    getRefreshTokenSecret(),
    { expiresIn: REFRESH_TOKEN_EXPIRY }
  );
}

/**
 * Verify an access token and return the payload
 */
export function verifyAccessToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, getAccessTokenSecret()) as TokenPayload;
    if (payload.type !== 'access') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify a refresh token and return the payload
 */
export function verifyRefreshToken(token: string): TokenPayload | null {
  try {
    const payload = jwt.verify(token, getRefreshTokenSecret()) as TokenPayload;
    if (payload.type !== 'refresh') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

/**
 * Hash a refresh token for secure storage in database
 * Using SHA-256 for consistent, fast hashing (we're not storing passwords, just token identifiers)
 */
export function hashRefreshToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Calculate refresh token expiry date
 */
export function getRefreshTokenExpiryDate(): Date {
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + REFRESH_TOKEN_EXPIRY_DAYS);
  return expiryDate;
}

/**
 * Parse cookies from request headers
 */
export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });
  
  return cookies;
}

/**
 * Create Set-Cookie header value for a token
 */
export function createCookieHeader(
  name: string,
  value: string,
  maxAgeSeconds: number
): string {
  const parts = [
    `${name}=${value}`,
    `Max-Age=${maxAgeSeconds}`,
    `Path=${COOKIE_OPTIONS.path}`,
    'HttpOnly',
    `SameSite=${COOKIE_OPTIONS.sameSite}`,
  ];
  
  if (COOKIE_OPTIONS.secure) {
    parts.push('Secure');
  }
  
  return parts.join('; ');
}

/**
 * Create Set-Cookie header to clear a cookie
 */
export function createClearCookieHeader(name: string): string {
  return `${name}=; Max-Age=0; Path=${COOKIE_OPTIONS.path}; HttpOnly; SameSite=${COOKIE_OPTIONS.sameSite}${COOKIE_OPTIONS.secure ? '; Secure' : ''}`;
}

/**
 * Access token max age in seconds (15 minutes)
 */
export const ACCESS_TOKEN_MAX_AGE = 15 * 60;

/**
 * Refresh token max age in seconds (60 days)
 */
export const REFRESH_TOKEN_MAX_AGE = REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60;
