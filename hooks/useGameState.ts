'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Game, Question } from '@/lib/types';

interface GameState {
  game: Game | null;
  question: Question | null;
  loading: boolean;
  error: string | null;
}

const POLL_INTERVAL = 1500;

export function useGameState(gameId: string | null) {
  const [state, setState] = useState<GameState>({
    game: null, question: null, loading: true, error: null,
  });

  // Keep last-fetched question in a ref to avoid re-fetching on every poll
  const cachedQuestionRef = useRef<Question | null>(null);
  const cachedQuestionIdRef = useRef<string | null>(null);

  const fetchGameState = useCallback(async (gid: string) => {
    const supabase = createClient();
    const { data: game, error } = await supabase
      .from('games').select('*').eq('id', gid).single();

    if (error || !game) {
      setState(prev => ({ ...prev, loading: false, error: error?.message ?? 'לא נמצא' }));
      return;
    }

    let question: Question | null = cachedQuestionRef.current;

    if (game.current_question_id) {
      if (game.current_question_id !== cachedQuestionIdRef.current) {
        const { data: q } = await supabase
          .from('questions').select('*').eq('id', game.current_question_id).single();
        question = q;
        cachedQuestionRef.current = q;
        cachedQuestionIdRef.current = game.current_question_id;
      }
    } else {
      question = null;
      cachedQuestionRef.current = null;
      cachedQuestionIdRef.current = null;
    }

    setState({ game, question, loading: false, error: null });
  }, []); // stable — no deps needed

  useEffect(() => {
    if (!gameId) {
      setState({ game: null, question: null, loading: false, error: null });
      cachedQuestionRef.current = null;
      cachedQuestionIdRef.current = null;
      return;
    }

    fetchGameState(gameId);
    const timer = setInterval(() => fetchGameState(gameId), POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [gameId]); // fetchGameState is stable so not needed in deps

  return state;
}

export function useActiveGame() {
  const [gameId, setGameId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    const fetch = async () => {
      const { data } = await supabase
        .from('games').select('id')
        .not('status', 'eq', 'finished')
        .order('created_at', { ascending: false })
        .limit(1).maybeSingle();
      setGameId(data?.id ?? null);
      setLoading(false);
    };

    fetch();
    const timer = setInterval(fetch, 3000);
    return () => clearInterval(timer);
  }, []);

  return { gameId, loading };
}
