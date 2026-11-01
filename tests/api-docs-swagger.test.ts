import { describe, it, expect, vi } from 'vitest';
import { NORTE_INVEST_OPENAPI_SPEC } from '../src/server/docs/openapi-spec';
import { GET } from '../src/app/api/docs/spec/route';

// Mock do módulo de autorização DAL
vi.mock('@/server/dal/auth-dal', () => ({
  getAuthorizedContextOrNull: vi.fn()
}));

import { getAuthorizedContextOrNull } from '@/server/dal/auth-dal';

describe('Documentação de APIs Swagger / OpenAPI 3.0.3 & Segurança DevSecOps', () => {
  it('deve conter uma especificação OpenAPI 3.0.3 válida e bem estruturada', () => {
    expect(NORTE_INVEST_OPENAPI_SPEC.openapi).toBe('3.0.3');
    expect(NORTE_INVEST_OPENAPI_SPEC.info.title).toContain('Norte Invest API');
    expect(NORTE_INVEST_OPENAPI_SPEC.info.version).toBe('2.0.0');
    expect(NORTE_INVEST_OPENAPI_SPEC.paths).toBeDefined();
  });

  it('deve documentar todas as rotas críticas dos motores DAVI & Hydra e Autenticação', () => {
    const paths = Object.keys(NORTE_INVEST_OPENAPI_SPEC.paths);

    expect(paths).toContain('/api/auth/login');
    expect(paths).toContain('/api/auth/logout');
    expect(paths).toContain('/api/radar');
    expect(paths).toContain('/api/portfolio/suggestions');
    expect(paths).toContain('/api/portfolio/objectives');
    expect(paths).toContain('/api/admin/users');

    // Valida se o motor Onde Aportar tem parâmetros de aporte documentados
    const suggestionsOp = NORTE_INVEST_OPENAPI_SPEC.paths['/api/portfolio/suggestions'].post;
    expect(suggestionsOp.summary).toContain('AM2O');
    const reqBodyProps = (suggestionsOp.requestBody.content['application/json'].schema as any).properties;
    expect(reqBodyProps.availableAmountBrl).toBeDefined();
    expect(reqBodyProps.reserveStrategy).toBeDefined();
  });

  it('deve rejeitar com 403 Forbidden visitantes não autenticados (DevSecOps Zero-Trust)', async () => {
    vi.mocked(getAuthorizedContextOrNull).mockResolvedValueOnce(null);

    const res = await GET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('FORBIDDEN');
  });

  it('deve rejeitar com 403 Forbidden investidores comuns sem perfil de TI/Admin', async () => {
    vi.mocked(getAuthorizedContextOrNull).mockResolvedValueOnce({
      sessionId: 'test-session-123',
      actor: { id: 10, role: 'user', name: 'Investidor Comum' } as any,
      portfolioOwner: { id: 10, role: 'user', name: 'Investidor Comum' } as any,
      isAuditing: false
    });

    const res = await GET();
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error).toBe('FORBIDDEN');
  });

  it('deve permitir acesso e retornar 200 OK com a especificação para Administradores e Colaboradores', async () => {
    vi.mocked(getAuthorizedContextOrNull).mockResolvedValueOnce({
      sessionId: 'admin-session-456',
      actor: { id: 1, role: 'admin', name: 'Admin Master' } as any,
      portfolioOwner: { id: 1, role: 'admin', name: 'Admin Master' } as any,
      isAuditing: false
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const spec = await res.json();
    expect(spec.openapi).toBe('3.0.3');
    expect(spec.info.title).toContain('Norte Invest API');
  });
});
