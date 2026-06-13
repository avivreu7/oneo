import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// GET /api/admin/questions?gameId=xxx
export async function GET(req: NextRequest) {
  const gameId = req.nextUrl.searchParams.get('gameId');
  if (!gameId) return NextResponse.json({ error: 'חסר gameId' }, { status: 400 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('game_id', gameId)
    .order('order_index');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ questions: data });
}

// POST /api/admin/questions — create or update
export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    id, gameId, order_index, difficulty_percent,
    question_text, option_a, option_b, option_c,
    correct_option, explanation, media_url, media_type,
  } = body;

  if (!gameId || !order_index || !question_text || !option_a || !option_b || !option_c || !correct_option) {
    return NextResponse.json({ error: 'חסרים שדות חובה' }, { status: 400 });
  }

  const supabase = createAdminClient();

  const payload = {
    game_id: gameId,
    order_index,
    difficulty_percent,
    question_text,
    option_a,
    option_b,
    option_c,
    correct_option,
    explanation: explanation || null,
    media_url: media_url || null,
    media_type: media_type || 'none',
  };

  let result;
  if (id) {
    result = await supabase.from('questions').update(payload).eq('id', id).select().single();
  } else {
    result = await supabase.from('questions')
      .upsert(payload, { onConflict: 'game_id,order_index' })
      .select()
      .single();
  }

  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 });
  return NextResponse.json({ question: result.data });
}

// DELETE /api/admin/questions?id=xxx
export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'חסר id' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('questions').delete().eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
