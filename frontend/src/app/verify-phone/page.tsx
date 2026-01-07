'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authApi } from '@/lib/api';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function VerifyPhonePage() {
  const params = useSearchParams();
  const token = params?.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your WhatsApp number...');

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Missing verification token.');
        return;
      }

      try {
        const res = await authApi.verifyPhone(token);
        setStatus('success');
        setMessage(res.data?.message || 'WhatsApp number verified successfully.');
      } catch (e: unknown) {
        const err = e as { response?: { data?: { message?: string } } };
        setStatus('error');
        setMessage(err.response?.data?.message || 'Verification link is invalid or expired.');
      }
    };

    run();
  }, [token]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-zinc-100 to-zinc-200">
      <Header />
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 text-center">
          <div
            className={`w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-4 ${
              status === 'success'
                ? 'bg-emerald-100 text-emerald-700'
                : status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-cyan-100 text-cyan-700'
            }`}
          >
            {status === 'success' ? '✓' : status === 'error' ? '!' : '…'}
          </div>
          <h1 className="text-2xl font-bold text-zinc-900">WhatsApp Verification</h1>
          <p className="text-zinc-600 mt-3">{message}</p>

          {status === 'success' && (
            <p className="text-sm text-zinc-500 mt-4">
              Your number is now verified. The admin can approve your seller account.
            </p>
          )}

          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/login" className="btn btn-primary">
              Go to Login
            </Link>
            <Link href="/" className="btn btn-secondary">
              Back to BloomBase
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}


