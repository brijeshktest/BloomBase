'use client';

import { AlertCircle, MessageCircle, X } from 'lucide-react';
import { useState } from 'react';
import { checkTrialStatus, formatExpiryDate } from '@/utils/trialExpiry';

interface TrialExpiredNotificationProps {
  trialEndsAt?: string | Date | null;
  businessName?: string;
  sellerName?: string;
  adminWhatsApp?: string; // Admin WhatsApp number (e.g., "+919876543210")
  onDismiss?: () => void;
  variant?: 'portal' | 'microsite';
}

export default function TrialExpiredNotification({
  trialEndsAt,
  businessName,
  sellerName,
  adminWhatsApp,
  onDismiss,
  variant = 'portal'
}: TrialExpiredNotificationProps) {
  const [dismissed, setDismissed] = useState(false);
  const trialStatus = checkTrialStatus(trialEndsAt);

  if (dismissed || (!trialStatus.isExpired && !trialStatus.isExpiringSoon)) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  const handleContactAdmin = () => {
    if (!adminWhatsApp) {
      // Fallback: open WhatsApp with a generic message
      const message = encodeURIComponent(
        `Hi, I need to renew my subscription for my seller account${businessName ? ` "${businessName}"` : ''}. Please help me extend my validity.`
      );
      window.open(`https://wa.me/?text=${message}`, '_blank');
      return;
    }

    // Format phone number (remove + and spaces)
    const phoneNumber = adminWhatsApp.replace(/\+/g, '').replace(/\s/g, '');
    const message = encodeURIComponent(
      `Hi, I need to renew my subscription for my seller account${businessName ? ` "${businessName}"` : ''}${sellerName ? ` (${sellerName})` : ''}.\n\nMy trial/validity has ${trialStatus.isExpired ? 'expired' : `expired on ${formatExpiryDate(trialStatus.expiryDate)}`}.\n\nPlease help me extend my validity.`
    );
    
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  if (variant === 'microsite') {
    return (
      <div className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1">
              <AlertCircle size={20} className="text-white flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm sm:text-base">
                  {trialStatus.isExpired 
                    ? 'Your subscription has expired'
                    : `Your subscription expires in ${trialStatus.daysRemaining} day${trialStatus.daysRemaining !== 1 ? 's' : ''}`
                  }
                </p>
                <p className="text-white/90 text-xs sm:text-sm mt-0.5">
                  Contact admin to renew your subscription
                </p>
              </div>
            </div>
            <button
              onClick={handleContactAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-white text-orange-600 rounded-lg font-semibold hover:bg-orange-50 transition-colors whitespace-nowrap text-sm sm:text-base"
            >
              <MessageCircle size={18} />
              <span className="hidden sm:inline">Contact Admin</span>
              <span className="sm:hidden">Contact</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Portal variant
  return (
    <div className="bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 border-l-4 border-red-500 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-900 font-semibold text-base mb-1">
              {trialStatus.isExpired 
                ? 'Subscription Expired'
                : `Subscription Expiring Soon (${trialStatus.daysRemaining} day${trialStatus.daysRemaining !== 1 ? 's' : ''} remaining)`
              }
            </h3>
            <p className="text-red-700 text-sm mb-3">
              {trialStatus.isExpired 
                ? `Your trial/validity expired on ${formatExpiryDate(trialStatus.expiryDate)}. Please contact admin to renew your subscription.`
                : `Your trial/validity will expire on ${formatExpiryDate(trialStatus.expiryDate)}. Contact admin to renew before it expires.`
              }
            </p>
            <button
              onClick={handleContactAdmin}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              <MessageCircle size={18} />
              Contact Admin on WhatsApp
            </button>
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={handleDismiss}
            className="p-1 rounded-lg hover:bg-red-100 text-red-600 transition-colors flex-shrink-0"
            aria-label="Dismiss notification"
          >
            <X size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
