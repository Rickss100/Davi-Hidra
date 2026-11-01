---
name: Stack Padrão Ouro, DevSecOps Zero-Trust e Prevenção de Trabalho Manual
description: Define a hierarquia de escolha de frameworks, segurança bancária Zero-Trust e proibição de código artesanal repetitivo.
scope:
  directories:
    - v2/
    - src/
---

# Regra 07: Stack Padrão Ouro, DevSecOps & Lei Anti-Trabalho Manual

## 1. Hierarquia Inegociável de Decisão Técnica
1. **Confiabilidade & Segurança Bancária (Zero-Trust):** Critério nº 1 absoluto. Nenhuma decisão de atalho ou micro-otimização pode abrir mão da segurança de dados patrimoniais.
2. **Eliminação de Trabalho Manual (Padrão Ouro Auditado):** Nunca reinventar a roda com scripts caseiros quando existe solução madura, tipada e auditada pela indústria. Poupar tempo com engenharia limpa e reutilizável.
3. **Performance & Escalabilidade:** Otimizar renderização, cache e queries usando recursos nativos do framework (Server Components, índices SQL, cache reativo).

## 2. Stack Oficial Padrão Ouro (Consolidada após Análise Arquitetural)
- **Framework Full-Stack:** **Next.js (App Router) + TypeScript Estrito (`strict: true`, `noUncheckedIndexedAccess: true`)**.
  - *Motivo:* Mantém propriedade intelectual (Método DAVI & Hydra), chaves de API e regras de permissão 100% no servidor, superior a SPAs puras (onde regras vazam no bundle do navegador) e mais ágil/produtivo que Angular para evolução contínua com alta segurança.
- **UI & Design System:** **Tailwind CSS + Primitivos `shadcn/ui`**.
  - *Motivo:* Elimina folhas CSS manuais gigantes e inline styles, entregando acessibilidade ARIA, foco por teclado e consistência Private Banking pronta de fábrica.
- **Banco de Dados & ORM:** **PostgreSQL (Supabase / Neon em nuvem + PGlite local) + Drizzle ORM**.
  - *Motivo:* Integridade relacional estrita (`FOREIGN KEY`, `UNIQUE`), transações ACID, tipos monetários exatos (`NUMERIC(18, 2)` / `NUMERIC(18, 8)`) e queries SQL 100% tipadas em TypeScript sem peso excessivo.
- **Matemática Financeira:** **`decimal.js`** obrigatório para qualquer cálculo monetário, preço médio ponderado de custódia, dividendos e percentuais (proibido `number` float puro para dinheiro).
- **Validação de Fronteira:** **`Zod`** obrigatório em 100% dos payloads de API, variáveis de ambiente (`env.ts` fail-fast) e importadores de planilhas (`.xlsx` / `.csv`).
- **Estado Assíncrono no Cliente:** **TanStack Query (`@tanstack/react-query`)** para cache, invalidação automática e fim de `useEffect` + `fetch` manual repetitivo ou `window.location.reload()`.

## 3. Protocolo DevSecOps Zero-Trust Obrigatório
- **Zero Tokens em `localStorage`:** Sessões exclusivamente via **Cookies `HttpOnly`, `Secure`, `SameSite=Lax`** assinados (`jose` HMAC-SHA256) com controle de revogação no banco (`user_sessions`).
- **Autenticação 2FA TOTP (RFC 6238 via QR Code):** Segredos criptografados em repouso com **`AES-256-GCM`**, códigos de recuperação e reset administrativo auditado.
- **Anti-IDOR via Data Access Layer (DAL):** Jamais confiar em `userId` enviado pelo cliente. Toda query filtra pelo escopo autenticado no servidor (`getAuthorizedContextOrNull()`) e grava operações críticas em `audit_logs`.
- **Proteção de Borda:** Headers OWASP (`X-Frame-Options: DENY`, `nosniff`, HSTS), senhas com `bcryptjs` e Rate Limiting em autenticação e rotas sensíveis.

## 4. Proibição de Excesso de Trabalho Manual
- ❌ **Proibido:** Criar scripts avulsos de remendo (`patch-*.cjs`), concatenar SQL manualmente, validar formulários com `if/else` gigantes sem `Zod`, gerenciar estado de servidor na mão ou deixar campos de código de ativo sem lista de autocompletar.
- ✅ **Obrigatório:** Compor sobre bibliotecas auditadas, centralizar componentes reutilizáveis e validar toda entrega com `npm run typecheck` (`tsc --noEmit`) + `npm run test` (`Vitest`).
