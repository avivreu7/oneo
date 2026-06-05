'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TimerDisplay } from '@/components/admin/TimerDisplay';
import { SKIP_AVAILABLE_FROM_INDEX } from '@/lib/types';
import type { Question, AnswerOption } from '@/lib/types';

interface AnswerScreenProps {
  question: Question;
  timerDeadline: string | null;
  hasUsedSkip: boolean;
  onSubmit: (option: AnswerOption) => Promise<void>;
}

const ANSWERS = [
  { key: 'A' as const, label: 'א', bg: 'bg-ps-blue',     hover: 'hover:bg-ps-mid',      shadow: 'shadow-[0_2px_8px_rgba(0,80,230,0.25)]'  },
  { key: 'B' as const, label: 'ב', bg: 'bg-[#5B21B6]',   hover: 'hover:bg-[#4C1D95]',   shadow: 'shadow-[0_2px_8px_rgba(91,33,182,0.25)]' },
  { key: 'C' as const, label: 'ג', bg: 'bg-[#047857]',   hover: 'hover:bg-[#065F46]',   shadow: 'shadow-[0_2px_8px_rgba(4,120,87,0.25)]'  },
];

export function AnswerScreen({ question, timerDeadline, hasUsedSkip, onSubmit }: AnswerScreenProps) {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const skipAvailable = question.order_index >= SKIP_AVAILABLE_FROM_INDEX && !hasUsedSkip;

  const handleSelect = async (option: AnswerOption) => {
    if (submitted || submitting) return;
    setSubmitting(true);
    await onSubmit(option);
    setSubmitted(true);
  };

  if (submitted) return <LockedScreen />;

  return (
    <div className="min-h-screen bg-app-bg flex flex-col px-4 py-5 gap-4" dir="rtl">

      {/* Top: difficulty + timer */}
      <div className="flex items-center justify-between shrink-0">
        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="px-3 py-1 rounded-full border border-app-border bg-app-surface text-app-muted text-sm font-bold card-shadow"
        >
          {question.difficulty_percent}%
        </motion.div>
        <TimerDisplay deadline={timerDeadline} size="sm" />
      </div>

      {/* Question */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex flex-col justify-center gap-1"
      >
        <p className="text-app-muted text-xs text-right">שאלה {question.order_index} מתוך 10</p>
        <h2 className="text-xl font-bold text-app-text text-right leading-relaxed">
          {question.question_text}
        </h2>
      </motion.div>

      {/* Answer buttons */}
      <div className="flex flex-col gap-3 shrink-0 pb-4">
        {ANSWERS.map((ans, i) => (
          <motion.button
            key={ans.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.08 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(ans.key)}
            disabled={submitting}
            className={`
              w-full h-18 rounded-xl flex items-center gap-4 px-5
              ${ans.bg} ${ans.hover} ${ans.shadow}
              text-white font-semibold transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]
            `}
          >
            <div className="w-10 h-10 rounded-full border-2 border-white/25 bg-white/15 flex items-center justify-center shrink-0">
              <span className="text-xl font-black">{ans.label}</span>
            </div>
            <span className="flex-1 text-right text-lg leading-snug">
              {question[`option_${ans.key.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c']}
            </span>
          </motion.button>
        ))}

        {/* Skip button */}
        <AnimatePresence>
          {skipAvailable && (
            <motion.button
              initial={{ opacity: 0, y: 12, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.38 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect('SKIP')}
              disabled={submitting}
              className="w-full h-14 rounded-xl bg-game-amber text-white flex items-center justify-center gap-3 font-semibold transition-all hover:brightness-105 shadow-[0_2px_8px_rgba(180,83,9,0.2)] disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="text-lg">↷</span>
              <div className="text-right">
                <div className="text-sm font-bold">דילוג</div>
                <div className="text-xs opacity-75">פעם אחת בלבד</div>
              </div>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function LockedScreen() {
  return (
    <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center gap-8 px-5" dir="rtl">

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 240, damping: 18 }}
        className="w-24 h-24 rounded-full bg-game-green/10 border-2 border-game-green/30 flex items-center justify-center"
      >
        <span className="text-4xl text-game-green font-black">✓</span>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="text-center">
        <h2 className="text-2xl font-black text-game-green">התשובה נקלטה!</h2>
        <p className="text-app-muted mt-2 text-base leading-relaxed">
          ממתין לתוצאות<br />
          <span className="text-sm">עקוב אחר המסך המרכזי</span>
        </p>
      </motion.div>

      <div className="flex gap-2">
        {[0,1,2].map(i => (
          <motion.div key={i} className="w-2.5 h-2.5 rounded-full bg-ps-blue"
            animate={{ opacity: [0.3,1,0.3], scale: [0.8,1.2,0.8] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.25 }} />
        ))}
      </div>
    </div>
  );
}
