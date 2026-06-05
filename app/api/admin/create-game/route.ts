import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = createAdminClient();

  const { data: game, error } = await supabase
    .from('games')
    .insert({ status: 'lobby' })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ game });
}
