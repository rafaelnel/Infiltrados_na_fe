import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../utils/audio';
import { Volume2, Sparkles, Moon, Sun } from 'lucide-react';
import { Player } from '../types/game';

export interface SheepEventData {
  playerId: string;
  type: 'move' | 'baa';
  x?: number;
  y?: number;
  facing?: 'left' | 'right';
  text?: string;
  timestamp?: number;
}

export interface SyncedSheepData {
  playerId: string;
  x?: number;
  y?: number;
  facing?: 'left' | 'right';
  baaText?: string;
  baaTimestamp?: number;
  moveTimestamp?: number;
}

interface SheepCorralWaitingProps {
  currentPlayer: Player;
  allPlayers: Player[];
  title?: string;
  subtitle?: string;
  waitingCountText?: string;
  isNight?: boolean;
  onSendSheepEvent?: (event: SheepEventData) => void;
  incomingSheepEvent?: SheepEventData | null;
  syncedSheepMap?: Record<string, SyncedSheepData>;
}

interface SheepState {
  id: string;
  name: string;
  color?: string;
  isMe: boolean;
  isReady: boolean;
  isAlive: boolean;
  x: number; // Percentage 5 to 92
  y: number; // Percentage 20 to 80
  targetX: number;
  targetY: number;
  facing: 'left' | 'right';
  isWalking: boolean;
  isHopping: boolean;
  activeBaa: string | null;
  baaTimer?: ReturnType<typeof setTimeout>;
  colorSeed: number;
}

const BAA_TEXTS = [
  'MEH! 🐑',
  'MÉÉÉH! 🌾',
  'BÉÉÉÉ! ✨',
  'Meeeh!',
  'BÉÉ! 🤍',
  'MÉÉ-EH-EH!',
  'MEH!! 🍀',
  'Meeeéh! 🌸',
];

const BAA_TEXTS_GHOST = [
  'MEH DO ALÉM! 👻',
  'BÉÉÉ CELESTIAL! 😇',
  'MEH FANTASMA! ✨',
  'BÉÉÉ DAS NUVENS! ☁️',
  'MEH! 🕊️',
  'BÉÉÉ-EH-EH! 🌟',
];

// Ovelhinha com o design idêntico ao da ovelha do começo do jogo (Doodle preto e branco clássico)
export const SheepSprite: React.FC<{
  isWalking: boolean;
  isHopping: boolean;
  facing: 'left' | 'right';
  isMe: boolean;
  isNight?: boolean;
  isGhost?: boolean;
}> = ({ isWalking, isHopping, facing, isMe, isNight, isGhost }) => {
  return (
    <div
      className={`relative select-none pointer-events-none transition-transform duration-200 ${
        isHopping ? 'scale-110 -translate-y-4' : ''
      } ${isGhost ? 'opacity-85' : ''}`}
      style={{
        transform: `scaleX(${facing === 'left' ? -1 : 1})`,
      }}
    >
      <svg
        viewBox="0 0 200 220"
        className="w-16 h-18 sm:w-20 sm:h-22 drop-shadow-sm overflow-visible"
        fill="none"
        stroke="#000000"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.5"
        strokeDasharray={isGhost ? '4 3' : 'none'}
      >
        {/* Floor shadow */}
        <path
          d="M50 208 Q100 210 150 208 M65 212 Q100 213 135 212"
          strokeDasharray="none"
          strokeWidth="2"
        />

        {/* Patinhas com animação de trote ao caminhar */}
        <g
          className={`transition-transform duration-150 origin-top ${
            isWalking ? 'animate-bounce' : ''
          }`}
          style={{ animationDuration: '0.24s' }}
        >
          {/* Par de pernas traseiro */}
          <line x1="78" y1="162" x2="78" y2="206" />
          <line x1="75" y1="206" x2="81" y2="206" strokeWidth="3.5" strokeDasharray="none" />
          <line x1="114" y1="164" x2="114" y2="206" />
          <line x1="111" y1="206" x2="117" y2="206" strokeWidth="3.5" strokeDasharray="none" />
        </g>

        <g
          className={`transition-transform duration-150 origin-top ${
            isWalking ? 'animate-bounce' : ''
          }`}
          style={{ animationDuration: '0.24s', animationDelay: '0.12s' }}
        >
          {/* Par de pernas dianteiro */}
          <line x1="90" y1="164" x2="90" y2="206" />
          <line x1="87" y1="206" x2="93" y2="206" strokeWidth="3.5" strokeDasharray="none" />
          <line x1="126" y1="162" x2="126" y2="206" />
          <line x1="123" y1="206" x2="129" y2="206" strokeWidth="3.5" strokeDasharray="none" />
        </g>

        {/* Rabinho de nuvem */}
        <path d="M48 132 C40 132 40 144 48 144 C42 150 50 156 56 150" fill="#ffffff" />

        {/* Corpo volumoso fofo de nuvem */}
        <path
          d="M70 162 C58 162 50 150 54 138 C44 130 46 112 56 104 C52 92 64 80 76 84 C84 72 102 70 112 78 C122 70 140 72 146 84 C158 82 168 94 164 106 C174 116 172 132 162 140 C166 152 156 164 144 162 C134 170 118 168 110 162 C100 170 82 170 70 162 Z"
          fill="#ffffff"
        />

        {/* Cabeça oval */}
        <path
          d="M 78,108 A 24,22 0 1,0 126,108 A 24,22 0 1,0 78,108 Z"
          fill="#ffffff"
        />

        {/* Topete de lã no topo da cabeça */}
        <path
          d="M88 90 C84 82 92 76 98 80 C102 74 112 74 114 80 C120 78 126 84 122 92 C116 90 94 90 88 90 Z"
          fill="#ffffff"
        />

        {/* Orelhas caídas */}
        <path
          d="M 64,104 A 10,5 0 1,0 84,104 A 10,5 0 1,0 64,104 Z"
          fill="#ffffff"
          transform="rotate(-20 74 104)"
        />
        <path
          d="M 120,104 A 10,5 0 1,0 140,104 A 10,5 0 1,0 120,104 Z"
          fill="#ffffff"
          transform="rotate(20 130 104)"
        />

        {/* Olhos pretos expressivos */}
        <circle cx="94" cy="106" r="2.8" fill="#000000" strokeDasharray="none" />
        <circle cx="110" cy="106" r="2.8" fill="#000000" strokeDasharray="none" />

        {/* Focinho inocente */}
        <path
          d="M100 114 L104 114 M102 114 L102 118 M99 120 Q102 122 105 120"
          strokeWidth="2"
          strokeDasharray="none"
        />

        {/* Bochechas em traço */}
        <line x1="86" y1="114" x2="90" y2="114" strokeWidth="1.5" strokeDasharray="none" />
        <line x1="114" y1="114" x2="118" y2="114" strokeWidth="1.5" strokeDasharray="none" />

        {/* Florzinha na boca */}
        <circle cx="108" cy="124" r="3" fill="#ffffff" strokeDasharray="none" />
        <path d="M104 120 Q106 126 108 124" strokeWidth="1.5" strokeDasharray="none" />

        {/* Estrela de identificação para a própria ovelha do jogador */}
        {isMe && (
          <g transform="translate(102, 142)">
            <polygon
              points="0,-7 2,-2 7,-2 3,1 5,6 0,3 -5,6 -3,1 -7,-2 -2,-2"
              fill="#000000"
              stroke="#000000"
              strokeWidth="1"
              strokeDasharray="none"
            />
          </g>
        )}

        {/* Auréola de anjo e asinhas se for espírito (eliminado) */}
        {isGhost && (
          <g className="animate-pulse">
            <path
              d="M 80,62 A 22,6 0 1,0 124,62 A 22,6 0 1,0 80,62 Z"
              fill="none"
              stroke="#000000"
              strokeWidth="2"
              strokeDasharray="3 2"
            />
            <path
              d="M54 110 C40 92, 22 96, 28 112 C18 106, 14 118, 34 124 Z"
              fill="#ffffff"
              stroke="#000000"
              strokeWidth="2"
              strokeDasharray="none"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

export const SheepCorralWaiting: React.FC<SheepCorralWaitingProps> = ({
  currentPlayer,
  allPlayers,
  title = 'Cercado da Congregação',
  subtitle = 'Enquanto os outros finalizam suas ações, você virou uma ovelhinha no pasto!',
  waitingCountText,
  isNight = false,
  onSendSheepEvent,
  incomingSheepEvent,
  syncedSheepMap,
}) => {
  const corralRef = useRef<HTMLDivElement>(null);
  const [baaCount, setBaaCount] = useState(0);
  const [showControlsHint, setShowControlsHint] = useState(true);
  const [tapFeedback, setTapFeedback] = useState<{ x: number; y: number; key: number } | null>(null);
  const lastTouchTimeRef = useRef<number>(0);
  const lastProcessedBaaRef = useRef<Record<string, number>>({});

  // Calcula os limites horizontais conforme a inclinação da cerca em perspectiva
  const clampToPerspectiveCorral = useCallback((rawX: number, rawY: number) => {
    const clampedY = Math.max(22, Math.min(78, rawY));
    const t = (78 - clampedY) / (78 - 22);
    const minX = 12 + t * 13;
    const maxX = 76 + t * 13;
    const clampedX = Math.max(minX, Math.min(maxX, rawX));
    return { clampedX, clampedY };
  }, []);

  // Posição inicial determinística por jogador (todos os clientes veem as ovelhas no mesmo lugar inicial)
  const getDeterministicSpawn = useCallback(
    (playerId: string, idx: number) => {
      let hash = 0;
      for (let i = 0; i < playerId.length; i++) {
        hash = (hash * 31 + playerId.charCodeAt(i)) >>> 0;
      }
      const col = idx % 4;
      const row = Math.floor(idx / 4) % 3;
      const offsetX = ((hash % 9) - 4) * 1.2;
      const offsetY = (((hash >> 4) % 7) - 3) * 1.2;
      const rawY = 30 + row * 18 + offsetY;
      const clampedY = Math.max(24, Math.min(76, rawY));
      const t = (78 - clampedY) / (78 - 22);
      const minX = 14 + t * 13;
      const maxX = 74 + t * 13;
      const spanX = maxX - minX;
      const rawX = minX + 6 + (col * (spanX - 12)) / 3 + offsetX;
      const clampedX = Math.max(minX, Math.min(maxX, rawX));
      const facing: 'left' | 'right' = hash % 2 === 0 ? 'right' : 'left';
      return { x: clampedX, y: clampedY, facing };
    },
    []
  );

  // Inicializa posições das ovelhas para todos os jogadores
  const [sheepMap, setSheepMap] = useState<Record<string, SheepState>>(() => {
    const initialMap: Record<string, SheepState> = {};
    const playerList = [...allPlayers];
    if (currentPlayer && !playerList.some(p => p.id === currentPlayer.id)) {
      playerList.unshift(currentPlayer);
    }
    const relevantPlayers = playerList.length > 0 ? playerList : (currentPlayer ? [currentPlayer] : []);

    relevantPlayers.forEach((p, idx) => {
      const isMe = Boolean(currentPlayer && p.id === currentPlayer.id);
      const spawn = getDeterministicSpawn(p.id, idx);
      const synced = syncedSheepMap?.[p.id];
      const startX = typeof synced?.x === 'number' ? synced.x : spawn.x;
      const startY = typeof synced?.y === 'number' ? synced.y : spawn.y;
      const { clampedX, clampedY } = clampToPerspectiveCorral(startX, startY);

      initialMap[p.id] = {
        id: p.id,
        name: p.name || (isMe ? 'Você' : `Irmão ${idx + 1}`),
        color: p.color,
        isMe,
        isReady: Boolean(p.hasConfirmedRole || p.hasActedTonight || p.voteTargetId),
        isAlive: p.isAlive ?? true,
        x: clampedX,
        y: clampedY,
        targetX: clampedX,
        targetY: clampedY,
        facing: synced?.facing || spawn.facing,
        isWalking: false,
        isHopping: false,
        activeBaa: null,
        colorSeed: idx,
      };
    });

    if (currentPlayer && !initialMap[currentPlayer.id]) {
      const spawn = getDeterministicSpawn(currentPlayer.id, 0);
      initialMap[currentPlayer.id] = {
        id: currentPlayer.id,
        name: currentPlayer.name || 'Você',
        color: currentPlayer.color,
        isMe: true,
        isReady: true,
        isAlive: currentPlayer.isAlive ?? true,
        x: spawn.x,
        y: spawn.y,
        targetX: spawn.x,
        targetY: spawn.y,
        facing: spawn.facing,
        isWalking: false,
        isHopping: false,
        activeBaa: null,
        colorSeed: 0,
      };
    }

    return initialMap;
  });

  // Atualiza a lista caso o status ou jogadores mudem
  useEffect(() => {
    setSheepMap(prev => {
      const next = { ...prev };
      const playerList = [...allPlayers];
      if (currentPlayer && !playerList.some(p => p.id === currentPlayer.id)) {
        playerList.unshift(currentPlayer);
      }

      playerList.forEach((p, idx) => {
        const isCurrentMe = Boolean(currentPlayer && p.id === currentPlayer.id);
        if (!next[p.id]) {
          const spawn = getDeterministicSpawn(p.id, idx);
          const synced = syncedSheepMap?.[p.id];
          const startX = typeof synced?.x === 'number' ? synced.x : spawn.x;
          const startY = typeof synced?.y === 'number' ? synced.y : spawn.y;
          const { clampedX, clampedY } = clampToPerspectiveCorral(startX, startY);
          next[p.id] = {
            id: p.id,
            name: p.name || (isCurrentMe ? 'Você' : `Irmão ${idx + 1}`),
            color: p.color,
            isMe: isCurrentMe,
            isReady: Boolean(p.hasConfirmedRole || p.hasActedTonight || p.voteTargetId),
            isAlive: p.isAlive ?? true,
            x: clampedX,
            y: clampedY,
            targetX: clampedX,
            targetY: clampedY,
            facing: synced?.facing || spawn.facing,
            isWalking: false,
            isHopping: false,
            activeBaa: null,
            colorSeed: idx,
          };
        } else {
          next[p.id] = {
            ...next[p.id],
            isMe: isCurrentMe,
            name: p.name || next[p.id].name,
            color: p.color || next[p.id].color,
            isReady: Boolean(p.hasConfirmedRole || p.hasActedTonight || p.voteTargetId),
            isAlive: p.isAlive ?? true,
          };
        }
      });

      return next;
    });
  }, [allPlayers, currentPlayer?.id, currentPlayer?.name, currentPlayer?.color, currentPlayer?.isAlive, clampToPerspectiveCorral, getDeterministicSpawn, syncedSheepMap]);

  // Sincronização em tempo real do mapa de posições e balidos (suporta múltiplos jogadores movendo juntos)
  useEffect(() => {
    if (!syncedSheepMap) return;

    const baaTriggers: Array<{ playerId: string; text: string; colorSeed: number }> = [];

    setSheepMap(prev => {
      let changed = false;
      const next = { ...prev };

      for (const [playerId, data] of Object.entries(syncedSheepMap)) {
        if (!data || playerId === currentPlayer.id) continue;
        const sheep = next[playerId];
        if (!sheep) continue;

        let updatedSheep = sheep;

        if (typeof data.x === 'number' && typeof data.y === 'number') {
          const { clampedX, clampedY } = clampToPerspectiveCorral(data.x, data.y);
          const diffX = Math.abs(updatedSheep.targetX - clampedX);
          const diffY = Math.abs(updatedSheep.targetY - clampedY);
          if (diffX > 0.2 || diffY > 0.2) {
            changed = true;
            updatedSheep = {
              ...updatedSheep,
              targetX: clampedX,
              targetY: clampedY,
              facing: data.facing || (clampedX < updatedSheep.x ? 'left' : 'right'),
              isWalking: true,
            };
          }
        }

        if (
          data.baaTimestamp &&
          data.baaTimestamp > (lastProcessedBaaRef.current[playerId] || 0) &&
          Date.now() - data.baaTimestamp < 6000
        ) {
          lastProcessedBaaRef.current[playerId] = data.baaTimestamp;
          const baaText = data.baaText || BAA_TEXTS[Math.floor(Math.random() * BAA_TEXTS.length)];
          changed = true;
          updatedSheep = {
            ...updatedSheep,
            isHopping: true,
            activeBaa: baaText,
          };
          baaTriggers.push({
            playerId,
            text: baaText,
            colorSeed: updatedSheep.colorSeed,
          });
        }

        next[playerId] = updatedSheep;
      }

      return changed ? next : prev;
    });

    for (const trig of baaTriggers) {
      sounds.playSheepBaa(trig.colorSeed * 12);
      setTimeout(() => {
        setSheepMap(prev => {
          if (!prev[trig.playerId]) return prev;
          return {
            ...prev,
            [trig.playerId]: {
              ...prev[trig.playerId],
              isHopping: false,
              activeBaa: null,
            },
          };
        });
      }, 2200);
    }
  }, [syncedSheepMap, currentPlayer.id, clampToPerspectiveCorral]);

  // Processa evento direto de ovelha vindo pelo socket (incomingSheepEvent)
  useEffect(() => {
    if (!incomingSheepEvent || incomingSheepEvent.playerId === currentPlayer.id) return;

    const { playerId, type, x, y, facing, text, timestamp } = incomingSheepEvent;

    setSheepMap(prev => {
      const sheep = prev[playerId];
      if (!sheep) return prev;

      if (type === 'move' && typeof x === 'number' && typeof y === 'number') {
        const { clampedX, clampedY } = clampToPerspectiveCorral(x, y);
        return {
          ...prev,
          [playerId]: {
            ...sheep,
            targetX: clampedX,
            targetY: clampedY,
            facing: facing || (clampedX < sheep.x ? 'left' : 'right'),
            isWalking: true,
          },
        };
      } else if (type === 'baa') {
        if (timestamp) {
          if (timestamp <= (lastProcessedBaaRef.current[playerId] || 0)) return prev;
          lastProcessedBaaRef.current[playerId] = timestamp;
        }
        sounds.playSheepBaa(sheep.colorSeed * 12);
        return {
          ...prev,
          [playerId]: {
            ...sheep,
            isHopping: true,
            activeBaa: text || BAA_TEXTS[Math.floor(Math.random() * BAA_TEXTS.length)],
          },
        };
      }
      return prev;
    });

    if (type === 'baa') {
      setTimeout(() => {
        setSheepMap(prev => {
          if (!prev[playerId]) return prev;
          return {
            ...prev,
            [playerId]: {
              ...prev[playerId],
              isHopping: false,
              activeBaa: null,
            },
          };
        });
      }, 2200);
    }
  }, [incomingSheepEvent, currentPlayer.id, clampToPerspectiveCorral]);

  // Função para mover a ovelhinha do jogador ativo (somente por clique/toque na tela)
  const moveMySheep = useCallback(
    (targetPctX: number, targetPctY: number) => {
      const { clampedX, clampedY } = clampToPerspectiveCorral(targetPctX, targetPctY);

      const myId = currentPlayer.id;
      let computedFacing: 'left' | 'right' = 'right';

      setSheepMap(prev => {
        let mySheep = prev[myId];
        if (!mySheep) {
          mySheep = {
            id: myId,
            name: currentPlayer.name || 'Você',
            color: currentPlayer.color,
            isMe: true,
            isReady: true,
            isAlive: currentPlayer.isAlive ?? true,
            x: 48,
            y: 52,
            targetX: 48,
            targetY: 52,
            facing: 'right',
            isWalking: false,
            isHopping: false,
            activeBaa: null,
            colorSeed: 0,
          };
        }
        computedFacing = clampedX < mySheep.x ? 'left' : 'right';

        return {
          ...prev,
          [myId]: {
            ...mySheep,
            targetX: clampedX,
            targetY: clampedY,
            facing: computedFacing,
            isWalking: true,
          },
        };
      });

      if (onSendSheepEvent) {
        onSendSheepEvent({
          playerId: myId,
          type: 'move',
          x: clampedX,
          y: clampedY,
          facing: computedFacing,
          timestamp: Date.now(),
        });
      }
    },
    [currentPlayer.id, currentPlayer.name, currentPlayer.color, currentPlayer.isAlive, onSendSheepEvent, clampToPerspectiveCorral]
  );

  // Clique ou toque na tela para andar até o ponto (evita disparo duplo touch + click no celular)
  const handleCorralClick = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!corralRef.current) return;
    const now = Date.now();
    if ('touches' in e) {
      lastTouchTimeRef.current = now;
    } else if (now - lastTouchTimeRef.current < 450) {
      return;
    }

    const rect = corralRef.current.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const clickX = clientX - rect.left;
    const clickY = clientY - rect.top;

    const pctX = (clickX / rect.width) * 100;
    const pctY = (clickY / rect.height) * 100;

    const { clampedX, clampedY } = clampToPerspectiveCorral(pctX, pctY);
    setTapFeedback({ x: clampedX, y: clampedY, key: now });
    moveMySheep(clampedX, clampedY);
    setShowControlsHint(false);
  };

  // Balir: Falar "MEH!"
  const handleBaa = useCallback(() => {
    const myId = currentPlayer.id;
    const pool = currentPlayer.isAlive ? BAA_TEXTS : BAA_TEXTS_GHOST;
    const randomBaa = pool[Math.floor(Math.random() * pool.length)];

    const pitch = currentPlayer.isAlive
      ? Math.floor(Math.random() * 20 - 10)
      : Math.floor(Math.random() * 20 + 25);
    sounds.playSheepBaa(pitch);
    setBaaCount(prev => prev + 1);

    let currentX = 48;
    let currentY = 52;
    let currentFacing: 'left' | 'right' = 'right';

    setSheepMap(prev => {
      let mySheep = prev[myId];
      if (!mySheep) {
        mySheep = {
          id: myId,
          name: currentPlayer.name || 'Você',
          color: currentPlayer.color,
          isMe: true,
          isReady: true,
          isAlive: currentPlayer.isAlive ?? true,
          x: 48,
          y: 52,
          targetX: 48,
          targetY: 52,
          facing: 'right',
          isWalking: false,
          isHopping: false,
          activeBaa: null,
          colorSeed: 0,
        };
      }
      currentX = mySheep.targetX;
      currentY = mySheep.targetY;
      currentFacing = mySheep.facing;
      return {
        ...prev,
        [myId]: {
          ...mySheep,
          isHopping: true,
          activeBaa: randomBaa,
        },
      };
    });

    if (onSendSheepEvent) {
      onSendSheepEvent({
        playerId: myId,
        type: 'baa',
        x: currentX,
        y: currentY,
        facing: currentFacing,
        text: randomBaa,
        timestamp: Date.now(),
      });
    }

    setTimeout(() => {
      setSheepMap(prev => {
        const mySheep = prev[myId];
        if (!mySheep) return prev;
        return {
          ...prev,
          [myId]: {
            ...mySheep,
            isHopping: false,
            activeBaa: null,
          },
        };
      });
    }, 2200);
  }, [currentPlayer.id, currentPlayer.name, currentPlayer.color, currentPlayer.isAlive, onSendSheepEvent]);

  // Loop de física suave (interpolação e caminhada fluida em tempo real para todas as ovelhas)
  useEffect(() => {
    const interval = setInterval(() => {
      setSheepMap(prev => {
        let changed = false;
        const next = { ...prev };

        Object.keys(next).forEach(id => {
          const sheep = next[id];
          const dx = sheep.targetX - sheep.x;
          const dy = sheep.targetY - sheep.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist > 0.35) {
            changed = true;
            const speed = 1.85;
            const ratio = Math.min(1, speed / dist);
            const nextX = sheep.x + dx * ratio;
            const nextY = sheep.y + dy * ratio;
            const facing: 'left' | 'right' = dx < 0 ? 'left' : 'right';

            next[id] = {
              ...sheep,
              x: nextX,
              y: nextY,
              facing: Math.abs(dx) > 0.15 ? facing : sheep.facing,
              isWalking: true,
            };
          } else if (sheep.isWalking) {
            changed = true;
            next[id] = {
              ...sheep,
              x: sheep.targetX,
              y: sheep.targetY,
              isWalking: false,
            };
          }
        });

        return changed ? next : prev;
      });
    }, 32);

    return () => clearInterval(interval);
  }, []);

  // IA autônoma para bots pastarem dentro do cercado em perspectiva
  useEffect(() => {
    const wanderInterval = setInterval(() => {
      setSheepMap(prev => {
        const next = { ...prev };
        // Apenas bots andam sozinhos; jogadores reais só se movem clicando onde querem ir
        const botIds = Object.keys(next).filter(id => {
          if (id === currentPlayer.id) return false;
          const p = allPlayers.find(pl => pl.id === id);
          return Boolean(p?.isBot);
        });
        if (botIds.length === 0) return prev;

        const randomId = botIds[Math.floor(Math.random() * botIds.length)];
        const sheep = next[randomId];
        if (!sheep || sheep.isWalking) return prev;

        const action = Math.random();
        if (action < 0.65) {
          const deltaX = (Math.random() - 0.5) * 26;
          const deltaY = (Math.random() - 0.5) * 20;
          const { clampedX, clampedY } = clampToPerspectiveCorral(sheep.x + deltaX, sheep.y + deltaY);
          next[randomId] = {
            ...sheep,
            targetX: clampedX,
            targetY: clampedY,
            facing: clampedX < sheep.x ? 'left' : 'right',
            isWalking: true,
          };
        } else if (action < 0.82) {
          const botBaa = BAA_TEXTS[Math.floor(Math.random() * BAA_TEXTS.length)];
          next[randomId] = {
            ...sheep,
            isHopping: true,
            activeBaa: botBaa,
          };
          setTimeout(() => {
            setSheepMap(p =>
              p[randomId]
                ? { ...p, [randomId]: { ...p[randomId], isHopping: false, activeBaa: null } }
                : p
            );
          }, 2000);
        }

        return next;
      });
    }, 2800);

    return () => clearInterval(wanderInterval);
  }, [currentPlayer.id, allPlayers, clampToPerspectiveCorral]);

  // Ordena as ovelhas por profundidade (Y) para que as da frente fiquem sobre as de trás
  const sortedSheep = Object.values(sheepMap).sort((a, b) => a.y - b.y);

  // Função auxiliar para desenhar um mourão 3D em preto e branco no SVG
  const renderPost3D = (x: number, yTop: number, height: number, key: string) => {
    const w = 13;
    const d = 5;
    return (
      <g key={key} stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
        {/* Face frontal */}
        <rect x={x} y={yTop} width={w} height={height} fill="#ffffff" />
        {/* Face lateral direita (profundidade 3D) */}
        <polygon
          points={`${x + w},${yTop} ${x + w + d},${yTop - d} ${x + w + d},${yTop + height - d} ${x + w},${yTop + height}`}
          fill="#ffffff"
        />
        {/* Topo 3D do mourão */}
        <polygon
          points={`${x},${yTop} ${x + d},${yTop - d} ${x + w + d},${yTop - d} ${x + w},${yTop}`}
          fill="#ffffff"
        />
      </g>
    );
  };

  // Tufos de grama estilo M (iguais à imagem enviada)
  const renderGrassTuft = (x: number, y: number, scale = 1, key: string) => (
    <path
      key={key}
      transform={`translate(${x}, ${y}) scale(${scale})`}
      d="M 0,14 L -6,2 L -1,9 L 2,-2 L 6,9 L 11,3 L 7,14"
      fill="#ffffff"
      stroke="#000000"
      strokeWidth="2.2"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );

  // Tufos de 3 risquinhos (\ | /) iguais à imagem enviada
  const renderThreeStrokes = (x: number, y: number, key: string) => (
    <g key={key} transform={`translate(${x}, ${y})`} stroke="#000000" strokeWidth="2" strokeLinecap="round">
      <line x1="-6" y1="8" x2="-9" y2="1" />
      <line x1="0" y1="8" x2="0" y2="0" />
      <line x1="6" y1="8" x2="9" y2="2" />
    </g>
  );

  // Posições dos mourões traseiros e dianteiros
  const backPostsX = [175, 262, 350, 438, 525, 613, 701, 789, 877, 965];
  const frontPostsLeftX = [25, 112, 200, 288, 375, 462, 550, 622];
  const gateLeftPostX = 665;
  const gateRightPostX = 738;
  const frontCornerRightX = 815;

  // Mourões intermediários das cercas inclinadas (esquerda e direita)
  const slantSteps = [0.2, 0.4, 0.6, 0.8];

  return (
    <div className="w-full flex flex-col items-center space-y-2.5 select-none">
      {/* Top Banner de Status e Título do Cercado em P&B */}
      <div className="w-full flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-black text-white flex items-center justify-center border-2 border-black shadow-xs">
            {isNight ? <Moon size={15} /> : <Sun size={15} />}
          </div>
          <div className="text-left">
            <h4 className="text-xs font-black uppercase font-mono tracking-tight leading-tight text-black">
              {title}
            </h4>
            <p className="text-[10px] font-mono text-neutral-600 leading-tight">
              {subtitle}
            </p>
          </div>
        </div>

        {waitingCountText && (
          <div className="px-3 py-1 rounded-full text-[10px] font-mono font-black border-2 border-black bg-white text-black flex items-center gap-1.5 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] shrink-0">
            <Sparkles size={11} className="text-black animate-spin" />
            <span>{waitingCountText}</span>
          </div>
        )}
      </div>

      {/* CERCADO EM PERSPECTIVA 3D PRETO E BRANCO (IDÊNTICO À IMAGEM DE REFERÊNCIA) */}
      <div
        ref={corralRef}
        onClick={handleCorralClick}
        onTouchStart={handleCorralClick}
        className="relative w-full aspect-[16/9] min-h-[240px] sm:min-h-[290px] bg-white overflow-hidden cursor-pointer select-none rounded-2xl border-2 border-black/15"
        style={{ touchAction: 'manipulation' }}
      >
        {/* CAMADA 1: Graminhas de Fundo, Cerca Traseira e Cercas Laterais em Perspectiva */}
        <svg
          viewBox="0 0 1000 560"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        >
          {/* Graminhas e pedrinhas espalhadas pelo cenário (fora e dentro do cercado) */}
          {renderThreeStrokes(50, 48, 'ts_1')}
          {renderGrassTuft(98, 72, 1.1, 'gt_1')}
          {renderGrassTuft(35, 105, 1.15, 'gt_2')}
          {renderGrassTuft(76, 138, 0.85, 'gt_3')}
          {renderThreeStrokes(32, 228, 'ts_2')}
          {renderGrassTuft(378, 12, 0.75, 'gt_4')}
          {renderThreeStrokes(708, 14, 'ts_3')}
          {renderThreeStrokes(982, 155, 'ts_4')}
          {renderGrassTuft(968, 212, 0.9, 'gt_5')}
          {renderGrassTuft(955, 368, 1.1, 'gt_6')}
          {renderGrassTuft(908, 468, 1.15, 'gt_7')}
          {renderThreeStrokes(965, 512, 'ts_5')}
          {renderGrassTuft(58, 526, 1.1, 'gt_8')}
          {renderThreeStrokes(188, 532, 'ts_6')}
          {renderGrassTuft(352, 534, 0.95, 'gt_9')}
          {renderThreeStrokes(452, 528, 'ts_7')}

          {/* Graminhas e detalhes no interior do pasto */}
          {renderGrassTuft(195, 178, 0.85, 'gt_in_1')}
          {renderGrassTuft(428, 135, 0.8, 'gt_in_2')}
          {renderGrassTuft(536, 130, 1.05, 'gt_in_3')}
          {renderThreeStrokes(638, 238, 'ts_in_1')}
          {renderThreeStrokes(712, 260, 'ts_in_2')}
          {renderGrassTuft(318, 296, 1.0, 'gt_in_4')}
          {renderGrassTuft(150, 355, 0.85, 'gt_in_5')}
          {renderThreeStrokes(470, 358, 'ts_in_3')}
          {renderGrassTuft(536, 362, 1.0, 'gt_in_6')}
          {renderGrassTuft(788, 412, 0.75, 'gt_in_7')}

          {/* Pedrinhas e traços de solo à esquerda e centro-baixo */}
          <g stroke="#000000" strokeWidth="2" fill="#ffffff" strokeLinecap="round" strokeLinejoin="round">
            {/* Pedrinhas canto inferior esquerdo */}
            <path d="M 125,418 C 122,406 142,402 152,408 C 160,412 158,420 148,421 Z" />
            <path d="M 161,420 A 5,3 0 1,0 171,420 A 5,3 0 1,0 161,420 Z" />
            <path d="M 144,430 A 6,3.5 0 1,0 156,430 A 6,3.5 0 1,0 144,430 Z" />
            {/* Pedrinhas centro-direita */}
            <path d="M 620,392 C 622,385 632,385 634,392 Z" />
            <path d="M 608,408 C 610,402 618,402 620,408 Z" />
            {/* Pedra direita externa */}
            <path d="M 918,390 C 916,378 938,376 946,386 C 950,392 940,395 922,394 Z" />
            <path d="M 949,400 A 5,3 0 1,0 959,400 A 5,3 0 1,0 949,400 Z" />
            {/* Traços orgânicos de solo */}
            <path d="M 355,414 C 362,406 375,408 380,414 M 392,418 C 405,420 412,428 402,434" fill="none" />
            <path d="M 754,284 C 765,280 785,280 795,285 M 782,304 C 798,300 808,292 790,290" fill="none" />
          </g>

          {/* ==================== CERCA TRASEIRA (TOPO) ==================== */}
          <g stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
            {/* Trilho horizontal superior traseiro */}
            <rect x="175" y="40" width="790" height="12" fill="#ffffff" />
            <polygon points="175,40 180,36 970,36 965,40" fill="#ffffff" />
            {/* Trilho horizontal inferior traseiro */}
            <rect x="175" y="64" width="790" height="12" fill="#ffffff" />
            <polygon points="175,64 180,60 970,60 965,64" fill="#ffffff" />
          </g>
          {/* Mourões da cerca traseira */}
          {backPostsX.map((px, idx) => renderPost3D(px, 28, 60, `back_post_${idx}`))}

          {/* ==================== CERCA LATERAL ESQUERDA (INCLINADA) ==================== */}
          <g stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
            {/* Trilho superior esquerdo */}
            <polygon points="175,42 183,42 38,465 28,465" fill="#ffffff" />
            {/* Trilho inferior esquerdo */}
            <polygon points="175,66 183,66 38,490 28,490" fill="#ffffff" />
          </g>
          {/* Mourões inclinados da esquerda (de trás para frente) */}
          {slantSteps.map((t, idx) => {
            const px = 175 + (25 - 175) * t;
            const py = 28 + (446 - 28) * t;
            return renderPost3D(px, py, 62, `left_post_${idx}`);
          })}

          {/* ==================== CERCA LATERAL DIREITA (INCLINADA) ==================== */}
          <g stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
            {/* Trilho superior direito */}
            <polygon points="965,42 975,42 828,465 818,465" fill="#ffffff" />
            {/* Trilho inferior direito */}
            <polygon points="965,66 975,66 828,490 818,490" fill="#ffffff" />
          </g>
          {/* Mourões inclinados da direita (de trás para frente) */}
          {slantSteps.map((t, idx) => {
            const px = 965 + (815 - 965) * t;
            const py = 28 + (446 - 28) * t;
            return renderPost3D(px, py, 62, `right_post_${idx}`);
          })}
        </svg>

        {/* Dica discreta inicial */}
        {showControlsHint && (
          <div className="absolute top-12 left-1/2 -translate-x-1/2 z-40 pointer-events-none bg-white text-black px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-tight shadow-sm border-2 border-black">
            <span>Toque onde quer ir no cercado</span>
          </div>
        )}

        {/* Feedback visual sutil de clique onde a ovelha vai ir */}
        <AnimatePresence>
          {tapFeedback && (
            <motion.div
              key={tapFeedback.key}
              initial={{ scale: 0.2, opacity: 0.9 }}
              animate={{ scale: 1.5, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.38, ease: 'easeOut' }}
              className="absolute pointer-events-none w-6 h-4 rounded-full border-2 border-black -translate-x-1/2 -translate-y-1/2 z-15"
              style={{ left: `${tapFeedback.x}%`, top: `${tapFeedback.y}%` }}
            />
          )}
        </AnimatePresence>

        {/* CAMADA 2: OVELHAS NO PASTO (ORDENADAS POR PROFUNDIDADE) */}
        {sortedSheep.map(sheep => {
          return (
            <div
              key={sheep.id}
              className="absolute z-20 pointer-events-none"
              style={{
                left: `${sheep.x}%`,
                top: `${sheep.y}%`,
                transform: 'translate(-50%, -65%)',
                willChange: 'left, top',
              }}
            >
              {/* Balão de Fala do "MEH!" em P&B */}
              <AnimatePresence>
                {sheep.activeBaa && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: -22 }}
                    exit={{ opacity: 0, scale: 0.8, y: -32 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 350 }}
                    className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap z-50 pointer-events-none"
                  >
                    <div className="relative bg-white text-black font-black font-mono text-[11px] px-2.5 py-0.5 rounded-xl shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-black flex items-center gap-1">
                      <span>{sheep.activeBaa}</span>
                      <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white border-r-2 border-b-2 border-black rotate-45" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Nome discreto da ovelha com indicador de cor do jogador */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 pointer-events-none whitespace-nowrap z-30">
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[8px] font-mono font-black tracking-tight flex items-center gap-1 border border-black ${
                    sheep.isMe
                      ? 'bg-black text-white'
                      : 'bg-white/95 text-black'
                  }`}
                >
                  {sheep.color && (
                    <span
                      className="w-2 h-2 rounded-full border border-black/40 shrink-0"
                      style={{ backgroundColor: sheep.color }}
                    />
                  )}
                  <span>{sheep.isMe ? '★ VOCÊ' : sheep.name}</span>
                  {!sheep.isAlive && <span>🕊️</span>}
                </span>
              </div>

              {/* Ovelha com o Design Clássico do Início do Jogo */}
              <SheepSprite
                isWalking={sheep.isWalking}
                isHopping={sheep.isHopping}
                facing={sheep.facing}
                isMe={sheep.isMe}
                isNight={isNight}
                isGhost={!sheep.isAlive}
              />
            </div>
          );
        })}

        {/* CAMADA 3: CERCA FRONTAL COM PORTEIRA (FICA NA FRENTE DAS OVELHAS) */}
        <svg
          viewBox="0 0 1000 560"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
        >
          <g stroke="#000000" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round">
            {/* Trilhos horizontais frontais à esquerda da porteira */}
            <rect x="25" y="460" width="640" height="13" fill="#ffffff" />
            <polygon points="25,460 30,456 670,456 665,460" fill="#ffffff" />
            <rect x="25" y="486" width="640" height="13" fill="#ffffff" />
            <polygon points="25,486 30,482 670,482 665,486" fill="#ffffff" />

            {/* Trilhos horizontais frontais à direita da porteira */}
            <rect x="738" y="460" width="77" height="13" fill="#ffffff" />
            <polygon points="738,460 743,456 820,456 815,460" fill="#ffffff" />
            <rect x="738" y="486" width="77" height="13" fill="#ffffff" />
            <polygon points="738,486 743,482 820,482 815,486" fill="#ffffff" />

            {/* PORTEIRA (GATE) ENTRE OS MOURÕES 665 E 738 */}
            <g>
              {/* Moldura externa da porteira */}
              <rect x="682" y="454" width="56" height="54" fill="#ffffff" />
              <rect x="687" y="460" width="46" height="42" fill="#ffffff" />
              {/* Ripas verticais da porteira */}
              <line x1="698" y1="460" x2="698" y2="502" />
              <line x1="710" y1="460" x2="710" y2="502" />
              <line x1="722" y1="460" x2="722" y2="502" />
              {/* Ferrolho / Tranca da porteira */}
              <rect x="726" y="477" width="8" height="9" rx="2" fill="#ffffff" />
              <line x1="730" y1="481" x2="737" y2="481" strokeWidth="2.5" />
            </g>
          </g>

          {/* Mourões frontais à esquerda */}
          {frontPostsLeftX.map((px, idx) => renderPost3D(px, 446, 66, `front_post_${idx}`))}
          {/* Mourões da porteira e canto direito */}
          {renderPost3D(gateLeftPostX, 446, 66, 'gate_left_post')}
          {renderPost3D(gateRightPostX, 446, 66, 'gate_right_post')}
          {renderPost3D(frontCornerRightX, 446, 66, 'front_right_corner')}

          {/* Graminhas coladas na base dos mourões frontais (iguais à imagem) */}
          {renderGrassTuft(114, 502, 0.75, 'gt_base_1')}
          {renderGrassTuft(624, 502, 0.75, 'gt_base_2')}
        </svg>
      </div>

      {/* BOTÃO DE FALAR "MEH" */}
      <div className="w-full pt-0.5">
        <motion.button
          whileTap={{ scale: 0.96, y: 2 }}
          whileHover={{ scale: 1.01 }}
          type="button"
          onClick={handleBaa}
          className="w-full py-3.5 px-6 rounded-2xl bg-white hover:bg-neutral-100 active:bg-black active:text-white text-black border-3 border-black font-mono font-black text-sm tracking-wider uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:shadow-none transition-all flex items-center justify-center gap-2.5 cursor-pointer"
        >
          <Volume2 size={19} className="text-black" />
          <span>FALAR &quot;MEH!&quot; 🐑</span>
          {baaCount > 0 && (
            <span className="ml-1 px-2.5 py-0.5 bg-black text-white rounded-full text-xs font-bold font-mono">
              {baaCount}x
            </span>
          )}
        </motion.button>
      </div>
    </div>
  );
};
