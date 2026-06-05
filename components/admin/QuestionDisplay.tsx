'use client';

import { motion, type Variants } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { DIFFICULTY_LABELS } from '@/lib/types';
import type { Question } from '@/lib/types';

interface QuestionDisplayProps {
  question: Question;
  showAnswer?: boolean;
  correctOption?: 'A' | 'B' | 'C' | null;
}

const optionVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: (i: number) => ({
    opacity: 1, x: 0,
    transition: { delay: 0.15 + i * 0.12, duration: 0.4, ease: 'easeOut' as const },
  }),
};

const difficultyStyle = (pct: number) => {
  if (pct >= 70) return 'text-game-green  border-game-green/40  bg-game-green/10';
  if (pct >= 35) return 'text-game-gold   border-game-gold/40   bg-game-gold/10';
  if (pct >= 10) return 'text-game-amber  border-game-amber/40  bg-game-amber/10';
  return              'text-game-red    border-game-red/40    bg-game-red/10';
};

const OPTION_CONFIG = {
  A: { dot: 'bg-ps-blue',     base: 'border-ps-border bg-ps-card' },
  B: { dot: 'bg-[#5B21B6]',  base: 'border-ps-border bg-ps-card' },
  C: { dot: 'bg-[#047857]',  base: 'border-ps-border bg-ps-card' },
};

export function QuestionDisplay({ question, showAnswer = false, correctOption }: QuestionDisplayProps) {
  const diffClass = difficultyStyle(question.difficulty_percent);
  const options: Array<{ key: 'A' | 'B' | 'C'; text: string }> = [
    { key: 'A', text: question.option_a },
    { key: 'B', text: question.option_b },
    { key: 'C', text: question.option_c },
  ];

  const getOptionClass = (key: 'A' | 'B' | 'C') => {
    if (!showAnswer || !correctOption) return OPTION_CONFIG[key].base;
    if (key === correctOption) return 'border-game-green/60 bg-game-green/15';
    return 'opacity-30 border-ps-border bg-ps-card';
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-5">

      {/* Difficulty + index row */}
      <div className="flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn('px-4 py-1.5 rounded-full border text-sm font-bold', diffClass)}
        >
          {DIFFICULTY_LABELS[question.difficulty_percent]}
        </motion.div>
        <span className="text-ps-muted text-sm">שאלה {question.order_index} / 10</span>
      </div>

      {/* Media */}
      {question.media_type === 'image' && question.media_url && (
        <div className="w-full max-h-56 rounded-2xl overflow-hidden border border-ps-border">
          <Image src={question.media_url} alt="מדיה" width={800} height={350} className="w-full object-contain max-h-56" />
        </div>
      )}
      {question.media_type === 'audio' && question.media_url && (
        <audio controls src={question.media_url} className="w-full" />
      )}

      {/* Question text */}
      <motion.h2
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-2xl lg:text-3xl font-bold text-white text-right leading-relaxed"
      >
        {question.question_text}
      </motion.h2>

      {/* Options */}
      <div className="flex flex-col gap-2.5">
        {options.map((opt, i) => {
          const cfg = OPTION_CONFIG[opt.key];
          return (
            <motion.div
              key={opt.key}
              custom={i}
              variants={optionVariants}
              initial="hidden"
              animate="visible"
              className={cn('flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-500', getOptionClass(opt.key))}
            >
              <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center text-white font-black text-base shrink-0', cfg.dot)}>
                {opt.key}
              </span>
              <span className="text-white text-lg text-right flex-1 leading-snug">{opt.text}</span>
              {showAnswer && correctOption === opt.key && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="text-game-green text-xl font-black shrink-0"
                >✓</motion.span>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Explanation */}
      {showAnswer && question.explanation && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-4 rounded-xl bg-game-gold/8 border border-game-gold/25 text-right"
        >
          <span className="text-game-gold font-bold text-sm">💡 הסבר: </span>
          <span className="text-ps-muted text-sm">{question.explanation}</span>
        </motion.div>
      )}
    </motion.div>
  );
}
