// Paleta oficial de cores históricas e heráldicas para "Infiltrados na Fé"
// Projetada para máxima distinção visual, elegância estética e contraste ideal.

export interface PlayerColorDefinition {
  id: string;
  name: string;
  hex: string;
  borderClass: string;
  bgClass: string;
}

export const AESTHETIC_PLAYER_COLORS: PlayerColorDefinition[] = [
  {
    id: 'crimson',
    name: 'Carmim Real',
    hex: '#991B1B',
    borderClass: 'border-[#991B1B]',
    bgClass: 'bg-[#991B1B]',
  },
  {
    id: 'terracotta',
    name: 'Terracota',
    hex: '#C2410C',
    borderClass: 'border-[#C2410C]',
    bgClass: 'bg-[#C2410C]',
  },
  {
    id: 'amber',
    name: 'Âmbar Sagrado',
    hex: '#D97706',
    borderClass: 'border-[#D97706]',
    bgClass: 'bg-[#D97706]',
  },
  {
    id: 'olive',
    name: 'Oliva Antiga',
    hex: '#4D7C0F',
    borderClass: 'border-[#4D7C0F]',
    bgClass: 'bg-[#4D7C0F]',
  },
  {
    id: 'emerald',
    name: 'Esmeralda',
    hex: '#047857',
    borderClass: 'border-[#047857]',
    bgClass: 'bg-[#047857]',
  },
  {
    id: 'forest',
    name: 'Verde Floresta',
    hex: '#15803D',
    borderClass: 'border-[#15803D]',
    bgClass: 'bg-[#15803D]',
  },
  {
    id: 'teal',
    name: 'Azul Petróleo',
    hex: '#0F766E',
    borderClass: 'border-[#0F766E]',
    bgClass: 'bg-[#0F766E]',
  },
  {
    id: 'cobalt',
    name: 'Cobalto Real',
    hex: '#1D4ED8',
    borderClass: 'border-[#1D4ED8]',
    bgClass: 'bg-[#1D4ED8]',
  },
  {
    id: 'indigo',
    name: 'Índigo Monástico',
    hex: '#4338CA',
    borderClass: 'border-[#4338CA]',
    bgClass: 'bg-[#4338CA]',
  },
  {
    id: 'purple',
    name: 'Púrpura Imperial',
    hex: '#6D28D9',
    borderClass: 'border-[#6D28D9]',
    bgClass: 'bg-[#6D28D9]',
  },
  {
    id: 'plum',
    name: 'Ameixa Antiga',
    hex: '#86198F',
    borderClass: 'border-[#86198F]',
    bgClass: 'bg-[#86198F]',
  },
  {
    id: 'wine',
    name: 'Vinho de Altar',
    hex: '#881337',
    borderClass: 'border-[#881337]',
    bgClass: 'bg-[#881337]',
  },
  {
    id: 'rose',
    name: 'Rosa Antigo',
    hex: '#BE185D',
    borderClass: 'border-[#BE185D]',
    bgClass: 'bg-[#BE185D]',
  },
  {
    id: 'bronze',
    name: 'Bronze Rústico',
    hex: '#78350F',
    borderClass: 'border-[#78350F]',
    bgClass: 'bg-[#78350F]',
  },
  {
    id: 'steel',
    name: 'Azul Aço',
    hex: '#0369A1',
    borderClass: 'border-[#0369A1]',
    bgClass: 'bg-[#0369A1]',
  },
  {
    id: 'charcoal',
    name: 'Grafite Nobre',
    hex: '#334155',
    borderClass: 'border-[#334155]',
    bgClass: 'bg-[#334155]',
  },
];

export function getDefaultColorForIndex(index: number): string {
  const item = AESTHETIC_PLAYER_COLORS[index % AESTHETIC_PLAYER_COLORS.length];
  return item.hex;
}

export function getColorDefinition(hex?: string): PlayerColorDefinition {
  if (!hex) return AESTHETIC_PLAYER_COLORS[0];
  const found = AESTHETIC_PLAYER_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return found || {
    id: 'custom',
    name: 'Cor Personalizada',
    hex,
    borderClass: 'border-black',
    bgClass: 'bg-black',
  };
}

export function getNextAvailableColor(currentlyUsedHexes: string[]): string {
  const normalizedUsed = new Set(currentlyUsedHexes.map(h => (h || '').toLowerCase()));
  for (const item of AESTHETIC_PLAYER_COLORS) {
    if (!normalizedUsed.has(item.hex.toLowerCase())) {
      return item.hex;
    }
  }
  // Fallback se mais de 16 jogadores
  return AESTHETIC_PLAYER_COLORS[currentlyUsedHexes.length % AESTHETIC_PLAYER_COLORS.length].hex;
}
