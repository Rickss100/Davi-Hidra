import glob
import re

files = sorted(glob.glob('v2/src/data/academy/lessons/**/*.md', recursive=True))

for f in files:
    with open(f, 'r', encoding='utf-8') as fp:
        raw = fp.read()
    
    # Busca a seção do prompt
    # Procura após NotebookLM até o fim do arquivo
    match = re.search(r'(?:NotebookLM|Prompt para Áudio).*?(?:>\s*\*[\"“\']|>\s*[\"“\']\*)(.*?)(?:[\"”\']\*\s*$|[\"”\']\*\s*\n|\*\s*$|\*\s*\n)', raw, re.DOTALL | re.IGNORECASE)
    if not match:
        # Fallback mais amplo: qualquer citação no final do arquivo após NotebookLM
        match = re.search(r'NotebookLM.*?>\s*(.*?)(?:\n\n|\Z)', raw, re.DOTALL | re.IGNORECASE)
        
    prompt = match.group(1).strip().strip('*').strip('"').strip('“').strip('”') if match else ''
    if len(prompt) < 30:
        print(f"PROBLEMA em {f}: prompt='{prompt}'")
    else:
        print(f"OK: {f} ({len(prompt)} chars)")
