# Regras de Frontend — Meu Vidraceiro

Estas regras são de aplicação obrigatória para qualquer alteração ou novo desenvolvimento em qualquer módulo do sistema (orçamento, financeiro, materiais, obra, etc), por qualquer pessoa da equipe ou por Claude. Elas existem porque a falta de padrão nos módulos existentes (ex: pré-orçamento) já gerou inconsistência visual e dificuldade de manutenção. Não repetir isso no módulo financeiro nem nos próximos.

## 1. CSS

- **Nunca usar CSS inline** (atributo `style="..."` no HTML ou `[style.x]`/`[ngStyle]` no Angular), exceto para valores verdadeiramente dinâmicos calculados em runtime (ex: posição de um elemento arrastável) que não podem ser expressos como classe.
- **Priorizar classes do Bootstrap / ng-bootstrap** já disponíveis (grid, spacing utilities, `d-flex`, `text-*`, `btn`, componentes ng-bootstrap como modal, tooltip, dropdown, etc) antes de escrever CSS novo.
- **Quando for necessário criar um estilo novo**, avaliar primeiro se ele deve ser **global** (`src/styles.scss` ou uma classe utilitária reaproveitável) em vez de ficar preso ao `.scss` de um componente específico — especialmente se esse estilo tem chance de ser útil em outra tela. Estilo local de componente só quando for algo realmente específico daquele componente e não fizer sentido em nenhum outro lugar.
- Seguir sempre a paleta de cores, tipografia e tokens definidos em `DESIGN.md` (cores por módulo, contraste mínimo 4.5:1, etc) — não introduzir cor/fonte fora do sistema.
- **Cantos arredondados: padrão é `rounded-3` do Bootstrap** (`0.5rem`/`8px`) em cards, botões e inputs. Usar sempre a classe utilitária (`rounded`, `rounded-0` a `rounded-5`, `rounded-circle`, `rounded-pill`) — nunca `border-radius` customizado solto em `.scss` de componente ou inline. Se algum caso precisar de uma curvatura fora da escala padrão do Bootstrap (0 a `rounded-5`), estender o mapa `$utilities` no tema global (ex: um novo `rounded-6`), nunca inventar um valor pontual isolado.

## 2. HTML semântico

O elemento é escolhido pela **função**, nunca pela aparência. Ação é `<button>`, navegação é `<a href>`, título é `h1`–`h6` na ordem da hierarquia da página. Tamanho e cor são classe.

As regras completas, com os exemplos e os números medidos neste repositório, estão em **`leisSemanticasParaEvitarRetrabalhos.md`** — leia antes de escrever HTML. Referência de qual elemento serve para quê: <https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements>.

Isso deixou de ser preferência estética quando a migração para **Capacitor** entrou no caminho: o VoiceOver do iOS navega pela árvore de acessibilidade, não pelo que está pintado na tela. `<div>` com cara de botão e `<p class="h4">` não existem para ele, e a revisão da Apple cobra.

## 3. Componentização

Regras completas — modais, tamanho de template, o que uma tela pode fazer, checklist de PR — em **`UI-COMPONENTS-GOVERNANCE.md`**.

- **Priorizar a criação/uso de componentes reutilizáveis** em vez de copiar e colar HTML/lógica entre páginas. Se um bloco de UI (tabela, card, filtro, formulário) já existe em outro módulo ou está prestes a ser duplicado pela segunda vez, extrair para `src/app/shared/components` (ou pasta `components`/`componentes` do próprio módulo, se for específico dele).
- Antes de implementar algo novo, verificar se já existe um componente equivalente em `src/app/shared/components` ou nos outros módulos (`aplicacao/*/components`) que possa ser reaproveitado ou generalizado, em vez de recriar do zero.

## 4. Checklist final (obrigatório antes de dar como concluída qualquer alteração de UI)

Ao terminar qualquer tarefa que toque em tela/layout, revisar:

1. **Padronização de layout** — a tela segue o mesmo padrão de espaçamento, cards, botões e cores definidos em `DESIGN.md` e usado nos demais módulos?
2. **Alinhamento** — elementos alinhados corretamente (grid/flex do Bootstrap, sem "gambiarra" de margin/padding manual para ajustar posição)?
3. **Responsividade** — testar visualmente em três larguras: **web (desktop)**, **tablet** e **mobile**, garantindo que nada quebra, sobrepõe ou fica cortado.
4. **Semântica e componentização** — elementos certos para a função e nada de modal/HTML solto na tela. Ver `leisSemanticasParaEvitarRetrabalhos.md` e `UI-COMPONENTS-GOVERNANCE.md`.
5. **`npm run gate`** — mede o que mudou contra a develop e reprova regressão de bundle ou issue nova nas linhas alteradas. Ver `perf/README.md`.

Nenhuma tarefa de UI deve ser considerada finalizada sem passar por esse checklist.
