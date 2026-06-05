'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JoinScreen } from './JoinScreen';
import { WaitingScreen } from './WaitingScreen';
import { AnswerScreen, LockedScreen } from './AnswerScreen';
import { EliminatedScreen } from './EliminatedScreen';
import { useActiveGame, useGameState } from '@/hooks/useGameState';
import { usePlayers } from '@/hooks/usePlayers';
import { useResponses } from '@/hooks/useResponses';
import type { Player, AnswerOption } from '@/lib/types';

const pageVariants = {
  initial: { opacity: 0, x: 30 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.35 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.2 } },
};

export function PlayerController() {
  const { gameId } = useActiveGame();
  const { game, question } = useGameState(gameId);
  const { players, activePlayers } = usePlayers(gameId);
  const responses = useResponses(gameId, question?.id ?? null);

  const [player, setPlayer] = useState<Player | null>(null);
  const [hasAnsweredThisRound, setHasAnsweredThisRound] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('player');
    if (stored) {
      try { setPlayer(JSON.parse(stored)); } catch {}
    }
  }, []);

  const questionId = question?.id;
  useEffect(() => {
    setHasAnsweredThisRound(false);
  }, [questionId]);

  useEffect(() => {
    if (!player) return;
    const updated = players.find(p => p.id === player.id);
    if (updated && updated.is_active !== player.is_active) {
      const newPlayer = { ...player, is_active: updated.is_active };
      setPlayer(newPlayer);
      sessionStorage.setItem('player', JSON.stringify(newPlayer));
    }
  }, [players, player]);

  const myResponse = responses.find(r => r.player_id === player?.id);
  const alreadyAnswered = hasAnsweredThisRound || !!myResponse;

  const handleJoin = useCallback(async (nickname: string) => {
    if (!gameId) return { error: 'המשחק לא זמין כרגע' };
    const res = await fetch('/api/player/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gameId, nickname }),
    });
    const data = await res.json();
    if (data.error) return { error: data.error };
    const newPlayer = data.player as Player;
    setPlayer(newPlayer);
    sessionStorage.setItem('player', JSON.stringify(newPlayer));
    return {};
  }, [gameId]);

  const handleAnswer = useCallback(async (option: AnswerOption) => {
    if (!player || !gameId || !question) return;
    setHasAnsweredThisRound(true);
    await fetch('/api/player/answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gameId,
        questionId: question.id,
        playerId: player.id,
        selectedOption: option,
      }),
    });
    if (option === 'SKIP') {
      const updated = { ...player, used_skip: true };
      setPlayer(updated);
      sessionStorage.setItem('player', JSON.stringify(updated));
    }
  }, [player, gameId, question]);

  if (!gameId || !game) {
    return (
      <div className="min-h-dvh bg-app-bg flex flex-col items-center justify-center px-safe gap-5" dir="rtl">
        <div className="text-5xl">🔍</div>
        <p className="text-app-text font-semibold text-center text-lg">אין משחק פעיל כרגע.</p>
        <p className="text-app-muted text-sm">נסה שוב בקרוב</p>
      </div>
    );
  }

  if (!player) {
    if (game.status !== 'lobby') {
      return (
        <div className="min-h-dvh bg-app-bg flex flex-col items-center justify-center px-safe gap-5" dir="rtl">
          <div className="text-5xl">⏰</div>
          <p className="text-app-text font-semibold text-center text-lg">המשחק כבר התחיל.</p>
          <p className="text-app-muted text-sm">תצטרף לסיבוב הבא!</p>
        </div>
      );
    }
    return (
      <AnimatePresence mode="wait">
        <motion.div key="join" {...pageVariants}>
          <JoinScreen onJoin={handleJoin} />
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {game.status === 'lobby' && (
        <motion.div key="waiting" {...pageVariants}>
          <WaitingScreen nickname={player.nickname} playerCount={players.length} />
        </motion.div>
      )}

      {game.status === 'question' && (
        <motion.div key="q-waiting" {...pageVariants}>
          <WaitingCenterScreen message="השאלה מוצגת על המסך המרכזי..." />
        </motion.div>
      )}

      {game.status === 'timer' && question && (
        <motion.div key={`timer-${question.id}`} {...pageVariants}>
          {player.is_active ? (
            alreadyAnswered ? (
              <LockedScreen />
            ) : (
              <AnswerScreen
                question={question}
                timerDeadline={game.timer_deadline}
                hasUsedSkip={player.used_skip}
                onSubmit={handleAnswer}
              />
            )
          ) : (
            <EliminatedScreen
              nickname={player.nickname}
              questionIndex={game.current_question_index}
              activePlayers={activePlayers.length}
            />
          )}
        </motion.div>
      )}

      {(game.status === 'results' || game.status === 'answer') && (
        <motion.div key="results-wait" {...pageVariants}>
          {player.is_active ? (
            <ResultsWaitScreen
              isCorrect={myResponse?.is_correct}
              showResult={game.status === 'answer'}
              activePlayers={activePlayers.length}
            />
          ) : (
            <EliminatedScreen
              nickname={player.nickname}
              questionIndex={game.current_question_index}
              activePlayers={activePlayers.length}
            />
          )}
        </motion.div>
      )}

      {game.status === 'finished' && (
        <motion.div key="finished" {...pageVariants}>
          {player.is_active ? (
            <WinnerScreen nickname={player.nickname} />
          ) : (
            <EliminatedScreen
              nickname={player.nickname}
              questionIndex={game.current_question_index}
              activePlayers={activePlayers.length}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Helper screens ───────────────────────────────────────────

function WaitingCenterScreen({ message }: { message: string }) {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col items-center justify-center gap-6 px-safe" dir="rtl">
      <div className="h-1.5 bg-ps-blue w-full absolute top-0 left-0" />
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-3.5 h-3.5 rounded-full bg-ps-blue"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -8, 0] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18 }}
          />
        ))}
      </div>
      <p className="text-app-muted text-center text-base font-medium">{message}</p>
    </div>
  );
}

function ResultsWaitScreen({ isCorrect, showResult, activePlayers }: {
  isCorrect?: boolean | null;
  showResult: boolean;
  activePlayers: number;
}) {
  if (!showResult || isCorrect === undefined || isCorrect === null) {
    return <WaitingCenterScreen message="ממתין לתוצאות..." />;
  }

  const correct = isCorrect === true;

  return (
    <div className="min-h-dvh bg-app-bg flex flex-col px-safe" dir="rtl">
      <div className={`h-1.5 w-full shrink-0 ${correct ? 'bg-game-green' : 'bg-game-red'}`} />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">

        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className={`w-28 h-28 rounded-full border-2 flex items-center justify-center ${
            correct
              ? 'border-game-green/35 bg-game-green/10'
              : 'border-game-red/35 bg-game-red/10'
          }`}
        >
          <span className={`text-5xl font-black ${correct ? 'text-game-green' : 'text-game-red'}`}>
            {correct ? '✓' : '✗'}
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className={`text-4xl font-black ${correct ? 'text-game-green' : 'text-game-red'}`}>
            {correct ? 'כל הכבוד! ✓' : 'לא הפעם...'}
          </h2>
          <p className="text-app-muted mt-2 text-base">
            {correct ? 'המשך לעקוב אחר המסך' : 'עדיין אפשר לצפות במשחק'}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-app-surface rounded-2xl border border-app-border card-shadow px-10 py-5 text-center"
        >
          <p className="text-game-green font-black text-4xl">{activePlayers}</p>
          <p className="text-app-muted text-sm mt-1">שחקנים ממשיכים</p>
        </motion.div>
      </div>

      <div className="pb-safe shrink-0" />
    </div>
  );
}

function WinnerScreen({ nickname }: { nickname: string }) {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col px-safe" dir="rtl">
      <div className="h-1.5 bg-game-gold w-full shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">

        <motion.div
          animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="text-8xl"
        >
          🏆
        </motion.div>

        <div className="text-center">
          <h1 className="text-5xl font-black text-game-gold">מזל טוב!</h1>
          <p className="text-app-muted mt-2 text-base">הצלחת לעבור את כל 10 השאלות</p>
        </div>

        <div className="bg-app-surface rounded-2xl border border-app-border card-shadow-lg w-full max-w-xs overflow-hidden">
          <div className="h-1.5 bg-game-gold" />
          <div className="px-8 py-6 text-center">
            <p className="text-app-muted text-xs mb-2 font-medium uppercase tracking-wider">האחוזון העליון</p>
            <p className="text-ps-blue font-black text-2xl">{nickname}</p>
            <p className="text-app-muted text-sm mt-2">חלק מה-1% הראשון!</p>
          </div>
        </div>
      </div>

      <div className="pb-safe shrink-0" />
    </div>
  );
}
