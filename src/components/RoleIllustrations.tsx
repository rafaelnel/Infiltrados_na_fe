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

// 🐺⚔️ Soldado (Lobo Infiltrado em Armadura de Combate & Pele de Cordeiro)
export const SoldierIllustration: React.FC<IllustrationProps> = ({ className = 'w-48 h-48', size }) => (
  <svg
    className={className}
    width={size}
    height={size}
    viewBox="0 0 200 240"
    fill="none"
    stroke="#000000"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2.5"
  >
    {/* Floor shadow */}
    <ellipse cx="100" cy="226" rx="65" ry="8" fill="#000000" opacity="0.12" stroke="none" />
    <line x1="35" y1="226" x2="165" y2="226" strokeWidth="2.5" />

    {/* ================================================================= */}
    {/* 1. WOLF BUSHY TAIL (Curling out behind left leg) */}
    {/* ================================================================= */}
    <path
      d="M68 160 C42 165 24 140 28 115 C34 98 46 95 48 106 C42 115 48 132 66 142 Z"
      fill="#ffffff"
      strokeWidth="2.5"
    />
    {/* Tail fur spikes / fluff lines */}
    <path d="M28 115 L35 125 M32 138 L40 144 M42 152 L50 156" strokeWidth="2" />

    {/* ================================================================= */}
    {/* 2. LEGS & CLAWED ARMORED GREAVES */}
    {/* ================================================================= */}
    {/* Left Leg Greave */}
    <path d="M74 165 L70 216 L88 216 L86 165 Z" fill="#ffffff" strokeWidth="2.5" />
    <line x1="72" y1="188" x2="86" y2="188" strokeWidth="2" />
    <line x1="71" y1="198" x2="87" y2="198" strokeWidth="2" />
    {/* Left Clawed Foot / Boot */}
    <path d="M64 226 L92 226 C90 220 86 216 70 216 C66 218 64 222 64 226 Z" fill="#ffffff" strokeWidth="2.5" />
    <line x1="68" y1="226" x2="66" y2="220" strokeWidth="2" />
    <line x1="78" y1="226" x2="78" y2="218" strokeWidth="2" />
    <line x1="88" y1="226" x2="88" y2="220" strokeWidth="2" />

    {/* Right Leg Greave */}
    <path d="M114 165 L112 216 L130 216 L126 165 Z" fill="#ffffff" strokeWidth="2.5" />
    <line x1="113" y1="188" x2="127" y2="188" strokeWidth="2" />
    <line x1="112" y1="198" x2="128" y2="198" strokeWidth="2" />
    {/* Right Clawed Foot / Boot */}
    <path d="M108 226 L136 226 C134 220 130 216 114 216 C110 218 108 222 108 226 Z" fill="#ffffff" strokeWidth="2.5" />
    <line x1="112" y1="226" x2="110" y2="220" strokeWidth="2" />
    <line x1="122" y1="226" x2="122" y2="218" strokeWidth="2" />
    <line x1="132" y1="226" x2="132" y2="220" strokeWidth="2" />

    {/* ================================================================= */}
    {/* 3. ARMORED TUNIC & LEATHER BELT */}
    {/* ================================================================= */}
    <polygon points="66,138 60,166 140,166 134,138" fill="#ffffff" strokeWidth="2.5" />
    {/* Belt */}
    <rect x="64" y="134" width="72" height="8" rx="2" fill="#000000" />
    <rect x="94" y="132" width="12" height="12" rx="2" fill="#ffffff" stroke="#000000" strokeWidth="2" />
    {/* Armor Tassets (segmented flaps) */}
    <line x1="78" y1="142" x2="74" y2="166" strokeWidth="2" />
    <line x1="90" y1="142" x2="88" y2="166" strokeWidth="2" />
    <line x1="110" y1="142" x2="112" y2="166" strokeWidth="2" />
    <line x1="122" y1="142" x2="126" y2="166" strokeWidth="2" />

    {/* ================================================================= */}
    {/* 4. IRON CHEST ARMOR & SHEEP PELT CAMOUFLAGE */}
    {/* ================================================================= */}
    {/* Armored Cuirass Torso */}
    <path d="M68 90 L64 134 L136 134 L132 90 Z" fill="#ffffff" strokeWidth="2.5" />
    {/* Chest Muscle / Plate contours */}
    <path d="M80 102 Q100 114 120 102" strokeWidth="2.2" />
    <line x1="100" y1="102" x2="100" y2="128" strokeWidth="2" />
    <path d="M85 124 Q100 130 115 124" strokeWidth="2" />

    {/* Fluffy Sheepskin Wool Pelt draped on right shoulder (Lobo em Pele de Cordeiro!) */}
    <path
      d="M124 82 C134 76 148 84 146 96 C154 100 156 114 148 122 C154 130 144 142 134 136 C128 140 120 134 122 126 Z"
      fill="#ffffff"
      strokeWidth="2.2"
    />
    <path d="M130 92 C138 90 142 98 136 102" strokeWidth="1.8" />
    <path d="M134 108 C142 108 144 116 138 120" strokeWidth="1.8" />

    {/* Spiked Iron Pauldron on left shoulder */}
    <path d="M68 90 L52 104 L66 122 L76 102 Z" fill="#ffffff" strokeWidth="2.5" />
    {/* Pauldron Spikes */}
    <polygon points="52,94 42,88 56,102" fill="#000000" />
    <polygon points="46,108 36,110 50,118" fill="#000000" />

    {/* ================================================================= */}
    {/* 5. ARMS & WEAPONS */}
    {/* ================================================================= */}
    {/* Left Arm: Gripping the Infiltrator Spear/Pilum */}
    <line x1="60" y1="108" x2="44" y2="132" strokeWidth="2.8" />
    <line x1="44" y1="132" x2="36" y2="114" strokeWidth="2.8" />
    {/* Clawed Hand on Spear */}
    <path d="M34 110 C28 112 28 122 36 122" fill="#ffffff" strokeWidth="2.5" />
    {/* Sharp Claws */}
    <line x1="32" y1="112" x2="28" y2="110" strokeWidth="2" />
    <line x1="32" y1="116" x2="27" y2="116" strokeWidth="2" />
    <line x1="33" y1="120" x2="29" y2="122" strokeWidth="2" />

    {/* Great Dark Battle Spear (Shaft & Vicious Serrated Blade) */}
    <line x1="36" y1="16" x2="42" y2="226" strokeWidth="3" />
    {/* Spear Blade */}
    <path
      d="M36 12 L44 32 L39 52 L36 78 L33 52 L28 32 Z"
      fill="#ffffff"
      strokeWidth="2.5"
    />
    <line x1="36" y1="14" x2="36" y2="78" strokeWidth="1.8" />
    {/* Blade Serrations / Barbs */}
    <polygon points="44,32 50,38 41,44" fill="#000000" />
    <polygon points="28,32 22,38 31,44" fill="#000000" />

    {/* Right Arm: Raised Claw or Short Dagger behind pelt */}
    <line x1="130" y1="108" x2="148" y2="130" strokeWidth="2.8" />
    <line x1="148" y1="130" x2="162" y2="118" strokeWidth="2.8" />
    {/* Clawed Hand / Dagger */}
    <path d="M160 114 L174 106 L168 124 Z" fill="#000000" />
    {/* Claws */}
    <line x1="158" y1="112" x2="166" y2="108" strokeWidth="2" />

    {/* ================================================================= */}
    {/* 6. FIERCE WOLF HEAD, EARS, SNOUT & FANGS */}
    {/* ================================================================= */}
    {/* Neck */}
    <path d="M84 76 L84 92 L116 92 L116 76" fill="#ffffff" strokeWidth="2.5" />

    {/* Bushy Wolf Cheek Tufts / Ruff */}
    <path d="M72 68 L60 76 L70 82 L64 90 L80 88" fill="#ffffff" strokeWidth="2.2" />
    <path d="M128 68 L140 76 L130 82 L136 90 L120 88" fill="#ffffff" strokeWidth="2.2" />

    {/* Left Pointed Wolf Ear */}
    <polygon points="76,56 64,18 90,44" fill="#ffffff" strokeWidth="2.6" />
    <polygon points="76,50 70,28 84,44" fill="#000000" />

    {/* Right Pointed Wolf Ear */}
    <polygon points="124,56 136,18 110,44" fill="#ffffff" strokeWidth="2.6" />
    <polygon points="124,50 130,28 116,44" fill="#000000" />

    {/* Wolf Cranium & Forehead */}
    <path d="M78 54 Q100 42 122 54" fill="#ffffff" strokeWidth="2.5" />
    {/* Furrowed Brow Angle */}
    <path d="M86 52 L100 58 L114 52" strokeWidth="2.4" />

    {/* Predatory Wolf Eyes (Intense & Narrowed) */}
    {/* Left Eye */}
    <polygon points="82,62 94,59 90,66" fill="#000000" />
    <circle cx="88" cy="62" r="1.2" fill="#ffffff" />
    {/* Right Eye */}
    <polygon points="118,62 106,59 110,66" fill="#000000" />
    <circle cx="112" cy="62" r="1.2" fill="#ffffff" />

    {/* Wolf Snout Bridge */}
    <path d="M92 63 L95 78 L105 78 L108 63" fill="#ffffff" strokeWidth="2" />
    {/* Snout Wrinkles (Snarl) */}
    <path d="M94 70 Q100 67 106 70" strokeWidth="2" />
    <path d="M95 73 Q100 70 105 73" strokeWidth="1.8" />

    {/* Black Nose */}
    <polygon points="96,78 104,78 100,84" fill="#000000" strokeWidth="1" />

    {/* Snarling Wolf Muzzle & Bared Fangs */}
    {/* Upper Jaw / Lip */}
    <path d="M84 76 Q92 84 100 84 Q108 84 116 76" strokeWidth="2.6" />
    {/* Lower Jaw */}
    <path d="M88 88 Q100 96 112 88" strokeWidth="2.4" fill="#ffffff" />

    {/* Sharp Vicious Fangs (Upper Canines) */}
    <polygon points="90,82 93,92 95,83" fill="#000000" />
    <polygon points="105,83 107,92 110,82" fill="#000000" />
    {/* Smaller Incisors */}
    <polygon points="97,83 98,88 100,83" fill="#000000" />
    <polygon points="100,83 102,88 103,83" fill="#000000" />
    {/* Lower Canine Fangs */}
    <polygon points="92,88 94,80 96,88" fill="#000000" />
    <polygon points="104,88 106,80 108,88" fill="#000000" />

    {/* Menacing Shadow Aura Marks */}
    <path d="M48 24 Q52 24 52 20 Q52 24 56 24 Q52 24 52 28 Q52 24 48 24 Z" fill="#000000" />
    <path d="M152 34 Q156 34 156 30 Q156 34 160 34 Q156 34 156 38 Q156 34 152 34 Z" fill="#000000" />
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
