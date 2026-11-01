---
name: norte-invest-padrao-ouro
description: >-
  Guia mestre de engenharia, seleção de frameworks, segurança DevSecOps Zero-Trust,
  precisão financeira e prevenção de trabalho manual do projeto Norte Invest (Método DAVI & Hydra).
  Ative esta skill ao planejar novas funcionalidades, avaliar bibliotecas/frameworks,
  criar rotas/telas, revisar segurança ou refatorar módulos do sistema.
---

# Skill Mestre — Norte Invest Enterprise (Padrão Ouro & DevSecOps)

Use este runbook para garantir máxima segurança bancária, zero retrabalho manual e velocidade de desenvolvimento institucional.

---

## 1. Racional de Frameworks (Por que usamos esta Stack e quando evitar alternativas)

Sempre que precisar evoluir o sistema ou escolher uma ferramenta, siga a decisão arquitetural homologada do projeto:

| Camada | Padrão Ouro Escolhido | Por que vence (Segurança + Agilidade) | O que EVITAR e Por quê |
| :--- | :--- | :--- | :--- |
| **Aplicação & API** | **Next.js 15 (App Router) + TypeScript Strict** | Mantém segredos e os algoritmos do Método DAVI & Hydra 100% no servidor; unifica frontend e backend tipados sem CORS frágil. | **SPA pura (Vite + Express solto):** expõe regras no bundle JS e exige sincronia manual de contratos.<br>**Angular:** seguro, porém verboso demais (boilerplate pesado) para iteração rápida de produto enxuto. |
| **UI & Estilização** | **Tailwind CSS + `shadcn/ui`** | Componentes acessíveis (ARIA/teclado), zero conflito global de CSS, altíssima velocidade sem escrever CSS manual repetitivo. | **CSS puro por página (`*.css`) ou CSS inline:** gera regressão visual, excesso de código manual e baixa padronização. |
| **Banco & ORM** | **PostgreSQL (Supabase / PGlite) + Drizzle ORM** | `NUMERIC(18,2)` exato, `JSONB` validado, FKs reais, transações ACID e SQL tipado em TypeScript com zero overhead em serverless. | **SQLite em arquivo solto / SQL concatenado na mão:** risco de perda em deploy efêmero, falta de tipagem estrita e erros silenciosos. |
| **Matemática** | **`decimal.js` (`src/lib/money.ts`)** | 28 dígitos de precisão decimal (`ROUND_HALF_UP`), eliminando desvios de centavos em custódia, PM fiscal e dividendos. | **`number` nativo JS (`0.1 + 0.2`):** gera divergência financeira em auditoria de carteiras de alto patrimônio. |
| **Validação & Estado** | **`Zod` + `TanStack Query`** | Valida contratos na borda (API/Env/XLSX) em 1 linha e gerencia cache/loading/invalidação sem `useEffect` manual. | **Validação manual com `if/else` ou `window.location.reload()`:** verboso, propenso a bugs e degrada a experiência Private Banking. |

---

## 2. Checklist Obrigatório antes de Escrever Código (Anti-Trabalho Manual)

1. **Já existe primitivo ou biblioteca instalada no projeto?**
   - Para inputs de ativos B3/EUA/Renda Fixa: reutilize SEMPRE [`AssetAutocompleteInput`](../../../v2/src/components/portfolio/asset-autocomplete-input.tsx) (código + nome completo + cotação em lista).
   - Para identidade visual: reutilize SEMPRE [`BrandLogo`](../../../v2/src/components/ui/brand-logo.tsx) (`NORTE INVEST — MÉTODO DAVI & HYDRA` com `/icon.svg`).
   - Para botões, cards, selects, badges e tabelas: reutilize [`primitives.tsx`](../../../v2/src/components/ui/primitives.tsx).
   - Para valores monetários e preço médio: reutilize [`money.ts`](../../../v2/src/lib/money.ts).
2. **A regra de negócio está no servidor?**
   - Cálculos de rebalanceamento, distância AM2O, Reserva de Emergência e Magic Number pertencem a [`davi-hydra.engine.ts`](../../../v2/src/server/engines/davi-hydra.engine.ts) e [`portfolio.service.ts`](../../../v2/src/server/engines/portfolio.service.ts), nunca dentro de páginas React.
3. **A rota está blindada por Zero-Trust?**
   - Toda rota de API privada deve iniciar obtendo o contexto via [`getAuthorizedContextOrNull()`](../../../v2/src/server/dal/auth-dal.ts), validar o body com `Zod` e registrar mutações sensíveis via `recordAuditLog()`.

---

## 3. Protocolo de Validação de Entrega (Definition of Done)

Ao concluir qualquer alteração na pasta `v2/`:

1. Executar checagem estrita de tipos:
   ```powershell
   npm run typecheck
   ```
2. Executar suíte anti-regressão (`Vitest`):
   ```powershell
   npm run test
   ```
3. Se uma nova regra financeira ou de segurança foi criada, adicionar/atualizar o teste correspondente em `v2/tests/*.test.ts`.
4. Manter commits atômicos em PT-BR na branch de trabalho (nunca commitar direto na `main` sem homologação).
