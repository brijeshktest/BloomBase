'use client';

import { useState, useEffect } from 'react';
import { X, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { analyticsApi } from '@/lib/api';
import { getSessionId } from '@/utils/analytics';
import { saveVisitorInfo } from '@/utils/cookies';
import toast from 'react-hot-toast';

interface VisitorRegistrationModalProps {
  sellerAlias: string;
  onComplete: () => void;
  theme: {
    primary: string;
    background: string;
    textPrimary: string;
    textSecondary: string;
  };
}

export default function VisitorRegistrationModal({ 
  sellerAlias, 
  onComplete,
  theme 
}: VisitorRegistrationModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({ name: '', phone: '' });

  const handlePhoneChange = (value: string) => {
    // Remove all non-digit characters except +
    let cleaned = value.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +91
    if (!cleaned.startsWith('+91')) {
      if (cleaned.startsWith('91')) {
        cleaned = '+91' + cleaned.slice(2);
      } else if (cleaned.startsWith('+')) {
        cleaned = '+91' + cleaned.slice(1);
      } else {
        cleaned = '+91' + cleaned;
      }
    }
    
    // Limit to +91 followed by max 10 digits
    const digits = cleaned.slice(3);
    if (digits.length <= 10) {
      setPhone(cleaned);
      setErrors({ ...errors, phone: '' });
    }
  };

  const validate = () => {
    const newErrors = { name: '', phone: '' };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    if (!phone || phone === '+91' || phone.length < 13) {
      newErrors.phone = 'Valid phone number is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) {
      return;
    }

    setSubmitting(true);
    try {
      // Track visitor registration
      await analyticsApi.track({
        sellerAlias,
        eventType: 'visitor_registration',
        sessionId: getSessionId(),
        visitorName: name.trim(),
        visitorPhone: phone.trim(),
        metadata: {
          registrationTime: new Date().toISOString(),
          page: window.location.pathname
        }
      });

      // Store in cookies (persists across sessions) and sessionStorage (for backward compatibility)
      saveVisitorInfo(name.trim(), phone.trim(), 30); // 30 days expiration

      onComplete();
      toast.success('Welcome! You can now browse the store.');
    } catch (error) {
      console.error('Visitor registration error:', error);
      toast.error('Failed to register. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-300"
        style={{ backgroundColor: theme.background || '#ffffff' }}
      >
        <div className="text-center mb-6">
          <div 
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: theme.primary || '#0d9488' }}
          >
            <User className="text-white" size={32} />
          </div>
          <h2 
            className="text-2xl font-bold mb-2"
            style={{ color: theme.textPrimary || '#1f2937' }}
          >
            Welcome to Our Store!
          </h2>
          <p 
            className="text-sm"
            style={{ color: theme.textSecondary || '#6b7280' }}
          >
            Please provide your details to continue browsing
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textPrimary || '#1f2937' }}
            >
              Your Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setErrors({ ...errors, name: '' });
                }}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all ${
                  errors.name 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-zinc-200 focus:border-cyan-500 focus:ring-cyan-200'
                }`}
                placeholder="Enter your name"
                disabled={submitting}
                style={{ 
                  backgroundColor: theme.background || '#ffffff',
                  color: theme.textPrimary || '#1f2937'
                }}
              />
              {name && !errors.name && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
              )}
            </div>
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.name}
              </p>
            )}
          </div>

          <div>
            <label 
              className="block text-sm font-medium mb-2"
              style={{ color: theme.textPrimary || '#1f2937' }}
            >
              Phone Number <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span 
                className="absolute left-4 top-1/2 transform -translate-y-1/2 text-zinc-600 font-medium pointer-events-none z-10"
              >
                +91
              </span>
              <input
                type="tel"
                value={phone.startsWith('+91') ? phone.slice(3) : phone} // Remove +91 from displayed value
                onChange={(e) => {
                  const value = '+91' + e.target.value.replace(/\D/g, '').slice(0, 10);
                  handlePhoneChange(value);
                }}
                className={`w-full pl-20 pr-4 py-3 rounded-xl border-2 focus:outline-none focus:ring-2 transition-all ${
                  errors.phone 
                    ? 'border-red-500 focus:ring-red-200' 
                    : 'border-zinc-200 focus:border-cyan-500 focus:ring-cyan-200'
                }`}
                placeholder="Enter your phone number"
                disabled={submitting}
                maxLength={10}
                style={{ 
                  backgroundColor: theme.background || '#ffffff',
                  color: theme.textPrimary || '#1f2937'
                }}
              />
              {phone && phone.length === 13 && !errors.phone && (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500" size={20} />
              )}
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertCircle size={12} />
                {errors.phone}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: theme.primary || '#0d9488' }}
          >
            {submitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle size={20} />
                Continue Browsing
              </>
            )}
          </button>
        </form>

        <p 
          className="text-xs text-center mt-4"
          style={{ color: theme.textSecondary || '#9ca3af' }}
        >
          Your information is secure and will only be used to improve your shopping experience
        </p>
      </div>
    </div>
  );
}
