'use client';

import { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { adminApi } from '@/lib/api';

export default function WhatsAppChatButton() {
  const [adminWhatsApp, setAdminWhatsApp] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAdminContact = async () => {
      try {
        const response = await adminApi.getContactInfo();
        if (response.data?.whatsapp) {
          setAdminWhatsApp(response.data.whatsapp);
        }
      } catch (error) {
        console.error('Failed to fetch admin contact:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdminContact();
  }, []);

  const handleClick = () => {
    if (!adminWhatsApp) {
      // Fallback: open WhatsApp with a generic message
      const message = encodeURIComponent('Hello! I would like to know more about SellLocal Online.');
      window.open(`https://wa.me/?text=${message}`, '_blank');
      return;
    }

    // Format phone number (remove + and spaces)
    const phoneNumber = adminWhatsApp.replace(/\+/g, '').replace(/\s/g, '');
    
    // Pre-filled message
    const message = encodeURIComponent(
      'Hello! I would like to know more about SellLocal Online and how to list my products.'
    );
    
    // Open WhatsApp
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return null; // Don't show button while loading
  }

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full p-4 shadow-2xl hover:shadow-[#25D366]/50 transition-all duration-300 hover:scale-110 group animate-bounce-subtle"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
    >
      <MessageCircle className="w-6 h-6 relative z-10" />
      
      {/* Pulse animation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
      
      {/* Tooltip on hover */}
      <div className="absolute bottom-full right-0 mb-3 hidden group-hover:block bg-zinc-900 text-white text-sm rounded-lg px-4 py-2 whitespace-nowrap shadow-xl animate-fade-in">
        Chat with us on WhatsApp
        <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900"></div>
      </div>
    </button>
  );
}
