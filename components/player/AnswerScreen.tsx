'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
  { key: 'A' as const, label: 'א', bg: 'bg-ps-blue',    hover: 'hover:bg-ps-mid',    shadow: 'shadow-[0_2px_8px_rgba(0,80,230,0.3)]'   },
  { key: 'B' as const, label: 'ב', bg: 'bg-[#5B21B6]',  hover: 'hover:bg-[#4C1D95]', shadow: 'shadow-[0_2px_8px_rgba(91,33,182,0.3)]'  },
  { key: 'C' as const, label: 'ג', bg: 'bg-[#047857]',  hover: 'hover:bg-[#065F46]', shadow: 'shadow-[0_2px_8px_rgba(4,120,87,0.3)]'   },
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
    <div className="min-h-dvh bg-app-bg flex flex-col px-safe" dir="rtl">

      {/* Top strip + header */}
      <div className="shrink-0">
        <div className="h-1.5 bg-ps-blue w-full" />
        <div className="flex items-center justify-between px-1 pt-3 pb-2">
          {/* Difficulty + question number */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-xs font-bold text-app-muted bg-app-surface border border-app-border rounded-full px-3 py-1 card-shadow">
              שאלה {question.order_index}/10
            </span>
            <span className="text-xs font-bold text-ps-blue">
              {question.difficulty_percent}%
            </span>
          </motion.div>
          <TimerDisplay deadline={timerDeadline} size="sm" />
        </div>
      </div>

      {/* Question + media */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="flex-1 flex flex-col justify-center gap-3 py-4 px-1"
      >
        {question.media_type === 'image' && question.media_url && (
          <div className="w-full rounded-xl overflow-hidden border border-app-border max-h-48">
            <Image
              src={question.media_url}
              alt="מדיה"
              width={600}
              height={280}
              className="w-full object-contain max-h-48"
            />
          </div>
        )}
        {question.media_type === 'audio' && question.media_url && (
          <audio controls src={question.media_url} className="w-full" />
        )}
        <h2 className="text-xl sm:text-2xl font-bold text-app-text text-right leading-relaxed">
          {question.question_text}
        </h2>
      </motion.div>

      {/* Answer buttons — always stick to bottom */}
      <div className="shrink-0 flex flex-col gap-3 pb-safe px-1">
        {ANSWERS.map((ans, i) => (
          <motion.button
            key={ans.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 + i * 0.07 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSelect(ans.key)}
            disabled={submitting}
            className={`w-full min-h-18 rounded-xl flex items-center gap-4 px-5 py-3 ${ans.bg} ${ans.hover} ${ans.shadow} text-white font-semibold transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
          >
            <div className="w-11 h-11 rounded-full border-2 border-white/25 bg-white/15 flex items-center justify-center shrink-0">
              <span className="text-2xl font-black leading-none">{ans.label}</span>
            </div>
            <span className="flex-1 text-right text-base sm:text-lg leading-snug">
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
              transition={{ delay: 0.35 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSelect('SKIP')}
              disabled={submitting}
              className="w-full h-14 rounded-xl bg-game-amber text-white flex items-center justify-center gap-3 font-semibold transition-all hover:brightness-105 shadow-[0_2px_8px_rgba(180,83,9,0.2)] disabled:opacity-50 active:scale-[0.98]"
            >
              <span className="text-xl">↷</span>
              <span className="font-bold">דילוג — פעם אחת בלבד</span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export function LockedScreen() {
  return (
    <div className="min-h-dvh bg-app-bg flex flex-col items-center justify-center gap-8 px-safe" dir="rtl">

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 18 }}
        className="w-28 h-28 rounded-full bg-game-green/10 border-2 border-game-green/30 flex items-center justify-center"
      >
        <span className="text-5xl text-game-green font-black">✓</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center"
      >
        <h2 className="text-3xl font-black text-game-green">התשובה נקלטה!</h2>
        <p className="text-app-muted mt-3 text-base leading-relaxed">
          ממתין לתוצאות<br />
          <span className="text-sm">עקוב אחר המסך המרכזי</span>
        </p>
      </motion.div>

      <div className="flex gap-2.5">
        {[0,1,2].map(i => (
          <motion.div
            key={i}
            className="w-3 h-3 rounded-full bg-ps-blue"
            animate={{ opacity: [0.3,1,0.3], scale: [0.8,1.2,0.8] }}
            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.25 }}
          />
        ))}
      </div>
    </div>
  );
}
