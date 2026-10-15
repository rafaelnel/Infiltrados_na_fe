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
import { LocalPlayersSetupModal } from './components/LocalPlayersSetupModal';
import { GameSettingsModal } from './components/GameSettingsModal';
import { BallotBoxReveal } from './components/BallotBoxReveal';
import { FourPointStar, SheepIllustration, RoleIllustration } from './components/RoleIllustrations';
import { sounds } from './utils/audio';
import { Player, Role, Team, Phase, ChatMessage, GameConfig, RoomState, ModifiersConfig } from './types/game';
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

  // Modais de Criação e Entrada na Sala Online com Escolha Obrigatória de Nome
  const [isCreateRoomModalOpen, setIsCreateRoomModalOpen] = useState(false);
  const [isJoinRoomModalOpen, setIsJoinRoomModalOpen] = useState(false);
  const [modalName, setModalName] = useState('');
  const [modalCode, setModalCode] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  // Sockets & SSE
  const socketRef = useRef<Socket | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Refs para manter valores atualizados para handlers e reconexão
  const roomDataRef = useRef<RoomState | null>(null);
  const myPlayerIdRef = useRef<string>('');
  const modeRef = useRef<'ENTRY' | 'ONLINE' | 'SOLO' | 'PASS_PLAY'>('ENTRY');

  useEffect(() => {
    roomDataRef.current = roomData;
  }, [roomData]);

  useEffect(() => {
    myPlayerIdRef.current = myPlayerId;
  }, [myPlayerId]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

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
      return;
    }

    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = currentPhase;

    if (prevPhase && prevPhase !== currentPhase) {
      // 1. Mudança para a NOITE (Lobo uivando)
      if (currentPhase === 'NIGHT' || currentPhase === 'NIGHT_ACTIONS') {
        sounds.playWolfHowl();
        setRevealedResultDay(null);
        setPhaseTransitionBanner({
          type: 'NIGHT',
          title: 'A NOITE CAIU SOBRE A VILA',
          subtitle: 'Os lobos uivam na escuridão. Ovelhas recolhem-se ao aprisco.',
        });
        const timer = setTimeout(() => setPhaseTransitionBanner(null), 3800);
        return () => clearTimeout(timer);
      }
      // 2. Mudança para o DIA / Amanhecer (Galo cantando)
      else if (currentPhase === 'DAY_ANNOUNCEMENT') {
        sounds.playRoosterCrow();
        setPhaseTransitionBanner({
          type: 'DAY',
          title: 'O SOL NASCEU NA VILA',
          subtitle: 'O canto do galo e os sinos anunciam o amanhecer.',
        });
        const timer = setTimeout(() => setPhaseTransitionBanner(null), 3800);
        return () => clearTimeout(timer);
      }
      // 3. Votação
      else if (currentPhase === 'DAY_VOTING') {
        sounds.playGavelStrike();
        setRevealedResultDay(null);
      }
    }
  }, [mode, roomData?.phase, soloGame?.phase, localSubPhase]);

  // -------------------------------------------------------------
  // RECONNECTION MECHANISM & SOCKET.IO SETUP
  // -------------------------------------------------------------
  useEffect(() => {
    try {
      const socket = io({
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 20000,
      });
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
                setRoomData(res.room);
              }
            });
            // Re-fetch via REST para garantir paridade total dos dados
            const res = await fetch(`/api/rooms/${code}?playerId=${pId}`);
            if (res.ok) {
              const full = await res.json();
              setRoomData(full);
            }
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
        setRoomData(prev => ({
          ...updatedRoom,
          self: updatedRoom.self || prev?.self || null,
          soldiersList: updatedRoom.soldiersList || prev?.soldiersList || [],
        }));
      });

      socket.on('player-joined', () => {
        if (roomDataRef.current?.code && myPlayerIdRef.current) {
          fetchRoomDetail(roomDataRef.current.code, myPlayerIdRef.current);
        }
      });

      socket.on('game-started', (updatedRoom: RoomState) => {
        setRoomData(prev => ({
          ...updatedRoom,
          self: updatedRoom.self || prev?.self || null,
          soldiersList: updatedRoom.soldiersList || prev?.soldiersList || [],
        }));
      });

      socket.on('join-error', (err: any) => {
        setErrorMessage(err.message || 'Erro ao entrar na sala.');
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
  }, []);

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

    try {
      setErrorMessage(null);
      setModalError(null);
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('create-room', { hostName: host }, (res: any) => {
          if (res?.success) {
            setMyPlayerId(res.playerId);
            setRoomData(res.room);
            setMode('ONLINE');
            setRevealedResultDay(null);
            setIsCreateRoomModalOpen(false);
            sounds.playClick();
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
    const res = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hostName: host }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Erro ao criar sala');

    setMyPlayerId(data.playerId);
    setRoomData(data.room);
    setMode('ONLINE');
    setRevealedResultDay(null);
    setIsCreateRoomModalOpen(false);
    sounds.playClick();
    setupSSE(data.roomCode, data.playerId);
  };

  const handleJoinRoom = async (chosenCode?: string, chosenName?: string) => {
    const cleanCode = (chosenCode || modalCode || inputRoomCode).trim().toUpperCase();
    if (!cleanCode) {
      setModalError('Informe o código de 5 caracteres da sala.');
      setModalCode(inputRoomCode);
      setIsJoinRoomModalOpen(true);
      return;
    }
    const name = (chosenName || modalName || playerName).trim();
    if (!name) {
      setModalError('Por favor, escolha seu nome de jogador antes de entrar na sala.');
      setModalCode(cleanCode);
      setModalName(playerName);
      setIsJoinRoomModalOpen(true);
      return;
    }
    setPlayerName(name);
    setInputRoomCode(cleanCode);

    try {
      setErrorMessage(null);
      setModalError(null);
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('join-room', { roomCode: cleanCode, playerName: name }, (res: any) => {
          if (res?.success) {
            setMyPlayerId(res.playerId);
            setRoomData(res.room);
            setMode('ONLINE');
            setRevealedResultDay(null);
            setIsJoinRoomModalOpen(false);
            sounds.playClick();
          } else {
            const msg = res?.error || res?.message || 'Erro ao entrar na sala.';
            setErrorMessage(msg);
            setModalError(msg);
          }
        });
      } else {
        const res = await fetch(`/api/rooms/${cleanCode}/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerName: name }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao entrar na sala');

        setMyPlayerId(data.playerId);
        setRoomData(data.room);
        setMode('ONLINE');
        setRevealedResultDay(null);
        setIsJoinRoomModalOpen(false);
        sounds.playClick();
        setupSSE(data.roomCode, data.playerId);
      }
    } catch (err: any) {
      setErrorMessage(err.message);
      setModalError(err.message);
    }
  };

  const setupSSE = (code: string, pId: string) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    const es = new EventSource(`/api/rooms/${code}/events?playerId=${pId}`);
    es.onmessage = () => {
      fetchRoomDetail(code, pId);
    };
    eventSourceRef.current = es;
    fetchRoomDetail(code, pId);
  };

  const fetchRoomDetail = async (code: string, pId: string) => {
    try {
      const res = await fetch(`/api/rooms/${code}?playerId=${pId}`);
      if (res.ok) {
        const full = await res.json();
        setRoomData(full);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnlineStartGame = async (
    customDeck?: Role[],
    discussionTimeSeconds?: number,
    modifiersConfig?: ModifiersConfig
  ) => {
    if (!roomData) return;
    try {
      const payload = {
        roomCode: roomData.code,
        playerId: myPlayerId,
        customDeck,
        discussionTimeSeconds,
        modifiersConfig,
      };
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('start-game', payload);
      }
      const res = await fetch(`/api/rooms/${roomData.code}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        sounds.playClick();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnlineConfirmRole = async () => {
    if (!roomData) return;
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('confirm-role', { roomCode: roomData.code, playerId: myPlayerId });
      }
      await fetch(`/api/rooms/${roomData.code}/confirm-role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
      sounds.playClick();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnlineReadyPhase = async () => {
    if (!roomData) return;
    try {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('ready-phase', { roomCode: roomData.code, playerId: myPlayerId });
      }
      await fetch(`/api/rooms/${roomData.code}/ready-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
      sounds.playClick();
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnlineAddBot = async (count: number) => {
    if (!roomData) return;
    try {
      await fetch(`/api/rooms/${roomData.code}/add-bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count }),
      });
      sounds.playClick();
    } catch (e) {
      console.error(e);
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
      if (spyData) {
        await fetch(`/api/rooms/${roomData.code}/spy-action`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId: myPlayerId, targetId: spyData.targetId }),
        });
      }

      await fetch(`/api/rooms/${roomData.code}/night-action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playerId: myPlayerId,
          targetId,
          secondaryTargetId,
          angelSacrifice: Boolean(angelSacrifice),
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnlineVote = async (targetId: string | 'ABSTAIN') => {
    if (!roomData) return;
    try {
      await fetch(`/api/rooms/${roomData.code}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId, targetId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnlineChat = async (text: string, channel: 'PUBLIC' | 'SOLDIERS') => {
    if (!roomData) return;
    try {
      await fetch(`/api/rooms/${roomData.code}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId, text, channel }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnlineAdvancePhase = async () => {
    if (!roomData) return;
    try {
      await fetch(`/api/rooms/${roomData.code}/advance-phase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOnlineReset = async () => {
    if (!roomData) return;
    try {
      await fetch(`/api/rooms/${roomData.code}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerId: myPlayerId }),
      });
    } catch (e) {
      console.error(e);
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
    sounds.playNightTone();
  };

  // -------------------------------------------------------------
  // MULTIPLAYER LOCAL (PASSAR O CELULAR) - FLUXO COMPLETO
  // -------------------------------------------------------------
  const handleStartPassAndPlayWithRoster = (
    savedRoster: string[],
    customDeck?: Role[],
    customDiscussionSeconds: number = 120,
    modifiersConfig?: ModifiersConfig
  ) => {
    const game = createLocalGameFromRoster(
      savedRoster,
      customDeck,
      customDiscussionSeconds,
      modifiersConfig
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
    sounds.playNightTone();
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
      sounds.playMorningBell();
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

              {/* Solo Bots Button */}
              <button
                onClick={() => handleStartSolo(playerName || 'Você')}
                className="w-full border-2 border-black bg-white text-black py-3 rounded-full flex items-center justify-center space-x-2 text-xs sm:text-sm font-mono font-black uppercase tracking-widest active:scale-95 transition-transform hover:bg-neutral-100"
              >
                <Bot size={16} />
                <span>JOGAR SOLO VS BOTS</span>
              </button>

              {/* Online Multiplayer */}
              <div className="border-2 border-black/20 rounded-2xl p-3 bg-neutral-50 space-y-2">
                <span className="text-[10px] font-mono font-bold uppercase text-neutral-500 block text-center">
                  Multiplayer Online (Salas com Código de 5 Letras)
                </span>
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
          {/* A) Distribuição Secreta de Papéis (Passa por todos os jogadores) */}
          {localSubPhase === 'ROLE_REVEAL' && (
            <motion.div
              key={`local_reveal_${passPlayIndex}`}
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12, scale: 0.98 }}
              transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 flex flex-col justify-between"
            >
              <RoleCardSecret
                key={`local_reveal_${localGame.players[passPlayIndex]?.id}_${passPlayIndex}`}
                role={localGame.players[passPlayIndex]?.role}
                playerName={localGame.players[passPlayIndex]?.name}
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
                    sounds.playNightTone();
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
                    <div className="p-4 border-2 border-indigo-400 rounded-2xl bg-[#1C2541] shadow-lg">
                      <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white uppercase block">
                        {livingPlayers[localNightTurnIndex]?.name}
                      </span>
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
                      className={`p-2.5 rounded-xl border text-xs font-mono flex items-center justify-between ${
                        p.isAlive ? 'bg-white border-black font-bold' : 'bg-neutral-200 border-neutral-300 text-neutral-500 line-through'
                      }`}
                    >
                      <span className="truncate">{p.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
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
                    <div className="p-4 border-3 border-black rounded-2xl bg-white shadow-sm">
                      <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-black uppercase block">
                        {livingPlayers[localVoteTurnIndex]?.name}
                      </span>
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
                  sounds.playNightTone();
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

    // 3. SOLO VS BOTS ENGINE
    if (mode === 'SOLO' && soloGame) {
      const human = soloGame.players[0];

      if (soloGame.phase === 'NIGHT') {
        return (
          <NightActionPanel
            player={human}
            allPlayers={soloGame.players}
            canSelfProtectPastor={soloGame.config.pastorCanSelfProtect}
            onPerformAction={(targetId, secondaryTargetId) => {
              const next = { ...soloGame };
              next.players[0].nightActionTargetId = targetId;
              next.players[0].nightActionSecondaryId = secondaryTargetId;
              next.players[0].hasActedTonight = true;
              const res = resolveLocalNight(next);
              setSoloGame(res);
              if (res.phase === 'DAY_ANNOUNCEMENT') sounds.playMorningBell();
            }}
            onAdvanceNight={() => {
              const res = resolveLocalNight(soloGame);
              setSoloGame(res);
            }}
            isHost={true}
          />
        );
      }

      if (soloGame.phase === 'DAY_ANNOUNCEMENT') {
        return (
          <DayAnnouncementView
            dayNumber={soloGame.dayNumber}
            logs={soloGame.logs}
            onProceedToDiscussion={() => {
              const next = { ...soloGame, phase: 'DAY_DISCUSSION' as Phase };
              simulateLocalBotsChatAndVotes(next);
              setSoloGame(next);
            }}
            isHost={true}
          />
        );
      }

      if (soloGame.phase === 'DAY_DISCUSSION') {
        return (
          <div className="flex-1 flex flex-col justify-between p-2 space-y-2">
            <div className="text-center space-y-0.5">
              <span className="text-[10px] font-mono uppercase bg-black text-white px-2 py-0.5 rounded-full">
                {soloGame.dayNumber}º Dia — Debate
              </span>
              <h3 className="text-sm font-black uppercase text-black font-mono">
                Assembleia com os Irmãos
              </h3>
            </div>
            <div className="flex-1 min-h-[220px]">
              <ChatPanel
                messages={soloGame.messages}
                currentPlayer={human}
                onSendMessage={(text, channel) => {
                  const next = { ...soloGame };
                  next.messages.push({
                    id: 'msg_' + Date.now(),
                    senderId: human.id,
                    senderName: human.name,
                    text,
                    timestamp: Date.now(),
                    channel,
                  });
                  setSoloGame(next);
                }}
              />
            </div>
            <button
              onClick={() => {
                const next = { ...soloGame, phase: 'DAY_VOTING' as Phase };
                simulateLocalBotsChatAndVotes(next);
                setSoloGame(next);
              }}
              className="w-full py-3 bg-black text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800"
            >
              Iniciar Votação do Tribunal
            </button>
          </div>
        );
      }

      if (soloGame.phase === 'DAY_VOTING') {
        return (
          <VotingPanel
            currentPlayer={human}
            players={soloGame.players}
            onCastVote={targetId => {
              const next = { ...soloGame };
              next.players[0].voteTargetId = targetId;
              const res = resolveLocalDayVotes(next);
              setSoloGame(res);
              sounds.playGavelStrike();
            }}
            onAdvanceVoting={() => {
              const res = resolveLocalDayVotes(soloGame);
              setSoloGame(res);
            }}
            isHost={true}
          />
        );
      }

      if (soloGame.phase === 'DAY_RESULT') {
        return (
          <div className="flex-1 flex flex-col justify-between p-6 text-center space-y-4">
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase bg-black text-white px-3 py-1 rounded-full font-bold">
                Resultado do Julgamento
              </span>
              <h3 className="text-xl font-black uppercase font-mono">Veredito do Dia</h3>
            </div>
            <div className="p-4 border-2 border-black rounded-2xl bg-neutral-50 font-mono text-sm">
              {soloGame.logs[soloGame.logs.length - 1]?.text}
            </div>
            <button
              onClick={() => {
                const next = { ...soloGame };
                next.dayNumber += 1;
                next.phase = 'NIGHT';
                next.players.forEach(p => {
                  p.voteTargetId = null;
                  p.hasActedTonight = false;
                  p.nightActionTargetId = null;
                  p.nightActionSecondaryId = null;
                });
                simulateLocalBotsNight(next);
                setSoloGame(next);
                sounds.playNightTone();
              }}
              className="w-full max-w-sm mx-auto py-3.5 bg-black text-white rounded-full text-xs font-mono font-bold uppercase"
            >
              Anoitecer o Dia (Próxima Noite)
            </button>
          </div>
        );
      }

      if (soloGame.phase === 'GAME_OVER') {
        return (
          <GameOverView
            winner={soloGame.winner || 'OVELHAS'}
            players={soloGame.players}
            onRestart={() => handleStartSolo(playerName || 'Você')}
            isHost={true}
          />
        );
      }
    }

    // 4. ONLINE MULTIPLAYER MODE
    if (mode === 'ONLINE' && roomData) {
      const isHost = roomData.hostId === myPlayerId;
      const me = roomData.self || roomData.players.find(p => p.id === myPlayerId) || null;

      // 4.0 LOBBY
      if (roomData.phase === 'LOBBY') {
        return (
          <LobbyView
            roomCode={roomData.code}
            players={roomData.players}
            isHost={isHost}
            config={roomData.config}
            onUpdateConfig={async () => {}}
            onAddBot={handleOnlineAddBot}
            onStartGame={handleOnlineStartGame}
            onSwitchToLocalMode={() => {
              if (eventSourceRef.current) eventSourceRef.current.close();
              setIsLocalSetupOpen(true);
            }}
          />
        );
      }

      if (!me && roomData.phase !== 'GAME_OVER') {
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 font-mono">
            <RefreshCw size={28} className="animate-spin text-neutral-600 mx-auto" />
            <p className="text-xs font-bold uppercase tracking-wider">Sincronizando seus dados com a vila...</p>
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
          <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 space-y-4 animate-fadeIn">
            <div className="text-center space-y-1">
              <span className="text-xs font-mono uppercase bg-black text-white px-3 py-1 rounded-full font-bold">
                1ª Rodada — Revelação Secreta
              </span>
              <h2 className="text-lg sm:text-xl font-black uppercase text-black font-mono">
                Sua Identidade na Vila
              </h2>
              <p className="text-xs font-mono text-neutral-600">
                Apenas você pode ver sua carta neste aparelho. Mantenha em segredo!
              </p>
            </div>

            {hasMeConfirmed ? (
              <div className="flex-1 flex flex-col items-center justify-center p-6 border-3 border-black rounded-3xl bg-neutral-50 text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
                  <UserCheck size={28} />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-black uppercase font-mono text-emerald-800">
                    Papel Confirmado!
                  </h3>
                  <p className="text-xs font-mono text-neutral-600 max-w-xs">
                    Você já conferiu sua função secreta ({me.role}). Aguardando os demais membros da congregação confirmarem no celular...
                  </p>
                </div>

                <div className="px-4 py-2 bg-white border-2 border-black rounded-full text-xs font-mono font-bold flex items-center gap-2">
                  <RefreshCw size={13} className="animate-spin text-neutral-600" />
                  <span>{totalConfirmed} de {totalLiving} irmãos prontos</span>
                </div>

                {isHost && (
                  <button
                    onClick={handleOnlineAdvancePhase}
                    className="mt-2 py-2.5 px-6 bg-black text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800 transition-colors"
                  >
                    Iniciar Noite Agora (Host)
                  </button>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col justify-between">
                <RoleCardSecret
                  role={me.role}
                  playerName={me.name}
                  modifier={me.modifier}
                  confirmLabel="CONFIRMAR E ENTRAR NA NOITE"
                  onConfirm={handleOnlineConfirmRole}
                />
                <div className="mt-2 text-center text-[11px] font-mono text-neutral-500">
                  {totalConfirmed} de {totalLiving} jogadores já confirmaram
                </div>
              </div>
            )}
          </div>
        );
      }

      // 4.2 NIGHT PHASE
      if (roomData.phase === 'NIGHT') {
        if (!me) return null;

        // Se o jogador foi eliminado
        if (!me.isAlive) {
          return (
            <div className="flex-1 flex flex-col justify-between p-4 bg-[#0B132B] text-white rounded-2xl animate-fadeIn space-y-4">
              <div className="text-center space-y-2 mt-4">
                <div className="inline-block px-3 py-1 bg-neutral-800 text-neutral-300 border border-neutral-600 rounded-full text-xs font-mono uppercase font-bold">
                  ✝️ Espectador / Eliminado
                </div>
                <h3 className="text-lg font-black uppercase font-mono text-white">Você está em repouso</h3>
                <p className="text-xs font-mono text-slate-300 max-w-xs mx-auto">
                  Você foi eliminado da vila. A noite caiu e os sobreviventes estão agindo em segredo.
                </p>
              </div>
              <div className="p-4 bg-[#141E3D] border border-indigo-500/30 rounded-2xl text-center space-y-2 font-mono text-xs">
                <Moon size={24} className="mx-auto text-indigo-300 animate-pulse" />
                <p className="text-slate-300">Aguardando o amanhecer para ver os novos acontecimentos...</p>
              </div>
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

        return (
          <div className="flex-1 flex flex-col justify-between">
            <NightActionPanel
              player={me}
              allPlayers={roomData.players}
              canSelfProtectPastor={roomData.config.pastorCanSelfProtect}
              onPerformAction={handleOnlineNightAction}
              onAdvanceNight={isHost ? handleOnlineAdvancePhase : undefined}
              isHost={isHost}
            />
            {me.team === 'SOLDADOS' && (
              <div className="mt-2">
                <ChatPanel
                  messages={roomData.messages}
                  currentPlayer={me}
                  onSendMessage={handleOnlineChat}
                />
              </div>
            )}
          </div>
        );
      }

      // 4.3 DAY ANNOUNCEMENT (Amanhecer)
      if (roomData.phase === 'DAY_ANNOUNCEMENT') {
        const totalLiving = roomData.players.filter(p => p.isAlive).length;
        const totalApproved = roomData.players.filter(p => p.isAlive && p.hasApprovedPhase).length;
        const hasMeApproved = Boolean(me?.hasApprovedPhase);

        return (
          <div className="flex-1 flex flex-col justify-between space-y-3">
            <DayAnnouncementView
              dayNumber={roomData.dayNumber}
              logs={roomData.logs}
              onProceedToDiscussion={handleOnlineReadyPhase}
              isHost={isHost}
            />
            <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 border-2 border-black rounded-2xl text-xs font-mono font-bold">
              <span>{hasMeApproved ? '✓ Você está pronto' : 'Aguardando seu clique'}</span>
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

            <div className="flex-1 min-h-[240px]">
              <ChatPanel
                messages={roomData.messages}
                currentPlayer={me}
                onSendMessage={handleOnlineChat}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100 border border-black/30 rounded-xl text-[11px] font-mono">
                <span>{hasMeApproved ? '✓ Voto aprovado' : 'Aguardando sua confirmação'}</span>
                <span className="font-bold">{totalApproved} de {totalLiving} prontos para votar</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleOnlineReadyPhase}
                  disabled={hasMeApproved}
                  className={`flex-1 py-3 rounded-full text-xs font-mono font-black uppercase tracking-wider transition-all ${
                    hasMeApproved
                      ? 'bg-neutral-300 text-neutral-600 border border-neutral-400'
                      : 'bg-black text-white hover:bg-neutral-800 active:scale-95 shadow-md'
                  }`}
                >
                  {hasMeApproved ? 'AGUARDANDO OS DEMAIS...' : 'PRONTO PARA JULGAMENTO'}
                </button>

                {isHost && (
                  <button
                    onClick={handleOnlineAdvancePhase}
                    className="py-3 px-4 border-2 border-black bg-white text-black rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-100"
                    title="Forçar Abertura da Votação"
                  >
                    Abrir Votação
                  </button>
                )}
              </div>
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
            <div className="flex-1 flex flex-col justify-between p-4 space-y-4 animate-fadeIn">
              <div className="text-center space-y-2 mt-4">
                <div className="inline-block px-3 py-1 bg-neutral-200 border border-black text-black rounded-full text-xs font-mono uppercase font-bold">
                  ✝️ Espectador / Eliminado
                </div>
                <h3 className="text-lg font-black uppercase font-mono">Julgamento em Andamento</h3>
                <p className="text-xs font-mono text-neutral-600 max-w-xs mx-auto">
                  Como você foi eliminado da vila, não possui direito a voto. Acompanhe a decisão dos irmãos sobreviventes.
                </p>
              </div>
              <div className="p-4 bg-neutral-100 border-2 border-black rounded-2xl text-center font-mono text-xs space-y-2">
                <p className="font-bold">{totalVoted} de {totalLiving} votos computados</p>
              </div>
              {isHost && (
                <button
                  onClick={handleOnlineAdvancePhase}
                  className="w-full py-2.5 bg-black text-white rounded-full text-xs font-mono font-bold uppercase tracking-wider hover:bg-neutral-800"
                >
                  Encerrar Votação (Host)
                </button>
              )}
            </div>
          );
        }

        return (
          <div className="flex-1 flex flex-col justify-between space-y-2">
            <div className="flex items-center justify-between px-3 py-1.5 bg-neutral-100 border-2 border-black rounded-xl text-xs font-mono font-bold">
              <span>{me.voteTargetId ? '✓ Seu voto foi registrado' : 'Escolha quem exilar'}</span>
              <span>{totalVoted} de {totalLiving} votos computados</span>
            </div>
            <VotingPanel
              currentPlayer={me}
              players={roomData.players}
              onCastVote={handleOnlineVote}
              onAdvanceVoting={isHost ? handleOnlineAdvancePhase : undefined}
              isHost={isHost}
            />
          </div>
        );
      }

      // 4.6 DAY RESULT (Sentença)
      if (roomData.phase === 'DAY_RESULT') {
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
      {/* Reconnection Status Toast */}
      {isReconnecting && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-amber-500 text-black border-2 border-black rounded-full text-xs font-mono font-bold flex items-center gap-2 shadow-xl animate-pulse">
          <RefreshCw size={14} className="animate-spin" />
          <span>Reconectando e sincronizando a sala...</span>
        </div>
      )}

      {/* Atmospheric Phase Transition Banner */}
      <AnimatePresence>
        {phaseTransitionBanner && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl border-2 font-mono shadow-2xl flex items-center gap-3 max-w-sm w-[90%] ${
              phaseTransitionBanner.type === 'NIGHT'
                ? 'bg-[#0B132B] border-indigo-400 text-white'
                : 'bg-amber-100 border-amber-600 text-neutral-900'
            }`}
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
            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-black uppercase tracking-wider leading-tight">
                {phaseTransitionBanner.title}
              </h4>
              <p className="text-[10px] opacity-80 truncate leading-tight mt-0.5">
                {phaseTransitionBanner.subtitle}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <PhoneContainer
        title="INFILTRADO NA FÉ"
        onOpenManual={() => setIsManualOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
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
              <div className="p-2 border-2 border-red-900 bg-red-50 text-red-900 text-[11px] rounded-xl font-bold">
                {modalError}
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
              <div className="p-2 border-2 border-red-900 bg-red-50 text-red-900 text-[11px] rounded-xl font-bold">
                {modalError}
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
    </>
  );
}
