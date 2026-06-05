import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const gameId = formData.get('gameId') as string;

  if (!file || !gameId) {
    return NextResponse.json({ error: 'חסר קובץ או gameId' }, { status: 400 });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: 'סוג קובץ לא נתמך' }, { status: 400 });
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'הקובץ גדול מדי (מקסימום 10MB)' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const ext = file.name.split('.').pop();
  const path = `${gameId}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from('game-media')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from('game-media').getPublicUrl(path);

  const mediaType = file.type.startsWith('image') ? 'image' : 'audio';

  return NextResponse.json({ url: publicUrl, mediaType });
}
