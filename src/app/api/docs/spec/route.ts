import { NextResponse } from 'next/server';
import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';
import { NORTE_INVEST_OPENAPI_SPEC } from '@/server/docs/openapi-spec';

export async function GET() {
  const ctx = await getAuthorizedContextOrNull();

  // Diretriz DevSecOps: especificação de endpoints de infraestrutura restrita a administradores e colaboradores
  if (!ctx || (ctx.actor.role !== 'admin' && ctx.actor.role !== 'collaborator')) {
    return NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: 'Acesso restrito ao Painel de Suporte, Gestão & TI da MANTFRAI.'
      },
      { status: 403 }
    );
  }

  return NextResponse.json(NORTE_INVEST_OPENAPI_SPEC, {
    headers: {
      'Cache-Control': 'no-store, max-age=0'
    }
  });
}
