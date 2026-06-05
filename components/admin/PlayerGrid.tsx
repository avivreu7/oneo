'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { GridPlayer, PlayerStatus } from '@/lib/types';

const cfg: Record<PlayerStatus, { ring: string; bg: string; icon: string; text: string }> = {
  correct:    { ring: 'ring-game-green/60',  bg: 'bg-game-green/15',  icon: '✓', text: 'text-game-green'  },
  wrong:      { ring: 'ring-game-red/60',    bg: 'bg-game-red/15',    icon: '✗', text: 'text-game-red'    },
  skip:       { ring: 'ring-game-gold/60',   bg: 'bg-game-gold/15',   icon: '↷', text: 'text-game-gold'   },
  waiting:    { ring: 'ring-ps-border',      bg: 'bg-ps-card',        icon: '·', text: 'text-ps-muted'    },
  eliminated: { ring: 'ring-ps-border/20',   bg: 'bg-white/3',        icon: '✗', text: 'text-ps-muted/30' },
};

interface PlayerGridProps {
  players: GridPlayer[];
  activeCount: number;
  totalCount: number;
}

export function PlayerGrid({ players, activeCount, totalCount }: PlayerGridProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-lg">רשת שחקנים</h3>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-ps-muted">{totalCount} סה&quot;כ</span>
          <div className="h-4 w-px bg-ps-border" />
          <span className="text-game-green font-black text-base">{activeCount} נותרו</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12 gap-2">
        <AnimatePresence>
          {players.map(player => {
            const s = cfg[player.status];
            return (
              <motion.div
                key={player.id}
                layout
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: player.status === 'eliminated' ? 0.3 : 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.3 }}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5',
                  'rounded-xl p-1.5 min-h-14 ring-1',
                  s.bg, s.ring,
                  player.status === 'eliminated' && 'grayscale',
                )}
              >
                <span className={cn('text-xs font-bold leading-none', s.text)}>{s.icon}</span>
                <span className={cn('text-[9px] font-semibold text-center leading-tight w-full truncate', s.text)}>
                  {player.nickname}
                </span>
                {(player.status === 'correct' || player.status === 'wrong') && (
                  <motion.div
                    className={cn('absolute inset-0 rounded-xl', player.status === 'correct' ? 'bg-game-green' : 'bg-game-red')}
                    initial={{ opacity: 0.3 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.7 }}
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
        {players.length === 0 && (
          <p className="col-span-full text-center text-ps-muted py-10">ממתינים לשחקנים...</p>
        )}
      </div>

      {/* Legend */}
      <div className="flex gap-4 justify-end flex-wrap">
        {[
          { status: 'correct',    label: 'נכון'  },
          { status: 'wrong',      label: 'טעות'  },
          { status: 'skip',       label: 'דילוג' },
          { status: 'waiting',    label: 'ממתין' },
          { status: 'eliminated', label: 'נפסל'  },
        ].map(({ status, label }) => {
          const s = cfg[status as PlayerStatus];
          return (
            <div key={status} className="flex items-center gap-1.5">
              <div className={cn('w-2.5 h-2.5 rounded ring-1', s.bg, s.ring)} />
              <span className="text-xs text-ps-muted">{label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
