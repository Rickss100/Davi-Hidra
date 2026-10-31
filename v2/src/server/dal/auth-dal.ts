import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { getDb } from '@/db';
import { auditLogs, users, userSessions } from '@/db/schema';
import { env } from '@/env';
import {
  SESSION_COOKIE_NAME,
  CHALLENGE_2FA_COOKIE_NAME,
  signSessionToken,
  verifySessionToken
} from '@/server/session-token';

export interface SafeUserDTO {
  id: number;
  uuid: string;
  email: string;
  name: string;
  role: 'admin' | 'collaborator' | 'user';
  status: string;
  planPeriod: string;
  planExpiresAt: string | null;
  totpEnabled: boolean;
  lastLoginAt: string | null;
}

export interface AuthorizedPortfolioContext {
  sessionId: string;
  actor: SafeUserDTO;
  portfolioOwner: SafeUserDTO;
  isAuditing: boolean;
}

export function toSafeUserDTO(row: typeof users.$inferSelect): SafeUserDTO {
  return {
    id: row.id,
    uuid: row.uuid,
    email: row.email,
    name: row.name,
    role: (row.role as 'admin' | 'collaborator' | 'user') || 'user',
    status: row.status,
    planPeriod: row.planPeriod,
    planExpiresAt: row.planExpiresAt ? row.planExpiresAt.toISOString() : null,
    totpEnabled: Boolean(row.totpEnabled),
    lastLoginAt: row.lastLoginAt ? row.lastLoginAt.toISOString() : null
  };
}

export async function getRequestIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
    return h.get('x-real-ip') || '127.0.0.1';
  } catch {
    return '127.0.0.1';
  }
}

export async function recordAuditLog(params: {
  actorUserId: number | null;
  targetUserId?: number | null;
  action: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<void> {
  try {
    const db = await getDb();
    const ip = params.ipAddress ?? (await getRequestIp());
    await db.insert(auditLogs).values({
      actorUserId: params.actorUserId,
      targetUserId: params.targetUserId ?? null,
      action: params.action,
      ipAddress: ip,
      metadata: params.metadata ?? {}
    });
  } catch (err) {
    console.error('⚠️ [AuditLog Error]:', err);
  }
}

/**
 * Cria uma sessão persistida em PostgreSQL (`user_sessions`) e grava o cookie `HttpOnly`.
 */
export async function createServerSessionAndCookie(
  userRow: typeof users.$inferSelect,
  impersonatedUserId: number | null = null
): Promise<string> {
  const db = await getDb();
  const h = await headers();
  const ip = await getRequestIp();
  const userAgent = (h.get('user-agent') || 'Browser').slice(0, 255);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const inserted = await db
    .insert(userSessions)
    .values({
      userId: userRow.id,
      impersonatedUserId,
      ipAddress: ip,
      userAgent,
      expiresAt
    })
    .returning();

  const sessionId = inserted[0]?.id;
  if (!sessionId) throw new Error('Falha ao criar sessão segura no banco.');

  const jwt = await signSessionToken({
    sid: sessionId,
    uid: userRow.id,
    uuid: userRow.uuid,
    role: (userRow.role as 'admin' | 'collaborator' | 'user') || 'user',
    name: userRow.name,
    email: userRow.email,
    impUid: impersonatedUserId
  });

  const cookieStore = await cookies();
  cookieStore.delete(CHALLENGE_2FA_COOKIE_NAME);
  cookieStore.set(SESSION_COOKIE_NAME, jwt, {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60
  });

  return sessionId;
}

/**
 * Valida a sessão HttpOnly contra o PostgreSQL (`user_sessions` + `users`).
 * Retorna null se a sessão foi revogada, expirou ou a conta está inativa.
 */
export async function getAuthorizedContextOrNull(): Promise<AuthorizedPortfolioContext | null> {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const parsed = await verifySessionToken(rawToken);
  if (!parsed) return null;

  const db = await getDb();
  const now = new Date();

  const sessionRows = await db
    .select()
    .from(userSessions)
    .where(
      and(
        eq(userSessions.id, parsed.sid),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, now)
      )
    )
    .limit(1);

  const sessionRow = sessionRows[0];
  if (!sessionRow) return null;

  const actorRows = await db
    .select()
    .from(users)
    .where(eq(users.id, sessionRow.userId))
    .limit(1);

  const actorRow = actorRows[0];
  if (!actorRow || actorRow.status !== 'active') return null;

  // Verifica expiração de assinatura para investidores comuns
  if (
    actorRow.role === 'user' &&
    actorRow.planPeriod !== 'lifetime' &&
    actorRow.planExpiresAt &&
    actorRow.planExpiresAt < now
  ) {
    return null;
  }

  const actorDto = toSafeUserDTO(actorRow);

  // Modo Auditoria Server-Side (Exclusivo Admin / Collaborator)
  const isPrivileged = actorDto.role === 'admin' || actorDto.role === 'collaborator';
  if (isPrivileged && sessionRow.impersonatedUserId && sessionRow.impersonatedUserId !== actorDto.id) {
    const targetRows = await db
      .select()
      .from(users)
      .where(eq(users.id, sessionRow.impersonatedUserId))
      .limit(1);

    const targetRow = targetRows[0];
    if (targetRow) {
      return {
        sessionId: sessionRow.id,
        actor: actorDto,
        portfolioOwner: toSafeUserDTO(targetRow),
        isAuditing: true
      };
    }
  }

  return {
    sessionId: sessionRow.id,
    actor: actorDto,
    portfolioOwner: actorDto,
    isAuditing: false
  };
}

/**
 * Helper para Server Components: exige sessão válida no Postgres ou redireciona para /login.
 */
export async function requirePortfolioContext(): Promise<AuthorizedPortfolioContext> {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) {
    redirect('/login');
  }
  return ctx;
}
