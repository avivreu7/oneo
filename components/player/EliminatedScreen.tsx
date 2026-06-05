'use client';

import { motion } from 'framer-motion';

interface EliminatedScreenProps {
  nickname: string;
  questionIndex: number;
  activePlayers: number;
}

export function EliminatedScreen({ nickname, questionIndex, activePlayers }: EliminatedScreenProps) {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col px-safe" dir="rtl">

      {/* Top strip */}
      <div className="h-1.5 bg-game-red w-full shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center gap-7 py-8">

        {/* X icon */}
        <motion.div
          initial={{ scale: 2.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, type: 'spring', stiffness: 200 }}
          className="w-28 h-28 rounded-full bg-game-red/10 border-2 border-game-red/25 flex items-center justify-center"
        >
          <span className="text-game-red text-5xl font-black">✗</span>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <h2 className="text-5xl font-black text-game-red mb-2">נפסלת!</h2>
          <p className="text-app-text text-lg">
            <span className="text-ps-blue font-bold">{nickname}</span>
            {' '}תשובתך לא הייתה נכונה
          </p>
          <p className="text-app-muted text-sm mt-1">נפסלת בשאלה {questionIndex} מתוך 10</p>
        </motion.div>

        {/* Stats card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-app-surface rounded-2xl border border-app-border card-shadow w-full max-w-xs overflow-hidden"
        >
          <div className="h-1 bg-game-green" />
          <div className="px-8 py-5 text-center">
            <p className="text-app-muted text-xs mb-1 font-medium">ממשיכים במשחק</p>
            <p className="text-game-green font-black text-5xl">{activePlayers}</p>
            <p className="text-app-muted text-sm mt-1">שחקנים</p>
          </div>
        </motion.div>

        {/* Spectator notice */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-ps-subtle rounded-xl border border-ps-blue/20 px-5 py-3 text-center max-w-xs w-full"
        >
          <p className="text-ps-blue text-sm font-semibold">
            👁️ המשך לצפות על המסך המרכזי
          </p>
        </motion.div>
      </div>

      <div className="pb-safe shrink-0" />
    </div>
  );
}
