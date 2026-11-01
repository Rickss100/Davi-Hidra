---
id: "mod-7-aula-2"
moduloId: "modulo-7"
moduloTitulo: "Módulo 7: A Carteira Hydra & O Algoritmo AM2O"
numeroAula: "7.2"
titulo: "O Algoritmo AM2O Explicado: Como Comprar na Baixa sem Tentar Adivinhar o Futuro"
duracaoLeitura: "6 min"
arquivoOrigem: "public/Curso IDV/Módulo 7 - Montando sua carteira de investimentos/7.3 - Onde investir cada mês - AM20.pdf"
status: "ready"
---

# Aula 7.2 — O Algoritmo AM2O: Comprar na Baixa sem Adivinhação

Existe uma armadilha psicológica cruel gravada no cérebro de todo ser humano:
- Quando uma ação ou fundo imobiliário sobe 50% em poucos meses e estampa manchetes eufóricas na internet, o investidor amador é tomado por um impulso irresistível de **comprar mais**, acreditando que o ativo vai subir para sempre (**ganância**).
- Quando esse mesmo ativo de primeira linha cai 20% em uma correção passageira de mercado, o investidor é tomado pelo medo e congela, recusando-se a comprar (**aversão à perda**).

O resultado desse comportamento emocional é trágico: o ser humano sempre compra no topo da euforia e fica de fora (ou vende) no fundo do poço.

Para eliminar para sempre a emoção humana das suas decisões de investimento, o Norte Invest desenvolveu e automatizou a sua maior joia tecnológica: **o Algoritmo AM2O (Aporte no Mais Distante do Objetivo)**.

---

## 🎯 1. O que Significa AM2O?

A sigla **AM2O** é o acrônimo fonético para:
> 💡 **A**porte no **M**ais **D**istante do **O**bjetivo *(AMDO / AM2O)*.

Em vez de perder horas analisando gráficos e tentando adivinhar se a Bolsa vai subir ou cair amanhã, você deixa que a matemática pura e gelada responda à pergunta: *"Onde devo colocar meus R$ 1.000 ou R$ 5.000 este mês?"*

---

## 🧮 2. A Mecânica Matemática do AM2O

A cada novo mês, o algoritmo executa uma sequência de três etapas nos bastidores:

### Etapa 1: Cálculo do Patrimônio Total Futuro
O sistema soma todo o seu patrimônio atual ao valor do novo aporte mensal e dividendos recebidos:
$$\text{Novo Patrimônio Total} = \text{Patrimônio Atual} + \text{Aporte Disponível}$$

### Etapa 2: Cálculo da Posição Alvo de Cada Ativo
Para cada classe e cada papel da sua carteira, o algoritmo multiplica a sua meta percentual pelo novo patrimônio:
$$\text{Valor Ideal} = \text{Novo Patrimônio Total} \times \text{Meta \%}$$

### Etapa 3: A Distância para o Objetivo
O algoritmo calcula quanto falta em dinheiro vivo para cada ativo atingir a sua meta:
$$\text{Distância Monetária} = \text{Valor Ideal} - \text{Posição Atual}$$

- **O Ativo com a Maior Distância Positiva:** É aquele que mais ficou defasado na carteira — seja porque é um ativo novo que você acabou de adicionar, seja porque a cotação dele caiu no mercado recentemente e ele ficou mais barato!
- **A Decisão do Algoritmo:** O AM2O direciona o dinheiro novo **exatamente para ele**.

---

## 🛡️ 3. Rebalanceamento por Aporte: Sem Vender Nada!

Nos fundos tradicionais e na gestão antiga de Wall Street, os gestores costumam "rebalancear" a carteira vendendo os ativos que subiram para comprar os que caíram:
- **O Problema:** Cada venda gera pagamento de imposto de renda (15% sobre o ganho de capital), taxas de corretagem e custos de spread, corroendo a riqueza do investidor.

> 💎 **A Regra Mestra do Norte Invest:** **Nós nunca vendemos ativos saudáveis para rebalancear!**  
> O nosso rebalanceamento é feito exclusivamente **por aporte**. Você nunca precisa pagar impostos para reequilibrar a sua carteira; o dinheiro novo que entra do seu trabalho e dos dividendos compra o que está barato e traz a balança de volta para o centro de forma orgânica.

---

## 📱 4. Aplicação Prática no App Norte Invest

No **Norte Invest V2 Enterprise**, você não precisa abrir o Excel nem calcular uma única fórmula:
1. Abra o menu **Onde Aportar** (`/onde-aportar`).
2. Digite o valor que você tem disponível para investir no mês (ex: `R$ 2.500,00`).
3. O motor `davi-hydra.engine.ts` roda o AM2O em milissegundos e apresenta a tabela executiva:
   - Qual classe deve receber o aporte (ex: Fundos Imobiliários).
   - Quais ativos exatos comprar (ex: 15 cotas de `HGLG11` e 20 cotas de `KNIP11`).
   - O preço limite sugerido e a sobra de troco em centavos.
4. Abra o app da sua corretora, execute as ordens e pronto!

---

## ⚠️ 5. O Erro Fatal do Amador

> 🚫 **O Erro:** Abrir a tela do AM2O, ver que o sistema mandou comprar um ativo que caiu 8% no mês, achar que o algoritmo "errou" e teimar comprando a ação que subiu 30%.
> 
> 🛡️ **A Postura Norte Invest:** Confie na matemática. Se o ativo passou pelo crivo fundamentalista do Método DAVI e continua com lucros e fundamentos intactos, a queda de preço é um presente que o mercado deu para você comprar mais cotas com desconto. O AM2O é o seu cinto de segurança contra os seus próprios instintos biológicos de euforia.

---

## 📊 6. Infográfico: A Lógica Fria do AM2O

```mermaid
flowchart TD
    Aporte["💵 Dinheiro Novo Disponível (Poupança + Dividendos)"] --> AM2O["Algoritmo AM2O (/onde-aportar)"]
    
    AM2O --> Analise{"Qual ativo está mais longe da sua meta?"}
    
    Analise -->|Ativo que Subiu Muito| Espera["⏸️ Não Aporta Nele<br/>(Evita Comprar no Topo)"]
    Analise -->|Ativo que Ficou para Trás| Compra["🎯 Direciona o Aporte para Ele<br/>(Compra Barato na Baixa com Desconto!)"]
    
    Compra --> Rebalance["⚖️ Carteira Hydra Rebalanceada Automaticamente<br/>(Sem Vender Nada e Sem Pagar Impostos) 👑"]
```

---

## 🎙️ 7. Prompt para Áudio no Google NotebookLM

> **Como gerar o podcast desta aula:**
> 1. Copie o texto desta aula.
> 2. Cole como nova fonte em [notebooklm.google.com](https://notebooklm.google.com/).
> 3. No campo de personalização do *Audio Overview*, cole a instrução abaixo e clique em **Generate**:
> 
> *"Apresentem uma aula fantástica e brilhante sobre o funcionamento do algoritmo AM2O do Norte Invest. Expliquem como o medo e a ganância destroem o investidor humano e como a fórmula matemática da distância para o objetivo inverte essa lógica, forçando o investidor a comprar sempre com desconto. Destaquem a genialidade do rebalanceamento por aporte sem nunca vender ativos e mostrem a praticidade da tela Onde Aportar do aplicativo."*
