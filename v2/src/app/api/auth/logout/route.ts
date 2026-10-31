import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { userSessions } from '@/db/schema';
import {
  CHALLENGE_2FA_COOKIE_NAME,
  SESSION_COOKIE_NAME,
  verifySessionToken
} from '@/server/session-token';
import { recordAuditLog } from '@/server/dal/auth-dal';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    const parsed = await verifySessionToken(raw);

    if (parsed?.sid) {
      const db = await getDb();
      await db
        .update(userSessions)
        .set({ revokedAt: new Date() })
        .where(eq(userSessions.id, parsed.sid));

      await recordAuditLog({
        actorUserId: parsed.uid,
        action: 'AUTH_LOGOUT'
      });
    }

    cookieStore.delete(SESSION_COOKIE_NAME);
    cookieStore.delete(CHALLENGE_2FA_COOKIE_NAME);

    return NextResponse.json({ success: true });
  } catch {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
    return NextResponse.json({ success: true });
  }
}
