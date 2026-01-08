'use client';

import { useState } from 'react';
import { Share2, Copy, Check, X, MessageCircle, Facebook, Instagram, Twitter } from 'lucide-react';
import toast from 'react-hot-toast';
import { Product } from '@/types';

interface ShareProductButtonProps {
  product: Product;
  sellerAlias: string;
  variant?: 'button' | 'icon';
  className?: string;
  textColor?: string;
  backgroundColor?: string;
}

export default function ShareProductButton({
  product,
  sellerAlias,
  variant = 'button',
  className = '',
  textColor,
  backgroundColor,
}: ShareProductButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const productUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/store/${sellerAlias}/product/${product.slug}`
    : '';
  
  const shareText = `Check out ${product.name} - ₹${product.basePrice}${product.hasPromotion && product.discountedPrice ? ` (Now ₹${product.discountedPrice})` : ''} at ${sellerAlias} store!`;
  const fullShareText = `${shareText}\n\n${productUrl}`;

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: MessageCircle,
      color: '#25D366',
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(fullShareText)}`;
        window.open(url, '_blank');
        setShowMenu(false);
        toast.success('Opening WhatsApp...');
      },
    },
    {
      name: 'Facebook',
      icon: Facebook,
      color: '#1877F2',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(shareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
        setShowMenu(false);
        toast.success('Opening Facebook...');
      },
    },
    {
      name: 'Instagram',
      icon: Instagram,
      color: '#E4405F',
      action: () => {
        // Instagram doesn't support direct URL sharing, so copy link
        navigator.clipboard.writeText(productUrl);
        setCopied(true);
        setShowMenu(false);
        toast.success('Link copied! Paste it in your Instagram story or post.');
        setTimeout(() => setCopied(false), 2000);
      },
    },
    {
      name: 'Twitter',
      icon: Twitter,
      color: '#1DA1F2',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(fullShareText)}`;
        window.open(url, '_blank', 'width=600,height=400');
        setShowMenu(false);
        toast.success('Opening Twitter...');
      },
    },
  ];

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      setCopied(true);
      setShowMenu(false);
      toast.success('Product link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: shareText,
          url: productUrl,
        });
        setShowMenu(false);
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error);
        }
      }
    } else {
      // Fallback to copy if native share not available
      handleCopyLink();
    }
  };

  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`p-2 rounded-lg transition-colors ${className}`}
          style={{ 
            backgroundColor: backgroundColor || 'rgba(0,0,0,0.05)',
            color: textColor || '#18181b'
          }}
          aria-label="Share Product"
        >
          <Share2 size={20} />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-zinc-200 z-50 py-2">
              <div className="px-4 py-2 border-b border-zinc-100">
                <p className="text-sm font-semibold text-zinc-900">Share Product</p>
              </div>
              <div className="py-2">
                {shareOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <button
                      key={option.name}
                      onClick={option.action}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 transition-colors text-left"
                    >
                      <Icon size={20} style={{ color: option.color }} />
                      <span className="text-sm text-zinc-700">{option.name}</span>
                    </button>
                  );
                })}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 transition-colors text-left"
                >
                  {copied ? (
                    <>
                      <Check size={20} className="text-green-600" />
                      <span className="text-sm text-zinc-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={20} className="text-zinc-600" />
                      <span className="text-sm text-zinc-700">Copy Link</span>
                    </>
                  )}
                </button>
                {navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-50 transition-colors text-left"
                  >
                    <Share2 size={20} className="text-zinc-600" />
                    <span className="text-sm text-zinc-700">More Options</span>
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${className}`}
        style={{
          backgroundColor: backgroundColor || '#0891b2',
          color: textColor || '#ffffff',
        }}
      >
        <Share2 size={18} />
        <span>Share Product</span>
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-zinc-200 z-50 py-2">
            <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900">Share Product</p>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 hover:bg-zinc-100 rounded transition-colors"
              >
                <X size={16} className="text-zinc-600" />
              </button>
            </div>
            <div className="py-2">
              {shareOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.name}
                    onClick={option.action}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left"
                  >
                    <Icon size={20} style={{ color: option.color }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900">{option.name}</p>
                      <p className="text-xs text-zinc-500">Share on {option.name}</p>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-t border-zinc-100 mt-2"
              >
                {copied ? (
                  <>
                    <Check size={20} className="text-green-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-green-600">Link Copied!</p>
                    </div>
                  </>
                ) : (
                  <>
                    <Copy size={20} className="text-zinc-600" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-zinc-900">Copy Link</p>
                      <p className="text-xs text-zinc-500">Copy to clipboard</p>
                    </div>
                  </>
                )}
              </button>
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors text-left border-t border-zinc-100"
                >
                  <Share2 size={20} className="text-zinc-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-zinc-900">More Options</p>
                    <p className="text-xs text-zinc-500">Use device share</p>
                  </div>
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
