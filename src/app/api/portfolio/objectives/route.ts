import { NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { getDb } from '@/db';
import {
  userObjectives,
  type AssetTargetItem,
  type AssetTargetsConfig,
  type EmergencyReserveConfig,
  type MacroAllocationConfig
} from '@/db/schema';
import { getAuthorizedContextOrNull, recordAuditLog } from '@/server/dal/auth-dal';
import {
  distributeEqualTargetWeights,
  EMPTY_ASSET_TARGETS,
  MACRO_MODEL_BRASIL,
  MACRO_MODEL_GLOBAL
} from '@/server/engines/davi-hydra.engine';

const DEFAULT_EMERGENCY: EmergencyReserveConfig = {
  monthlyExpense: 3000,
  monthsTarget: 6,
  manualReserveBalance: 0,
  strategyMode: 'hybrid_70_30'
};

const targetItemSchema = z.object({
  code: z.string().trim().min(1),
  ticker: z.string().optional(),
  sector: z.string().optional(),
  target: z.number().min(0).max(100)
});

const putObjectivesSchema = z.object({
  preset: z.enum(['brasil', 'global']).optional(),
  clearTargets: z.boolean().optional(),
  toggleAsset: z
    .object({
      category: z.enum(['acoes', 'fiis', 'stocks', 'reits', 'fixed']),
      code: z.string().trim().min(1),
      sector: z.string().optional()
    })
    .optional(),
  macroAllocation: z
    .object({
      fixed: z.number().min(0).max(100),
      variable: z.number().min(0).max(100),
      brasil: z.number().min(0).max(100),
      usa: z.number().min(0).max(100),
      acoes: z.number().min(0).max(100),
      fiis: z.number().min(0).max(100),
      stocks: z.number().min(0).max(100),
      reits: z.number().min(0).max(100)
    })
    .partial()
    .optional(),
  assetTargets: z
    .object({
      acoes: z.array(targetItemSchema).optional(),
      fiis: z.array(targetItemSchema).optional(),
      stocks: z.array(targetItemSchema).optional(),
      reits: z.array(targetItemSchema).optional(),
      fixed: z.array(targetItemSchema).optional(),
      reserva: z.array(targetItemSchema).optional()
    })
    .optional(),
  emergencyConfig: z
    .object({
      monthlyExpense: z.number().min(0).optional(),
      monthsTarget: z.number().min(1).max(60).optional(),
      manualReserveBalance: z.number().min(0).optional(),
      strategyMode: z.enum(['focus_100', 'hybrid_70_30', 'hybrid_50_50']).optional()
    })
    .optional()
});

function areWeightsEqualDistribution(list: AssetTargetItem[]): boolean {
  if (list.length <= 1) return true;
  const equalized = distributeEqualTargetWeights(list);
  return list.every((item, idx) => Math.abs(Number(item.target) - equalized[idx]!.target) <= 1);
}

export async function PUT(request: Request) {
  const ctx = await getAuthorizedContextOrNull();
  if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

  const rawBody = await request.json().catch(() => ({}));
  const parsed = putObjectivesSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Dados de objetivos inválidos.' },
      { status: 400 }
    );
  }

  const body = parsed.data;
  const targetUserId = ctx.portfolioOwner.id;
  const db = await getDb();

  const existingRows = await db
    .select()
    .from(userObjectives)
    .where(eq(userObjectives.userId, targetUserId))
    .limit(1);

  const current = existingRows[0];

  let nextMacro: MacroAllocationConfig = current?.macroAllocation ?? MACRO_MODEL_BRASIL;
  let nextTargets: AssetTargetsConfig = current?.assetTargets ?? EMPTY_ASSET_TARGETS;
  let nextEmergency: EmergencyReserveConfig = current?.emergencyConfig ?? DEFAULT_EMERGENCY;
  let auditAction = 'OBJECTIVES_UPDATED';

  if (body.preset === 'brasil') {
    // Altera EXCLUSIVAMENTE as porcentagens Macro (zero recomendação/injeção de ativos)
    nextMacro = MACRO_MODEL_BRASIL;
    auditAction = 'OBJECTIVES_MACRO_MODEL_BRASIL';
  } else if (body.preset === 'global') {
    // Altera EXCLUSIVAMENTE as porcentagens Macro (zero recomendação/injeção de ativos)
    nextMacro = MACRO_MODEL_GLOBAL;
    auditAction = 'OBJECTIVES_MACRO_MODEL_GLOBAL';
  } else if (body.clearTargets) {
    nextTargets = EMPTY_ASSET_TARGETS;
    auditAction = 'OBJECTIVES_TARGETS_CLEARED';
  } else if (body.toggleAsset) {
    const { category, code, sector } = body.toggleAsset;
    const upperCode = code.toUpperCase();
    const existingList = [...(nextTargets[category] || [])];
    const wasEqual = areWeightsEqualDistribution(existingList);
    const existsIdx = existingList.findIndex((i) => i.code.toUpperCase() === upperCode);

    let updatedList: AssetTargetItem[];
    if (existsIdx >= 0) {
      const removed = existingList.filter((_, idx) => idx !== existsIdx);
      updatedList = wasEqual ? distributeEqualTargetWeights(removed) : removed;
      auditAction = `OBJECTIVES_REMOVE_ASSET_${upperCode}`;
    } else {
      const appended: AssetTargetItem[] = [
        ...existingList,
        { code, sector: sector || undefined, target: existingList.length === 0 ? 100 : 10 }
      ];
      updatedList = wasEqual ? distributeEqualTargetWeights(appended) : appended;
      auditAction = `OBJECTIVES_ADD_ASSET_${upperCode}`;
    }

    nextTargets = {
      ...nextTargets,
      [category]: updatedList
    };
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
    action: auditAction
  });

  return NextResponse.json({
    success: true,
    macroAllocation: nextMacro,
    assetTargets: nextTargets,
    emergencyConfig: nextEmergency
  });
}
