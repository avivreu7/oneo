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
  animate: { opacity: 1, x: 0, transition: { duration: 0.4 } },
  exit: { opacity: 0, x: -30, transition: { duration: 0.25 } },
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
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
        <div className="text-5xl">🔍</div>
        <p className="text-app-muted text-center text-lg">אין משחק פעיל כרגע.</p>
        <p className="text-app-muted/60 text-sm">נסה שוב בקרוב</p>
      </div>
    );
  }

  if (!player) {
    if (game.status !== 'lobby') {
      return (
        <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-4 gap-4" dir="rtl">
          <div className="text-5xl">⏰</div>
          <p className="text-app-muted text-center text-lg">המשחק כבר התחיל.</p>
          <p className="text-app-muted/60 text-sm">תצטרף לסיבוב הבא!</p>
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
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center gap-6 px-4" dir="rtl">
      <div className="flex gap-2">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-3 h-3 rounded-full bg-ps-blue"
            animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 0.9, delay: i * 0.18 }}
          />
        ))}
      </div>
      <p className="text-app-muted text-center text-base">{message}</p>
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
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center gap-8 px-5" dir="rtl">

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className={`w-24 h-24 rounded-full border-2 flex items-center justify-center ${
          correct
            ? 'border-game-green/40 bg-game-green/10'
            : 'border-game-red/40 bg-game-red/10'
        }`}
      >
        <span className={`text-4xl font-black ${correct ? 'text-game-green' : 'text-game-red'}`}>
          {correct ? '✓' : '✗'}
        </span>
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={`text-4xl font-black text-center ${correct ? 'text-game-green' : 'text-game-red'}`}
      >
        {correct ? 'כל הכבוד! ✓' : 'לא הפעם...'}
      </motion.h2>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="bg-app-surface rounded-2xl border border-app-border card-shadow px-8 py-4 text-center"
      >
        <p className="text-game-green font-black text-3xl">{activePlayers}</p>
        <p className="text-app-muted text-xs mt-0.5">שחקנים ממשיכים</p>
      </motion.div>
    </div>
  );
}

function WinnerScreen({ nickname }: { nickname: string }) {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center gap-8 px-5" dir="rtl">

      <motion.div
        animate={{ rotate: [0, 8, -8, 0], scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        className="text-8xl"
      >
        🏆
      </motion.div>

      <h1 className="text-5xl font-black text-game-gold text-center">מזל טוב!</h1>

      <p className="text-xl text-app-text font-bold text-center">
        <span className="text-ps-blue">{nickname}</span>
        <br />
        אתה חלק מהאחוזון העליון!
      </p>

      <div className="bg-ps-subtle rounded-2xl border border-ps-blue/20 px-8 py-5 text-center max-w-xs">
        <p className="text-ps-blue font-bold text-lg">האחוזון העליון</p>
        <p className="text-app-muted text-sm mt-1">הצלחת לעמוד בכל 10 השאלות!</p>
      </div>
    </div>
  );
}
