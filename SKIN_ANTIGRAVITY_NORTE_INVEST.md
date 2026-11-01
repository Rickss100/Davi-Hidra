# 🤖 Prompt Mestre & Skin de Engenharia Sênior — Projeto Norte Invest (Antigravity)

Este arquivo consolida o **Prompt Mestre / Skin Oficial** do assistente de IA no projeto **Norte Invest (Método DAVI & Hydra)**. Ele governa a escolha de frameworks, segurança bancária Zero-Trust (DevSecOps), prevenção de trabalho manual, arquitetura modular, governança de UI, acessibilidade, UX e fluxo Git/testes.

> **Carregamento Automático no Antigravity 2.0:** Estas diretrizes estão ativas automaticamente via [`AGENTS.md`](AGENTS.md) (sempre ativo na raiz do repositório) e via a Skill operacional [`.agents/skills/norte-invest-padrao-ouro/SKILL.md`](.agents/skills/norte-invest-padrao-ouro/SKILL.md), além das regras modulares em `.agy/rules/` (`01` a `07`).

---

## 1. Hierarquia de Decisão & Stack Padrão Ouro (Segurança + Zero Trabalho Manual)
**Mentalidade:** Para investidores de alto padrão (*Private / WealthTech*), **Confiabilidade e Segurança** são o critério nº 1 inegociável. A velocidade de entrega vem de usar **frameworks e bibliotecas auditadas padrão ouro** em vez de reinventar a roda com código manual repetitivo.

- **Next.js 15 (App Router) + TypeScript Estrito (`strict: true`, `noUncheckedIndexedAccess: true`):**
  - *Por que escolhemos:* Executa algoritmos proprietários (Método DAVI & Hydra), segredos e controle de acesso 100% no servidor, unificando API e UI com tipagem ponta a ponta.
  - *Por que descartamos alternativas inferiores para o contexto:* SPAs puras (Vite + Express solto) expõem regras no bundle JS e exigem sincronização manual de contratos; Angular é robusto, porém exige excesso de boilerplate para equipes enxutas que precisam de alta agilidade com segurança.
- **Tailwind CSS + Primitivos `shadcn/ui`:** Elimina arquivos CSS manuais extensos e conflitos globais, entregando componentes acessíveis (ARIA/teclado) prontos e padronizados.
- **PostgreSQL (Supabase / Neon + PGlite Local) + Drizzle ORM:** Integridade relacional real (`FOREIGN KEY`, `UNIQUE`), transações ACID, tipos monetários exatos (`NUMERIC(18, 2)` / `NUMERIC(18, 8)`) e queries SQL tipadas em TypeScript sem peso excessivo.
- **Matemática Financeira com `decimal.js`:** Obrigatório em 100% dos cálculos de patrimônio, preço médio ponderado de custódia, proventos e percentuais (proibido `FLOAT` ou soma float IEEE-754 pura para dinheiro).
- **Validação & Estado com `Zod` + `TanStack Query`:** Validação obrigatória na borda (APIs, `.env` fail-fast e planilhas B3 `.xlsx`) e cache/invalidação reativa no cliente (eliminando `useEffect` + `fetch` manual e `window.location.reload()`).
- **Lei Anti-Trabalho Manual:** É proibido criar scripts descartáveis de remendo (`patch-*.cjs`), SQL concatenado na mão, autenticação caseira ou validações artesanais com dezenas de `if/else` sem schema.

---

## 2. Segurança Bancária Zero-Trust (DevSecOps com Ênfase no "Sec")
**Mentalidade:** Assuma sempre que o navegador do cliente é um ambiente hostil. Toda permissão e cálculo sensível nasce e é validado no servidor.

- **Zero Tokens em `localStorage`:** Sessões exclusivamente via **Cookies `HttpOnly`, `Secure`, `SameSite=Lax`** assinados criptograficamente (`jose` HMAC-SHA256) e vinculados à tabela `user_sessions` (permitindo revogação imediata).
- **2FA via QR Code (RFC 6238 TOTP):** Compatível com Google Authenticator, Authy e Senhas do iPhone, com segredo criptografado em repouso via **`AES-256-GCM`**, códigos de emergência na ativação e botão de **Reset 2FA** auditado no painel `/admin`.
- **Anti-IDOR Sistemático (Data Access Layer — DAL):** Proibido aceitar `userId` vindo de query string, body ou header do frontend. Toda operação usa o contexto autenticado do servidor (`getAuthorizedContextOrNull()`), e o Modo Auditoria de clientes registra trilha imutável em `audit_logs`.
- **Hardening de Borda:** Headers OWASP (`X-Frame-Options: DENY`, `nosniff`, HSTS), senhas com `bcryptjs` e Rate Limiting ativo contra força bruta.

---

## 3. Arquitetura e Engenharia de Backend (Monólito Modular)
**Mentalidade:** O Backend não é apenas um "CRUD". Ele é o "Cérebro" financeiro que dita as permissões do Frontend.

- **Monólito Modular e Desacoplado:** Organizar o código em módulos orientados ao domínio de negócio (`engines`, `dal`, `importers`, `components/portfolio`, `components/security`).
- **Lógica e Cálculos no Servidor:** Toda lógica de negócio rica (matemática financeira, rebalanceamento DAVI & Hydra, Magic Number, Reserva de Emergência) DEVE residir no servidor. O Frontend atua como camada reativa de exibição.
- **Acoplamento Frouxo:** Se um serviço externo falhar (ex: Brapi ou BACEN), tratar o erro de forma isolada com fallback em cache sem derrubar o painel do investidor.

---

## 4. Governança de UI e Componentes (React)
**Mentalidade:** Se um modal, seletor ou formulário existe (ou pode existir) em mais de um lugar, ele é um componente isolado e reutilizável.

- **Proibido criar blocos gigantes:** Nunca criar a estrutura JSX de um modal ou autocomplete solto diretamente dentro de uma página grande (ex: manter `NewTransactionModal`, `TwoFactorModal` e `AssetAutocompleteInput` isolados).
- **Limitação de Responsabilidade da Página:** Páginas compõem componentes menores, controlam navegação e orquestram estado, sem carregar validação densa manual.
- **Tamanho de Arquivo (A Lei das 150 Linhas):** Qualquer componente React que ultrapassar ~150 linhas de retorno JSX deve ser quebrado em subcomponentes coesos (`Header`, `Toolbar`, `Table`, `Modal`).

---

## 5. Leis Semânticas e Acessibilidade (Clean HTML)
**Mentalidade:** Qualquer violação semântica que impeça leitura por leitores de tela ou reprove em auditoria estática é falha crítica.

- **Ações vs Links:** NUNCA use `<div onClick={...}>`. Para ações, use `<button type="button">`. Para rotas, use `<Link>` ou `<a>`.
- **Acessibilidade (ARIA):** Botões compostos apenas por ícones exigem `aria-label`. Ícones decorativos recebem `aria-hidden="true"`.
- **Formulários Estruturados & Código Limpo:** Todo `<input>` / `<select>` exige `<label htmlFor="...">`. Zero tolerância para variáveis/imports mortos ou `console.log` esquecidos.

---

## 6. Design System, Identidade Oficial e UX Ativa
**Mentalidade:** O sistema deve reduzir ao máximo a carga cognitiva do investidor.

- **Identidade Oficial Inegociável:** Manter sempre a arte oficial **NORTE INVEST — MÉTODO DAVI & HYDRA** (`BrandLogo` com `/icon.svg`).
- **Fim do CSS Inline:** Proibido `style={{...}}` estrutural (permitido apenas para cálculos dinâmicos em runtime, como larguras percentuais de barras).
- **Ajudantes Ativos que Poupam Tempo:** Campos de ativos devem sempre oferecer **lista de autocompletar (`AssetAutocompleteInput`)** mostrando código + nome completo + cotação ao digitar; campos de e-mail oferecem atalhos de domínio (`@gmail.com`, `@hotmail.com`, `@outlook.com`); moedas usam formatação padronizada BRL/USD.

---

## 7. Testes Automatizados e Verificação Anti-Regressão
**Mentalidade:** Nenhum módulo está "Pronto" sem prova automatizada de integridade.

- **Validação Dupla Obrigatória:** Toda entrega na V2 deve passar por `npm run typecheck` (`tsc --noEmit` estrito com zero erros) e `npm run test` (`Vitest`).
- **Cobertura de Regras Críticas:** Motores financeiros (`decimal.js`, preço médio, DAVI/Hydra) e segurança (`TOTP`, `AES-256-GCM`, tokens `HttpOnly`) devem manter testes `.test.ts` atualizados.

---

## 8. Versionamento Git, Ambientes Isolados e Code Review (PRs)
**Mentalidade:** Produção nunca é laboratório de testes.

- **Proibido commit direto quebrando a `main`:** Trabalhar em branches dedicadas (`v2-enterprise`, `feat/...`, `fix/...`) com commits atômicos e descritivos em PT-BR.
- **Homologação Lado a Lado:** Em grandes evoluções arquiteturais, validar o novo ambiente localmente em banco isolado até atingir 100% de paridade funcional antes do merge/transição oficial via Pull Request.
