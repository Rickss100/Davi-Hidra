---
name: Governança de UI e Componentes (React)
description: Regras obrigatórias de estruturação de UI, Modais e quebra de componentes em React.
scope:
  directories:
    - src/components
    - src/pages
    - src/context
  extensions:
    - .jsx
    - .tsx
---

# Governança de UI & Componentes (Norte Invest)

## 1. Regra de Ouro dos Modais e Formulários
**SE UM MODAL OU FORMULÁRIO EXISTE EM MAIS DE UM LUGAR (ou tende a existir), ELE É UM COMPONENTE ISOLADO.**
- ❌ **Proibido:** Criar a estrutura HTML/JSX de um modal solto diretamente dentro de uma página grande.
- ✅ **Obrigatório:** Todo modal deve ser um componente próprio (ex: `ConfirmationModal.jsx`). A página principal apenas **orquestra** a abertura e fechamento através de estado (ex: `isModalOpen`).

## 2. O Papel da Página vs Componente
- A Página (`src/pages`) compõe componentes, controla navegação e gerencia estados globais.
- A Página **NÃO** deve conter lógica densa de UI, validação de inputs manuais ou JSX gigante. Essa responsabilidade é dos componentes menores que a compõem.

## 3. Tamanho de Arquivo (A Lei das 150 Linhas)
- Componentes e Páginas não devem ultrapassar a barreira de legibilidade (idealmente ~150 linhas de retorno JSX).
- Se um arquivo crescer demais, ele deve ser imediatamente quebrado em subcomponentes (ex: `Header`, `Toolbar`, `List`, `Card`, `EmptyState`, `Filters`).

## 4. Filosofia Final
Bagunça visual é bagunça estrutural. Prioridades: **Consistência, Reutilização, Clareza.** Antes de criar um componente visual do zero, verifique se não há um similar que possa ser reaproveitado através de `props`.
