'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { useGameState } from '@/hooks/useGameState';
import { usePlayers } from '@/hooks/usePlayers';
import { useResponses } from '@/hooks/useResponses';
import { useTimer } from '@/hooks/useTimer';
import { DIFFICULTY_LABELS } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Question } from '@/lib/types';

interface ProjectorViewProps { gameId: string }

const slide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.3 } },
};

export function ProjectorView({ gameId }: ProjectorViewProps) {
  const { game, question } = useGameState(gameId);
  const { players, activePlayers } = usePlayers(gameId);
  const responses = useResponses(gameId, question?.id ?? null);

  if (!game) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-2 border-game-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" dir="rtl">

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-8 py-4 border-b border-ps-border shrink-0 bg-white/4">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-black text-game-gold tracking-tight">האחוזון העליון</span>
          {question && (
            <span className="text-ps-muted text-sm">שאלה {question.order_index} מתוך 10</span>
          )}
        </div>
        <div className="flex items-center gap-6">
          {game.status === 'timer' && (
            <ProjectorTimer deadline={game.timer_deadline} />
          )}
          <div className="text-right">
            <div className="text-ps-muted text-xs">שחקנים פעילים</div>
            <div className="text-game-green font-black text-xl leading-tight">
              {activePlayers.length}
              <span className="text-ps-muted text-sm font-normal"> / {players.length}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stage ── */}
      <main className="flex-1 overflow-y-auto p-8 lg:p-12">
        <AnimatePresence mode="wait">

          {/* LOBBY */}
          {game.status === 'lobby' && (
            <motion.div key="lobby" {...slide}>
              <LobbyView players={players} />
            </motion.div>
          )}

          {/* QUESTION — showing question to players, no answers revealed */}
          {(game.status === 'question' || game.status === 'timer') && question && (
            <motion.div key={`q-${question.id}`} {...slide}>
              <QuestionView
                question={question}
                showTimer={game.status === 'timer'}
                deadline={game.timer_deadline}
                responseCount={responses.length}
                activeCount={activePlayers.length}
              />
            </motion.div>
          )}

          {/* RESULTS — waiting for admin to reveal */}
          {game.status === 'results' && question && (
            <motion.div key="results" {...slide}>
              <ResultsWaitView
                question={question}
                responseCount={responses.length}
                totalActive={activePlayers.length}
              />
            </motion.div>
          )}

          {/* ANSWER REVEAL */}
          {game.status === 'answer' && question && (
            <motion.div key="answer" {...slide}>
              <AnswerRevealView
                question={question}
                activePlayers={activePlayers.length}
              />
            </motion.div>
          )}

          {/* FINISHED */}
          {game.status === 'finished' && (
            <motion.div key="finished" {...slide}>
              <FinishedView activePlayers={activePlayers} />
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

// ── Lobby ──────────────────────────────────────────────────────

function LobbyView({ players }: { players: Array<{ id: string; nickname: string }> }) {
  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/play` : '/play';

  return (
    <div className="flex flex-col items-center gap-12 max-w-4xl mx-auto">
      <motion.h1
        className="text-8xl lg:text-9xl font-black text-game-gold leading-none tracking-tight text-center"
        animate={{ opacity: [0.85, 1, 0.85] }}
        transition={{ repeat: Infinity, duration: 3 }}
      >
        האחוזון<br />העליון
      </motion.h1>

      {/* Join URL — very large */}
      <div className="w-full rounded-3xl border-2 border-ps-blue/40 bg-ps-blue/10 overflow-hidden">
        <div className="bg-ps-blue/15 px-6 py-3 text-center border-b border-ps-blue/30">
          <p className="text-ps-muted text-sm font-semibold tracking-widest uppercase">
            📱 הצטרפו דרך הנייד
          </p>
        </div>
        <div className="px-8 py-6 text-center">
          <p className="text-ps-light font-mono text-4xl lg:text-5xl font-black tracking-tight">{joinUrl}</p>
        </div>
      </div>

      {/* Players */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="text-white text-xl font-bold">שחקנים מחוברים</span>
          <motion.span key={players.length} initial={{ scale: 1.4 }} animate={{ scale: 1 }}
            className="text-game-green font-black text-4xl">
            {players.length}
          </motion.span>
        </div>
        <div className="flex flex-wrap gap-2 min-h-16 max-h-64 overflow-y-auto rounded-2xl bg-white/4 border border-ps-border p-4">
          <AnimatePresence>
            {players.map(p => (
              <motion.span
                key={p.id}
                initial={{ opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.7 }}
                className="px-4 py-2 rounded-full bg-ps-card border border-ps-border text-white text-base font-medium"
              >
                {p.nickname}
              </motion.span>
            ))}
            {players.length === 0 && (
              <p className="text-ps-muted text-base w-full text-center py-6">ממתינים לשחקנים...</p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Question / Timer ───────────────────────────────────────────

function QuestionView({ question, showTimer, deadline, responseCount, activeCount }: {
  question: Question;
  showTimer: boolean;
  deadline: string | null;
  responseCount: number;
  activeCount: number;
}) {
  const OPTION_COLORS = {
    A: 'border-ps-blue/40   bg-ps-blue/15   ',
    B: 'border-[#7C3AED]/40 bg-[#7C3AED]/15 ',
    C: 'border-[#047857]/40 bg-[#047857]/15 ',
  };
  const DOT_COLORS = { A: 'bg-ps-blue', B: 'bg-[#7C3AED]', C: 'bg-[#047857]' };

  const diffPct = question.difficulty_percent;
  const diffColor =
    diffPct >= 70 ? 'text-game-green border-game-green/40 bg-game-green/10' :
    diffPct >= 35 ? 'text-game-gold  border-game-gold/40  bg-game-gold/10'  :
    diffPct >= 10 ? 'text-game-amber border-game-amber/40 bg-game-amber/10' :
                   'text-game-red   border-game-red/40   bg-game-red/10';

  return (
    <div className="flex gap-8 items-start max-w-5xl mx-auto">

      {/* Question content */}
      <div className="flex-1 min-w-0 flex flex-col gap-6">

        {/* Header row */}
        <div className="flex items-center justify-between">
          <span className={`text-sm font-bold px-4 py-1.5 rounded-full border ${diffColor}`}>
            {DIFFICULTY_LABELS[question.difficulty_percent]}
          </span>
          {showTimer && (
            <span className="text-ps-muted text-sm">
              ענו: {responseCount} / {activeCount}
            </span>
          )}
        </div>

        {/* Media */}
        {question.media_type === 'image' && question.media_url && (
          <div className="w-full max-h-64 rounded-2xl overflow-hidden border border-ps-border">
            <Image src={question.media_url} alt="מדיה" width={900} height={400} className="w-full object-contain max-h-64" />
          </div>
        )}

        {/* Question text */}
        <h2 className="text-3xl lg:text-4xl font-bold text-white leading-relaxed text-right">
          {question.question_text}
        </h2>

        {/* Options */}
        <div className="flex flex-col gap-3">
          {(['A', 'B', 'C'] as const).map((key, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
              className={cn('flex items-center gap-4 p-5 rounded-2xl border-2', OPTION_COLORS[key])}
            >
              <span className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0', DOT_COLORS[key])}>
                {key}
              </span>
              <span className="text-white text-xl text-right flex-1 leading-snug">
                {question[`option_${key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c']}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Timer column */}
      {showTimer && (
        <div className="shrink-0 flex flex-col items-center gap-4 pt-10">
          <BigTimer deadline={deadline} />
          <div className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-white/5 border border-ps-border min-w-28 text-center">
            <span className="text-ps-muted text-xs">ענו</span>
            <span className="text-white font-black text-2xl">{responseCount}</span>
            <span className="text-ps-muted text-xs">מתוך {activeCount}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Results wait ───────────────────────────────────────────────

function ResultsWaitView({ question, responseCount, totalActive }: {
  question: Question;
  responseCount: number;
  totalActive: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 max-w-2xl mx-auto text-center">
      <div className="flex gap-4">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-4 h-4 rounded-full bg-game-gold"
            animate={{ opacity: [0.3,1,0.3], y: [0,-10,0] }}
            transition={{ repeat: Infinity, duration: 1, delay: i * 0.22 }}
          />
        ))}
      </div>
      <h2 className="text-5xl font-black text-white">
        {question.question_text}
      </h2>
      <div className="flex items-center gap-8">
        <div className="text-center">
          <p className="text-game-green font-black text-5xl">{responseCount}</p>
          <p className="text-ps-muted text-sm mt-1">ענו</p>
        </div>
        <div className="w-px h-12 bg-ps-border" />
        <div className="text-center">
          <p className="text-ps-light font-black text-5xl">{totalActive}</p>
          <p className="text-ps-muted text-sm mt-1">שחקנים</p>
        </div>
      </div>
    </div>
  );
}

// ── Answer reveal ──────────────────────────────────────────────

function AnswerRevealView({ question, activePlayers }: {
  question: Question;
  activePlayers: number;
}) {
  const correct = question.correct_option;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">

      <div className="flex items-center justify-between">
        <span className="text-game-green text-xl font-bold">💡 התשובה הנכונה</span>
        <div className="text-right">
          <span className="text-ps-muted text-sm">נותרו במשחק: </span>
          <span className="text-game-green font-black text-2xl">{activePlayers}</span>
        </div>
      </div>

      <h2 className="text-3xl lg:text-4xl font-bold text-white text-right leading-relaxed">
        {question.question_text}
      </h2>

      <div className="flex flex-col gap-3">
        {(['A', 'B', 'C'] as const).map(key => {
          const isCorrect = key === correct;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0 }}
              animate={{ opacity: isCorrect ? 1 : 0.3, scale: isCorrect ? 1.02 : 1 }}
              transition={{ duration: 0.5 }}
              className={cn(
                'flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-500',
                isCorrect
                  ? 'border-game-green/60 bg-game-green/15'
                  : 'border-ps-border/40 bg-white/3'
              )}
            >
              <span className={cn(
                'w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0',
                isCorrect ? 'bg-game-green' : 'bg-white/10'
              )}>
                {isCorrect ? '✓' : key}
              </span>
              <span className={cn('text-xl text-right flex-1 leading-snug font-medium', isCorrect ? 'text-white' : 'text-ps-muted')}>
                {question[`option_${key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c']}
              </span>
            </motion.div>
          );
        })}
      </div>

      {question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-5 rounded-2xl bg-game-gold/8 border border-game-gold/25 text-right"
        >
          <span className="text-game-gold font-bold">💡 הסבר: </span>
          <span className="text-ps-muted">{question.explanation}</span>
        </motion.div>
      )}
    </div>
  );
}

// ── Finished ───────────────────────────────────────────────────

function FinishedView({ activePlayers }: { activePlayers: Array<{ id: string; nickname: string }> }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
      <motion.div
        animate={{ scale: [1,1.06,1], rotate: [0,4,-4,0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-9xl"
      >🏆</motion.div>

      <h2 className="text-7xl font-black text-game-gold">המשחק הסתיים!</h2>

      <p className="text-game-green text-3xl font-bold">
        {activePlayers.length} שחקנים ב-1% הראשון!
      </p>

      {activePlayers.length > 0 && (
        <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
          {activePlayers.map(p => (
            <motion.div
              key={p.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="px-5 py-2.5 rounded-2xl bg-game-gold/15 border-2 border-game-gold/40 text-game-gold font-bold text-xl"
            >
              {p.nickname}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Timer components ───────────────────────────────────────────

function BigTimer({ deadline }: { deadline: string | null }) {
  const { secondsLeft, isUrgent, isExpired, progress } = useTimer(deadline);
  const r = 60;
  const circ = 2 * Math.PI * r;
  const color = isExpired ? 'rgba(255,255,255,0.15)' : isUrgent ? '#C81400' : '#C88B00';

  return (
    <div className="relative w-40 h-40 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90 w-40 h-40" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r} fill="none" strokeWidth="8" stroke="rgba(255,255,255,0.08)" />
        <motion.circle
          cx="70" cy="70" r={r}
          fill="none" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: circ - circ * progress }}
          transition={{ duration: 0.5, ease: 'linear' }}
          stroke={color}
        />
      </svg>
      <motion.span
        key={secondsLeft}
        animate={isUrgent && !isExpired ? { scale: [1, 1.2, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'font-black tabular-nums text-6xl z-10',
          isExpired ? 'text-ps-muted' : isUrgent ? 'text-game-red' : 'text-game-gold'
        )}
      >
        {secondsLeft}
      </motion.span>
    </div>
  );
}

function ProjectorTimer({ deadline }: { deadline: string | null }) {
  const { secondsLeft, isUrgent, isExpired } = useTimer(deadline);
  return (
    <span className={cn(
      'font-black tabular-nums text-3xl',
      isExpired ? 'text-ps-muted' : isUrgent ? 'text-game-red' : 'text-game-gold'
    )}>
      {secondsLeft}s
    </span>
  );
}
