# DIRETRIZES DE CONFORMIDADE ESTRITA (SONARQUBE & ACESSIBILIDADE) — zemtweb

## 🎯 OBJETIVO
Gerar código "Clean", semanticamente correto e acessível na PRIMEIRA TENTATIVA.
Qualquer violação destas regras é considerada uma falha crítica.

> Este documento existia apenas no `zemtadm`, marcado como "espelhado do zemtweb" — o espelho era a
> única cópia. Trazido de volta e ajustado ao que a medição do `zemtweb` mostrou. Mantenha os dois em
> sincronia: regra corrigida aqui vale lá, e vice-versa.
>
> Angular + **Bootstrap 4.4.1** (o `package.json` declara 5.3.3, mas o runtime vem do CDN no
> `index.html` — utilitários do 5 não funcionam). Ver `CLAUDE.md` e `DESIGN.md`.

## Por que isto importa mais aqui do que parece

Estamos migrando para **Capacitor**, que empacota este HTML como app nativo. O VoiceOver do iOS é
rigoroso: ele navega pela árvore de acessibilidade, não pelo que está pintado na tela. Um `<div>` que
parece botão não existe para ele. Um `<p class="h4">` não é título.

E a Apple revisa isso. Contaminação semântica que hoje só gera aviso no SonarQube vira reprovação de
publicação depois.

---

## 1. ELEMENTOS INTERATIVOS NÃO-NATIVOS

**Contexto:** medido no `zemtweb` — **101 elementos** com `(click)` que não são `<button>` nem `<a>`:
53 `<div>`, 14 `<img>`, 11 `<i>`, 9 `<span>`, 8 `<li>`. Quase metade está no `obra-mod`.

**Regra, em ordem de preferência:**

1. **Use o elemento nativo.** Ação é `<button type="button">`. Navegação é `<a href>`. Resolve foco,
   Enter/Espaço e papel semântico de graça.
2. Se o layout realmente impedir, o elemento precisa de **todos** os quatro:
   - `role="button"` — sem isto o leitor de tela não anuncia o que é
   - `tabindex="0"` — foco via teclado
   - `aria-label` — descrição
   - `(keydown.enter)` e `(keydown.space)`

> `tabindex` sem `role` engana o SonarQube e não engana o VoiceOver: o elemento recebe foco e continua
> sem papel. Se você for escrever os quatro atributos, quase sempre era mais curto usar `<button>`.

❌ **NÃO FAÇA:**
```html
<div class="card-item" (click)="editarItem(obj)">
  <i class="fas fa-edit"></i>
</div>
```

✅ **FAÇA:**
```html
<button type="button" class="card-item text-left btn btn-link p-0"
        (click)="editarItem(obj)" [attr.aria-label]="'Editar ' + obj.nome">
  <i class="fas fa-edit" aria-hidden="true"></i>
</button>
```

**Ícone decorativo sempre com `aria-hidden="true"`.** Um `<i class="fas fa-edit">` dentro de um botão
que já tem texto ou `aria-label` só polui o leitor de tela.

### `<a>` sem `href` não existe

Medidos **15** no `zemtweb`. Âncora sem `href` não recebe foco, não é anunciada como link e não
responde a Enter — é `<div>` com aparência de link.

```html
❌ <a class="linka" (click)="abrirDetalhe()">ver detalhe</a>
✅ <button type="button" class="btn btn-link linka" (click)="abrirDetalhe()">ver detalhe</button>
✅ <a [routerLink]="['/obra', id]">ver detalhe</a>   <!-- se for navegação de verdade -->
```

---

## 2. HIERARQUIA DE TÍTULOS

**Contexto:** distribuição real medida no `zemtweb`:

```
h1:  11        h4:  88
h2:  52        h5: 221   ← o mais usado do app
h3:  38        h6: 162
```

`h5` e `h6` somam **383 de 572**. Isso não é hierarquia de documento, é escolha de tamanho de fonte.
Leitor de tela navega por esses níveis; assim, a navegação por título não leva a lugar nenhum.

**Regra:** o nível do título é a **posição na hierarquia da página**, nunca o tamanho desejado.
Tamanho é classe do Bootstrap ou token do `DESIGN.md`.

```html
❌ <p class="text-h4">Materiais</p>        <!-- some da árvore de acessibilidade -->
❌ <span class="h4">Materiais</span>
❌ <div class="h5 mb-0">Total</div>
❌ <h5 class="f-h5">Ambiente</h5>          <!-- h5 escolhido por causa do tamanho -->

✅ <h2 class="h4">Materiais</h2>           <!-- nível 2 na página, aparência de h4 -->
✅ <p class="fw-bold">Total</p>            <!-- não é título: não vira heading -->
```

Uma tela tem **um** `<h1>` — o assunto dela. Os demais descem sem pular nível.

---

## 3. FORMULÁRIOS E RÓTULOS (LABELS)

**Regra:** todo `input`/`select`/`textarea` tem um `<label>` associado por `for`/`id`.
Não depender de aninhamento implícito.

❌ **NÃO FAÇA:**
```html
<label>Código <input type="text" formControlName="codigo"></label>
```

✅ **FAÇA:**
```html
<label for="material-codigo">Código</label>
<input id="material-codigo" type="text" formControlName="codigo">
```

> Em listas (`*ngFor`), gere `id` único: `[attr.for]="'item-nome-' + item.id"` / `[id]="'item-nome-' + item.id"`.

**Cuidado com `id` duplicado.** O SonarQube já aponta casos no `zemtweb` (`esquadria-n-modulos`,
`pesquisa-lista`) — `id` repetido quebra a associação do `label` e o `for` passa a apontar para o
elemento errado.

---

## 4. AGRUPAMENTO SEMÂNTICO

**Regra:** grupos de checkbox/radio ou seções lógicas usam `<fieldset>` + `<legend>` (ou `aria-labelledby`).
Evite `<div role="group">` com um `<label>` solto de título.

✅ **FAÇA:**
```html
<fieldset>
  <legend class="text-muted">Tipo de material</legend>
  <label class="mr-3"><input type="checkbox" formControlName="aluminio"> Alumínio</label>
  <label><input type="checkbox" formControlName="polimero"> Polímero</label>
</fieldset>
```

---

## 5. BOTÕES DE ALTERNÂNCIA (TOGGLES/STATES)

**Regra:** botão que muda de estado (filtro, seleção, aba) usa `aria-pressed` e `type="button"`.

❌ **NÃO FAÇA:**
```html
<a class="nav-link" [class.active]="abaAtiva === t.tipo" (click)="selecionarAba(t.tipo)">{{t.label}}</a>
```

✅ **FAÇA:**
```html
<button type="button" class="nav-link" [class.active]="abaAtiva === t.tipo"
        [attr.aria-pressed]="abaAtiva === t.tipo" (click)="selecionarAba(t.tipo)">
  {{t.label}}
</button>
```

---

## 6. LIMPEZA DE CÓDIGO (TYPESCRIPT)

Zero tolerância para "code smells":
- **Variáveis:** remova qualquer variável declarada e não usada.
- **Console:** remova todos os `console.log` antes de submeter.
- **Comentários:** não deixe código comentado (`// código antigo`). Apague.
- **Ciclo de vida vazio:** `ngOnInit() {}` sem corpo deve sair, junto com o `implements` e o import.
- **`implements` faltando:** declarou `ngOnChanges`? Declare `implements OnChanges`. São **41
  ocorrências** no `zemtweb`, e uma delas fazia um componente não reagir a mudança de input.

---

## 7. PADRÕES QUE EVITAM AVISOS DO SONARQUBE

- **Números:** sem fração zero — `80`, não `80.00`.
- **Coalescência:** `x ??= criar()` em vez de `if (!x) { x = criar(); }`.
- **Condições:** evitar negação quando o ramo principal é mais curto.
- **Ternários aninhados:** extrair para variável/função com nome claro.
- **Promises:** preferir `async/await` a cadeias `.then().catch().finally()`.
- **`.map()` que descarta o retorno:** use `forEach`. São **132 ocorrências** no `zemtweb`, e pelo
  menos uma escondia bug real (`.map(async …)` sem `await`, engolindo erro).
- **Complexidade cognitiva:** manter funções abaixo de ~15; extrair helpers com nomes claros.
- **Assertions:** evitar `!` quando o tipo já está garantido por um `if/else`.
- **Membros só lidos:** marcar `private readonly` quando nunca reatribuído (`typescript:S2933`).
- **`.sort()` sem comparador:** use `localeCompare` para texto. O padrão ordena por código de
  caractere e embaralha acento e caixa.

---

## 8. O QUE O SONARQUBE APONTA E NÃO É PROBLEMA

Nem todo apontamento é real, e tratar ruído como dívida faz a equipe parar de olhar o indicador.

A regra `Web:MouseEventWithoutKeyboardEquivalentCheck` aponta **244** casos no `zemtweb`, dos quais
**142 são falso positivo** — componentes que renderizam `<button>` nativo por dentro, e onde o clique
do Enter borbulha até o host:

| Elemento | Por quê |
|---|---|
| `<mv-button>` (128) | `components/button` renderiza `<button>` |
| `<app-financeiro2-show-more-btn>` (3) | idem |
| `<app-filter-button>` (2), `<app-action-button>` (2) | idem |
| `<button>` (5) | elemento nativo — foco e Enter/Espaço por definição |
| `<input type="checkbox">` (2) | Espaço aciona nativamente |

**Antes de corrigir em massa, verifique.** E ao marcar como *Won't Fix* no SonarQube, escreva a
justificativa — quem vier depois precisa saber que foi decisão, não esquecimento.

Classificação completa: `perf/resultados/a11y-classificacao.json`.

---

### Como usar no fluxo

Antes de gerar QUALQUER HTML ou TypeScript, siga estas leis. Em revisão de PR, elas fazem parte do
checklist — junto com o `npm run gate`, que mede o que mudou e reprova regressão.

Referência de qual elemento usar para quê:
<https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements>

Na dúvida: **perguntar, não improvisar.**

### Documentos irmãos que ainda faltam aqui

O `zemtadm` tem dois que o `zemtweb` não tem, e ambos se aplicam:

- `UI-COMPONENTS-GOVERNANCE.md` — governança de componentes, modais, formulários e HTML estrutural
- `ARCHITECTURE-GOLD-STANDARD.md` — camadas Domain / Services / Repository / Facade / Pages

Trazê-los é trabalho próprio, não deste card. Enquanto isso, consulte-os em
`/Volumes/DevDrive/Sites/docszemt/zemtadm/`.
