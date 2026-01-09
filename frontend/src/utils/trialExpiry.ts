/**
 * Utility functions for checking trial/validity expiration
 */

export interface TrialStatus {
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number;
  expiryDate: Date | null;
}

/**
 * Check if seller's trial/validity has expired or is expiring soon
 */
export function checkTrialStatus(trialEndsAt?: string | Date | null): TrialStatus {
  if (!trialEndsAt) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      daysRemaining: Infinity,
      expiryDate: null
    };
  }

  const expiryDate = new Date(trialEndsAt);
  const now = new Date();
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    isExpired: diffDays < 0,
    isExpiringSoon: diffDays >= 0 && diffDays <= 7, // Expiring within 7 days
    daysRemaining: diffDays,
    expiryDate: expiryDate
  };
}

/**
 * Format expiry date for display
 */
export function formatExpiryDate(date: Date | null): string {
  if (!date) return 'N/A';
  
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}
