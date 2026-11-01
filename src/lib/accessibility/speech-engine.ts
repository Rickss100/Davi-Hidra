/**
 * Motor de Fala e Síntese Vocal (TTS) Nativo em PT-BR para Finanças
 * Baseado na Web Speech API nativa (window.speechSynthesis) com zero dependências externas.
 */

export function formatFinancialTextForSpeech(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';

  let text = raw;

  // 1. Converte valores em Reais (ex: "R$ 1.250,50" -> "1250 reais e 50 centavos")
  text = text.replace(/R\$\s*([\d.]+),(\d{2})/g, (_, intPart, cents) => {
    const cleanInt = intPart.replace(/\./g, '');
    const centsNum = parseInt(cents, 10);
    if (centsNum === 0) {
      return `${cleanInt} reais`;
    }
    return `${cleanInt} reais e ${centsNum} centavos`;
  });

  // Converte "R$ 1.500" sem centavos
  text = text.replace(/R\$\s*([\d.]+)/g, (_, intPart) => {
    const cleanInt = intPart.replace(/\./g, '');
    return `${cleanInt} reais`;
  });

  // 2. Converte porcentagens com sinal (ex: "+16,94%" -> "mais 16 vírgula 94 por cento")
  text = text.replace(/\+([\d.]+),(\d+)%/g, 'mais $1 vírgula $2 por cento');
  text = text.replace(/-([\d.]+),(\d+)%/g, 'menos $1 vírgula $2 por cento');
  text = text.replace(/([\d.]+),(\d+)%/g, '$1 vírgula $2 por cento');

  // 3. Converte códigos de ativos da B3 (ex: PETR4, VALE3, MXRF11, HGLG11) separando as letras para pronúncia fluida
  text = text.replace(/\b([A-Z]{4})(3|4|11|11B|6)\b/g, (_, ticker, code) => {
    const spaced = ticker.split('').join(' ');
    return `${spaced} ${code}`;
  });

  // 4. Converte termos financeiros e abreviações comuns
  text = text.replace(/\bvs\.\b/gi, 'versus');
  text = text.replace(/\bFIIs\b/g, 'Fundos Imobiliários');
  text = text.replace(/\bFII\b/g, 'Fundo Imobiliário');
  text = text.replace(/\bCDI\b/g, 'C D I');
  text = text.replace(/\bIPCA\b/g, 'I P C A');
  text = text.replace(/\bIFIX\b/g, 'I FIX');
  text = text.replace(/\bB3\b/g, 'B 3');
  text = text.replace(/\bP\/L\b/gi, 'P sobre L');
  text = text.replace(/\bP\/VP\b/gi, 'P sobre V P');
  text = text.replace(/\bDY\b/g, 'Dividend Yield');

  return text.trim();
}

export function stopSpeech(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

export function speakText(
  text: string,
  options?: { rate?: number; pitch?: number; onEnd?: () => void }
): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

  stopSpeech();

  const formatted = formatFinancialTextForSpeech(text);
  if (!formatted) return;

  const utterance = new SpeechSynthesisUtterance(formatted);
  utterance.lang = 'pt-BR';
  utterance.rate = options?.rate ?? 1.0;
  utterance.pitch = options?.pitch ?? 1.0;

  // Tenta selecionar a melhor voz em Português do Brasil disponível no navegador
  const voices = window.speechSynthesis.getVoices();
  const ptVoice = voices.find(
    (v) => v.lang === 'pt-BR' || v.lang === 'pt_BR' || v.name.includes('Portuguese')
  );
  if (ptVoice) {
    utterance.voice = ptVoice;
  }

  if (options?.onEnd) {
    utterance.onend = options.onEnd;
    utterance.onerror = options.onEnd;
  }

  window.speechSynthesis.speak(utterance);
}

export function extractNodeReadableText(el: HTMLElement): string {
  // 1. Verifica atributos de acessibilidade prioritários
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel;

  const title = el.getAttribute('title');
  if (title) return title;

  // 2. Se for botão ou link, adiciona contexto do papel
  const isButton = el.tagName === 'BUTTON' || el.getAttribute('role') === 'button';
  const isLink = el.tagName === 'A';

  const innerText = el.innerText || el.textContent || '';
  const clean = innerText.replace(/\s+/g, ' ').trim();

  if (isButton && clean) return `Botão: ${clean}`;
  if (isLink && clean) return `Link: ${clean}`;

  return clean;
}
