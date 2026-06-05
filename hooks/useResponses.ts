'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Response, GridPlayer, Player } from '@/lib/types';

const POLL_INTERVAL = 1500; // ms — faster during timer phase

export function useResponses(gameId: string | null, questionId: string | null) {
  const [responses, setResponses] = useState<Response[]>([]);

  useEffect(() => {
    if (!gameId || !questionId) {
      setResponses([]);
      return;
    }

    const supabase = createClient();

    const fetchResponses = async () => {
      const { data } = await supabase
        .from('responses')
        .select('*')
        .eq('game_id', gameId)
        .eq('question_id', questionId);
      setResponses(data ?? []);
    };

    fetchResponses();

    const timer = setInterval(fetchResponses, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [gameId, questionId]);

  return responses;
}

// Derived hook: builds grid data combining players + responses
export function usePlayerGrid(
  players: Player[],
  responses: Response[],
  revealAnswers: boolean
): GridPlayer[] {
  const responseMap = new Map(responses.map(r => [r.player_id, r]));

  return players.map(player => {
    const response = responseMap.get(player.id);

    if (!player.is_active) {
      return { id: player.id, nickname: player.nickname, status: 'eliminated' as const };
    }

    if (!response) {
      return { id: player.id, nickname: player.nickname, status: 'waiting' as const };
    }

    if (!revealAnswers) {
      if (response.selected_option === 'SKIP') {
        return { id: player.id, nickname: player.nickname, status: 'skip' as const };
      }
      // Answered but not revealed yet — show as waiting
      return { id: player.id, nickname: player.nickname, status: 'waiting' as const };
    }

    // After reveal
    if (response.selected_option === 'SKIP') {
      return { id: player.id, nickname: player.nickname, status: 'skip' as const };
    }
    if (response.is_correct) {
      return { id: player.id, nickname: player.nickname, status: 'correct' as const };
    }
    return { id: player.id, nickname: player.nickname, status: 'wrong' as const };
  });
}
