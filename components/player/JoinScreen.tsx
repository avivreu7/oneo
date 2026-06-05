'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface JoinScreenProps {
  onJoin: (nickname: string) => Promise<{ error?: string }>;
}

export function JoinScreen({ onJoin }: JoinScreenProps) {
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nickname.trim();
    if (trimmed.length < 2)  { setError('שם קצר מדי — לפחות 2 תווים'); return; }
    if (trimmed.length > 20) { setError('שם ארוך מדי — עד 20 תווים');   return; }
    setLoading(true);
    setError('');
    const result = await onJoin(trimmed);
    if (result.error) { setError(result.error); setLoading(false); }
  };

  return (
    <div className="min-h-dvh bg-app-bg flex flex-col px-safe" dir="rtl">

      {/* Top decorative strip */}
      <div className="h-1.5 bg-ps-blue w-full shrink-0" />

      {/* Centered content */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-ps-blue/10 border-2 border-ps-blue/20 mb-4">
            <span className="text-4xl">🏆</span>
          </div>
          <h1 className="text-4xl font-black text-app-text leading-tight tracking-tight">
            האחוזון<br />העליון
          </h1>
          <p className="text-app-muted text-sm mt-2 font-medium tracking-wide">THE 1% CLUB</p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="bg-app-surface rounded-2xl border border-app-border card-shadow-lg p-7">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-bold text-app-text">מה השם שלך?</label>
                <input
                  value={nickname}
                  onChange={e => setNickname(e.target.value)}
                  placeholder="הכנס שם..."
                  maxLength={20}
                  autoComplete="off"
                  autoFocus
                  dir="rtl"
                  className="h-14 w-full rounded-xl border-2 border-app-border bg-app-bg text-app-text text-lg px-4 placeholder:text-app-muted/50 focus:outline-none focus:border-ps-blue focus:ring-2 focus:ring-ps-blue/15 transition-all text-right disabled:opacity-50"
                  disabled={loading}
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-game-red text-sm text-right font-medium"
                  >
                    ⚠️ {error}
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading || !nickname.trim()}
                className="h-14 w-full rounded-xl bg-ps-blue text-white font-bold text-lg hover:bg-ps-mid transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_2px_8px_rgba(0,80,230,0.35)] active:scale-[0.98]"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    מצטרף...
                  </span>
                ) : 'הצטרף למשחק ▶'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-app-muted/60 text-xs text-center"
        >
          האחוזון העליון — 10 שאלות, מי שנשאר מנצח
        </motion.p>
      </div>

      <div className="pb-safe shrink-0" />
    </div>
  );
}
