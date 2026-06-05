'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Game } from '@/lib/types';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  lobby:    { label: 'לובי',    color: 'text-ps-blue   border-ps-blue/40   bg-ps-blue/8'    },
  question: { label: 'שאלה',   color: 'text-[#7C3AED] border-[#7C3AED]/40 bg-[#7C3AED]/8'  },
  timer:    { label: 'טיימר',  color: 'text-game-gold  border-game-gold/40  bg-game-gold/8'  },
  results:  { label: 'תוצאות', color: 'text-game-amber border-game-amber/40 bg-game-amber/8' },
  answer:   { label: 'תשובה',  color: 'text-game-green border-game-green/40 bg-game-green/8' },
  finished: { label: 'הסתיים', color: 'text-app-muted  border-app-border    bg-app-bg'       },
};

export default function AdminPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const fetchGames = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('games').select('*').order('created_at', { ascending: false }).limit(20);
    setGames(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchGames(); }, []);

  const handleCreateGame = async () => {
    setCreating(true);
    const res = await fetch('/api/admin/create-game', { method: 'POST' });
    const data = await res.json();
    setCreating(false);
    if (data.game) setGames(prev => [data.game, ...prev]);
  };

  const handleDelete = async (gameId: string) => {
    setDeletingId(gameId);
    setConfirmId(null);
    await fetch('/api/admin/delete-game', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId }),
    });
    setGames(prev => prev.filter(g => g.id !== gameId));
    setDeletingId(null);
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-dvh bg-app-bg" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between pt-safe">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-app-text">לוח ניהול</h1>
            <p className="text-app-muted text-sm mt-0.5">האחוזון העליון</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Link href="/projector">
              <Button variant="outline" size="sm">🖥️ פרויקטור</Button>
            </Link>
            <Button onClick={handleCreateGame} disabled={creating} variant="gold" size="sm">
              {creating ? '...' : '+ חדש'}
            </Button>
            <button
              onClick={handleLogout}
              className="text-app-muted text-xs hover:text-app-text transition-colors px-2 py-2"
            >
              יציאה
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-ps-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : games.length === 0 ? (
          <div className="flex flex-col items-center gap-6 py-20">
            <div className="text-6xl">🎮</div>
            <p className="text-app-muted text-lg">אין משחקים עדיין</p>
            <Button onClick={handleCreateGame} variant="gold" size="lg" disabled={creating}>
              {creating ? 'יוצר...' : 'צור משחק ראשון'}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <AnimatePresence>
              {games.map((game, idx) => {
                const s = STATUS_MAP[game.status] ?? { label: game.status, color: 'text-app-muted border-app-border bg-app-bg' };
                const isDeleting = deletingId === game.id;
                const isConfirming = confirmId === game.id;

                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                    transition={{ delay: idx * 0.03 }}
                    className="rounded-2xl bg-app-surface border border-app-border card-shadow overflow-hidden"
                  >
                    {/* Main row */}
                    <div className="flex items-center justify-between p-4">
                      <div className="flex flex-col gap-1.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border shrink-0 ${s.color}`}>
                            {s.label}
                          </span>
                          <span className="text-app-muted font-mono text-xs">{game.id.slice(0, 8)}</span>
                        </div>
                        <span className="text-app-muted/60 text-xs">
                          {new Date(game.created_at).toLocaleString('he-IL')}
                        </span>
                      </div>

                      <div className="flex gap-2 shrink-0 mr-2">
                        <Link href={`/admin/questions?gameId=${game.id}`}>
                          <Button variant="ghost" size="sm">📝</Button>
                        </Link>
                        {game.status !== 'finished' && (
                          <Link href={`/projector?gameId=${game.id}`}>
                            <Button variant="primary" size="sm">▶</Button>
                          </Link>
                        )}
                        <button
                          onClick={() => setConfirmId(isConfirming ? null : game.id)}
                          disabled={isDeleting}
                          className="h-9 w-9 flex items-center justify-center rounded-lg text-app-muted hover:text-game-red hover:bg-game-red/8 transition-all disabled:opacity-40"
                          title="מחק משחק"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>

                    {/* Confirm delete */}
                    <AnimatePresence>
                      {isConfirming && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="flex items-center justify-between px-4 py-3 bg-game-red/5 border-t border-game-red/15">
                            <p className="text-game-red text-sm font-medium">למחוק את המשחק? הפעולה בלתי הפיכה.</p>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => setConfirmId(null)}
                                className="h-8 px-3 rounded-lg text-app-muted text-sm hover:text-app-text transition-colors"
                              >
                                ביטול
                              </button>
                              <button
                                onClick={() => handleDelete(game.id)}
                                disabled={isDeleting}
                                className="h-8 px-3 rounded-lg bg-game-red text-white text-sm font-semibold hover:brightness-110 transition-all disabled:opacity-50"
                              >
                                {isDeleting ? '...' : 'מחק'}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
        <div className="pb-safe" />
      </div>
    </div>
  );
}
