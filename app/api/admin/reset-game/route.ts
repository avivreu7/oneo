import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  if (!gameId) return NextResponse.json({ error: 'חסר gameId' }, { status: 400 });

  const supabase = createAdminClient();

  // 1. Clear all responses for this game
  const { error: responsesError } = await supabase
    .from('responses')
    .delete()
    .eq('game_id', gameId);
  if (responsesError) return NextResponse.json({ error: responsesError.message }, { status: 500 });

  // 2. Reset all players — keep them in lobby, clear elimination & skip state
  const { error: playersError } = await supabase
    .from('players')
    .update({ is_active: true, used_skip: false })
    .eq('game_id', gameId);
  if (playersError) return NextResponse.json({ error: playersError.message }, { status: 500 });

  // 3. Reset game back to lobby (Realtime will sync all clients instantly)
  const { error: gameError } = await supabase
    .from('games')
    .update({
      status: 'lobby',
      current_question_id: null,
      current_question_index: 0,
      timer_deadline: null,
    })
    .eq('id', gameId);
  if (gameError) return NextResponse.json({ error: gameError.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
