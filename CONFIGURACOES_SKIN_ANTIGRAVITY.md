# 🚀 Guia de Configuração do Prompt Mestre & Skill Oficial no Antigravity

Este documento explica como o **Prompt Mestre, Regras DevSecOps e a Skill Padrão Ouro** do projeto **Norte Invest** funcionam automaticamente e como levá-los para outros computadores ou outros projetos futuros.

---

## 1. Carregamento 100% Automático neste Repositório (Zero Configuração Manual)

O repositório **Davi-Hidra / Norte Invest** já está configurado no padrão nativo do **Google Antigravity 2.0**:

1. **[`AGENTS.md`](AGENTS.md) (Regra Sempre Ativa na Raiz):**
   - Carregada automaticamente em **100% das conversas** ao abrir esta pasta em qualquer computador.
   - Impõe a Stack Padrão Ouro (`Next.js 15 + TypeScript Strict + Tailwind/shadcn + PostgreSQL/Drizzle + Decimal.js + Zod + TanStack Query`), Segurança Zero-Trust (`HttpOnly` + `2FA TOTP AES-256-GCM` + Anti-IDOR) e a **Lei Anti-Trabalho Manual**.
2. **[`.agents/skills/norte-invest-padrao-ouro/SKILL.md`](.agents/skills/norte-invest-padrao-ouro/SKILL.md) (Skill Operacional sob Demanda):**
   - Descoberta automaticamente pelo Antigravity como skill especializada do workspace, contendo a matriz comparativa de frameworks (por que usar ou evitar alternativas), o checklist de reutilização de componentes (`BrandLogo`, `AssetAutocompleteInput`, `money.ts`) e o protocolo de testes (`typecheck` + `Vitest`).
3. **[`.agy/rules/`](.agy/rules/) (`01` a `07`) & [`SKIN_ANTIGRAVITY_NORTE_INVEST.md`](SKIN_ANTIGRAVITY_NORTE_INVEST.md):**
   - Documentação modular detalhada que viaja junto com o código via Git.

Ao clonar o repositório em outro PC, basta abrir a pasta no Antigravity e tudo já estará ativo!

---

## 2. Como Aplicar esta Mesma Mentalidade "Padrão Ouro & DevSecOps" em Outros Projetos (Global)

Se você quiser que o Antigravity aplique essa mesma exigência de **Segurança Máxima + Frameworks Padrão Ouro + Zero Trabalho Manual** em *qualquer novo projeto* que criar no computador:

1. Abra o arquivo global de regras do Antigravity no Windows:
   `C:\Users\SEU_USUARIO\.gemini\config\AGENTS.md` *(ou `~/.gemini/config/AGENTS.md` no Mac/Linux)*.
2. Copie para lá as seções universais do nosso [`AGENTS.md`](AGENTS.md) (Hierarquia Segurança -> Anti-Retrabalho -> Performance, Stack Padrão Ouro, Zero-Trust `HttpOnly` + `Zod` + Testes Automatizados).
3. Para reutilizar a skill em outros projetos, copie a pasta `.agents/skills/norte-invest-padrao-ouro` para `C:\Users\SEU_USUARIO\.gemini\config\skills\`.