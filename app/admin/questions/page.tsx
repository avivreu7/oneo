'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { QuestionEditor } from '@/components/admin/QuestionEditor';
import { DIFFICULTY_LABELS } from '@/lib/types';
import type { Question } from '@/lib/types';

function QuestionsPageInner() {
  const searchParams = useSearchParams();
  const gameId = searchParams.get('gameId') ?? '';

  const [questions, setQuestions] = useState<Question[]>([]);
  const [editing, setEditing] = useState<Question | 'new' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchQuestions = async () => {
    if (!gameId) return;
    const res = await fetch(`/api/admin/questions?gameId=${gameId}`);
    const data = await res.json();
    setQuestions(data.questions ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchQuestions(); }, [gameId]);

  const handleSave = async (q: Partial<Question>) => {
    const res = await fetch('/api/admin/questions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...q, gameId }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setEditing(null);
    fetchQuestions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('למחוק את השאלה?')) return;
    await fetch(`/api/admin/questions?id=${id}`, { method: 'DELETE' });
    fetchQuestions();
  };

  const usedIndexes = questions.map(q => q.order_index);

  const getDiffColor = (pct: number) => {
    if (pct >= 70) return 'text-game-green';
    if (pct >= 35) return 'text-game-gold';
    if (pct >= 10) return 'text-game-amber';
    return 'text-game-red';
  };

  return (
    <div className="min-h-screen bg-app-bg p-6" dir="rtl">
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <Link href="/admin" className="text-app-muted text-sm hover:text-app-text transition-colors">← חזור</Link>
            <h1 className="text-3xl font-black text-app-text mt-1">ניהול שאלות</h1>
            <p className="text-app-muted/60 text-xs font-mono mt-0.5">{gameId}</p>
          </div>
          <Button
            onClick={() => setEditing('new')}
            variant="gold"
            size="md"
            disabled={questions.length >= 10}
          >
            + שאלה חדשה
          </Button>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full bg-app-border overflow-hidden">
            <div
              className="h-full bg-ps-blue transition-all duration-500 rounded-full"
              style={{ width: `${(questions.length / 10) * 100}%` }}
            />
          </div>
          <span className="text-app-muted text-sm shrink-0">{questions.length} / 10 שאלות</span>
        </div>

        {/* Editor */}
        <AnimatePresence>
          {editing && (
            <QuestionEditor
              key="editor"
              gameId={gameId}
              question={editing !== 'new' ? editing : undefined}
              usedOrderIndexes={usedIndexes}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          )}
        </AnimatePresence>

        {/* Questions list */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-2 border-ps-blue border-t-transparent rounded-full animate-spin" />
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-app-muted text-lg">אין שאלות עדיין.</p>
            <p className="text-app-muted/60 text-sm mt-1">הוסף 10 שאלות כדי להתחיל משחק</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {[...questions].sort((a, b) => a.order_index - b.order_index).map(q => (
              <motion.div
                key={q.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-app-surface border border-app-border card-shadow hover:border-ps-blue/30 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-app-muted text-sm font-bold w-4">{q.order_index}</span>
                    <span className={`font-black text-base ${getDiffColor(q.difficulty_percent)}`}>
                      {DIFFICULTY_LABELS[q.difficulty_percent] ?? `${q.difficulty_percent}%`}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-app-text font-medium leading-snug line-clamp-2 text-right">
                      {q.question_text}
                    </p>
                    <div className="flex gap-2 mt-2 flex-wrap justify-end">
                      {(['A', 'B', 'C'] as const).map(opt => (
                        <span
                          key={opt}
                          className={`text-xs px-2 py-0.5 rounded border ${
                            q.correct_option === opt
                              ? 'border-game-green/40 text-game-green bg-game-green/8'
                              : 'border-app-border text-app-muted'
                          }`}
                        >
                          {opt}: {q[`option_${opt.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c'].slice(0, 20)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setEditing(q)}>עריכה</Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(q.id)}
                      className="text-game-red hover:text-game-red/80"
                    >
                      מחק
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function QuestionsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-app-bg flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-ps-blue border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <QuestionsPageInner />
    </Suspense>
  );
}
