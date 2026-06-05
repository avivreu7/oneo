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
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-5 gap-8" dir="rtl">

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-ps-blue/10 border border-ps-blue/20 mb-4">
          <span className="text-3xl">🏆</span>
        </div>
        <h1 className="text-4xl font-black text-app-text leading-tight">
          האחוזון<br />העליון
        </h1>
        <p className="text-app-muted text-sm mt-1.5">The 1% Club</p>
      </motion.div>

      {/* Divider */}
      <div className="flex gap-1.5">
        {[0,1,2,3,4].map(i => (
          <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-ps-blue/30"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.2 }}
          />
        ))}
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="w-full max-w-sm bg-app-surface rounded-2xl border border-app-border card-shadow p-7"
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-app-text">מה השם שלך?</label>
            <input
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="הכנס שם..."
              maxLength={20}
              autoComplete="off"
              autoFocus
              dir="rtl"
              className="h-12 w-full rounded-xl border border-app-border bg-app-bg text-app-text text-base px-4 placeholder:text-app-muted/60 focus:outline-none focus:border-ps-blue focus:ring-2 focus:ring-ps-blue/20 transition-all text-right disabled:opacity-50"
              disabled={loading}
            />
            {error && (
              <motion.p initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                className="text-game-red text-sm text-right">
                {error}
              </motion.p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || !nickname.trim()}
            className="h-12 w-full rounded-xl bg-ps-blue text-white font-bold text-base hover:bg-ps-mid transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_1px_3px_rgba(0,80,230,0.3),0_4px_12px_rgba(0,80,230,0.2)] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                מצטרף...
              </span>
            ) : 'הצטרף למשחק ▶'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
