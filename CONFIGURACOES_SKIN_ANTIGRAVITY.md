# 🚀 Guia de Configuração da 'Skin' do Antigravity (Outros PCs)

Este documento explica como transferir a personalidade, regras de arquitetura e o comportamento (A 'Skin') que criamos para o Norte Invest para qualquer outro computador rodando o Google Antigravity.

Existem duas formas de fazer isso: a nível de **Projeto** (recomendado para quem vai trabalhar no Davi-Hidra) ou a nível **Global** (se quiser que a IA aja assim em *qualquer* outro projeto que você criar).

---

## Opção 1: Configuração Local (Por Projeto) - RECOMENDADO

Se o objetivo é programar no repositório **Davi-Hidra** no outro computador, você não precisa fazer quase nada! O Antigravity tem o conceito de 'Progressive Disclosure' e lê automaticamente as regras de dentro das pastas do repositório.

1. Clone o repositório \Davi-Hidra\ no novo PC.
2. Abra o Antigravity na raiz desse projeto.
3. O Antigravity detectará automaticamente a pasta interna com as regras de Markdown (atualmente na pasta \.agy/rules\ ou \.agents/rules\) e carregará todas as 6 regras que criamos:
   - Monólito Modular
   - Governança de UI React
   - Leis Semânticas (Acessibilidade)
   - Design System UX
   - Testes Automatizados (Anti-regressão)
   - Fluxo de Git (Pull Requests)

Nesse formato, a 'Skin' viaja junto com o código via Git!

---

## Opção 2: Configuração Global (Aplica a 'Skin' em qualquer projeto do novo PC)

Se você quer que o Antigravity no outro computador utilize a mesma mentalidade de 'Pair Programmer Sênior' para *outros* projetos que não sejam o Davi-Hidra, você deve instalar a Skin na pasta global do sistema operacional.

### No Windows:
1. Copie todos os arquivos \.md\ de regras (01 ao 06).
2. No novo PC, navegue até a pasta de configuração global do Antigravity:
   \C:\Users\SEU_USUARIO\.gemini\config\rules\ 
   *(Se a pasta \ules\ não existir, você pode criá-la).*
3. Cole os arquivos ali dentro.
4. Reinicie o Antigravity no novo PC.

### No Mac/Linux:
1. Copie os arquivos de regras.
2. Cole no diretório global:
   \~/.gemini/config/rules/\`n3. Reinicie o Antigravity.

---

## Como essas regras funcionam sob o capô?
O Antigravity usa um sistema de prioridade de injeção de contexto. Quando você abre um chat, ele procura configurações Globais primeiro e, depois, sobrepõe com as configurações Locais do Workspace (sua pasta de projeto). Os arquivos de regras agem como 'System Prompts' que governam as decisões arquiteturais da IA sem que você precise ficar repetindo os comandos.