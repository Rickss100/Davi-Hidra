import glob
import os
import re
import json

files = sorted(glob.glob('v2/src/data/academy/lessons/**/*.md', recursive=True))

module_meta = {
    'modulo-1': {
        'numero': 1,
        'titulo': 'Módulo 1: A Base da Riqueza & Primeiros Passos',
        'subtitulo': 'Desmistificando o Investimento Real',
        'descricao': 'Compreenda a diferença entre especulação e geração de renda, o poder do reinvestimento e por que a constância vence o timing de mercado.',
        'icone': 'Target'
    },
    'modulo-2': {
        'numero': 2,
        'titulo': 'Módulo 2: Clareza de Investidor & Alicerces Mentais',
        'subtitulo': 'Blindagem Psicológica e Autonomia',
        'descricao': 'Elimine os intermediários caros, aplique o Efeito Lindy nos ativos, domine o estômago contra a volatilidade e conheça a arquitetura antifrágil da Hydra.',
        'icone': 'Shield'
    },
    'modulo-3': {
        'numero': 3,
        'titulo': 'Módulo 3: Reserva de Emergência & Renda Fixa',
        'subtitulo': 'A Fundação Inegociável de Defesa',
        'descricao': 'Construa sua trincheira de 6 a 12 meses, domine as famílias de renda fixa, escolha corretoras sem taxas e faça a faxina financeira de ativos ruins.',
        'icone': 'Lock'
    },
    'modulo-4': {
        'numero': 4,
        'titulo': 'Módulo 4: Selecionando as Melhores Ações (Método DAVI)',
        'subtitulo': 'O Cinzel de Michelangelo na Bolsa',
        'descricao': 'Filtre as 400 empresas da B3 com o Método DAVI: governança, Novo Mercado, Tag Along, 5 anos de lucros, ROE e dívida sob controle (setores BEST).',
        'icone': 'TrendingUp'
    },
    'modulo-5': {
        'numero': 5,
        'titulo': 'Módulo 5: Os Melhores Fundos Imobiliários (FIIs)',
        'subtitulo': 'Aluguéis Mensais Isentos de IR',
        'descricao': 'Construa sua fazenda de imóveis: Tijolo vs Papel, P/VP, localização primária, contratos atípicos Built to Suit e gestão de padrão ouro.',
        'icone': 'Building2'
    },
    'modulo-6': {
        'numero': 6,
        'titulo': 'Módulo 6: Investimentos no Exterior (Dolarização)',
        'subtitulo': 'Poder de Compra Global em Moeda Forte',
        'descricao': 'Elimine o risco-país com ETFs globais (VOO, VT), proteção de US$ 500k pelo SIPC americano e rotina simples de câmbio instantâneo.',
        'icone': 'Globe'
    },
    'modulo-7': {
        'numero': 7,
        'titulo': 'Módulo 7: A Carteira Hydra & O Algoritmo AM2O',
        'subtitulo': 'A Engenharia dos Aportes Mecânicos',
        'descricao': 'A orquestração dos tentáculos, o algoritmo AM2O comprando na baixa com desconto, o ritual de 15 minutos mensais e a conquista do Ponto Mágico.',
        'icone': 'Sparkles'
    },
    'modulo-8': {
        'numero': 8,
        'titulo': 'Módulo 8: Imposto de Renda & Blindagem Fiscal',
        'subtitulo': 'Desmistificando o Fisco sem Medo',
        'descricao': 'Declarar vs pagar imposto, a isenção de R$ 20k, a declaração pré-preenchida do gov.br e o mapa das fichas de bens e dividendos.',
        'icone': 'FileCheck2'
    },
}

modules = {}
for mid, mdata in module_meta.items():
    modules[mid] = {
        'id': mid,
        'numero': mdata['numero'],
        'titulo': mdata['titulo'],
        'subtitulo': mdata['subtitulo'],
        'descricao': mdata['descricao'],
        'icone': mdata['icone'],
        'aulas': []
    }

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        raw = fp.read()
    
    fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)$', raw, re.DOTALL)
    if not fm_match:
        print('Erro no frontmatter:', f)
        continue
    
    fm_txt, content = fm_match.group(1), fm_match.group(2)
    fm = {}
    for line in fm_txt.split('\n'):
        if ':' in line:
            k, v = line.split(':', 1)
            fm[k.strip()] = v.strip().strip('"')
            
    match = re.search(r'(?:NotebookLM|Prompt para Áudio).*?(?:>\s*\*[\"“\']|>\s*[\"“\']\*)(.*?)(?:[\"”\']\*\s*$|[\"”\']\*\s*\n|\*\s*$|\*\s*\n)', raw, re.DOTALL | re.IGNORECASE)
    if not match:
        match = re.search(r'NotebookLM.*?>\s*(.*?)(?:\n\n|\Z)', raw, re.DOTALL | re.IGNORECASE)
        
    nb_prompt = match.group(1).strip().strip('*').strip('"').strip('“').strip('”') if match else ''
    
    lesson = {
        'id': fm.get('id', ''),
        'moduloId': fm.get('moduloId', ''),
        'moduloTitulo': fm.get('moduloTitulo', ''),
        'numeroAula': fm.get('numeroAula', ''),
        'titulo': fm.get('titulo', ''),
        'duracaoLeitura': fm.get('duracaoLeitura', '5 min'),
        'promptNotebookLM': nb_prompt,
        'content': content.strip()
    }
    
    mid = lesson['moduloId']
    if mid in modules:
        modules[mid]['aulas'].append(lesson)

curriculum_list = list(modules.values())
print(f'Módulos processados: {len(curriculum_list)}')

ts_code = '''// Catálogo Tipado da Academia Norte Invest
// Gerado automaticamente a partir das transcrições do acervo IDV / Método DAVI & Hydra

export interface AcademyLesson {
  id: string;
  moduloId: string;
  moduloTitulo: string;
  numeroAula: string;
  titulo: string;
  duracaoLeitura: string;
  promptNotebookLM: string;
  content: string;
}

export interface AcademyModule {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  descricao: string;
  icone: string;
  aulas: AcademyLesson[];
}

export const ACADEMY_CURRICULUM: AcademyModule[] = ''' + json.dumps(curriculum_list, ensure_ascii=False, indent=2) + ''';

export const TOTAL_LESSONS = ACADEMY_CURRICULUM.reduce((acc, m) => acc + m.aulas.length, 0);

export function getLessonById(id: string): AcademyLesson | undefined {
  for (const mod of ACADEMY_CURRICULUM) {
    const found = mod.aulas.find((a) => a.id === id);
    if (found) return found;
  }
  return undefined;
}

export function getModuleById(id: string): AcademyModule | undefined {
  return ACADEMY_CURRICULUM.find((m) => m.id === id);
}
'''

with open('v2/src/data/academy/curriculum.ts', 'w', encoding='utf-8') as out:
    out.write(ts_code)

print('v2/src/data/academy/curriculum.ts regerado com sucesso!')
