import { NextResponse } from 'next/server';
import { getAuthorizedContextOrNull, recordAuditLog } from '@/server/dal/auth-dal';
import { importB3FilesForUser } from '@/server/importers/b3-xlsx.importer';

export async function POST(request: Request) {
  try {
    const ctx = await getAuthorizedContextOrNull();
    if (!ctx) return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });

    const formData = await request.formData();
    const files = formData.getAll('files');
    const buffers: ArrayBuffer[] = [];

    for (const entry of files) {
      if (entry instanceof File && entry.name.toLowerCase().endsWith('.xlsx')) {
        buffers.push(await entry.arrayBuffer());
      }
    }

    if (buffers.length === 0) {
      return NextResponse.json(
        { error: 'NO_VALID_FILES', message: 'Selecione ao menos um arquivo .xlsx exportado da B3.' },
        { status: 400 }
      );
    }

    const report = await importB3FilesForUser(ctx.portfolioOwner.id, buffers);

    await recordAuditLog({
      actorUserId: ctx.actor.id,
      targetUserId: ctx.portfolioOwner.id,
      action: 'PORTFOLIO_B3_IMPORTED',
      metadata: { ...report, isAuditing: ctx.isAuditing }
    });

    return NextResponse.json({
      success: true,
      report
    });
  } catch (err) {
    console.error('❌ [POST /api/portfolio/import-b3]:', err);
    return NextResponse.json(
      { error: 'IMPORT_FAILED', message: 'Falha ao processar planilhas da B3.' },
      { status: 500 }
    );
  }
}
