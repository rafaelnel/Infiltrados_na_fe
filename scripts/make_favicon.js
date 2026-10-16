import fs from 'fs';

function generateFaviconSvg() {
  const cx = 256;
  const cy = 256;

  // 12 Scallops for the outer body cloud
  const N = 12;
  const Rbase = 172;
  const rArc = 56;

  const vertices = [];
  for (let i = 0; i < N; i++) {
    // Start at -PI/2 - PI/N so a scallop is centered at the top
    const angle = (i * 2 * Math.PI) / N - Math.PI / 2 - Math.PI / N;
    const x = cx + Math.cos(angle) * Rbase;
    const y = cy + Math.sin(angle) * Rbase;
    vertices.push({ x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
  }

  let bodyPath = `M ${vertices[0].x} ${vertices[0].y}`;
  for (let i = 0; i < N; i++) {
    const next = vertices[(i + 1) % N];
    bodyPath += ` A ${rArc} ${rArc} 0 0 1 ${next.x} ${next.y}`;
  }
  bodyPath += ' Z';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Clean background for high visibility on light, dark or colored browser tabs -->
  <rect width="512" height="512" rx="128" fill="#ffffff" />

  <!-- Outer Fluffy Sheep Body (Continuous Scalloped Cloud) -->
  <path d="${bodyPath}" fill="#ffffff" stroke="#000000" stroke-width="16" stroke-linejoin="round" />

  <!-- Left Droopy Ear -->
  <path d="M 180 230 C 130 195, 80 220, 95 250 C 110 275, 155 255, 180 240 Z" fill="#ffffff" stroke="#000000" stroke-width="15" stroke-linejoin="round" />

  <!-- Right Droopy Ear -->
  <path d="M 332 230 C 382 195, 432 220, 417 250 C 402 275, 357 255, 332 240 Z" fill="#ffffff" stroke="#000000" stroke-width="15" stroke-linejoin="round" />

  <!-- Round Head -->
  <circle cx="256" cy="262" r="114" fill="#ffffff" stroke="#000000" stroke-width="16" />

  <!-- Forehead Fluffy Wool Tuft (3 distinct rounded puffs) -->
  <path d="M 172 178 
           A 36 36 0 0 1 228 136 
           A 42 42 0 0 1 284 136 
           A 36 36 0 0 1 340 178 
           C 310 188, 202 188, 172 178 Z" 
        fill="#ffffff" stroke="#000000" stroke-width="15" stroke-linejoin="round" />

  <!-- Eyes -->
  <circle cx="214" cy="242" r="16" fill="#000000" />
  <circle cx="298" cy="242" r="16" fill="#000000" />

  <!-- Cheeks Blush Dashes -->
  <line x1="174" y1="272" x2="204" y2="272" stroke="#000000" stroke-width="11" stroke-linecap="round" />
  <line x1="308" y1="272" x2="338" y2="272" stroke="#000000" stroke-width="11" stroke-linecap="round" />

  <!-- Nose & Anchor Mouth -->
  <path d="M 242 276 Q 256 270 270 276" fill="none" stroke="#000000" stroke-width="11" stroke-linecap="round" />
  <line x1="256" y1="273" x2="256" y2="295" stroke="#000000" stroke-width="11" stroke-linecap="round" />

  <!-- Left Smile Curve -->
  <path d="M 256 295 Q 242 306 235 296" fill="none" stroke="#000000" stroke-width="11" stroke-linecap="round" />

  <!-- Right Smile with Whimsical Chewing Spiral -->
  <path d="M 256 295 
           C 264 306, 276 308, 278 299 
           C 281 290, 298 290, 303 302 
           C 309 316, 296 332, 280 329 
           C 268 326, 264 314, 273 307 
           C 280 301, 290 305, 291 314" 
        fill="none" stroke="#000000" stroke-width="11" stroke-linecap="round" stroke-linejoin="round" />
</svg>`;
}

const svgContent = generateFaviconSvg();
fs.writeFileSync('public/favicon.svg', svgContent.trim());
console.log('Generated public/favicon.svg with length', svgContent.length);
