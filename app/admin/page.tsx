'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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

  const fetchGames = async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('games').select('*').order('created_at', { ascending: false }).limit(10);
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

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    window.location.href = '/admin/login';
  };

  return (
    <div className="min-h-screen bg-app-bg" dir="rtl">
      <div className="max-w-2xl mx-auto p-6 flex flex-col gap-8">

        {/* Header */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <h1 className="text-3xl font-black text-app-text">לוח ניהול</h1>
            <p className="text-app-muted text-sm mt-0.5">האחוזון העליון</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/projector">
              <Button variant="outline" size="sm">🖥️ פרויקטור</Button>
            </Link>
            <Button onClick={handleCreateGame} disabled={creating} variant="gold" size="sm">
              {creating ? '...' : '+ משחק חדש'}
            </Button>
            <button
              onClick={handleLogout}
              className="text-app-muted text-xs hover:text-app-text transition-colors px-2"
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
            {games.map((game, idx) => {
              const s = STATUS_MAP[game.status] ?? { label: game.status, color: 'text-app-muted border-app-border bg-app-bg' };
              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="flex items-center justify-between p-4 rounded-2xl bg-app-surface border border-app-border card-shadow hover:border-ps-blue/30 transition-all"
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${s.color}`}>
                        {s.label}
                      </span>
                      <span className="text-app-muted font-mono text-xs">{game.id.slice(0, 8)}</span>
                    </div>
                    <span className="text-app-muted/60 text-xs">
                      {new Date(game.created_at).toLocaleString('he-IL')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/admin/questions?gameId=${game.id}`}>
                      <Button variant="ghost" size="sm">📝 שאלות</Button>
                    </Link>
                    {game.status !== 'finished' && (
                      <Link href={`/projector?gameId=${game.id}`}>
                        <Button variant="primary" size="sm">▶ נהל</Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
