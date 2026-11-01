# Diretrizes Mestras de Engenharia — Norte Invest (Antigravity Rules)

Estas regras são carregadas automaticamente pelo Antigravity em todo o repositório **Norte Invest (Método DAVI & Hydra)** e têm prioridade máxima em qualquer criação, manutenção ou refatoração de código.

## 1. Hierarquia de Decisão & Stack Padrão Ouro (Anti-Retrabalho)
- **Prioridade Inegociável:** `1º Segurança & Confiabilidade Bancária (Zero-Trust)` -> `2º Eliminação de Trabalho Manual (Frameworks & Bibliotecas Auditadas)` -> `3º Performance & Escalabilidade`.
- **Stack Oficial (V2 Enterprise):**
  - **Core Full-Stack:** `Next.js 15 (App Router)` + `TypeScript Estrito (strict: true, noUncheckedIndexedAccess: true)`. Propriedade intelectual (algoritmos DAVI & Hydra) e segredos rodam **100% no servidor** (nunca expostos no bundle JS do cliente).
  - **UI & Acessibilidade:** `Tailwind CSS` + primitivos `shadcn/ui`. Proibido CSS inline (`style={{...}}`, salvo cálculos dinâmicos em runtime) e proibido criar folhas CSS gigantes manuais quando classes utilitárias e variantes tipadas resolvem em segundos.
  - **Persistência & Precisão Monetária:** `PostgreSQL (Supabase / PGlite)` + `Drizzle ORM` com colunas `NUMERIC(18, 2)` / `NUMERIC(18, 8)` + biblioteca **`decimal.js`** para toda aritmética financeira (proibido `FLOAT`/`REAL` ou soma float IEEE-754 pura para dinheiro).
  - **Validação & Estado:** **`Zod`** obrigatório na entrada de todas as rotas de API, importadores B3 e variáveis de ambiente (`src/env.ts`); **`TanStack Query`** para estado assíncrono e mutações no cliente (evitando `useEffect` + `fetch` manual e `window.location.reload()`).
- **Lei Anti-Trabalho Manual ("Compose, Don't Reinvent"):**
  - É terminantemente **proibido** criar scripts temporários de remendo (`patch-*.cjs`), parsers improvisados sem schema, autenticação caseira ou validações artesanais repetitivas. Utilize sempre os módulos centrais tipados do projeto.

## 2. Segurança Zero-Trust & DevSecOps
- **Zero Tokens em `localStorage`:** Autenticação exclusivamente via **Cookies `HttpOnly`, `Secure`, `SameSite=Lax`** (`jose` HMAC-SHA256) vinculados à tabela `user_sessions` com revogação real.
- **2FA via QR Code (RFC 6238 TOTP):** Segredos TOTP sempre criptografados em repouso com **`AES-256-GCM`**, com suporte a códigos de emergência e reset administrativo auditado.
- **Anti-IDOR via DAL (`auth-dal.ts`):** Nenhuma rota pode confiar em `userId` enviado pelo frontend. Todo acesso a carteira, notas ou transações deriva exclusivamente do contexto autenticado no servidor e registra ações sensíveis/auditorias em `audit_logs`.
- **Hardening de Borda:** Headers OWASP (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Strict-Transport-Security`), senhas com `bcryptjs` e Rate Limiting ativo em rotas públicas.

## 3. Arquitetura Monólito Modular & Governança de UI
- **Módulos por Domínio:** Separar motores de negócio (`src/server/engines`), camada de acesso a dados (`src/server/dal`), importadores (`src/server/importers`) e componentes visuais reutilizáveis (`src/components/<dominio>`). O Frontend atua apenas como camada reativa de exibição.
- **Isolamento de Modais e Componentes:** Nunca embutir JSX pesado de modais ou seletores complexos diretamente dentro de uma página. Extraia em componente dedicado (ex: `NewTransactionModal`, `AssetAutocompleteInput`) respeitando o teto de ~150 linhas de JSX por componente.
- **Identidade Visual & UX Ativa:** Preservar a arte oficial **Norte Invest — Método DAVI & Hydra** (`BrandLogo` com `/icon.svg`) e poupar cliques do investidor com autocompletar em lista de ativos (código + nome completo + cotação), atalhos de domínio de e-mail e preenchimento inteligente.

## 4. Leis Semânticas, Qualidade, Testes & Git
- **HTML Semântico e ARIA:** Jamais usar `<div onClick>` ou `<span onClick>`. Ação usa `<button type="button">`; navegação usa `<Link>` ou `<a>`. Botões só com ícone exigem `aria-label`; todo campo de formulário exige `<label htmlFor="...">`.
- **Verificação Obrigatória Anti-Regressão:** Nenhuma entrega crítica é concluída sem validar `npm run typecheck` (`tsc --noEmit` zero erros) e testes automatizados `Vitest` (`npm run test`). Remova imports mortos e `console.log` de debug.
- **Governança Git & Ambientes:** Proibido commitar direto na `main` sem validação prévia. Trabalhar em branch dedicada (ex: `v2-enterprise`, `feat/...`), com commits atômicos em PT-BR e validação local isolada antes da transição para produção.
