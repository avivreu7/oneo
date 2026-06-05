'use client';

import { motion } from 'framer-motion';
import { useTimer } from '@/hooks/useTimer';
import { cn } from '@/lib/utils';

interface TimerDisplayProps {
  deadline: string | null;
  size?: 'sm' | 'lg';
}

export function TimerDisplay({ deadline, size = 'lg' }: TimerDisplayProps) {
  const { secondsLeft, isUrgent, isExpired, progress } = useTimer(deadline);

  const r = size === 'lg' ? 54 : 26;
  const viewBox = size === 'lg' ? '0 0 120 120' : '0 0 60 60';
  const cx = size === 'lg' ? 60 : 30;
  const strokeW = size === 'lg' ? 7 : 5;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * progress;

  const dim = size === 'lg' ? 'w-36 h-36' : 'w-16 h-16';
  const textSize = size === 'lg' ? 'text-5xl' : 'text-xl';

  const trackColor  = 'rgba(255,255,255,0.08)';
  const activeColor = isExpired ? 'rgba(255,255,255,0.15)' : isUrgent ? '#C81400' : '#C88B00';

  return (
    <div className={cn('relative flex items-center justify-center', dim)}>
      <svg className={cn('absolute inset-0 -rotate-90', dim)} viewBox={viewBox}>
        <circle cx={cx} cy={cx} r={r} fill="none" strokeWidth={strokeW} stroke={trackColor} />
        <motion.circle
          cx={cx} cy={cx} r={r}
          fill="none"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: circumference - dash }}
          transition={{ duration: 0.5, ease: 'linear' }}
          stroke={activeColor}
        />
      </svg>

      <motion.span
        key={secondsLeft}
        animate={isUrgent && !isExpired ? { scale: [1, 1.18, 1] } : { scale: 1 }}
        transition={{ duration: 0.35 }}
        className={cn(
          'font-black tabular-nums z-10',
          textSize,
          isExpired ? 'text-ps-muted'
          : isUrgent ? 'text-game-red'
          : 'text-game-gold',
        )}
      >
        {secondsLeft}
      </motion.span>
    </div>
  );
}
