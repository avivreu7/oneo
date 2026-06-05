'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import type { Game } from '@/lib/types';

const STATUS_MAP: Record<string, { label: string; color: string; dot: string }> = {
  lobby:    { label: 'לובי',    color: 'text-ps-blue   bg-ps-blue/10',   dot: 'bg-ps-blue'   },
  question: { label: 'שאלה',   color: 'text-[#7C3AED] bg-[#7C3AED]/10', dot: 'bg-[#7C3AED]' },
  timer:    { label: 'טיימר',  color: 'text-game-gold  bg-game-gold/10',  dot: 'bg-game-gold'  },
  results:  { label: 'תוצאות', color: 'text-game-amber bg-game-amber/10', dot: 'bg-game-amber' },
  answer:   { label: 'תשובה',  color: 'text-game-green bg-game-green/10', dot: 'bg-game-green' },
  finished: { label: 'הסתיים', color: 'text-app-muted  bg-app-border/50', dot: 'bg-app-muted'  },
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
      <div className="h-1.5 bg-ps-blue w-full" />
      <div className="max-w-2xl mx-auto px-4 py-6 flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-app-text">לוח ניהול</h1>
            <p className="text-app-muted text-sm">האחוזון העליון</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/projector">
              <Button variant="outline" size="sm">🖥️ פרויקטור</Button>
            </Link>
            <Button onClick={handleCreateGame} disabled={creating} variant="gold" size="sm">
              {creating ? 'יוצר...' : '+ משחק חדש'}
            </Button>
            <button onClick={handleLogout} className="text-app-muted text-xs hover:text-app-text px-2 py-2 transition-colors">
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
          <div className="flex flex-col gap-4">
            <AnimatePresence>
              {games.map((game, idx) => {
                const s = STATUS_MAP[game.status] ?? { label: game.status, color: 'text-app-muted bg-app-border/50', dot: 'bg-app-muted' };
                const isDeleting = deletingId === game.id;
                const isConfirming = confirmId === game.id;

                return (
                  <motion.div
                    key={game.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: isDeleting ? 0.4 : 1, y: 0 }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.25 } }}
                    transition={{ delay: idx * 0.04 }}
                    className="bg-app-surface rounded-2xl border border-app-border card-shadow overflow-hidden"
                  >
                    {/* Status bar */}
                    <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-app-border/60`}>
                      <div className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                      <span className="text-app-muted/50 font-mono text-xs mr-auto">{game.id.slice(0, 8)}</span>
                      <span className="text-app-muted/50 text-xs">{new Date(game.created_at).toLocaleDateString('he-IL')}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 p-3">
                      <Link href={`/admin/questions?gameId=${game.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">📝 שאלות</Button>
                      </Link>
                      {game.status !== 'finished' && (
                        <Link href={`/admin/game?gameId=${game.id}`} className="flex-1">
                          <Button variant="primary" size="sm" className="w-full">🎮 שלוט במשחק</Button>
                        </Link>
                      )}
                    </div>

                    {/* Delete section — always visible */}
                    <div className="border-t border-app-border/60">
                      {!isConfirming ? (
                        <button
                          onClick={() => setConfirmId(game.id)}
                          disabled={isDeleting}
                          className="w-full px-4 py-2.5 flex items-center gap-2 text-game-red text-sm font-medium hover:bg-game-red/5 transition-colors disabled:opacity-40"
                        >
                          <span className="text-base">🗑️</span>
                          <span>מחק משחק זה</span>
                        </button>
                      ) : (
                        <div className="flex items-center justify-between px-4 py-2.5 bg-game-red/5">
                          <span className="text-game-red text-sm font-semibold">למחוק? הפעולה בלתי הפיכה</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setConfirmId(null)}
                              className="px-3 h-8 rounded-lg text-app-muted text-sm hover:text-app-text transition-colors"
                            >
                              ביטול
                            </button>
                            <button
                              onClick={() => handleDelete(game.id)}
                              disabled={isDeleting}
                              className="px-4 h-8 rounded-lg bg-game-red text-white text-sm font-bold hover:brightness-105 transition-all disabled:opacity-50"
                            >
                              {isDeleting ? '...' : 'כן, מחק'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
