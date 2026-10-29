import express, { Request, Response } from 'express';
import http from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type Role = 'SOLDADO' | 'OVELHA' | 'PASTOR' | 'EVANGELISTA' | 'APOSTOLO' | 'PROFETA' | 'MESTRE';
export type Team = 'SOLDADOS' | 'OVELHAS';
export type Phase = 'LOBBY' | 'ROLE_REVEAL' | 'NIGHT' | 'DAY_ANNOUNCEMENT' | 'DAY_DISCUSSION' | 'DAY_VOTING' | 'DAY_RESULT' | 'GAME_OVER';
export type PlayerModifier = 'FALSO_PROFETA' | 'ESPIAO' | 'ANJO';

export interface ModifiersConfig {
  falsoProfeta: boolean;
  espiao: boolean;
  anjo: boolean;
}

export interface Player {
  id: string;
  socketId?: string;
  name: string;
  color?: string;
  avatar?: string;
  role: Role;
  team: Team;
  isAlive: boolean;
  isHost: boolean;
  isBot: boolean;
  prayersReceived: number;
  converted: boolean;
  hasActedTonight: boolean;
  voteTargetId: string | null;
  nightActionTargetId: string | null;
  nightActionSecondaryId?: string | null;
  lastInspectionResult?: string | null;
  modifier?: PlayerModifier | null;
  investigationCount?: number;
  spyUsed?: boolean;
  angelUsed?: boolean;
  angelSacrificeTonight?: boolean;
  masterDoubleVotesRemaining?: number;
  usedDoubleVoteThisRound?: boolean;
  lastProtectedId?: string | null;
  hasConfirmedRole?: boolean;
  hasApprovedPhase?: boolean;
  disconnected?: boolean;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: Role;
  text: string;
  timestamp: number;
  channel: 'PUBLIC' | 'SOLDIERS' | 'SYSTEM';
}

export interface GameLog {
  id: string;
  phase: string;
  dayNumber: number;
  text: string;
  timestamp: number;
  type: 'INFO' | 'DEATH' | 'CONVERSION' | 'VOTE' | 'NIGHT_RESULT';
}

export interface Room {
  code: string;
  hostId: string;
  phase: Phase;
  dayNumber: number;
  phaseTimeRemaining: number;
  players: Player[];
  messages: ChatMessage[];
  logs: GameLog[];
  winner: Team | null;
  successfulConversionsCount: number;
  config: {
    revealRolesOnDeath: boolean;
    pastorCanSelfProtect: boolean;
    discussionTimeSeconds: number;
    votingTimeSeconds: number;
    nightTimeSeconds: number;
    modifiersConfig?: ModifiersConfig;
  };
  sseClients: Array<{ res: Response; playerId: string }>;
  emptySince?: number; // Momento em que a sala ficou sem nenhum humano online
}

// ----------------------------------------------------------------------------
// ESTRUTURA DE SALAS EM MEMÓRIA & LIMPEZA AUTOMÁTICA (5 MIN SEM HUMANOS)
// ----------------------------------------------------------------------------
const rooms = new Map<string, Room>();

const ROOM_INACTIVITY_LIMIT_MS = 5 * 60 * 1000; // 5 minutos

// Referência global ao servidor Socket.IO
let globalIo: SocketIOServer | null = null;

// Conta humanos ativos com conexão viva (desconsidera bots e desconectados)
function getActiveHumansCount(room: Room): number {
  let count = 0;
  for (const p of room.players) {
    if (p.isBot) continue;
    if (p.disconnected) continue;
    if (p.socketId) {
      if (globalIo) {
        const sock = globalIo.sockets.sockets.get(p.socketId);
        if (sock && sock.connected) {
          count++;
        } else {
          p.disconnected = true;
          p.socketId = undefined;
        }
      } else {
        count++;
      }
    } else {
      p.disconnected = true;
    }
  }
  return count;
}

// Verifica se a sala está inativa há mais de 5 minutos (sem pessoas humanas reais, tirando bots)
function checkRoomInactivity(room: Room, code: string): boolean {
  const activeCount = getActiveHumansCount(room);
  const now = Date.now();
  if (activeCount === 0) {
    if (!room.emptySince) {
      room.emptySince = now;
    } else if (now - room.emptySince >= ROOM_INACTIVITY_LIMIT_MS) {
      console.log(`[AutoClean] Sala ${code} encerrada e deletada por inatividade (mais de 5 min sem pessoas online, tirando bots).`);
      for (const client of room.sseClients) {
        try { client.res.end(); } catch {}
      }
      rooms.delete(code);
      return true;
    }
  } else {
    room.emptySince = undefined;
  }
  return false;
}

function checkAndCleanEmptyRooms() {
  for (const [code, room] of rooms.entries()) {
    checkRoomInactivity(room, code);
  }
}

// Executa verificação periódica de inatividade a cada 10 segundos
setInterval(checkAndCleanEmptyRooms, 10 * 1000);

// Localiza o jogador correto para reconexão inteligente
function findPlayerForReconnection(
  room: Room,
  reqPlayerId?: string,
  rawPlayerName?: string,
  currentSocketId?: string
): Player | undefined {
  const cleanId = (reqPlayerId || '').trim();
  const cleanName = (rawPlayerName || '').trim().toLowerCase();

  // 1. Busca por ID exato ou case-insensitive
  if (cleanId) {
    const byId = room.players.find(p => p.id === cleanId || p.id.toLowerCase() === cleanId.toLowerCase());
    if (byId) return byId;
  }

  // 2. Busca por nome idêntico (não-bot)
  if (cleanName) {
    const byName = room.players.find(p => !p.isBot && p.name.trim().toLowerCase() === cleanName);
    if (byName) return byName;
  }

  // 3. Busca por correspondência parcial de nome
  if (cleanName && cleanName.length >= 2) {
    const byPartialName = room.players.find(p => !p.isBot && (
      p.name.trim().toLowerCase().startsWith(cleanName) ||
      cleanName.startsWith(p.name.trim().toLowerCase())
    ));
    if (byPartialName) return byPartialName;
  }

  // 4. Se a partida já está em andamento (phase !== 'LOBBY') ou se o jogador está reconectando:
  if (room.phase !== 'LOBBY') {
    // 4.1 Identifica humanos desconectados ou sem socket ativo
    const disconnectedHumans = room.players.filter(p => {
      if (p.isBot) return false;
      if (p.disconnected || !p.socketId) return true;
      if (currentSocketId && p.socketId === currentSocketId) return true;
      if (globalIo) {
        const sock = globalIo.sockets.sockets.get(p.socketId);
        return !sock || !sock.connected;
      }
      return false;
    });

    if (disconnectedHumans.length > 0) {
      if (cleanName) {
        const matched = disconnectedHumans.find(p =>
          p.name.trim().toLowerCase().includes(cleanName) ||
          cleanName.includes(p.name.trim().toLowerCase())
        );
        if (matched) return matched;
      }
      return disconnectedHumans[0];
    }

    // 4.2 Se a sala só tem 1 jogador humano no total (jogo de 1 jogador com bots):
    const allHumans = room.players.filter(p => !p.isBot);
    if (allHumans.length === 1) {
      return allHumans[0];
    }
  }

  return undefined;
}

// Função para gerar código único de 5 caracteres alfanuméricos em caixa alta (ex: X7B2K)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Broadcast de estado da sala para clientes Socket.IO e SSE
function broadcastRoom(room: Room) {
  // 1. Enviar para cada jogador conectado individualmente com seu `self` e `soldiersList` seguros
  if (globalIo) {
    const knownSockets = new Set<string>();
    for (const player of room.players) {
      if (player.socketId) {
        knownSockets.add(player.socketId);
        const clientSocket = globalIo.sockets.sockets.get(player.socketId);
        if (clientSocket) {
          clientSocket.emit('room-update', sanitizeRoomForClients(room, player.id));
        }
      }
    }

    // Para qualquer outro socket na sala (ex: recém-conectado antes de join)
    const socketsInRoom = globalIo.sockets.adapter.rooms.get(room.code);
    if (socketsInRoom) {
      for (const socketId of socketsInRoom) {
        if (!knownSockets.has(socketId)) {
          const s = globalIo.sockets.sockets.get(socketId);
          if (s) {
            s.emit('room-update', sanitizeRoomForClients(room));
          }
        }
      }
    }
  }

  // 2. Enviar para conexões SSE (fallback) com personalização pelo playerId do cliente
  for (const client of room.sseClients) {
    try {
      client.res.write(`data: ${JSON.stringify(sanitizeRoomForClients(room, client.playerId))}\n\n`);
    } catch {
      // client desconectado
    }
  }
}

// Sanitização de dados para que papéis ocultos não vazem
function sanitizeRoomForClients(room: Room, forPlayerId?: string) {
  const self = forPlayerId ? room.players.find(p => p.id === forPlayerId) : undefined;
  const soldiersList = (self && self.team === 'SOLDADOS')
    ? room.players.filter(p => p.team === 'SOLDADOS' && p.isAlive).map(p => ({ id: p.id, name: p.name }))
    : undefined;

  return {
    code: room.code,
    hostId: room.hostId,
    phase: room.phase,
    dayNumber: room.dayNumber,
    phaseTimeRemaining: room.phaseTimeRemaining,
    winner: room.winner,
    config: room.config,
    self,
    soldiersList,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      color: p.color,
      avatar: p.avatar,
      isAlive: p.isAlive,
      isHost: p.isHost,
      isBot: p.isBot,
      prayersReceived: p.prayersReceived,
      converted: p.converted,
      hasActedTonight: p.hasActedTonight,
      hasConfirmedRole: p.hasConfirmedRole,
      hasApprovedPhase: p.hasApprovedPhase,
      disconnected: Boolean(p.disconnected),
      voteTargetId: room.phase === 'DAY_RESULT' || room.phase === 'GAME_OVER' ? p.voteTargetId : (p.voteTargetId ? 'VOTED' : null),
      role: room.phase === 'GAME_OVER' || (!p.isAlive && room.config.revealRolesOnDeath) ? p.role : undefined,
      team: room.phase === 'GAME_OVER' ? p.team : undefined,
      modifier: room.phase === 'GAME_OVER' || (!p.isAlive && room.config.revealRolesOnDeath) ? p.modifier : undefined,
    })),
    messages:
      self && !self.isAlive
        ? room.messages.filter(
            m =>
              m.text?.startsWith('__SHEEP__:') ||
              m.text?.startsWith('__PROF__:') ||
              m.text?.startsWith('__PROFILE__:') ||
              m.text === '__REQUEST_PROFILES__'
          )
        : room.messages,
    logs: room.logs,
  };
}

const BOT_NAMES = ['Gabriel', 'Mateus', 'Rebeca', 'Davi', 'Sara', 'Lucas', 'Ester', 'Samuel', 'Isaque', 'Raquel', 'Noé', 'Miriam'];

const OFFICIAL_COLOR_PALETTE = [
  '#F59E0B',
  '#EF4444',
  '#3B82F6',
  '#10B981',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#1F2937',
];

function resolveRoomPlayerColor(room: Room, desiredColor: string | undefined, excludePlayerId?: string): string {
  const takenColors = room.players
    .filter(p => p.id !== excludePlayerId && p.color)
    .map(p => (p.color || '').trim().toUpperCase());

  const usageCount = new Map<string, number>();
  OFFICIAL_COLOR_PALETTE.forEach(hex => usageCount.set(hex, 0));

  for (const c of takenColors) {
    if (usageCount.has(c)) {
      usageCount.set(c, (usageCount.get(c) || 0) + 1);
    }
  }

  const unusedColors = OFFICIAL_COLOR_PALETTE.filter(hex => (usageCount.get(hex) || 0) === 0);
  const normDesired = (desiredColor || '').trim().toUpperCase();

  if (normDesired && OFFICIAL_COLOR_PALETTE.includes(normDesired)) {
    const count = usageCount.get(normDesired) || 0;
    if (count === 0) return normDesired;
    // As cores só podem repetir se o número de jogadores for maior que o de cores (todas as cores ocupadas)
    if (unusedColors.length === 0) return normDesired;
  }

  let pool = unusedColors;
  if (pool.length === 0) {
    const minUsage = Math.min(...Array.from(usageCount.values()));
    pool = OFFICIAL_COLOR_PALETTE.filter(hex => (usageCount.get(hex) || 0) === minUsage);
  }

  const randomIndex = Math.floor(Math.random() * pool.length);
  return pool[randomIndex] || OFFICIAL_COLOR_PALETTE[0];
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Criação do HTTP Server para encapsular Express e Socket.IO
  const httpServer = http.createServer(app);
  const io = new SocketIOServer(httpServer, {
    cors: { origin: '*' },
  });
  globalIo = io;

  // CORS Middleware para rotas HTTP (permite que frontend no GitHub Pages acesse o backend)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  app.use(express.json({ limit: '5mb' }));

  // Endpoint de verificação de status do servidor
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', server: 'Infiltrado na Fé Engine', timestamp: Date.now() });
  });

  // ==========================================================================
  // EVENTOS DO SOCKET.IO (GERENCIAMENTO DE SALAS E LOBBY EM TEMPO REAL)
  // ==========================================================================
  io.on('connection', (socket: Socket) => {
    // A) Criar Nova Sala (create-room)
    socket.on('create-room', (data: { hostName?: string; color?: string; avatar?: string }, callback?: (res: any) => void) => {
      const hostName = (data?.hostName || '').trim();
      if (!hostName) {
        const err = { error: 'Por favor, escolha seu nome de jogador antes de criar a sala.' };
        socket.emit('error', err);
        if (callback) callback({ success: false, ...err });
        return;
      }

      let code = generateRoomCode();
      while (rooms.has(code)) {
        code = generateRoomCode();
      }

      const hostId = 'p_' + socket.id.substring(0, 7);
      const hostPlayer: Player = {
        id: hostId,
        socketId: socket.id,
        name: hostName,
        color: data?.color || '#F59E0B',
        avatar: data?.avatar || undefined,
        role: 'OVELHA',
        team: 'OVELHAS',
        isAlive: true,
        isHost: true,
        isBot: false,
        prayersReceived: 0,
        converted: false,
        hasActedTonight: false,
        voteTargetId: null,
        nightActionTargetId: null,
        modifier: null,
        investigationCount: 0,
        hasConfirmedRole: false,
        hasApprovedPhase: false,
      };

      const newRoom: Room = {
        code,
        hostId,
        phase: 'LOBBY',
        dayNumber: 0,
        phaseTimeRemaining: 0,
        players: [hostPlayer],
        successfulConversionsCount: 0,
        messages: [
          {
            id: 'sys_' + Date.now(),
            senderId: 'SYSTEM',
            senderName: 'Vila',
            text: `Sala [${code}] criada com sucesso! Convide outros irmãos com este código.`,
            timestamp: Date.now(),
            channel: 'PUBLIC',
          },
        ],
        logs: [
          {
            id: 'log_' + Date.now(),
            phase: 'LOBBY',
            dayNumber: 0,
            text: `Sala aberta pelo anfitrião ${hostPlayer.name}.`,
            timestamp: Date.now(),
            type: 'INFO',
          },
        ],
        winner: null,
        config: {
          revealRolesOnDeath: true,
          pastorCanSelfProtect: false,
          discussionTimeSeconds: 120,
          votingTimeSeconds: 60,
          nightTimeSeconds: 60,
          modifiersConfig: {
            falsoProfeta: true,
            espiao: true,
            anjo: true,
          },
        },
        sseClients: [],
      };

      rooms.set(code, newRoom);
      socket.join(code);

      const payload = {
        success: true,
        roomCode: code,
        playerId: hostId,
        room: sanitizeRoomForClients(newRoom, hostId),
      };

      socket.emit('room-created', payload);
      if (callback) callback(payload);
    });

    // B) Entrar em Sala Existente (join-room)
    socket.on('join-room', (data: { roomCode: string; playerName?: string; playerId?: string; color?: string; avatar?: string }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const playerName = (data?.playerName || '').trim();

      if (!playerName && !data?.playerId) {
        const err = { error: 'Por favor, escolha seu nome de jogador antes de entrar na sala.' };
        socket.emit('join-error', err);
        if (callback) callback({ success: false, ...err });
        return;
      }

      const room = rooms.get(code);

      if (!room) {
        const err = { error: 'Sala não encontrada. Verifique o código de 5 caracteres.' };
        socket.emit('join-error', err);
        if (callback) callback(err);
        return;
      }

      // Se a sala estiver sem humanos por mais de 5 minutos, fecha automaticamente
      if (checkRoomInactivity(room, code)) {
        const err = { error: 'Esta sala foi encerrada por inatividade (mais de 5 minutos sem jogadores online).' };
        socket.emit('join-error', err);
        if (callback) callback({ success: false, ...err });
        return;
      }

      // Verificar se é reconexão de jogador existente (inteligente e à prova de falhas)
      const existingPlayer = findPlayerForReconnection(room, data?.playerId, playerName, socket.id);

      if (existingPlayer) {
        existingPlayer.socketId = socket.id;
        existingPlayer.disconnected = false;
        if (data?.color || !existingPlayer.color) {
          existingPlayer.color = resolveRoomPlayerColor(room, data?.color || existingPlayer.color, existingPlayer.id);
        }
        if (data?.avatar) existingPlayer.avatar = data.avatar;
        room.emptySince = undefined; // Retomou com jogador humano ativo
        socket.join(code);

        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: 'Vila',
          text: `${existingPlayer.name} reconectou-se ao rebanho!`,
          timestamp: Date.now(),
          channel: 'PUBLIC',
        });

        const payload = {
          success: true,
          reconnected: true,
          roomCode: code,
          playerId: existingPlayer.id,
          room: sanitizeRoomForClients(room, existingPlayer.id),
        };

        socket.emit('room-joined', payload);
        if (callback) callback(payload);
        broadcastRoom(room);
        return;
      }

      if (room.phase !== 'LOBBY') {
        const err = { error: 'A partida nesta sala já está em andamento com outros jogadores.' };
        socket.emit('join-error', err);
        if (callback) callback({ success: false, ...err });
        return;
      }

      if (!playerName) {
        const err = { error: 'Por favor, escolha seu nome de jogador antes de entrar na sala.' };
        socket.emit('join-error', err);
        if (callback) callback({ success: false, ...err });
        return;
      }

      if (room.players.length >= 16) {
        const err = { error: 'A sala atingiu o limite máximo de jogadores (16).' };
        socket.emit('join-error', err);
        if (callback) callback(err);
        return;
      }

      const playerId = 'p_' + socket.id.substring(0, 7);
      const resolvedColor = resolveRoomPlayerColor(room, data?.color, playerId);
      const newPlayer: Player = {
        id: playerId,
        socketId: socket.id,
        name: playerName,
        color: resolvedColor,
        avatar: data?.avatar || undefined,
        role: 'OVELHA',
        team: 'OVELHAS',
        isAlive: true,
        isHost: false,
        isBot: false,
        prayersReceived: 0,
        converted: false,
        hasActedTonight: false,
        voteTargetId: null,
        nightActionTargetId: null,
      };

      room.players.push(newPlayer);
      socket.join(code);

      room.messages.push({
        id: 'sys_' + Date.now(),
        senderId: 'SYSTEM',
        senderName: 'Vila',
        text: `${newPlayer.name} uniu-se à congregação! (${room.players.length} membros)`,
        timestamp: Date.now(),
        channel: 'PUBLIC',
      });

      const payload = {
        success: true,
        roomCode: code,
        playerId,
        room: sanitizeRoomForClients(room, playerId),
      };

      socket.emit('room-joined', payload);
      if (callback) callback(payload);

      // Notificar todos na sala
      broadcastRoom(room);
    });

    // B3) Atualizar Avatar e Cor do Jogador em Tempo Real (update-profile)
    socket.on('update-profile', (data: { roomCode: string; playerId: string; color?: string; avatar?: string }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) {
        if (callback) callback({ success: false, error: 'Sala inexistente.' });
        return;
      }
      const player = room.players.find(p => p.id === data?.playerId);
      if (!player) {
        if (callback) callback({ success: false, error: 'Jogador não encontrado na sala.' });
        return;
      }
      if (data?.color) {
        player.color = resolveRoomPlayerColor(room, data.color, player.id);
      }
      if (data?.avatar) player.avatar = data.avatar;
      broadcastRoom(room);
      if (callback) callback({ success: true, color: player.color });
    });

    // B2) Reconectar na Sala (reconnect-room)
    socket.on('reconnect-room', (data: { roomCode: string; playerId: string }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) {
        const err = { error: 'Sala inexistente.' };
        if (callback) callback({ success: false, ...err });
        return;
      }

      // Se a sala estiver sem humanos por mais de 5 minutos, fecha automaticamente
      if (checkRoomInactivity(room, code)) {
        const err = { error: 'Esta sala foi encerrada por inatividade (mais de 5 minutos sem jogadores online).' };
        if (callback) callback({ success: false, ...err });
        return;
      }

      const player = findPlayerForReconnection(room, data?.playerId, undefined, socket.id);

      if (!player) {
        const err = { error: 'Jogador não encontrado na sala.' };
        if (callback) callback({ success: false, ...err });
        return;
      }

      player.socketId = socket.id;
      player.disconnected = false;
      room.emptySince = undefined; // Retomou com humano ativo
      socket.join(code);

      const sanitized = sanitizeRoomForClients(room, player.id);
      const payload = {
        success: true,
        roomCode: code,
        playerId: player.id,
        room: sanitized,
      };

      socket.emit('room-update', sanitized);
      if (callback) callback(payload);
    });

    // C) Iniciar Partida (start-game) - apenas o criador (host)
    socket.on('start-game', (data: { roomCode: string; playerId: string; customDeck?: Role[]; discussionTimeSeconds?: number; modifiersConfig?: ModifiersConfig }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);

      if (!room) return;
      if (room.hostId !== data.playerId) {
        socket.emit('error', { message: 'Apenas o anfitrião pode iniciar a partida.' });
        return;
      }

      if (room.players.length < 5) {
        socket.emit('error', { message: 'Mínimo de 5 jogadores para iniciar.' });
        return;
      }

      distributeRoles(room, data?.customDeck, data?.modifiersConfig);
      if (data?.discussionTimeSeconds) {
        room.config.discussionTimeSeconds = data.discussionTimeSeconds;
      }
      room.phase = 'ROLE_REVEAL';
      room.dayNumber = 1;
      simulateBotNightActions(room);

      room.logs.push({
        id: 'log_' + Date.now(),
        phase: 'ROLE_REVEAL',
        dayNumber: 1,
        text: 'A partida foi iniciada! Cada irmão deve conferir sua identidade secreta no celular.',
        timestamp: Date.now(),
        type: 'INFO',
      });

      for (const p of room.players) {
        if (p.socketId) {
          const clientSocket = io.sockets.sockets.get(p.socketId);
          if (clientSocket) {
            clientSocket.emit('game-started', sanitizeRoomForClients(room, p.id));
          }
        }
      }
      broadcastRoom(room);
      if (callback) callback({ success: true, room: sanitizeRoomForClients(room, data.playerId) });
    });

    // C2) Confirmar Papel no Celular (ROLE_REVEAL)
    socket.on('confirm-role', (data: { roomCode: string; playerId: string }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room || room.phase !== 'ROLE_REVEAL') return;

      const player = room.players.find(p => p.id === data.playerId);
      if (player) {
        player.hasConfirmedRole = true;
      }

      // Se todos os humanos confirmaram, avançar para a NOITE
      const livingHumans = room.players.filter(p => !p.isBot && p.isAlive);
      if (livingHumans.every(p => p.hasConfirmedRole)) {
        room.phase = 'NIGHT';
        simulateBotNightActions(room);
        room.logs.push({
          id: 'log_' + Date.now(),
          phase: 'NIGHT',
          dayNumber: 1,
          text: 'Todos confirmaram seus papéis! A 1ª Noite caiu sobre a Vila das Ovelhas.',
          timestamp: Date.now(),
          type: 'INFO',
        });
      }

      broadcastRoom(room);
      if (callback) callback({ success: true, phase: room.phase, room: sanitizeRoomForClients(room, data.playerId) });
    });

    // C3) Aprovar / Concluir Fase Atual (ready-phase)
    socket.on('ready-phase', (data: { roomCode: string; playerId: string }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) return;

      const player = room.players.find(p => p.id === data.playerId);
      if (player && player.isAlive) {
        player.hasApprovedPhase = true;
      }

      const livingHumans = room.players.filter(p => !p.isBot && p.isAlive);
      if (livingHumans.length === 0 || livingHumans.every(p => p.hasApprovedPhase)) {
        advanceRoomPhase(room);
      }

      broadcastRoom(room);
      if (callback) callback({ success: true, phase: room.phase, room: sanitizeRoomForClients(room, data.playerId) });
    });

    // C4) Reiniciar Partida pelo Host (reset-game)
    socket.on('reset-game', (data: { roomCode: string; playerId: string }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room || room.hostId !== data.playerId) return;

      room.phase = 'LOBBY';
      room.dayNumber = 0;
      room.winner = null;
      room.successfulConversionsCount = 0;
      room.players.forEach(p => {
        p.isAlive = true;
        p.prayersReceived = 0;
        p.converted = false;
        p.hasActedTonight = false;
        p.voteTargetId = null;
        p.nightActionTargetId = null;
        p.nightActionSecondaryId = null;
        p.lastInspectionResult = null;
        p.modifier = null;
        p.investigationCount = 0;
        p.spyUsed = false;
        p.angelUsed = false;
        p.angelSacrificeTonight = false;
        p.masterDoubleVotesRemaining = 0;
        p.usedDoubleVoteThisRound = false;
        p.lastProtectedId = null;
        p.hasConfirmedRole = false;
        p.hasApprovedPhase = false;
      });

      room.messages.push({
        id: 'sys_' + Date.now(),
        senderId: 'SYSTEM',
        senderName: 'Vila',
        text: 'A partida foi reiniciada pelo anfitrião. Todos retornaram ao Lobby.',
        timestamp: Date.now(),
        channel: 'PUBLIC',
      });

      broadcastRoom(room);
      if (callback) callback({ success: true, room: sanitizeRoomForClients(room, data.playerId) });
    });

    // C5) Adicionar Bots pelo Host (add-bot)
    socket.on('add-bot', (data: { roomCode: string; count?: number }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const count = Number(data?.count) || 1;
      const room = rooms.get(code);
      if (!room || room.phase !== 'LOBBY') {
        if (callback) callback({ success: false, error: 'Não é possível adicionar bots agora.' });
        return;
      }
      if (room.players.length >= 16) {
        if (callback) callback({ success: false, error: 'A sala já atingiu o limite de 16 participantes.' });
        return;
      }
      const currentNames = new Set(room.players.map(p => p.name));
      const availableNames = BOT_NAMES.filter(n => !currentNames.has(n));
      const toAdd = Math.min(count, 16 - room.players.length);
      for (let i = 0; i < toAdd; i++) {
        let botName = availableNames[i];
        if (!botName) {
          const backupNames = ['Calebe', 'Barnabé', 'Ezequiel', 'Josué', 'Débora', 'Lídia', 'Elias', 'Priscila', 'Filemom', 'Timóteo'];
          const availableBackup = backupNames.filter(n => !currentNames.has(n));
          botName = availableBackup[0] || `Irmão ${room.players.length + 1}`;
        }
        currentNames.add(botName);
        const botColor = resolveRoomPlayerColor(room, undefined);
        const botPlayer: Player = {
          id: 'bot_' + Math.random().toString(36).substring(2, 9),
          name: botName,
          color: botColor,
          role: 'OVELHA',
          team: 'OVELHAS',
          isAlive: true,
          isHost: false,
          isBot: true,
          prayersReceived: 0,
          converted: false,
          hasActedTonight: false,
          voteTargetId: null,
          nightActionTargetId: null,
        };
        room.players.push(botPlayer);
      }
      broadcastRoom(room);
      if (callback) callback({ success: true, room: sanitizeRoomForClients(room, room.hostId) });
    });

    // C6) Remover Bot pelo Host (remove-bot)
    socket.on('remove-bot', (data: { roomCode: string }, callback?: (res: any) => void) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room || room.phase !== 'LOBBY') {
        if (callback) callback({ success: false, error: 'Não é possível remover bots agora.' });
        return;
      }
      const botIndex = room.players.map(p => p.isBot).lastIndexOf(true);
      if (botIndex === -1) {
        if (callback) callback({ success: false, error: 'Não há bots para remover.' });
        return;
      }
      room.players.splice(botIndex, 1);
      broadcastRoom(room);
      if (callback) callback({ success: true, room: sanitizeRoomForClients(room, room.hostId) });
    });

    // C7) Evento das Ovelhas no Cercado de Espera (movimento e balido "MEH")
    socket.on('sheep-event', (data: { roomCode: string; playerId: string; type: 'move' | 'baa'; x?: number; y?: number; facing?: 'left' | 'right'; text?: string; timestamp?: number }) => {
      const code = (data?.roomCode || '').toUpperCase().trim();
      if (!code) return;
      const payload = {
        playerId: data.playerId,
        type: data.type,
        x: data.x,
        y: data.y,
        facing: data.facing,
        text: data.text,
        timestamp: data.timestamp || Date.now(),
      };
      socket.to(code).emit('sheep-event', payload);
      const room = rooms.get(code);
      if (room) {
        for (const p of room.players) {
          if (p.socketId && p.socketId !== socket.id) {
            io.to(p.socketId).emit('sheep-event', payload);
          }
        }
      }
    });

    // D) Sair da Sala Voluntariamente (leave-room) vs Desconexão Passiva (disconnect)
    const handleVoluntaryLeave = () => {
      for (const [code, room] of rooms.entries()) {
        const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
        if (playerIndex !== -1) {
          const leavingPlayer = room.players[playerIndex];
          socket.leave(code);

          // Se estiver no LOBBY, remove o jogador da lista
          // Se já estiver em partida, marca apenas como desconectado (mantém status de vida para reconexão)
          if (room.phase === 'LOBBY') {
            room.players.splice(playerIndex, 1);
          } else {
            leavingPlayer.disconnected = true;
            leavingPlayer.socketId = undefined;
          }

          // Se todos os humanos saíram / desconectaram
          const remainingLivingHumans = room.players.filter(p => !p.isBot && !p.disconnected);
          if (remainingLivingHumans.length === 0) {
            if (room.phase === 'LOBBY') {
              rooms.delete(code);
              console.log(`[Socket.IO] Sala ${code} deletada por estar vazia.`);
              return;
            } else if (!room.emptySince) {
              room.emptySince = Date.now();
            }
          }

          // Se o anfitrião saiu da sala, sortear novo anfitrião aleatoriamente
          if (room.hostId === leavingPlayer.id) {
            const availableOnlineHumans = room.players.filter(p => !p.isBot && p.id !== leavingPlayer.id && !p.disconnected);
            let nextHost: Player | undefined;
            if (availableOnlineHumans.length > 0) {
              const randomIndex = Math.floor(Math.random() * availableOnlineHumans.length);
              nextHost = availableOnlineHumans[randomIndex];
            } else {
              const anyHuman = room.players.filter(p => !p.isBot && p.id !== leavingPlayer.id);
              if (anyHuman.length > 0) {
                nextHost = anyHuman[Math.floor(Math.random() * anyHuman.length)];
              }
            }

            if (nextHost) {
              room.hostId = nextHost.id;
              room.players.forEach(p => {
                p.isHost = p.id === nextHost!.id;
              });
              room.messages.push({
                id: 'sys_' + Date.now(),
                senderId: 'SYSTEM',
                senderName: 'Vila',
                text: `${leavingPlayer.name} (Anfitrião) saiu da sala. O irmão ${nextHost.name} foi sorteado aleatoriamente como o novo anfitrião!`,
                timestamp: Date.now(),
                channel: 'PUBLIC',
              });
            }
          }

          room.messages.push({
            id: 'sys_' + Date.now(),
            senderId: 'SYSTEM',
            senderName: 'Vila',
            text: `${leavingPlayer.name} desconectou-se da partida.`,
            timestamp: Date.now(),
            channel: 'PUBLIC',
          });

          broadcastRoom(room);
          break;
        }
      }
    };

    // Desconexão passiva (queda de sinal / fechar aba sem querer)
    // NÃO remove o jogador da partida em andamento para permitir reconexão!
    const handlePassiveDisconnect = () => {
      for (const [code, room] of rooms.entries()) {
        const player = room.players.find(p => p.socketId === socket.id);
        if (player) {
          player.socketId = undefined;
          player.disconnected = true;
          console.log(`[Socket.IO] Jogador ${player.name} desconectou-se temporariamente da sala ${code}.`);

          const remainingLivingHumans = room.players.filter(p => !p.isBot && !p.disconnected);
          if (remainingLivingHumans.length === 0 && !room.emptySince) {
            room.emptySince = Date.now();
          }

          // Notifica os outros membros mas preserva o jogador na sala
          broadcastRoom(room);
          break;
        }
      }
    };

    socket.on('leave-room', handleVoluntaryLeave);
    socket.on('disconnect', handlePassiveDisconnect);
  });

  // ==========================================================================
  // REST API ENDPOINTS (COMPATIBILIDADE INTEGRAL E SUPORTE HÍBRIDO)
  // ==========================================================================

  // Criar sala via REST
  app.post('/api/rooms', (req: Request, res: Response) => {
    const hostName = (req.body.hostName || '').trim();
    if (!hostName) {
      return res.status(400).json({ error: 'Por favor, escolha seu nome de jogador antes de criar a sala.' });
    }

    let code = generateRoomCode();
    while (rooms.has(code)) {
      code = generateRoomCode();
    }

    const hostId = 'p_' + Math.random().toString(36).substring(2, 9);
    const hostPlayer: Player = {
      id: hostId,
      name: hostName,
      color: req.body.color || '#F59E0B',
      avatar: req.body.avatar || undefined,
      role: 'OVELHA',
      team: 'OVELHAS',
      isAlive: true,
      isHost: true,
      isBot: false,
      prayersReceived: 0,
      converted: false,
      hasActedTonight: false,
      voteTargetId: null,
      nightActionTargetId: null,
    };

    const room: Room = {
      code,
      hostId,
      phase: 'LOBBY',
      dayNumber: 0,
      phaseTimeRemaining: 0,
      players: [hostPlayer],
      successfulConversionsCount: 0,
      messages: [
        {
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: 'Vila',
          text: `Sala criada com o código ${code}. Convide amigos com este código de 5 caracteres.`,
          timestamp: Date.now(),
          channel: 'PUBLIC',
        },
      ],
      logs: [
        {
          id: 'log_' + Date.now(),
          phase: 'LOBBY',
          dayNumber: 0,
          text: `Sala de oração aberta pelo anfitrião ${hostPlayer.name}.`,
          timestamp: Date.now(),
          type: 'INFO',
        },
      ],
      winner: null,
      config: {
        revealRolesOnDeath: true,
        pastorCanSelfProtect: false,
        discussionTimeSeconds: 90,
        votingTimeSeconds: 45,
        nightTimeSeconds: 45,
      },
      sseClients: [],
    };

    rooms.set(code, room);

    res.json({
      success: true,
      roomCode: code,
      playerId: hostId,
      room: sanitizeRoomForClients(room, hostId),
    });
  });

  // Entrar em sala via REST
  app.post('/api/rooms/:code/join', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const playerName = (req.body.playerName || '').trim();
    const reqPlayerId = (req.body.playerId || '').trim();

    if (!playerName && !reqPlayerId) {
      return res.status(400).json({ error: 'Por favor, escolha seu nome de jogador antes de entrar na sala.' });
    }

    const room = rooms.get(code);

    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada. Verifique o código.' });
    }

    // Se a sala estiver sem humanos por mais de 5 minutos, fecha automaticamente
    if (checkRoomInactivity(room, code)) {
      return res.status(404).json({ error: 'Esta sala foi encerrada por inatividade (mais de 5 minutos sem jogadores online).' });
    }

    // Tentar reconexão com jogador existente de forma inteligente
    const existingPlayer = findPlayerForReconnection(room, reqPlayerId, playerName);

    if (existingPlayer) {
      existingPlayer.disconnected = false;
      if (req.body.color || !existingPlayer.color) {
        existingPlayer.color = resolveRoomPlayerColor(room, req.body.color || existingPlayer.color, existingPlayer.id);
      }
      if (req.body.avatar) existingPlayer.avatar = req.body.avatar;
      room.emptySince = undefined; // Retomou com humano ativo

      room.messages.push({
        id: 'sys_' + Date.now(),
        senderId: 'SYSTEM',
        senderName: 'Vila',
        text: `${existingPlayer.name} reconectou-se ao rebanho!`,
        timestamp: Date.now(),
        channel: 'PUBLIC',
      });

      broadcastRoom(room);

      return res.json({
        success: true,
        reconnected: true,
        roomCode: code,
        playerId: existingPlayer.id,
        room: sanitizeRoomForClients(room, existingPlayer.id),
      });
    }

    if (room.phase !== 'LOBBY') {
      return res.status(400).json({ error: 'A partida já começou nesta sala e nenhum jogador com esse nome foi encontrado para reconexão.' });
    }

    if (!playerName) {
      return res.status(400).json({ error: 'Por favor, escolha seu nome de jogador antes de entrar na sala.' });
    }

    if (room.players.length >= 16) {
      return res.status(400).json({ error: 'Sala cheia (máximo de 16 jogadores).' });
    }

    const playerId = 'p_' + Math.random().toString(36).substring(2, 9);
    const resolvedColor = resolveRoomPlayerColor(room, req.body.color, playerId);
    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      color: resolvedColor,
      avatar: req.body.avatar || undefined,
      role: 'OVELHA',
      team: 'OVELHAS',
      isAlive: true,
      isHost: false,
      isBot: false,
      prayersReceived: 0,
      converted: false,
      hasActedTonight: false,
      voteTargetId: null,
      nightActionTargetId: null,
    };

    room.players.push(newPlayer);
    room.messages.push({
      id: 'sys_' + Date.now(),
      senderId: 'SYSTEM',
      senderName: 'Vila',
      text: `${newPlayer.name} uniu-se ao rebanho. (${room.players.length} jogadores)`,
      timestamp: Date.now(),
      channel: 'PUBLIC',
    });

    broadcastRoom(room);

    res.json({
      success: true,
      roomCode: code,
      playerId,
      room: sanitizeRoomForClients(room, playerId),
    });
  });

  // Sair voluntariamente da sala via REST
  app.post('/api/rooms/:code/leave', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return res.json({ success: true });
    }

    const leavingPlayer = room.players[playerIndex];

    if (room.phase === 'LOBBY') {
      room.players.splice(playerIndex, 1);
    } else {
      leavingPlayer.disconnected = true;
    }

    // Se o host saiu, migrar para outro online
    if (room.hostId === leavingPlayer.id) {
      const availableOnlineHumans = room.players.filter(p => !p.isBot && p.id !== leavingPlayer.id && !p.disconnected);
      let nextHost: Player | undefined;
      if (availableOnlineHumans.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableOnlineHumans.length);
        nextHost = availableOnlineHumans[randomIndex];
      } else {
        const anyHuman = room.players.filter(p => !p.isBot && p.id !== leavingPlayer.id);
        if (anyHuman.length > 0) {
          nextHost = anyHuman[Math.floor(Math.random() * anyHuman.length)];
        }
      }

      if (nextHost) {
        room.hostId = nextHost.id;
        room.players.forEach(p => {
          p.isHost = p.id === nextHost!.id;
        });
        room.messages.push({
          id: 'sys_' + Date.now(),
          senderId: 'SYSTEM',
          senderName: 'Vila',
          text: `${leavingPlayer.name} (Anfitrião) saiu da sala. O irmão ${nextHost.name} foi sorteado aleatoriamente como o novo anfitrião!`,
          timestamp: Date.now(),
          channel: 'PUBLIC',
        });
      }
    }

    room.messages.push({
      id: 'sys_' + Date.now(),
      senderId: 'SYSTEM',
      senderName: 'Vila',
      text: `${leavingPlayer.name} desconectou-se da partida.`,
      timestamp: Date.now(),
      channel: 'PUBLIC',
    });

    const remainingHumans = room.players.filter(p => !p.isBot && !p.disconnected);
    if (remainingHumans.length === 0) {
      if (room.phase === 'LOBBY') {
        rooms.delete(code);
      } else if (!room.emptySince) {
        room.emptySince = Date.now();
      }
    } else {
      broadcastRoom(room);
    }

    res.json({ success: true });
  });

  // Adicionar bots
  app.post('/api/rooms/:code/add-bot', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const count = Number(req.body?.count) || 1;
    const room = rooms.get(code);

    if (!room || room.phase !== 'LOBBY') {
      return res.status(400).json({ error: 'Não é possível adicionar bots agora.' });
    }

    if (room.players.length >= 16) {
      return res.status(400).json({ error: 'A sala atingiu o limite de 16 participantes.' });
    }

    const currentNames = new Set(room.players.map(p => p.name));
    const availableNames = BOT_NAMES.filter(n => !currentNames.has(n));

    const toAdd = Math.min(count, 16 - room.players.length);
    for (let i = 0; i < toAdd; i++) {
      let botName = availableNames[i];
      if (!botName) {
        const backupNames = ['Calebe', 'Barnabé', 'Ezequiel', 'Josué', 'Débora', 'Lídia', 'Elias', 'Priscila', 'Filemom', 'Timóteo'];
        const availableBackup = backupNames.filter(n => !currentNames.has(n));
        botName = availableBackup[0] || `Irmão ${room.players.length + 1}`;
      }
      currentNames.add(botName);
      const botColor = resolveRoomPlayerColor(room, undefined);
      const botPlayer: Player = {
        id: 'bot_' + Math.random().toString(36).substring(2, 9),
        name: botName,
        color: botColor,
        role: 'OVELHA',
        team: 'OVELHAS',
        isAlive: true,
        isHost: false,
        isBot: true,
        prayersReceived: 0,
        converted: false,
        hasActedTonight: false,
        voteTargetId: null,
        nightActionTargetId: null,
      };
      room.players.push(botPlayer);
    }

    broadcastRoom(room);
    res.json({ success: true, room: sanitizeRoomForClients(room, room.hostId) });
  });

  // Remover último bot
  app.post('/api/rooms/:code/remove-bot', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const room = rooms.get(code);

    if (!room || room.phase !== 'LOBBY') {
      return res.status(400).json({ error: 'Não é possível remover bots agora.' });
    }

    const botIndex = room.players.map(p => p.isBot).lastIndexOf(true);
    if (botIndex === -1) {
      return res.status(400).json({ error: 'Não há bots para remover.' });
    }

    room.players.splice(botIndex, 1);
    broadcastRoom(room);
    res.json({ success: true, room: sanitizeRoomForClients(room, room.hostId) });
  });

  // Obter estado da sala
  app.get('/api/rooms/:code', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const playerId = req.query.playerId as string;
    const room = rooms.get(code);

    if (!room) {
      return res.status(404).json({ error: 'Sala não encontrada' });
    }

    // Se a sala estiver sem humanos por mais de 5 minutos, fecha automaticamente
    if (checkRoomInactivity(room, code)) {
      return res.status(404).json({ error: 'Sala encerrada por inatividade (mais de 5 minutos sem jogadores).' });
    }

    const sanitized = sanitizeRoomForClients(room, playerId);
    res.json(sanitized);
  });

  // Stream SSE
  app.get('/api/rooms/:code/events', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const playerId = req.query.playerId as string;
    const room = rooms.get(code);

    if (!room) {
      return res.status(404).end('Sala inexistente');
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const client = { res, playerId };
    room.sseClients.push(client);

    res.write(`data: ${JSON.stringify(sanitizeRoomForClients(room, playerId))}\n\n`);

    req.on('close', () => {
      room.sseClients = room.sseClients.filter(c => c !== client);
    });
  });

  // Iniciar jogo
  app.post('/api/rooms/:code/start', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId, customDeck, discussionTimeSeconds, modifiersConfig } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });
    if (room.hostId !== playerId) return res.status(403).json({ error: 'Apenas o anfitrião pode iniciar.' });
    if (room.players.length < 5) {
      return res.status(400).json({ error: 'Mínimo de 5 jogadores necessários.' });
    }

    distributeRoles(room, customDeck, modifiersConfig);
    if (discussionTimeSeconds) {
      room.config.discussionTimeSeconds = discussionTimeSeconds;
    }
    room.phase = 'ROLE_REVEAL';
    room.dayNumber = 1;
    room.winner = null;

    room.logs.push({
      id: 'log_' + Date.now(),
      phase: 'ROLE_REVEAL',
      dayNumber: 1,
      text: 'Partida iniciada! Cada irmão deve conferir sua carta e papel secreto em seu celular.',
      timestamp: Date.now(),
      type: 'INFO',
    });

    simulateBotNightActions(room);
    if (globalIo) {
      for (const p of room.players) {
        if (p.socketId) {
          const clientSocket = globalIo.sockets.sockets.get(p.socketId);
          if (clientSocket) {
            clientSocket.emit('game-started', sanitizeRoomForClients(room, p.id));
          }
        }
      }
    }
    broadcastRoom(room);
    res.json({ success: true, room: sanitizeRoomForClients(room, playerId || room.hostId) });
  });

  // Confirmar leitura do papel no celular (ROLE_REVEAL)
  app.post('/api/rooms/:code/confirm-role', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;
    const room = rooms.get(code);

    if (!room || room.phase !== 'ROLE_REVEAL') {
      return res.status(400).json({ error: 'Fase de revelação não está ativa.' });
    }

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.hasConfirmedRole = true;
    }

    const livingHumans = room.players.filter(p => !p.isBot && p.isAlive);
    if (livingHumans.every(p => p.hasConfirmedRole)) {
      room.phase = 'NIGHT';
      simulateBotNightActions(room);
      room.logs.push({
        id: 'log_' + Date.now(),
        phase: 'NIGHT',
        dayNumber: 1,
        text: 'Todos confirmaram seus papéis! A 1ª Noite caiu sobre a Vila das Ovelhas.',
        timestamp: Date.now(),
        type: 'INFO',
      });
    }

    broadcastRoom(room);
    res.json({ success: true, phase: room.phase, room: sanitizeRoomForClients(room, playerId) });
  });

  // Aprovar / Concluir Fase Atual (DAY_ANNOUNCEMENT, DAY_DISCUSSION, DAY_RESULT)
  app.post('/api/rooms/:code/ready-phase', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });

    const player = room.players.find(p => p.id === playerId);
    if (player && player.isAlive) {
      player.hasApprovedPhase = true;
    }

    const livingHumans = room.players.filter(p => !p.isBot && p.isAlive);
    if (livingHumans.length === 0 || livingHumans.every(p => p.hasApprovedPhase)) {
      advanceRoomPhase(room);
    }

    broadcastRoom(room);
    res.json({ success: true, phase: room.phase, room: sanitizeRoomForClients(room, playerId) });
  });

  // Chat
  app.post('/api/rooms/:code/chat', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId, text, channel = 'PUBLIC' } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });
    const player = room.players.find(p => p.id === playerId);
    if (!player) return res.status(403).json({ error: 'Jogador não encontrado' });

    if (channel === 'SOLDIERS' && player.team !== 'SOLDADOS') {
      return res.status(403).json({ error: 'Apenas soldados podem usar este canal.' });
    }

    const trimmedText = (text || '').trim().substring(0, 300);
    const isInternalSync =
      trimmedText.startsWith('__SHEEP__:') ||
      trimmedText.startsWith('__PROF__:') ||
      trimmedText.startsWith('__PROFILE__:') ||
      trimmedText === '__REQUEST_PROFILES__';

    if (!isInternalSync && !player.isAlive) {
      return res.status(403).json({ error: 'Jogadores eliminados não têm mais acesso ao chat da vila.' });
    }

    // Se for mensagem interna de sincronia de ovelha ou perfil, substitui a anterior do mesmo jogador para não inflar o array
    if (trimmedText.startsWith('__SHEEP__:')) {
      room.messages = room.messages.filter(
        m => !(m.senderId === player.id && m.text.startsWith('__SHEEP__:'))
      );
    } else if (trimmedText.startsWith('__PROF__:')) {
      room.messages = room.messages.filter(
        m => !(m.senderId === player.id && m.text.startsWith('__PROF__:'))
      );
    }

    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 6),
      senderId: player.id,
      senderName: player.name,
      senderRole: player.team === 'SOLDADOS' && channel === 'SOLDIERS' ? 'SOLDADO' : undefined,
      text: trimmedText,
      timestamp: Date.now(),
      channel: channel as 'PUBLIC' | 'SOLDIERS',
    };

    room.messages.push(newMsg);
    broadcastRoom(room);
    res.json({ success: true, message: newMsg, room: sanitizeRoomForClients(room, playerId) });
  });

  // Atualizar avatar e cor do jogador
  app.post('/api/rooms/:code/profile', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId, color, avatar } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });
    const player = room.players.find(p => p.id === playerId);
    if (!player) return res.status(404).json({ error: 'Jogador não encontrado' });

    if (color) {
      player.color = resolveRoomPlayerColor(room, color, player.id);
    }
    if (avatar) player.avatar = avatar;

    broadcastRoom(room);
    res.json({ success: true, color: player.color, room: sanitizeRoomForClients(room, playerId) });
  });

  // Evento das Ovelhas no Cercado (fallback HTTP)
  app.post('/api/rooms/:code/sheep-event', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId, type, x, y, facing, text, timestamp } = req.body;
    const room = rooms.get(code);
    if (!room) return res.status(404).json({ error: 'Sala inexistente' });

    const payload = {
      playerId,
      type,
      x,
      y,
      facing,
      text,
      timestamp: timestamp || Date.now(),
    };

    if (globalIo) {
      globalIo.to(code).emit('sheep-event', payload);
      for (const p of room.players) {
        if (p.socketId) {
          globalIo.to(p.socketId).emit('sheep-event', payload);
        }
      }
    }
    res.json({ success: true });
  });

  // Ação noturna
  app.post('/api/rooms/:code/night-action', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId, targetId, secondaryTargetId, angelSacrifice } = req.body;
    const room = rooms.get(code);

    if (!room || room.phase !== 'NIGHT') {
      return res.status(400).json({ error: 'Ações noturnas indisponíveis no momento.' });
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) {
      return res.status(403).json({ error: 'Jogador não autorizado ou eliminado.' });
    }

    // Se o Anjo decidiu se sacrificar nesta noite
    if (player.modifier === 'ANJO' && !player.angelUsed && angelSacrifice) {
      player.angelSacrificeTonight = true;
    }

    if (targetId && targetId !== 'REST' && targetId !== 'ABSTAIN') {
      const target = room.players.find(p => p.id === targetId);
      if (!target || !target.isAlive) {
        return res.status(400).json({ error: 'Alvo inválido ou eliminado.' });
      }

      // Restrição Soldado: Não pode atacar a si mesmo nem companheiros soldados
      if (player.role === 'SOLDADO') {
        if (target.id === player.id) {
          return res.status(400).json({ error: 'O Soldado não pode eliminar a si mesmo.' });
        }
        if (target.team === 'SOLDADOS') {
          return res.status(400).json({ error: 'O Soldado não pode atacar um companheiro soldado.' });
        }
      }

      // Restrição Pastor: Não pode proteger a mesma pessoa em duas noites consecutivas
      if (player.role === 'PASTOR') {
        if (!room.config.pastorCanSelfProtect && target.id === player.id) {
          return res.status(400).json({ error: 'O Pastor não pode proteger a si mesmo.' });
        }
        if (player.lastProtectedId && target.id === player.lastProtectedId) {
          return res.status(400).json({ error: 'O Pastor não pode proteger a mesma pessoa em duas noites consecutivas.' });
        }
      }

      if (player.role === 'APOSTOLO') {
        const target2 = room.players.find(p => p.id === secondaryTargetId);
        if (!target2 || !target2.isAlive || target2.id === target.id) {
          return res.status(400).json({ error: 'O Apóstolo deve escolher dois alvos vivos distintos.' });
        }
        player.nightActionSecondaryId = target2.id;
      }

      player.nightActionTargetId = target.id;
    } else {
      player.nightActionTargetId = null;
    }

    player.hasActedTonight = true;

    checkAndResolveNightIfReady(room);
    broadcastRoom(room);
    res.json({ success: true, room: sanitizeRoomForClients(room, playerId) });
  });

  // Habilidade do Espião (uso único)
  app.post('/api/rooms/:code/spy-action', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId, targetId } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });
    const player = room.players.find(p => p.id === playerId);
    if (!player || player.modifier !== 'ESPIAO') {
      return res.status(400).json({ error: 'Jogador não é espião.' });
    }

    const target = room.players.find(p => p.id === targetId);
    if (!target) return res.status(404).json({ error: 'Alvo não encontrado.' });

    player.spyUsed = true;
    res.json({
      success: true,
      targetRole: target.role,
      targetTeam: target.team,
      targetName: target.name,
    });
  });

  // Votação diurna
  app.post('/api/rooms/:code/vote', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId, targetId, useDoubleVote } = req.body;
    const room = rooms.get(code);

    if (!room || room.phase !== 'DAY_VOTING') {
      return res.status(400).json({ error: 'Fase de votação não está ativa.' });
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isAlive) {
      return res.status(403).json({ error: 'Jogador não autorizado ou eliminado.' });
    }

    // Mestre: Voto duplo secreto (máx 2 vezes por partida)
    if (player.role === 'MESTRE' && useDoubleVote && (player.masterDoubleVotesRemaining || 0) > 0) {
      player.masterDoubleVotesRemaining = (player.masterDoubleVotesRemaining || 0) - 1;
      player.usedDoubleVoteThisRound = true;
    }

    if (targetId && targetId !== 'ABSTAIN') {
      const target = room.players.find(p => p.id === targetId);
      if (!target || !target.isAlive) {
        return res.status(400).json({ error: 'Alvo de voto inválido.' });
      }
      player.voteTargetId = target.id;
    } else {
      player.voteTargetId = 'ABSTAIN';
    }

    checkAndResolveVotesIfReady(room);

    broadcastRoom(room);
    res.json({ success: true, room: sanitizeRoomForClients(room, playerId) });
  });

  // Avançar fase manualmente pelo Host (fallback)
  app.post('/api/rooms/:code/advance-phase', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });
    if (room.hostId !== playerId) return res.status(403).json({ error: 'Apenas o anfitrião pode avançar fases.' });

    advanceRoomPhase(room);
    broadcastRoom(room);
    res.json({ success: true, phase: room.phase, room: sanitizeRoomForClients(room, playerId) });
  });

  // Reiniciar sala pelo Host
  app.post('/api/rooms/:code/reset', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });
    if (room.hostId !== playerId) return res.status(403).json({ error: 'Apenas o anfitrião pode reiniciar.' });

    room.phase = 'LOBBY';
    room.dayNumber = 0;
    room.winner = null;
    room.successfulConversionsCount = 0;
    room.players.forEach(p => {
      p.isAlive = true;
      p.prayersReceived = 0;
      p.converted = false;
      p.hasActedTonight = false;
      p.voteTargetId = null;
      p.nightActionTargetId = null;
      p.nightActionSecondaryId = null;
      p.lastInspectionResult = null;
      p.modifier = null;
      p.investigationCount = 0;
      p.spyUsed = false;
      p.angelUsed = false;
      p.angelSacrificeTonight = false;
      p.masterDoubleVotesRemaining = 0;
      p.usedDoubleVoteThisRound = false;
      p.lastProtectedId = null;
      p.hasConfirmedRole = false;
      p.hasApprovedPhase = false;
    });

    room.messages.push({
      id: 'sys_' + Date.now(),
      senderId: 'SYSTEM',
      senderName: 'Vila',
      text: 'A partida foi reiniciada pelo anfitrião. Todos retornaram ao Lobby.',
      timestamp: Date.now(),
      channel: 'PUBLIC',
    });

    broadcastRoom(room);
    res.json({ success: true, room: sanitizeRoomForClients(room, playerId) });
  });

  // Reiniciar o jogo imediatamente com os mesmos jogadores (novos papéis distribuídos)
  app.post('/api/rooms/:code/restart', (req: Request, res: Response) => {
    const code = req.params.code.toUpperCase();
    const { playerId } = req.body;
    const room = rooms.get(code);

    if (!room) return res.status(404).json({ error: 'Sala inexistente' });
    if (room.hostId !== playerId) return res.status(403).json({ error: 'Apenas o anfitrião pode reiniciar o jogo.' });
    if (room.players.length < 5) {
      return res.status(400).json({ error: 'Mínimo de 5 jogadores necessários para iniciar a partida.' });
    }

    room.players.forEach(p => {
      p.isAlive = true;
      p.prayersReceived = 0;
      p.converted = false;
      p.hasActedTonight = false;
      p.voteTargetId = null;
      p.nightActionTargetId = null;
      p.nightActionSecondaryId = null;
      p.lastInspectionResult = null;
      p.modifier = null;
      p.investigationCount = 0;
      p.spyUsed = false;
      p.angelUsed = false;
      p.angelSacrificeTonight = false;
      p.masterDoubleVotesRemaining = 0;
      p.usedDoubleVoteThisRound = false;
      p.lastProtectedId = null;
      p.hasConfirmedRole = false;
      p.hasApprovedPhase = false;
    });

    distributeRoles(room);
    room.phase = 'ROLE_REVEAL';
    room.dayNumber = 1;
    room.winner = null;
    room.successfulConversionsCount = 0;

    room.logs.push({
      id: 'log_' + Date.now(),
      phase: 'ROLE_REVEAL',
      dayNumber: 1,
      text: 'Partida reiniciada pelo anfitrião! Novos papéis secretos foram distribuídos.',
      timestamp: Date.now(),
      type: 'INFO',
    });

    room.messages.push({
      id: 'sys_' + Date.now(),
      senderId: 'SYSTEM',
      senderName: 'Vila',
      text: 'O anfitrião reiniciou a partida! Todos receberam novas cartas e papéis secretos.',
      timestamp: Date.now(),
      channel: 'PUBLIC',
    });

    simulateBotNightActions(room);
    if (globalIo) {
      for (const p of room.players) {
        if (p.socketId) {
          const clientSocket = globalIo.sockets.sockets.get(p.socketId);
          if (clientSocket) {
            clientSocket.emit('game-started', sanitizeRoomForClients(room, p.id));
          }
        }
      }
    }
    broadcastRoom(room);
    res.json({ success: true, room: sanitizeRoomForClients(room, playerId || room.hostId) });
  });

  // Integração com Vite e Arquivos Estáticos em Produção
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, 'dist');
    const indexPath = path.join(distPath, 'index.html');

    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
    }

    app.get('*', (_req: Request, res: Response) => {
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath, (err) => {
          if (err && !res.headersSent) {
            res.status(500).send('Erro ao carregar aplicação estática.');
          }
        });
      } else {
        // Se dist/index.html não foi gerado no build do backend (ex: Render como backend exclusivo)
        res.status(200).send(`
          <!DOCTYPE html>
          <html lang="pt-BR">
            <head>
              <meta charset="UTF-8" />
              <title>Infiltrados na Fé - Servidor Backend Online</title>
              <style>
                body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
                .card { background: #1e293b; border: 2px solid #eab308; border-radius: 16px; padding: 32px; max-width: 520px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
                h1 { color: #facc15; font-size: 24px; margin-top: 0; }
                p { line-height: 1.6; color: #cbd5e1; font-size: 14px; }
                .badge { display: inline-block; background: #059669; color: white; padding: 6px 14px; border-radius: 9999px; font-weight: bold; font-size: 12px; margin-bottom: 16px; }
                .code { background: #0f172a; padding: 10px 14px; border-radius: 8px; font-family: monospace; font-size: 13px; color: #38bdf8; word-break: break-all; }
              </style>
            </head>
            <body>
              <div class="card">
                <span class="badge">● SERVIDOR ONLINE</span>
                <h1>Infiltrados na Fé - Engine Backend</h1>
                <p>O servidor WebSocket (Socket.IO) e a API REST estão rodando normalmente.</p>
                <div class="code">Healthcheck: /api/health (OK)</div>
                <p style="margin-top: 16px; font-size: 12px; color: #94a3b8;">
                  Se você estiver usando o jogo no GitHub Pages, copie esta URL e insira no botão <strong>Configurar Servidor</strong> no jogo.
                </p>
              </div>
            </body>
          </html>
        `);
      }
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // Inicialização do servidor HTTP com Socket.IO
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`[Infiltrados na Fé] Servidor e Socket.IO ativos na porta ${PORT}`);
  });
}

// ============================================================================
// LÓGICA E ALGORITMOS DE REGRAS
// ============================================================================

function distributeRoles(room: Room, customDeck?: Role[], customModifiersConfig?: ModifiersConfig) {
  const n = room.players.length;
  let roleDeck: Role[] = [];

  if (customDeck && customDeck.length === n) {
    roleDeck = [...customDeck];
  } else {
    let soldierCount = 1;
    if (n >= 7 && n <= 10) soldierCount = 2;
    else if (n >= 11 && n <= 13) soldierCount = 3;
    else if (n >= 14) soldierCount = 4;

    for (let i = 0; i < soldierCount; i++) roleDeck.push('SOLDADO');
    roleDeck.push('PASTOR');
    roleDeck.push('EVANGELISTA');
    roleDeck.push('APOSTOLO');
    roleDeck.push('PROFETA');
    if (n >= 6) roleDeck.push('MESTRE');

    while (roleDeck.length < n) {
      roleDeck.push('OVELHA');
    }
  }

  for (let i = roleDeck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roleDeck[i], roleDeck[j]] = [roleDeck[j], roleDeck[i]];
  }

  room.players.forEach((p, idx) => {
    const assignedRole = roleDeck[idx];
    p.role = assignedRole;
    p.team = assignedRole === 'SOLDADO' ? 'SOLDADOS' : 'OVELHAS';
    p.isAlive = true;
    p.prayersReceived = 0;
    p.converted = false;
    p.hasActedTonight = false;
    p.voteTargetId = null;
    p.nightActionTargetId = null;
    p.nightActionSecondaryId = null;
    p.lastInspectionResult = null;
    p.modifier = null;
    p.investigationCount = 0;
    p.spyUsed = false;
    p.angelUsed = false;
    p.angelSacrificeTonight = false;
    p.masterDoubleVotesRemaining = assignedRole === 'MESTRE' ? 2 : 0;
    p.usedDoubleVoteThisRound = false;
    p.lastProtectedId = null;
    p.hasConfirmedRole = p.isBot;
    p.hasApprovedPhase = p.isBot;
  });

  // Configuração dos modificadores / cards especiais
  const modConf = customModifiersConfig || room.config.modifiersConfig || {
    falsoProfeta: true,
    espiao: true,
    anjo: true,
  };
  room.config.modifiersConfig = modConf;

  // A) Falso Profeta: Sorteado de forma aleatória para 1 jogador pertencente ao time dos Soldados
  if (modConf.falsoProfeta) {
    const soldierPlayers = room.players.filter(p => p.role === 'SOLDADO');
    if (soldierPlayers.length > 0) {
      const chosenSoldier = soldierPlayers[Math.floor(Math.random() * soldierPlayers.length)];
      chosenSoldier.modifier = 'FALSO_PROFETA';
    }
  }

  // B) Modificadores das Ovelhas: Sorteie de forma independente até 2 modificadores especiais
  // exclusivamente entre os jogadores do time das Ovelhas: Espião e Anjo
  // Validação Obrigatória: O modificador "Anjo" e "Espião" NUNCA podem ser atribuídos ao mesmo jogador na mesma partida
  const sheepPlayers = room.players.filter(p => p.team === 'OVELHAS');
  const shuffledSheep = [...sheepPlayers].sort(() => Math.random() - 0.5);

  let sheepIndex = 0;
  if (modConf.espiao && sheepIndex < shuffledSheep.length) {
    shuffledSheep[sheepIndex].modifier = 'ESPIAO';
    sheepIndex++;
  }
  if (modConf.anjo && sheepIndex < shuffledSheep.length) {
    shuffledSheep[sheepIndex].modifier = 'ANJO';
    sheepIndex++;
  }

  room.successfulConversionsCount = 0;
}

function simulateBotNightActions(room: Room) {
  const aliveBots = room.players.filter(p => p.isBot && p.isAlive);
  const alivePlayers = room.players.filter(p => p.isAlive);

  for (const bot of aliveBots) {
    if (bot.role === 'SOLDADO') {
      const nonSoldiers = alivePlayers.filter(p => p.team !== 'SOLDADOS');
      if (nonSoldiers.length > 0) {
        bot.nightActionTargetId = nonSoldiers[Math.floor(Math.random() * nonSoldiers.length)].id;
      } else {
        const others = alivePlayers.filter(p => p.id !== bot.id);
        bot.nightActionTargetId = others.length > 0 ? others[0].id : null;
      }
    } else if (bot.role === 'PASTOR') {
      // Pastor não pode proteger a mesma pessoa em duas noites consecutivas
      const possible = room.config.pastorCanSelfProtect
        ? (bot.lastProtectedId ? alivePlayers.filter(p => p.id !== bot.lastProtectedId) : alivePlayers)
        : alivePlayers.filter(p => p.id !== bot.id && p.id !== bot.lastProtectedId);
      const candidates = possible.length > 0 ? possible : alivePlayers;
      bot.nightActionTargetId = candidates[Math.floor(Math.random() * candidates.length)].id;
    } else if (bot.role === 'EVANGELISTA') {
      const others = alivePlayers.filter(p => p.id !== bot.id);
      if (others.length > 0) {
        bot.nightActionTargetId = others[Math.floor(Math.random() * others.length)].id;
      }
    } else if (bot.role === 'APOSTOLO') {
      const others = alivePlayers.filter(p => p.id !== bot.id);
      if (others.length >= 2) {
        bot.nightActionTargetId = others[0].id;
        bot.nightActionSecondaryId = others[1].id;
      } else if (others.length === 1) {
        bot.nightActionTargetId = others[0].id;
      }
    } else if (bot.role === 'PROFETA') {
      const others = alivePlayers.filter(p => p.id !== bot.id);
      if (others.length > 0) {
        bot.nightActionTargetId = others[Math.floor(Math.random() * others.length)].id;
      }
    }
    // Garante que todo bot marca presença na noite
    bot.hasActedTonight = true;
  }
}

function simulateBotVotes(room: Room) {
  const aliveBots = room.players.filter(p => p.isBot && p.isAlive);
  const alivePlayers = room.players.filter(p => p.isAlive);

  for (const bot of aliveBots) {
    const candidates = alivePlayers.filter(p => p.id !== bot.id);
    if (candidates.length > 0) {
      bot.voteTargetId = candidates[Math.floor(Math.random() * candidates.length)].id;
    } else {
      bot.voteTargetId = 'ABSTAIN';
    }
  }
}

function checkAndResolveNightIfReady(room: Room) {
  const livingPlayers = room.players.filter(p => p.isAlive);
  const allActed = livingPlayers.length > 0 && livingPlayers.every(p => p.hasActedTonight);
  if (allActed) {
    resolveNightActions(room);
  }
}

function checkAndResolveVotesIfReady(room: Room) {
  const livingPlayers = room.players.filter(p => p.isAlive);
  const allVoted = livingPlayers.length > 0 && livingPlayers.every(p => p.voteTargetId !== null);
  if (allVoted) {
    resolveDayVotes(room);
  }
}

function resolveNightActions(room: Room) {
  const pastor = room.players.find(p => p.role === 'PASTOR' && p.isAlive);
  const protectedTargetId = pastor ? pastor.nightActionTargetId : null;
  if (pastor && pastor.nightActionTargetId) {
    pastor.lastProtectedId = pastor.nightActionTargetId;
  }

  // Soldados kill target
  // Regra: Quando os soldados forem dois ou mais cada um seleciona um nome, se forem nomes iguais a pessoa morre. Se não, entre os dois escolhidos será sorteado o que morrerá.
  const soldiers = room.players.filter(p => p.role === 'SOLDADO' && p.isAlive && !p.converted);
  let killTargetId: string | null = null;
  if (soldiers.length > 0) {
    const chosenTargetIds = soldiers
      .map(s => s.nightActionTargetId)
      .filter((id): id is string => Boolean(id) && id !== 'ABSTAIN');

    if (soldiers.length >= 2) {
      if (chosenTargetIds.length > 0) {
        const allSame =
          chosenTargetIds.length === soldiers.length &&
          chosenTargetIds.every(id => id === chosenTargetIds[0]);

        if (allSame) {
          killTargetId = chosenTargetIds[0];
        } else {
          const distinctTargets = Array.from(new Set(chosenTargetIds));
          const randomIndex = Math.floor(Math.random() * distinctTargets.length);
          killTargetId = distinctTargets[randomIndex];
        }
      }
    } else {
      killTargetId = chosenTargetIds[0] || null;
    }
  }

  // Evangelista: Requer orar DUAS vezes no mesmo Soldado para convertê-lo. Limite: 1 conversão por partida.
  const evangelista = room.players.find(p => p.role === 'EVANGELISTA' && p.isAlive);
  if (evangelista && evangelista.nightActionTargetId) {
    const prayedTarget = room.players.find(p => p.id === evangelista.nightActionTargetId);
    if (prayedTarget) {
      prayedTarget.prayersReceived += 1;
      if (
        prayedTarget.role === 'SOLDADO' &&
        prayedTarget.prayersReceived >= 2 &&
        !prayedTarget.converted &&
        room.successfulConversionsCount < 1
      ) {
        prayedTarget.team = 'OVELHAS';
        prayedTarget.converted = true;
        room.successfulConversionsCount += 1;

        room.logs.push({
          id: 'log_' + Date.now(),
          phase: 'NIGHT',
          dayNumber: room.dayNumber,
          text: `✨ Milagre da Fé: As orações converteram ${prayedTarget.name}! Agora ele perdeu a espada e serve como uma Ovelha fiel.`,
          timestamp: Date.now(),
          type: 'CONVERSION',
        });
      }
    }
  }

  // Apóstolo: Compara 2 jogadores
  const apostolo = room.players.find(p => p.role === 'APOSTOLO' && p.isAlive);
  if (apostolo && apostolo.nightActionTargetId && apostolo.nightActionSecondaryId) {
    const t1 = room.players.find(p => p.id === apostolo.nightActionTargetId);
    const t2 = room.players.find(p => p.id === apostolo.nightActionSecondaryId);
    if (t1 && t2) {
      const sameTeam = t1.team === t2.team;
      apostolo.lastInspectionResult = sameTeam
        ? `[Visão do Apóstolo]: ${t1.name} e ${t2.name} pertencem à MESMA EQUIPE.`
        : `[Visão do Apóstolo]: ${t1.name} e ${t2.name} pertencem a EQUIPES DIFERENTES.`;
    }
  }

  // Profeta: Revela APENAS a equipe ("Soldado" ou "Ovelha"). Falso Profeta aparece como Ovelha na 1ª vez.
  const profeta = room.players.find(p => p.role === 'PROFETA' && p.isAlive);
  if (profeta && profeta.nightActionTargetId) {
    const t = room.players.find(p => p.id === profeta.nightActionTargetId);
    if (t) {
      t.investigationCount = (t.investigationCount || 0) + 1;
      let revealedTeam = t.team === 'SOLDADOS' ? 'Soldado' : 'Ovelha';
      if (t.modifier === 'FALSO_PROFETA' && t.investigationCount === 1) {
        revealedTeam = 'Ovelha';
      }
      profeta.lastInspectionResult = `[Visão Profética]: ${t.name} pertence à equipe: ${revealedTeam.toUpperCase()}.`;
    }
  }

  // Verificação de sacrifício do Anjo
  const angel = room.players.find(
    p => p.modifier === 'ANJO' && p.isAlive && p.angelSacrificeTonight && !p.angelUsed
  );

  let victimName: string | null = null;
  if (killTargetId) {
    const targetCandidate = room.players.find(p => p.id === killTargetId);
    const targetName = targetCandidate ? targetCandidate.name : 'O alvo';

    if (killTargetId === protectedTargetId) {
      room.logs.push({
        id: 'log_' + Date.now(),
        phase: 'NIGHT',
        dayNumber: room.dayNumber,
        text: `🛡️ PROTEÇÃO DIVINA: ${targetName} ESTÁ PROTEGIDO! O Pastor abençoou e guardou o alvo contra o ataque dos Soldados!`,
        timestamp: Date.now(),
        type: 'INFO',
      });
    } else if (angel) {
      // O Anjo se sacrifica para salvar o alvo dos Soldados
      angel.angelUsed = true;
      angel.isAlive = false;
      angel.angelSacrificeTonight = false;
      const savedTarget = room.players.find(p => p.id === killTargetId);

      room.logs.push({
        id: 'log_' + Date.now(),
        phase: 'NIGHT',
        dayNumber: room.dayNumber,
        text: `👼 SACRIFÍCIO HEROICO: O Anjo (${angel.name}) deu sua própria vida para salvar ${savedTarget?.name || 'um irmão'} da lâmina dos Soldados! ${targetName} ESTÁ SALVO E PROTEGIDO!`,
        timestamp: Date.now(),
        type: 'DEATH',
      });
    } else {
      const victim = room.players.find(p => p.id === killTargetId);
      if (victim) {
        victim.isAlive = false;
        victimName = victim.name;
        room.logs.push({
          id: 'log_' + Date.now(),
          phase: 'NIGHT',
          dayNumber: room.dayNumber,
          text: `💀 TRAGÉDIA: ${victim.name} FOI ELIMINADO PELOS SOLDADOS DURANTE A NOITE! Sua função permanece oculta em segredo.`,
          timestamp: Date.now(),
          type: 'DEATH',
        });
      }
    }
  } else {
    room.logs.push({
      id: 'log_' + Date.now(),
      phase: 'NIGHT',
      dayNumber: room.dayNumber,
      text: `✨ NOITE PACÍFICA: Nenhum ataque foi efetuado pelos Soldados nesta noite. O rebanho repousou em segurança.`,
      timestamp: Date.now(),
      type: 'INFO',
    });
  }

  const winner = checkGameOver(room);
  if (winner) {
    room.winner = winner;
    room.phase = 'GAME_OVER';
    return;
  }

  room.phase = 'DAY_ANNOUNCEMENT';
  room.messages.push({
    id: 'sys_' + Date.now(),
    senderId: 'SYSTEM',
    senderName: 'Vila',
    text: victimName
      ? `☀️ O sol nasceu. Infelizmente, ${victimName} foi eliminado na calada da noite.`
      : `☀️ O sol nasceu em paz! Nenhum irmão faleceu esta noite.`,
    timestamp: Date.now(),
    channel: 'PUBLIC',
  });

  room.players.forEach(p => {
    p.hasActedTonight = false;
    p.nightActionTargetId = null;
    p.nightActionSecondaryId = null;
    p.hasApprovedPhase = p.isBot;
  });
}

function resolveDayVotes(room: Room) {
  const voteTallies = new Map<string, number>();

  const livingPlayers = room.players.filter(p => p.isAlive);
  for (const voter of livingPlayers) {
    if (!voter.voteTargetId || voter.voteTargetId === 'ABSTAIN') continue;
    // Mestre: Voto duplo apenas se ativado nesta rodada
    const weight = voter.role === 'MESTRE' && voter.usedDoubleVoteThisRound ? 2 : 1;
    voteTallies.set(voter.voteTargetId, (voteTallies.get(voter.voteTargetId) || 0) + weight);
  }

  let topTargetId: string | null = null;
  let maxVotes = 0;
  let isTie = false;

  for (const [targetId, votes] of voteTallies.entries()) {
    if (votes > maxVotes) {
      maxVotes = votes;
      topTargetId = targetId;
      isTie = false;
    } else if (votes === maxVotes) {
      isTie = true;
    }
  }

  let executedPlayerName: string | null = null;
  if (isTie || !topTargetId || maxVotes === 0) {
    room.logs.push({
      id: 'log_' + Date.now(),
      phase: 'DAY_VOTING',
      dayNumber: room.dayNumber,
      text: `⚖️ Votação sem veredito: Empate ou abstenção majoritária. Ninguém foi exilado.`,
      timestamp: Date.now(),
      type: 'VOTE',
    });
  } else {
    const executed = room.players.find(p => p.id === topTargetId);
    if (executed) {
      executed.isAlive = false;
      executedPlayerName = executed.name;
      room.logs.push({
        id: 'log_' + Date.now(),
        phase: 'DAY_VOTING',
        dayNumber: room.dayNumber,
        text: `⚖️ Veredito: ${executed.name} recebeu ${maxVotes} votos e foi exilado da congregação!`,
        timestamp: Date.now(),
        type: 'DEATH',
      });
    }
  }

  room.phase = 'DAY_RESULT';
  room.players.forEach(p => {
    p.hasApprovedPhase = p.isBot;
    p.usedDoubleVoteThisRound = false;
  });

  const winner = checkGameOver(room);
  if (winner) {
    room.winner = winner;
    room.phase = 'GAME_OVER';
  }
}

function checkGameOver(room: Room): Team | null {
  const alivePlayers = room.players.filter(p => p.isAlive);
  const aliveSoldiers = alivePlayers.filter(p => p.team === 'SOLDADOS');
  const aliveSheep = alivePlayers.filter(p => p.team === 'OVELHAS');

  if (aliveSoldiers.length === 0) {
    room.logs.push({
      id: 'log_' + Date.now(),
      phase: 'GAME_OVER',
      dayNumber: room.dayNumber,
      text: `🏆 Vitória das Ovelhas! Todos os infiltrados foram descobertos ou convertidos!`,
      timestamp: Date.now(),
      type: 'INFO',
    });
    return 'OVELHAS';
  }

  if (aliveSoldiers.length >= aliveSheep.length) {
    room.logs.push({
      id: 'log_' + Date.now(),
      phase: 'GAME_OVER',
      dayNumber: room.dayNumber,
      text: `🗡️ Vitória dos Soldados! Os infiltrados dominaram a congregação!`,
      timestamp: Date.now(),
      type: 'INFO',
    });
    return 'SOLDADOS';
  }

  return null;
}

function advanceRoomPhase(room: Room) {
  if (room.phase === 'LOBBY') {
    distributeRoles(room);
    room.phase = 'ROLE_REVEAL';
    room.dayNumber = 1;
    simulateBotNightActions(room);
  } else if (room.phase === 'ROLE_REVEAL') {
    room.phase = 'NIGHT';
    simulateBotNightActions(room);
  } else if (room.phase === 'NIGHT') {
    resolveNightActions(room);
  } else if (room.phase === 'DAY_ANNOUNCEMENT') {
    room.phase = 'DAY_DISCUSSION';
    room.players.forEach(p => {
      p.hasApprovedPhase = p.isBot;
    });
  } else if (room.phase === 'DAY_DISCUSSION') {
    room.phase = 'DAY_VOTING';
    room.players.forEach(p => {
      p.voteTargetId = null;
      p.hasApprovedPhase = p.isBot;
    });
    simulateBotVotes(room);
    checkAndResolveVotesIfReady(room);
  } else if (room.phase === 'DAY_VOTING') {
    resolveDayVotes(room);
  } else if (room.phase === 'DAY_RESULT') {
    room.dayNumber += 1;
    room.phase = 'NIGHT';
    room.players.forEach(p => {
      p.voteTargetId = null;
      p.hasActedTonight = false;
      p.nightActionTargetId = null;
      p.nightActionSecondaryId = null;
      p.hasApprovedPhase = p.isBot;
      p.angelSacrificeTonight = false;
    });
    simulateBotNightActions(room);
  }
}

startServer();
