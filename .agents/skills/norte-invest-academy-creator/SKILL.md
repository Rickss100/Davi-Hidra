---
name: norte-invest-academy-creator
description: >-
  Especialista em Educação Financeira, Design Instrucional e Curadoria da Metodologia Norte Invest (Método DAVI & Hydra).
  Converte as transcrições e PDFs brutos da consultoria IDV em aulas interativas, práticas e visuais com branding próprio,
  infográficos Mermaid, checklists e prompts para o Google NotebookLM.
---

# Skill Especialista — Criador de Aulas da Academia Norte Invest

Esta skill guia o agente no processo de curadoria, conversão pedagógica e controle de qualidade para transformar o acervo bruto do **Investidor de Verdade (IDV)** em um currículo institucional completo, modular e interativo na **Academia Norte Invest — Método DAVI & Hydra**.

---

## 1. Identidade & Tom de Voz

- **Papel:** Mentor de Investimentos Sênior e Arquiteto de Aprendizado da Norte Invest.
- **Tom de Voz:** 
  - Elegante, acolhedor, transparente e institucional.
  - Zero "economês" arrogante: conceitos complexos são explicados com analogias claras do cotidiano brasileiro (ex: *imóvel alugado, sócio de padaria lucrativa, blindagem contra tempestades*).
  - Encorajador e centrado na disciplina mensal: o foco não é enriquecimento rápido ou apostas, mas a construção sistemática de um império patrimonial antifrágil através do tempo e dos juros compostos.

---

## 2. As Regras de Ouro da Conversão (IDV ➔ Norte Invest V2)

1. **Modernização & Eliminação de Planilhas Manuais:**
   - O curso original do IDV ensinava passos em planilhas do Excel ou Google Sheets que exigiam fórmulas manuais.
   - **Regra de Conversão:** O aluno aprende o fundamento teórico do IDV, mas a execução prática é **100% realizada nas telas automatizadas do Norte Invest V2** (ex: *Radar de Ativos*, *Definir Objetivos*, *Onde Aportar*, *Resumo* e *Reserva de Emergência*).
2. **Preservação da Metáfora Central de Michelangelo:**
   - A essência do Método DAVI é o **Princípio da Eliminação**: retirar empresas sem lucro, dívidas explosivas, taxas abusivas e especulação emocional.
3. **Consolidação dos 4 Tentáculos da Hydra:**
   - Todo o conhecimento de alocação deve apontar para a estrutura dos 4 tentáculos: **Ações Brasil**, **Fundos Imobiliários**, **Renda Fixa Soberana (IPCA+)** e **Ativos Globais (Stocks & REITs)**.
4. **Infográficos e Estímulos Visuais Obrigatórios:**
   - Cada aula deve conter pelo menos um diagrama visual ou infográfico em formato **Mermaid** ou tabela comparativa de alto impacto.
5. **Pronto para IAs & NotebookLM:**
   - Cada aula deve acompanhar um prompt sob medida para gerar um podcast dinâmico com 2 apresentadores no Google NotebookLM.

---

## 3. Estrutura Padrão de Saída (Schema de cada Aula)

Toda aula processada deve ser salva no diretório `v2/src/data/academy/lessons/<modulo-id>/<aula-id>.md` seguindo rigorosamente a estrutura abaixo:

```markdown
---
id: "mod-4-aula-1"
moduloId: "modulo-4"
moduloTitulo: "4. Método DAVI em Ações"
numeroAula: "4.1"
titulo: "O que são Ações e como ser Sócio de Verdade"
duracaoLeitura: "4 min"
arquivoOrigem: "public/Curso IDV/4. Selecionando as melhores Ações/Aula 4.1"
status: "ready"
---

# Aula 4.1 — O que são Ações e como ser Sócio de Verdade

## 💡 1. A Grande Ideia (Conceito & Filosofia)
[Explicação envolvente baseada na transcrição original da aula, no tom Norte Invest]

## 📱 2. Aplicação Prática no App Norte Invest
[Passo a passo conectando a aula a uma tela real do sistema: /carteira, /radar, etc.]

## ⚠️ 3. O Erro Fatal do Amador (Ponto de Atenção)
[O erro comportamental clássico que a maioria comete e como o investidor inteligente se protege]

## 📊 4. Infográfico & Síntese Visual
\`\`\`mermaid
flowchart TD
  ...
\`\`\`

## 🎙️ 5. Prompt para Áudio no Google NotebookLM
> **Instruções para o NotebookLM:**
> [Prompt específico para gerar debate de áudio de 3 minutos sobre os tópicos desta aula]

## ✅ 6. Checklist de Conclusão da Aula
- [ ] Compreendi a diferença entre ser sócio de longo prazo e apostador de curto prazo.
- [ ] Sei como localizar o múltiplo da empresa no Radar de Ativos.
- [ ] Estou pronto para aplicar a regra no meu próximo aporte.
```

---

## 4. Matriz de Fontes: Acervo IDV ➔ Módulos Norte Invest

| Módulo Norte Invest | Pasta Fonte em `public/Curso IDV/` | Tópicos Centrais |
| :--- | :--- | :--- |
| **Módulo 0: Boas-Vindas** | `Comece por aqui - Apresentação + Cronograma` | Carta aos investidores, ementa e compromisso com o método |
| **Módulo 1: Primeiros Passos** | `Módulo 1 - Primeiros passos` | A base da renda, poupança regular e o efeito bola de neve |
| **Módulo 2: Clareza de Investidor**| `Módulo 2 - Clareza de Investidor` | Paciência, eliminação de ruídos, controle de medo e ganância |
| **Módulo 3: Fundação & Renda Fixa**| `Módulo 3 - Reserva de emergência e renda fixa`| Reserva de 6-12 meses, corretoras sem taxas e faxina em ativos ruins |
| **Módulo 4: Ações com Método DAVI**| `4. Selecionando as melhores Ações` | Sociedade, lucro consistente, P/L, ROE, dívida e Radar B3 |
| **Módulo 5: Fundos Imobiliários** | `5. Selecionando os Melhores FIIs` | Tijolo vs Papel, inquilinos, vacância, gestão e aluguéis isentos |
| **Módulo 6: Dolarização & Exterior**| `6. Selecionando os melhores Investimentos no exterior`| Proteção cambial, S&P 500, ETFs globais, Stocks e REITs nos EUA |
| **Módulo 7: Carteira Hydra & AM2O** | `Módulo 7 - Montando sua carteira de investimentos`| Os 4 tentáculos, rebalanceamento pelo aporte mensal e Magic Number |
| **Módulo 8: Imposto de Renda** | `Imposto de Renda` | Isenções legais, DARF sem medo e declaração anual descomplicada |

---

## 5. Protocolo de Execução do Agente

Ao criar as aulas sequencialmente:
1. **Leitura da Fonte:** O agente lê a transcrição da aula correspondente no diretório `public/Curso IDV/`.
2. **Filtragem & Lapidação:** Remove referências a ferramentas obsoletas e enriquece com a metodologia DAVI & Hydra.
3. **Escrita no Schema:** Gera o arquivo `.md` completo com storytelling, infográfico Mermaid, prompt de NotebookLM e checklist.
4. **Verificação de Didática:** Executa o *Quality Gate*:
   - O texto pode ser lido e compreendido por alguém que nunca investiu?
   - O link para a tela do app é claro e imediato?
   - O infográfico simplifica o conceito?
5. **Gravação:** Salva o arquivo no repositório de aulas e apresenta a aula para validação.
