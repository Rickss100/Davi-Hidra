---
name: Leis Semânticas e Acessibilidade
description: Garante que o JSX/HTML gerado seja acessível, passe no SonarQube e evite retrabalho semântico.
scope:
  directories:
    - src/components
    - src/pages
  extensions:
    - .jsx
    - .tsx
---

# Diretrizes de Conformidade Estrita (Semântica e Acessibilidade)

Qualquer violação destas regras é considerada uma falha crítica. O HTML gerado deve ser "Clean" e perfeito para leitores de tela e auditorias na primeira tentativa.

## 1. Elementos Interativos Nativos
- ❌ **JAMAIS** use `<div onClick={...}>`, `<span onClick={...}>` ou `<i onClick={...}>`.
- ✅ **Obrigatório:** Ação é `<button type="button" onClick={...}>`. Navegação é `<a>` ou `<Link>`.
- Isso garante suporte nativo a navegação por teclado (Tab/Enter/Espaço) e acessibilidade real.

## 2. Acessibilidade (ARIA)
- Todo botão que contenha apenas ícones e nenhum texto visível **deve** ter um `aria-label` descritivo. Ex: `<button aria-label="Editar item"><IconEdit /></button>`.
- Ícones puramente decorativos devem ter `aria-hidden="true"`.

## 3. Hierarquia de Títulos (H1 a H6)
- O nível do título é a **posição lógica na hierarquia da página**, NUNCA o tamanho desejado da fonte.
- O tamanho visual deve ser controlado por classes CSS, não pela tag HTML. Não pule níveis lógicos (não vá de `H2` direto para `H5` apenas pela estética).

## 4. Formulários
- Todo `input`, `select` e `textarea` deve ter um `<label>` explicitamente associado usando `htmlFor` (em React) ou estar encapsulado semânticamente. 
- Use `<fieldset>` e `<legend>` para grupos lógicos (ex: grupos de radio buttons).

## 5. Limpeza de Código Typescript/Javascript
Zero tolerância para "code smells":
- Remova todas as variáveis e imports não utilizados.
- Remova todos os `console.log` de debug antes de finalizar a implementação.
- Não deixe código comentado/morto.
