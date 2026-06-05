'use client';

import { motion } from 'framer-motion';

interface WaitingScreenProps {
  nickname: string;
  playerCount: number;
}

export function WaitingScreen({ nickname, playerCount }: WaitingScreenProps) {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col px-safe" dir="rtl">

      {/* Top strip */}
      <div className="h-1.5 bg-ps-blue w-full shrink-0" />

      <div className="flex-1 flex flex-col items-center justify-center gap-8 py-8">

        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-black text-app-text">האחוזון העליון</h1>
          <p className="text-app-muted text-xs mt-1 font-medium tracking-wide">THE 1% CLUB</p>
        </div>

        {/* Pulsing ring */}
        <div className="relative w-28 h-28">
          {[0, 1, 2].map(i => (
            <motion.div
              key={i}
              className="absolute inset-0 rounded-full border-2 border-ps-blue/20"
              animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
              transition={{ repeat: Infinity, duration: 2.2, delay: i * 0.7 }}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-ps-blue/10 border-2 border-ps-blue/20 flex items-center justify-center">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        {/* Status text */}
        <div className="flex flex-col items-center gap-2">
          <p className="text-app-text text-xl font-bold">ממתינים לתחילת המשחק</p>
          <div className="flex gap-1.5">
            {[0,1,2].map(i => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-ps-blue"
                animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.3 }}
              />
            ))}
          </div>
        </div>

        {/* Player card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-app-surface rounded-2xl border border-app-border card-shadow w-full max-w-xs overflow-hidden"
        >
          <div className="h-1 bg-ps-blue" />
          <div className="px-8 py-5 text-center">
            <p className="text-app-muted text-xs mb-1.5 font-medium">מחובר בתור</p>
            <p className="text-ps-blue font-black text-2xl">{nickname}</p>
          </div>
        </motion.div>

        {/* Player count */}
        <motion.div
          key={playerCount}
          initial={{ scale: 1.3 }}
          animate={{ scale: 1 }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-game-green font-black text-5xl">{playerCount}</span>
          <p className="text-app-muted text-sm font-medium">שחקנים מחוברים</p>
        </motion.div>
      </div>

      <div className="pb-safe shrink-0" />
    </div>
  );
}
