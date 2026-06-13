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
  if ((game.current_question_index ?? 0) <= 1) {
    return NextResponse.json({ error: 'כבר בשאלה הראשונה' }, { status: 400 });
  }

  const prevIndex = (game.current_question_index ?? 1) - 1;

  const { data: prevQ } = await supabase
    .from('questions')
    .select('id')
    .eq('game_id', gameId)
    .eq('order_index', prevIndex)
    .single();

  if (!prevQ) return NextResponse.json({ error: 'שאלה קודמת לא נמצאה' }, { status: 404 });

  const { error } = await supabase
    .from('games')
    .update({
      status: 'question',
      current_question_id: prevQ.id,
      current_question_index: prevIndex,
      timer_deadline: null,
    })
    .eq('id', gameId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
