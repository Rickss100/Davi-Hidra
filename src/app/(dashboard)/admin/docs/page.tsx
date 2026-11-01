'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Code2,
  Download,
  ExternalLink,
  Lock,
  RefreshCw,
  ShieldCheck
} from 'lucide-react';
import { Badge, Button, Card, Skeleton } from '@/components/ui/primitives';

export default function AdminSwaggerDocsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    // Carrega o CSS oficial do Swagger UI
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = 'https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui.css';
    document.head.appendChild(cssLink);

    // Carrega o Bundle JS oficial do Swagger UI
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/swagger-ui-dist@5.18.2/swagger-ui-bundle.js';
    script.async = true;

    script.onload = async () => {
      if (!isMounted) return;

      try {
        // Valida se o usuário tem permissão para acessar a especificação
        const res = await fetch('/api/docs/spec');
        if (!res.ok) {
          if (res.status === 403 || res.status === 401) {
            throw new Error('Acesso restrito: você precisa de perfil Administrador ou Colaborador.');
          }
          throw new Error('Falha ao carregar a especificação OpenAPI.');
        }

        const spec = await res.json();

        // @ts-expect-error SwaggerUIBundle carregado dinamicamente via script
        if (window.SwaggerUIBundle && containerRef.current) {
          // @ts-expect-error SwaggerUIBundle
          window.SwaggerUIBundle({
            spec,
            domNode: containerRef.current,
            deepLinking: true,
            presets: [
              // @ts-expect-error SwaggerUIBundle presets
              window.SwaggerUIBundle.presets.apis,
              // @ts-expect-error SwaggerUIBundle SwaggerUIStandalonePreset
              window.SwaggerUIBundle.SwaggerUIStandalonePreset
            ],
            layout: 'BaseLayout',
            docExpansion: 'list',
            defaultModelsExpandDepth: 1,
            displayRequestDuration: true
          });
        }
        setLoading(false);
      } catch (err: unknown) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Erro ao inicializar o Swagger UI.');
          setLoading(false);
        }
      }
    };

    script.onerror = () => {
      if (isMounted) {
        setError('Falha ao carregar o motor gráfico do Swagger UI (verifique sua conexão).');
        setLoading(false);
      }
    };

    document.body.appendChild(script);

    return () => {
      isMounted = false;
      cssLink.remove();
      script.remove();
    };
  }, []);

  const handleDownloadSpec = async () => {
    try {
      const res = await fetch('/api/docs/spec');
      if (!res.ok) return;
      const data = await res.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'norte-invest-openapi-spec.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Silencioso
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Governança & Ações */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Voltar ao Painel Gestão (TI)
            </Link>
            <span className="text-slate-600">•</span>
            <Badge tone="emerald" className="text-[11px] font-bold">
              <ShieldCheck className="h-3.5 w-3.5 mr-1" />
              Sessão Zero-Trust Ativa
            </Badge>
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl flex items-center gap-2.5">
            <Code2 className="h-7 w-7 text-emerald-400" />
            Documentação Interativa de APIs (Swagger)
          </h1>
          <p className="text-xs sm:text-sm text-slate-300">
            Contrato oficial OpenAPI 3.0.3 para testes em tempo real dos motores DAVI & Hydra, autenticação e rotas corporativas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleDownloadSpec}
            className="text-xs font-bold text-slate-200"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Baixar JSON (OpenAPI)
          </Button>

          <Button
            type="button"
            variant="emerald"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-xs font-bold"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Recarregar Rotas
          </Button>
        </div>
      </div>

      {/* Alerta de Segurança e Boas Práticas */}
      <Card className="border-emerald-500/30 bg-[#061811] p-4 text-xs sm:text-sm text-slate-200 flex items-start gap-3">
        <Lock className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-emerald-300 block font-bold">
            Ambiente de Testes Autenticado:
          </strong>
          <span>
            Ao clicar em <strong className="text-white">"Try it out"</strong> e executar qualquer requisição, o Swagger utilizará automaticamente o seu cookie HttpOnly de sessão atual. Nenhuma credencial é exposta no frontend.
          </span>
        </div>
      </Card>

      {/* Mensagem de Erro de Permissão */}
      {error && (
        <div className="rounded-xl border border-rose-500/50 bg-[#1f0a10] p-6 text-center space-y-2">
          <p className="text-sm font-bold text-rose-300">{error}</p>
          <p className="text-xs text-slate-400">
            Apenas colaboradores e administradores com sessão autorizada podem visualizar este contrato de API.
          </p>
          <div className="pt-2">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                Retornar ao Painel
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Esqueleto de Carregamento */}
      {loading && !error && (
        <Card className="p-8 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-8 w-24" />
          </div>
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </Card>
      )}

      {/* Container Oficial do Swagger UI com Estilização Customizada */}
      <div
        className={`rounded-2xl border border-slate-800 bg-white p-4 sm:p-6 shadow-2xl transition-opacity duration-300 ${
          loading || error ? 'hidden' : 'block'
        }`}
      >
        <div ref={containerRef} id="swagger-ui-container" />
      </div>
    </div>
  );
}
