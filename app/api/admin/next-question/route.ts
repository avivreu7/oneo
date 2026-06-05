import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  const supabase = createAdminClient();

  const { data: game } = await supabase
    .from('games')
    .select('current_question_index')
    .eq('id', gameId)
    .single();

  if (!game) return NextResponse.json({ error: 'משחק לא נמצא' }, { status: 404 });

  const nextIndex = (game.current_question_index ?? 0) + 1;

  const { data: nextQ } = await supabase
    .from('questions')
    .select('id')
    .eq('game_id', gameId)
    .eq('order_index', nextIndex)
    .single();

  if (!nextQ) {
    return NextResponse.json({ error: 'אין שאלה הבאה' }, { status: 400 });
  }

  const { error } = await supabase
    .from('games')
    .update({
      status: 'question',
      current_question_id: nextQ.id,
      current_question_index: nextIndex,
      timer_deadline: null,
    })
    .eq('id', gameId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
