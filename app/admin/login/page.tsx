'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') ?? '/admin';
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      router.push(from);
      router.refresh();
    } else {
      setError('סיסמה שגויה');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ps-blue/10 border border-ps-blue/20 mb-4">
            <span className="text-3xl">🏆</span>
          </div>
          <h1 className="text-3xl font-black text-app-text">האחוזון העליון</h1>
          <p className="text-app-muted text-sm mt-1">כניסה לממשק הניהול</p>
        </div>

        {/* Card */}
        <div className="bg-app-surface border border-app-border rounded-2xl card-shadow p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-app-text">סיסמת מנהל</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="הכנס סיסמה..."
                autoFocus
                dir="rtl"
                className="h-12 w-full rounded-xl border border-app-border bg-app-bg text-app-text px-4 text-base placeholder:text-app-muted/60 focus:outline-none focus:border-ps-blue focus:ring-2 focus:ring-ps-blue/20 transition-all text-right"
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-game-red text-sm"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password}
              className="h-12 w-full rounded-xl bg-ps-blue text-white font-bold text-base hover:bg-ps-mid transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_1px_3px_rgba(0,80,230,0.3),0_4px_12px_rgba(0,80,230,0.2)] active:scale-[0.98]"
            >
              {loading ? 'מתחבר...' : 'כניסה'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-app-bg" />}>
      <LoginForm />
    </Suspense>
  );
}
