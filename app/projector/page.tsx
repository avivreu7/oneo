'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useActiveGame } from '@/hooks/useGameState';
import { ProjectorView } from '@/components/projector/ProjectorView';
import Link from 'next/link';

function ProjectorInner() {
  const searchParams = useSearchParams();
  const queryGameId = searchParams.get('gameId');
  const { gameId: activeGameId, loading } = useActiveGame();

  const gameId = queryGameId ?? activeGameId;

  if (loading && !queryGameId) {
    return (
      <div className="flex items-center justify-center min-h-screen projector-page">
        <div className="text-game-gold text-2xl">טוען...</div>
      </div>
    );
  }

  if (!gameId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen projector-page gap-6" dir="rtl">
        <div className="text-6xl">🎮</div>
        <p className="text-ps-muted text-xl text-center">אין משחק פעיל.</p>
        <Link
          href="/admin"
          className="px-6 py-3 rounded-xl bg-ps-blue text-white font-bold hover:bg-ps-mid transition-all"
        >
          עבור לניהול
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen projector-page" dir="rtl">
      <ProjectorView gameId={gameId} />
    </div>
  );
}

export default function ProjectorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen projector-page flex items-center justify-center text-game-gold text-2xl">
        טוען...
      </div>
    }>
      <ProjectorInner />
    </Suspense>
  );
}
