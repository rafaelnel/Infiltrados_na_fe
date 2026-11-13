import React from 'react';
import { RoomState, Player, GameLog } from '../types/game';
import { SheepCorralWaiting, SheepEventData, SyncedSheepData } from './SheepCorralWaiting';
import { BallotBoxReveal } from './BallotBoxReveal';
import { PersonAvatar } from './PersonAvatar';
import {
  Tv,
  Moon,
  Sun,
  Scale,
  Trophy,
  Newspaper,
  Users,
  Clock,
  SkipForward,
  RotateCcw,
  Skull,
  Shield,
  Sparkles,
  CheckCircle2,
  Radio,
} from 'lucide-react';

interface HostSpectatorViewProps {
  roomData: RoomState;
  playablePlayers: Player[];
  onlineDiscussionSeconds: number;
  revealedResultDay: number | null;
  onCompleteBallotReveal: (day: number) => void;
  onAdvancePhase: () => void;
  onResetToLobby: () => void;
  incomingSheepEvent: SheepEventData | null;
  syncedSheepMap: Record<string, SyncedSheepData>;
}

export const HostSpectatorView: React.FC<HostSpectatorViewProps> = ({
  roomData,
  playablePlayers,
  onlineDiscussionSeconds,
  revealedResultDay,
  onCompleteBallotReveal,
  onAdvancePhase,
  onResetToLobby,
  incomingSheepEvent,
  syncedSheepMap,
}) => {
  const alivePlayers = playablePlayers.filter((p) => p.isAlive);
  const deadPlayers = playablePlayers.filter((p) => !p.isAlive);

  // Calcula o progresso público da fase entre os jogadores ativos
  const getPhaseProgress = () => {
    if (roomData.phase === 'ROLE_REVEAL') {
      const confirmed = playablePlayers.filter((p) => p.hasConfirmedRole).length;
      return {
        readyCount: confirmed,
        totalCount: playablePlayers.length,
        label: 'confirmaram identidade',
        isReadyCheck: (p: Player) => Boolean(p.hasConfirmedRole),
      };
    }
    if (roomData.phase === 'NIGHT') {
      const acted = alivePlayers.filter((p) => p.hasActedTonight).length;
      return {
        readyCount: acted,
        totalCount: alivePlayers.length,
        label: 'concluíram a noite',
        isReadyCheck: (p: Player) => Boolean(p.hasActedTonight),
      };
    }
    if (roomData.phase === 'DAY_ANNOUNCEMENT' || roomData.phase === 'DAY_DISCUSSION') {
      const ready = alivePlayers.filter((p) => p.hasApprovedPhase).length;
      return {
        readyCount: ready,
        totalCount: alivePlayers.length,
        label: roomData.phase === 'DAY_ANNOUNCEMENT' ? 'leram o boletim' : 'prontos p/ votar',
        isReadyCheck: (p: Player) => Boolean(p.hasApprovedPhase),
      };
    }
    if (roomData.phase === 'DAY_VOTING') {
      const voted = alivePlayers.filter((p) => p.voteTargetId !== null).length;
      return {
        readyCount: voted,
        totalCount: alivePlayers.length,
        label: 'votaram na urna',
        isReadyCheck: (p: Player) => p.voteTargetId !== null,
      };
    }
    if (roomData.phase === 'DAY_RESULT') {
      const ready = alivePlayers.filter((p) => p.hasApprovedPhase).length;
      return {
        readyCount: ready,
        totalCount: alivePlayers.length,
        label: 'prontos p/ anoitecer',
        isReadyCheck: (p: Player) => Boolean(p.hasApprovedPhase),
      };
    }
    return {
      readyCount: null,
      totalCount: alivePlayers.length,
      label: 'Partida encerrada',
      isReadyCheck: () => false,
    };
  };

  const progress = getPhaseProgress();

  const phaseMeta = (() => {
    switch (roomData.phase) {
      case 'ROLE_REVEAL':
        return {
          badge: `PREPARAÇÃO • DIA ${roomData.dayNumber}`,
          title: 'Revelação de Identidades nos Celulares',
          subtitle: 'Os jogadores estão conferindo seus papéis secretos em seus próprios aparelhos.',
          icon: <Sparkles className="w-5 h-5 text-amber-300" />,
          theme: 'from-stone-900 via-stone-800 to-amber-950 border-amber-500/50 text-amber-50',
        };
      case 'NIGHT':
        return {
          badge: `${roomData.dayNumber}ª NOITE`,
          title: 'A Vila Dorme... Silêncio na Congregação',
          subtitle: 'Soldados, Pastor, Profeta, Evangelista e Apóstolo realizam ações secretas na madrugada.',
          icon: <Moon className="w-5 h-5 text-indigo-300" />,
          theme: 'from-indigo-950 via-slate-900 to-stone-950 border-indigo-400/50 text-indigo-50',
        };
      case 'DAY_ANNOUNCEMENT':
        return {
          badge: `MANHÃ DO ${roomData.dayNumber}º DIA`,
          title: 'O Sol Nasce na Vila • Boletim Matinal',
          subtitle: 'Confira os acontecimentos da madrugada antes do início da Assembleia.',
          icon: <Sun className="w-5 h-5 text-amber-400" />,
          theme: 'from-amber-900 via-stone-900 to-stone-950 border-amber-500/60 text-amber-50',
        };
      case 'DAY_DISCUSSION':
        return {
          badge: `ASSEMBLEIA • ${roomData.dayNumber}º DIA`,
          title: 'Debate Aberto na Congregação',
          subtitle: 'Momento de ouvir testemunhos, analisar suspeitas e defender a comunidade.',
          icon: <Sun className="w-5 h-5 text-amber-400" />,
          theme: 'from-amber-800 via-stone-900 to-stone-950 border-amber-500/60 text-amber-50',
        };
      case 'DAY_VOTING':
        return {
          badge: `TRIBUNAL • ${roomData.dayNumber}º DIA`,
          title: 'Votação Aberta na Urna da Vila',
          subtitle: 'Cada irmão vivo está registrando seu voto secreto pelo celular.',
          icon: <Scale className="w-5 h-5 text-red-400" />,
          theme: 'from-red-950 via-stone-900 to-stone-950 border-red-500/50 text-red-50',
        };
      case 'DAY_RESULT':
        return {
          badge: `VEREDITO • ${roomData.dayNumber}º DIA`,
          title: 'Resultado do Julgamento da Vila',
          subtitle: 'A urna foi apurada. Veja a decisão da Assembleia antes do cair da noite.',
          icon: <Scale className="w-5 h-5 text-amber-300" />,
          theme: 'from-stone-900 via-red-950 to-stone-950 border-amber-500/50 text-amber-50',
        };
      case 'GAME_OVER':
      default:
        return {
          badge: 'FIM DA PARTIDA',
          title:
            roomData.winner === 'OVELHAS'
              ? 'Vitória das Ovelhas Fiéis!'
              : 'Os Soldados Dominaram a Vila!',
          subtitle:
            roomData.winner === 'OVELHAS'
              ? 'A luz prevaleceu e todos os infiltrados foram descobertos ou convertidos!'
              : 'Os infiltrados assumiram o controle da congregação.',
          icon: <Trophy className="w-5 h-5 text-amber-300" />,
          theme:
            roomData.winner === 'OVELHAS'
              ? 'from-amber-700 via-amber-900 to-stone-950 border-amber-400 text-amber-50'
              : 'from-red-900 via-red-950 to-stone-950 border-red-500 text-red-50',
        };
    }
  })();

  const latestLog: GameLog | undefined =
    roomData.logs.length > 0 ? roomData.logs[roomData.logs.length - 1] : undefined;

  const latestHeadline =
    latestLog?.text ||
    'A partida começou! Olhem para seus celulares para conferir suas funções na vila.';

  const reversedLogs = [...roomData.logs].reverse();

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const waitingCountText =
    progress.readyCount !== null
      ? `${progress.readyCount}/${progress.totalCount} ${progress.label}`
      : progress.label;

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col justify-between gap-2 p-1.5 sm:p-2.5 select-none overflow-y-auto lg:overflow-hidden">
      {/* Top Broadcast Header */}
      <div
        className={`w-full rounded-2xl bg-gradient-to-r ${phaseMeta.theme} border-2 p-2.5 sm:px-4 sm:py-2.5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0`}
      >
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 rounded-xl bg-black/35 border border-white/15 shrink-0 flex items-center justify-center relative">
            {phaseMeta.icon}
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/25 border border-emerald-400/50 text-emerald-300 text-[9px] font-mono font-black uppercase tracking-widest">
                <Tv className="w-3 h-3" /> TELÃO GLOBAL • APENAS VISUALIZAÇÃO
              </span>
              <span className="text-[9px] font-mono font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-white/15 text-white">
                {phaseMeta.badge}
              </span>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-black/40 text-amber-300 border border-amber-400/30">
                SALA: {roomData.code}
              </span>
            </div>
            <h1 className="text-sm sm:text-lg font-black uppercase tracking-tight text-white mt-0.5 leading-tight">
              {phaseMeta.title}
            </h1>
            <p className="text-[10px] sm:text-xs font-mono text-white/80 leading-tight">
              {phaseMeta.subtitle}
            </p>
          </div>
        </div>

        {/* Right Status / Timer / Counter */}
        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          {roomData.phase === 'DAY_DISCUSSION' && (
            <div
              className={`px-3 py-1 rounded-xl border-2 flex items-center gap-1.5 font-mono font-black text-xs sm:text-sm shadow-inner ${
                onlineDiscussionSeconds <= 30
                  ? 'bg-red-950/90 border-red-400 text-red-200 animate-pulse'
                  : 'bg-black/45 border-amber-400/50 text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTimer(onlineDiscussionSeconds)}</span>
            </div>
          )}

          {progress.readyCount !== null ? (
            <div className="px-3 py-1 rounded-xl bg-black/40 border border-white/20 text-right font-mono">
              <div className="text-xs sm:text-sm font-black text-amber-300 leading-none">
                {progress.readyCount} / {progress.totalCount}
              </div>
              <div className="text-[8px] uppercase tracking-wider text-white/75 font-bold mt-0.5">
                {progress.label}
              </div>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-black/40 border border-white/20 flex items-center gap-1.5 font-mono">
              <Radio className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span className="text-[10px] font-bold text-amber-200">{progress.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main 2-Column Global Dashboard */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
        {/* Left Column (7 cols): Live Sheep Corral + Community Roster */}
        <div className="lg:col-span-7 flex flex-col justify-between gap-2 min-h-0">
          {/* Cercado Global Ao Vivo */}
          <div className="flex-1 min-h-0 flex flex-col justify-center">
            <SheepCorralWaiting
              allPlayers={playablePlayers}
              title="Cercado Global da Vila (Ao Vivo)"
              subtitle={
                roomData.phase === 'NIGHT'
                  ? 'Madrugada na Vila: ovelhas recolhidas enquanto ações secretas acontecem'
                  : 'Acompanhe as ovelhas caminhando e balindo "MEH!" em tempo real!'
              }
              waitingCountText={waitingCountText}
              isNight={roomData.phase === 'NIGHT'}
              isSpectatorView={true}
              incomingSheepEvent={incomingSheepEvent}
              syncedSheepMap={syncedSheepMap}
            />
          </div>

          {/* Painel de Irmãos da Congregação (Vivos x Eliminados) */}
          <div className="bg-white border-2 border-black rounded-2xl p-2.5 shadow-xs shrink-0">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-black" />
                <h2 className="text-[11px] font-mono font-black uppercase tracking-wider text-black">
                  Jogadores na Partida ({playablePlayers.length})
                </h2>
              </div>
              <div className="flex items-center gap-1.5 text-[9px] font-mono font-bold">
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-500">
                  🐑 {alivePlayers.length} Vivos
                </span>
                {deadPlayers.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-500">
                    💀 {deadPlayers.length} Eliminados
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 max-h-28 overflow-y-auto pr-0.5">
              {playablePlayers.map((p) => {
                const isReady = progress.isReadyCheck(p);
                const showRoleOnEnd =
                  roomData.phase === 'GAME_OVER' ||
                  (!p.isAlive && roomData.config.revealRolesOnDeath);

                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between px-2 py-1 rounded-xl border text-left font-mono transition-all ${
                      p.isAlive
                        ? 'bg-neutral-50 border-black/30 text-black'
                        : 'bg-red-50/60 border-red-300 text-neutral-400 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <PersonAvatar
                        avatar={p.avatar}
                        color={p.color || '#F59E0B'}
                        seed={p.name}
                        size={22}
                        className="border border-black/40 shrink-0"
                      />
                      <div className="min-w-0">
                        <p
                          className={`text-[10px] font-bold truncate leading-tight ${
                            !p.isAlive ? 'line-through text-red-800/80' : 'text-black'
                          }`}
                        >
                          {p.name}
                        </p>
                        <p className="text-[8px] text-neutral-500 truncate leading-none mt-0.5">
                          {showRoleOnEnd && p.role
                            ? p.role
                            : p.isAlive
                            ? 'Vivo'
                            : 'Eliminado'}
                        </p>
                      </div>
                    </div>

                    {p.isAlive && progress.readyCount !== null && (
                      <span
                        title={isReady ? 'Confirmado / Pronto' : 'Aguardando...'}
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          isReady ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-400'
                        }`}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Featured Headline + News Feed + Host Controls */}
        <div className="lg:col-span-5 flex flex-col justify-between gap-2 min-h-0">
          {/* Destaque Principal / Manchete da Rodada */}
          {roomData.phase === 'DAY_RESULT' && revealedResultDay !== roomData.dayNumber ? (
            <div className="bg-white border-2 border-black rounded-2xl p-2.5 shadow-md">
              <BallotBoxReveal
                dayNumber={roomData.dayNumber}
                logText={latestHeadline}
                onComplete={() => onCompleteBallotReveal(roomData.dayNumber)}
              />
            </div>
          ) : (
            <div
              className={`border-3 border-black rounded-2xl p-3 shadow-md relative overflow-hidden shrink-0 ${
                latestHeadline.includes('ELIMINADO') ||
                latestHeadline.includes('exilado') ||
                latestHeadline.includes('TRAGÉDIA')
                  ? 'bg-red-950 text-white'
                  : latestHeadline.includes('PROTEGIDO') || latestHeadline.includes('SALVO')
                  ? 'bg-amber-400 text-black'
                  : 'bg-stone-900 text-amber-50'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5 font-mono">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
                    latestHeadline.includes('PROTEGIDO') || latestHeadline.includes('SALVO')
                      ? 'bg-black text-amber-300 border-black'
                      : 'bg-amber-400 text-black border-amber-300'
                  }`}
                >
                  <Newspaper className="w-3 h-3" /> ÚLTIMA MANCHETE DA VILA
                </span>
                <span className="text-[10px] font-bold opacity-80 uppercase">
                  Dia {roomData.dayNumber}
                </span>
              </div>

              <div
                className={`p-2.5 rounded-xl border-2 shadow-inner font-mono ${
                  latestHeadline.includes('PROTEGIDO') || latestHeadline.includes('SALVO')
                    ? 'bg-white text-black border-black'
                    : 'bg-black/45 text-white border-white/20'
                }`}
              >
                <p className="text-xs sm:text-sm font-black leading-snug tracking-wide">
                  {latestHeadline}
                </p>
              </div>

              {deadPlayers.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[9px] font-mono font-bold">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-900/80 border border-red-400/40 text-red-100">
                    <Skull className="w-3 h-3 text-red-300" /> Baixas até agora:{' '}
                    {deadPlayers.map((d) => d.name).join(', ')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mural Cronológico de Notícias e Atualizações */}
          <div className="bg-white border-2 border-black rounded-2xl p-2.5 shadow-xs flex-1 flex flex-col min-h-[140px] overflow-hidden">
            <div className="flex items-center justify-between mb-1.5 shrink-0 font-mono">
              <div className="flex items-center gap-1.5">
                <Newspaper className="w-3.5 h-3.5 text-black" />
                <h3 className="text-[11px] font-black uppercase tracking-wider text-black">
                  Notícias e Atualizações da Vila
                </h3>
              </div>
              <span className="text-[9px] font-bold text-neutral-500">
                {roomData.logs.length} {roomData.logs.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 font-mono">
              {reversedLogs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-4 text-xs text-neutral-400 italic">
                  Nenhuma notícia pública registrada ainda.
                </div>
              ) : (
                reversedLogs.map((log, index) => {
                  const isLatest = index === 0;
                  const txt = log.text || '';
                  const isDeathOrAttack =
                    log.type === 'DEATH' ||
                    txt.toLowerCase().includes('eliminad') ||
                    txt.toLowerCase().includes('exilad');
                  const isSavedOrProtected =
                    log.type === 'CONVERSION' ||
                    txt.includes('PROTEGIDO') ||
                    txt.includes('SALVO') ||
                    txt.includes('Milagre');

                  return (
                    <div
                      key={log.id || index}
                      className={`p-2 rounded-xl border-2 text-[11px] leading-snug transition-all ${
                        isLatest
                          ? 'bg-amber-100 border-black text-black font-black shadow-2xs'
                          : isDeathOrAttack
                          ? 'bg-red-50 border-red-300 text-red-950 font-bold'
                          : isSavedOrProtected
                          ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold'
                          : 'bg-neutral-50 border-neutral-200 text-neutral-800'
                      }`}
                    >
                      <div className="flex items-start gap-1.5">
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-black text-white shrink-0 mt-0.5">
                          D{log.dayNumber || 1}
                        </span>
                        <p className="flex-1">{txt}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Controles do Host (Moderador do Telão) */}
          <div className="bg-neutral-100 border-2 border-black rounded-2xl p-2 flex items-center justify-between gap-2 shrink-0 font-mono">
            <div className="flex items-center gap-1.5 min-w-0">
              <Shield className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="text-[10px] font-bold text-neutral-700 truncate">
                Modo Telão Ativo (Host Não Joga)
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {roomData.phase !== 'GAME_OVER' && (
                <button
                  type="button"
                  onClick={onAdvancePhase}
                  title="Avançar fase manualmente caso algum celular tenha desconectado"
                  className="px-2.5 py-1.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-[10px] font-bold uppercase flex items-center gap-1 shadow-xs cursor-pointer transition-colors"
                >
                  <SkipForward className="w-3 h-3" />
                  <span>Avançar Fase</span>
                </button>
              )}
              <button
                type="button"
                onClick={onResetToLobby}
                title="Encerrar partida ou voltar ao Lobby"
                className="px-2.5 py-1.5 rounded-xl border-2 border-black bg-white hover:bg-neutral-200 text-black text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Voltar ao Lobby</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
