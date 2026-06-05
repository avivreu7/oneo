'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { DIFFICULTY_LEVELS } from '@/lib/types';
import type { Question } from '@/lib/types';

interface QuestionEditorProps {
  gameId: string;
  question?: Question;
  usedOrderIndexes: number[];
  onSave: (q: Partial<Question>) => Promise<void>;
  onCancel: () => void;
}

export function QuestionEditor({ gameId, question, usedOrderIndexes, onSave, onCancel }: QuestionEditorProps) {
  const [form, setForm] = useState({
    order_index: question?.order_index ?? 1,
    difficulty_percent: question?.difficulty_percent ?? 90,
    question_text: question?.question_text ?? '',
    option_a: question?.option_a ?? '',
    option_b: question?.option_b ?? '',
    option_c: question?.option_c ?? '',
    correct_option: question?.correct_option ?? 'A' as 'A' | 'B' | 'C',
    explanation: question?.explanation ?? '',
    media_url: question?.media_url ?? '',
    media_type: question?.media_type ?? 'none' as 'image' | 'audio' | 'none',
  });

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (key: string, value: unknown) => setForm(prev => ({ ...prev, [key]: value }));

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('gameId', gameId);
    const res = await fetch('/api/admin/upload-media', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (data.url) {
      set('media_url', data.url);
      set('media_type', data.mediaType);
    } else {
      setError(data.error ?? 'שגיאת העלאה');
    }
  };

  const handleSave = async () => {
    if (!form.question_text.trim() || !form.option_a.trim() || !form.option_b.trim() || !form.option_c.trim()) {
      setError('מלא את כל שדות החובה');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await onSave({
        id: question?.id,
        game_id: gameId,
        ...form,
        explanation: form.explanation || null,
        media_url: form.media_url || null,
      } as Partial<Question>);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const availableIndexes = [1,2,3,4,5,6,7,8,9,10].filter(
    i => !usedOrderIndexes.includes(i) || i === question?.order_index
  );

  const selectClass = 'h-12 rounded-xl border border-app-border bg-app-bg text-app-text px-3 focus:border-ps-blue focus:outline-none focus:ring-2 focus:ring-ps-blue/20 transition-all';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col gap-5 p-6 rounded-2xl bg-ps-blue/5 border border-ps-blue/20"
      dir="rtl"
    >
      <h3 className="text-xl font-bold text-app-text">
        {question ? 'עריכת שאלה' : 'שאלה חדשה'}
      </h3>

      {error && (
        <p className="text-game-red text-sm bg-game-red/5 border border-game-red/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {/* Order + Difficulty */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-app-muted font-medium">מספר שאלה</label>
          <select
            value={form.order_index}
            onChange={e => set('order_index', Number(e.target.value))}
            className={selectClass}
          >
            {availableIndexes.map(i => (
              <option key={i} value={i}>שאלה {i}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm text-app-muted font-medium">רמת קושי</label>
          <select
            value={form.difficulty_percent}
            onChange={e => set('difficulty_percent', Number(e.target.value))}
            className={selectClass}
          >
            {DIFFICULTY_LEVELS.map(d => (
              <option key={d} value={d}>{d}%</option>
            ))}
          </select>
        </div>
      </div>

      {/* Question text */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-app-muted font-medium">טקסט השאלה *</label>
        <textarea
          value={form.question_text}
          onChange={e => set('question_text', e.target.value)}
          rows={3}
          placeholder="הכנס את השאלה..."
          className="rounded-xl border border-app-border bg-app-bg text-app-text px-4 py-3 focus:border-ps-blue focus:outline-none focus:ring-2 focus:ring-ps-blue/20 transition-all resize-none placeholder:text-app-muted/60 text-right"
        />
      </div>

      {/* Options */}
      {(['A', 'B', 'C'] as const).map(opt => (
        <div key={opt} className="flex flex-col gap-1">
          <label className="text-sm text-app-muted font-medium flex items-center gap-2">
            <span className={cn(
              'w-6 h-6 rounded flex items-center justify-center text-xs font-black text-white',
              opt === 'A' ? 'bg-ps-blue' : opt === 'B' ? 'bg-[#5B21B6]' : 'bg-game-green'
            )}>
              {opt}
            </span>
            תשובה {opt === 'A' ? 'א' : opt === 'B' ? 'ב' : 'ג'} *
          </label>
          <Input
            value={form[`option_${opt.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c']}
            onChange={e => set(`option_${opt.toLowerCase()}`, e.target.value)}
            placeholder={`תשובה ${opt}...`}
            className="text-right"
          />
        </div>
      ))}

      {/* Correct answer */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-app-muted font-medium">תשובה נכונה *</label>
        <div className="flex gap-3">
          {(['A', 'B', 'C'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => set('correct_option', opt)}
              className={cn(
                'flex-1 h-12 rounded-xl border-2 font-black text-lg transition-all',
                form.correct_option === opt
                  ? 'border-game-green bg-game-green/10 text-game-green'
                  : 'border-app-border bg-app-bg text-app-muted hover:border-ps-blue/40'
              )}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="flex flex-col gap-1">
        <label className="text-sm text-app-muted font-medium">הסבר (אופציונלי)</label>
        <Input
          value={form.explanation}
          onChange={e => set('explanation', e.target.value)}
          placeholder="הסבר קצר..."
          className="text-right"
        />
      </div>

      {/* Media upload */}
      <div className="flex flex-col gap-2">
        <label className="text-sm text-app-muted font-medium">מדיה (תמונה / אודיו)</label>
        <div className="flex gap-3 items-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'מעלה...' : '📎 העלה קובץ'}
          </Button>
          {form.media_url && (
            <div className="flex items-center gap-2 flex-1">
              <span className="text-xs text-game-green truncate flex-1">{form.media_url.split('/').pop()}</span>
              <button
                onClick={() => { set('media_url', ''); set('media_type', 'none'); }}
                className="text-app-muted hover:text-game-red text-sm transition-colors"
              >✕</button>
            </div>
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,audio/*"
          className="hidden"
          onChange={handleUpload}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button onClick={handleSave} disabled={saving} variant="gold" size="lg" className="flex-1">
          {saving ? 'שומר...' : '💾 שמור שאלה'}
        </Button>
        <Button onClick={onCancel} variant="ghost" size="lg">
          ביטול
        </Button>
      </div>
    </motion.div>
  );
}
