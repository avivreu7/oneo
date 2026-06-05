'use client';

import { motion } from 'framer-motion';

interface EliminatedScreenProps {
  nickname: string;
  questionIndex: number;
  activePlayers: number;
}

export function EliminatedScreen({ nickname, questionIndex, activePlayers }: EliminatedScreenProps) {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-5 gap-7" dir="rtl">

      {/* X icon */}
      <motion.div
        initial={{ scale: 2.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.45, type: 'spring', stiffness: 200 }}
        className="w-24 h-24 rounded-full bg-game-red/10 border-2 border-game-red/30 flex items-center justify-center"
      >
        <span className="text-game-red text-4xl font-black">✗</span>
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
          , תשובתך לא הייתה נכונה
        </p>
        <p className="text-app-muted text-sm mt-1">נפסלת בשאלה {questionIndex} מתוך 10</p>
      </motion.div>

      {/* Stats card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-app-surface rounded-2xl border border-app-border card-shadow px-8 py-5 text-center w-full max-w-xs"
      >
        <p className="text-app-muted text-xs mb-1">ממשיכים במשחק</p>
        <p className="text-game-green font-black text-4xl">{activePlayers}</p>
        <p className="text-app-muted text-xs">שחקנים</p>
      </motion.div>

      {/* Spectator notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="bg-ps-subtle rounded-xl border border-ps-blue/20 px-5 py-3 text-center max-w-xs"
      >
        <p className="text-ps-blue text-sm font-medium">
          👁️ המשך לצפות על המסך המרכזי
        </p>
      </motion.div>

      <motion.p
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-app-muted text-xs text-center"
      >
        אל תתייאש — תנסה שוב!
      </motion.p>
    </div>
  );
}
