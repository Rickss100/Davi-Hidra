import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { getDb } from '@/db';
import { auditLogs, users } from '@/db/schema';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';

export async function GET() {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx || (ctx.actor.role !== 'admin' && ctx.actor.role !== 'collaborator')) {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  const db = await getDb();
  const [logs, allUsers] = await Promise.all([
    db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(80),
    db.select({ id: users.id, name: users.name, email: users.email }).from(users)
  ]);

  const userMap = new Map(allUsers.map((u) => [u.id, `${u.name} (${u.email})`]));

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      action: l.action,
      actorLabel: l.actorUserId ? userMap.get(l.actorUserId) || `ID #${l.actorUserId}` : 'Sistema',
      targetLabel: l.targetUserId ? userMap.get(l.targetUserId) || `ID #${l.targetUserId}` : null,
      ipAddress: l.ipAddress,
      metadata: l.metadata,
      createdAt: l.createdAt.toISOString()
    }))
  });
}
