import React from 'react';

// =========================================================================
// DEFINIÇÕES E TIPOS DE ACESSÓRIOS DO PERSONAGEM (BASE NO DESENHO DO USUÁRIO)
// =========================================================================

export type FaceTypeOption = 'MASCULINO' | 'FEMININO';
export type HatOption = 'NONE' | 'DETETIVE' | 'BONE';
export type GlassesOption = 'NONE' | 'OCULOS' | 'SOL';
export type HairOption = 'NONE' | 'CABELO_1' | 'CABELO_MASC_2' | 'FRANJA' | 'CABELO_FEM_2';
export type BeardOption = 'NONE' | 'BARBA_1' | 'BARBA_2';
export type MustacheOption = 'NONE' | 'BIGODE_1' | 'BIGODE_2';

export interface CharacterAvatarConfig {
  faceType?: FaceTypeOption;
  hat: HatOption;
  glasses: GlassesOption;
  hair: HairOption;
  beard: BeardOption;
  mustache: MustacheOption;
}

export const BASE_FACE_IMAGE = '/assets/aistudio/Gemini_Generated_Image_jzkmfzjzkmfzjzkm__1__f36d13de.jfif';

export const FACE_TYPE_CHOICES: { id: FaceTypeOption; label: string; icon: string }[] = [
  { id: 'MASCULINO', label: 'Rosto Masculino', icon: '👨' },
  { id: 'FEMININO', label: 'Rosto Feminino', icon: '👩' },
];

// Opções com rótulos e miniaturas descritivas
export const HAT_CHOICES: { id: HatOption; label: string; icon: string }[] = [
  { id: 'NONE', label: 'Sem Chapéu', icon: '❌' },
  { id: 'DETETIVE', label: 'Chapéu Detetive', icon: '🕵️' },
  { id: 'BONE', label: 'Boné Esportivo', icon: '🧢' },
];

export const GLASSES_CHOICES: { id: GlassesOption; label: string; icon: string }[] = [
  { id: 'NONE', label: 'Sem Óculos', icon: '❌' },
  { id: 'OCULOS', label: 'Óculos Redondos', icon: '👓' },
  { id: 'SOL', label: 'Óculos de Sol', icon: '🕶️' },
];

export const HAIR_CHOICES: { id: HairOption; label: string; icon: string; gender?: FaceTypeOption | 'ALL' }[] = [
  { id: 'NONE', label: 'Careca / Sem Cabelo', icon: '❌', gender: 'ALL' },
  { id: 'CABELO_1', label: 'Espetado (Masc.)', icon: '⚡', gender: 'MASCULINO' },
  { id: 'CABELO_MASC_2', label: 'Topete Ondulado (Masc.)', icon: '💇‍♂️', gender: 'MASCULINO' },
  { id: 'FRANJA', label: 'Longo c/ Franja (Fem.)', icon: '💇‍♀️', gender: 'FEMININO' },
  { id: 'CABELO_FEM_2', label: 'Ondulado Solto (Fem.)', icon: '👩', gender: 'FEMININO' },
];

export const BEARD_CHOICES: { id: BeardOption; label: string; icon: string }[] = [
  { id: 'NONE', label: 'Sem Barba', icon: '❌' },
  { id: 'BARBA_1', label: 'Barba Desenhada', icon: '🧔' },
  { id: 'BARBA_2', label: 'Barba Cheia Longa', icon: '🧙' },
];

export const MUSTACHE_CHOICES: { id: MustacheOption; label: string; icon: string }[] = [
  { id: 'NONE', label: 'Sem Bigode', icon: '❌' },
  { id: 'BIGODE_1', label: 'Bigode Enrolado', icon: '🥸' },
  { id: 'BIGODE_2', label: 'Bigode Clássico', icon: '👨' },
];

// Compatibilidade com código legado
export type HairType = string;
export type AccessoryType = string;
export type BeardType = string;
export type ExpressionType = string;
export interface AvatarConfig {
  hair?: string;
  accessory?: string;
  beard?: string;
  expression?: string;
}
export const HAIR_OPTIONS = HAIR_CHOICES.map(h => ({ id: h.id, label: h.label }));
export const ACCESSORY_OPTIONS = HAT_CHOICES.map(h => ({ id: h.id, label: h.label }));
export const BEARD_OPTIONS = BEARD_CHOICES.map(b => ({ id: b.id, label: b.label }));
export const EXPRESSION_OPTIONS = [{ id: 'FRIENDLY', label: 'Amigável' }];

export function encodeAvatar(config: CharacterAvatarConfig | AvatarConfig | any): string {
  if (config && 'hat' in config) {
    const face = config.faceType || 'MASCULINO';
    return `custom:${config.hat}:${config.glasses}:${config.hair}:${config.beard}:${config.mustache}:${face}`;
  }
  return `custom:${config?.accessory || 'NONE'}:NONE:${config?.hair || 'NONE'}:${config?.beard || 'NONE'}:NONE:MASCULINO`;
}

export function decodeCharacterAvatar(encoded: string | undefined, seed: string = ''): CharacterAvatarConfig {
  if (encoded && encoded.startsWith('custom:')) {
    const parts = encoded.split(':');
    return {
      hat: (parts[1] as HatOption) || 'NONE',
      glasses: (parts[2] as GlassesOption) || 'NONE',
      hair: (parts[3] as HairOption) || 'NONE',
      beard: (parts[4] as BeardOption) || 'NONE',
      mustache: (parts[5] as MustacheOption) || 'NONE',
      faceType: (parts[6] as FaceTypeOption) || 'MASCULINO',
    };
  }

  // Gera uma combinação legal e variada baseada no nome/seed
  if (seed) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = (hash << 5) - hash + seed.charCodeAt(i);
      hash |= 0;
    }
    const num = Math.abs(hash);
    const isFem = num % 2 === 1;
    const hats: HatOption[] = ['NONE', 'DETETIVE', 'BONE'];
    const glasses: GlassesOption[] = ['NONE', 'OCULOS', 'SOL'];
    const mascHairs: HairOption[] = ['NONE', 'CABELO_1', 'CABELO_MASC_2'];
    const femHairs: HairOption[] = ['FRANJA', 'CABELO_FEM_2'];
    const beards: BeardOption[] = ['NONE', 'BARBA_1', 'BARBA_2'];
    const mustaches: MustacheOption[] = ['NONE', 'BIGODE_1', 'BIGODE_2'];

    return {
      faceType: isFem ? 'FEMININO' : 'MASCULINO',
      hat: hats[num % hats.length],
      glasses: glasses[(num >> 2) % glasses.length],
      hair: isFem ? femHairs[(num >> 4) % femHairs.length] : mascHairs[(num >> 4) % mascHairs.length],
      beard: isFem ? 'NONE' : beards[(num >> 6) % beards.length],
      mustache: isFem ? 'NONE' : mustaches[(num >> 8) % mustaches.length],
    };
  }

  return {
    faceType: 'MASCULINO',
    hat: 'NONE',
    glasses: 'NONE',
    hair: 'NONE',
    beard: 'NONE',
    mustache: 'NONE',
  };
}

export function decodeAvatar(encoded: string | undefined, seed: string = ''): any {
  return decodeCharacterAvatar(encoded, seed);
}

export function generateRandomCharacterConfig(): CharacterAvatarConfig {
  const isFem = Math.random() < 0.45;
  const hats: HatOption[] = ['NONE', 'NONE', 'DETETIVE', 'BONE'];
  const glasses: GlassesOption[] = ['NONE', 'NONE', 'OCULOS', 'SOL'];
  const mascHairs: HairOption[] = ['NONE', 'CABELO_1', 'CABELO_MASC_2'];
  const femHairs: HairOption[] = ['FRANJA', 'CABELO_FEM_2'];
  const beards: BeardOption[] = ['NONE', 'BARBA_1', 'BARBA_2'];
  const mustaches: MustacheOption[] = ['NONE', 'BIGODE_1', 'BIGODE_2'];

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const faceType: FaceTypeOption = isFem ? 'FEMININO' : 'MASCULINO';
  let hat = pick(hats);
  const glass = pick(glasses);
  let hair: HairOption = isFem ? pick(femHairs) : pick(mascHairs);
  const beard: BeardOption = isFem ? 'NONE' : pick(beards);
  const mustache: MustacheOption = isFem ? 'NONE' : pick(mustaches);

  // Garante que o personagem sempre tenha pelo menos cabelo, chapéu, barba ou óculos
  if (!isFem && hair === 'NONE' && hat === 'NONE' && beard === 'NONE' && mustache === 'NONE' && glass === 'NONE') {
    hair = Math.random() < 0.5 ? 'CABELO_1' : 'CABELO_MASC_2';
  }

  return {
    faceType,
    hat,
    glasses: glass,
    hair,
    beard,
    mustache,
  };
}

export function getRandomAvatar(seed?: string): CharacterAvatarConfig {
  if (seed) {
    return decodeCharacterAvatar(undefined, seed);
  }
  return generateRandomCharacterConfig();
}

// =========================================================================
// TRAÇOS DO ROSTO FEMININO (viewBox 0 0 200 200)
// Anatomia exata do rosto base (X: 38..162, Y: 23..175):
// - Olho esq: cx=73, cy=95 (r=7.5) | Olho dir: cx=127, cy=94 (r=7.5)
// - Sobrancelhas: esq 56..84 (Y=78) | dir 115..143 (Y=78)
// - Nariz: X=93..105, Y=101..116
// - Boca/Sorriso: esq(83,134) -> centro(100,139) -> dir(120,130)
// =========================================================================

export const RenderFeminineFaceSVG: React.FC<{ color: string }> = ({ color }) => {
  return (
    <g className="feminine-face-features select-none">
      {/* Cílios femininos longos e curvados no olho esquerdo (cx=73, cy=95) */}
      <path d="M 65 91 Q 58 86 55 81" fill="none" stroke="#111111" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M 68 88 Q 63 82 61 77" fill="none" stroke="#111111" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M 73 87 Q 71 81 70 77" fill="none" stroke="#111111" strokeWidth="2.3" strokeLinecap="round" />

      {/* Cílios femininos longos e curvados no olho direito (cx=127, cy=94) */}
      <path d="M 135 90 Q 142 85 145 80" fill="none" stroke="#111111" strokeWidth="2.8" strokeLinecap="round" />
      <path d="M 132 87 Q 137 81 139 76" fill="none" stroke="#111111" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M 127 86 Q 129 80 130 76" fill="none" stroke="#111111" strokeWidth="2.3" strokeLinecap="round" />

      {/* Brilho delicado nas pupilas para expressão feminina viva */}
      <circle cx="70.5" cy="92.5" r="2.1" fill="#ffffff" />
      <circle cx="124.5" cy="91.5" r="2.1" fill="#ffffff" />

      {/* Sobrancelhas femininas mais arqueadas e delicadas */}
      <path d="M 55 81 Q 68 71 84 77" fill="none" stroke="#111111" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M 116 77 Q 132 71 145 80" fill="none" stroke="#111111" strokeWidth="2.4" strokeLinecap="round" />

      {/* Lábios femininos desenhados (arco do cupido + lábio inferior suave acompanhando o sorriso) */}
      <path
        d="M 83 134 Q 93 130 98 133 Q 101 135 104 132 Q 111 129 120 130 Q 112 143 100 143 Q 89 143 83 134 Z"
        fill={`${color}45`}
        stroke="#111111"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {/* Linha central do sorriso */}
      <path d="M 83 134 Q 101 140 120 130" fill="none" stroke="#111111" strokeWidth="2.4" strokeLinecap="round" />

      {/* Blush rosado suave nas bochechas */}
      <ellipse cx="60" cy="113" rx="9" ry="5" fill={color} fillOpacity="0.18" />
      <ellipse cx="140" cy="112" rx="9" ry="5" fill={color} fillOpacity="0.18" />

      {/* Brincos delicados nas laterais do rosto na cor escolhida */}
      <circle cx="37" cy="108" r="4" fill={color} stroke="#111111" strokeWidth="2" />
      <circle cx="163" cy="108" r="4" fill={color} stroke="#111111" strokeWidth="2" />
    </g>
  );
};

// =========================================================================
// RENDERIZADOR VETORIAL DOS ACESSÓRIOS NA COR DO PERSONAGEM (viewBox 0 0 200 200)
// Coordenadas calibradas exatamente para o rosto (X: 38..162, Y: 23..175)
// =========================================================================

export const RenderAccessoriesSVG: React.FC<{
  config: CharacterAvatarConfig;
  color: string;
}> = ({ config, color }) => {
  const isFeminine = config.faceType === 'FEMININO';

  return (
    <g className="accessories-overlay select-none">
      {/* 0. CAMADA DO ROSTO FEMININO (Se selecionado) */}
      {isFeminine && <RenderFeminineFaceSVG color={color} />}

      {/* 1. CABELOS MASCULINOS E FEMININOS (Encaixados no crânio Y=23 e têmporas X=38..162) */}
      {config.hair === 'CABELO_1' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Cabelo Masculino 1: Espetado (estilo 'cabelo 1' da referência)
              Cobre todo o topo da cabeça (Y=23) e desce pelas têmporas até X=37 e X=163 (Y=92) */}
          <path
            d="M 38 92
               C 33 78, 30 62, 36 52
               C 28 45, 29 34, 41 36
               C 35 23, 44 10, 56 22
               C 55 8, 68 3, 78 17
               C 84 4, 98 2, 106 16
               C 116 4, 131 6, 134 21
               C 146 10, 158 18, 152 33
               C 164 28, 170 40, 160 50
               C 168 60, 166 76, 162 92
               C 159 74, 155 58, 147 48
               C 141 41, 131 44, 125 38
               C 115 44, 105 42, 99 46
               C 91 40, 81 44, 73 39
               C 63 45, 53 42, 49 52
               C 43 62, 41 76, 38 92 Z"
            fill={color}
            stroke={color}
            strokeWidth="2.5"
          />
          {/* Hachuras internas estilo nanquim para dar textura de mechas */}
          <path d="M 48 44 Q 52 26 56 20" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeOpacity="0.65" />
          <path d="M 68 38 Q 72 20 76 14" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeOpacity="0.65" />
          <path d="M 88 38 Q 94 18 100 12" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeOpacity="0.65" />
          <path d="M 110 38 Q 118 20 126 14" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeOpacity="0.65" />
          <path d="M 132 42 Q 142 28 148 22" stroke="#ffffff" strokeWidth="1.8" fill="none" strokeOpacity="0.65" />
          <path d="M 42 66 Q 45 54 52 46" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeOpacity="0.55" />
          <path d="M 158 66 Q 155 54 148 46" stroke="#ffffff" strokeWidth="1.5" fill="none" strokeOpacity="0.55" />
        </g>
      )}

      {config.hair === 'CABELO_MASC_2' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Cabelo Masculino 2: Topete Ondulado Clássico (estilo do cabelo da 'barba 1' da referência)
              Encaixa nas têmporas (X=37..163) e cobre o topo (Y=23) com ondas laterais */}
          <path
            d="M 38 92
               C 32 74, 34 50, 44 36
               C 40 24, 52 12, 68 16
               C 80 6, 108 6, 126 14
               C 144 10, 158 20, 154 32
               C 166 36, 168 50, 160 58
               C 166 68, 165 80, 162 92
               C 158 76, 154 62, 146 52
               C 132 56, 114 52, 98 44
               C 84 48, 68 44, 54 50
               C 46 60, 42 74, 38 92 Z"
            fill={color}
            stroke={color}
            strokeWidth="2.5"
          />
          {/* Mechas onduladas soltas na testa */}
          <path d="M 96 42 C 110 54, 132 58, 150 48" fill="none" stroke={color} strokeWidth="3.5" />
          <path d="M 108 36 C 122 48, 142 50, 160 40" fill="none" stroke={color} strokeWidth="3" />
          {/* Linhas de brilho/textura das ondas */}
          <path d="M 56 34 C 74 20, 106 20, 134 32" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
          <path d="M 68 40 C 88 28, 116 30, 142 42" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.65" />
          <path d="M 50 46 C 62 34, 80 34, 96 40" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.6" />
        </g>
      )}

      {config.hair === 'FRANJA' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Cabelo Feminino 1: Longo com Franja (estilo 'Franja' da referência)
              Cobre o topo da cabeça (Y=14..25), franja desce até Y=68 (acima das sobrancelhas Y=77)
              e mechas longas onduladas emolduram o rosto por fora (X=16..44 e X=156..184) até Y=174 */}
          {/* Camada principal do cabelo longo emoldurando o rosto feminino */}
          <path
            d="M 100 16
               C 68 12, 38 26, 28 54
               C 18 82, 16 116, 22 144
               C 25 158, 20 168, 14 172
               C 26 176, 38 168, 42 154
               C 36 164, 44 174, 54 168
               C 46 154, 42 132, 41 106
               C 40 84, 43 66, 50 54
               C 54 64, 58 70, 62 68
               C 64 58, 68 50, 72 46
               C 74 60, 78 70, 84 70
               C 86 58, 90 48, 94 44
               C 96 58, 100 70, 104 70
               C 106 58, 110 48, 114 46
               C 118 58, 122 70, 128 68
               C 132 58, 136 50, 140 48
               C 144 58, 148 66, 152 64
               C 157 74, 160 90, 159 108
               C 158 132, 154 154, 146 168
               C 156 174, 164 164, 158 154
               C 162 168, 174 176, 186 172
               C 180 168, 175 158, 178 144
               C 184 116, 182 82, 172 54
               C 162 26, 132 12, 100 16 Z"
            fill={color}
            stroke={color}
            strokeWidth="2.5"
          />
          {/* Textura de fios na franja e nas ondas laterais (estilo sketch da referência) */}
          <path d="M 100 18 C 82 22, 62 34, 56 62" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.7" />
          <path d="M 100 18 C 90 26, 82 42, 82 66" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.7" />
          <path d="M 100 18 C 102 32, 102 48, 102 66" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.7" />
          <path d="M 100 18 C 112 26, 120 42, 124 64" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.7" />
          <path d="M 100 18 C 118 22, 138 34, 146 60" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.7" />
          {/* Ondas laterais esquerdas */}
          <path d="M 44 38 C 28 66, 26 106, 32 146" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.65" />
          <path d="M 36 56 C 24 86, 24 122, 38 158" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeOpacity="0.6" />
          {/* Ondas laterais direitas */}
          <path d="M 156 38 C 172 66, 174 106, 168 146" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.65" />
          <path d="M 164 56 C 176 86, 176 122, 162 158" fill="none" stroke="#ffffff" strokeWidth="1.7" strokeOpacity="0.6" />
        </g>
      )}

      {config.hair === 'CABELO_FEM_2' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Cabelo Feminino 2: Ondulado Longo repartido de lado com volume e mechas suaves
              Encaixa perfeitamente no rosto feminino sem cobrir os olhos */}
          <path
            d="M 78 18
               C 50 16, 28 34, 22 64
               C 14 96, 16 134, 24 164
               C 28 176, 40 182, 48 174
               C 42 154, 38 126, 40 96
               C 42 70, 50 52, 66 44
               C 82 36, 104 42, 126 52
               C 142 58, 154 68, 158 92
               C 162 122, 158 152, 152 174
               C 160 182, 172 176, 176 164
               C 184 134, 186 96, 178 64
               C 170 30, 140 12, 104 14
               C 92 14, 84 16, 78 18 Z"
            fill={color}
            stroke={color}
            strokeWidth="2.5"
          />
          {/* Coque/Presilha ou onda superior elegante */}
          <path d="M 76 20 C 98 22, 132 30, 156 54" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.7" />
          <path d="M 72 28 C 96 30, 126 38, 150 62" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.65" />
          <path d="M 64 26 C 42 42, 28 78, 30 128" fill="none" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.65" />
          <path d="M 52 44 C 34 72, 32 114, 38 158" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.6" />
          <path d="M 164 56 C 176 86, 174 126, 166 160" fill="none" stroke="#ffffff" strokeWidth="1.8" strokeOpacity="0.6" />
        </g>
      )}

      {/* 2. CHAPÉUS (Calibrados para a largura da cabeça X=38..162 e topo Y=23) */}
      {config.hat === 'DETETIVE' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Aba larga do chapéu detetive */}
          <path
            d="M 14 48 C 40 32, 160 32, 186 48 C 164 60, 36 60, 14 48 Z"
            fill="#ffffff"
            stroke={color}
            strokeWidth="3.5"
          />
          {/* Copa do chapéu cobrindo o topo da cabeça (Y=23) */}
          <path
            d="M 44 44 C 48 16, 64 6, 88 12 C 96 15, 104 15, 112 12 C 136 6, 152 16, 156 44 Z"
            fill="#ffffff"
            stroke={color}
            strokeWidth="3.2"
          />
          {/* Vinco clássico no topo */}
          <path d="M 72 13 Q 100 22 128 13" fill="none" stroke={color} strokeWidth="2.4" />
          {/* Fita estilosa na cor do personagem */}
          <path
            d="M 44 38 C 72 33, 128 33, 156 38 L 155 45 C 128 40, 72 40, 45 45 Z"
            fill={color}
            stroke={color}
            strokeWidth="2"
          />
          {/* Hachuras estilo desenho à mão */}
          <line x1="58" y1="20" x2="66" y2="35" stroke={color} strokeWidth="1.6" />
          <line x1="66" y1="18" x2="74" y2="34" stroke={color} strokeWidth="1.6" />
          <line x1="138" y1="20" x2="130" y2="35" stroke={color} strokeWidth="1.6" />
          <line x1="145" y1="24" x2="138" y2="36" stroke={color} strokeWidth="1.6" />
        </g>
      )}

      {config.hat === 'BONE' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Copa do Boné encaixada no crânio (X=40..160, cobrindo Y=23) */}
          <path
            d="M 42 46 C 44 10, 156 10, 158 46 Z"
            fill="#ffffff"
            stroke={color}
            strokeWidth="3.2"
          />
          {/* Costuras dos gomos do boné */}
          <path d="M 100 12 L 100 42" fill="none" stroke={color} strokeWidth="2" />
          <path d="M 100 12 Q 74 22 58 44" fill="none" stroke={color} strokeWidth="2" />
          <path d="M 100 12 Q 126 22 142 44" fill="none" stroke={color} strokeWidth="2" />
          {/* Pino no topo */}
          <circle cx="100" cy="11" r="3.5" fill={color} stroke={color} strokeWidth="1.5" />
          {/* Aba curvada do boné */}
          <path
            d="M 30 46 C 56 32, 144 32, 166 46 C 150 60, 52 58, 30 46 Z"
            fill={color}
            stroke={color}
            strokeWidth="3.2"
          />
          <path d="M 42 47 Q 100 56 154 47" fill="none" stroke="#ffffff" strokeWidth="1.8" />
        </g>
      )}

      {/* 3. ÓCULOS (Centrados exatamente nos olhos cx=73, cy=95 e cx=127, cy=94; hastes até X=38 e X=162) */}
      {config.glasses === 'OCULOS' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round" fill="none">
          {/* Aro externo e lente esquerda (centrada em 73, 95) */}
          <circle cx="73" cy="95" r="19" stroke={color} strokeWidth="3.8" fill={`${color}18`} />
          {/* Aro externo e lente direita (centrada em 127, 95) */}
          <circle cx="127" cy="95" r="19" stroke={color} strokeWidth="3.8" fill={`${color}18`} />
          {/* Ponte central entre os olhos */}
          <path d="M 92 94 Q 100 88 108 94" stroke={color} strokeWidth="3.6" />
          {/* Hastes encaixadas até as têmporas (X=38 e X=162) */}
          <path d="M 54 94 L 38 90" stroke={color} strokeWidth="3.2" />
          <path d="M 146 94 L 162 90" stroke={color} strokeWidth="3.2" />
          {/* Reflexos diagonais estilo sketch */}
          <line x1="61" y1="86" x2="69" y2="79" stroke={color} strokeWidth="1.8" strokeOpacity="0.6" />
          <line x1="115" y1="86" x2="123" y2="79" stroke={color} strokeWidth="1.8" strokeOpacity="0.6" />
        </g>
      )}

      {config.glasses === 'SOL' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Lente esquerda Wayfarer (cobrindo olho 73, 95) */}
          <path
            d="M 46 84 C 62 80, 90 82, 94 91 C 94 106, 84 113, 70 113 C 54 113, 48 102, 46 84 Z"
            fill="#111827"
            stroke={color}
            strokeWidth="3.5"
          />
          {/* Lente direita Wayfarer (cobrindo olho 127, 95) */}
          <path
            d="M 154 84 C 138 80, 110 82, 106 91 C 106 106, 116 113, 130 113 C 146 113, 152 102, 154 84 Z"
            fill="#111827"
            stroke={color}
            strokeWidth="3.5"
          />
          {/* Ponte central */}
          <path d="M 93 87 Q 100 84 107 87" stroke={color} strokeWidth="3.8" fill="none" />
          {/* Hastes laterais até a borda da cabeça (X=38 e X=162) */}
          <path d="M 46 86 L 38 83" stroke={color} strokeWidth="3.4" />
          <path d="M 154 86 L 162 83" stroke={color} strokeWidth="3.4" />
          {/* Brilho nas lentes escuras */}
          <line x1="56" y1="88" x2="68" y2="108" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.75" />
          <line x1="63" y1="88" x2="72" y2="103" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.55" />
          <line x1="116" y1="88" x2="128" y2="108" stroke="#ffffff" strokeWidth="2.2" strokeOpacity="0.75" />
          <line x1="123" y1="88" x2="132" y2="103" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.55" />
        </g>
      )}

      {/* 4. BARBAS (Encaixadas no contorno real da mandíbula X=38..162 até o queixo Y=175)
          Renderizadas antes do bigode para o bigode sobrepor caso ambos estejam ativos */}
      {config.beard === 'BARBA_1' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Barba 1: Barba Desenhada / Cerrada com Costeletas e Cavanhaque (fiel à 'barba 1' da referência)
              Segue exatamente da têmpora esquerda (38, 94) contornando o queixo (100, 178) até a têmpora direita (162, 94)
              e emoldura a boca (Y=130..146) deixando o sorriso visível no centro */}
          <path
            d="M 37 93
               C 37 116, 41 138, 52 156
               C 64 172, 82 180, 100 180
               C 118 180, 136 172, 148 156
               C 159 138, 163 116, 163 93
               L 155 93
               C 154 114, 149 132, 138 146
               C 132 152, 127 154, 125 144
               C 125 130, 114 122, 100 124
               C 86 122, 75 130, 75 144
               C 73 154, 68 152, 62 146
               C 51 132, 46 114, 45 93
               Z
               M 82 132
               C 90 128, 110 128, 118 132
               C 120 138, 118 146, 110 149
               C 106 144, 103 142, 100 145
               C 97 142, 94 144, 90 149
               C 82 146, 80 138, 82 132 Z"
            fill={color}
            fillRule="evenodd"
            stroke={color}
            strokeWidth="2.5"
          />
          {/* Textura de fios curtos na barba cerrada */}
          <path d="M 60 156 L 63 165 M 70 162 L 72 172 M 82 166 L 83 177 M 94 168 L 94 179 M 106 168 L 106 179 M 118 166 L 117 177 M 130 162 L 128 172 M 140 156 L 137 165" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.65" />
        </g>
      )}

      {config.beard === 'BARBA_2' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Barba 2: Barba Cheia e Longa (fiel à 'barba 2' da referência)
              Começa nas costeletas (38, 92 e 162, 92), abraça toda a mandíbula e queixo até Y=194,
              passa acima da boca (Y=122) e deixa abertura para os lábios (X=82..118, Y=130..144) */}
          <path
            d="M 38 92
               C 35 118, 37 146, 50 168
               C 64 186, 84 195, 100 196
               C 116 195, 136 186, 150 168
               C 163 146, 165 118, 162 92
               C 157 104, 152 118, 144 128
               C 134 126, 122 121, 100 122
               C 78 121, 66 126, 56 128
               C 48 118, 43 104, 38 92 Z
               M 82 132
               C 90 128, 110 128, 118 132
               C 120 139, 114 145, 106 144
               C 102 141, 98 141, 94 144
               C 86 145, 80 139, 82 132 Z"
            fill={color}
            fillRule="evenodd"
            stroke={color}
            strokeWidth="2.8"
          />
          {/* Linhas longas verticais estilo gravura/sketch da 'barba 2' */}
          <path d="M 56 138 Q 62 162 72 180" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.65" />
          <path d="M 68 142 Q 74 168 84 188" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.65" />
          <path d="M 82 148 Q 88 172 94 192" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.65" />
          <path d="M 100 146 Q 100 172 100 193" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.65" />
          <path d="M 118 148 Q 112 172 106 192" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.65" />
          <path d="M 132 142 Q 126 168 116 188" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.65" />
          <path d="M 144 138 Q 138 162 128 180" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeOpacity="0.65" />
        </g>
      )}

      {/* 5. BIGODES (Posicionados cirurgicamente entre o nariz Y=116 e a boca Y=134 -> centro em Y=124) */}
      {config.mustache === 'BIGODE_1' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Bigode 1: Bigode Imperial Enrolado (Handlebar da referência) */}
          <path
            d="M 100 121
               C 93 116, 80 116, 70 123
               C 62 128, 52 127, 52 120
               C 52 114, 59 113, 61 118
               C 57 119, 58 123, 64 122
               C 72 120, 82 112, 100 121
               Z"
            fill={color}
            stroke={color}
            strokeWidth="2"
          />
          <path
            d="M 100 121
               C 92 115, 78 116, 66 124
               C 56 130, 48 126, 50 117
               C 51 112, 57 112, 58 116
               C 55 117, 55 122, 62 121
               C 72 118, 84 132, 100 127
               C 116 132, 128 118, 138 121
               C 145 122, 145 117, 142 116
               C 143 112, 149 112, 150 117
               C 152 126, 144 130, 134 124
               C 122 116, 108 115, 100 121 Z"
            fill={color}
            stroke={color}
            strokeWidth="2.4"
          />
          {/* Textura interna de fios do bigode enrolado */}
          <path d="M 96 122 C 86 119, 76 122, 64 125" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.75" />
          <path d="M 104 122 C 114 119, 124 122, 136 125" fill="none" stroke="#ffffff" strokeWidth="1.4" strokeOpacity="0.75" />
        </g>
      )}

      {config.mustache === 'BIGODE_2' && (
        <g stroke={color} strokeLinecap="round" strokeLinejoin="round">
          {/* Bigode 2: Bigode Clássico Cheio com pontas levemente erguidas (segundo bigode da referência) */}
          <path
            d="M 100 121
               C 92 115, 78 117, 68 124
               C 62 127, 56 126, 53 121
               C 55 130, 66 134, 78 132
               C 88 131, 95 128, 100 126
               C 105 128, 112 131, 122 132
               C 134 134, 145 130, 147 121
               C 144 126, 138 127, 132 124
               C 122 117, 108 115, 100 121 Z"
            fill={color}
            stroke={color}
            strokeWidth="2.4"
          />
          <path d="M 94 123 Q 80 125 66 128" fill="none" stroke="#ffffff" strokeWidth="1.3" strokeOpacity="0.6" />
          <path d="M 106 123 Q 120 125 134 128" fill="none" stroke="#ffffff" strokeWidth="1.3" strokeOpacity="0.6" />
        </g>
      )}
    </g>
  );
};

// =========================================================================
// COMPONENTE PRINCIPAL PERSONAVATAR
// =========================================================================

interface PersonAvatarProps {
  avatar?: string;
  seed?: string;
  color?: string;
  size?: number | string;
  className?: string;
  config?: CharacterAvatarConfig | AvatarConfig | any;
}

export const PersonAvatar: React.FC<PersonAvatarProps> = ({
  avatar,
  seed = '',
  color = '#F59E0B',
  size = 40,
  className = '',
  config: customConfig,
}) => {
  const pixelSize = typeof size === 'number' ? `${size}px` : size;

  // 1. Se for uma imagem Data URL salva pelo usuário (desenho + acessórios compostos)
  if (avatar && (avatar.startsWith('data:image/') || avatar.startsWith('http://') || avatar.startsWith('https://'))) {
    return (
      <div
        className={`relative inline-block rounded-full overflow-hidden select-none shrink-0 ${className}`}
        style={{
          width: pixelSize,
          height: pixelSize,
          border: `2.5px solid ${color}`,
          boxShadow: `0 2px 6px ${color}33`,
          backgroundColor: '#ffffff',
        }}
      >
        <img
          src={avatar}
          alt={seed || 'Avatar'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
    );
  }

  // 2. Se for uma configuração de acessórios estruturada ou seed
  const characterConfig = customConfig && 'hat' in customConfig
    ? (customConfig as CharacterAvatarConfig)
    : decodeCharacterAvatar(avatar, seed);

  return (
    <div
      className={`relative inline-block rounded-full overflow-hidden select-none shrink-0 ${className}`}
      style={{
        width: pixelSize,
        height: pixelSize,
        border: `2.5px solid ${color}`,
        boxShadow: `0 2px 6px ${color}33`,
        backgroundColor: '#ffffff',
      }}
    >
      <svg
        viewBox="0 0 200 200"
        className="w-full h-full"
        style={{ backgroundColor: '#ffffff' }}
      >
        {/* Rosto Base do Jogo (Gemini_Generated_Image_jzkmfzjzkmfzjzkm__1__f36d13de.jfif) */}
        <image
          href={BASE_FACE_IMAGE}
          x="0"
          y="0"
          width="200"
          height="200"
          preserveAspectRatio="xMidYMid slice"
        />

        {/* Camada de Rosto Feminino (se ativo) + Acessórios Pré-Prontos na Cor Escolhida pelo Jogador */}
        <RenderAccessoriesSVG config={characterConfig} color={color} />
      </svg>
    </div>
  );
};

