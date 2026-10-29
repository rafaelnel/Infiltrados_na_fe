import React from 'react';
import { Role } from '../types/game';

interface IllustrationProps {
  className?: string;
  size?: number;
}

// 4-pointed star decoration
export const FourPointStar: React.FC<{ size?: number; className?: string }> = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`inline-block ${className}`}
  >
    <path d="M12 0 Q12 12 0 12 Q12 12 12 24 Q12 12 24 12 Q12 12 12 0 Z" />
  </svg>
);

// 🐑 Ovelha (Fluffy, cute innocent lamb)
export const SheepIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 220"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
  >
    {/* Floor shadow */}
    <path d="M50 208 Q100 210 150 208 M65 212 Q100 213 135 212" />
    {/* Legs */}
    <line x1="78" y1="162" x2="78" y2="206" />
    <line x1="90" y1="164" x2="90" y2="206" />
    <line x1="114" y1="164" x2="114" y2="206" />
    <line x1="126" y1="162" x2="126" y2="206" />
    {/* Hooves */}
    <line x1="75" y1="206" x2="81" y2="206" strokeWidth="3.5" />
    <line x1="87" y1="206" x2="93" y2="206" strokeWidth="3.5" />
    <line x1="111" y1="206" x2="117" y2="206" strokeWidth="3.5" />
    <line x1="123" y1="206" x2="129" y2="206" strokeWidth="3.5" />
    {/* Cloud Tail */}
    <path d="M48 132 C40 132 40 144 48 144 C42 150 50 156 56 150" fill="#ffffff" />
    {/* Fluffy Cloud Body */}
    <path
      d="M70 162 C58 162 50 150 54 138 C44 130 46 112 56 104 C52 92 64 80 76 84 C84 72 102 70 112 78 C122 70 140 72 146 84 C158 82 168 94 164 106 C174 116 172 132 162 140 C166 152 156 164 144 162 C134 170 118 168 110 162 C100 170 82 170 70 162 Z"
      fill="#ffffff"
    />
    {/* Head Oval */}
    <path d="M 78,108 A 24,22 0 1,0 126,108 A 24,22 0 1,0 78,108 Z" fill="#ffffff" />
    {/* Wool on head */}
    <path d="M88 90 C84 82 92 76 98 80 C102 74 112 74 114 80 C120 78 126 84 122 92 C116 90 94 90 88 90 Z" fill="#ffffff" />
    {/* Ears */}
    <path d="M 64,104 A 10,5 0 1,0 84,104 A 10,5 0 1,0 64,104 Z" fill="#ffffff" transform="rotate(-20 74 104)" />
    <path d="M 120,104 A 10,5 0 1,0 140,104 A 10,5 0 1,0 120,104 Z" fill="#ffffff" transform="rotate(20 130 104)" />
    {/* Eyes */}
    <circle cx="94" cy="106" r="2.5" fill="#000000" />
    <circle cx="110" cy="106" r="2.5" fill="#000000" />
    {/* Innocent Muzzle */}
    <path d="M100 114 L104 114 M102 114 L102 118 M99 120 Q102 122 105 120" strokeWidth="2" />
    {/* Cheeks */}
    <line x1="86" y1="114" x2="90" y2="114" strokeWidth="1.5" />
    <line x1="114" y1="114" x2="118" y2="114" strokeWidth="1.5" />
    {/* Tiny flower in mouth */}
    <circle cx="108" cy="124" r="3" fill="#ffffff" />
    <path d="M104 120 Q106 126 108 124" strokeWidth="1.5" />
  </svg>
);

// 🪖 Soldado — ELMO (Elmo com viseira gradeada e protetores auriculares)
export const SoldierIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="5"
  >
    {/* Cúpula Superior do Elmo (Dome) */}
    <path
      d="M 40,92 C 40,32 160,32 160,92"
      fill="#ffffff"
    />

    {/* Crista Central no Topo (Central Ridge) */}
    <path
      d="M 91,26 L 109,26 L 111,64 L 89,64 Z"
      fill="#ffffff"
    />

    {/* Abas Protetoras das Faces / Bochechas (Cheek Guards) */}
    {/* Aba Esquerda */}
    <path
      d="M 38,108 L 38,158 L 76,176 L 76,138 C 56,138 50,124 56,106 Z"
      fill="#ffffff"
    />
    {/* Aba Direita */}
    <path
      d="M 162,108 L 162,158 L 124,176 L 124,138 C 144,138 150,124 144,106 Z"
      fill="#ffffff"
    />

    {/* Viseira Frontal Angular com Fendas Verticais */}
    <path
      d="M 32,88 L 100,62 L 168,88 L 168,114 Q 100,102 32,114 Z"
      fill="#ffffff"
    />
    {/* Linha divisória central da viseira */}
    <line x1="100" y1="62" x2="100" y2="108" strokeWidth="4.5" />

    {/* Fendas de visão (3 à esquerda, 3 à direita) */}
    <line x1="52" y1="89" x2="52" y2="102" strokeWidth="4.5" />
    <line x1="68" y1="84" x2="68" y2="99" strokeWidth="4.5" />
    <line x1="84" y1="79" x2="84" y2="96" strokeWidth="4.5" />

    <line x1="116" y1="79" x2="116" y2="96" strokeWidth="4.5" />
    <line x1="132" y1="84" x2="132" y2="99" strokeWidth="4.5" />
    <line x1="148" y1="89" x2="148" y2="102" strokeWidth="4.5" />
  </svg>
);

// 🦯 Pastor — CAJADO (Cajado de Pastor diagonal com curva superior)
export const ShepherdIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* Contorno externo preto do cajado */}
    <path
      d="M 32,174 L 124,72 C 110,48 134,22 158,34 C 180,46 178,80 154,90"
      stroke="#000000"
      strokeWidth="16"
    />
    {/* Miolo branco para formar o traço duplo tubular idêntico à ilustração */}
    <path
      d="M 32,174 L 124,72 C 110,48 134,22 158,34 C 180,46 178,80 154,90"
      stroke="#ffffff"
      strokeWidth="7"
    />
  </svg>
);

// 📖 Evangelista — BÍBLIA (Bíblia fechada com cruz central e páginas na base)
export const EvangelistIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="4.5"
  >
    {/* Corpo Principal e Lombada da Bíblia */}
    <path
      d="M 56,28 C 44,28 40,36 40,46 L 40,156 C 40,168 48,174 60,174 L 160,174 C 154,167 154,159 160,152 L 160,28 Z"
      fill="#ffffff"
    />

    {/* Capa Frontal (delimitação da lombada e base das folhas) */}
    <path
      d="M 56,28 L 56,152 L 160,152"
      fill="none"
    />

    {/* Curva da lombada na base ligando às páginas */}
    <path
      d="M 40,156 C 40,148 48,152 56,152"
      fill="none"
    />

    {/* Linhas horizontais das páginas na parte inferior */}
    <line x1="54" y1="160" x2="155" y2="160" strokeWidth="3.5" />
    <line x1="54" y1="167" x2="156" y2="167" strokeWidth="3.5" />

    {/* Cruz Cristã em Linha Dupla no Centro da Capa */}
    <path
      d="M 102,52 L 114,52 L 114,72 L 132,72 L 132,84 L 114,84 L 114,120 L 102,120 L 102,84 L 84,84 L 84,72 L 102,72 Z"
      fill="#ffffff"
      strokeWidth="4.2"
    />
  </svg>
);

// ⚖️ Apóstolo — BALANÇA DE JUSTIÇA (Balança clássica com losango no topo e dois pratos)
export const ApostleIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="4.2"
  >
    {/* Base / Pedestal da Balança */}
    <path
      d="M 74,178 L 126,178 C 124,168 114,164 100,164 C 86,164 76,168 74,178 Z"
      fill="#ffffff"
    />
    <path d="M 86,164 L 114,164" />

    {/* Coluna Central Vertical */}
    <rect x="96" y="64" width="8" height="100" fill="#ffffff" />

    {/* Losango (Finial) no Topo da Coluna */}
    <polygon points="100,22 108,36 100,48 92,36" fill="#ffffff" />

    {/* Travessão Ondulado (Balance Beam) */}
    <path
      d="M 32,62 C 52,44 74,48 92,54 L 108,54 C 126,48 148,44 168,62 C 148,54 128,58 108,62 L 92,62 C 72,58 52,54 32,62 Z"
      fill="#ffffff"
    />

    {/* Anel Central do Eixo */}
    <circle cx="100" cy="56" r="8" fill="#ffffff" />

    {/* Argolas das Extremidades */}
    <circle cx="34" cy="63" r="4" fill="#ffffff" />
    <circle cx="166" cy="63" r="4" fill="#ffffff" />

    {/* Correntes e Prato Esquerdo */}
    <line x1="34" y1="67" x2="16" y2="128" strokeWidth="3.5" />
    <line x1="34" y1="67" x2="34" y2="128" strokeWidth="3.5" />
    <line x1="34" y1="67" x2="52" y2="128" strokeWidth="3.5" />
    <path
      d="M 10,128 L 58,128 C 54,146 14,146 10,128 Z"
      fill="#ffffff"
      strokeWidth="4.2"
    />

    {/* Correntes e Prato Direito */}
    <line x1="166" y1="67" x2="148" y2="128" strokeWidth="3.5" />
    <line x1="166" y1="67" x2="166" y2="128" strokeWidth="3.5" />
    <line x1="166" y1="67" x2="184" y2="128" strokeWidth="3.5" />
    <path
      d="M 142,128 L 190,128 C 186,146 146,146 142,128 Z"
      fill="#ffffff"
      strokeWidth="4.2"
    />
  </svg>
);

// 📯 Profeta — SHOFAR (Chifre de carneiro recurvado com detalhes de textura)
export const ProphetIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="4.5"
  >
    {/* Corpo Curvo do Shofar */}
    <path
      d="M 18,98 C 14,96 14,88 22,88 C 40,89 52,102 68,118 C 88,138 110,136 124,112 C 134,94 140,74 144,56 L 182,56 C 178,94 166,132 140,152 C 114,172 80,168 54,140 C 38,122 30,104 18,98 Z"
      fill="#ffffff"
    />

    {/* Abertura Oval na Extremidade Direita */}
    <ellipse
      cx="163"
      cy="56"
      rx="19"
      ry="8"
      fill="#ffffff"
      transform="rotate(-4 163 56)"
    />
    <path d="M 150,57 Q 163,60 176,56" strokeWidth="3" />

    {/* Traços Internos de Textura Orgânica do Chifre */}
    <path d="M 143,75 C 151,78 159,77 166,73" strokeWidth="3.5" />
    <path d="M 138,93 C 146,96 154,94 162,89" strokeWidth="3.5" />
    <path d="M 130,112 C 139,115 149,112 156,105" strokeWidth="3.5" />
    <path d="M 116,131 C 127,135 139,131 148,122" strokeWidth="3.5" />
    <path d="M 96,146 C 110,151 125,148 136,140" strokeWidth="3.5" />
    <path d="M 72,142 C 82,150 94,154 106,154" strokeWidth="3.5" />
    <path d="M 52,120 C 60,130 68,136 76,139" strokeWidth="3.5" />
    <path d="M 38,102 C 44,108 50,114 56,118" strokeWidth="3.5" />
  </svg>
);

// 🪶📜 Mestre — PENA DE ESCRITOR (Pena de escrita ao lado de pergaminho desenrolado)
export const MasterIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 200"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="4.2"
  >
    {/* ========================================== */}
    {/* 1. PENA DE ESCRITOR (À ESQUERDA)           */}
    {/* ========================================== */}
    {/* Corpo da Pluma com recortes característicos */}
    <path
      d="M 22,38 C 18,62 24,86 36,104 L 46,102 L 38,114 C 44,126 52,136 62,144 L 70,138 L 64,148 C 68,154 72,158 76,162 C 78,150 78,136 74,122 L 66,118 L 72,110 C 68,96 62,82 54,70 L 46,72 L 50,62 C 42,50 32,42 22,38 Z"
      fill="#ffffff"
    />
    {/* Haste Central (Ráquis) até a Ponta da Pena */}
    <path
      d="M 28,50 C 44,82 64,126 82,174"
      strokeWidth="4.5"
    />

    {/* ========================================== */}
    {/* 2. PERGAMINHO DESENROLADO (À DIREITA)      */}
    {/* ========================================== */}
    {/* Rolo Superior Esquerdo (Aba enrolada para trás) */}
    <path
      d="M 96,46 C 86,46 84,64 94,64 L 106,64 L 106,46 Z"
      fill="#ffffff"
    />

    {/* Folha Principal do Pergaminho */}
    <path
      d="M 96,46 L 162,46 C 170,46 174,52 174,62 L 174,146 L 106,146 L 106,60 C 106,50 102,46 96,46 Z"
      fill="#ffffff"
    />

    {/* Rolo Cilíndrico Inferior do Pergaminho */}
    <path
      d="M 106,146 C 106,160 112,166 120,166 L 182,166 C 190,166 192,146 180,146 L 120,146"
      fill="#ffffff"
    />
    {/* Espiral interna do rolo inferior */}
    <path
      d="M 120,166 C 128,166 128,146 120,146 C 114,146 114,158 120,158"
      fill="none"
    />
  </svg>
);

export const RoleIllustration: React.FC<{ role: Role; className?: string; size?: number }> = ({
  role,
  className,
  size,
}) => {
  switch (role) {
    case 'SOLDADO':
      return <SoldierIllustration className={className} size={size} />;
    case 'PASTOR':
      return <ShepherdIllustration className={className} size={size} />;
    case 'EVANGELISTA':
      return <EvangelistIllustration className={className} size={size} />;
    case 'APOSTOLO':
      return <ApostleIllustration className={className} size={size} />;
    case 'PROFETA':
      return <ProphetIllustration className={className} size={size} />;
    case 'MESTRE':
      return <MasterIllustration className={className} size={size} />;
    case 'OVELHA':
    default:
      return <SheepIllustration className={className} size={size} />;
  }
};
