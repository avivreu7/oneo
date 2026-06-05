import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { TIMER_SECONDS } from '@/lib/types';

export async function POST(req: NextRequest) {
  const { gameId } = await req.json();
  const supabase = createAdminClient();

  // Server-side deadline — tamper-proof
  const deadline = new Date(Date.now() + TIMER_SECONDS * 1000).toISOString();

  const { error } = await supabase
    .from('games')
    .update({ status: 'timer', timer_deadline: deadline })
    .eq('id', gameId)
    .eq('status', 'question');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deadline });
}
