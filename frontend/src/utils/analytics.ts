// Analytics tracking utility
let sessionId: string | null = null;

export function getSessionId(): string {
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('bloombase_session_id', sessionId);
    }
  }
  return sessionId;
}

export function loadSessionId(): void {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('bloombase_session_id');
    if (stored) {
      sessionId = stored;
    }
  }
}

export function trackEvent(
  sellerAlias: string,
  eventType: string,
  options?: {
    productId?: string;
    buyerId?: string;
    page?: string;
    metadata?: Record<string, unknown>;
  }
): void {
  if (typeof window === 'undefined') return;
  
  const { analyticsApi } = require('@/lib/api');
  
  analyticsApi.track({
    sellerAlias,
    eventType,
    sessionId: getSessionId(),
    buyerId: options?.buyerId,
    productId: options?.productId,
    page: options?.page || window.location.pathname,
    metadata: options?.metadata || {},
  }).catch((error: unknown) => {
    console.error('Analytics tracking failed:', error);
  });
}

// Initialize session ID when module loads
if (typeof window !== 'undefined') {
  loadSessionId();
}
