import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  const supabase = createAdminClient();

  // Get first question
  const { data: firstQ } = await supabase
    .from('questions')
    .select('id')
    .eq('game_id', gameId)
    .order('order_index', { ascending: true })
    .limit(1)
    .single();

  if (!firstQ) {
    return NextResponse.json({ error: 'אין שאלות למשחק זה' }, { status: 400 });
  }

  const { error } = await supabase
    .from('games')
    .update({
      status: 'question',
      current_question_id: firstQ.id,
      current_question_index: 1,
    })
    .eq('id', gameId)
    .eq('status', 'lobby');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
