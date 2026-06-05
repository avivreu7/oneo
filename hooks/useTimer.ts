'use client';

import { useEffect, useState, useRef } from 'react';

export function useTimer(deadline: string | null) {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!deadline) {
      setSecondsLeft(0);
      return;
    }

    const deadlineMs = new Date(deadline).getTime();

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineMs - Date.now()) / 1000));
      setSecondsLeft(remaining);

      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [deadline]);

  const isExpired = secondsLeft === 0;
  const isUrgent = secondsLeft <= 10 && secondsLeft > 0;
  const progress = deadline
    ? Math.max(0, secondsLeft / 30)
    : 0;

  return { secondsLeft, isExpired, isUrgent, progress };
}
