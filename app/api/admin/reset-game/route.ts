import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Sequential fallback used only if the atomic reset_game RPC isn't installed.
async function sequentialReset(
  supabase: ReturnType<typeof createAdminClient>,
  gameId: string,
) {
  const { error: responsesError } = await supabase
    .from('responses').delete().eq('game_id', gameId);
  if (responsesError) return responsesError.message;

  const { error: playersError } = await supabase
    .from('players').update({ is_active: true, used_skip: false }).eq('game_id', gameId);
  if (playersError) return playersError.message;

  const { error: gameError } = await supabase
    .from('games')
    .update({ status: 'lobby', current_question_id: null, current_question_index: 0, timer_deadline: null })
    .eq('id', gameId);
  if (gameError) return gameError.message;

  return null;
}

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  if (!gameId) return NextResponse.json({ error: 'חסר gameId' }, { status: 400 });

  const supabase = createAdminClient();

  // Preferred path: atomic RPC (all-or-nothing inside one transaction).
  const { error } = await supabase.rpc('reset_game', { p_game_id: gameId });

  if (error) {
    // PGRST202 = function not found → migration not run yet. Fall back gracefully.
    if (error.code === 'PGRST202') {
      const fallbackError = await sequentialReset(supabase, gameId);
      if (fallbackError) return NextResponse.json({ error: fallbackError }, { status: 500 });
      return NextResponse.json({ success: true, atomic: false });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, atomic: true });
}
