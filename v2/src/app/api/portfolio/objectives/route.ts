import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  userObjectives,
  type AssetTargetsConfig,
  type EmergencyReserveConfig,
  type MacroAllocationConfig
} from '@/db/schema';
import { getAuthorizedContextOrNull, recordAuditLog } from '@/server/dal/auth-dal';
import { GOLD_PRESET_BRASIL, GOLD_PRESET_GLOBAL } from '@/server/engines/davi-hydra.engine';

const DEFAULT_EMERGENCY: EmergencyReserveConfig = {
  monthlyExpense: 3000,
  monthsTarget: 6,
  manualReserveBalance: 0,
  strategyMode: 'hybrid_70_30'
};

export async function PUT(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const targetUserId = ctx.portfolioOwner.id;
  const db = await getDb();

  const existingRows = await db
    .select()
    .from(userObjectives)
    .where(eq(userObjectives.userId, targetUserId))
    .limit(1);

  const current = existingRows[0];

  let nextMacro: MacroAllocationConfig =
    current?.macroAllocation ?? GOLD_PRESET_BRASIL.macroAllocation;
  let nextTargets: AssetTargetsConfig =
    current?.assetTargets ?? GOLD_PRESET_BRASIL.assetTargets;
  let nextEmergency: EmergencyReserveConfig =
    current?.emergencyConfig ?? DEFAULT_EMERGENCY;

  if (body.preset === 'brasil') {
    nextMacro = GOLD_PRESET_BRASIL.macroAllocation;
    nextTargets = GOLD_PRESET_BRASIL.assetTargets;
  } else if (body.preset === 'global') {
    nextMacro = GOLD_PRESET_GLOBAL.macroAllocation;
    nextTargets = GOLD_PRESET_GLOBAL.assetTargets;
  } else {
    if (body.macroAllocation) nextMacro = { ...nextMacro, ...body.macroAllocation };
    if (body.assetTargets) nextTargets = { ...nextTargets, ...body.assetTargets };
    if (body.emergencyConfig) nextEmergency = { ...nextEmergency, ...body.emergencyConfig };
  }

  await db
    .insert(userObjectives)
    .values({
      userId: targetUserId,
      macroAllocation: nextMacro,
      assetTargets: nextTargets,
      emergencyConfig: nextEmergency,
      updatedAt: new Date()
    })
    .onConflictDoUpdate({
      target: userObjectives.userId,
      set: {
        macroAllocation: nextMacro,
        assetTargets: nextTargets,
        emergencyConfig: nextEmergency,
        updatedAt: new Date()
      }
    });

  await recordAuditLog({
    actorUserId: ctx.actor.id,
    targetUserId,
    action: body.preset ? `OBJECTIVES_PRESET_${String(body.preset).toUpperCase()}` : 'OBJECTIVES_UPDATED'
  });

  return NextResponse.json({
    success: true,
    macroAllocation: nextMacro,
    assetTargets: nextTargets,
    emergencyConfig: nextEmergency
  });
}
