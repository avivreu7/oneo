import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const { gameId, nickname } = await req.json();

  if (!gameId || !nickname?.trim()) {
    return NextResponse.json({ error: 'חסרים פרטי הצטרפות' }, { status: 400 });
  }

  const trimmed = nickname.trim();
  if (trimmed.length < 2 || trimmed.length > 20) {
    return NextResponse.json({ error: 'שם חייב להיות בין 2 ל-20 תווים' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Verify game is in lobby status
  const { data: game, error: gameError } = await supabase
    .from('games')
    .select('status')
    .eq('id', gameId)
    .single();

  if (gameError || !game) {
    return NextResponse.json({ error: 'משחק לא נמצא' }, { status: 404 });
  }

  if (game.status !== 'lobby') {
    return NextResponse.json({ error: 'המשחק כבר התחיל' }, { status: 400 });
  }

  const { data: player, error } = await supabase
    .from('players')
    .insert({ game_id: gameId, nickname: trimmed })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'השם הזה כבר תפוס, בחר שם אחר' }, { status: 409 });
    }
    return NextResponse.json({ error: 'שגיאה בהצטרפות למשחק' }, { status: 500 });
  }

  return NextResponse.json({ player });
}
