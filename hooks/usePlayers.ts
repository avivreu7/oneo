'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Player } from '@/lib/types';

const POLL_INTERVAL = 2000; // ms

export function usePlayers(gameId: string | null) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!gameId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    const supabase = createClient();

    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('game_id', gameId)
        .order('joined_at', { ascending: true });
      setPlayers(data ?? []);
      setLoading(false);
    };

    fetchPlayers();

    const timer = setInterval(fetchPlayers, POLL_INTERVAL);
    return () => clearInterval(timer);
  }, [gameId]);

  const activePlayers = players.filter(p => p.is_active);
  const eliminatedPlayers = players.filter(p => !p.is_active);

  return { players, activePlayers, eliminatedPlayers, loading };
}
