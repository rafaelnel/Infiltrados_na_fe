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
    <ellipse cx="102" cy="108" rx="24" ry="22" fill="#ffffff" />
    {/* Wool on head */}
    <path d="M88 90 C84 82 92 76 98 80 C102 74 112 74 114 80 C120 78 126 84 122 92 C116 90 94 90 88 90 Z" fill="#ffffff" />
    {/* Ears */}
    <ellipse cx="74" cy="104" rx="10" ry="5" fill="#ffffff" transform="rotate(-20 74 104)" />
    <ellipse cx="130" cy="104" rx="10" ry="5" fill="#ffffff" transform="rotate(20 130 104)" />
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

// ⚔️ Soldado (Legionário Romano com Lança Pilum, Escudo Scutum, Elmo com Crista e Sandálias Caligae)
export const SoldierIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 310"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
  >
    {/* Ground Line */}
    <path d="M 32 284 Q 105 285 178 284" strokeWidth="3" />

    {/* ========================================== */}
    {/* 1. SPEAR / PILUM (Behind & In Hand) */}
    {/* ========================================== */}
    {/* Shaft */}
    <line x1="33" y1="52" x2="52" y2="284" strokeWidth="2.6" />
    {/* Spear Point (Diamond) */}
    <polygon points="33,24 39,44 33,50 27,44" fill="#ffffff" strokeWidth="2.5" />
    <line x1="33" y1="24" x2="33" y2="50" strokeWidth="1.8" />
    {/* Spear Weighted Block */}
    <polygon points="32,96 39,96 41,114 30,114" fill="#ffffff" strokeWidth="2.4" />

    {/* ========================================== */}
    {/* 2. LEGS & ROMAN CALIGAE SANDALS */}
    {/* ========================================== */}
    {/* Left Leg */}
    <path d="M 83 218 L 86 270" strokeWidth="2.4" />
    <path d="M 98 218 L 98 270" strokeWidth="2.4" />
    {/* Left Sandal Cross Straps */}
    <line x1="84" y1="244" x2="98" y2="244" strokeWidth="2" />
    <line x1="84" y1="244" x2="98" y2="256" strokeWidth="2" />
    <line x1="98" y1="244" x2="85" y2="256" strokeWidth="2" />
    <line x1="85" y1="256" x2="98" y2="268" strokeWidth="2" />
    <line x1="98" y1="256" x2="86" y2="268" strokeWidth="2" />
    <line x1="86" y1="270" x2="98" y2="270" strokeWidth="2" />
    {/* Left Foot / Sandal */}
    <path d="M 70 284 L 102 284 L 102 276 L 86 276" strokeWidth="2.4" />
    <path d="M 70 284 C 70 274, 84 274, 86 284" fill="#ffffff" strokeWidth="2.4" />
    <line x1="78" y1="276" x2="81" y2="284" strokeWidth="2" />

    {/* Right Leg */}
    <path d="M 114 218 L 114 270" strokeWidth="2.4" />
    <path d="M 129 218 L 126 270" strokeWidth="2.4" />
    {/* Right Sandal Cross Straps */}
    <line x1="114" y1="244" x2="128" y2="244" strokeWidth="2" />
    <line x1="114" y1="244" x2="127" y2="256" strokeWidth="2" />
    <line x1="128" y1="244" x2="114" y2="256" strokeWidth="2" />
    <line x1="114" y1="256" x2="126" y2="268" strokeWidth="2" />
    <line x1="127" y1="256" x2="115" y2="268" strokeWidth="2" />
    <line x1="115" y1="270" x2="126" y2="270" strokeWidth="2" />
    {/* Right Foot / Sandal */}
    <path d="M 112 284 L 144 284 L 144 276 L 126 276" strokeWidth="2.4" />
    <path d="M 126 284 C 126 274, 142 274, 144 284" fill="#ffffff" strokeWidth="2.4" />
    <line x1="134" y1="276" x2="137" y2="284" strokeWidth="2" />

    {/* ========================================== */}
    {/* 3. TUNIC SKIRT & BELT PTERUGES */}
    {/* ========================================== */}
    {/* Skirt */}
    <polygon points="70,182 62,218 142,218 136,182" fill="#ffffff" strokeWidth="2.5" />
    {/* Belt */}
    <rect x="68" y="176" width="70" height="7" fill="#ffffff" strokeWidth="2.4" />
    
    {/* Leather Hanging Strips (Pteruges) */}
    {/* Left Strip */}
    <polygon points="88,183 83,212 92,212 94,183" fill="#ffffff" strokeWidth="2.2" />
    {/* Center Strip */}
    <polygon points="98,183 97,218 107,218 108,183" fill="#ffffff" strokeWidth="2.2" />
    {/* Right Strip */}
    <polygon points="112,183 114,212 123,212 118,183" fill="#ffffff" strokeWidth="2.2" />

    {/* ========================================== */}
    {/* 4. TORSO ARMOR (Lorica Segmentata) */}
    {/* ========================================== */}
    {/* Main Torso Block */}
    <polygon points="77,114 69,176 137,176 132,114" fill="#ffffff" strokeWidth="2.5" />
    {/* Segmented Plates Lines */}
    <rect x="94" y="125" width="20" height="9" fill="#ffffff" strokeWidth="2.3" rx="1" />
    <line x1="91" y1="145" x2="119" y2="145" strokeWidth="2.5" />
    <line x1="91" y1="156" x2="119" y2="156" strokeWidth="2.5" />
    <line x1="91" y1="167" x2="119" y2="167" strokeWidth="2.5" />

    {/* Shoulder Pauldrons / Guards */}
    {/* Left Pauldron */}
    <polygon points="77,114 67,140 85,140 87,114" fill="#ffffff" strokeWidth="2.3" />
    {/* Right Pauldron */}
    <polygon points="127,114 125,140 142,140 132,114" fill="#ffffff" strokeWidth="2.3" />

    {/* Left Arm (Spear Hand) */}
    {/* Sleeve */}
    <polygon points="77,115 62,142 75,140" fill="#ffffff" strokeWidth="2.2" />
    {/* Arm Lines */}
    <polyline points="65,142 59,165 38,142" strokeWidth="2.5" />
    {/* Hand gripping spear */}
    <path d="M 37 137 C 33 137 33 147 38 147" strokeWidth="2.4" />

    {/* ========================================== */}
    {/* 5. SCUTUM SHIELD (Left Hand side of image) */}
    {/* ========================================== */}
    {/* Curved rectangular shield */}
    <path d="M 158,124 C 160,118 178,122 178,128 L 176,236 C 176,242 152,246 144,244 L 142,138 C 142,132 154,124 158,124 Z" fill="#ffffff" strokeWidth="2.6" strokeLinejoin="round" />
    {/* Shield Umbo / Handle Side Bump */}
    <path d="M 175,158 C 187,162 188,182 175,186 Z" fill="#ffffff" strokeWidth="2.4" />

    {/* Right Arm (Holding Shield) */}
    {/* Sleeve */}
    <polygon points="132,115 146,140 136,142" fill="#ffffff" strokeWidth="2.2" />
    {/* Arm Line to Shield */}
    <line x1="142" y1="138" x2="152" y2="152" strokeWidth="2.5" />

    {/* ========================================== */}
    {/* 6. HEAD, CHEEK GUARDS & FACE */}
    {/* ========================================== */}
    {/* Neck */}
    <line x1="96" y1="104" x2="96" y2="114" strokeWidth="2.2" />
    <line x1="110" y1="104" x2="110" y2="114" strokeWidth="2.2" />

    {/* Face Outline & Cheek Flaps */}
    <path d="M 77,80 C 73,92 73,104 81,107 C 88,110 118,110 125,107 C 133,104 133,92 129,80" fill="#ffffff" strokeWidth="2.5" />
    {/* Cheek Flap inner lines */}
    <path d="M 76,80 C 79,94 84,103 90,105" strokeWidth="2" />
    <path d="M 130,80 C 127,94 122,103 116,105" strokeWidth="2" />

    {/* Facial Features (Angry/Determined Soldier) */}
    {/* Angry Eyebrows */}
    <line x1="91" y1="76" x2="99" y2="82" strokeWidth="2.8" />
    <line x1="118" y1="76" x2="110" y2="82" strokeWidth="2.8" />
    {/* Eyes */}
    <circle cx="95" cy="85" r="3.2" fill="#000000" />
    <circle cx="114" cy="85" r="3.2" fill="#000000" />
    {/* Nose */}
    <line x1="104" y1="84" x2="104" y2="92" strokeWidth="2.4" />
    {/* Down-turned Grumpy Mouth */}
    <path d="M 97,100 C 103,94 109,96 114,99" strokeWidth="2.5" />

    {/* ========================================== */}
    {/* 7. ROMAN HELMET & CREST (Galea & Crista) */}
    {/* ========================================== */}
    {/* Helmet Brow Band / Visor */}
    <rect x="73" y="70" width="60" height="9" rx="1.5" fill="#ffffff" strokeWidth="2.5" />
    {/* Helmet Dome (Galea) */}
    <path d="M 76,70 C 76,46 130,46 130,70 Z" fill="#ffffff" strokeWidth="2.5" />
    {/* Dome Highlight Lines */}
    <path d="M 85,55 C 89,50 94,49 97,50" strokeWidth="1.8" />
    <circle cx="102" cy="51" r="1" fill="#000000" />

    {/* Helmet Crest (Fan Crista) */}
    {/* Crest Post/Base */}
    <line x1="99" y1="46" x2="99" y2="39" strokeWidth="2.2" />
    <line x1="107" y1="46" x2="107" y2="39" strokeWidth="2.2" />

    {/* Fan Crest Outer Arc and Inner Arc */}
    <path d="M 82,41 C 94,36 112,36 124,41 L 138,28 C 118,12 88,12 68,28 Z" fill="#ffffff" strokeWidth="2.5" strokeLinejoin="round" />
    {/* Radial segments in Crest */}
    <line x1="77" y1="22" x2="88" y2="39" strokeWidth="2" />
    <line x1="88" y1="18" x2="95" y2="37" strokeWidth="2" />
    <line x1="101" y1="16" x2="102" y2="36" strokeWidth="2" />
    <line x1="114" y1="18" x2="109" y2="37" strokeWidth="2" />
    <line x1="125" y1="22" x2="116" y2="39" strokeWidth="2" />
  </svg>
);

// ✝️ Pastor (Holy shepherd with crook and protection shield)
export const ShepherdIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
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
    <path d="M50 208 Q100 210 150 208" />
    {/* Holy Halo */}
    <ellipse cx="100" cy="50" rx="30" ry="8" strokeWidth="2" strokeDasharray="4 2" />
    {/* Pastor Robe Body */}
    <path d="M80 90 L70 205 L130 205 L120 90 Z" fill="#ffffff" />
    {/* Head */}
    <circle cx="100" cy="75" r="18" fill="#ffffff" />
    {/* Gentle eyes & beard */}
    <circle cx="94" cy="74" r="2" fill="#000000" />
    <circle cx="106" cy="74" r="2" fill="#000000" />
    <path d="M96 82 Q100 85 104 82" />
    <path d="M92 84 Q100 98 108 84" fill="#ffffff" />
    {/* Shepherd's Crook (Cajado) */}
    <path d="M60 100 C50 70 70 45 80 60 C85 68 78 78 72 75 L56 205" strokeWidth="3.5" />
    {/* Protection Shield on other side */}
    <path d="M125 110 Q145 110 150 125 Q150 160 130 175 Q115 160 115 125 Z" fill="#ffffff" strokeWidth="3" />
    {/* Cross on Shield */}
    <line x1="132" y1="125" x2="132" y2="155" strokeWidth="2.5" />
    <line x1="124" y1="135" x2="140" y2="135" strokeWidth="2.5" />
    {/* Sparkle rays */}
    <path d="M152 115 Q158 115 160 110 Q162 115 168 115 Q162 115 160 120 Q158 115 152 115" fill="#000000" />
  </svg>
);

// 📖 Evangelista (Preacher holding the Scripture of Conversion)
export const EvangelistIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
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
    <path d="M50 208 Q100 210 150 208" />
    {/* Divine Rays from Bible */}
    <line x1="100" y1="80" x2="100" y2="30" strokeWidth="1.5" strokeDasharray="3 3" />
    <line x1="75" y1="85" x2="45" y2="50" strokeWidth="1.5" strokeDasharray="3 3" />
    <line x1="125" y1="85" x2="155" y2="50" strokeWidth="1.5" strokeDasharray="3 3" />
    {/* Preacher Figure */}
    <path d="M78 95 L68 205 L132 205 L122 95 Z" fill="#ffffff" />
    {/* Head */}
    <circle cx="100" cy="72" r="18" fill="#ffffff" />
    {/* Face with reverent smile */}
    <path d="M94 72 Q97 70 100 72" strokeWidth="2" />
    <path d="M102 72 Q105 70 108 72" strokeWidth="2" />
    <path d="M96 80 Q100 84 104 80" />
    {/* Holy Bible Opened in Front */}
    <path d="M72 120 Q100 126 100 135 Q100 126 128 120 L130 160 Q100 165 100 175 Q100 165 70 160 Z" fill="#ffffff" strokeWidth="3" />
    {/* Spine & Pages */}
    <line x1="100" y1="135" x2="100" y2="175" strokeWidth="2.5" />
    {/* Cross on Bible Pages */}
    <line x1="84" y1="135" x2="84" y2="150" strokeWidth="2" />
    <line x1="79" y1="140" x2="89" y2="140" strokeWidth="2" />
    {/* Praying Hands */}
    <path d="M94 135 C92 125 96 120 100 120 C104 120 108 125 106 135" fill="#ffffff" strokeWidth="2.5" />
  </svg>
);

// 📜 Apóstolo (Disciple with twin scales of affinity)
export const ApostleIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
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
    <path d="M50 208 Q100 210 150 208" />
    {/* Figure */}
    <path d="M82 92 L72 205 L128 205 L118 92 Z" fill="#ffffff" />
    <circle cx="100" cy="70" r="18" fill="#ffffff" />
    <circle cx="94" cy="70" r="2" fill="#000000" />
    <circle cx="106" cy="70" r="2" fill="#000000" />
    <path d="M97 78 Q100 80 103 78" />
    {/* Balance Scale of Souls in Hands */}
    <line x1="100" y1="100" x2="100" y2="145" strokeWidth="3" />
    <line x1="60" y1="115" x2="140" y2="115" strokeWidth="3.5" />
    {/* Left Pan */}
    <line x1="65" y1="115" x2="55" y2="145" strokeWidth="1.5" />
    <line x1="75" y1="115" x2="85" y2="145" strokeWidth="1.5" />
    <path d="M50 145 Q70 155 90 145 Z" fill="#ffffff" strokeWidth="2" />
    <circle cx="70" cy="140" r="4" fill="#000000" />
    {/* Right Pan */}
    <line x1="125" y1="115" x2="115" y2="145" strokeWidth="1.5" />
    <line x1="135" y1="115" x2="145" y2="145" strokeWidth="1.5" />
    <path d="M110 145 Q130 155 150 145 Z" fill="#ffffff" strokeWidth="2" />
    <circle cx="130" cy="140" r="4" fill="#000000" />
    {/* Equal or Diff indicator */}
    <path d="M95 165 L105 165 M95 170 L105 170" strokeWidth="2" />
  </svg>
);

// 📜 Profeta (Seer with prophetic scroll of revelation)
export const ProphetIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
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
    <path d="M50 208 Q100 210 150 208" />

    {/* Subtle celestial stars flanking */}
    <path d="M52 48 Q56 48 56 44 Q56 48 60 48 Q56 48 56 52 Q56 48 52 48 Z" fill="#000000" />
    <path d="M142 48 Q146 48 146 44 Q146 48 150 48 Q146 48 146 52 Q146 48 142 48 Z" fill="#000000" />
    <circle cx="100" cy="38" r="1.5" fill="#000000" />

    {/* Prophet Hood & Body */}
    <path d="M75 100 L65 205 L135 205 L125 100 Z" fill="#ffffff" />
    {/* Robe fold lines */}
    <line x1="100" y1="120" x2="100" y2="205" strokeWidth="2" strokeDasharray="6 4" />

    {/* Hood */}
    <path d="M78 85 C78 55 122 55 122 85 C122 105 78 105 78 85 Z" fill="#000000" />
    <circle cx="100" cy="85" r="13" fill="#ffffff" />

    {/* Piercing Seer Eyes */}
    <line x1="93" y1="83" x2="98" y2="83" strokeWidth="3" />
    <line x1="102" y1="83" x2="107" y2="83" strokeWidth="3" />

    {/* Prophetic Scroll */}
    <path d="M85 130 L125 130 L120 170 L80 170 Z" fill="#ffffff" strokeWidth="2.5" />
    <line x1="90" y1="140" x2="115" y2="140" strokeWidth="2" strokeDasharray="2 2" />
    <line x1="90" y1="150" x2="115" y2="150" strokeWidth="2" strokeDasharray="2 2" />
    <line x1="90" y1="160" x2="110" y2="160" strokeWidth="2" strokeDasharray="2 2" />
  </svg>
);

// ⚖️ Mestre (Teacher with double weight vote badge)
export const MasterIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
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
    <path d="M50 208 Q100 210 150 208" />
    {/* Big "2X" Badge on podium */}
    <rect x="75" y="145" width="50" height="40" rx="6" fill="#000000" />
    <text x="100" y="172" fill="#ffffff" fontSize="22" fontWeight="900" fontFamily="monospace" textAnchor="middle">2X</text>
    {/* Master Figure */}
    <path d="M80 95 L72 205 L128 205 L120 95 Z" fill="#ffffff" />
    <circle cx="100" cy="72" r="18" fill="#ffffff" />
    {/* Round Spectacles */}
    <circle cx="94" cy="72" r="5" strokeWidth="2" fill="#ffffff" />
    <circle cx="106" cy="72" r="5" strokeWidth="2" fill="#ffffff" />
    <line x1="99" y1="72" x2="101" y2="72" strokeWidth="2" />
    {/* Gavel in hand */}
    <line x1="125" y1="110" x2="155" y2="90" strokeWidth="3" />
    <rect x="145" y="78" width="16" height="24" rx="3" fill="#ffffff" strokeWidth="3" transform="rotate(30 153 90)" />
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
