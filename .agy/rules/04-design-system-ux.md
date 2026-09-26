---
name: Design System e Experiência do Usuário (UX)
description: Impõe o rigor do Design System, proíbe CSS inline e detalha micro-interações de UX.
scope:
  directories:
    - src/
  extensions:
    - .jsx
    - .tsx
    - .css
---

# Design System e UX Avançada

## 1. CSS e Estilização
- ❌ **Proibido usar CSS Inline.** Jamais use `style={{ margin: 10, color: 'red' }}` exceto para valores verdadeiramente dinâmicos calculados em tempo real (ex: barras de progresso ou posições X/Y absolutas).
- ✅ **Priorize Classes Nativas.** Use sempre as classes do framework CSS estabelecido no projeto para manter o design system coeso. Se uma nova regra for necessária, declare no arquivo `.css` central ou no module do componente.

## 2. Identidade Visual e Consistência
- O Design System da Norte Invest exige layouts densos, alto contraste e seriedade estrutural.
- Não invente bordas arredondadas aleatórias, sombras extremas ou cores fora da paleta do projeto (ex: mantenha o Azul Trust, Verde de Aportes, etc). Siga o que já está renderizado no projeto para manter a interface como uma única obra.

## 3. Micro-interações e Usabilidade de Excelência (Diretriz UX)
A interface deve facilitar a vida do usuário ativamente:
- **Encurtadores e Preenchimento Inteligente:** Campos repetitivos ou previsíveis devem ajudar o usuário. Exemplo prático: no modal de login ou cadastro, campos de e-mail podem sugerir domínios frequentes (`@gmail.com`, `@hotmail.com`) com um clique.
- **Mascaramento:** Campos de dinheiro (R$), telefone e CPF sempre devem aplicar formatação visual limpa durante a digitação.
- O sistema deve prevenir o erro humano reduzindo a carga cognitiva (menos digitação inútil, menos cliques desnecessários).
