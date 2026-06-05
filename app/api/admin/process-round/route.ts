import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  const supabase = createAdminClient();

  // Get current question
  const { data: game } = await supabase
    .from('games')
    .select('current_question_id, status')
    .eq('id', gameId)
    .single();

  if (!game?.current_question_id) {
    return NextResponse.json({ error: 'אין שאלה פעילה' }, { status: 400 });
  }

  if (game.status !== 'timer') {
    return NextResponse.json({ error: 'לא בסטטוס טיימר' }, { status: 400 });
  }

  // Call the RPC to process results + handle edge case
  const { data: result, error: rpcError } = await supabase
    .rpc('process_round_results', {
      p_game_id: gameId,
      p_question_id: game.current_question_id,
    });

  if (rpcError) return NextResponse.json({ error: rpcError.message }, { status: 500 });

  // Move to results screen
  await supabase
    .from('games')
    .update({ status: 'results' })
    .eq('id', gameId);

  return NextResponse.json({ success: true, result });
}
