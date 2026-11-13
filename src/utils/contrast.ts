/**
 * Utilitário de Luminância Relativa e Cálculo de Contraste WCAG 2.1
 * Utilizado para sugerir e garantir contraste ideal nas cores de avatares e temas.
 */

export interface PaletteColor {
  hex: string;
  name: string;
}

export const COLOR_PALETTE: PaletteColor[] = [
  { hex: '#F59E0B', name: 'Âmbar Dourado' },
  { hex: '#EF4444', name: 'Rubi Carmim' },
  { hex: '#3B82F6', name: 'Safira Celestial' },
  { hex: '#10B981', name: 'Esmeralda' },
  { hex: '#8B5CF6', name: 'Púrpura Real' },
  { hex: '#EC4899', name: 'Rosa Vibrante' },
  { hex: '#06B6D4', name: 'Ciano Rio' },
  { hex: '#F97316', name: 'Laranja Solar' },
  { hex: '#1F2937', name: 'Preto Ônix' },
];

export interface ContrastEvaluation {
  colorHex: string;
  name: string;
  luminance: number;
  contrastRatio: number;
  bgHex: string;
  rating: 'AAA' | 'AA' | 'AA_LARGE' | 'LOW';
  label: string;
  isRecommended: boolean;
}

/**
 * Calcula a luminância relativa de uma cor hexadecimal segundo o padrão W3C WCAG 2.1
 * Intervalo: 0.0 (preto absoluto) a 1.0 (branco absoluto)
 */
export function getRelativeLuminance(hex: string): number {
  const cleanHex = hex.replace('#', '').trim();
  if (cleanHex.length !== 6 && cleanHex.length !== 3) {
    return 0.5;
  }

  let r = 0;
  let g = 0;
  let b = 0;

  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16) / 255;
    g = parseInt(cleanHex[1] + cleanHex[1], 16) / 255;
    b = parseInt(cleanHex[2] + cleanHex[2], 16) / 255;
  } else {
    r = parseInt(cleanHex.substring(0, 2), 16) / 255;
    g = parseInt(cleanHex.substring(2, 4), 16) / 255;
    b = parseInt(cleanHex.substring(4, 6), 16) / 255;
  }

  const transformChannel = (c: number): number => {
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };

  const R = transformChannel(r);
  const G = transformChannel(g);
  const B = transformChannel(b);

  return 0.2126 * R + 0.7152 * G + 0.0722 * B;
}

/**
 * Calcula a razão de contraste entre duas cores hexadecimais (1:1 a 21:1)
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const lum1 = getRelativeLuminance(hex1);
  const lum2 = getRelativeLuminance(hex2);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Retorna as cores de superfície e fundo de acordo com o tema atual
 */
export function getThemeSurfaceInfo(theme: 'light' | 'dark'): {
  surfaceBgHex: string;
  pageBgHex: string;
  themeLuminance: number;
} {
  if (theme === 'dark') {
    return {
      surfaceBgHex: '#111827', // Fundo dos cards e contêineres principais no modo escuro
      pageBgHex: '#0B132B',    // Fundo da página
      themeLuminance: 0.02,
    };
  }
  return {
    surfaceBgHex: '#FFFFFF',   // Fundo dos cards e contêineres principais no modo claro
    pageBgHex: '#F0F1F4',      // Fundo da página
    themeLuminance: 0.95,
  };
}

/**
 * Avalia a qualidade de contraste de uma cor em relação ao tema especificado
 */
export function evaluateColorContrast(colorHex: string, theme: 'light' | 'dark'): ContrastEvaluation {
  const surface = getThemeSurfaceInfo(theme);
  const contrastRatio = getContrastRatio(colorHex, surface.surfaceBgHex);
  const luminance = getRelativeLuminance(colorHex);
  const paletteMatch = COLOR_PALETTE.find(c => c.hex.toUpperCase() === colorHex.toUpperCase());
  const name = paletteMatch ? paletteMatch.name : colorHex;

  let rating: 'AAA' | 'AA' | 'AA_LARGE' | 'LOW';
  let label: string;
  let isRecommended: boolean;

  if (contrastRatio >= 7.0) {
    rating = 'AAA';
    label = 'Contraste Excelente (AAA)';
    isRecommended = true;
  } else if (contrastRatio >= 4.5) {
    rating = 'AA';
    label = 'Contraste Ótimo (AA)';
    isRecommended = true;
  } else if (contrastRatio >= 3.0) {
    rating = 'AA_LARGE';
    label = 'Contraste Adequado';
    // No modo escuro, cores >= 4.5 têm prioridade máxima; no modo claro 3.0+ é aceitável
    isRecommended = theme === 'light';
  } else {
    rating = 'LOW';
    label = 'Baixo Contraste';
    isRecommended = false;
  }

  return {
    colorHex,
    name,
    luminance,
    contrastRatio,
    bgHex: surface.surfaceBgHex,
    rating,
    label,
    isRecommended,
  };
}

/**
 * Ordena a paleta de cores por qualidade de contraste contra a luminância do tema
 */
export function getRankedPaletteForTheme(
  theme: 'light' | 'dark',
  takenColors: string[] = []
): Array<ContrastEvaluation & { isTaken: boolean }> {
  const normalizedTaken = new Set(
    takenColors.map(c => (c || '').trim().toUpperCase()).filter(Boolean)
  );

  const evaluations = COLOR_PALETTE.map(c => {
    const evalData = evaluateColorContrast(c.hex, theme);
    return {
      ...evalData,
      isTaken: normalizedTaken.has(c.hex.toUpperCase()),
    };
  });

  // Ordena por maior razão de contraste primeiro
  return evaluations.sort((a, b) => b.contrastRatio - a.contrastRatio);
}

/**
 * Sugere a cor com melhor contraste baseada na luminância do tema ativo
 * e que ainda não tenha sido escolhida na sala.
 */
export function suggestIdealColorForTheme(
  theme: 'light' | 'dark',
  takenColors: string[] = [],
  currentColor?: string
): { color: string; contrastRatio: number; name: string } {
  const ranked = getRankedPaletteForTheme(theme, takenColors);
  
  // Cores livres e recomendadas com contraste ótimo
  const availableRecommended = ranked.filter(r => !r.isTaken && r.isRecommended);
  const availableAny = ranked.filter(r => !r.isTaken);

  let pool = availableRecommended;
  if (pool.length === 0) {
    pool = availableAny.length > 0 ? availableAny : ranked;
  }

  // Se a cor atual já estiver no pool de cores ideais e não estiver em uso por outro, podemos mantê-la
  if (currentColor) {
    const currentNorm = currentColor.trim().toUpperCase();
    const currentEval = evaluateColorContrast(currentNorm, theme);
    const isTakenByOther = takenColors.some(tc => tc.trim().toUpperCase() === currentNorm);
    if (currentEval.isRecommended && !isTakenByOther) {
      return {
        color: currentNorm,
        contrastRatio: currentEval.contrastRatio,
        name: currentEval.name,
      };
    }
  }

  // Seleciona a melhor cor (com maior contraste ideal) ou sorteia entre as melhores recomendadas
  const best = pool[0] || ranked[0];
  return {
    color: best.colorHex,
    contrastRatio: best.contrastRatio,
    name: best.name,
  };
}
