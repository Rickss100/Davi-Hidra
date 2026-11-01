import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users, userSessions } from '@/db/schema';
import { env } from '@/env';
import { SESSION_COOKIE_NAME, signSessionToken } from '@/server/session-token';
import { getAuthorizedContextOrNull, recordAuditLog } from '@/server/dal/auth-dal';

export async function POST(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx || (ctx.actor.role !== 'admin' && ctx.actor.role !== 'collaborator')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const targetUserId = body.targetUserId ? Number(body.targetUserId) : null;
  const db = await getDb();

  if (targetUserId && targetUserId !== ctx.actor.id) {
    const found = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
    if (!found[0]) {
      return NextResponse.json({ error: 'USER_NOT_FOUND' }, { status: 404 });
    }

    await db
      .update(userSessions)
      .set({ impersonatedUserId: targetUserId })
      .where(eq(userSessions.id, ctx.sessionId));

    const jwt = await signSessionToken({
      sid: ctx.sessionId,
      uid: ctx.actor.id,
      uuid: ctx.actor.uuid,
      role: ctx.actor.role,
      name: ctx.actor.name,
      email: ctx.actor.email,
      impUid: targetUserId
    });

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, jwt, {
      httpOnly: true,
      secure: env.IS_PROD,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60
    });

    await recordAuditLog({
      actorUserId: ctx.actor.id,
      targetUserId,
      action: 'AUDIT_IMPERSONATION_STARTED',
      metadata: { targetEmail: found[0].email }
    });

    return NextResponse.json({ success: true, isAuditing: true });
  }

  // Encerrar Modo Auditoria
  await db
    .update(userSessions)
    .set({ impersonatedUserId: null })
    .where(eq(userSessions.id, ctx.sessionId));

  const jwt = await signSessionToken({
    sid: ctx.sessionId,
    uid: ctx.actor.id,
    uuid: ctx.actor.uuid,
    role: ctx.actor.role,
    name: ctx.actor.name,
    email: ctx.actor.email,
    impUid: null
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  });

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    action: 'AUDIT_IMPERSONATION_ENDED'
  });

  return NextResponse.json({ success: true, isAuditing: false });
}
