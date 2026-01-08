/**
 * Cookie utility functions for storing visitor information
 */

/**
 * Set a cookie with expiration
 */
export function setCookie(name: string, value: string, days: number = 30): void {
  if (typeof window === 'undefined') return;
  
  const date = new Date();
  date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
  const expires = `expires=${date.toUTCString()}`;
  document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`;
}

/**
 * Get a cookie value
 */
export function getCookie(name: string): string | null {
  if (typeof window === 'undefined') return null;
  
  const nameEQ = `${name}=`;
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
}

/**
 * Delete a cookie
 */
export function deleteCookie(name: string): void {
  if (typeof window === 'undefined') return;
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

/**
 * Check if visitor is registered (checks both cookies and sessionStorage for backward compatibility)
 */
export function isVisitorRegistered(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Check cookie first (persistent)
  const cookieRegistered = getCookie('selllocalonline_visitor_registered') === 'true';
  if (cookieRegistered) return true;
  
  // Fall back to sessionStorage (for backward compatibility)
  return sessionStorage.getItem('selllocalonline_visitor_registered') === 'true';
}

/**
 * Get visitor name (checks both cookies and sessionStorage)
 */
export function getVisitorName(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check cookie first
  const cookieName = getCookie('selllocalonline_visitor_name');
  if (cookieName) return cookieName;
  
  // Fall back to sessionStorage
  return sessionStorage.getItem('selllocalonline_visitor_name');
}

/**
 * Get visitor phone (checks both cookies and sessionStorage)
 */
export function getVisitorPhone(): string | null {
  if (typeof window === 'undefined') return null;
  
  // Check cookie first
  const cookiePhone = getCookie('selllocalonline_visitor_phone');
  if (cookiePhone) return cookiePhone;
  
  // Fall back to sessionStorage
  return sessionStorage.getItem('selllocalonline_visitor_phone');
}

/**
 * Save visitor information to both cookies and sessionStorage
 */
export function saveVisitorInfo(name: string, phone: string, days: number = 30): void {
  if (typeof window === 'undefined') return;
  
  // Save to cookies (persistent, 30 days default)
  setCookie('selllocalonline_visitor_registered', 'true', days);
  setCookie('selllocalonline_visitor_name', name, days);
  setCookie('selllocalonline_visitor_phone', phone, days);
  
  // Also save to sessionStorage for backward compatibility
  sessionStorage.setItem('selllocalonline_visitor_registered', 'true');
  sessionStorage.setItem('selllocalonline_visitor_name', name);
  sessionStorage.setItem('selllocalonline_visitor_phone', phone);
}
