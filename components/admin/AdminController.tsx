'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { PlayerGrid } from './PlayerGrid';
import { QuestionDisplay } from './QuestionDisplay';
import { TimerDisplay } from './TimerDisplay';
import { useGameState } from '@/hooks/useGameState';
import { usePlayers } from '@/hooks/usePlayers';
import { useResponses, usePlayerGrid } from '@/hooks/useResponses';
import type { RoundResult } from '@/lib/types';

interface AdminControllerProps { gameId: string }

const screen = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -12 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
};

export function AdminController({ gameId }: AdminControllerProps) {
  const { game, question } = useGameState(gameId);
  const { players, activePlayers } = usePlayers(gameId);
  const responses = useResponses(gameId, question?.id ?? null);
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null);
  const [busy, setBusy] = useState(false);

  const revealAnswers = game?.status === 'answer';
  const gridPlayers = usePlayerGrid(players, responses, revealAnswers);

  const api = useCallback(async (endpoint: string, body: Record<string, unknown> = {}) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, ...body }),
      });
      return await res.json();
    } finally {
      setBusy(false);
    }
  }, [gameId]);

  const handleProcessRound = async () => {
    const data = await api('process-round');
    if (data.result) setRoundResult(data.result);
  };

  const handleNextQuestion = () => { setRoundResult(null); api('next-question'); };
  const handlePrevQuestion = () => { setRoundResult(null); api('prev-question'); };
  const handleResetGame    = () => {
    if (!window.confirm('האם לאפס את המשחק? כל התשובות יימחקו והשחקנים יחזרו ללובי.')) return;
    setRoundResult(null);
    api('reset-game');
  };

  if (!game) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-ps-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden" dir="rtl">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-ps-border shrink-0 bg-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-base sm:text-xl font-black text-game-gold truncate">האחוזון העליון</span>
          <StatusBadge status={game.status} />
        </div>
        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
          {game.status === 'timer' && question && (
            <TimerDisplay deadline={game.timer_deadline} size="sm" />
          )}
          <div className="text-right">
            <div className="text-ps-muted text-xs">פעילים</div>
            <div className="text-game-green font-black text-lg leading-tight">
              {activePlayers.length}
              <span className="text-ps-muted text-sm font-normal">/{players.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main stage ── */}
      <main className="flex-1 overflow-y-auto p-6">
        <AnimatePresence mode="wait">

          {/* LOBBY */}
          {game.status === 'lobby' && (
            <motion.div key="lobby" {...screen}>
              <LobbyScreen
                gameId={gameId}
                players={players}
                onStart={() => api('start-game')}
                busy={busy}
              />
            </motion.div>
          )}

          {/* QUESTION */}
          {game.status === 'question' && question && (
            <motion.div key="question" {...screen} className="flex flex-col gap-6 max-w-3xl mx-auto">
              <QuestionDisplay question={question} />
              <div className="flex items-center justify-center gap-4 flex-wrap">
                {game.current_question_index > 1 && (
                  <Button onClick={handlePrevQuestion} size="lg" variant="outline" disabled={busy}>
                    → שאלה קודמת
                  </Button>
                )}
                <Button onClick={() => api('start-timer')} size="xl" variant="gold" disabled={busy}>
                  🕐 התחל ספירה לאחור
                </Button>
              </div>
            </motion.div>
          )}

          {/* TIMER */}
          {game.status === 'timer' && question && (
            <motion.div key="timer" {...screen} className="flex flex-col gap-6 max-w-3xl mx-auto">
              <div className="flex gap-6 items-start">
                <div className="flex-1 min-w-0">
                  <QuestionDisplay question={question} />
                </div>
                <div className="shrink-0 flex flex-col items-center gap-3">
                  <TimerDisplay deadline={game.timer_deadline} size="lg" />
                  <ResponseCounter answered={responses.length} total={activePlayers.length} />
                </div>
              </div>
              <div className="flex justify-center">
                <Button onClick={handleProcessRound} size="lg" variant="danger" disabled={busy}>
                  ⏹ עצור וחשב תוצאות
                </Button>
              </div>
            </motion.div>
          )}

          {/* RESULTS */}
          {game.status === 'results' && question && (
            <motion.div key="results" {...screen} className="flex flex-col gap-6">
              <PlayerGrid players={gridPlayers} activeCount={activePlayers.length} totalCount={players.length} />
              {roundResult && <RoundResultBanner result={roundResult} />}
              <div className="flex justify-center">
                <Button onClick={() => api('reveal-answer')} size="xl" variant="gold" disabled={busy}>
                  💡 גלה תשובה נכונה
                </Button>
              </div>
            </motion.div>
          )}

          {/* ANSWER REVEAL */}
          {game.status === 'answer' && question && (
            <motion.div key="answer" {...screen} className="flex flex-col gap-6 max-w-3xl mx-auto">
              <QuestionDisplay question={question} showAnswer correctOption={question.correct_option} />
              {roundResult && <RoundResultBanner result={roundResult} />}
              <div className="flex justify-center">
                {game.current_question_index < 10 ? (
                  <Button onClick={handleNextQuestion} size="xl" variant="gold" disabled={busy}>
                    שאלה הבאה ←
                  </Button>
                ) : (
                  <Button onClick={() => api('finish-game')} size="xl" variant="success" disabled={busy}>
                    🏆 סיים משחק
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {/* FINISHED */}
          {game.status === 'finished' && (
            <motion.div key="finished" {...screen} className="flex flex-col items-center justify-center min-h-[70vh] gap-8">
              <motion.div
                animate={{ scale: [1,1.05,1], rotate: [0,3,-3,0] }}
                transition={{ repeat: Infinity, duration: 3 }}
                className="text-8xl"
              >🏆</motion.div>
              <h2 className="text-6xl font-black text-game-gold text-center">המשחק הסתיים!</h2>
              <p className="text-game-green text-2xl font-bold">
                {activePlayers.length} שחקנים ב-1% הראשון!
              </p>
              {activePlayers.length > 0 && (
                <div className="flex flex-wrap gap-3 justify-center max-w-lg">
                  {activePlayers.map(p => (
                    <motion.div
                      key={p.id}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="px-4 py-2 rounded-xl bg-game-gold/15 border border-game-gold/40 text-game-gold font-bold"
                    >
                      {p.nickname}
                    </motion.div>
                  ))}
                </div>
              )}
              <Button
                onClick={handleResetGame}
                size="xl"
                variant="outline"
                disabled={busy}
                className="border-game-amber/50 text-game-amber hover:bg-game-amber/10 text-xl px-10"
              >
                🔄 התחל משחק מחדש
              </Button>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    lobby:    { label: 'לובי',    color: 'text-ps-light   border-ps-light/40   bg-ps-light/10'   },
    question: { label: 'שאלה',   color: 'text-[#A78BFA] border-[#A78BFA]/40 bg-[#A78BFA]/10'  },
    timer:    { label: 'טיימר',  color: 'text-game-gold  border-game-gold/40  bg-game-gold/10'  },
    results:  { label: 'תוצאות', color: 'text-game-amber border-game-amber/40 bg-game-amber/10' },
    answer:   { label: 'תשובה',  color: 'text-game-green border-game-green/40 bg-game-green/10' },
    finished: { label: 'הסתיים', color: 'text-ps-muted   border-ps-muted/40   bg-ps-muted/10'  },
  };
  const { label, color } = map[status] ?? { label: status, color: 'text-ps-muted border-ps-border' };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${color}`}>{label}</span>
  );
}

function ResponseCounter({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? (answered / total) * 100 : 0;
  return (
    <div className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-ps-card border border-ps-border min-w-24">
      <span className="text-ps-muted text-xs">ענו</span>
      <span className="text-white font-black text-xl">{answered}<span className="text-ps-muted text-sm">/{total}</span></span>
      <div className="w-full h-1.5 rounded-full bg-white/8 overflow-hidden">
        <motion.div
          className="h-full bg-ps-blue rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4 }}
        />
      </div>
    </div>
  );
}

function LobbyScreen({ gameId, players, onStart, busy }: {
  gameId: string;
  players: Array<{ id: string; nickname: string }>;
  onStart: () => void;
  busy: boolean;
}) {
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/play` : '/play';

  return (
    <div className="flex flex-col items-center gap-8 max-w-3xl mx-auto">

      {/* Hero */}
      <div className="text-center">
        <motion.h1
          className="text-6xl sm:text-8xl font-black text-game-gold leading-none tracking-tight"
          animate={{ opacity: [0.88, 1, 0.88] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          האחוזון העליון
        </motion.h1>
        <p className="text-ps-muted text-base sm:text-xl mt-3 font-medium tracking-widest uppercase">The 1% Club</p>
      </div>

      {/* Join URL — prominent box */}
      <div className="w-full rounded-2xl border-2 border-ps-blue/40 bg-ps-blue/10 overflow-hidden">
        <div className="bg-ps-blue/20 px-6 py-2 text-center border-b border-ps-blue/30">
          <p className="text-ps-muted text-xs font-semibold tracking-wider uppercase">הצטרפו דרך הנייד</p>
        </div>
        <div className="px-6 py-5 text-center">
          <p className="text-ps-light font-mono text-2xl sm:text-3xl font-bold tracking-tight">{joinUrl}</p>
        </div>
      </div>

      {/* Players section */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold text-lg">שחקנים מחוברים</h3>
          <motion.div
            key={players.length}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            className="flex items-baseline gap-1"
          >
            <span className="text-game-green font-black text-3xl">{players.length}</span>
            <span className="text-ps-muted text-sm">שחקנים</span>
          </motion.div>
        </div>

        <div className="flex flex-wrap gap-2 min-h-16 max-h-56 overflow-y-auto rounded-xl bg-white/4 border border-ps-border p-3">
          <AnimatePresence>
            {players.map(p => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="px-3 py-1.5 rounded-full bg-ps-card border border-ps-border text-white text-sm font-medium"
              >
                {p.nickname}
              </motion.span>
            ))}
            {players.length === 0 && (
              <p className="text-ps-muted text-sm w-full text-center py-4">ממתינים לשחקנים...</p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Start button */}
      <Button
        onClick={onStart}
        disabled={busy || players.length === 0}
        size="xl"
        variant="gold"
        className="text-xl sm:text-2xl px-16 font-black w-full sm:w-auto"
      >
        ▶ התחל משחק
      </Button>
    </div>
  );
}

function RoundResultBanner({ result }: { result: RoundResult }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-around p-5 rounded-2xl bg-white/5 border border-ps-border"
    >
      {result.zero_correct_edge_case ? (
        <p className="text-game-gold font-bold text-lg text-center">
          ⚠️ אף אחד לא ענה נכון — אין פסילות בסיבוב הזה!
        </p>
      ) : (
        <>
          <Stat label="ענו נכון"  value={result.correct_count}                           color="text-game-green" />
          <div className="w-px h-10 bg-ps-border" />
          <Stat label="ענו טעות" value={result.total_answered - result.correct_count}    color="text-game-red" />
          <div className="w-px h-10 bg-ps-border" />
          <Stat label="נותרו"    value={result.remaining_count}                          color="text-game-gold" />
        </>
      )}
    </motion.div>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.span key={value} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className={`text-4xl font-black ${color}`}>{value}</motion.span>
      <span className="text-xs text-ps-muted">{label}</span>
    </div>
  );
}
