import React, { useState, useEffect } from 'react';
import { Player, GameConfig, Role, ROLES_METADATA, ModifiersConfig } from '../types/game';
import { sounds } from '../utils/audio';
import { FourPointStar, SheepIllustration, RoleIllustration } from './RoleIllustrations';
import { SheepCorralWaiting, SheepEventData, SyncedSheepData } from './SheepCorralWaiting';
import {
  Users,
  Bot,
  Copy,
  Check,
  Settings,
  ShieldCheck,
  UserPlus,
  Phone,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  Sparkles,
  ShieldAlert,
  X,
  Sliders,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { getMaxAllowedSoldiers, generateRecommendedDeck } from './LocalPlayersSetupModal';
import { PersonAvatar, encodeAvatar, generateRandomCharacterConfig } from './PersonAvatar';
import { AvatarCustomizerModal, pickRandomAvailableColor } from './AvatarCustomizerModal';

interface Props {
  roomCode: string;
  players: Player[];
  isHost: boolean;
  config: GameConfig;
  onUpdateConfig: (newConfig: Partial<GameConfig>) => void;
  onAddBot: (count: number) => void;
  onRemoveBot?: () => void;
  onStartGame: (
    customDeck?: Role[],
    discussionTimeSeconds?: number,
    modifiersConfig?: ModifiersConfig
  ) => void;
  onSwitchToLocalMode: () => void;
  onLeaveRoom?: () => void;
  myPlayerId?: string;
  selfPlayer?: Player;
  onUpdateProfile?: (avatar: string, color: string) => void;
  onSendSheepEvent?: (event: SheepEventData) => void;
  incomingSheepEvent?: SheepEventData | null;
  syncedSheepMap?: Record<string, SyncedSheepData>;
}

export const LobbyView: React.FC<Props> = ({
  roomCode,
  players,
  isHost,
  config,
  onUpdateConfig,
  onAddBot,
  onRemoveBot,
  onStartGame,
  onSwitchToLocalMode,
  onLeaveRoom,
  myPlayerId,
  selfPlayer,
  onUpdateProfile,
  onSendSheepEvent,
  incomingSheepEvent,
  syncedSheepMap,
}) => {
  const [copied, setCopied] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [isBotBusy, setIsBotBusy] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'corral' | 'roster'>('corral');

  const handleAddBotClick = async (count: number) => {
    if (isBotBusy) return;
    setIsBotBusy(true);
    try {
      await onAddBot(count);
    } finally {
      setIsBotBusy(false);
    }
  };

  const handleRemoveBotClick = async () => {
    if (isBotBusy || !onRemoveBot) return;
    setIsBotBusy(true);
    try {
      await onRemoveBot();
    } finally {
      setIsBotBusy(false);
    }
  };

  // Contadores de papéis selecionados
  const [roleCounts, setRoleCounts] = useState<Record<Role, number>>(() =>
    generateRecommendedDeck(Math.max(5, players.length))
  );

  // Timer de debate da assembleia (padrão 120s)
  const [discussionSeconds, setDiscussionSeconds] = useState<number>(
    config.discussionTimeSeconds || 120
  );

  // Modificadores / Cards Especiais
  const [modifiersConfig, setModifiersConfig] = useState<ModifiersConfig>(
    config.modifiersConfig || {
      falsoProfeta: true,
      espiao: true,
      anjo: true,
    }
  );

  // Atualizar baralho recomendado quando novos jogadores entram se o modal de config não estiver aberto
  useEffect(() => {
    if (players.length >= 5 && !showConfigModal) {
      setRoleCounts(generateRecommendedDeck(players.length));
    }
  }, [players.length, showConfigModal]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    sounds.playClick();
    setTimeout(() => setCopied(false), 2000);
  };

  const totalPlayers = players.length;
  const totalAllocated = Object.values(roleCounts).reduce((a, b) => a + b, 0);
  const remainingSlots = totalPlayers - totalAllocated;
  const maxAllowedSoldiers = getMaxAllowedSoldiers(totalPlayers);
  const currentSoldiers = roleCounts.SOLDADO;

  const handleRoleCountChange = (role: Role, delta: number) => {
    sounds.playClick();
    setConfigError(null);
    setRoleCounts(prev => {
      const current = prev[role] || 0;
      const next = current + delta;
      if (next < 0) return prev;

      // Limite específico para Soldados (anti-snowballing)
      if (role === 'SOLDADO' && delta > 0 && next > maxAllowedSoldiers) {
        setConfigError(
          `Para ${totalPlayers} jogadores, o limite seguro é de no máximo ${maxAllowedSoldiers} Soldado(s). Adicionar mais causaria vitória imediata dos Soldados na 1ª rodada!`
        );
        return prev;
      }

      // Limites de papéis únicos
      if (['PASTOR', 'EVANGELISTA', 'APOSTOLO', 'PROFETA', 'MESTRE'].includes(role) && next > 2) {
        return prev;
      }

      return { ...prev, [role]: next };
    });
  };

  const handleResetRecommended = () => {
    sounds.playClick();
    setConfigError(null);
    setRoleCounts(generateRecommendedDeck(totalPlayers));
  };

  const buildDeck = (): Role[] => {
    const deck: Role[] = [];
    (Object.entries(roleCounts) as [Role, number][]).forEach(([role, count]) => {
      for (let i = 0; i < count; i++) deck.push(role);
    });
    return deck;
  };

  const handleStart = () => {
    if (players.length < 5) return;
    if (totalAllocated !== totalPlayers) {
      setConfigError(`O total de cartas selecionadas (${totalAllocated}) deve ser exatamente igual ao número de jogadores reunidos (${totalPlayers}).`);
      setShowConfigModal(true);
      return;
    }
    sounds.playMorningBell();
    onStartGame(buildDeck(), discussionSeconds, modifiersConfig);
  };

  const handleConfirmAndStart = () => {
    if (totalAllocated !== totalPlayers) {
      setConfigError(
        `O total de cartas selecionadas (${totalAllocated}) deve ser exatamente igual ao número de jogadores reunidos (${totalPlayers}).`
      );
      return;
    }
    setConfigError(null);
    sounds.playMorningBell();
    setShowConfigModal(false);
    onStartGame(buildDeck(), discussionSeconds, modifiersConfig);
  };

  const savedLocalAvatar = (() => {
    try {
      return localStorage.getItem('custom_avatar_data') || undefined;
    } catch {
      return undefined;
    }
  })();

  const savedLocalColor = (() => {
    try {
      return localStorage.getItem('custom_avatar_color') || '#F59E0B';
    } catch {
      return '#F59E0B';
    }
  })();

  const rawActivePlayer: Player =
    selfPlayer ||
    players.find(p => p.id === myPlayerId) ||
    players[0] || {
      id: myPlayerId || 'jogador_ativo',
      name: 'Você',
      role: 'OVELHA',
      isAlive: true,
      isBot: false,
      isHost,
    };

  const activePlayer: Player = {
    ...rawActivePlayer,
    avatar: rawActivePlayer.avatar || savedLocalAvatar,
    color: rawActivePlayer.color || savedLocalColor,
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 sm:p-4 space-y-3 animate-fadeIn overflow-y-auto max-h-full">
      {/* Title & Room Badge */}
      <div className="text-center space-y-1">
        <div className="inline-block px-3 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest">
          Sala de Espera Online
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
          VILA DAS OVELHAS
        </h2>
        <p className="text-xs font-mono text-neutral-600">
          Cada jogador utiliza seu próprio celular • Decisões simultâneas
        </p>

        {/* Room Code Click-to-Copy */}
        <div className="pt-2 flex items-center justify-center gap-2">
          <div className="border-2 border-black rounded-2xl px-4 py-2 bg-neutral-50 flex items-center gap-3 shadow-xs">
            <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold">
              Código da Sala:
            </span>
            <span className="text-lg font-mono font-black tracking-widest text-black">
              {roomCode}
            </span>
            <button
              onClick={handleCopyCode}
              title="Copiar Código"
              className="p-1 border border-black rounded-lg hover:bg-black hover:text-white transition-colors cursor-pointer"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>
        </div>

        {/* Banner de Perfil & Customização do Avatar do Jogador */}
        <div className="pt-1.5 max-w-md mx-auto">
          <div className="border-2 border-black rounded-2xl p-2.5 bg-white flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <PersonAvatar
                avatar={activePlayer.avatar}
                color={activePlayer.color || '#F59E0B'}
                seed={activePlayer.name}
                size={42}
                className="border-2 border-black shrink-0"
              />
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-xs truncate text-black">{activePlayer.name}</span>
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                    style={{ backgroundColor: activePlayer.color || '#F59E0B' }}
                    title="Cor do seu personagem"
                  />
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-300">
                    Você
                  </span>
                </div>
                <p className="text-[10px] text-neutral-500 font-mono truncate">
                  Personalize rosto, acessórios e sua cor
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  const otherColors = players
                    .filter(p => p.id !== activePlayer.id)
                    .map(p => p.color)
                    .filter((c): c is string => Boolean(c));
                  const randomColor = pickRandomAvailableColor(undefined, otherColors).color;
                  const randomAvatar = encodeAvatar(generateRandomCharacterConfig());
                  try {
                    localStorage.setItem('custom_avatar_data', randomAvatar);
                    localStorage.setItem('custom_avatar_color', randomColor);
                  } catch {}
                  onUpdateProfile?.(randomAvatar, randomColor);
                }}
                title="Gerar Avatar e Cor Aleatórios"
                className="py-1.5 px-2.5 bg-amber-300 hover:bg-amber-400 border-2 border-black text-black rounded-xl text-[10px] font-mono font-black uppercase tracking-wider transition-transform active:scale-95 flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <span>🎲 Aleatório</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsAvatarModalOpen(true);
                }}
                className="py-1.5 px-3 bg-black text-white rounded-xl text-[10px] font-mono font-black uppercase tracking-wider hover:bg-neutral-800 transition-transform active:scale-95 flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Sparkles size={12} className="text-amber-400" />
                <span>Avatar & Cor</span>
              </button>
            </div>
          </div>
        </div>

        {/* Tabs de navegação entre o Minigame do Pasto e a Lista da Sala */}
        <div className="pt-1 max-w-md mx-auto">
          <div className="flex bg-neutral-100 p-1 rounded-2xl border-2 border-black gap-1 shadow-xs">
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('corral');
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'corral'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
              }`}
            >
              <span>🪵 Aprisco do Rebanho</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${activeTab === 'corral' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                MEH! 🐑
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                sounds.playClick();
                setActiveTab('roster');
              }}
              className={`flex-1 py-2 px-2.5 rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'roster'
                  ? 'bg-black text-white shadow-xs'
                  : 'text-neutral-600 hover:text-black hover:bg-neutral-200'
              }`}
            >
              <Users size={14} />
              <span>Membros ({players.length}/16)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ABA 1: O CERCADO DAS OVELHAS (MINIGAME DE ESPERA) */}
      {activeTab === 'corral' && (
        <div className="w-full space-y-2 animate-fadeIn">
          <SheepCorralWaiting
            currentPlayer={activePlayer}
            allPlayers={players.length > 0 ? players : [activePlayer]}
            title="Aprisco da Vila"
            subtitle="Toque em qualquer lugar na tela para sua ovelhinha caminhar e aperte 'MEH'!"
            waitingCountText={`${players.length}/16 ovelhas`}
            isNight={false}
            onSendSheepEvent={onSendSheepEvent}
            incomingSheepEvent={incomingSheepEvent}
            syncedSheepMap={syncedSheepMap}
          />

          {/* Barra de Acesso Rápido a Membros no Pasto */}
          <div className="flex items-center justify-between p-2 bg-neutral-50 border-2 border-black rounded-2xl text-xs font-mono">
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-[230px] sm:max-w-xs py-0.5">
              {players.map(p => (
                <span
                  key={p.id}
                  title={`${p.name} ${p.isHost ? '(Host)' : ''}`}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 flex items-center gap-1 ${
                    p.id === activePlayer.id
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-black border-black/30'
                  }`}
                >
                  <PersonAvatar
                    avatar={p.avatar}
                    color={p.color || '#F59E0B'}
                    seed={p.name}
                    size={16}
                    className="border border-black/30 shrink-0"
                  />
                  <span>{p.name}</span>
                </span>
              ))}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab('roster')}
                className="py-1 px-2.5 border border-black bg-white rounded-xl text-[10px] font-bold hover:bg-neutral-100 cursor-pointer"
              >
                Ver Lista ({players.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: LISTA DE MEMBROS REUNIDOS E DETALHES */}
      {activeTab === 'roster' && (
        <div className="flex-1 flex flex-col space-y-2 animate-fadeIn">
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
              <Users size={14} />
              <span>Membros Reunidos ({players.length}/16)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1.5 border-2 border-black rounded-2xl bg-neutral-50">
            {players.map(p => {
              const isMe = p.id === activePlayer.id;

              return (
                <div
                  key={p.id}
                  className={`p-2 bg-white border rounded-xl flex items-center justify-between font-mono text-xs shadow-2xs transition-all ${
                    isMe ? 'border-2 border-black' : 'border-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate min-w-0">
                    <PersonAvatar
                      avatar={p.avatar}
                      color={p.color || '#F59E0B'}
                      seed={p.name}
                      size={24}
                      className="border border-black/30 shrink-0"
                    />
                    <span className="font-bold truncate text-[11px]">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isMe && (
                      <span className="text-[8px] bg-amber-500 text-black px-1 rounded font-mono font-black">
                        Você
                      </span>
                    )}
                    {p.isHost && (
                      <span className="text-[8px] bg-black text-white px-1 py-0.2 rounded font-mono font-bold">
                        Host
                      </span>
                    )}
                    {p.isBot && (
                      <span className="text-[8px] bg-neutral-200 text-black px-1 rounded font-mono">
                        Bot
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('corral')}
            className="w-full py-2 bg-amber-50 border-2 border-amber-500 text-amber-950 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-amber-100 transition-colors cursor-pointer"
          >
            <span>🌾 Voltar para o Pasto das Ovelhas ("MEH!")</span>
          </button>
        </div>
      )}

      {/* Host Controls */}
      <div className="space-y-2 pt-1">
        {isHost && (
          <div className="space-y-2">
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => handleAddBotClick(1)}
                disabled={isBotBusy || players.length >= 16}
                className="flex-1 min-w-[70px] py-2 px-2 border-2 border-black rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1 hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <Bot size={13} /> +1 Bot
              </button>
              <button
                onClick={() => handleAddBotClick(3)}
                disabled={isBotBusy || players.length >= 14}
                className="flex-1 min-w-[70px] py-2 px-2 border-2 border-black rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1 hover:bg-neutral-100 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <UserPlus size={13} /> +3 Bots
              </button>
              {players.some(p => p.isBot) && onRemoveBot && (
                <button
                  onClick={handleRemoveBotClick}
                  disabled={isBotBusy}
                  className="py-2 px-2.5 border-2 border-red-800 text-red-800 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1 hover:bg-red-50 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Remover último bot adicionado"
                >
                  <Minus size={13} /> Bot
                </button>
              )}
              <button
                onClick={() => setShowConfigModal(true)}
                className="py-2 px-3 border-2 border-black bg-neutral-100 rounded-xl text-[10px] font-mono font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-black hover:text-white transition-colors cursor-pointer"
                title="Configurar Baralho, Tempo e Modificadores"
              >
                <Sliders size={13} />
                <span>Configurar</span>
              </button>
            </div>
          </div>
        )}

        {/* Local mode fallback option */}
        <button
          onClick={onSwitchToLocalMode}
          className="w-full py-2 border-2 border-black rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 text-neutral-800 hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <Phone size={13} />
          <span>Passar o Celular (Modo Local Offline)</span>
        </button>

        {/* Start Game Button */}
        {isHost ? (
          <button
            onClick={handleStart}
            disabled={players.length < 5}
            className={`w-full py-3.5 rounded-full flex items-center justify-center space-x-2 text-xs font-mono font-black uppercase tracking-widest transition-transform cursor-pointer ${
              players.length >= 5
                ? 'bg-black text-white active:scale-95 shadow-md hover:bg-neutral-800'
                : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <FourPointStar size={14} />
            <span>
              {players.length >= 5
                ? 'INICIAR PARTIDA ONLINE'
                : `ADICIONE MAIS ${5 - players.length} JOGADORES/BOTS`}
            </span>
            <FourPointStar size={14} />
          </button>
        ) : (
          <div className="text-center py-3 border-2 border-black rounded-full bg-neutral-100 text-xs font-mono font-bold text-neutral-700">
            Aguardando o anfitrião configurar e iniciar a partida... (Divirta-se no pasto!)
          </div>
        )}

        {/* Sair da Sala com Confirmação em 2 Etapas */}
        {showLeaveConfirm ? (
          <div className="p-3 bg-amber-50 border-2 border-amber-600 rounded-2xl space-y-2 animate-fadeIn text-left font-mono">
            <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs">
              <AlertTriangle size={15} className="text-amber-700" />
              <span>TEM CERTEZA QUE DESEJA SAIR?</span>
            </div>
            <p className="text-[10px] text-amber-800 leading-tight">
              {isHost
                ? 'Como anfitrião, se você sair da sala, outro jogador online conectado será sorteado aleatoriamente para assumir como o novo anfitrião.'
                : 'Você deixará a sala de espera do rebanho.'}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowLeaveConfirm(false)}
                disabled={isLeaving}
                className="flex-1 py-1.5 px-2 border border-neutral-400 bg-white rounded-xl text-[10px] font-bold uppercase hover:bg-neutral-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  sounds.playClick();
                  setIsLeaving(true);
                  setTimeout(() => {
                    if (onLeaveRoom) onLeaveRoom();
                  }, 250);
                }}
                disabled={isLeaving}
                className={`flex-1 py-1.5 px-2 rounded-xl text-[10px] font-bold uppercase transition-all flex items-center justify-center gap-1 shadow-xs ${
                  isLeaving
                    ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {isLeaving ? (
                  <>
                    <Check size={12} />
                    <span>Saindo... ✓</span>
                  </>
                ) : (
                  'Sim, Sair da Sala'
                )}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              setShowLeaveConfirm(true);
            }}
            className="w-full py-2 border border-neutral-400 bg-white rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-600 hover:text-red-700 hover:border-red-400 flex items-center justify-center gap-1.5 transition-colors"
          >
            <LogOut size={13} />
            <span>Sair da Sala {isHost && '(Passar Liderança)'}</span>
          </button>
        )}
      </div>

      {/* MODAL DE CONFIGURAÇÃO IGUAL AO MULTIPLAYER LOCAL */}
      {showConfigModal && isHost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg max-h-[92vh] bg-white border-2 border-black rounded-3xl shadow-2xl flex flex-col overflow-hidden font-mono text-black">
            {/* Modal Header */}
            <div className="p-4 border-b-2 border-black flex items-center justify-between bg-neutral-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
                  <Sliders size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase font-sans">
                    Configuração da Partida Online
                  </h3>
                  <span className="text-[10px] text-neutral-500 font-bold">
                    {totalPlayers} Jogadores na Sala • Ajuste o Baralho e Regras
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowConfigModal(false)}
                className="p-1.5 rounded-lg border border-black/30 hover:bg-neutral-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {configError && (
                <div className="p-3 bg-red-50 border-2 border-red-600 rounded-xl text-red-900 text-xs font-bold flex items-center justify-between animate-fadeIn">
                  <span>{configError}</span>
                  <button
                    onClick={() => setConfigError(null)}
                    className="ml-2 w-5 h-5 border border-red-400 rounded-full flex items-center justify-center font-black text-xs hover:bg-red-200"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Summary Counter Bar */}
              <div
                className={`p-3 rounded-2xl border-2 flex items-center justify-between text-xs ${
                  remainingSlots === 0
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                    : 'border-amber-500 bg-amber-50 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {remainingSlots === 0 ? <ShieldCheck size={18} /> : <ShieldAlert size={18} />}
                  <div>
                    <div className="font-bold">
                      {remainingSlots === 0
                        ? 'Baralho Balanceado com Sucesso!'
                        : remainingSlots > 0
                        ? `Faltam ${remainingSlots} carta(s) para completar`
                        : `Excesso de ${Math.abs(remainingSlots)} carta(s)`}
                    </div>
                    <div className="text-[10px] text-neutral-600">
                      Total de cartas: {totalAllocated} / {totalPlayers} jogadores
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleResetRecommended}
                  className="px-2.5 py-1 text-[10px] border border-black bg-white rounded-lg uppercase font-bold hover:bg-black hover:text-white transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={11} /> Padrão
                </button>
              </div>

              {/* Roles Breakdown */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider block text-neutral-700">
                  Composição de Papéis do Baralho
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {(Object.keys(ROLES_METADATA) as Role[]).map(roleKey => {
                    const meta = ROLES_METADATA[roleKey];
                    const count = roleCounts[roleKey] || 0;
                    const isSoldado = roleKey === 'SOLDADO';

                    return (
                      <div
                        key={roleKey}
                        className={`p-2.5 border-2 rounded-xl flex items-center justify-between transition-colors ${
                          count > 0
                            ? 'border-black bg-white shadow-2xs'
                            : 'border-neutral-300 bg-neutral-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <RoleIllustration role={roleKey} className="w-8 h-8 flex-shrink-0" />
                          <div className="truncate">
                            <div className="font-bold text-xs truncate flex items-center gap-1">
                              <span>{meta.name}</span>
                              {isSoldado && (
                                <span className="text-[9px] bg-red-100 text-red-800 px-1 rounded font-bold">
                                  Máx: {maxAllowedSoldiers}
                                </span>
                              )}
                            </div>
                            <span className="text-[9px] text-neutral-500 block truncate">
                              {meta.team === 'SOLDADOS' ? 'Infiltrado' : 'Rebanho'}
                            </span>
                          </div>
                        </div>

                        {/* Plus / Minus Buttons */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => handleRoleCountChange(roleKey, -1)}
                            disabled={count <= 0}
                            className={`w-7 h-7 border border-black rounded-lg flex items-center justify-center font-bold ${
                              count <= 0
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-neutral-200 active:scale-95'
                            }`}
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center font-bold text-sm">{count}</span>
                          <button
                            onClick={() => handleRoleCountChange(roleKey, 1)}
                            disabled={isSoldado && count >= maxAllowedSoldiers}
                            className={`w-7 h-7 border border-black rounded-lg flex items-center justify-center font-bold ${
                              isSoldado && count >= maxAllowedSoldiers
                                ? 'opacity-30 cursor-not-allowed'
                                : 'hover:bg-neutral-200 active:scale-95'
                            }`}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Modificadores / Cards Especiais */}
              <div className="space-y-2 p-3 bg-neutral-50 border-2 border-black rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider block text-neutral-800 flex items-center gap-1">
                  <Sparkles size={14} />
                  <span>Modificadores & Cards Especiais (Sorteio Secundário)</span>
                </span>
                <p className="text-[10px] text-neutral-600">
                  Sorteados de forma independente. O Anjo e o Espião nunca caem para o mesmo jogador.
                </p>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center justify-between p-2 bg-white border border-neutral-300 rounded-xl cursor-pointer">
                    <div>
                      <div className="text-xs font-bold">Falso Profeta (Soldados)</div>
                      <div className="text-[10px] text-neutral-500">
                        Na 1ª investigação aparece como Ovelha; na 2ª revela ser Soldado.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={modifiersConfig.falsoProfeta}
                      onChange={e =>
                        setModifiersConfig(prev => ({ ...prev, falsoProfeta: e.target.checked }))
                      }
                      className="w-4 h-4 accent-black rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white border border-neutral-300 rounded-xl cursor-pointer">
                    <div>
                      <div className="text-xs font-bold">Espião (Ovelhas)</div>
                      <div className="text-[10px] text-neutral-500">
                        Descobre a função exata de 1 jogador a qualquer momento (uso único).
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={modifiersConfig.espiao}
                      onChange={e =>
                        setModifiersConfig(prev => ({ ...prev, espiao: e.target.checked }))
                      }
                      className="w-4 h-4 accent-black rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between p-2 bg-white border border-neutral-300 rounded-xl cursor-pointer">
                    <div>
                      <div className="text-xs font-bold">Anjo (Ovelhas)</div>
                      <div className="text-[10px] text-neutral-500">
                        Pode se sacrificar à noite para salvar quem morreria (uso único).
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={modifiersConfig.anjo}
                      onChange={e =>
                        setModifiersConfig(prev => ({ ...prev, anjo: e.target.checked }))
                      }
                      className="w-4 h-4 accent-black rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Discussion Timer Configuration */}
              <div className="space-y-2 p-3 bg-neutral-50 border-2 border-black rounded-2xl">
                <span className="text-xs font-bold uppercase tracking-wider block text-neutral-800 flex items-center gap-1">
                  <Clock size={14} />
                  <span>Duração do Debate da Assembleia</span>
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[60, 90, 120, 180].map(sec => (
                    <button
                      key={sec}
                      onClick={() => {
                        sounds.playClick();
                        setDiscussionSeconds(sec);
                      }}
                      className={`py-2 px-1 border-2 rounded-xl text-xs font-bold uppercase transition-colors ${
                        discussionSeconds === sec
                          ? 'border-black bg-black text-white shadow-xs'
                          : 'border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {sec / 60} {sec === 60 ? 'minuto' : 'minutos'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Extra Rules Checkboxes */}
              <div className="space-y-1.5 p-3 bg-neutral-50 border-2 border-black rounded-2xl text-xs">
                <span className="text-xs font-bold uppercase tracking-wider block text-neutral-800">
                  Regras Adicionais
                </span>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Revelar Papel ao Morrer:</span>
                  <input
                    type="checkbox"
                    checked={config.revealRolesOnDeath}
                    onChange={e => onUpdateConfig({ revealRolesOnDeath: e.target.checked })}
                    className="w-4 h-4 accent-black rounded"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span>Pastor Pode se Autoproteger:</span>
                  <input
                    type="checkbox"
                    checked={config.pastorCanSelfProtect}
                    onChange={e => onUpdateConfig({ pastorCanSelfProtect: e.target.checked })}
                    className="w-4 h-4 accent-black rounded"
                  />
                </label>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t-2 border-black flex gap-2 bg-neutral-50">
              <button
                onClick={() => setShowConfigModal(false)}
                className="flex-1 py-3 border-2 border-black bg-white rounded-xl text-xs font-bold uppercase hover:bg-neutral-100 transition-colors"
              >
                Salvar e Fechar
              </button>
              <button
                onClick={handleConfirmAndStart}
                disabled={remainingSlots !== 0}
                className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors ${
                  remainingSlots === 0
                    ? 'bg-black text-white hover:bg-neutral-800 shadow-md'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <span>Confirmar e Iniciar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Personalização de Avatar & Cor */}
      <AvatarCustomizerModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
        avatar={activePlayer.avatar}
        color={activePlayer.color || '#F59E0B'}
        playerName={activePlayer.name}
        takenColors={players
          .filter(p => p.id !== activePlayer.id)
          .map(p => p.color)
          .filter((c): c is string => Boolean(c))}
        onSave={(newAvatar, newColor) => {
          onUpdateProfile?.(newAvatar, newColor);
        }}
      />
    </div>
  );
};
