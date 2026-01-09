'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { broadcastApi } from '@/lib/api';
import Link from 'next/link';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function UnsubscribePage() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'not_found'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      handleUnsubscribe(token);
    } else {
      setStatus('not_found');
      setMessage('Invalid unsubscribe link. Please contact the seller directly.');
    }
  }, [token]);

  const handleUnsubscribe = async (unsubscribeToken: string) => {
    try {
      await broadcastApi.unsubscribe({ token: unsubscribeToken });
      setStatus('success');
      setMessage('You have been successfully unsubscribed from updates. You will no longer receive broadcast messages.');
    } catch (error: any) {
      if (error.response?.status === 404) {
        setStatus('not_found');
        setMessage('Unsubscribe link not found or already used.');
      } else {
        setStatus('error');
        setMessage('An error occurred. Please try again or contact the seller directly.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-blue-600 animate-pulse" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Unsubscribing...</h1>
            <p className="text-zinc-600">Please wait</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="text-green-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Unsubscribed Successfully</h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors"
            >
              Go to Home
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="text-red-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Error</h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors"
            >
              Go to Home
            </Link>
          </>
        )}

        {status === 'not_found' && (
          <>
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-amber-600" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-zinc-900 mb-2">Invalid Link</h1>
            <p className="text-zinc-600 mb-6">{message}</p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-cyan-600 text-white rounded-xl font-semibold hover:bg-cyan-700 transition-colors"
            >
              Go to Home
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
