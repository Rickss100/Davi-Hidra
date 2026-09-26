# UI & COMPONENTS GOVERNANCE — MEU VIDRACEIRO (zemtweb)

Sempre que responder ao usuário sobre UI, componentes, modais etc., **responda em português do Brasil**.

Este documento define as **regras obrigatórias de UI, Modais e Componentização** do frontend
(`zemtweb`, Angular 17 + Bootstrap 4.4.1). Serve para impedir HTML solto, duplicação visual e quebra do
padrão — o mesmo problema que gerou inconsistência no módulo de pré-orçamento (ver `CLAUDE.md`).

> Existia apenas no `zemtadm`, marcado como "espelhado do zemtweb" — o espelho era a única cópia.
> Trazido de volta com os números e exemplos deste repositório. Mantenha os dois em sincronia.
> Ver também `leisSemanticasParaEvitarRetrabalhos.md`.

❗ QUALQUER AGENTE QUE CRIAR HTML FORA DESSE PADRÃO ESTÁ EM VIOLAÇÃO.

**Semântica é engenharia, não enfeite.** Um `<p>` estilizado como botão continua sendo `<p>` (sem foco,
sem teclado, sem comportamento nativo). `<a>`, `<button>`, `<input>` têm comportamentos que o CSS não
replica (ex.: teclado numérico no mobile). Fazer certo na primeira vez é mais barato que refatorar —
e com **Capacitor** no caminho, o VoiceOver do iOS cobra o que o CSS disfarça.

---

## PRINCÍPIO FUNDAMENTAL

❌ **PROIBIDO**
- Criar modal diretamente dentro de uma tela grande (inline)
- Duplicar HTML de modais/cards em telas diferentes
- Copiar/colar estrutura visual "parecida" em vários lugares
- Template gigante. Estado real medido aqui, como dívida de legado a **não** repetir:

  | Linhas | Template |
  |---|---|
  | 3.701 | `obra-mod/lista/lista.component.html` |
  | 2.249 | `projetos/meus-projetos/form-meus-projetos` |
  | 2.009 | `obra-mod/componentes/projeto-selecionado` |
  | 1.873 | `financeiro2/pages/progress` |
  | 1.437 | `obra-mod/componentes/esquadria-selecionada` |

  O `lista.component.html` tem 35 `<ng-template>` de modal dentro dele. É exatamente o que esta regra
  existe para impedir.

✅ **OBRIGATÓRIO**
- Todo modal é um **componente reutilizável**
- A tela apenas **orquestra** abertura/fechamento (via flag/estado ou serviço)
- Um bloco visual repetido = **um componente parametrizado** — antes de criar algo novo, ver se já
  existe equivalente em `src/app/shared/components`, `src/app/components/` ou nos outros módulos

---

## REGRA DE OURO DOS MODAIS

> **SE UM MODAL EXISTE EM MAIS DE UM LUGAR (ou tende a existir), ELE É UM COMPONENTE.** Sem exceção.

---

## ESTRUTURA PADRÃO PARA MODAIS (Angular / zemtweb)

### Modal de feature
```
aplicacao/<feature>/componentes/<nome>-modal/
  <nome>-modal.component.ts
  <nome>-modal.component.html
  <nome>-modal.component.scss
```

### Modal compartilhado (genérico de verdade)
```
src/app/shared/components/<nome>-modal/
```

### Padrão de modal no zemtweb

O padrão é **`ngx-bootstrap/modal`** (`BsModalService`/`BsModalRef`, `ng-template` com
`modalRef = modalService.show(template, {...})`) — **94 componentes** já usam, e nenhum usa uma segunda
lib. Manter esse padrão. Um modal complexo o bastante para ter lógica de formulário/validação própria
deve virar **componente** (`.ts`+`.html`+`.scss`) em vez de crescer dentro do `<ng-template>` da tela pai.

❌ O modal NÃO acessa a tela pai diretamente. Consome dados via `@Input()`/`@Output()`.

---

## O QUE UMA TELA (add/view/lista) PODE FAZER (E SÓ ISSO)

- Compor componentes, controlar navegação e o estado de abertura de modais.
- ❌ NÃO contém HTML de modal, lógica interna do modal, validação de formulário do modal, nem decide
  comportamento visual dele.

---

## FORMULÁRIOS

- Formulário reutilizável **não vive na tela** — vira componente.
- Formulário dentro de modal = responsabilidade do modal.

---

## HTML ESTRUTURAL

❌ HTML inline duplicado · estruturas "criadas rápido" na tela · copiar layout "só mudando um campo".
✅ Criar componente · reutilizar · parametrizar.

O elemento certo para cada função está em `leisSemanticasParaEvitarRetrabalhos.md`. Referência:
<https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements>

---

## 0) Princípios Inegociáveis

- **Sem CSS inline** (`style=""`, `[style]`, `ngStyle`) exceto valor dinâmico inevitável (ex.:
  `[style.width.%]` de barra de progresso). Ver `CLAUDE.md` seção 1.
- **Sem HTML gigante**: templates pequenos e legíveis. Se passar de **120–150 linhas, QUEBRE** em
  subcomponentes (Header, Toolbar, List, Card, EmptyState, Skeleton, Filters, Modal…).
- **Sem regra de negócio no template**: só bindings simples e handlers (`(click)="onSalvar()"`).
- **Sem lógica complexa no HTML**: nada de `.filter().map()` ou `foo?.bar?.baz?.qux` em cascata.
- **Sem componente arquivo-único**: HTML/CSS **não** ficam dentro do `.ts` (exceto 1–2 linhas triviais).
  Sempre `.ts` + `.html` + `.scss` separados.

---

## 1) CSS: Zero Inline, Priorize a Biblioteca (Bootstrap 4.4.1)

- Use primeiro os utilitários/componentes do Bootstrap (grid, spacing, `d-flex`, `btn`, `badge`, `card`…).
- CSS custom só quando: (1) não há utilitário pronto, (2) o ganho é real, (3) é isolado/reutilizável.
- CSS custom em `component.scss` (escopado) ou `src/styles.scss` (global, se reaproveitável).
  Use `:host` e nomes semânticos. Evite `!important`.
- **Confira a versão real do Bootstrap antes de escrever classe.** O `package.json` declara **5.3.3**,
  mas o runtime vem do **CDN 4.4.1** no `index.html`. Valem `custom-switch`, `badge-pill`,
  `border-left`, `rounded-pill`, `ml-*`/`mr-*`. **Não** valem `ms-*`/`me-*`, `form-switch`, `fw-bold`,
  `text-bg-*`, `gap-*` — viram no-op silencioso. `rounded-3` funciona porque foi adicionada à mão em
  `src/styles.scss` (linha ~1347), não é utilitário nativo do BS4.
- Seguir `DESIGN.md` (paleta por módulo, contraste ≥ 4.5:1).

---

## 2) Estado, Tipagem e Performance

- Fonte de verdade no service. Componentes recebem via `@Input()`, emitem via `@Output()`.
  **Componente filho não busca o que o pai já tem** — havia dois baixando 78 KB do resumo da obra só
  para ler um campo `status` que o pai já repassava a cinco outros.
- Tipagem forte em modelos novos, **sem `any`**. Observables com sufixo `$`. Métodos `onSalvar`,
  `carregarItens`, `abrirModal`.
- **`ChangeDetectionStrategy.OnPush` e `trackBy` em listas** para componentes novos. Hoje são
  **1 de 49** componentes do `obra-mod` com OnPush e **108 de 111** `*ngFor` sem `trackBy`.
- **Não recriar objeto no template a cada change detection.** Método em `[ngStyle]` que devolve um
  literal novo faz o `KeyValueDiffer` refazer o diff em todo ciclo, para todo item da lista. Memoize.

Medição antes/depois é obrigatória em qualquer alteração de tela: `npm run gate` e `perf/README.md`.

---

## 3) Acessibilidade e UX

- Botões em form com `type="button"` (exceto o botão de submit real). Estados visuais: loading,
  disabled, feedback de erro.
- Detalhe obrigatório (ARIA, labels, fieldset, toggles, hierarquia de títulos, limpeza) em
  **`leisSemanticasParaEvitarRetrabalhos.md`**.

---

## CHECKLIST DE PR (UI)

- [ ] Nenhum modal criado inline em tela grande
- [ ] Nenhum HTML duplicado (bloco repetido virou componente)
- [ ] Modais reutilizáveis em `componentes/` do módulo ou `src/app/shared/components/`
- [ ] Telas apenas orquestram; lógica fica em service
- [ ] Template < 150 linhas (senão, quebrado em subcomponentes)
- [ ] Sem CSS inline (exceto valor dinâmico justificado); Bootstrap 4.4.1 priorizado
- [ ] `.ts` + `.html` + `.scss` separados (nada de template/estilo inline)
- [ ] Tipagem forte em código novo (sem `any`); `OnPush` + `trackBy` quando aplicável
- [ ] Acessibilidade e limpeza conforme `leisSemanticasParaEvitarRetrabalhos.md`
- [ ] Sem variáveis não usadas, `console.log` ou código comentado
- [ ] **`npm run gate` passou** — bundle e SonarQube nas linhas alteradas

---

## Output obrigatório do Agent

Ao entregar UI: (1) explicar rapidamente a estrutura criada (arquivos/pastas), (2) justificar qualquer
exceção às regras, (3) apontar próximos passos/pendências. E revisar o checklist final do `CLAUDE.md`
(padronização, alinhamento, responsividade em três larguras, semântica, gate).

---

## FILOSOFIA FINAL

UI também é arquitetura. Bagunça visual = bagunça estrutural = bug futuro.
Prioridades: **Consistência · Reutilização · Clareza · Manutenibilidade**. Nenhuma "solução rápida" é
aceita se quebrar esse padrão. Na dúvida: **perguntar, não improvisar, não duplicar.**

> Uma nota que vale mais que a regra: nesta base, toda "otimização" feita por intuição e não por
> medição custou mais do que rendeu. Recolher cards "para carregar mais rápido" não mudou nada.
> `loading="lazy"` piorou o que queria melhorar. Um guard de deduplicação passou meses protegendo
> nada. **Meça antes, meça depois, e aceite o número quando ele contrariar você.**
