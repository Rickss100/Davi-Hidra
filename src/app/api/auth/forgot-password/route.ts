import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import { users } from '@/db/schema';
import { checkRateLimit } from '@/server/rate-limit';
import { getRequestIp, recordAuditLog } from '@/server/dal/auth-dal';

export async function POST(request: Request) {
  const ip = await getRequestIp();
  const limit = checkRateLimit(`forgot:${ip}`, 5, 15 * 60 * 1000);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'TOO_MANY_REQUESTS', message: 'Aguarde alguns minutos antes de tentar novamente.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const email = String(body.email || '').trim();

  if (email) {
    const db = await getDb();
    const found = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const userRow = found[0];

    if (userRow) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await db
        .update(users)
        .set({ resetTokenHash: tokenHash, resetExpiresAt: expiresAt, updatedAt: new Date() })
        .where(eq(users.id, userRow.id));

      await recordAuditLog({
        actorUserId: userRow.id,
        action: 'AUTH_PASSWORD_RESET_REQUESTED',
        ipAddress: ip
      });
    }
  }

  // Resposta uniforme anti-enumeração e sem vazamento de token na rede
  return NextResponse.json({
    success: true,
    message:
      'Se o e-mail estiver cadastrado em nossa base Private, as instruções de redefinição foram registradas.'
  });
}
