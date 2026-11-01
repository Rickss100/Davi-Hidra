import { NextResponse } from 'next/server';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';

export async function GET() {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }
  return NextResponse.json(ctx);
}
