import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

const BUCKET = 'game-media';
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'audio/mpeg', 'audio/wav', 'audio/ogg'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

async function ensureBucketExists(supabase: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b: { id: string }) => b.id === BUCKET);
  if (!exists) {
    await supabase.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    });
  }
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get('file') as File | null;
  const gameId = formData.get('gameId') as string;

  if (!file || !gameId) {
    return NextResponse.json({ error: 'חסר קובץ או gameId' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'סוג קובץ לא נתמך' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'הקובץ גדול מדי (מקסימום 10MB)' }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Auto-create bucket if it doesn't exist yet
  await ensureBucketExists(supabase);

  const ext = file.name.split('.').pop();
  const path = `${gameId}/${Date.now()}.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const mediaType = file.type.startsWith('image') ? 'image' : 'audio';

  return NextResponse.json({ url: publicUrl, mediaType });
}
