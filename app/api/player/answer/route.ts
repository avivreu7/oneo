import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { gameId, questionId, playerId, selectedOption } = await req.json();

  if (!gameId || !questionId || !playerId || !selectedOption) {
    return NextResponse.json({ error: 'חסרים פרטים' }, { status: 400 });
  }

  const validOptions = ['A', 'B', 'C', 'SKIP'];
  if (!validOptions.includes(selectedOption)) {
    return NextResponse.json({ error: 'תשובה לא חוקית' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify player is active and game is in timer status
  const [{ data: player }, { data: game }] = await Promise.all([
    supabase.from('players').select('is_active, used_skip').eq('id', playerId).eq('game_id', gameId).single(),
    supabase.from('games').select('status, current_question_id').eq('id', gameId).single(),
  ]);

  if (!player?.is_active) {
    return NextResponse.json({ error: 'שחקן לא פעיל' }, { status: 400 });
  }

  if (game?.status !== 'timer') {
    return NextResponse.json({ error: 'לא זמן תשובות' }, { status: 400 });
  }

  if (game.current_question_id !== questionId) {
    return NextResponse.json({ error: 'שאלה לא נכונה' }, { status: 400 });
  }

  // Validate skip hasn't been used
  if (selectedOption === 'SKIP' && player.used_skip) {
    return NextResponse.json({ error: 'כבר השתמשת בדילוג' }, { status: 400 });
  }

  // Upsert response (idempotent)
  const { error: responseError } = await supabase
    .from('responses')
    .upsert(
      { game_id: gameId, question_id: questionId, player_id: playerId, selected_option: selectedOption },
      { onConflict: 'question_id,player_id' }
    );

  if (responseError) {
    return NextResponse.json({ error: 'שגיאה בשמירת תשובה' }, { status: 500 });
  }

  // Mark skip as used
  if (selectedOption === 'SKIP') {
    await supabase.from('players').update({ used_skip: true }).eq('id', playerId);
  }

  return NextResponse.json({ success: true });
}
