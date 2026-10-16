import fs from 'fs';

const soldierSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 310" width="100%" height="100%" fill="none" stroke="#000000" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5">
  <!-- Ground Line -->
  <path d="M 32 284 Q 105 285 178 284" stroke-width="3" />

  <!-- ========================================== -->
  <!-- 1. SPEAR / PILUM (Behind & In Hand) -->
  <!-- ========================================== -->
  <!-- Shaft -->
  <line x1="33" y1="52" x2="52" y2="284" stroke-width="2.6" />
  <!-- Spear Point (Diamond) -->
  <polygon points="33,26 39,46 33,52 27,46" fill="#ffffff" stroke-width="2.5" />
  <line x1="33" y1="26" x2="33" y2="52" stroke-width="1.8" />
  <!-- Spear Weighted Block -->
  <polygon points="32,96 39,96 41,114 30,114" fill="#ffffff" stroke-width="2.4" />

  <!-- ========================================== -->
  <!-- 2. LEGS & ROMAN CALIGAE SANDALS -->
  <!-- ========================================== -->
  <!-- Left Leg -->
  <path d="M 83 218 L 86 270" stroke-width="2.4" />
  <path d="M 98 218 L 98 270" stroke-width="2.4" />
  <!-- Left Sandal Cross Straps -->
  <line x1="84" y1="244" x2="98" y2="244" stroke-width="2" />
  <line x1="84" y1="244" x2="98" y2="256" stroke-width="2" />
  <line x1="98" y1="244" x2="85" y2="256" stroke-width="2" />
  <line x1="85" y1="256" x2="98" y2="268" stroke-width="2" />
  <line x1="98" y1="256" x2="86" y2="268" stroke-width="2" />
  <line x1="86" y1="270" x2="98" y2="270" stroke-width="2" />
  <!-- Left Foot / Sandal -->
  <path d="M 70 284 L 102 284 L 102 276 L 86 276" stroke-width="2.4" />
  <path d="M 70 284 C 70 274, 84 274, 86 284" fill="#ffffff" stroke-width="2.4" />
  <line x1="78" y1="276" x2="81" y2="284" stroke-width="2" />

  <!-- Right Leg -->
  <path d="M 114 218 L 114 270" stroke-width="2.4" />
  <path d="M 129 218 L 126 270" stroke-width="2.4" />
  <!-- Right Sandal Cross Straps -->
  <line x1="114" y1="244" x2="128" y2="244" stroke-width="2" />
  <line x1="114" y1="244" x2="127" y2="256" stroke-width="2" />
  <line x1="128" y1="244" x2="114" y2="256" stroke-width="2" />
  <line x1="114" y1="256" x2="126" y2="268" stroke-width="2" />
  <line x1="127" y1="256" x2="115" y2="268" stroke-width="2" />
  <line x1="115" y1="270" x2="126" y2="270" stroke-width="2" />
  <!-- Right Foot / Sandal -->
  <path d="M 112 284 L 144 284 L 144 276 L 126 276" stroke-width="2.4" />
  <path d="M 126 284 C 126 274, 142 274, 144 284" fill="#ffffff" stroke-width="2.4" />
  <line x1="134" y1="276" x2="137" y2="284" stroke-width="2" />

  <!-- ========================================== -->
  <!-- 3. TUNIC SKIRT & BELT PTERUGES -->
  <!-- ========================================== -->
  <!-- Skirt -->
  <polygon points="70,182 62,218 142,218 136,182" fill="#ffffff" stroke-width="2.5" />
  <!-- Belt -->
  <rect x="68" y="176" width="70" height="7" fill="#ffffff" stroke-width="2.4" />
  
  <!-- Leather Hanging Strips (Pteruges) -->
  <!-- Left Strip -->
  <polygon points="88,183 83,212 92,212 94,183" fill="#ffffff" stroke-width="2.2" />
  <!-- Center Strip -->
  <polygon points="98,183 97,218 107,218 108,183" fill="#ffffff" stroke-width="2.2" />
  <!-- Right Strip -->
  <polygon points="112,183 114,212 123,212 118,183" fill="#ffffff" stroke-width="2.2" />

  <!-- ========================================== -->
  <!-- 4. TORSO ARMOR (Lorica Segmentata) -->
  <!-- ========================================== -->
  <!-- Main Torso Block -->
  <polygon points="77,114 69,176 137,176 132,114" fill="#ffffff" stroke-width="2.5" />
  <!-- Segmented Plates Lines -->
  <line x1="94" y1="130" x2="114" y2="130" stroke-width="2.4" />
  <line x1="91" y1="144" x2="119" y2="144" stroke-width="2.4" />
  <line x1="91" y1="154" x2="119" y2="154" stroke-width="2.4" />
  <line x1="93" y1="164" x2="117" y2="164" stroke-width="2.4" />

  <!-- Shoulder Pauldrons / Guards -->
  <!-- Left Pauldron -->
  <polygon points="77,114 67,140 85,140 87,114" fill="#ffffff" stroke-width="2.3" />
  <!-- Right Pauldron -->
  <polygon points="127,114 125,140 142,140 132,114" fill="#ffffff" stroke-width="2.3" />

  <!-- Left Arm (Spear Hand) -->
  <!-- Sleeve -->
  <polygon points="77,115 62,142 75,140" fill="#ffffff" stroke-width="2.2" />
  <!-- Arm Lines -->
  <polyline points="65,142 59,165 38,142" stroke-width="2.5" />
  <!-- Hand gripping spear -->
  <path d="M 37 137 C 33 137 33 147 38 147" stroke-width="2.4" />

  <!-- ========================================== -->
  <!-- 5. SCUTUM SHIELD (Left Hand side of image) -->
  <!-- ========================================== -->
  <!-- Curved rectangular shield -->
  <path d="M 158,124 C 160,118 178,122 178,128 L 176,236 C 176,242 152,246 144,244 L 142,138 C 142,132 154,124 158,124 Z" fill="#ffffff" stroke-width="2.6" stroke-linejoin="round" />
  <!-- Shield Umbo / Handle Side Bump -->
  <path d="M 175,158 C 187,162 188,182 175,186 Z" fill="#ffffff" stroke-width="2.4" />

  <!-- Right Arm (Holding Shield) -->
  <!-- Sleeve -->
  <polygon points="132,115 146,140 136,142" fill="#ffffff" stroke-width="2.2" />
  <!-- Arm Line to Shield -->
  <line x1="142" y1="138" x2="152" y2="152" stroke-width="2.5" />

  <!-- ========================================== -->
  <!-- 6. HEAD, CHEEK GUARDS & FACE -->
  <!-- ========================================== -->
  <!-- Neck -->
  <line x1="96" y1="104" x2="96" y2="114" stroke-width="2.2" />
  <line x1="110" y1="104" x2="110" y2="114" stroke-width="2.2" />

  <!-- Face Outline & Cheek Flaps -->
  <path d="M 77,80 C 73,92 73,104 81,107 C 88,110 118,110 125,107 C 133,104 133,92 129,80" fill="#ffffff" stroke-width="2.5" />
  <!-- Cheek Flap inner lines -->
  <path d="M 76,80 C 79,94 84,103 90,105" stroke-width="2" />
  <path d="M 130,80 C 127,94 122,103 116,105" stroke-width="2" />

  <!-- Facial Features (Angry/Determined Soldier) -->
  <!-- Angry Eyebrows -->
  <line x1="91" y1="76" x2="99" y2="82" stroke-width="2.8" />
  <line x1="118" y1="76" x2="110" y2="82" stroke-width="2.8" />
  <!-- Eyes -->
  <circle cx="95" cy="85" r="3.2" fill="#000000" />
  <circle cx="114" cy="85" r="3.2" fill="#000000" />
  <!-- Nose -->
  <line x1="104" y1="84" x2="104" y2="92" stroke-width="2.4" />
  <!-- Down-turned Grumpy Mouth -->
  <path d="M 97,100 C 103,94 109,96 114,99" stroke-width="2.5" />

  <!-- ========================================== -->
  <!-- 7. ROMAN HELMET & CREST (Galea & Crista) -->
  <!-- ========================================== -->
  <!-- Helmet Brow Band / Visor -->
  <rect x="73" y="70" width="60" height="9" rx="1.5" fill="#ffffff" stroke-width="2.5" />
  <!-- Helmet Dome (Galea) -->
  <path d="M 76,70 C 76,46 130,46 130,70 Z" fill="#ffffff" stroke-width="2.5" />
  <!-- Dome Highlight Lines -->
  <path d="M 85,55 C 89,50 94,49 97,50" stroke-width="1.8" />
  <circle cx="102" cy="51" r="1" fill="#000000" />

  <!-- Helmet Crest (Fan Crista) -->
  <!-- Crest Post/Base -->
  <line x1="99" y1="46" x2="99" y2="39" stroke-width="2.2" />
  <line x1="107" y1="46" x2="107" y2="39" stroke-width="2.2" />

  <!-- Fan Crest Outer Arc and Inner Arc -->
  <path d="M 82,41 C 94,36 112,36 124,41 L 138,28 C 118,12 88,12 68,28 Z" fill="#ffffff" stroke-width="2.5" stroke-linejoin="round" />
  <!-- Radial segments in Crest -->
  <line x1="77" y1="22" x2="88" y2="39" stroke-width="2" />
  <line x1="88" y1="18" x2="95" y2="37" stroke-width="2" />
  <line x1="101" y1="16" x2="102" y2="36" stroke-width="2" />
  <line x1="114" y1="18" x2="109" y2="37" stroke-width="2" />
  <line x1="125" y1="22" x2="116" y2="39" stroke-width="2" />
</svg>`;

fs.writeFileSync('public/test_soldier.svg', soldierSvg.trim());
console.log('Saved test_soldier.svg');
