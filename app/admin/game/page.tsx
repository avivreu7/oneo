'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AdminController } from '@/components/admin/AdminController';
import Link from 'next/link';

function AdminGameInner() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId');

  if (!gameId) {
    return (
      <div className="min-h-dvh bg-app-bg flex flex-col items-center justify-center gap-4 px-4" dir="rtl">
        <div className="text-5xl">⚠️</div>
        <p className="text-app-text font-semibold text-lg">לא נבחר משחק</p>
        <Link href="/admin" className="text-ps-blue hover:underline text-sm">← חזור לניהול</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ps-dark projector-page" dir="rtl">
      {/* Back link — top left, small */}
      <div className="fixed top-3 left-3 z-50">
        <Link
          href="/admin"
          className="px-3 py-1.5 rounded-lg bg-white/10 border border-white/15 text-white/70 text-xs hover:bg-white/15 transition-all"
        >
          ← ניהול
        </Link>
      </div>
      <AdminController gameId={gameId} />
    </div>
  );
}

export default function AdminGamePage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh projector-page flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-game-gold border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <AdminGameInner />
    </Suspense>
  );
}
