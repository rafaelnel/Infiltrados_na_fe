/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { PhoneContainer } from './components/PhoneContainer';
import { RoleCardSecret } from './components/RoleCardSecret';
import { LobbyView } from './components/LobbyView';
import { NightActionPanel } from './components/NightActionPanel';
import { DayAnnouncementView } from './components/DayAnnouncementView';
import { VotingPanel } from './components/VotingPanel';
import { GameOverView } from './components/GameOverView';
import { ChatPanel } from './components/ChatPanel';
import { SystemDocumentationModal } from './components/SystemDocumentationModal';
import { LocalPlayersSetupModal, LocalPlayerProfilesMap } from './components/LocalPlayersSetupModal';
import { GameSettingsModal } from './components/GameSettingsModal';
import { BallotBoxReveal } from './components/BallotBoxReveal';
import { AtmosphericTransition, AtmosphericTransitionType } from './components/AtmosphericTransition';
import { FourPointStar, SheepIllustration, RoleIllustration } from './components/RoleIllustrations';
import { SheepCorralWaiting, SheepEventData, SyncedSheepData } from './components/SheepCorralWaiting';
import { PersonAvatar, encodeAvatar, generateRandomCharacterConfig } from './components/PersonAvatar';
import { AvatarCustomizerModal, pickRandomAvailableColor } from './components/AvatarCustomizerModal';
import { sounds } from './utils/audio';
import { Player, Role, Team, Phase, ChatMessage, GameConfig, RoomState, ModifiersConfig } from './types/game';

const DEFAULT_SERVER_URL = 'https://infiltrados-na-fe.onrender.com';
import {
  LocalGameState,
  createInitialLocalGame,
  createLocalGameFromRoster,
  simulateLocalBotsNight,
  resolveLocalNight,
  simulateLocalBotsChatAndVotes,
  resolveLocalDayVotes,
} from './engine/localGameEngine';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users,
  Bot,
  Smartphone,
  BookOpen,
  ArrowRight,
  Shield,
  MessageSquare,
  Sparkles,
  Play,
  RotateCcw,
  UserCheck,
  Lock,
  Moon,
  Scale,
  Sun,
  Eye,
  Clock,
  Pause,
  Timer,
  FastForward,
  Wifi,
  WifiOff,
  RefreshCw,
  Server,
  LogOut,
  X,
  Check,
} from 'lucide-react';

export default function App() {
  // Navigation & Mode
  const [mode, setMode] = useState<'ENTRY' | 'ONLINE' | 'SOLO' | 'PASS_PLAY'>('ENTRY');
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isLocalSetupOpen, setIsLocalSetupOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Online Room State
  const [playerName, setPlayerName] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [roomData, setRoomData] = useState<RoomState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReconnecting, setIsReconnecting] = useState(false);

  // Animação de Urnas Abrindo no DAY_RESULT (dia apurado)
  const [revealedResultDay, setRevealedResultDay] = useState<number | null>(null);

  // Evento das ovelhas no cercado de espera multiplayer
  const [incomingSheepEvent, setIncomingSheepEvent] = useState<SheepEventData | null>(null);
  const [syncedSheepMap, setSyncedSheepMap] = useState<Record<string, SyncedSheepData>>({});
  const syncedSheepRef = useRef<Record<string, SyncedSheepData>>({});
  const lastSheepChatSyncRef = useRef<number>(0);
  const pendingSheepSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [spectatorTab, setSpectatorTab] = useState<'CORRAL' | 'CHAT'>('CORRAL');

  // Modais de Criação e Entrada na Sala Online com Escolha Obrigatória de Nome
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [hostStartVoteConfirm, setHostStartVoteConfirm] = useState(false);
  const [isAdvancingVote, setIsAdvancingVote] = useState(false);
  const isAddingBotRef = useRef(false);
  const [modalName, setModalName] = useState('');
  const [modalCode, setModalCode] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);
  const [isEntryAvatarModalOpen, setIsEntryAvatarModalOpen] = useState(false);
  const [myCustomAvatar, setMyCustomAvatar] = useState<string | undefined>(() => {
    try {
      const savedData = localStorage.getItem('custom_avatar_data') || undefined;
      const savedDrawing = localStorage.getItem('custom_avatar_drawing');
      const savedConfig = localStorage.getItem('custom_avatar_config');
      if (savedData && savedData.startsWith('data:image/') && !savedDrawing && savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed && typeof parsed === 'object' && 'hat' in parsed) {
          const upgraded = encodeAvatar(parsed);
          localStorage.setItem('custom_avatar_data', upgraded);
          return upgraded;
        }
      }
      return savedData;
    } catch {
      return undefined;
    }
  });
  const [myCustomColor, setMyCustomColor] = useState<string>(() => {
    try {
      return localStorage.getItem('custom_avatar_color') || '#F59E0B';
    } catch {
      return '#F59E0B';
    }
  });

  // Sessão ativa salva para reconexão em caso de fechamento acidental (válida estritamente por 5 minutos)
  const [savedOnlineRoom, setSavedOnlineRoom] = useState<{ code: string; playerId: string; name: string; savedAt: number } | null>(() => {
    try {
      const code = localStorage.getItem('online_room_code');
      const pId = localStorage.getItem('online_player_id');
      const name = localStorage.getItem('online_player_name');
      const savedAtStr = localStorage.getItem('online_room_saved_at');
      const savedAt = savedAtStr ? Number(savedAtStr) : 0;
      // Se não tiver timestamp salvo ou tiver mais de 5 minutos (300.000 ms), expira imediatamente e não exibe o aviso
      if (!savedAt || Date.now() - savedAt >= 5 * 60 * 1000) {
        localStorage.removeItem('online_room_code');
        localStorage.removeItem('online_player_id');
        localStorage.removeItem('online_player_name');
        localStorage.removeItem('online_room_saved_at');
        return null;
      }
      if (code && pId) {
        return { code, playerId: pId, name: name || '', savedAt };
      }
    } catch {}
    return null;
  });

  const clearOnlineSession = () => {
    try {
      localStorage.removeItem('online_room_code');
      localStorage.removeItem('online_player_id');
      localStorage.removeItem('online_player_name');
      localStorage.removeItem('online_room_saved_at');
    } catch {}
    setSavedOnlineRoom(null);
  };

  const saveOnlineSession = (code: string, pId: string, name: string) => {
    try {
      const now = Date.now();
      localStorage.setItem('online_room_code', code);
      localStorage.setItem('online_player_id', pId);
      localStorage.setItem('online_player_name', name);
      localStorage.setItem('online_room_saved_at', now.toString());
      setSavedOnlineRoom({ code, playerId: pId, name, savedAt: now });
    } catch {}
  };

  // URL do Servidor Backend salva permanentemente (https://infiltrados-na-fe.onrender.com)
  const [serverUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('multiplayer_server_url');
      if (saved && saved.trim() && saved.startsWith('http')) {
        return saved.trim();
      }
      localStorage.setItem('multiplayer_server_url', DEFAULT_SERVER_URL);
    } catch {
      // Ignora restrição de localStorage
    }
    return (import.meta.env.VITE_SERVER_URL as string) || DEFAULT_SERVER_URL;
  });

  useEffect(() => {
    try {
      localStorage.setItem('multiplayer_server_url', DEFAULT_SERVER_URL);
    } catch {
      // Ignora restrição de localStorage
    }
  }, []);

  const getApiUrl = (endpoint: string): string => {
    const base = (serverUrl || DEFAULT_SERVER_URL).trim().replace(/\/+$/, '');
    return `${base}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
  };

  const apiFetch = async (endpoint: string, options?: RequestInit) => {
    const url = getApiUrl(endpoint);
    let res: Response;
    try {
      res = await fetch(url, options);
    } catch {
      throw new Error(
        'Falha na conexão com o servidor online. Se o servidor no Render estiver acordando (cold start), aguarde cerca de 30 a 50 segundos e tente novamente.'
      );
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error(
        `O servidor retornou uma resposta inesperada (HTTP ${res.status}). O serviço no Render pode estar iniciando ou reiniciando.`
      );
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Erro do servidor (${res.status})`);
    }
    return data;
  };

  // Sockets & SSE
  const socketRef = useRef<Socket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Refs para manter valores atualizados para handlers e reconexão
  const roomDataRef = useRef<RoomState | null>(null);
  const myPlayerIdRef = useRef<string>('');
  const modeRef = useRef<'ENTRY' | 'ONLINE' | 'SOLO' | 'PASS_PLAY'>('ENTRY');
  const myCustomAvatarRef = useRef<string | undefined>(myCustomAvatar);
  const myCustomColorRef = useRef<string>(myCustomColor);
  const peerProfilesRef = useRef<Record<string, { avatar?: string; color?: string }>>({});

  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);

  useEffect(() => {
    myPlayerIdRef.current = myPlayerId;
  }, [myPlayerId]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    myCustomAvatarRef.current = myCustomAvatar;
  }, [myCustomAvatar]);

  useEffect(() => {
    myCustomColorRef.current = myCustomColor;
  }, [myCustomColor]);

  // Envia o perfil (avatar + cor) para os outros jogadores da sala
  const broadcastMyProfileToRoom = (code: string, pId: string, avatarOverride?: string, colorOverride?: string) => {
    if (!code || !pId) return;
    let currentAvatar = avatarOverride ?? myCustomAvatarRef.current;
    let currentColor = colorOverride ?? myCustomColorRef.current;
    try {
      if (!currentAvatar) currentAvatar = localStorage.getItem('custom_avatar_data') || undefined;
      if (!currentColor) currentColor = localStorage.getItem('custom_avatar_color') || '#F59E0B';
    } catch {}
    if (!currentAvatar && !currentColor) return;

    if (socketRef.current?.connected) {
      socketRef.current.emit('update-profile', {
        roomCode: code,
        playerId: pId,
        avatar: currentAvatar,
        color: currentColor,
      });

      socketRef.current.emit('sheep-event', {
        roomCode: code,
        playerId: pId,
        type: 'move',
        text: `__PROFILE__:${JSON.stringify({ avatar: currentAvatar, color: currentColor })}`,
      });
    }

    // Sincroniza também via canal de broadcast universal da sala para funcionar em qualquer versão do servidor
    const compactAvatar = currentAvatar && currentAvatar.length <= 210 ? currentAvatar : undefined;
    const profPayload = `__PROF__:${JSON.stringify({ c: currentColor, a: compactAvatar })}`;
    if (profPayload.length <= 290) {
      apiFetch(`/api/rooms/${code}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: pId,
          text: profPayload,
          channel: 'PUBLIC',
        }),
      }).catch(() => {});
    }
  };

  // Monitora a expiração rigorosa de 5 minutos e verifica com o servidor se a sala ainda existe
  useEffect(() => {
    if (mode !== 'ENTRY' || !savedOnlineRoom) return;

    const checkExpiration = () => {
      if (!savedOnlineRoom.savedAt || Date.now() - savedOnlineRoom.savedAt >= 5 * 60 * 1000) {
        clearOnlineSession();
      }
    };

    checkExpiration();
    const interval = setInterval(checkExpiration, 2000);

    // Consulta o servidor: se a sala foi encerrada por inatividade (5 min sem pessoas) ou não existe mais, remove o aviso imediatamente
    apiFetch(`/api/rooms/${savedOnlineRoom.code}?playerId=${savedOnlineRoom.playerId}`)
      .then(res => {
        if (!res || res.error) {
          clearOnlineSession();
        }
      })
      .catch(() => {
        // Sala inexistente ou encerrada por inatividade no backend
        clearOnlineSession();
      });

    return () => clearInterval(interval);
  }, [mode, savedOnlineRoom]);

  // Solo mode state
  const [soloGame, setSoloGame] = useState<LocalGameState | null>(null);

  // =========================================================================
  // ESTADOS DO MULTIPLAYER LOCAL (PASSAR O CELULAR COM TODAS AS AÇÕES E VOTOS)
  // =========================================================================
  const [localGame, setLocalGame] = useState<LocalGameState | null>(null);
  const [localSubPhase, setLocalSubPhase] = useState<
    'ROLE_REVEAL' | 'NIGHT_ACTIONS' | 'DAY_ANNOUNCEMENT' | 'DAY_DISCUSSION' | 'DAY_VOTING' | 'DAY_RESULT' | 'GAME_OVER'
  >('ROLE_REVEAL');
  const [passPlayIndex, setPassPlayIndex] = useState(0);

  // Turnos na Noite Local
  const [localNightTurnIndex, setLocalNightTurnIndex] = useState(0);
  const [localNightUnlocked, setLocalNightUnlocked] = useState(false);

  // Turnos na Votação Local
  const [localVoteTurnIndex, setLocalVoteTurnIndex] = useState(0);
  const [localVoteUnlocked, setLocalVoteUnlocked] = useState(false);

  // Timer da Assembleia da Congregação (Padrão 2 minutos = 120s)
  const [discussionSecondsLeft, setDiscussionSecondsLeft] = useState<number>(120);
  const [isDiscussionTimerRunning, setIsDiscussionTimerRunning] = useState<boolean>(true);

  // Timer para o debate online
  const [onlineDiscussionSeconds, setOnlineDiscussionSeconds] = useState<number>(120);

  // Efeito de contagem regressiva da Assembleia da Congregação (Local)
  useEffect(() => {
    if (mode !== 'PASS_PLAY' || localSubPhase !== 'DAY_DISCUSSION') return;
    if (!isDiscussionTimerRunning) return;

    if (discussionSecondsLeft <= 0) {
      sounds.playGavelStrike();
      setLocalSubPhase('DAY_VOTING');
      setLocalVoteTurnIndex(0);
      setLocalVoteUnlocked(false);
      return;
    }

    const timerInterval = setInterval(() => {
      setDiscussionSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerInterval);
          return 0;
        }
        const nextVal = prev - 1;
        // Alerta sonoro quando faltar 30 segundos
        if (nextVal === 30) {
          sounds.playWarningAlert();
        }
        // Toques de relógio nos últimos 10 segundos
        if (nextVal <= 10 && nextVal >= 1) {
          sounds.playClockTick(nextVal <= 3);
        }
        return nextVal;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [mode, localSubPhase, isDiscussionTimerRunning, discussionSecondsLeft]);

  // Efeito de contagem regressiva do debate no Multiplayer Online
  useEffect(() => {
    if (mode === 'ONLINE' && roomData?.phase === 'DAY_DISCUSSION') {
      const totalTime = roomData.config?.discussionTimeSeconds || 120;
      setOnlineDiscussionSeconds(totalTime);

      const interval = setInterval(() => {
        setOnlineDiscussionSeconds(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          const nextVal = prev - 1;
          // Alerta sonoro quando faltar 30 segundos
          if (nextVal === 30) {
            sounds.playWarningAlert();
          }
          // Toques de relógio nos últimos 10 segundos
          if (nextVal <= 10 && nextVal >= 1) {
            sounds.playClockTick(nextVal <= 3);
          }
          return nextVal;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [mode, roomData?.phase, roomData?.config?.discussionTimeSeconds]);

  // Transições e sons ao mudar de fase (Galo cantando no amanhecer, Lobo uivando à noite)
  const prevPhaseRef = useRef<string | null>(null);
  const [phaseTransitionBanner, setPhaseTransitionBanner] = useState<{
    type: 'NIGHT' | 'DAY';
    title: string;
    subtitle: string;
  } | null>(null);
  const [atmosphericTransition, setAtmosphericTransition] = useState<AtmosphericTransitionType>(null);

  // Auto-dismiss dedicado do banner de transição (Garante que nunca trava por re-renders da sala)
  useEffect(() => {
    if (!phaseTransitionBanner) return;
    const timer = setTimeout(() => {
      setPhaseTransitionBanner(null);
    }, 3800);
    return () => clearTimeout(timer);
  }, [phaseTransitionBanner]);

  useEffect(() => {
    const currentPhase =
      mode === 'ONLINE'
        ? roomData?.phase
        : mode === 'SOLO'
        ? soloGame?.phase
        : mode === 'PASS_PLAY'
        ? localSubPhase
        : null;

    if (!currentPhase) {
      prevPhaseRef.current = null;
      setPhaseTransitionBanner(null);
      setAtmosphericTransition(null);
      return;
    }

    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = currentPhase;

    if (prevPhase && prevPhase !== currentPhase) {
      // Verifica se este dispositivo é o ANFITRIÃO (Host)
      const myPlayer = roomData?.self || roomData?.players.find(p => p.id === myPlayerId) || null;
      const isCurrentDeviceHost =
        mode === 'ONLINE'
          ? Boolean(myPlayer?.isHost || (roomData && myPlayerId === roomData.hostId))
          : true; // Em modo local (passar o celular) ou solo, este aparelho é o anfitrião único

      // 1. Mudança para a NOITE (Gradiente de Crepúsculo e Lobo uivando SOMENTE no celular do host)
      if (currentPhase === 'NIGHT' || currentPhase === 'NIGHT_ACTIONS') {
        if (isCurrentDeviceHost) {
          sounds.playWolfHowl();
        }
        setAtmosphericTransition('DUSK');
        setRevealedResultDay(null);
        setPhaseTransitionBanner({
          type: 'NIGHT',
          title: 'A NOITE CAIU SOBRE A VILA',
          subtitle: 'Os lobos uivam na escuridão. Ovelhas recolhem-se ao aprisco.',
        });
      }
      // 2. Mudança para o DIA / Amanhecer (Gradiente de Alvorada e Galo cantando SOMENTE no celular do host)
      else if (currentPhase === 'DAY_ANNOUNCEMENT') {
        if (isCurrentDeviceHost) {
          sounds.playRoosterCrow();
        }
        setAtmosphericTransition('DAWN');
        setPhaseTransitionBanner({
          type: 'DAY',
          title: 'O SOL NASCEU NA VILA',
          subtitle: 'O canto do galo anuncia o amanhecer.',
        });
      }
      // 3. Votação
      else if (currentPhase === 'DAY_VOTING') {
        sounds.playGavelStrike();
        setRevealedResultDay(null);
        setPhaseTransitionBanner(null);
      }
      // 4. Fim de jogo ou retorno ao lobby
      else if (currentPhase === 'GAME_OVER' || currentPhase === 'LOBBY' || currentPhase === 'ROLE_REVEAL') {
        setPhaseTransitionBanner(null);
        setAtmosphericTransition(null);
      }
    }
  }, [mode, roomData?.phase, roomData?.hostId, roomData?.self, roomData?.players, myPlayerId, soloGame?.phase, localSubPhase]);

  // -------------------------------------------------------------
  // RECONNECTION MECHANISM & SOCKET.IO SETUP
  // -------------------------------------------------------------
  useEffect(() => {
    try {
      const socketOptions = {
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
        transports: ['polling', 'websocket'],
      };
      const targetUrl = serverUrl || DEFAULT_SERVER_URL;
      const socket = io(targetUrl, socketOptions);
      socketRef.current = socket;

      const syncCurrentRoom = async () => {
        const code = roomDataRef.current?.code;
        const pId = myPlayerIdRef.current;
        if (code && pId && modeRef.current === 'ONLINE') {
          setIsReconnecting(true);
          try {
            // Re-emitir reconnect no socket
            socket.emit('reconnect-room', { roomCode: code, playerId: pId }, (res: any) => {
              if (res?.success && res.room) {
                setRoomData(prev => mergeRoomUpdate(prev, res.room, pId));
                broadcastMyProfileToRoom(code, pId);
              }
            });
            // Re-fetch via REST para garantir paridade total dos dados
            const full = await apiFetch(`/api/rooms/${code}?playerId=${pId}`);
            setRoomData(prev => mergeRoomUpdate(prev, full, pId));
            broadcastMyProfileToRoom(code, pId);
          } catch (err) {
            console.error('Erro na sincronização de reconexão:', err);
          } finally {
            setIsReconnecting(false);
          }
        }
      };

      socket.on('connect', () => {
        setIsReconnecting(false);
        syncCurrentRoom();
      });

      socket.on('disconnect', () => {
        if (modeRef.current === 'ONLINE') {
          setIsReconnecting(true);
        }
      });

      socket.on('reconnect', () => {
        syncCurrentRoom();
      });

      socket.on('room-update', (updatedRoom: RoomState) => {
        setIsReconnecting(false);
        const prevPhase = roomDataRef.current?.phase;
        const prevPlayerIds = (roomDataRef.current?.players || []).map(p => p.id).join(',');
        const nextPlayerIds = (updatedRoom?.players || []).map(p => p.id).join(',');

        setRoomData(prev => mergeRoomUpdate(prev, updatedRoom, myPlayerIdRef.current));

        // Se a lista de jogadores mudou (ex: novo jogador entrou), transmite nosso perfil para a sala
        if (prevPlayerIds !== nextPlayerIds && updatedRoom?.code && myPlayerIdRef.current) {
          setTimeout(() => {
            if (roomDataRef.current?.code && myPlayerIdRef.current) {
              broadcastMyProfileToRoom(roomDataRef.current.code, myPlayerIdRef.current);
            }
          }, 120);
        }

        if (
          myPlayerIdRef.current &&
          updatedRoom?.code &&
          (!updatedRoom.self ||
            (updatedRoom.phase !== 'LOBBY' && !updatedRoom.self.role) ||
            (prevPhase && prevPhase !== updatedRoom.phase))
        ) {
          fetchRoomDetail(updatedRoom.code, myPlayerIdRef.current);
        }
      });

      socket.on('player-joined', () => {
        if (roomDataRef.current?.code && myPlayerIdRef.current) {
          fetchRoomDetail(roomDataRef.current.code, myPlayerIdRef.current);
          setTimeout(() => {
            if (roomDataRef.current?.code && myPlayerIdRef.current) {
              broadcastMyProfileToRoom(roomDataRef.current.code, myPlayerIdRef.current);
            }
          }, 200);
        }
      });

      socket.on('game-started', (updatedRoom: RoomState) => {
        setRoomData(prev => mergeRoomUpdate(prev, updatedRoom, myPlayerIdRef.current));
        if (
          myPlayerIdRef.current &&
          updatedRoom?.code &&
          (!updatedRoom.self || !updatedRoom.self.role)
        ) {
          fetchRoomDetail(updatedRoom.code, myPlayerIdRef.current);
        }
      });

      socket.on('join-error', (err: any) => {
        setErrorMessage(err.message || 'Erro ao entrar na sala.');
      });

      socket.on('sheep-event', (eventData: SheepEventData) => {
        if (eventData?.text === '__REQUEST_PROFILES__') {
          if (
            roomDataRef.current?.code &&
            myPlayerIdRef.current &&
            eventData.playerId !== myPlayerIdRef.current
          ) {
            broadcastMyProfileToRoom(roomDataRef.current.code, myPlayerIdRef.current);
          }
          return;
        }
        if (eventData?.text && eventData.text.startsWith('__PROFILE__:')) {
          try {
            const payload = JSON.parse(eventData.text.slice('__PROFILE__:'.length));
            if (eventData.playerId && (payload.avatar || payload.color)) {
              peerProfilesRef.current[eventData.playerId] = {
                avatar: payload.avatar || peerProfilesRef.current[eventData.playerId]?.avatar,
                color: payload.color || peerProfilesRef.current[eventData.playerId]?.color,
              };
              setRoomData(prev => {
                if (!prev) return prev;
                return mergeRoomUpdate(prev, prev, myPlayerIdRef.current);
              });
            }
          } catch {}
          return;
        }
        if (eventData?.playerId) {
          const prevSheep = syncedSheepRef.current[eventData.playerId];
          const ts = eventData.timestamp || Date.now();
          syncedSheepRef.current[eventData.playerId] = {
            x: typeof eventData.x === 'number' ? eventData.x : prevSheep?.x ?? 48,
            y: typeof eventData.y === 'number' ? eventData.y : prevSheep?.y ?? 52,
            facing: eventData.facing || prevSheep?.facing || 'right',
            baaText: eventData.type === 'baa' ? eventData.text || 'MEH! 🐑' : prevSheep?.baaText,
            baaTimestamp: eventData.type === 'baa' ? ts : prevSheep?.baaTimestamp,
            updatedAt: ts,
          };
          setSyncedSheepMap({ ...syncedSheepRef.current });
        }
        setIncomingSheepEvent(eventData);
      });

      // Reconexão ao alternar aba ou despertar celular
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible') {
          if (!socket.connected) {
            socket.connect();
          }
          syncCurrentRoom();
        }
      };

      const handleOnline = () => {
        if (!socket.connected) {
          socket.connect();
        }
        syncCurrentRoom();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);

      // Verificação de segurança a cada 5s durante partida online
      const healthInterval = setInterval(() => {
        if (modeRef.current === 'ONLINE' && roomDataRef.current?.code && myPlayerIdRef.current) {
          if (!socket.connected) {
            socket.connect();
          }
        }
      }, 5000);

      return () => {
        clearInterval(healthInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('online', handleOnline);
        socket.disconnect();
      };
    } catch (e) {
      console.warn('Socket.IO init warning', e);
    }
  }, [serverUrl]);

  // -------------------------------------------------------------
  // ONLINE MULTIPLAYER ENGINE
  // -------------------------------------------------------------
  const handleCreateRoom = async (chosenName?: string) => {
    const host = (chosenName || modalName || playerName).trim();
    if (!host) {
      setModalError('Por favor, escolha seu nome de jogador antes de criar a sala.');
      setModalName(playerName);
      setIsCreateRoomModalOpen(true);
      return;
    }
    setPlayerName(host);

    const savedAvatar = myCustomAvatar || localStorage.getItem('custom_avatar_data') || undefined;
    const savedColor = myCustomColor || localStorage.getItem('custom_avatar_color') || '#F59E0B';
    myCustomAvatarRef.current = savedAvatar;
    myCustomColorRef.current = savedColor;

    try {
      setErrorMessage(null);
      setModalError(null);
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('create-room', { hostName: host, color: savedColor, avatar: savedAvatar }, (res: any) => {
          if (res?.success) {
            myPlayerIdRef.current = res.playerId;
            setMyPlayerId(res.playerId);
            setRoomData(prev => mergeRoomUpdate(prev, res.room, res.playerId));
            setMode('ONLINE');
            setRevealedResultDay(null);
            setIsCreateRoomModalOpen(false);
            sounds.playClick();
            saveOnlineSession(res.room.code, res.playerId, host);
            broadcastMyProfileToRoom(res.room.code, res.playerId, savedAvatar, savedColor);
          } else {
            fallbackRestCreate(host);
          }
        });
      } else {
        await fallbackRestCreate(host);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setModalError(err.message);
    }
  };

  const fallbackRestCreate = async (host: string) => {
    const savedAvatar = myCustomAvatar || localStorage.getItem('custom_avatar_data') || undefined;
    const savedColor = myCustomColor || localStorage.getItem('custom_avatar_color') || '#F59E0B';
    myCustomAvatarRef.current = savedAvatar;
    myCustomColorRef.current = savedColor;

    const data = await apiFetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: host, color: savedColor, avatar: savedAvatar }),
    });

    myPlayerIdRef.current = data.playerId;
    setMyPlayerId(data.playerId);
    setRoomData(prev => mergeRoomUpdate(prev, data.room, data.playerId));
    setMode('ONLINE');
    setRevealedResultDay(null);
    setIsCreateRoomModalOpen(false);
    sounds.playClick();
    saveOnlineSession(data.roomCode, data.playerId, host);
    setupSSE(data.roomCode, data.playerId);
    broadcastMyProfileToRoom(data.roomCode, data.playerId, savedAvatar, savedColor);
  };

  const handleJoinRoom = async (chosenCode?: string, chosenName?: string, explicitPlayerId?: string) => {
    const cleanCode = (chosenCode || modalCode || inputRoomCode).trim().toUpperCase();
    if (!cleanCode) {
      setModalError('Informe o código de 5 caracteres da sala.');
      setModalCode(inputRoomCode);
      setIsJoinRoomModalOpen(true);
      return;
    }
    const name = (chosenName || modalName || playerName).trim();
    const storedPlayerId = explicitPlayerId || localStorage.getItem('online_player_id') || undefined;

    if (!name && !storedPlayerId) {
      setModalError('Por favor, escolha seu nome de jogador antes de entrar na sala.');
      setModalCode(cleanCode);
      setModalName(playerName);
      setIsJoinRoomModalOpen(true);
      return;
    }
    if (name) setPlayerName(name);
    setInputRoomCode(cleanCode);

    const savedAvatar = myCustomAvatar || localStorage.getItem('custom_avatar_data') || undefined;
    const savedColor = myCustomColor || localStorage.getItem('custom_avatar_color') || '#F59E0B';
    myCustomAvatarRef.current = savedAvatar;
    myCustomColorRef.current = savedColor;

    try {
      setErrorMessage(null);
      setModalError(null);
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit(
          'join-room',
          { roomCode: cleanCode, playerName: name, playerId: storedPlayerId, color: savedColor, avatar: savedAvatar },
          (res: any) => {
            if (res?.success) {
              myPlayerIdRef.current = res.playerId;
              setMyPlayerId(res.playerId);
              setRoomData(prev => mergeRoomUpdate(prev, res.room, res.playerId));
              setMode('ONLINE');
              setRevealedResultDay(null);
              setIsJoinRoomModalOpen(false);
              sounds.playClick();
              saveOnlineSession(cleanCode, res.playerId, name || res.room?.self?.name || '');
              socketRef.current?.emit('sheep-event', {
                roomCode: cleanCode,
                playerId: res.playerId,
                type: 'move',
                text: '__REQUEST_PROFILES__',
              });
              broadcastMyProfileToRoom(cleanCode, res.playerId, savedAvatar, myCustomColorRef.current);
            } else {
              const msg = res?.error || res?.message || 'Erro ao entrar na sala.';
              if (
                msg.toLowerCase().includes('inatividade') ||
                msg.toLowerCase().includes('não encontrada') ||
                msg.toLowerCase().includes('encerrada') ||
                msg.toLowerCase().includes('inexistente')
              ) {
                clearOnlineSession();
              }
              setErrorMessage(msg);
              setModalError(msg);
            }
          }
        );
      } else {
        const data = await apiFetch(`/api/rooms/${cleanCode}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerName: name,
            playerId: storedPlayerId,
            color: savedColor,
            avatar: savedAvatar,
          }),
        });

        myPlayerIdRef.current = data.playerId;
        setMyPlayerId(data.playerId);
        setRoomData(prev => mergeRoomUpdate(prev, data.room, data.playerId));
        setMode('ONLINE');
        setRevealedResultDay(null);
        setIsJoinRoomModalOpen(false);
        sounds.playClick();
        saveOnlineSession(cleanCode, data.playerId, name || data.room?.self?.name || '');
        setupSSE(data.roomCode, data.playerId);
        socketRef.current?.emit('sheep-event', {
          roomCode: cleanCode,
          playerId: data.playerId,
          type: 'move',
          text: '__REQUEST_PROFILES__',
        });
        broadcastMyProfileToRoom(cleanCode, data.playerId, savedAvatar, myCustomColorRef.current);
      }
    } catch (err: any) {
      const msg = err?.message || 'Erro ao entrar na sala.';
      if (
        msg.toLowerCase().includes('inatividade') ||
        msg.toLowerCase().includes('não encontrada') ||
        msg.toLowerCase().includes('encerrada') ||
        msg.toLowerCase().includes('inexistente') ||
        msg.includes('404')
      ) {
        clearOnlineSession();
      }
      setErrorMessage(msg);
      setModalError(msg);
    }
  };

  const setupSSE = (code: string, pId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const sseUrl = getApiUrl(`/api/rooms/${code}/events?playerId=${pId}`);
    const es = new EventSource(sseUrl);
    es.onmessage = () => {
      fetchRoomDetail(code, pId);
    };
    eventSourceRef.current = es;
    fetchRoomDetail(code, pId);
  };

  const mergeRoomUpdate = (
    prev: RoomState | null,
    updatedRoom: RoomState,
    activePlayerId?: string
  ): RoomState => {
    const pId = activePlayerId || myPlayerIdRef.current || myPlayerId;
    let mySavedAvatar = myCustomAvatarRef.current;
    let mySavedColor = myCustomColorRef.current;
    try {
      if (!mySavedAvatar) mySavedAvatar = localStorage.getItem('custom_avatar_data') || undefined;
      if (!mySavedColor) mySavedColor = localStorage.getItem('custom_avatar_color') || '#F59E0B';
    } catch {}

    // Extrai eventos em tempo real de movimento/balido das ovelhas (__SHEEP__:) e perfis (__PROF__:)
    const rawMessages = updatedRoom.messages || [];
    let sheepChanged = false;
    for (const msg of rawMessages) {
      if (!msg?.text || !msg.senderId) continue;
      if (msg.text.startsWith('__PROF__:')) {
        try {
          const payload = JSON.parse(msg.text.slice('__PROF__:'.length));
          if (payload && (payload.c || payload.a)) {
            peerProfilesRef.current[msg.senderId] = {
              color: payload.c || peerProfilesRef.current[msg.senderId]?.color,
              avatar: payload.a || peerProfilesRef.current[msg.senderId]?.avatar,
            };
          }
        } catch {}
      } else if (msg.text.startsWith('__SHEEP__:')) {
        try {
          const payload = JSON.parse(msg.text.slice('__SHEEP__:'.length));
          if (payload && typeof payload.x === 'number' && typeof payload.y === 'number') {
            const ts = Number(payload.t) || msg.timestamp || Date.now();
            const existing = syncedSheepRef.current[msg.senderId];
            if (!existing || ts > existing.updatedAt) {
              syncedSheepRef.current[msg.senderId] = {
                x: payload.x,
                y: payload.y,
                facing: payload.f === 'left' ? 'left' : 'right',
                baaText: payload.b || existing?.baaText,
                baaTimestamp: payload.b ? ts : existing?.baaTimestamp,
                updatedAt: ts,
              };
              sheepChanged = true;
            }
          }
        } catch {}
      }
    }

    if (sheepChanged) {
      const snapshot = { ...syncedSheepRef.current };
      setTimeout(() => {
        setSyncedSheepMap(snapshot);
      }, 0);
    }

    const visibleMessages = rawMessages.filter(
      msg =>
        msg?.text &&
        !msg.text.startsWith('__SHEEP__:') &&
        !msg.text.startsWith('__PROF__:') &&
        !msg.text.startsWith('__PROFILE__:') &&
        msg.text !== '__REQUEST_PROFILES__'
    );

    const assignedColorsSoFar: string[] = [];

    // Enriquece a lista de jogadores respeitando a ordem de entrada na sala:
    // quem entrou antes tem prioridade na cor; se um jogador entrar com cor já em uso
    // (e ainda houver cores disponíveis na paleta), sorteia uma cor livre aleatória para ele.
    const enrichedPlayers = (updatedRoom.players || []).map(p => {
      const prevPlayer = prev?.players?.find(oldP => oldP.id === p.id);

      if (pId && p.id === pId) {
        const resolved = pickRandomAvailableColor(mySavedColor, assignedColorsSoFar);
        if (resolved.changed) {
          mySavedColor = resolved.color;
          myCustomColorRef.current = resolved.color;
          try {
            localStorage.setItem('custom_avatar_color', resolved.color);
          } catch {}
          setTimeout(() => {
            setMyCustomColor(resolved.color);
            if (updatedRoom.code && pId) {
              broadcastMyProfileToRoom(updatedRoom.code, pId, mySavedAvatar, resolved.color);
            }
          }, 20);
        }
        assignedColorsSoFar.push(mySavedColor);
        return {
          ...p,
          avatar: mySavedAvatar || p.avatar || prevPlayer?.avatar,
          color: mySavedColor,
        };
      }

      const peer = peerProfilesRef.current[p.id];
      const peerAvatar = peer?.avatar || p.avatar || prevPlayer?.avatar;
      const rawPeerColor = peer?.color || p.color || prevPlayer?.color;

      if (peerAvatar || rawPeerColor) {
        peerProfilesRef.current[p.id] = {
          avatar: peerAvatar,
          color: rawPeerColor,
        };
      }

      const resolvedPeer = pickRandomAvailableColor(
        rawPeerColor,
        assignedColorsSoFar,
        p.id || p.name
      );
      assignedColorsSoFar.push(resolvedPeer.color);

      return {
        ...p,
        avatar: peerAvatar,
        color: resolvedPeer.color,
      };
    });

    const enrichedRoom: RoomState = {
      ...updatedRoom,
      players: enrichedPlayers,
      messages: visibleMessages,
    };

    const isTransitionFromLobby = prev?.phase === 'LOBBY' && enrichedRoom.phase !== 'LOBBY';
    const isEnteringRoleReveal =
      prev?.phase !== 'ROLE_REVEAL' && enrichedRoom.phase === 'ROLE_REVEAL';
    const isReturningToLobby = enrichedRoom.phase === 'LOBBY';
    const shouldDiscardStaleRole =
      isTransitionFromLobby || isEnteringRoleReveal || isReturningToLobby;

    const publicPlayerEntry = pId
      ? enrichedPlayers.find(p => p.id === pId)
      : undefined;

    if (enrichedRoom.self && (enrichedRoom.phase === 'LOBBY' || enrichedRoom.self.role)) {
      const mergedSelf = publicPlayerEntry
        ? {
            ...enrichedRoom.self,
            ...publicPlayerEntry,
            role: enrichedRoom.self.role,
            team: enrichedRoom.self.team,
            modifier: enrichedRoom.self.modifier,
            avatar: mySavedAvatar || enrichedRoom.self.avatar || publicPlayerEntry.avatar,
            color: mySavedColor || enrichedRoom.self.color || publicPlayerEntry.color || '#F59E0B',
          }
        : {
            ...enrichedRoom.self,
            avatar: mySavedAvatar || enrichedRoom.self.avatar,
            color: mySavedColor || enrichedRoom.self.color || '#F59E0B',
          };

      return {
        ...enrichedRoom,
        self: mergedSelf,
        soldiersList: enrichedRoom.soldiersList || (shouldDiscardStaleRole ? [] : prev?.soldiersList) || [],
      };
    }

    if (shouldDiscardStaleRole) {
      const fallbackLobbySelf =
        enrichedRoom.phase === 'LOBBY'
          ? enrichedRoom.self || prev?.self || publicPlayerEntry || null
          : null;
      return {
        ...enrichedRoom,
        self: fallbackLobbySelf
          ? {
              ...fallbackLobbySelf,
              avatar: mySavedAvatar || fallbackLobbySelf.avatar,
              color: mySavedColor || fallbackLobbySelf.color || '#F59E0B',
            }
          : null,
        soldiersList: [],
      };
    }

    const mergedPrevSelf =
      prev?.self && prev.self.role
        ? publicPlayerEntry
          ? {
              ...prev.self,
              ...publicPlayerEntry,
              role: prev.self.role,
              team: prev.self.team,
              modifier: prev.self.modifier,
              avatar: mySavedAvatar || publicPlayerEntry.avatar || prev.self.avatar,
              color: mySavedColor || publicPlayerEntry.color || prev.self.color || '#F59E0B',
            }
          : {
              ...prev.self,
              avatar: mySavedAvatar || prev.self.avatar,
              color: mySavedColor || prev.self.color || '#F59E0B',
            }
        : null;

    return {
      ...enrichedRoom,
      self: mergedPrevSelf,
      soldiersList: enrichedRoom.soldiersList || prev?.soldiersList || [],
    };
  };

  const fetchRoomDetail = async (code: string, pId: string) => {
    if (!code || !pId) return null;
    try {
      const full = await apiFetch(`/api/rooms/${code}?playerId=${pId}`);
      if (full) {
        setRoomData(prev => mergeRoomUpdate(prev, full, pId));
      }
      return full;
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  // Garante que fora do LOBBY o papel secreto real (self.role) seja sempre buscado caso ausente
  useEffect(() => {
    if (
      mode === 'ONLINE' &&
      roomData?.code &&
      myPlayerId &&
      roomData.phase !== 'LOBBY' &&
      !roomData.self?.role
    ) {
      fetchRoomDetail(roomData.code, myPlayerId);
    }
  }, [mode, roomData?.code, roomData?.phase, roomData?.self?.role, myPlayerId]);

  const handleOnlineStartGame = async (
    customDeck?: Role[],
    discussionTimeSeconds?: number,
    modifiersConfig?: ModifiersConfig
  ) => {
    if (!roomData) return;
    try {
      const code = roomData.code;
      const payload = {
        roomCode: code,
        playerId: myPlayerId,
        customDeck,
        discussionTimeSeconds,
        modifiersConfig,
      };
      const data = await apiFetch(`/api/rooms/${code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (data?.room?.self?.role) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      } else {
        const full = await fetchRoomDetail(code, myPlayerId);
        if (!full && data?.room) {
          setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
        }
      }
      sounds.playClick();
    } catch (e: any) {
      console.error('Erro ao iniciar jogo online:', e);
      setErrorMessage(e?.message || 'Erro ao iniciar a partida.');
    }
  };

  const handleOnlineConfirmRole = async () => {
    if (!roomData) return;
    try {
      const code = roomData.code;
      const data = await apiFetch(`/api/rooms/${code}/confirm-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
      if (!data?.room?.self?.role) {
        await fetchRoomDetail(code, myPlayerId);
      }
      sounds.playClick();
    } catch (e: any) {
      console.error('Erro ao confirmar papel:', e);
    }
  };

  const handleOnlineReadyPhase = async () => {
    if (!roomData) return;
    try {
      const code = roomData.code;
      const data = await apiFetch(`/api/rooms/${code}/ready-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
      if (!data?.room?.self?.role) {
        await fetchRoomDetail(code, myPlayerId);
      }
      sounds.playClick();
    } catch (e: any) {
      console.error('Erro ao confirmar fase:', e);
    }
  };

  const handleOnlineAddBot = async (count: number) => {
    if (!roomData || isAddingBotRef.current) return;
    isAddingBotRef.current = true;
    try {
      const data = await apiFetch(`/api/rooms/${roomData.code}/add-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
      sounds.playClick();
    } catch (e: any) {
      console.error('Erro ao adicionar bots:', e);
      setErrorMessage(e?.message || 'Erro ao adicionar bots.');
    } finally {
      setTimeout(() => {
        isAddingBotRef.current = false;
      }, 500);
    }
  };

  const handleOnlineRemoveBot = async () => {
    if (!roomData) return;
    try {
      const data = await apiFetch(`/api/rooms/${roomData.code}/remove-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
      sounds.playClick();
    } catch (e: any) {
      console.error('Erro ao remover bot:', e);
      setErrorMessage(e?.message || 'Erro ao remover bot.');
    }
  };

  const handleOnlineNightAction = async (
    targetId: string,
    secondaryTargetId?: string,
    angelSacrifice?: boolean,
    spyData?: { targetId: string; result: string }
  ) => {
    if (!roomData) return;
    try {
      const code = roomData.code;
      if (spyData) {
        await apiFetch(`/api/rooms/${code}/spy-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: myPlayerId, targetId: spyData.targetId }),
        });
      }

      const data = await apiFetch(`/api/rooms/${code}/night-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: myPlayerId,
          targetId,
          secondaryTargetId,
          angelSacrifice: Boolean(angelSacrifice),
        }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
      if (!data?.room?.self?.role) {
        await fetchRoomDetail(code, myPlayerId);
      }
    } catch (e: any) {
      console.error('Erro na ação noturna:', e);
    }
  };

  const handleOnlineVote = async (targetId: string | 'ABSTAIN') => {
    if (!roomData) return;
    try {
      const code = roomData.code;
      const data = await apiFetch(`/api/rooms/${code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId, targetId }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
      if (!data?.room?.self?.role) {
        await fetchRoomDetail(code, myPlayerId);
      }
    } catch (e: any) {
      console.error('Erro ao votar:', e);
    }
  };

  const handleSendSheepEvent = (event: SheepEventData) => {
    const code = roomDataRef.current?.code || roomData?.code;
    const senderId = event.playerId || myPlayerIdRef.current || myPlayerId;
    if (!code || !senderId) return;

    const now = event.timestamp || Date.now();
    const prevMine = syncedSheepRef.current[senderId];
    const targetX = typeof event.x === 'number' ? Math.round(event.x * 10) / 10 : prevMine?.x ?? 48;
    const targetY = typeof event.y === 'number' ? Math.round(event.y * 10) / 10 : prevMine?.y ?? 52;
    const facing = event.facing || prevMine?.facing || 'right';

    syncedSheepRef.current[senderId] = {
      x: targetX,
      y: targetY,
      facing,
      baaText: event.type === 'baa' ? event.text || 'MEH! 🐑' : prevMine?.baaText,
      baaTimestamp: event.type === 'baa' ? now : prevMine?.baaTimestamp,
      updatedAt: now,
    };
    setSyncedSheepMap({ ...syncedSheepRef.current });

    // 1. Emite via Socket.IO direto (para servidores com suporte nativo ao evento sheep-event)
    if (socketRef.current?.connected) {
      socketRef.current.emit('sheep-event', {
        ...event,
        playerId: senderId,
        x: targetX,
        y: targetY,
        facing,
        timestamp: now,
        roomCode: code,
      });
    }

    // 2. Transmite também via broadcast da sala (/chat) para sincronização ao vivo garantida em todos os clientes (inclusive Render)
    const sendRoomSync = () => {
      lastSheepChatSyncRef.current = Date.now();
      const latest = syncedSheepRef.current[senderId];
      if (!latest) return;
      const compactPayload = `__SHEEP__:${JSON.stringify({
        x: latest.x,
        y: latest.y,
        f: latest.facing,
        b: event.type === 'baa' ? event.text || 'MEH! 🐑' : undefined,
        t: latest.updatedAt,
      })}`;

      apiFetch(`/api/rooms/${code}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: senderId,
          text: compactPayload,
          channel: 'PUBLIC',
        }),
      }).catch(() => {});
    };

    if (pendingSheepSyncTimeoutRef.current) {
      clearTimeout(pendingSheepSyncTimeoutRef.current);
      pendingSheepSyncTimeoutRef.current = null;
    }

    const elapsed = Date.now() - lastSheepChatSyncRef.current;
    if (event.type === 'baa' || elapsed >= 90) {
      sendRoomSync();
    } else {
      pendingSheepSyncTimeoutRef.current = setTimeout(sendRoomSync, 90 - elapsed);
    }
  };

  const handleOnlineChat = async (text: string, channel: 'PUBLIC' | 'SOLDIERS') => {
    if (!roomData) return;
    if (roomData.self && !roomData.self.isAlive) return;
    try {
      const data = await apiFetch(`/api/rooms/${roomData.code}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId, text, channel }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
    } catch (e: any) {
      console.error('Erro ao enviar mensagem:', e);
    }
  };

  const handleOnlineUpdateProfile = async (avatar: string, color: string) => {
    const otherColors = (roomData?.players || [])
      .filter(p => p.id !== myPlayerId)
      .map(p => p.color)
      .filter((c): c is string => Boolean(c));
    const resolvedColor = pickRandomAvailableColor(color, otherColors).color;

    myCustomAvatarRef.current = avatar;
    myCustomColorRef.current = resolvedColor;
    setMyCustomAvatar(avatar);
    setMyCustomColor(resolvedColor);
    try {
      localStorage.setItem('custom_avatar_color', resolvedColor);
    } catch {}
    if (!roomData || !myPlayerId) return;

    // Atualização otimista imediata na interface
    setRoomData(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        players: prev.players.map(p =>
          p.id === myPlayerId ? { ...p, avatar, color: resolvedColor } : p
        ),
        self: prev.self ? { ...prev.self, avatar, color: resolvedColor } : prev.self,
      };
    });

    broadcastMyProfileToRoom(roomData.code, myPlayerId, avatar, resolvedColor);

    try {
      const data = await apiFetch(`/api/rooms/${roomData.code}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId, avatar, color: resolvedColor }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
    } catch {
      // Ignora erro caso o servidor remoto não possua a rota /profile (o broadcast via socket já atualizou a sala)
    }
  };

  const handleOnlineAdvancePhase = async () => {
    if (!roomData) return;
    try {
      const code = roomData.code;
      const data = await apiFetch(`/api/rooms/${code}/advance-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
      if (!data?.room?.self?.role) {
        await fetchRoomDetail(code, myPlayerId);
      }
    } catch (e: any) {
      console.error('Erro ao avançar fase:', e);
    }
  };

  const handleOnlineReset = async () => {
    if (!roomData) return;
    try {
      const code = roomData.code;
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('reset-game', { roomCode: code, playerId: myPlayerId });
      }
      const data = await apiFetch(`/api/rooms/${code}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
      if (data?.room) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      }
      await fetchRoomDetail(code, myPlayerId);
    } catch (e: any) {
      console.error('Erro ao resetar sala:', e);
    }
  };

  const handleOnlineRestartGame = async () => {
    if (!roomData) return;
    try {
      const code = roomData.code;
      const data = await apiFetch(`/api/rooms/${code}/restart`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
      if (data?.room?.self?.role) {
        setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
      } else {
        const full = await fetchRoomDetail(code, myPlayerId);
        if (!full && data?.room) {
          setRoomData(prev => mergeRoomUpdate(prev, data.room, myPlayerId));
        }
      }
      sounds.playGavelStrike();
    } catch (e: any) {
      console.error('Erro ao reiniciar partida online:', e);
      setErrorMessage(e?.message || 'Erro ao reiniciar partida.');
    }
  };

  const handleOnlineLeaveRoom = async () => {
    if (!roomData) return;
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('leave-room');
      }
      await apiFetch(`/api/rooms/${roomData.code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      }).catch(() => {});
    } finally {
      try {
        localStorage.removeItem('online_room_code');
        localStorage.removeItem('online_player_id');
        localStorage.removeItem('online_player_name');
        setSavedOnlineRoom(null);
      } catch {}
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setRoomData(null);
      setMode('ENTRY');
      sounds.playClick();
    }
  };

  const handleOnlineVoluntaryDisconnect = async () => {
    if (!roomData) {
      setMode('ENTRY');
      setIsDisconnectModalOpen(false);
      return;
    }
    setIsDisconnecting(true);
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('leave-room');
      }
      await apiFetch(`/api/rooms/${roomData.code}/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      }).catch(() => {});
    } finally {
      // PRESERVA a sessão no localStorage para permitir que o jogador volte à partida em andamento (por até 5 min)!
      const myName = roomData.self?.name || playerName || '';
      saveOnlineSession(roomData.code, myPlayerId || '', myName);

      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      setRoomData(null);
      setMode('ENTRY');
      setIsDisconnectModalOpen(false);
      setIsDisconnecting(false);
      sounds.playClick();
    }
  };

  // -------------------------------------------------------------
  // SOLO VS BOTS ENGINE
  // -------------------------------------------------------------
  const handleStartSolo = (playerDisplayName: string = 'Você') => {
    const game = createInitialLocalGame(playerDisplayName, 7);
    simulateLocalBotsNight(game);
    setSoloGame(game);
    setMode('SOLO');
    sounds.playClick();
  };

  // -------------------------------------------------------------
  // MULTIPLAYER LOCAL (PASSAR O CELULAR) - FLUXO COMPLETO
  // -------------------------------------------------------------
  const handleStartPassAndPlayWithRoster = (
    savedRoster: string[],
    customDeck?: Role[],
    customDiscussionSeconds: number = 120,
    modifiersConfig?: ModifiersConfig,
    playerProfiles?: LocalPlayerProfilesMap
  ) => {
    const game = createLocalGameFromRoster(
      savedRoster,
      customDeck,
      customDiscussionSeconds,
      modifiersConfig,
      playerProfiles
    );
    setLocalGame(game);
    setDiscussionSecondsLeft(customDiscussionSeconds || 120);
    setIsDiscussionTimerRunning(true);
    setLocalSubPhase('ROLE_REVEAL');
    setPassPlayIndex(0);
    setLocalNightTurnIndex(0);
    setLocalNightUnlocked(false);
    setLocalVoteTurnIndex(0);
    setLocalVoteUnlocked(false);
    setIsLocalSetupOpen(false);
    setMode('PASS_PLAY');
    sounds.playClick();
  };

  // Ação noturna de um jogador local
  const handleLocalPlayerNightAction = (
    targetId: string,
    secondaryTargetId?: string,
    angelSacrificeTonight?: boolean,
    spyData?: { targetId: string; result: string }
  ) => {
    if (!localGame) return;
    const living = localGame.players.filter(p => p.isAlive);
    const activePlayer = living[localNightTurnIndex];
    if (!activePlayer) return;

    activePlayer.nightActionTargetId = (targetId === 'ABSTAIN' || !targetId) ? null : targetId;
    activePlayer.nightActionSecondaryId = secondaryTargetId || null;
    activePlayer.hasActedTonight = true;

    if (angelSacrificeTonight) {
      activePlayer.angelSacrificeTonight = true;
    }
    if (spyData) {
      activePlayer.spyUsed = true;
      activePlayer.spyResult = spyData.result;
    }

    // Próximo jogador vivo ou resolução da noite
    if (localNightTurnIndex < living.length - 1) {
      sounds.playClick();
      setLocalNightTurnIndex(prev => prev + 1);
      setLocalNightUnlocked(false); // Tranca a tela imediatamente para o próximo
    } else {
      // Todos os jogadores vivos agiram na noite! Resolve a noite
      const resolved = resolveLocalNight(localGame);
      setLocalGame(resolved);
      if (resolved.phase === 'GAME_OVER') {
        setLocalSubPhase('GAME_OVER');
      } else {
        setLocalSubPhase('DAY_ANNOUNCEMENT');
      }
    }
  };

  // Voto de um jogador local no tribunal com suporte ao voto duplo secreto do Mestre
  const handleLocalPlayerVote = (targetId: string | 'ABSTAIN', useDoubleVote?: boolean) => {
    if (!localGame) return;
    const living = localGame.players.filter(p => p.isAlive);
    const activeVoter = living[localVoteTurnIndex];
    if (!activeVoter) return;

    activeVoter.voteTargetId = targetId;

    if (useDoubleVote && (activeVoter.masterDoubleVotesRemaining ?? 0) > 0) {
      activeVoter.usedDoubleVoteThisRound = true;
      activeVoter.masterDoubleVotesRemaining = Math.max(
        0,
        (activeVoter.masterDoubleVotesRemaining ?? 2) - 1
      );
    }

    if (localVoteTurnIndex < living.length - 1) {
      sounds.playClick();
      setLocalVoteTurnIndex(prev => prev + 1);
      setLocalVoteUnlocked(false); // Tranca a tela imediatamente para o próximo votante
    } else {
      // Todos os jogadores vivos votaram! Resolve a votação
      const resolved = resolveLocalDayVotes(localGame);
      setLocalGame(resolved);
      sounds.playGavelStrike();
      if (resolved.phase === 'GAME_OVER') {
        setLocalSubPhase('GAME_OVER');
      } else {
        setLocalSubPhase('DAY_RESULT');
      }
    }
  };

  // -------------------------------------------------------------
  // RENDER PIPELINE
  // -------------------------------------------------------------
  const renderCurrentView = () => {
    // 1. ENTRY SCREEN
    if (mode === 'ENTRY') {
      return (
        <div className="flex-1 flex flex-col justify-between p-4 sm:p-8 space-y-4 animate-fadeIn select-none">
          <div className="text-center space-y-1">
            <div className="inline-block px-3 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest">
              Dedução Social & Mistério
            </div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black font-sans">
              INFILTRADO NA FÉ
            </h2>
            <p className="text-xs sm:text-sm font-mono font-bold text-neutral-600">
              Vila das Ovelhas vs Soldados Infiltrados
            </p>
          </div>

          {/* Hero Doodle */}
          <div className="flex justify-center items-center py-2">
            <SheepIllustration className="w-40 h-40 sm:w-52 sm:h-52" />
          </div>

          {/* Player Input Form & Modes */}
          <div className="space-y-3 w-full max-w-md mx-auto">
            {/* Banner de Reconexão para caso de fechamento acidental ou desconexão prévia */}
            {savedOnlineRoom && (
              <div className="p-3.5 bg-emerald-50 border-2 border-emerald-600 rounded-2xl space-y-2 animate-fadeIn text-left font-mono shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-emerald-950 font-black text-xs">
                    <Sparkles size={14} className="text-emerald-700" />
                    <span>PARTIDA EM ANDAMENTO DETECTADA!</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                    Sala: {savedOnlineRoom.code}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-900 leading-snug">
                  Você estava jogando na sala <strong>{savedOnlineRoom.code}</strong> como <strong>{savedOnlineRoom.name}</strong>. Deseja retornar ao jogo agora?
                </p>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      clearOnlineSession();
                    }}
                    className="py-1.5 px-3 border border-neutral-400 bg-white rounded-xl text-[10px] font-bold uppercase text-neutral-600 hover:bg-neutral-100"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      handleJoinRoom(savedOnlineRoom.code, savedOnlineRoom.name, savedOnlineRoom.playerId);
                    }}
                    className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                  >
                    <RotateCcw size={13} />
                    <span>VOLTAR À PARTIDA AGORA</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-mono font-bold uppercase text-neutral-600 block">
                Seu Nome de Batismo:
              </label>
              <input
                type="text"
                placeholder="Ex: Rafael"
                value={playerName}
                onChange={e => setPlayerName(e.target.value)}
                maxLength={18}
                className="w-full px-4 py-2.5 border-2 border-black rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {errorMessage && (
              <div className="p-2.5 border-2 border-red-900 bg-red-50 text-red-900 text-xs font-mono rounded-xl font-bold">
                {errorMessage}
              </div>
            )}

            {/* Main Action Buttons */}
            <div className="space-y-2.5 pt-1">
              {/* Local Multiplayer Button */}
              <button
                onClick={() => setIsLocalSetupOpen(true)}
                className="w-full bg-black text-white py-3.5 rounded-full flex items-center justify-center space-x-2 text-xs sm:text-sm font-mono font-black uppercase tracking-widest active:scale-95 transition-transform shadow-md hover:bg-neutral-800"
              >
                <Smartphone size={16} />
                <span>PASSAR O CELULAR (MULTIPLAYER LOCAL)</span>
                <FourPointStar size={12} />
              </button>

              {/* Online Multiplayer */}
              <div className="border-2 border-black/20 rounded-2xl p-3 bg-neutral-50 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase text-neutral-500">
                    Multiplayer Online (Salas)
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-bold">Servidor Conectado</span>
                  </div>
                </div>

                {/* Card de Personalização de Avatar & Cor para Partidas Online */}
                <div className="flex items-center justify-between gap-2 p-2 bg-white border-2 border-black rounded-xl shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <PersonAvatar
                      avatar={myCustomAvatar}
                      color={myCustomColor}
                      seed={playerName || 'Você'}
                      size={36}
                      className="shrink-0"
                    />
                    <div className="text-left min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-black text-black truncate">
                          {playerName || 'Seu Personagem'}
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                          style={{ backgroundColor: myCustomColor }}
                        />
                      </div>
                      <p className="text-[9px] font-mono text-neutral-500 truncate">
                        Desenhe no rosto, escolha acessórios e cor
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        const randomAvatar = encodeAvatar(generateRandomCharacterConfig());
                        const randomColor = pickRandomAvailableColor(undefined, []).color;
                        myCustomAvatarRef.current = randomAvatar;
                        myCustomColorRef.current = randomColor;
                        setMyCustomAvatar(randomAvatar);
                        setMyCustomColor(randomColor);
                        try {
                          localStorage.setItem('custom_avatar_data', randomAvatar);
                          localStorage.setItem('custom_avatar_color', randomColor);
                        } catch {}
                      }}
                      title="Gerar Avatar e Cor Aleatórios"
                      className="px-2 py-1.5 bg-amber-300 hover:bg-amber-400 border-2 border-black text-black rounded-lg text-[10px] font-mono font-black uppercase flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                    >
                      <span>🎲 Aleatório</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sounds.playClick();
                        setIsEntryAvatarModalOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-black text-white rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1 hover:bg-neutral-800 active:scale-95 transition-all cursor-pointer"
                    >
                      <Sparkles size={11} className="text-amber-400" />
                      <span>Personalizar</span>
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setModalName(playerName.trim());
                      setModalError(null);
                      setIsCreateRoomModalOpen(true);
                      sounds.playClick();
                    }}
                    className="flex-1 py-2.5 border-2 border-black bg-white text-black rounded-xl text-xs font-mono font-bold uppercase hover:bg-neutral-100 transition-colors shadow-xs active:scale-95"
                  >
                    Criar Sala
                  </button>
                  <div className="flex-1 flex gap-1.5">
                    <input
                      type="text"
                      placeholder="CÓDIGO"
                      value={inputRoomCode}
                      onChange={e => setInputRoomCode(e.target.value.toUpperCase())}
                      maxLength={5}
                      className="w-24 px-2 py-1.5 border-2 border-black rounded-xl text-xs font-mono uppercase tracking-widest text-center"
                    />
                    <button
                      onClick={() => {
                        setModalCode(inputRoomCode.trim().toUpperCase());
                        setModalName(playerName.trim());
                        setModalError(null);
                        setIsJoinRoomModalOpen(true);
                        sounds.playClick();
                      }}
                      className="px-3 py-1.5 bg-black text-white rounded-xl text-xs font-mono font-bold uppercase hover:bg-neutral-800 transition-colors shadow-xs active:scale-95"
                    >
                      Entrar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Rules Link */}
          <div className="text-center pt-1">
            <button
              onClick={() => setIsManualOpen(true)}
              className="text-xs font-mono font-bold text-black underline hover:text-neutral-600 transition-colors inline-flex items-center gap-1.5"
            >
              <BookOpen size={14} />
              <span>Ver Manual do Sistema, Socket.IO e Código Python</span>
            </button>
          </div>
        </div>
      );
    }

    // 2. MULTIPLAYER LOCAL (PASSAR O CELULAR) - FLUXO COMPLETO COM TRANSIÇÕES E TIMER
    if (mode === 'PASS_PLAY' && localGame) {
      const livingPlayers = localGame.players.filter(p => p.isAlive);

      return (
        <AnimatePresence mode="wait">
          {/* A) Distribuição Secreta de Papéis (Passa por todos os jogadores com slide-in suave) */}
          {localSubPhase === 'ROLE_REVEAL' && (
            <motion.div
              key={`local_reveal_${passPlayIndex}`}
              initial={{ opacity: 0, x: 45, scale: 0.97 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -45, scale: 0.97 }}
              transition={{ type: 'spring', damping: 24, stiffness: 260 }}
              className="flex-1 flex flex-col justify-between"
            >
              <RoleCardSecret
                key={`local_reveal_${localGame.players[passPlayIndex]?.id}_${passPlayIndex}`}
                role={localGame.players[passPlayIndex]?.role}
                playerName={localGame.players[passPlayIndex]?.name}
                avatar={localGame.players[passPlayIndex]?.avatar}
                color={localGame.players[passPlayIndex]?.color}
                modifier={localGame.players[passPlayIndex]?.modifier}
                isCoveredDefault={true}
                nextPlayerName={localGame.players[passPlayIndex + 1]?.name}
                confirmLabel={
                  passPlayIndex < localGame.players.length - 1
                    ? `OCULTAR E PASSAR PARA ${localGame.players[passPlayIndex + 1]?.name.toUpperCase()}`
                    : 'TODOS CONHECEM SEUS PAPÉIS - INICIAR 1ª NOITE'
                }
                onConfirm={() => {
                  if (passPlayIndex < localGame.players.length - 1) {
                    setPassPlayIndex(prev => prev + 1);
                  } else {
                    // Todos conheceram seus papéis. Inicia a fase da noite passando por todos!
                    setLocalSubPhase('NIGHT_ACTIONS');
                    setLocalNightTurnIndex(0);
                    setLocalNightUnlocked(false);
                  }
                }}
              />
            </motion.div>
          )}

          {/* B) Fase da Noite Local (Passa de jogador vivo em jogador vivo com cortina) */}
          {localSubPhase === 'NIGHT_ACTIONS' && (
            <motion.div
              key={`local_night_${localNightTurnIndex}_${localNightUnlocked}`}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              {!localNightUnlocked ? (
                <div className="flex-1 flex flex-col items-center justify-between p-6 sm:p-10 text-center space-y-6 select-none bg-[#0B132B] text-white rounded-2xl">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1C2541] text-indigo-200 border border-indigo-400/40 rounded-full text-xs font-mono uppercase tracking-widest">
                      <Moon size={14} className="text-indigo-300" />
                      <span>Fase da Noite — {localGame.dayNumber}ª Noite</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white font-sans">
                      AÇÃO NOTURNA SECRETA
                    </h2>
                  </div>

                  {/* Big Padlock Icon com visual noturno */}
                  <div className="w-32 h-32 rounded-full border-4 border-indigo-400/60 flex flex-col items-center justify-center bg-[#141E3D] shadow-inner shadow-black/60 my-2">
                    <Lock size={48} className="text-indigo-300" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-indigo-200 mt-1">
                      PRIVADO
                    </span>
                  </div>

                  {/* Recipient Notice */}
                  <div className="space-y-2 w-full max-w-sm">
                    <p className="text-xs font-mono uppercase tracking-widest text-indigo-300 font-bold">
                      Passe o aparelho para:
                    </p>
                    <div
                      className="p-4 border-2 rounded-2xl bg-[#1C2541] shadow-lg flex items-center justify-center gap-3"
                      style={{
                        borderColor: livingPlayers[localNightTurnIndex]?.color || '#818CF8',
                      }}
                    >
                      <PersonAvatar
                        avatar={livingPlayers[localNightTurnIndex]?.avatar}
                        color={livingPlayers[localNightTurnIndex]?.color || '#F59E0B'}
                        seed={livingPlayers[localNightTurnIndex]?.name}
                        size={44}
                        className="border-2 border-white shrink-0"
                      />
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-full border border-white shrink-0"
                            style={{
                              backgroundColor: livingPlayers[localNightTurnIndex]?.color || '#F59E0B',
                            }}
                          />
                          <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white uppercase">
                            {livingPlayers[localNightTurnIndex]?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-slate-300 leading-tight pt-1">
                      🔒 Jogador {localNightTurnIndex + 1} de {livingPlayers.length}. Não olhe para a tela! Apenas <strong>{livingPlayers[localNightTurnIndex]?.name}</strong> deve ver sua ação secreta.
                    </p>
                  </div>

                  {/* Unlock Button */}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setLocalNightUnlocked(true);
                    }}
                    className="w-full max-w-sm bg-white text-[#0B132B] py-4 px-6 rounded-full flex items-center justify-center space-x-2 active:scale-[0.97] transition-transform text-xs sm:text-sm font-black tracking-widest uppercase hover:bg-slate-200 shadow-xl shadow-indigo-950/60"
                  >
                    <Eye size={16} />
                    <span>SOU EU, {livingPlayers[localNightTurnIndex]?.name.toUpperCase()} — ABRIR MINHA AÇÃO</span>
                  </button>
                </div>
              ) : (
                <NightActionPanel
                  key={`local_night_${livingPlayers[localNightTurnIndex]?.id}_${localNightTurnIndex}`}
                  player={livingPlayers[localNightTurnIndex]}
                  allPlayers={localGame.players}
                  canSelfProtectPastor={localGame.config.pastorCanSelfProtect}
                  onPerformAction={(targetId, secondaryTargetId, angelSacrifice, spyData) => {
                    handleLocalPlayerNightAction(
                      targetId,
                      secondaryTargetId,
                      angelSacrifice,
                      spyData
                    );
                  }}
                  isHost={false}
                />
              )}
            </motion.div>
          )}

          {/* C) Amanhecer Público (Todos olham a tela juntos) */}
          {localSubPhase === 'DAY_ANNOUNCEMENT' && (
            <motion.div
              key={`local_announcement_${localGame.dayNumber}`}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              <DayAnnouncementView
                dayNumber={localGame.dayNumber}
                logs={localGame.logs}
                onProceedToDiscussion={() => {
                  const dur = localGame.config.discussionTimeSeconds || 120;
                  setDiscussionSecondsLeft(dur);
                  setIsDiscussionTimerRunning(true);
                  setLocalSubPhase('DAY_DISCUSSION');
                }}
                isHost={true}
              />
            </motion.div>
          )}

          {/* D) Debate Diurno da Assembleia com Timer de 2 minutos (ou configurado) */}
          {localSubPhase === 'DAY_DISCUSSION' && (
            <motion.div
              key={`local_discussion_${localGame.dayNumber}`}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between p-4 sm:p-6 space-y-4 select-none"
            >
              {/* Header */}
              <div className="text-center space-y-1">
                <span className="text-xs font-mono uppercase bg-black text-white px-3 py-1 rounded-full font-bold">
                  {localGame.dayNumber}º Dia — Debate Público da Vila
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase text-black font-sans">
                  ASSEMBLEIA DA CONGREGAÇÃO
                </h2>
                <p className="text-xs sm:text-sm font-mono text-neutral-600 max-w-md mx-auto">
                  Debatam livremente entre todos os irmãos presentes! Apresentem suspeitas, defesas e teorias antes do julgamento.
                </p>
              </div>

              {/* Bloco do Cronômetro de Debate da Assembleia */}
              {(() => {
                const totalDuration = localGame.config.discussionTimeSeconds || 120;
                const minutes = Math.floor(discussionSecondsLeft / 60);
                const seconds = discussionSecondsLeft % 60;
                const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
                const isUrgent = discussionSecondsLeft <= 30;
                const progressPercent = Math.min(100, Math.max(0, (discussionSecondsLeft / totalDuration) * 100));

                return (
                  <div
                    className={`p-4 border-3 rounded-3xl transition-all shadow-md ${
                      isUrgent ? 'border-red-600 bg-red-50/70' : 'border-black bg-neutral-50'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white transition-colors ${
                            isUrgent ? 'bg-red-600 animate-bounce' : 'bg-black'
                          }`}
                        >
                          <Timer size={26} />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-neutral-500 block">
                            TEMPO RESTANTE PARA O DEBATE:
                          </span>
                          <div className="flex items-baseline gap-2">
                            <span
                              className={`text-3xl sm:text-4xl font-mono font-black tracking-tight ${
                                isUrgent ? 'text-red-600 animate-pulse' : 'text-black'
                              }`}
                            >
                              {formattedTime}
                            </span>
                            {isUrgent && (
                              <span className="text-[10px] font-mono font-black uppercase text-red-600 bg-red-100 px-2 py-0.5 rounded-full">
                                ⚠️ FIM IMINENTE!
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Controles do Timer */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            sounds.playClick();
                            setIsDiscussionTimerRunning(prev => !prev);
                          }}
                          className="px-3 py-2 border-2 border-black rounded-xl text-xs font-mono font-bold uppercase flex items-center gap-1.5 hover:bg-neutral-200 transition-colors bg-white shadow-2xs"
                        >
                          {isDiscussionTimerRunning ? (
                            <>
                              <Pause size={14} />
                              <span>Pausar</span>
                            </>
                          ) : (
                            <>
                              <Play size={14} />
                              <span>Retomar</span>
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => {
                            sounds.playClick();
                            setDiscussionSecondsLeft(prev => prev + 30);
                          }}
                          className="px-3 py-2 border-2 border-black rounded-xl text-xs font-mono font-bold uppercase hover:bg-neutral-200 transition-colors bg-white shadow-2xs"
                          title="Adicionar mais 30 segundos"
                        >
                          +30s
                        </button>
                      </div>
                    </div>

                    {/* Barra de Progresso */}
                    <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden border border-black/20 mt-3">
                      <div
                        className={`h-full transition-all duration-1000 ${
                          isUrgent ? 'bg-red-600' : 'bg-black'
                        }`}
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>

                    <p className="text-[10px] font-mono text-neutral-600 text-center mt-2">
                      ⏳ Ao zerar este timer ({Math.floor(totalDuration / 60)} min), a votação começará automaticamente!
                    </p>
                  </div>
                );
              })()}

              {/* Roster de membros presentes */}
              <div className="space-y-2 border-2 border-black rounded-2xl p-4 bg-neutral-50 max-h-52 overflow-y-auto">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-black block">
                  Membros Presentes na Assembleia ({livingPlayers.length} vivos):
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {localGame.players.map(p => (
                    <div
                      key={p.id}
                      className={`p-2 rounded-xl border text-xs font-mono flex items-center justify-between gap-1.5 ${
                        p.isAlive ? 'bg-white border-black font-bold' : 'bg-neutral-200 border-neutral-300 text-neutral-500 line-through'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <PersonAvatar
                          avatar={p.avatar}
                          color={p.color || '#F59E0B'}
                          seed={p.name}
                          size={24}
                          className="border border-black shrink-0"
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                          style={{ backgroundColor: p.color || '#F59E0B' }}
                        />
                        <span className="truncate">{p.name}</span>
                      </div>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                          p.isAlive ? 'bg-black text-white' : 'bg-neutral-300 text-neutral-600'
                        }`}
                      >
                        {p.isAlive ? 'Vivo' : 'Exilado'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Botão de avanço imediato para votação */}
              <button
                onClick={() => {
                  sounds.playGavelStrike();
                  setLocalSubPhase('DAY_VOTING');
                  setLocalVoteTurnIndex(0);
                  setLocalVoteUnlocked(false);
                }}
                className="w-full py-4 bg-black text-white rounded-full flex items-center justify-center space-x-2 text-xs sm:text-sm font-mono font-black uppercase tracking-widest active:scale-95 transition-transform shadow-md hover:bg-neutral-800"
              >
                <Scale size={18} />
                <span>ENCERRAR DEBATE & INICIAR VOTAÇÃO SECRETA</span>
                <FourPointStar size={14} />
              </button>
            </motion.div>
          )}

          {/* E) Votação Diurna Local (Cabine Secreta com Cortina) */}
          {localSubPhase === 'DAY_VOTING' && (
            <motion.div
              key={`local_voting_${localVoteTurnIndex}_${localVoteUnlocked}`}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              {!localVoteUnlocked ? (
                <div className="flex-1 flex flex-col items-center justify-between p-6 sm:p-10 text-center space-y-6 animate-fadeIn select-none">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-xs font-mono uppercase tracking-widest">
                      <Scale size={14} />
                      <span>Julgamento da Vila — Voto Secreto</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black font-sans">
                      CABINE DE VOTAÇÃO
                    </h2>
                  </div>

                  <div className="w-32 h-32 rounded-full border-4 border-black flex flex-col items-center justify-center bg-neutral-100 shadow-inner my-2">
                    <Lock size={48} className="text-black" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black mt-1">
                      SIGILOSO
                    </span>
                  </div>

                  <div className="space-y-2 w-full max-w-sm">
                    <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold">
                      Passe o aparelho para o votante:
                    </p>
                    <div className="p-4 border-3 border-black rounded-2xl bg-white shadow-sm flex items-center justify-center gap-3">
                      <PersonAvatar
                        avatar={livingPlayers[localVoteTurnIndex]?.avatar}
                        color={livingPlayers[localVoteTurnIndex]?.color || '#F59E0B'}
                        seed={livingPlayers[localVoteTurnIndex]?.name}
                        size={44}
                        className="border-2 border-black shrink-0"
                      />
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full border border-black shrink-0"
                          style={{
                            backgroundColor: livingPlayers[localVoteTurnIndex]?.color || '#F59E0B',
                          }}
                        />
                        <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-black uppercase">
                          {livingPlayers[localVoteTurnIndex]?.name}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs font-mono text-neutral-600 leading-tight pt-1">
                      🗳️ Votante {localVoteTurnIndex + 1} de {livingPlayers.length}. O voto é secreto e ninguém deve ver sua escolha.
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      sounds.playClick();
                      setLocalVoteUnlocked(true);
                    }}
                    className="w-full max-w-sm bg-black text-white py-4 px-6 rounded-full flex items-center justify-center space-x-2 active:scale-[0.97] transition-transform text-xs sm:text-sm font-black tracking-widest uppercase hover:bg-neutral-800 shadow-lg"
                  >
                    <Eye size={16} />
                    <span>SOU EU, {livingPlayers[localVoteTurnIndex]?.name.toUpperCase()} — ABRIR MINHA CABINE</span>
                  </button>
                </div>
              ) : (
                <VotingPanel
                  key={`local_vote_${livingPlayers[localVoteTurnIndex]?.id}_${localVoteTurnIndex}`}
                  currentPlayer={livingPlayers[localVoteTurnIndex]}
                  players={localGame.players}
                  isSecretBallot={true}
                  onCastVote={(targetId, useDoubleVote) => {
                    handleLocalPlayerVote(targetId, useDoubleVote);
                  }}
                  isHost={false}
                />
              )}
            </motion.div>
          )}

          {/* F) Veredito Público do Julgamento */}
          {localSubPhase === 'DAY_RESULT' && (
            <motion.div
              key={`local_result_${localGame.dayNumber}`}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between p-6 sm:p-8 text-center space-y-6 select-none"
            >
              <div className="space-y-1">
                <span className="text-xs font-mono uppercase bg-black text-white px-3 py-1 rounded-full font-bold">
                  Tribunal do Rebanho
                </span>
                <h2 className="text-2xl sm:text-3xl font-black uppercase font-mono">
                  VEREDITO DA VILA
                </h2>
              </div>

              {/* Verdict Box */}
              <div className="p-6 border-3 border-black rounded-3xl bg-neutral-50 font-mono text-sm sm:text-base leading-relaxed space-y-2 shadow-sm max-w-lg mx-auto">
                <p className="font-bold text-black">
                  {localGame.logs[localGame.logs.length - 1]?.text}
                </p>
              </div>

              {/* Botão para próxima rodada */}
              <button
                onClick={() => {
                  localGame.dayNumber += 1;
                  localGame.players.forEach(p => {
                    p.voteTargetId = null;
                    p.hasActedTonight = false;
                    p.nightActionTargetId = null;
                    p.nightActionSecondaryId = null;
                  });
                  setLocalSubPhase('NIGHT_ACTIONS');
                  setLocalNightTurnIndex(0);
                  setLocalNightUnlocked(false);
                }}
                className="w-full max-w-sm mx-auto py-4 bg-black text-white rounded-full text-xs sm:text-sm font-mono font-black uppercase tracking-widest hover:bg-neutral-800 transition-colors shadow-md"
              >
                ANOITECER O DIA (PRÓXIMA NOITE)
              </button>
            </motion.div>
          )}

          {/* G) Fim de Jogo Local */}
          {localSubPhase === 'GAME_OVER' && (
            <motion.div
              key="local_game_over"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              <GameOverView
                winner={localGame.winner || 'OVELHAS'}
                players={localGame.players}
                onRestart={() => setIsLocalSetupOpen(true)}
                isHost={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      );
    }

    // 4. ONLINE MULTIPLAYER MODE
    if (mode === 'ONLINE' && !roomData) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 font-mono">
          <RefreshCw size={28} className="animate-spin text-neutral-600 mx-auto" />
          <p className="text-xs font-bold uppercase tracking-wider">Conectando à sala da congregação...</p>
          <button
            type="button"
            onClick={() => setMode('ENTRY')}
            className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
          >
            Voltar ao Menu Inicial
          </button>
        </div>
      );
    }

    if (mode === 'ONLINE' && roomData) {
      const isHost = roomData.hostId === myPlayerId;
      const lobbyRawMe = roomData.self || roomData.players.find(p => p.id === myPlayerId) || null;
      const lobbyMe = lobbyRawMe
        ? {
            ...lobbyRawMe,
            role: lobbyRawMe.role || 'OVELHA',
            team: lobbyRawMe.team || 'OVELHAS',
            avatar: myCustomAvatar || lobbyRawMe.avatar,
            color: myCustomColor || lobbyRawMe.color || '#F59E0B',
          }
        : null;

      const lobbyPlayers = roomData.players.map(p =>
        p.id === myPlayerId
          ? {
              ...p,
              avatar: myCustomAvatar || p.avatar,
              color: myCustomColor || p.color || '#F59E0B',
            }
          : p
      );

      // 4.0 LOBBY
      if (roomData.phase === 'LOBBY') {
        return (
          <LobbyView
            roomCode={roomData.code}
            players={lobbyPlayers}
            isHost={isHost}
            config={roomData.config}
            onUpdateConfig={async () => {}}
            onAddBot={handleOnlineAddBot}
            onRemoveBot={handleOnlineRemoveBot}
            onStartGame={handleOnlineStartGame}
            onSwitchToLocalMode={() => {
              if (eventSourceRef.current) eventSourceRef.current.close();
              setIsLocalSetupOpen(true);
            }}
            onLeaveRoom={handleOnlineLeaveRoom}
            myPlayerId={myPlayerId}
            selfPlayer={lobbyMe || undefined}
            onUpdateProfile={handleOnlineUpdateProfile}
            onSendSheepEvent={handleSendSheepEvent}
            incomingSheepEvent={incomingSheepEvent}
            syncedSheepMap={syncedSheepMap}
          />
        );
      }

      // Fora do LOBBY, exige o `self.role` real sincronizado do servidor (nunca usa fallback 'OVELHA')
      const me =
        roomData.self && roomData.self.role
          ? {
              ...roomData.self,
              ...(roomData.players.find(p => p.id === myPlayerId) || {}),
              role: roomData.self.role,
              team: roomData.self.team || (roomData.self.role === 'SOLDADO' ? 'SOLDADOS' : 'OVELHAS'),
              modifier: roomData.self.modifier,
              avatar: myCustomAvatar || roomData.self.avatar,
              color: myCustomColor || roomData.self.color || '#F59E0B',
            }
          : null;

      if (!me && roomData.phase !== 'GAME_OVER') {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 font-mono">
            <RefreshCw size={28} className="animate-spin text-neutral-600 mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider">
              Sorteando e sincronizando seu papel secreto com a vila...
            </p>
            <button
              type="button"
              onClick={() => fetchRoomDetail(roomData.code, myPlayerId)}
              className="px-4 py-2 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
            >
              Atualizar Agora
            </button>
          </div>
        );
      }

      // 4.1 ROLE REVEAL (Conferir papel secreto individual no celular)
      if (roomData.phase === 'ROLE_REVEAL') {
        if (!me) return null;
        const totalLiving = roomData.players.filter(p => p.isAlive).length;
        const totalConfirmed = roomData.players.filter(p => p.isAlive && p.hasConfirmedRole).length;
        const hasMeConfirmed = Boolean(me.hasConfirmedRole);

        return (
          <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="text-center space-y-1"
            >
              <span className="text-xs font-mono uppercase bg-black text-white px-3 py-1 rounded-full font-bold">
                1ª Rodada — Revelação Secreta
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase text-black font-mono">
                Sua Identidade na Vila
              </h2>
              <p className="text-xs font-mono text-neutral-600">
                Apenas você pode ver sua carta neste aparelho. Mantenha em segredo!
              </p>
            </motion.div>

            <AnimatePresence mode="wait">
              {hasMeConfirmed ? (
                <motion.div
                  key="online_confirmed_card"
                  initial={{ opacity: 0, scale: 0.94, y: 24 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -20 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                  className="flex-1 flex flex-col items-center justify-between p-3 sm:p-4 border-3 border-black rounded-3xl bg-neutral-50 text-center space-y-3"
                >
                  {/* Status compacto com confirmação e contagem */}
                  <div className="w-full flex items-center justify-between bg-emerald-100/90 border-2 border-emerald-600/40 rounded-2xl p-2.5">
                    <div className="flex items-center gap-2.5 text-left">
                      <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                        <UserCheck size={18} />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-black uppercase font-mono text-emerald-950 leading-tight">
                          Papel Confirmado! ({me.role})
                        </h3>
                        <p className="text-[10px] font-mono text-emerald-800 leading-tight">
                          Aguardando os outros membros da congregação...
                        </p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1 bg-white border border-emerald-600 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-xs shrink-0">
                      <RefreshCw size={11} className="animate-spin text-emerald-700" />
                      <span>{totalConfirmed} de {totalLiving} prontos</span>
                    </div>
                  </div>

                  {/* O CERCADO DAS OVELHAS: Andar de um lado para o outro e falar "MEH" */}
                  <SheepCorralWaiting
                    currentPlayer={me}
                    allPlayers={roomData.players.filter(p => p.isAlive)}
                    title="Cercado de Espera da Vila"
                    subtitle="Você virou uma ovelhinha no pasto! Ande e fale 'MEH' enquanto aguarda."
                    waitingCountText={`${totalConfirmed} de ${totalLiving} prontos`}
                    isNight={false}
                    onSendSheepEvent={handleSendSheepEvent}
                    incomingSheepEvent={incomingSheepEvent}
                    syncedSheepMap={syncedSheepMap}
                  />

                  {isHost && (
                    <button
                      onClick={handleOnlineAdvancePhase}
                      className="w-full py-2.5 px-6 bg-black text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors cursor-pointer active:scale-95 shadow-md"
                    >
                      Iniciar Noite Agora (Host)
                    </button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key={`online_role_card_${me.id}`}
                  initial={{ opacity: 0, y: 36, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -28, scale: 0.96 }}
                  transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                  className="flex-1 flex flex-col justify-between"
                >
                  <RoleCardSecret
                    role={me.role}
                    playerName={me.name}
                    modifier={me.modifier}
                    avatar={me.avatar}
                    color={me.color}
                    confirmLabel="CONFIRMAR E ENTRAR NA NOITE"
                    onConfirm={handleOnlineConfirmRole}
                    hideAvatar={false}
                  />
                  <div className="mt-2 text-center text-[11px] font-mono text-neutral-500">
                    {totalConfirmed} de {totalLiving} jogadores já confirmaram
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }

      // 4.2 NIGHT PHASE
      if (roomData.phase === 'NIGHT') {
        if (!me) return null;

        // Se o jogador foi eliminado
        if (!me.isAlive) {
          return (
            <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 bg-[#0B132B] text-white rounded-2xl animate-fadeIn space-y-3">
              <div className="text-center space-y-1 mt-1">
                <div className="inline-block px-3 py-1 bg-neutral-800 text-neutral-300 border border-neutral-600 rounded-full text-xs font-mono uppercase font-bold">
                  ✝️ Espectador / Eliminado
                </div>
                <h3 className="text-base font-black uppercase font-mono text-white">Você está em repouso</h3>
                <p className="text-xs font-mono text-slate-300 max-w-xs mx-auto">
                  A noite caiu e os sobreviventes estão agindo em segredo. Divirta-se no cercado enquanto espera o amanhecer!
                </p>
              </div>

              <SheepCorralWaiting
                currentPlayer={me}
                allPlayers={roomData.players}
                title="Aprisco Noturno dos Espíritos"
                subtitle="Ande pelo pasto sob o luar e fale 'MEH'!"
                waitingCountText="Aguardando amanhecer..."
                isNight={true}
                onSendSheepEvent={handleSendSheepEvent}
                incomingSheepEvent={incomingSheepEvent}
                syncedSheepMap={syncedSheepMap}
              />

              {isHost && (
                <button
                  onClick={handleOnlineAdvancePhase}
                  className="w-full py-2.5 bg-neutral-800 text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-black"
                >
                  Avançar Noite Imediatamente (Host)
                </button>
              )}
            </div>
          );
        }

        // Se o jogador vivo já realizou sua ação noturna (está esperando os outros agirem)
        if (me.hasActedTonight) {
          const totalLiving = roomData.players.filter(p => p.isAlive).length;
          const totalActed = roomData.players.filter(p => p.isAlive && p.hasActedTonight).length;
          return (
            <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 bg-[#0B132B] text-white rounded-2xl animate-fadeIn space-y-3">
              <div className="text-center space-y-1 mt-1">
                <div className="inline-block px-3 py-1 bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 rounded-full text-xs font-mono uppercase font-bold">
                  ✓ Ação Noturna Registrada
                </div>
                <h3 className="text-base font-black uppercase font-mono text-white">
                  Aguardando os Demais Irmãos Agirem
                </h3>
                <p className="text-xs font-mono text-slate-300 max-w-xs mx-auto">
                  Sua ação foi selada. Enquanto os outros concluem seus turnos na calada da noite, divirta-se no cercado!
                </p>
              </div>

              <SheepCorralWaiting
                currentPlayer={me}
                allPlayers={roomData.players}
                title="Aprisco Noturno da Vila"
                subtitle="Ande pelo pasto sob o luar e fale 'MEH' enquanto os outros agem!"
                waitingCountText={`${totalActed} de ${totalLiving} prontos`}
                isNight={true}
                onSendSheepEvent={handleSendSheepEvent}
                incomingSheepEvent={incomingSheepEvent}
                syncedSheepMap={syncedSheepMap}
              />

              {me.team === 'SOLDADOS' && (
                <div className="mt-1">
                  <ChatPanel
                    messages={roomData.messages}
                    currentPlayer={me}
                    players={roomData.players}
                    onSendMessage={handleOnlineChat}
                  />
                </div>
              )}

              {isHost && (
                <button
                  onClick={handleOnlineAdvancePhase}
                  className="w-full py-2.5 bg-neutral-800 text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-black cursor-pointer"
                >
                  Avançar Noite Imediatamente (Host)
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="flex-1 flex flex-col justify-between">
            <NightActionPanel
              player={me}
              allPlayers={roomData.players}
              canSelfProtectPastor={roomData.config.pastorCanSelfProtect}
              soldiersList={roomData.soldiersList}
              onPerformAction={handleOnlineNightAction}
              onAdvanceNight={isHost ? handleOnlineAdvancePhase : undefined}
              isHost={isHost}
              waitingCorralNode={
                <SheepCorralWaiting
                  currentPlayer={me}
                  allPlayers={roomData.players.filter(p => p.isAlive)}
                  title="Aprisco Noturno da Vila"
                  subtitle="Ação noturna salva! Ande pelo pasto sob o luar e balbe 'MEH' enquanto os outros agem."
                  waitingCountText="Aguardando a congregação..."
                  isNight={true}
                  onSendSheepEvent={handleSendSheepEvent}
                  incomingSheepEvent={incomingSheepEvent}
                  syncedSheepMap={syncedSheepMap}
                />
              }
            />
            {me.team === 'SOLDADOS' && (
              <div className="mt-2">
                <ChatPanel
                  messages={roomData.messages}
                  currentPlayer={me}
                  players={roomData.players}
                  onSendMessage={handleOnlineChat}
                />
              </div>
            )}
          </div>
        );
      }

      // 4.3 DAY ANNOUNCEMENT (Amanhecer)
      if (roomData.phase === 'DAY_ANNOUNCEMENT') {
        if (!me) return null;
        const totalLiving = roomData.players.filter(p => p.isAlive).length;
        const totalApproved = roomData.players.filter(p => p.isAlive && p.hasApprovedPhase).length;
        const hasMeApproved = Boolean(me.hasApprovedPhase);

        return (
          <div className="flex-1 flex flex-col justify-between space-y-3">
            <DayAnnouncementView
              dayNumber={roomData.dayNumber}
              logs={roomData.logs}
              onProceedToDiscussion={handleOnlineReadyPhase}
              isHost={isHost}
            />

            {(hasMeApproved || !me?.isAlive) && (
              <div className="animate-fadeIn my-1">
                <SheepCorralWaiting
                  currentPlayer={me}
                  allPlayers={roomData.players}
                  title={!me?.isAlive ? "Pasto dos Espíritos no Amanhecer" : "Pasto do Amanhecer"}
                  subtitle={
                    !me?.isAlive
                      ? "Você já foi eliminado. Enquanto os vivos leem as notícias, pastoreie no cercado e fale 'MEH'!"
                      : "Você já está pronto! Enquanto os demais irmãos concluem a leitura, divirta-se no cercado!"
                  }
                  waitingCountText={`${totalApproved} de ${totalLiving} prontos`}
                  isNight={false}
                  onSendSheepEvent={handleSendSheepEvent}
                  incomingSheepEvent={incomingSheepEvent}
                  syncedSheepMap={syncedSheepMap}
                />
              </div>
            )}

            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 border-2 border-black rounded-2xl text-xs font-mono font-bold">
              <span>{hasMeApproved ? '✓ Você está pronto' : !me?.isAlive ? '✝️ Espectador' : 'Aguardando seu clique'}</span>
              <span>{totalApproved} de {totalLiving} prontos</span>
            </div>
            {isHost && (
              <button
                onClick={handleOnlineAdvancePhase}
                className="w-full py-2.5 bg-neutral-800 text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-black"
              >
                Avançar para o Debate Imediatamente (Host)
              </button>
            )}
          </div>
        );
      }

      // 4.4 DAY DISCUSSION (Assembleia)
      if (roomData.phase === 'DAY_DISCUSSION') {
        if (!me) return null;
        const totalLiving = roomData.players.filter(p => p.isAlive).length;
        const totalApproved = roomData.players.filter(p => p.isAlive && p.hasApprovedPhase).length;
        const hasMeApproved = Boolean(me.hasApprovedPhase);

        const minutes = Math.floor(onlineDiscussionSeconds / 60);
        const seconds = onlineDiscussionSeconds % 60;
        const formattedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        const isUrgent = onlineDiscussionSeconds <= 30;

        return (
          <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 space-y-3">
            <div className="flex items-center justify-between border-2 border-black p-2.5 rounded-2xl bg-white shadow-xs">
              <div className="space-y-0.5">
                <span className="text-[10px] font-mono uppercase bg-black text-white px-2 py-0.5 rounded-full font-bold">
                  {roomData.dayNumber}º Dia
                </span>
                <h3 className="text-sm font-black uppercase text-black font-mono">
                  Assembleia da Vila
                </h3>
              </div>
              <div
                className={`px-3 py-1 rounded-xl border-2 font-mono text-xs font-black flex items-center gap-1.5 ${
                  isUrgent
                    ? 'border-red-600 bg-red-50 text-red-600 animate-pulse'
                    : 'border-black bg-neutral-50 text-black'
                }`}
              >
                <Clock size={13} />
                <span>{formattedTimer}</span>
              </div>
            </div>

            {/* Jogadores eliminados não têm mais acesso ao Chat da Vila */}
            {!me.isAlive ? (
              <div className="flex-1 flex flex-col justify-center space-y-2.5">
                <div className="p-2.5 bg-neutral-100 border-2 border-black rounded-2xl text-center font-mono space-y-0.5">
                  <span className="inline-block px-2.5 py-0.5 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-widest">
                    ✝️ Espectador / Eliminado
                  </span>
                  <p className="text-[11px] font-bold text-black pt-0.5">
                    Você foi eliminado e não tem mais acesso ao Chat da Vila.
                  </p>
                </div>

                <SheepCorralWaiting
                  currentPlayer={me}
                  allPlayers={roomData.players}
                  title="Pasto dos Espíritos na Assembleia"
                  subtitle="Você está no plano espiritual! Ande pelo pasto e fale 'MEH' enquanto os vivos debatem!"
                  waitingCountText={`${totalApproved} de ${totalLiving} prontos`}
                  isNight={false}
                  onSendSheepEvent={handleSendSheepEvent}
                  incomingSheepEvent={incomingSheepEvent}
                  syncedSheepMap={syncedSheepMap}
                />
              </div>
            ) : (
              <div className="flex-1 min-h-[220px]">
                <ChatPanel
                  messages={roomData.messages}
                  currentPlayer={me}
                  players={roomData.players}
                  onSendMessage={handleOnlineChat}
                />
              </div>
            )}

            {/* Se o jogador vivo já clicou em 'Pronto para votar', ele está esperando os outros! */}
            {me.isAlive && hasMeApproved && (
              <div className="animate-fadeIn my-1">
                <SheepCorralWaiting
                  currentPlayer={me}
                  allPlayers={roomData.players}
                  title="Pasto da Assembleia"
                  subtitle="Você já confirmou estar pronto! Enquanto os outros concluem o debate, divirta-se no cercado!"
                  waitingCountText={`${totalApproved} de ${totalLiving} prontos`}
                  isNight={false}
                  onSendSheepEvent={handleSendSheepEvent}
                  incomingSheepEvent={incomingSheepEvent}
                  syncedSheepMap={syncedSheepMap}
                />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100 border border-black/30 rounded-xl text-[11px] font-mono">
                <span className={hasMeApproved ? 'text-emerald-700 font-bold' : !me.isAlive ? 'text-neutral-500' : 'text-neutral-700'}>
                  {hasMeApproved ? '✓ Pronto para votar confirmado' : !me.isAlive ? '✝️ Espectador (Sem voto)' : 'Aguardando seu clique'}
                </span>
                <span className="font-bold text-black">{totalApproved} de {totalLiving} prontos para votar</span>
              </div>

              {me.isAlive && (
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={handleOnlineReadyPhase}
                    disabled={hasMeApproved}
                    className={`flex-1 py-3 px-4 rounded-full text-xs font-mono font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md ${
                      hasMeApproved
                        ? 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-emerald-950/40'
                        : 'bg-black text-white hover:bg-neutral-800 active:scale-95'
                    }`}
                  >
                  {hasMeApproved ? (
                    <>
                      <Check size={16} />
                      <span>PRONTO PARA VOTAR (CONFIRMADO ✓)</span>
                    </>
                  ) : (
                    <>
                      <FourPointStar size={12} />
                      <span>PRONTO PARA VOTAR</span>
                      <FourPointStar size={12} />
                    </>
                  )}
                </button>

                {isHost && (
                  <>
                    {hostStartVoteConfirm ? (
                      <div className="p-2.5 bg-amber-50 border-2 border-amber-600 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-2 text-left w-full sm:w-auto animate-fadeIn">
                        <span className="text-[11px] font-mono text-amber-950 font-bold leading-tight">
                          Iniciar votação antecipada para todos?
                        </span>
                        <div className="flex gap-1.5 w-full sm:w-auto">
                          <button
                            type="button"
                            onClick={() => setHostStartVoteConfirm(false)}
                            disabled={isAdvancingVote}
                            className="flex-1 sm:flex-none py-1.5 px-3 border border-neutral-400 bg-white rounded-xl text-[10px] font-bold uppercase hover:bg-neutral-100"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setIsAdvancingVote(true);
                              setTimeout(() => {
                                handleOnlineAdvancePhase();
                                setIsAdvancingVote(false);
                                setHostStartVoteConfirm(false);
                              }, 250);
                            }}
                            disabled={isAdvancingVote}
                            className={`flex-1 sm:flex-none py-1.5 px-3 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 shadow-sm ${
                              isAdvancingVote
                                ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black'
                                : 'bg-black text-white hover:bg-neutral-800'
                            }`}
                          >
                            {isAdvancingVote ? (
                              <>
                                <Check size={13} />
                                <span>Iniciando... ✓</span>
                              </>
                            ) : (
                              'Sim, Iniciar Votação'
                            )}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          sounds.playClick();
                          setHostStartVoteConfirm(true);
                        }}
                        className="py-3 px-4 border-2 border-black bg-white text-black rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-100 active:scale-95 transition-all whitespace-nowrap"
                        title="Iniciar Votação Antecipada (Anfitrião)"
                      >
                        Começar Votação (Host)
                      </button>
                    )}
                  </>
                )}
                </div>
              )}
            </div>
          </div>
        );
      }

      // 4.5 DAY VOTING (Tribunal)
      if (roomData.phase === 'DAY_VOTING') {
        if (!me) return null;
        const totalLiving = roomData.players.filter(p => p.isAlive).length;
        const totalVoted = roomData.players.filter(p => p.isAlive && p.voteTargetId !== null).length;

        if (!me.isAlive) {
          return (
            <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 space-y-3 animate-fadeIn">
              <div className="text-center space-y-1">
                <div className="inline-block px-3 py-1 bg-neutral-200 border border-black text-black rounded-full text-xs font-mono uppercase font-bold">
                  ✝️ Espectador / Eliminado
                </div>
                <h3 className="text-base font-black uppercase font-mono">Julgamento em Andamento</h3>
                <p className="text-[11px] font-mono text-neutral-600 max-w-xs mx-auto">
                  Como você foi eliminado, não possui direito a voto. Enquanto os vivos votam, você virou uma ovelhinha espírito no cercado!
                </p>
              </div>

              <SheepCorralWaiting
                currentPlayer={me}
                allPlayers={roomData.players}
                title="Aprisco dos Espíritos no Julgamento"
                subtitle="Ande pelo pasto e fale 'MEH' enquanto os vivos decidem o destino da vila!"
                waitingCountText={`${totalVoted} de ${totalLiving} votos computados`}
                isNight={false}
                onSendSheepEvent={handleSendSheepEvent}
                incomingSheepEvent={incomingSheepEvent}
                syncedSheepMap={syncedSheepMap}
              />

              {isHost && (
                <button
                  onClick={handleOnlineAdvancePhase}
                  className="w-full py-2.5 bg-black text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
                >
                  Encerrar Votação (Host)
                </button>
              )}
            </div>
          );
        }

        // Se o jogador vivo já votou (está esperando os demais)
        if (me.voteTargetId !== null) {
          const votedPlayer = roomData.players.find(p => p.id === me.voteTargetId);
          const voteLabel = me.voteTargetId === 'ABSTAIN' ? 'Abstenção' : (votedPlayer?.name || 'Alvo Escolhido');
          return (
            <div className="flex-1 flex flex-col justify-between p-3 sm:p-4 space-y-3 animate-fadeIn">
              <div className="w-full flex items-center justify-between bg-emerald-100 border-2 border-emerald-600 rounded-2xl p-2.5">
                <div className="text-left">
                  <span className="text-[11px] font-mono uppercase font-black text-emerald-950 block">
                    ✓ Voto Registrado: {voteLabel}
                  </span>
                  <p className="text-[10px] font-mono text-emerald-800">
                    Aguardando os outros membros votarem...
                  </p>
                </div>
                <div className="px-2.5 py-1 bg-white border border-emerald-600 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 shadow-xs shrink-0">
                  <RefreshCw size={11} className="animate-spin text-emerald-700" />
                  <span>{totalVoted}/{totalLiving}</span>
                </div>
              </div>

              <SheepCorralWaiting
                currentPlayer={me}
                allPlayers={roomData.players}
                title="Pasto da Assembleia"
                subtitle="Voto registrado! Enquanto os outros membros votam, ande e fale 'MEH'!"
                waitingCountText={`${totalVoted} de ${totalLiving} votaram`}
                isNight={false}
                onSendSheepEvent={handleSendSheepEvent}
                incomingSheepEvent={incomingSheepEvent}
                syncedSheepMap={syncedSheepMap}
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleOnlineVote('ABSTAIN')}
                  className="flex-1 py-2.5 border-2 border-black rounded-full text-[11px] font-mono font-bold uppercase hover:bg-neutral-100 transition-colors cursor-pointer"
                >
                  Alterar para Abstenção
                </button>
                {isHost && (
                  <button
                    onClick={handleOnlineAdvancePhase}
                    className="flex-1 py-2.5 bg-black text-white rounded-full text-[11px] font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
                  >
                    Encerrar Votação (Host)
                  </button>
                )}
              </div>
            </div>
          );
        }

        return (
          <div className="flex-1 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100 border-2 border-black rounded-xl text-xs font-mono font-bold">
              <span>Escolha quem exilar</span>
              <span>{totalVoted} de {totalLiving} votos computados</span>
            </div>

            <VotingPanel
              currentPlayer={me}
              players={roomData.players}
              onCastVote={handleOnlineVote}
              onAdvanceVoting={isHost ? handleOnlineAdvancePhase : undefined}
              isHost={isHost}
              hideAvatars={false}
            />
          </div>
        );
      }

      // 4.6 DAY RESULT (Sentença)
      if (roomData.phase === 'DAY_RESULT') {
        if (!me) return null;
        const lastLogText = roomData.logs[roomData.logs.length - 1]?.text || 'O julgamento foi concluído pela congregação.';

        // Animação dramática de urnas abrindo com suspense antes de mostrar o veredito oficial
        if (revealedResultDay !== roomData.dayNumber) {
          return (
            <BallotBoxReveal
              dayNumber={roomData.dayNumber}
              logText={lastLogText}
              onComplete={() => setRevealedResultDay(roomData.dayNumber)}
            />
          );
        }

        const totalLiving = roomData.players.filter(p => p.isAlive).length;
        const totalApproved = roomData.players.filter(p => p.isAlive && p.hasApprovedPhase).length;
        const hasMeApproved = Boolean(me?.hasApprovedPhase);

        return (
          <div className="flex-1 flex flex-col justify-between p-5 text-center space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase bg-black text-white px-3 py-1 rounded-full font-bold">
                Resultado do Julgamento
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase font-mono">Sentença Executada</h3>
            </div>
            <div className="p-5 border-3 border-black rounded-3xl bg-neutral-50 font-mono text-sm leading-relaxed max-w-md mx-auto shadow-sm">
              <p className="font-bold text-black">
                {lastLogText}
              </p>
            </div>

            {(hasMeApproved || !me?.isAlive) && (
              <div className="animate-fadeIn my-1">
                <SheepCorralWaiting
                  currentPlayer={me}
                  allPlayers={roomData.players}
                  title={!me?.isAlive ? "Aprisco dos Espíritos ao Entardecer" : "Aprisco ao Entardecer"}
                  subtitle={
                    !me?.isAlive
                      ? "Você descansa nos céus. Pastoreie no cercado enquanto os vivos se recolhem ao aprisco!"
                      : "Você já está pronto! Enquanto os demais irmãos se recolhem, ande e fale 'MEH'!"
                  }
                  waitingCountText={`${totalApproved} de ${totalLiving} prontos`}
                  isNight={false}
                  onSendSheepEvent={handleSendSheepEvent}
                  incomingSheepEvent={incomingSheepEvent}
                  syncedSheepMap={syncedSheepMap}
                />
              </div>
            )}

            <div className="space-y-2 max-w-sm mx-auto w-full">
              <div className="text-[11px] font-mono text-neutral-600">
                {totalApproved} de {totalLiving} irmãos prontos para recolher ao aprisco
              </div>

              <button
                onClick={handleOnlineReadyPhase}
                disabled={hasMeApproved}
                className={`w-full py-3.5 rounded-full text-xs font-mono font-black uppercase tracking-widest transition-all ${
                  hasMeApproved
                    ? 'bg-neutral-300 text-neutral-600 border border-neutral-400'
                    : 'bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-md'
                }`}
              >
                {hasMeApproved ? 'AGUARDANDO O ANOITECER...' : 'CONFIRMAR E RETORNAR AO APRISCO'}
              </button>

              {isHost && (
                <button
                  onClick={handleOnlineAdvancePhase}
                  className="w-full py-2.5 border-2 border-black bg-white text-black rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-100"
                >
                  Cair a Noite Imediatamente (Host)
                </button>
              )}
            </div>
          </div>
        );
      }

      // 4.7 GAME OVER
      if (roomData.phase === 'GAME_OVER') {
        return (
          <GameOverView
            winner={roomData.winner || 'OVELHAS'}
            players={roomData.players}
            onRestart={isHost ? handleOnlineReset : () => setMode('ENTRY')}
            isHost={isHost}
          />
        );
      }
    }

    return null;
  };

  const isMatchActive =
    (mode === 'ONLINE' && roomData && roomData.phase !== 'LOBBY') ||
    (mode === 'SOLO' && soloGame && soloGame.phase !== 'GAME_OVER') ||
    (mode === 'PASS_PLAY' && localGame && localSubPhase !== 'GAME_OVER');

  const isHostInOnline = mode === 'ONLINE' && roomData?.hostId === myPlayerId;
  const showSettings = (mode === 'ONLINE' ? isHostInOnline : true) && Boolean(isMatchActive);

  return (
    <>
      {/* Gradiente de Transição Atmosférica de Tela Cheia ao Amanhecer e Anoitecer */}
      <AtmosphericTransition
        type={atmosphericTransition}
        onComplete={() => setAtmosphericTransition(null)}
      />

      {/* Reconnection Status Toast */}
      {isReconnecting && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-amber-500 text-black border-2 border-black rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-xl animate-pulse">
          <RefreshCw size={14} className="animate-spin" />
          <span>Reconectando e sincronizando a sala...</span>
        </div>
      )}

      {/* Atmospheric Phase Transition Banner com Dismiss por Clique */}
      <AnimatePresence>
        {phaseTransitionBanner && (
          <motion.div
            onClick={() => setPhaseTransitionBanner(null)}
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl border-2 font-mono shadow-2xl flex items-center gap-3 max-w-sm w-[90%] cursor-pointer active:scale-98 transition-transform select-none ${
              phaseTransitionBanner.type === 'NIGHT'
                ? 'bg-[#0B132B] border-indigo-400 text-white shadow-indigo-950/60'
                : 'bg-amber-100 border-amber-600 text-neutral-900 shadow-amber-900/20'
            }`}
            title="Toque para dispensar aviso"
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                phaseTransitionBanner.type === 'NIGHT'
                  ? 'bg-indigo-950 text-indigo-300'
                  : 'bg-amber-400 text-amber-950'
              }`}
            >
              {phaseTransitionBanner.type === 'NIGHT' ? <Moon size={22} /> : <Sun size={22} />}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <h4 className="text-xs font-black uppercase tracking-wider leading-tight">
                {phaseTransitionBanner.title}
              </h4>
              <p className="text-[10px] opacity-80 truncate leading-tight mt-0.5">
                {phaseTransitionBanner.subtitle}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPhaseTransitionBanner(null);
              }}
              className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 opacity-70 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
              title="Dispensar aviso"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <PhoneContainer
        title="INFILTRADO NA FÉ"
        onOpenManual={() => setIsManualOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onDisconnect={mode === 'ONLINE' && roomData ? () => setIsDisconnectModalOpen(true) : undefined}
        showSettings={showSettings}
        roomCode={roomData?.code}
        isNight={
          (mode === 'PASS_PLAY' && localSubPhase === 'NIGHT_ACTIONS') ||
          (mode === 'SOLO' && soloGame?.phase === 'NIGHT') ||
          (mode === 'ONLINE' && roomData?.phase === 'NIGHT')
        }
        phaseLabel={
          mode === 'ONLINE'
            ? roomData?.phase
            : mode === 'SOLO'
            ? soloGame?.phase
            : mode === 'PASS_PLAY'
            ? localSubPhase
            : undefined
        }
      >
        {renderCurrentView()}
      </PhoneContainer>

      {/* Modal de Configuração e Ajustes da Partida (com confirmação) */}
      <GameSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onRestartGame={() => {
          if (mode === 'ONLINE') {
            handleOnlineReset();
          } else if (mode === 'SOLO') {
            handleStartSolo(playerName || 'Você');
          } else if (mode === 'PASS_PLAY') {
            if (localGame) {
              handleStartPassAndPlayWithRoster(localGame.players.map(p => p.name));
            }
          }
        }}
        onReturnHome={() => {
          if (eventSourceRef.current) eventSourceRef.current.close();
          setMode('ENTRY');
          setRoomData(null);
          setSoloGame(null);
          setLocalGame(null);
        }}
        isOnline={mode === 'ONLINE'}
        isHost={mode === 'ONLINE' ? roomData?.hostId === myPlayerId : true}
      />

      {/* Modal de Configuração e Salvamento de Jogadores Locais */}
      <LocalPlayersSetupModal
        isOpen={isLocalSetupOpen}
        onClose={() => setIsLocalSetupOpen(false)}
        onStartWithPlayers={handleStartPassAndPlayWithRoster}
      />

      {/* Manual do Sistema, Código Python e Guia Socket.IO */}
      <SystemDocumentationModal
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
      />

      {/* Modal: Escolher Nome antes de Criar Sala Definitivo */}
      {isCreateRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-3 border-black rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 font-mono text-black">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <FourPointStar size={16} />
                <h3 className="font-black text-sm uppercase tracking-wider">CRIAR SALA ONLINE</h3>
              </div>
              <button
                onClick={() => setIsCreateRoomModalOpen(false)}
                className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center font-bold text-xs hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-neutral-600 leading-tight">
                Como anfitrião, escolha o nome pelo qual você será reconhecido na congregação antes de criar e entrar definitivo na sala:
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-700 block">
                Seu Nome de Anfitrião:
              </label>
              <input
                type="text"
                value={modalName}
                onChange={e => {
                  setModalName(e.target.value);
                  setModalError(null);
                }}
                placeholder="Ex: Pastor Samuel"
                maxLength={18}
                autoFocus
                className="w-full px-3.5 py-2.5 border-2 border-black rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreateRoom(modalName);
                }}
              />
            </div>

            {/* Sugestões rápidas de nomes */}
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold">Sugestões bíblicas:</span>
              <div className="flex flex-wrap gap-1">
                {['Samuel', 'Davi', 'Elias', 'Mateus', 'Lucas', 'Rebeca', 'Ester', 'Bento'].map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setModalName(name);
                      sounds.playClick();
                    }}
                    className="px-2 py-0.5 border border-black/40 rounded-lg text-[10px] bg-neutral-100 hover:bg-black hover:text-white transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {modalError && (
              <div className="p-3 border-2 border-red-900 bg-red-50 text-red-900 text-[11px] rounded-xl font-bold space-y-2">
                <p className="leading-tight">{modalError}</p>
                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleCreateRoom(modalName)}
                    className="w-full py-1.5 bg-red-900 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-red-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} />
                    <span>Tentar Conectar Novamente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateRoomModalOpen(false);
                      setIsLocalSetupOpen(true);
                      sounds.playClick();
                    }}
                    className="w-full py-1.5 border border-red-900/40 text-red-900 bg-white rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-red-100 transition-colors"
                  >
                    Ou Jogar Modo Passar Celular (Sem Servidor)
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCreateRoomModalOpen(false)}
                className="flex-1 py-2.5 border-2 border-black rounded-xl text-xs font-bold uppercase hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleCreateRoom(modalName)}
                className="flex-1 py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase hover:bg-neutral-800 shadow-md active:scale-95"
              >
                CRIAR DEFINITIVO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Escolher Nome antes de Entrar na Sala Definitivo */}
      {isJoinRoomModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white border-3 border-black rounded-3xl p-5 sm:p-6 w-full max-w-sm shadow-2xl space-y-4 font-mono text-black">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2">
                <FourPointStar size={16} />
                <h3 className="font-black text-sm uppercase tracking-wider">ENTRAR NA SALA ONLINE</h3>
              </div>
              <button
                onClick={() => setIsJoinRoomModalOpen(false)}
                className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center font-bold text-xs hover:bg-neutral-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-neutral-600 leading-tight">
                Informe o código de 5 caracteres e escolha seu nome de jogador antes de entrar definitivo na congregação:
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-700 block">
                Código da Sala (5 letras):
              </label>
              <input
                type="text"
                value={modalCode}
                onChange={e => {
                  setModalCode(e.target.value.toUpperCase());
                  setModalError(null);
                }}
                placeholder="Ex: ABCDE"
                maxLength={5}
                className="w-full px-3.5 py-2 border-2 border-black rounded-xl text-base font-black text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-neutral-700 block">
                Seu Nome de Jogador:
              </label>
              <input
                type="text"
                value={modalName}
                onChange={e => {
                  setModalName(e.target.value);
                  setModalError(null);
                }}
                placeholder="Ex: Irmão Davi"
                maxLength={18}
                autoFocus={Boolean(modalCode)}
                className="w-full px-3.5 py-2.5 border-2 border-black rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleJoinRoom(modalCode, modalName);
                }}
              />
            </div>

            {/* Sugestões rápidas de nomes */}
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase font-bold">Sugestões bíblicas:</span>
              <div className="flex flex-wrap gap-1">
                {['Gabriel', 'Sara', 'Isaque', 'Raquel', 'Noé', 'Miriam', 'Gideão', 'Tiago'].map(name => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setModalName(name);
                      sounds.playClick();
                    }}
                    className="px-2 py-0.5 border border-black/40 rounded-lg text-[10px] bg-neutral-100 hover:bg-black hover:text-white transition-colors"
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            {modalError && (
              <div className="p-3 border-2 border-red-900 bg-red-50 text-red-900 text-[11px] rounded-xl font-bold space-y-2">
                <p className="leading-tight">{modalError}</p>
                <div className="flex flex-col gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleJoinRoom(modalCode, modalName)}
                    className="w-full py-1.5 bg-red-900 text-white rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-red-800 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw size={12} />
                    <span>Tentar Conectar Novamente</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsJoinRoomModalOpen(false);
                      handleStartSolo(modalName || playerName || 'Você');
                      sounds.playClick();
                    }}
                    className="w-full py-1.5 border border-red-900/40 text-red-900 bg-white rounded-lg text-[10px] uppercase font-bold tracking-wider hover:bg-red-100 transition-colors"
                  >
                    Jogar Solo vs Bots (Sem Servidor)
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsJoinRoomModalOpen(false)}
                className="flex-1 py-2.5 border-2 border-black rounded-xl text-xs font-bold uppercase hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleJoinRoom(modalCode, modalName)}
                className="flex-1 py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase hover:bg-neutral-800 shadow-md active:scale-95"
              >
                ENTRAR DEFINITIVO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Desconexão em 2 Etapas com confirmação e mudança de cor */}
      {isDisconnectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn font-mono">
          <div className="w-full max-w-sm bg-white border-3 border-black rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl animate-scaleUp">
            <div className="flex items-center justify-between border-b-2 border-black pb-2">
              <div className="flex items-center gap-2 text-black font-black text-sm uppercase">
                <LogOut size={18} className="text-red-600" />
                <span>Desconectar da Partida?</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!isDisconnecting) setIsDisconnectModalOpen(false);
                }}
                className="p-1 border border-black rounded-lg hover:bg-black hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            <div className="space-y-2 text-left">
              <p className="text-xs text-neutral-800 leading-relaxed font-bold">
                Deseja desconectar seu aparelho desta partida online?
              </p>
              <div className="p-3 bg-neutral-50 border border-neutral-300 rounded-xl space-y-1.5 text-[11px] text-neutral-600 leading-tight">
                <p>
                  🛡️ <strong>Sua vaga e papel continuarão salvos:</strong> se você sair agora ou se sua conexão cair sem querer, você poderá <strong>voltar para a partida em andamento</strong> a qualquer momento digitando o código da sala (<strong>{roomData?.code}</strong>) e seu nome (<strong>{roomData?.self?.name || playerName}</strong>).
                </p>
                {roomData?.hostId === myPlayerId && (
                  <p className="text-amber-800 font-bold pt-1 border-t border-neutral-200">
                    👑 Como você é o anfitrião, ao sair, outro jogador conectado será sorteado aleatoriamente para liderar a sala.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsDisconnectModalOpen(false)}
                disabled={isDisconnecting}
                className="flex-1 py-2.5 px-3 border-2 border-black rounded-xl text-xs font-bold uppercase hover:bg-neutral-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsDisconnecting(true);
                  setTimeout(() => {
                    handleOnlineVoluntaryDisconnect();
                  }, 280);
                }}
                disabled={isDisconnecting}
                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold uppercase transition-all flex items-center justify-center gap-1.5 shadow-md ${
                  isDisconnecting
                    ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black shadow-emerald-950/40'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isDisconnecting ? (
                  <>
                    <Check size={14} />
                    <span>Desconectando... ✓</span>
                  </>
                ) : (
                  'Sim, Desconectar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Personalização de Avatar & Cor na Tela Inicial */}
      <AvatarCustomizerModal
        isOpen={isEntryAvatarModalOpen}
        onClose={() => setIsEntryAvatarModalOpen(false)}
        avatar={myCustomAvatar}
        color={myCustomColor}
        playerName={playerName || modalName || 'Cidadão'}
        onSave={(newAvatar, newColor) => {
          setMyCustomAvatar(newAvatar);
          setMyCustomColor(newColor);
        }}
      />
    </>
  );
}
