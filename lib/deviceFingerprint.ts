'use client';

/**
 * Device Fingerprint Utility
 * Generates a unique fingerprint for the current device/browser combination
 * This is used to identify trusted devices for OTP-less verification
 */

interface DeviceInfo {
  fingerprint: string;
  deviceName: string;
}

/**
 * Get browser and OS name for device identification
 */
function getDeviceName(): string {
  if (typeof navigator === 'undefined') {
    return 'Unknown Device';
  }

  const userAgent = navigator.userAgent;
  let browser = 'Unknown Browser';
  let os = 'Unknown OS';

  // Detect browser
  if (userAgent.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgent.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgent.includes('Chrome')) {
    browser = 'Chrome';
  } else if (userAgent.includes('Safari')) {
    browser = 'Safari';
  } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
    browser = 'Opera';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    os = 'macOS';
  } else if (userAgent.includes('iPhone')) {
    os = 'iPhone';
  } else if (userAgent.includes('iPad')) {
    os = 'iPad';
  } else if (userAgent.includes('Android')) {
    os = 'Android';
  } else if (userAgent.includes('Linux')) {
    os = 'Linux';
  }

  return `${browser} on ${os}`;
}

/**
 * Generate a hash from a string
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Collect device characteristics for fingerprinting
 */
function collectDeviceCharacteristics(): string {
  if (typeof window === 'undefined') {
    return 'ssr';
  }

  const characteristics: string[] = [];

  // Screen properties
  characteristics.push(`${screen.width}x${screen.height}`);
  characteristics.push(`${screen.colorDepth}`);
  characteristics.push(`${screen.pixelDepth}`);

  // Timezone
  characteristics.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  characteristics.push(navigator.language);

  // Platform
  characteristics.push(navigator.platform);

  // Hardware concurrency (number of CPU cores)
  if (navigator.hardwareConcurrency) {
    characteristics.push(`cores:${navigator.hardwareConcurrency}`);
  }

  // Device memory (if available)
  if ((navigator as Navigator & { deviceMemory?: number }).deviceMemory) {
    characteristics.push(`mem:${(navigator as Navigator & { deviceMemory?: number }).deviceMemory}`);
  }

  // Touch support
  characteristics.push(`touch:${navigator.maxTouchPoints || 0}`);

  // WebGL renderer (provides GPU info)
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        characteristics.push(renderer || 'no-renderer');
      }
    }
  } catch {
    // WebGL not available
    characteristics.push('no-webgl');
  }

  // User agent (partial for uniqueness)
  const ua = navigator.userAgent;
  characteristics.push(ua.slice(0, 100));

  return characteristics.join('|');
}

/**
 * Local storage key for device fingerprint
 */
const DEVICE_FINGERPRINT_KEY = 'resonance_device_fp';
const DEVICE_NAME_KEY = 'resonance_device_name';

/**
 * Generate or retrieve device fingerprint
 * The fingerprint is cached in localStorage for consistency
 */
export async function getDeviceFingerprint(): Promise<DeviceInfo> {
  if (typeof window === 'undefined') {
    return { fingerprint: '', deviceName: 'Server' };
  }

  // Check if we have a cached fingerprint
  const cachedFingerprint = localStorage.getItem(DEVICE_FINGERPRINT_KEY);
  const cachedDeviceName = localStorage.getItem(DEVICE_NAME_KEY);

  if (cachedFingerprint && cachedDeviceName) {
    return {
      fingerprint: cachedFingerprint,
      deviceName: cachedDeviceName,
    };
  }

  // Generate new fingerprint
  const characteristics = collectDeviceCharacteristics();
  
  // Add a random component for uniqueness (stored with the fingerprint)
  const randomComponent = crypto.randomUUID();
  const fullString = `${characteristics}|${randomComponent}`;
  
  const fingerprint = await hashString(fullString);
  const deviceName = getDeviceName();

  // Cache the fingerprint
  localStorage.setItem(DEVICE_FINGERPRINT_KEY, fingerprint);
  localStorage.setItem(DEVICE_NAME_KEY, deviceName);

  return { fingerprint, deviceName };
}

/**
 * Check if device fingerprint exists
 */
export function hasDeviceFingerprint(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return !!localStorage.getItem(DEVICE_FINGERPRINT_KEY);
}

/**
 * Clear device fingerprint (useful for logout or device untrust)
 */
export function clearDeviceFingerprint(): void {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(DEVICE_FINGERPRINT_KEY);
  localStorage.removeItem(DEVICE_NAME_KEY);
}

/**
 * Store trusted phone numbers for this device
 */
const TRUSTED_PHONES_KEY = 'resonance_trusted_phones';

export function getTrustedPhones(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const stored = localStorage.getItem(TRUSTED_PHONES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function addTrustedPhone(phone: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const phones = getTrustedPhones();
  const normalizedPhone = phone.replace(/\D/g, '');
  if (!phones.includes(normalizedPhone)) {
    phones.push(normalizedPhone);
    localStorage.setItem(TRUSTED_PHONES_KEY, JSON.stringify(phones));
  }
}

export function isPhoneTrustedLocally(phone: string): boolean {
  const normalizedPhone = phone.replace(/\D/g, '');
  return getTrustedPhones().includes(normalizedPhone);
}

export function removeTrustedPhone(phone: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  const phones = getTrustedPhones();
  const normalizedPhone = phone.replace(/\D/g, '');
  const filtered = phones.filter(p => p !== normalizedPhone);
  localStorage.setItem(TRUSTED_PHONES_KEY, JSON.stringify(filtered));
}
