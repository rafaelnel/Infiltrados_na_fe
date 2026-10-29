import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Smile,
  X,
  RotateCcw,
  Trash2,
  Check,
  Palette,
  Sparkles,
  PenTool,
  Eraser,
  Sliders,
  Shuffle,
} from 'lucide-react';
import { sounds } from '../utils/audio';
import {
  BASE_FACE_IMAGE,
  CharacterAvatarConfig,
  FACE_TYPE_CHOICES,
  HAT_CHOICES,
  GLASSES_CHOICES,
  HAIR_CHOICES,
  BEARD_CHOICES,
  MUSTACHE_CHOICES,
  RenderAccessoriesSVG,
  decodeCharacterAvatar,
  encodeAvatar,
  generateRandomCharacterConfig,
  FaceTypeOption,
  HatOption,
  GlassesOption,
  HairOption,
  BeardOption,
  MustacheOption,
} from './PersonAvatar';

export const COLOR_PALETTE = [
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

export function pickRandomAvailableColor(
  desiredColor: string | undefined,
  takenColors: string[] = [],
  deterministicSeed?: string
): { color: string; changed: boolean } {
  const paletteHexes = COLOR_PALETTE.map(c => c.hex.toUpperCase());
  const normalizedDesired = (desiredColor || '').trim().toUpperCase();

  const usageCount = new Map<string, number>();
  paletteHexes.forEach(hex => usageCount.set(hex, 0));

  for (const raw of takenColors) {
    if (!raw) continue;
    const norm = raw.trim().toUpperCase();
    if (usageCount.has(norm)) {
      usageCount.set(norm, (usageCount.get(norm) || 0) + 1);
    }
  }

  const unusedColors = paletteHexes.filter(hex => (usageCount.get(hex) || 0) === 0);

  if (normalizedDesired && paletteHexes.includes(normalizedDesired)) {
    const takenCount = usageCount.get(normalizedDesired) || 0;
    if (takenCount === 0) {
      return { color: normalizedDesired, changed: false };
    }
    // As cores só podem repetir se o número de jogadores for maior que o de cores (todas as cores ocupadas)
    if (unusedColors.length === 0) {
      return { color: normalizedDesired, changed: false };
    }
  }

  // Se houver cores livres, escolhe aleatoriamente entre as cores ainda não usadas.
  // Se todas as cores já estiverem em uso (jogadores > cores), escolhe entre as menos repetidas.
  let pool = unusedColors;
  if (pool.length === 0) {
    const minUsage = Math.min(...Array.from(usageCount.values()));
    pool = paletteHexes.filter(hex => (usageCount.get(hex) || 0) === minUsage);
  }

  if (deterministicSeed) {
    let hash = 0;
    for (let i = 0; i < deterministicSeed.length; i++) {
      hash = (hash * 31 + deterministicSeed.charCodeAt(i)) >>> 0;
    }
    const chosen = pool[hash % pool.length] || paletteHexes[0];
    return { color: chosen, changed: chosen !== normalizedDesired };
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  const chosen = pool[randomIndex] || paletteHexes[0];
  return { color: chosen, changed: chosen !== normalizedDesired };
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  avatar?: string;
  color?: string;
  playerName?: string;
  takenColors?: string[];
  onSave: (avatar: string, color: string) => void;
}

type DrawTool = 'CHARACTER_COLOR' | 'BLACK' | 'WHITE' | 'ERASER';

function canvasHasVisiblePixels(canvas: HTMLCanvasElement | null): boolean {
  if (!canvas) return false;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  try {
    const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 3; i < data.length; i += 16) {
      if (data[i] > 10) return true;
    }
  } catch {}
  return false;
}

export const AvatarCustomizerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  avatar,
  color = '#F59E0B',
  playerName = 'Cidadão',
  takenColors = [],
  onSave,
}) => {
  const [currentColor, setCurrentColor] = useState<string>(color || '#F59E0B');
  const [config, setConfig] = useState<CharacterAvatarConfig>(() => {
    try {
      const saved = localStorage.getItem('custom_avatar_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && 'hat' in parsed) {
          return {
            faceType: parsed.faceType || 'MASCULINO',
            ...parsed,
          };
        }
      }
    } catch {}
    return decodeCharacterAvatar(avatar, playerName);
  });

  // Tab ativa de edição
  const [activeTab, setActiveTab] = useState<'draw' | 'accessories' | 'color'>('accessories');
  const [accessoryCategory, setAccessoryCategory] = useState<'hair' | 'hat' | 'glasses' | 'beard' | 'mustache'>('hair');

  // Ferramentas de desenho livre
  const [drawTool, setDrawTool] = useState<DrawTool>('CHARACTER_COLOR');
  const [brushSize, setBrushSize] = useState<number>(5);

  // Canvas, SVG e histórico de traços para Undo
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const [history, setHistory] = useState<ImageData[]>([]);

  // Sincroniza ao abrir
  useEffect(() => {
    if (isOpen) {
      const savedColor = color || localStorage.getItem('custom_avatar_color') || '#F59E0B';
      const resolved = pickRandomAvailableColor(savedColor, takenColors);
      setCurrentColor(resolved.color);
      try {
        if (avatar && avatar.startsWith('custom:')) {
          setConfig(decodeCharacterAvatar(avatar, playerName));
        } else {
          const saved = localStorage.getItem('custom_avatar_config');
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed && typeof parsed === 'object' && 'hat' in parsed) {
              setConfig({
                faceType: parsed.faceType || 'MASCULINO',
                ...parsed,
              });
            } else {
              setConfig(decodeCharacterAvatar(avatar, playerName));
            }
          } else {
            setConfig(decodeCharacterAvatar(avatar, playerName));
          }
        }
      } catch {
        setConfig(decodeCharacterAvatar(avatar, playerName));
      }

      setTimeout(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHistory([]);

        // Restaura traços livres anteriores se o jogador tiver desenhado
        try {
          const savedDrawing = localStorage.getItem('custom_avatar_drawing');
          if (savedDrawing && avatar && avatar.startsWith('data:image/')) {
            const drawImg = new Image();
            drawImg.onload = () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(drawImg, 0, 0, canvas.width, canvas.height);
            };
            drawImg.src = savedDrawing;
          }
        } catch {}
      }, 40);
    }
  }, [isOpen, avatar, color, playerName]);

  // Alterna entre Rosto Masculino e Rosto Feminino ajustando cabelo/barba adequadamente
  const handleSelectFaceType = (newFaceType: FaceTypeOption) => {
    sounds.playClick();
    setConfig(prev => {
      let nextHair = prev.hair;
      let nextBeard = prev.beard;
      let nextMustache = prev.mustache;

      if (newFaceType === 'FEMININO') {
        if (prev.hair === 'NONE' || prev.hair === 'CABELO_1' || prev.hair === 'CABELO_MASC_2') {
          nextHair = 'FRANJA';
        }
        nextBeard = 'NONE';
        nextMustache = 'NONE';
      } else {
        if (prev.hair === 'FRANJA' || prev.hair === 'CABELO_FEM_2') {
          nextHair = 'CABELO_1';
        }
      }

      return {
        ...prev,
        faceType: newFaceType,
        hair: nextHair,
        beard: nextBeard,
        mustache: nextMustache,
      };
    });
  };

  // Sorteia um avatar completo aleatório (rosto masculino/feminino, cabelo, chapéu, óculos, barba/bigode e cor disponível)
  const handleGenerateRandomAvatar = () => {
    sounds.playClick();
    const randomCfg = generateRandomCharacterConfig();
    setConfig(randomCfg);

    // Escolhe uma cor disponível aleatória (preferindo uma diferente da atual se houver mais de 1 disponível)
    const normalizedTaken = new Set(
      (takenColors || []).map(c => (c || '').trim().toUpperCase()).filter(Boolean)
    );
    const availableHexes = COLOR_PALETTE.map(c => c.hex).filter(
      hex => !normalizedTaken.has(hex.toUpperCase())
    );
    const pool = availableHexes.length > 0 ? availableHexes : COLOR_PALETTE.map(c => c.hex);
    const diffPool = pool.filter(hex => hex.toUpperCase() !== currentColor.toUpperCase());
    const finalPool = diffPool.length > 0 ? diffPool : pool;
    const randomColor = finalPool[Math.floor(Math.random() * finalPool.length)] || currentColor;
    setCurrentColor(randomColor);

    // Limpa traços livres do canvas (salvando no histórico para permitir desfazer)
    const canvas = canvasRef.current;
    if (canvas && canvasHasVisiblePixels(canvas)) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
          setHistory(prev => [...prev.slice(-12), snap]);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        } catch {}
      }
    }
  };

  // Salva estado para Undo
  const saveStateToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    try {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-12), snap]);
    } catch {}
  }, []);

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    sounds.playClick();
    const newHistory = [...history];
    const previousSnap = newHistory.pop();
    setHistory(newHistory);
    if (previousSnap) {
      ctx.putImageData(previousSnap, 0, 0);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    sounds.playClick();
    saveStateToHistory();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    try {
      localStorage.removeItem('custom_avatar_drawing');
    } catch {}
  };

  // Coordenadas ajustadas relativas ao canvas 400x400
  const getCanvasCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTab !== 'draw') return;
    e.preventDefault();
    const pt = getCanvasCoordinates(e);
    if (!pt) return;
    saveStateToHistory();
    isDrawingRef.current = true;
    lastPointRef.current = pt;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = brushSize;

    if (drawTool === 'ERASER') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.strokeStyle = 'rgba(0,0,0,1)';
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle =
        drawTool === 'CHARACTER_COLOR'
          ? currentColor
          : drawTool === 'BLACK'
          ? '#111827'
          : '#FFFFFF';
    }

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, brushSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = ctx.strokeStyle;
    ctx.fill();
  };

  const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (activeTab !== 'draw' || !isDrawingRef.current) return;
    e.preventDefault();
    const pt = getCanvasCoordinates(e);
    if (!pt || !lastPointRef.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    lastPointRef.current = pt;
  };

  const stopDrawing = () => {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  };

  // Salva o avatar criado (usa string vetorial limpa `custom:...` ou imagem composta caso haja desenho livre)
  const handleSaveAvatar = async () => {
    sounds.playClick();

    const finalColor = pickRandomAvailableColor(currentColor, takenColors).color;
    const hasFreehandDrawing = canvasHasVisiblePixels(canvasRef.current);

    if (!hasFreehandDrawing) {
      // Sem traços livres no canvas: salva codificação vetorial nítida e leve (`custom:...`)
      const encodedVectorAvatar = encodeAvatar(config);
      try {
        localStorage.removeItem('custom_avatar_drawing');
        localStorage.setItem('custom_avatar_data', encodedVectorAvatar);
        localStorage.setItem('custom_avatar_color', finalColor);
        localStorage.setItem('custom_avatar_config', JSON.stringify(config));
      } catch {}

      onSave(encodedVectorAvatar, finalColor);
      sounds.playVictoryFanfare();
      onClose();
      return;
    }

    // Com traços livres no canvas: compõe Rosto Base + SVG (com dimensões explícitas) + Traços do Usuário
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = 400;
    exportCanvas.height = 400;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    // 1. Desenha o rosto base
    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';

    await new Promise<void>(resolve => {
      baseImg.onload = () => resolve();
      baseImg.onerror = () => resolve();
      baseImg.src = BASE_FACE_IMAGE;
    });

    try {
      const imgAspect = (baseImg.width || 2400) / (baseImg.height || 1792);
      let sWidth = baseImg.width;
      let sHeight = baseImg.height;
      let sx = 0;
      const sy = 0;
      if (imgAspect > 1) {
        sWidth = baseImg.height;
        sx = (baseImg.width - sWidth) / 2;
      }
      ctx.drawImage(baseImg, sx, sy, sWidth, sHeight, 0, 0, 400, 400);
    } catch {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 400);
    }

    // 2. Renderiza traços femininos (se aplicável) + os acessórios SVG na cor do personagem
    const svgElem = svgRef.current || document.getElementById('preview-accessories-svg');
    if (svgElem) {
      const clonedSvg = svgElem.cloneNode(true) as SVGSVGElement;
      clonedSvg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      clonedSvg.setAttribute('width', '400');
      clonedSvg.setAttribute('height', '400');
      clonedSvg.setAttribute('viewBox', '0 0 200 200');

      const svgString = new XMLSerializer().serializeToString(clonedSvg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const URLObj = window.URL || window.webkitURL;
      const blobURL = URLObj.createObjectURL(svgBlob);
      const svgImg = new Image();

      await new Promise<void>(resolve => {
        svgImg.onload = () => {
          ctx.drawImage(svgImg, 0, 0, 400, 400);
          URLObj.revokeObjectURL(blobURL);
          resolve();
        };
        svgImg.onerror = () => {
          URLObj.revokeObjectURL(blobURL);
          resolve();
        };
        svgImg.src = blobURL;
      });
    }

    // 3. Desenha os traços livres desenhados pelo jogador
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0, 400, 400);
      try {
        localStorage.setItem('custom_avatar_drawing', canvasRef.current.toDataURL('image/png'));
      } catch {}
    }

    // 4. Exporta Data URL compactada (JPEG qualidade 0.88)
    const finalDataUrl = exportCanvas.toDataURL('image/jpeg', 0.88);

    // Salva em localStorage para persistir entre partidas
    try {
      localStorage.setItem('custom_avatar_data', finalDataUrl);
      localStorage.setItem('custom_avatar_color', finalColor);
      localStorage.setItem('custom_avatar_config', JSON.stringify(config));
    } catch {}

    onSave(finalDataUrl, finalColor);
    sounds.playVictoryFanfare();
    onClose();
  };

  if (!isOpen) return null;

  const activeFaceType: FaceTypeOption = config.faceType || 'MASCULINO';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-xs animate-fadeIn font-mono">
      <div className="w-full max-w-lg max-h-[96vh] flex flex-col rounded-3xl bg-white border-3 border-black shadow-2xl overflow-hidden">
        {/* Header do Estúdio de Avatar */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 border-b-2 border-black bg-neutral-50 shrink-0">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-full border-2 border-black flex items-center justify-center shadow-xs text-white"
              style={{ backgroundColor: currentColor }}
            >
              <Smile className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-sans font-black text-sm sm:text-base uppercase text-black leading-none flex items-center gap-1.5">
                <span>Personalizar Meu Avatar</span>
                <Sparkles size={14} className="text-amber-500" />
              </h3>
              <p className="text-[10px] text-neutral-600 font-mono mt-0.5">
                Escolha o rosto, sua cor, adicione acessórios e desenhe!
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl border border-black text-neutral-600 hover:text-black hover:bg-neutral-200 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Corpo com visualização interativa do rosto */}
        <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto flex-1">
          {/* SELETOR DE TIPO DE ROSTO: MASCULINO / FEMININO + BOTÃO GERAR AVATAR ALEATÓRIO */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-2">
              {FACE_TYPE_CHOICES.map(face => {
                const isSelected = activeFaceType === face.id;
                return (
                  <button
                    key={face.id}
                    type="button"
                    onClick={() => handleSelectFaceType(face.id)}
                    className={`py-2 px-3 rounded-2xl border-2 text-xs font-black uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    <span className="text-base leading-none">{face.icon}</span>
                    <span>{face.label}</span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleGenerateRandomAvatar}
              className="w-full py-2 px-3 rounded-2xl border-2 border-black bg-amber-400 hover:bg-amber-300 active:scale-[0.98] text-black text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Shuffle size={14} />
              <span>🎲 Gerar Avatar Aleatório</span>
            </button>
          </div>

          {/* Caixa Central do Rosto com Canvas Interativo de Desenho */}
          <div className="flex flex-col items-center justify-center bg-neutral-100 rounded-3xl p-2.5 border-2 border-black/15 shadow-inner">
            <div
              className="relative w-60 h-60 sm:w-68 sm:h-68 rounded-full overflow-hidden border-4 border-black shadow-xl bg-white select-none touch-none"
              style={{
                boxShadow: `0 8px 24px ${currentColor}40`,
              }}
            >
              {/* 0. Fundo vetorizado do rosto de segurança (caso o asset image falhe no GitHub Pages) */}
              <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none select-none" style={{ backgroundColor: '#ffffff' }}>
                <ellipse cx="100" cy="100" rx="64" ry="76" fill="#fefdfb" stroke="#111111" strokeWidth="4" />
                <path d="M 72 78 Q 80 73 88 78" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M 112 78 Q 120 73 128 78" fill="none" stroke="#111111" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="80" cy="95" r="7.5" fill="#111111" />
                <circle cx="120" cy="95" r="7.5" fill="#111111" />
                <circle cx="78" cy="93" r="2.2" fill="#ffffff" />
                <circle cx="118" cy="93" r="2.2" fill="#ffffff" />
                <path d="M 100 98 Q 97 112 103 115" fill="none" stroke="#111111" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M 82 132 Q 100 142 118 132" fill="none" stroke="#111111" strokeWidth="2.6" strokeLinecap="round" />
                <ellipse cx="64" cy="112" rx="7" ry="4" fill="#ff7777" fillOpacity="0.25" />
                <ellipse cx="136" cy="112" rx="7" ry="4" fill="#ff7777" fillOpacity="0.25" />
              </svg>

              {/* 1. Imagem de fundo: Rosto Base do Jogo */}
              <img
                src={BASE_FACE_IMAGE}
                alt="Rosto Base"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none select-none"
                draggable={false}
              />

              {/* 2. Camada SVG de Rosto Feminino (se selecionado) + Acessórios Pré-Prontos */}
              <svg
                ref={svgRef}
                id="preview-accessories-svg"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 200 200"
                className="absolute inset-0 w-full h-full pointer-events-none select-none"
              >
                <RenderAccessoriesSVG config={config} color={currentColor} />
              </svg>

              {/* 3. Canvas interativo de desenho livre (ativo apenas na aba Desenhar) */}
              <canvas
                ref={canvasRef}
                width={400}
                height={400}
                className={`absolute inset-0 w-full h-full touch-none ${
                  activeTab === 'draw'
                    ? 'cursor-crosshair pointer-events-auto'
                    : 'pointer-events-none cursor-default'
                }`}
                onMouseDown={activeTab === 'draw' ? startDrawing : undefined}
                onMouseMove={activeTab === 'draw' ? drawMove : undefined}
                onMouseUp={activeTab === 'draw' ? stopDrawing : undefined}
                onMouseLeave={activeTab === 'draw' ? stopDrawing : undefined}
                onTouchStart={activeTab === 'draw' ? startDrawing : undefined}
                onTouchMove={activeTab === 'draw' ? drawMove : undefined}
                onTouchEnd={activeTab === 'draw' ? stopDrawing : undefined}
              />

              {/* Distintivo de Nome & Cor no topo */}
              <div
                className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase text-white shadow-md border border-black/30 pointer-events-none"
                style={{ backgroundColor: currentColor }}
              >
                {playerName}
              </div>
            </div>

            <p className="text-[10px] font-mono text-neutral-500 mt-1.5 text-center">
              💡 Dica: você pode <strong>desenhar livremente com o dedo/mouse</strong> direto no rosto!
            </p>
          </div>

          {/* Abas de Customização: Acessórios, Desenho Livre e Cor */}
          <div className="flex bg-neutral-100 p-1 rounded-2xl border-2 border-black gap-1">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('accessories');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'accessories'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Sliders size={13} />
              <span>Acessórios</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('draw');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'draw'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <PenTool size={13} />
              <span>Desenhar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('color');
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black uppercase transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'color'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black'
              }`}
            >
              <Palette size={13} />
              <span>Sua Cor</span>
            </button>
          </div>

          {/* CONTEÚDO DA ABA 1: ACESSÓRIOS PRÉ-PRONTOS (NA COR DO PERSONAGEM) */}
          {activeTab === 'accessories' && (
            <div className="space-y-2.5 animate-fadeIn">
              {/* Categorias dos Acessórios solicitados pelo usuário */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px] font-bold">
                {[
                  { id: 'hair', label: '💇 Cabelos (4)' },
                  { id: 'hat', label: '🎩 Chapéus (2)' },
                  { id: 'glasses', label: '👓 Óculos (2)' },
                  { id: 'beard', label: '🧔 Barbas (2)' },
                  { id: 'mustache', label: '〰️ Bigodes (2)' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setAccessoryCategory(cat.id as any);
                    }}
                    className={`py-1 px-2.5 rounded-lg border text-[10px] uppercase font-bold shrink-0 transition-colors cursor-pointer ${
                      accessoryCategory === cat.id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-neutral-700 border-neutral-300 hover:border-black'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Opções da Categoria Selecionada */}
              <div className={`grid ${accessoryCategory === 'hair' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-3'} gap-2`}>
                {accessoryCategory === 'hat' &&
                  HAT_CHOICES.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setConfig(prev => ({ ...prev, hat: item.id as HatOption }));
                      }}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                        config.hat === item.id
                          ? 'border-black bg-neutral-100 font-black shadow-xs ring-2 ring-black'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] leading-tight font-mono">{item.label}</span>
                    </button>
                  ))}

                {accessoryCategory === 'glasses' &&
                  GLASSES_CHOICES.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setConfig(prev => ({ ...prev, glasses: item.id as GlassesOption }));
                      }}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                        config.glasses === item.id
                          ? 'border-black bg-neutral-100 font-black shadow-xs ring-2 ring-black'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] leading-tight font-mono">{item.label}</span>
                    </button>
                  ))}

                {accessoryCategory === 'hair' &&
                  HAIR_CHOICES.map(item => {
                    const isRecommended = item.gender === activeFaceType;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setConfig(prev => ({ ...prev, hair: item.id as HairOption }));
                        }}
                        className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-0.5 transition-all cursor-pointer relative ${
                          config.hair === item.id
                            ? 'border-black bg-neutral-100 font-black shadow-xs ring-2 ring-black'
                            : isRecommended
                            ? 'border-neutral-400 bg-amber-50/40 hover:border-black'
                            : 'border-neutral-200 bg-white hover:border-neutral-400'
                        }`}
                      >
                        <span className="text-lg">{item.icon}</span>
                        <span className="text-[10px] leading-tight font-mono">{item.label}</span>
                      </button>
                    );
                  })}

                {accessoryCategory === 'beard' &&
                  BEARD_CHOICES.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setConfig(prev => ({ ...prev, beard: item.id as BeardOption }));
                      }}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                        config.beard === item.id
                          ? 'border-black bg-neutral-100 font-black shadow-xs ring-2 ring-black'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] leading-tight font-mono">{item.label}</span>
                    </button>
                  ))}

                {accessoryCategory === 'mustache' &&
                  MUSTACHE_CHOICES.map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setConfig(prev => ({ ...prev, mustache: item.id as MustacheOption }));
                      }}
                      className={`p-2.5 rounded-xl border-2 flex flex-col items-center justify-center text-center gap-1 transition-all cursor-pointer ${
                        config.mustache === item.id
                          ? 'border-black bg-neutral-100 font-black shadow-xs ring-2 ring-black'
                          : 'border-neutral-200 bg-white hover:border-neutral-400'
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <span className="text-[10px] leading-tight font-mono">{item.label}</span>
                    </button>
                  ))}
              </div>

              <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: currentColor }} />
                <span>Os acessórios adotam automaticamente a cor escolhida para o seu personagem!</span>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA 2: FERRAMENTAS DE DESENHO LIVRE */}
          {activeTab === 'draw' && (
            <div className="space-y-2.5 animate-fadeIn">
              {/* Seleção de Ferramenta / Tinta */}
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setDrawTool('CHARACTER_COLOR');
                  }}
                  className={`flex-1 py-2 px-1.5 rounded-xl border-2 text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    drawTool === 'CHARACTER_COLOR'
                      ? 'border-black bg-neutral-100 shadow-xs'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full border border-black/40 shrink-0" style={{ backgroundColor: currentColor }} />
                  <span>Sua Cor</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setDrawTool('BLACK');
                  }}
                  className={`flex-1 py-2 px-1.5 rounded-xl border-2 text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    drawTool === 'BLACK'
                      ? 'border-black bg-neutral-100 shadow-xs'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-black shrink-0" />
                  <span>Tinta Preta</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setDrawTool('WHITE');
                  }}
                  className={`flex-1 py-2 px-1.5 rounded-xl border-2 text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    drawTool === 'WHITE'
                      ? 'border-black bg-neutral-100 shadow-xs'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-white border border-black/40 shrink-0" />
                  <span>Branco</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setDrawTool('ERASER');
                  }}
                  className={`flex-1 py-2 px-1.5 rounded-xl border-2 text-[10px] font-black uppercase flex items-center justify-center gap-1 cursor-pointer transition-all ${
                    drawTool === 'ERASER'
                      ? 'border-black bg-amber-100 shadow-xs'
                      : 'border-neutral-200 bg-white'
                  }`}
                >
                  <Eraser size={13} />
                  <span>Borracha</span>
                </button>
              </div>

              {/* Tamanho do Traço & Ações Desfazer/Limpar */}
              <div className="flex items-center justify-between gap-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-neutral-600">Espessura:</span>
                  {[
                    { size: 3, label: 'Fino' },
                    { size: 6, label: 'Médio' },
                    { size: 12, label: 'Grosso' },
                  ].map(b => (
                    <button
                      key={b.size}
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setBrushSize(b.size);
                      }}
                      className={`px-2 py-1 rounded-lg text-[9px] font-bold border transition-colors cursor-pointer ${
                        brushSize === b.size
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black border-neutral-300'
                      }`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleUndo}
                    disabled={history.length === 0}
                    className="p-1.5 border border-black rounded-lg text-neutral-700 hover:bg-neutral-200 disabled:opacity-30 cursor-pointer"
                    title="Desfazer último traço"
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleClearCanvas}
                    className="p-1.5 border border-red-500 text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                    title="Limpar todos os desenhos"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTEÚDO DA ABA 3: ESCOLHA DA COR DO PERSONAGEM */}
          {activeTab === 'color' && (() => {
            const normalizedTakenSet = new Set(
              (takenColors || []).map(tc => (tc || '').trim().toUpperCase()).filter(Boolean)
            );
            const unusedPaletteColors = COLOR_PALETTE.filter(
              c => !normalizedTakenSet.has(c.hex.toUpperCase())
            );
            const canRepeatColors = unusedPaletteColors.length === 0;

            return (
              <div className="space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase text-neutral-600 block">
                    Selecione a Cor Oficial do seu Personagem:
                  </span>
                  {takenColors.length > 0 && !canRepeatColors && (
                    <span className="text-[9px] font-mono text-neutral-500">
                      Cores em uso bloqueadas
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PALETTE.map(c => {
                    const isSelected = currentColor.toUpperCase() === c.hex.toUpperCase();
                    const isTakenByOther =
                      !canRepeatColors &&
                      normalizedTakenSet.has(c.hex.toUpperCase()) &&
                      !isSelected;

                    return (
                      <button
                        key={c.hex}
                        type="button"
                        disabled={isTakenByOther}
                        onClick={() => {
                          if (isTakenByOther) return;
                          sounds.playClick();
                          setCurrentColor(c.hex);
                        }}
                        className={`p-2 rounded-xl border-2 flex items-center gap-2 transition-all relative ${
                          isSelected
                            ? 'border-black bg-neutral-100 font-black shadow-xs ring-2 ring-black cursor-pointer'
                            : isTakenByOther
                            ? 'border-neutral-200 bg-neutral-100 opacity-45 cursor-not-allowed'
                            : 'border-neutral-200 bg-white hover:border-neutral-400 cursor-pointer'
                        }`}
                        title={isTakenByOther ? `${c.name} já está em uso por outro jogador na sala` : c.name}
                      >
                        <span
                          className="w-5 h-5 rounded-full border-2 border-black shrink-0 shadow-2xs"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="min-w-0 text-left flex-1">
                          <span className="text-[10px] font-mono leading-tight truncate block">
                            {c.name}
                          </span>
                          {isTakenByOther && (
                            <span className="text-[8px] font-mono font-bold uppercase text-red-600 block leading-none">
                              Em uso
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer com botão Salvar Avatar */}
        <div className="p-3 sm:p-4 border-t-2 border-black bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-4 h-4 rounded-full border border-black shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-[11px] font-mono font-bold text-neutral-800 truncate">
              {playerName}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSaveAvatar}
            className="py-3 px-6 rounded-full bg-black text-white hover:bg-neutral-800 active:scale-95 transition-all text-xs font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <Check size={16} />
            <span>SALVAR AVATAR & COR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
