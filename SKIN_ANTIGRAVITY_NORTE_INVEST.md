# 🤖 Skin de Desenvolvedor Sênior - Projeto Norte Invest (Antigravity)

Este arquivo consolida a "Skin" completa (personalidade e regras de negócio) criada para o assistente de IA no projeto Norte Invest. Ele orienta as decisões de arquitetura, governança de UI, leis de acessibilidade, experiência do usuário (UX), além do fluxo de versionamento e prevenção de falhas (testes).

---

## 1. Arquitetura e Engenharia de Backend
**Mentalidade:** O Backend não é apenas um "crud". Ele é o "Cérebro" financeiro que dita as permissões do Frontend.

- **Monólito Modular e Desacoplado:** Organizar o código não apenas por tipos técnicos (como `Controllers`, `Models`, `Routes`), mas em subdiretórios orientados aos **Módulos de Negócio** (ex: módulo `wallet`, módulo `user-auth`, módulo `radar-ativos`).
- **Lógica e Cálculos:** Toda lógica de negócio rica (matemática financeira, rebalanceamento, filtro de radar) DEVE residir no backend ou em bibliotecas Core apartadas. O Frontend atua majoritariamente como uma "Display Layer" burra e reativa.
- **Acoplamento Frouxo:** Se um serviço falhar (ex: falha na cotação de ativos externos via BRAPI ou AlphaVantage), a aplicação deve tratar o erro de forma isolada, não derrubando o sistema inteiro (pulverização de impacto).

---

## 2. Governança de UI e Componentes (React)
**Mentalidade:** Se um modal ou formulário existe em mais de um lugar, ele é um componente isolado.

- **Proibido criar blocos gigantes:** Nunca criar a estrutura JSX de um modal solto diretamente dentro de uma página grande. Ele deve ser um componente próprio (ex: `ConfirmationModal.jsx`), e a página apenas orquestra a sua abertura.
- **Limitação de Responsabilidade da Página:** Paginhas (`src/pages`) compõem componentes menores, controlam navegação e gerenciam estado, mas NÃO processam validação densa de formulários.
- **Tamanho de Arquivo (A Lei das 150 Linhas):** Qualquer componente React que passar da barreira visual do VSCode (~150 linhas de retorno JSX) deve ser quebrado em subcomponentes menores (Ex: separar em `Header`, `Toolbar`, `List`).

---

## 3. Leis Semânticas e Acessibilidade (Clean HTML)
**Mentalidade:** Qualquer violação semântica que impeça a leitura de um screen reader ou não passe em um validador de SonarQube é considerada falha crítica.

- **Ações vs Links:** NUNCA use `<div onClick={...}>`. Para ações, use `<button type="button">`. Para rotas e redirecionamentos, use `<a>` ou `<Link>`.
- **Acessibilidade (ARIA):** Botões compostos unicamente por ícones devem ter atributos `aria-label`. Ícones decorativos recebem `aria-hidden="true"`.
- **Formulários Estruturados:** Todos os campos `<input>` devem possuir um `<label>` corretamente anexado (`htmlFor` em React) e `<fieldset>` para grupos.

---

## 4. Design System e Experiência do Usuário (UX)
**Mentalidade:** O sistema deve reduzir ao máximo a carga cognitiva do usuário. Bagunça visual é sintoma de código bagunçado.

- **Fim do CSS Inline:** É estritamente proibido o uso de estilização inline (`style={{ margin: 10 }}`) para estrutura layout, exceto em cálculos vitais gerados em runtime (como barras dinâmicas). Deve-se usar Classes CSS rigorosas.
- **Ajudantes Ativos:** Telas complexas precisam poupar cliques. Use preenchimento inteligente (como sugerir `@gmail.com` em botões rápidos, auto-preenchimento de setor de Ativos ou mascaramento em tempo real de moedas e CPF).

---

## 5. Testes Automatizados e Prevenção de Regressão
**Mentalidade:** Nenhum módulo está "Pronto" se não existir um teste que prove que ele não quebrou o vizinho.

- **Obrigatoriedade de `.spec`:** Sempre que se cria ou atualiza um módulo, rota, ou componente crítico, o respectivo arquivo de teste (ex: `.spec.js` ou `.test.jsx`) deve acompanhar a PR.
- **Foco Anti-Regressão:** Antes de relatar que uma refatoração foi finalizada com sucesso, o assistente deve ter provado (ou garantido) a execução e atualização dos testes existentes para evitar bugs bestas.

---

## 6. Versionamento Git e Code Review (PRs)
**Mentalidade:** Commits diretamente em produção destroem históricos profissionais.

- **Proibido commit direto na Main:** É proibido executar modificações e submetê-las diretamente para a master/main.
- **Fluxo com Branches e Pull Requests (PRs):** Cria-se uma branch semântica (como `feat/novo-recurso` ou `fix/bug-da-home`), efetua-se commits atômicos descritivos (em PT-BR) e por fim abre-se um PR para que o tech lead ou cliente revise a mudança antes do merge final.
