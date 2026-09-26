---
name: Arquitetura Monólito Modular
description: Define o padrão arquitetural de Monólito Modular para o projeto Norte Invest.
scope:
  directories:
    - src/
---

# Diretrizes de Arquitetura — Monólito Modular

## 1. Princípio Fundamental
O sistema **Norte Invest** opera sob a arquitetura de **Monólito Modular**. Isso significa que a aplicação compartilha uma única unidade de implantação (deploy) e repositório, garantindo simplicidade operacional, mas é **internamente dividida em módulos lógicos e independentes**, com limites rígidos de domínio, preparando o terreno para uma futura extração para microsserviços caso a operação ganhe escala massiva.

## 2. Limites de Domínio (Bounded Contexts)
A separação de responsabilidades é inegociável:
- **Backend:** Rotas, Controladores e Serviços devem ser agrupados por domínio de negócio (ex: `users`, `objectives`, `resumo`, `transactions`). 
- **Acesso a Dados:** Um domínio **nunca** deve fazer requisições diretas ao banco de dados acessando as tabelas de outro domínio. Se o módulo de `Resumo` precisar de dados de `Usuários`, ele deve importar e invocar o `UserService`, jamais rodar um `SELECT * FROM users`.
- **Acoplamento Frouxo:** Se um serviço falhar (ex: falha na cotação de ativos externos), a aplicação deve tratar o erro de forma isolada, não derrubando o cadastro ou o painel do usuário (pulverização de impacto).

## 3. Frontend (React)
- O Frontend também reflete essa arquitetura agrupando componentes por **Features** (módulos lógicos) antes de agrupá-los por tipo técnico.
- Módulos devem exportar interfaces claras e não vazar lógica de negócio para a camada de visualização (UI).
