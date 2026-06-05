'use client';

import { motion } from 'framer-motion';

interface WaitingScreenProps {
  nickname: string;
  playerCount: number;
}

export function WaitingScreen({ nickname, playerCount }: WaitingScreenProps) {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center px-5 gap-8" dir="rtl">

      {/* Logo */}
      <div className="text-center">
        <h1 className="text-3xl font-black text-app-text">האחוזון העליון</h1>
        <p className="text-app-muted text-sm mt-1">The 1% Club</p>
      </div>

      {/* Pulsing ring */}
      <div className="relative w-24 h-24">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border-2 border-ps-blue/25"
            animate={{ scale: [1, 2.1], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: i * 0.65 }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-ps-blue/10 border border-ps-blue/25 flex items-center justify-center">
            <span className="text-xl">⏳</span>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-app-text text-lg font-bold">ממתינים לתחילת המשחק</p>
        <div className="flex gap-1">
          {[0,1,2].map(i => (
            <motion.span key={i} className="text-app-muted text-xl"
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}>
              ·
            </motion.span>
          ))}
        </div>
      </div>

      {/* Player card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-app-surface rounded-2xl border border-app-border card-shadow px-8 py-5 text-center w-full max-w-xs"
      >
        <p className="text-app-muted text-xs mb-1">מחובר בתור</p>
        <p className="text-ps-blue font-black text-2xl">{nickname}</p>
      </motion.div>

      {/* Player count */}
      <motion.div key={playerCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="text-center">
        <span className="text-game-green font-black text-4xl">{playerCount}</span>
        <p className="text-app-muted text-xs mt-1">שחקנים מחוברים</p>
      </motion.div>
    </div>
  );
}
