import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function DELETE(req: Request) {
  const { gameId } = await req.json();
  if (!gameId) return NextResponse.json({ error: 'gameId required' }, { status: 400 });

  const supabase = createAdminClient();
  const { error } = await supabase.from('games').delete().eq('id', gameId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
