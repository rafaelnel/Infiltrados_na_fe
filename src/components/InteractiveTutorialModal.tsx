import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { sounds } from '../utils/audio';
import { FourPointStar, RoleIllustration } from './RoleIllustrations';
import { PersonAvatar } from './PersonAvatar';
import { Role, Team } from '../types/game';
import {
  GraduationCap,
  X,
  ArrowRight,
  ArrowLeft,
  Check,
  Sparkles,
  Users,
  Bot,
  Plus,
  Minus,
  Settings,
  Shield,
  Moon,
  Sun,
  Scale,
  Clock,
  MessageSquare,
  HelpCircle,
  Eye,
  Crosshair,
  Crown,
  ChevronRight,
  RotateCcw,
} from 'lucide-react';

export type TutorialTab = 'LOBBY' | 'NIGHT' | 'VOTING';

interface TooltipStep {
  id: string;
  targetKey: string;
  title: string;
  badge: string;
  description: string;
  actionHint?: string;
  position: 'top' | 'bottom' | 'center';
}

const LOBBY_STEPS: TooltipStep[] = [
  {
    id: 'lobby_code',
    targetKey: 'code_box',
    title: 'Código da Sala & Convite',
    badge: '1. Entrada',
    description:
      'Cada sala tem um código único de 5 letras. Envie este código para seus amigos entrarem pelo celular ou computador sem precisar instalar nada.',
    actionHint: 'Compartilhe o código para jogar com 5 a 16 irmãos!',
    position: 'bottom',
  },
  {
    id: 'lobby_roster',
    targetKey: 'roster_box',
    title: 'Participantes & Bots Virtuais',
    badge: '2. Rebanho',
    description:
      'Veja os jogadores conectados com seus avatares personalizados. Se faltarem pessoas, você pode adicionar bots inteligentes com um clique no botão "+ Bot".',
    actionHint: 'Experimente clicar em "+ Bot" para testar o rebanho!',
    position: 'top',
  },
  {
    id: 'lobby_settings',
    targetKey: 'settings_box',
    title: 'Regras & Modificadores Especiais',
    badge: '3. Regras',
    description:
      'Ajuste o tempo de debate, bloqueio de eliminação na 1ª noite e ative cartas especiais como o Anjo Salvador, o Espião e o Falso Profeta.',
    actionHint: 'O bloqueio na 1ª noite garante que ninguém saia antes de jogar!',
    position: 'top',
  },
  {
    id: 'lobby_start',
    targetKey: 'start_box',
    title: 'Bênção de Início da Partida',
    badge: '4. Começar',
    description:
      'Quando houver no mínimo 5 jogadores (humanos ou bots), o anfitrião pode clicar em Iniciar. Os papéis secretos são sorteados na hora!',
    actionHint: 'Clique em "Avançar para Ação Noturna" para ver a próxima tela.',
    position: 'top',
  },
];

const NIGHT_STEPS: TooltipStep[] = [
  {
    id: 'night_role',
    targetKey: 'role_box',
    title: 'Seu Papel Secreto na Madrugada',
    badge: '1. Identidade',
    description:
      'A noite cai em silêncio. Aqui você descobre sua missão: Soldado Infiltrado (eliminar ovelhas), Pastor (proteger vidas), Profeta/Apóstolo (investigar) ou Ovelha.',
    actionHint: 'Alterne entre Soldado e Pastor acima para testar visões diferentes!',
    position: 'bottom',
  },
  {
    id: 'night_targets',
    targetKey: 'targets_box',
    title: 'Escolha o Alvo da sua Ação',
    badge: '2. Decisão',
    description:
      'Toque no card de um irmão para mirar. Se for Pastor, você escolherá quem salvar do perigo; se for Soldado, quem a tropa tentará eliminar.',
    actionHint: 'Toque em um dos jogadores abaixo para selecionar o alvo!',
    position: 'top',
  },
  {
    id: 'night_confirm',
    targetKey: 'confirm_box',
    title: 'Confirmação em Duas Etapas',
    badge: '3. Confirmação',
    description:
      'A escolha exige confirmação para evitar toques acidentais no celular. Uma vez travada, o sistema aguarda os outros jogadores em silêncio.',
    actionHint: 'Suas ações noturnas são 100% secretas e confidenciais!',
    position: 'top',
  },
  {
    id: 'night_chat',
    targetKey: 'chat_box',
    title: 'Conspiração Secreta dos Soldados',
    badge: '4. Tropa',
    description:
      'Os Soldados possuem um canal exclusivo durante a noite. Eles sabem quem são seus aliados e decidem juntos quem será o alvo antes do dia amanhecer.',
    actionHint: 'As ovelhas dormem e não têm acesso ao canal dos soldados.',
    position: 'top',
  },
];

const VOTING_STEPS: TooltipStep[] = [
  {
    id: 'voting_dawn',
    targetKey: 'dawn_box',
    title: 'Anúncio do Alvorecer',
    badge: '1. Amanhecer',
    description:
      'O galo canta e a vila acorda! O anúncio do dia revela com clareza quem foi atacado, quem foi milagrosamente salvo pelo Pastor ou se a noite foi de paz.',
    actionHint: 'Fique atento aos nomes destacados no relatório da noite!',
    position: 'bottom',
  },
  {
    id: 'voting_debate',
    targetKey: 'debate_box',
    title: 'Debate no Chat Público',
    badge: '2. Discussão',
    description:
      'Todos conversam no chat público para desmascarar os infiltrados. Soldados tentam desviar as suspeitas e Ovelhas compartilham pistas.',
    actionHint: 'O cronômetro no topo marca o tempo restante para debate.',
    position: 'bottom',
  },
  {
    id: 'voting_ballot',
    targetKey: 'ballot_box',
    title: 'Cédula de Votação & Julgamento',
    badge: '3. Votação',
    description:
      'Selecione o jogador mais suspeito para eliminar pelo voto da maioria, ou escolha "Abster-se" se preferir não condenar ninguém hoje.',
    actionHint: 'Toque em um jogador e clique em "Confirmar Voto".',
    position: 'top',
  },
  {
    id: 'voting_victory',
    targetKey: 'victory_box',
    title: 'Abertura das Urnas & Vitória',
    badge: '4. Fim do Dia',
    description:
      'As urnas se abrem com animação revelando a contagem. As Ovelhas vencem ao eliminar todos os Soldados; os Soldados vencem ao igualar o número de fiéis!',
    actionHint: 'Parabéns! Você já domina a essência de Infiltrado na Fé.',
    position: 'top',
  },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TutorialTab;
}

export const InteractiveTutorialModal: React.FC<Props> = ({
  isOpen,
  onClose,
  initialTab = 'LOBBY',
}) => {
  const [activeTab, setActiveTab] = useState<TutorialTab>(initialTab);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Estados interativos do simulador do Lobby
  const [demoBotsCount, setDemoBotsCount] = useState(3);
  const [demoBlockFirstNight, setDemoBlockFirstNight] = useState(true);

  // Estados interativos do simulador da Noite
  const [demoRole, setDemoRole] = useState<'SOLDADO' | 'PASTOR'>('SOLDADO');
  const [demoNightTarget, setDemoNightTarget] = useState<string | null>('demo_p2');
  const [demoNightConfirmed, setDemoNightConfirmed] = useState(false);

  // Estados interativos do simulador de Votação
  const [demoVoteTarget, setDemoVoteTarget] = useState<string | null>('demo_p3');
  const [demoVoteConfirmed, setDemoVoteConfirmed] = useState(false);
  const [demoUseDoubleVote, setDemoUseDoubleVote] = useState(false);

  // Preferência de dicas em partidas reais
  const [enableInGameTips, setEnableInGameTips] = useState(() => {
    try {
      return localStorage.getItem('tutorial_in_game_tips') !== 'false';
    } catch {
      return true;
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setCurrentStepIndex(0);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const currentSteps =
    activeTab === 'LOBBY' ? LOBBY_STEPS : activeTab === 'NIGHT' ? NIGHT_STEPS : VOTING_STEPS;
  const currentStep = currentSteps[currentStepIndex] || currentSteps[0];

  const handleNext = () => {
    sounds.playClick();
    if (currentStepIndex < currentSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      // Avança para a próxima tela ou fecha
      if (activeTab === 'LOBBY') {
        setActiveTab('NIGHT');
        setCurrentStepIndex(0);
      } else if (activeTab === 'NIGHT') {
        setActiveTab('VOTING');
        setCurrentStepIndex(0);
      } else {
        handleFinish();
      }
    }
  };

  const handlePrev = () => {
    sounds.playClick();
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    } else {
      if (activeTab === 'VOTING') {
        setActiveTab('NIGHT');
        setCurrentStepIndex(NIGHT_STEPS.length - 1);
      } else if (activeTab === 'NIGHT') {
        setActiveTab('LOBBY');
        setCurrentStepIndex(LOBBY_STEPS.length - 1);
      }
    }
  };

  const handleFinish = () => {
    sounds.playGavelStrike();
    try {
      localStorage.setItem('interactive_tutorial_completed', 'true');
    } catch {}
    onClose();
  };

  const toggleInGameTips = () => {
    sounds.playClick();
    const nextVal = !enableInGameTips;
    setEnableInGameTips(nextVal);
    try {
      localStorage.setItem('tutorial_in_game_tips', nextVal ? 'true' : 'false');
    } catch {}
  };

  // Jogadores simulados para o tutorial
  const demoPlayers = [
    { id: 'demo_p1', name: 'Você (Irmão)', isHost: true, isBot: false, color: '#F59E0B' },
    { id: 'demo_p2', name: 'João Diácono', isHost: false, isBot: false, color: '#3B82F6' },
    { id: 'demo_p3', name: 'Sara Pregadora', isHost: false, isBot: false, color: '#EC4899' },
    { id: 'demo_b1', name: 'Bot Gabriel', isHost: false, isBot: true, color: '#10B981' },
    { id: 'demo_b2', name: 'Bot Rebeca', isHost: false, isBot: true, color: '#8B5CF6' },
  ].slice(0, 2 + demoBotsCount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none overflow-y-auto">
      <div className="w-full max-w-4xl bg-[#f8f9fc] text-black border-3 border-black rounded-3xl shadow-2xl flex flex-col max-h-[94vh] overflow-hidden">
        {/* Top Header */}
        <div className="bg-black text-white px-4 py-3 sm:px-6 sm:py-3.5 flex items-center justify-between shrink-0 border-b-2 border-black">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-black flex items-center justify-center font-black">
              <GraduationCap size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black tracking-wider uppercase font-sans">
                  Tutorial Interativo
                </h2>
                <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-mono font-bold">
                  Guia Passo a Passo
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono hidden sm:block">
                Aprenda as 3 telas principais do jogo com simulações dinâmicas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sounds.playClick();
                onClose();
              }}
              className="w-8 h-8 rounded-xl border border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-white flex items-center justify-center cursor-pointer transition-colors"
              title="Fechar Tutorial"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Navigation: As 3 Telas Principais */}
        <div className="bg-neutral-200/90 border-b-2 border-black/20 p-1.5 flex items-center justify-center gap-1.5 shrink-0">
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('LOBBY');
              setCurrentStepIndex(0);
            }}
            className={`flex-1 max-w-[210px] py-2 px-3 rounded-xl text-xs font-mono font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'LOBBY'
                ? 'bg-black text-white shadow-md scale-102'
                : 'bg-white/80 text-neutral-700 hover:bg-white'
            }`}
          >
            <Users size={14} />
            <span>1. Lobby</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('NIGHT');
              setCurrentStepIndex(0);
            }}
            className={`flex-1 max-w-[210px] py-2 px-3 rounded-xl text-xs font-mono font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'NIGHT'
                ? 'bg-indigo-950 text-indigo-100 shadow-md scale-102 border border-indigo-700'
                : 'bg-white/80 text-neutral-700 hover:bg-white'
            }`}
          >
            <Moon size={14} className="text-indigo-400" />
            <span>2. Ação Noturna</span>
          </button>
          <button
            onClick={() => {
              sounds.playClick();
              setActiveTab('VOTING');
              setCurrentStepIndex(0);
            }}
            className={`flex-1 max-w-[210px] py-2 px-3 rounded-xl text-xs font-mono font-black uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'VOTING'
                ? 'bg-black text-white shadow-md scale-102'
                : 'bg-white/80 text-neutral-700 hover:bg-white'
            }`}
          >
            <Scale size={14} className="text-amber-400" />
            <span>3. Votação</span>
          </button>
        </div>

        {/* Interactive Workspace Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col justify-between min-h-[380px] bg-white relative">
          {/* ================================================================= */}
          {/* SIMULADOR DA TELA 1: LOBBY */}
          {/* ================================================================= */}
          {activeTab === 'LOBBY' && (
            <div className="space-y-4">
              {/* Box 1: Código & Status da Sala */}
              <div
                className={`p-3 bg-neutral-50 border-2 rounded-2xl transition-all ${
                  currentStep.targetKey === 'code_box'
                    ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50/50 shadow-md'
                    : 'border-black/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                      Código de Entrada
                    </span>
                    <div className="text-xl sm:text-2xl font-black font-mono tracking-widest text-black flex items-center gap-2">
                      <span>FÉ7X9</span>
                      <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full font-sans font-bold">
                        5 CARACTERES
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 border border-emerald-300 px-2 py-1 rounded-full font-bold">
                      ● Sala Aberta ({demoPlayers.length} / 16)
                    </span>
                  </div>
                </div>
              </div>

              {/* Box 2: Roster & Bots */}
              <div
                className={`p-3 bg-white border-2 rounded-2xl space-y-2.5 transition-all ${
                  currentStep.targetKey === 'roster_box'
                    ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50/30 shadow-md'
                    : 'border-black/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono text-xs font-bold uppercase">
                    <Users size={14} />
                    <span>Irmãos no Rebanho ({demoPlayers.length} presentes)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setDemoBotsCount(prev => Math.max(1, prev - 1));
                      }}
                      className="px-2 py-1 bg-neutral-100 hover:bg-neutral-200 border border-black rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer"
                      title="Remover Bot"
                    >
                      <Minus size={12} />
                      <span className="hidden sm:inline">Bot</span>
                    </button>
                    <button
                      onClick={() => {
                        sounds.playClick();
                        setDemoBotsCount(prev => Math.min(6, prev + 1));
                      }}
                      className="px-2.5 py-1 bg-amber-300 hover:bg-amber-400 border border-black rounded-lg text-xs font-mono font-bold flex items-center gap-1 cursor-pointer active:scale-95"
                      title="Adicionar Bot"
                    >
                      <Plus size={12} />
                      <span>+ Bot</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {demoPlayers.map(p => (
                    <div
                      key={p.id}
                      className="p-2 border border-black/20 rounded-xl bg-neutral-50 flex items-center gap-2"
                    >
                      <PersonAvatar seed={p.name} color={p.color} size={28} />
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold font-mono truncate flex items-center gap-1">
                          {p.isHost && <Crown size={10} className="text-amber-500 shrink-0" />}
                          <span className="truncate">{p.name}</span>
                        </div>
                        <span className="text-[9px] text-neutral-500 font-mono block">
                          {p.isBot ? 'I.A. Virtual' : p.isHost ? 'Anfitrião' : 'Humano'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Box 3: Configurações & Modificadores */}
              <div
                className={`p-3 bg-neutral-50 border-2 rounded-2xl space-y-2 transition-all ${
                  currentStep.targetKey === 'settings_box'
                    ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50/50 shadow-md'
                    : 'border-black/20'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono font-bold uppercase">
                  <span className="flex items-center gap-1.5">
                    <Settings size={14} />
                    <span>Configurações Recomendadas</span>
                  </span>
                  <span className="text-[10px] text-neutral-500">Debate: 90s · Votação: 45s</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setDemoBlockFirstNight(prev => !prev);
                    }}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                      demoBlockFirstNight
                        ? 'bg-emerald-600 text-white border-emerald-800'
                        : 'bg-white text-neutral-600 border-neutral-300'
                    }`}
                  >
                    <Shield size={13} />
                    <span>Bloquear eliminação na 1ª noite: {demoBlockFirstNight ? 'ATIVADO' : 'DESATIVADO'}</span>
                  </button>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Modificadores: Anjo, Espião e Falso Profeta inclusos
                  </span>
                </div>
              </div>

              {/* Box 4: Botão Iniciar Partida */}
              <div
                className={`p-1 transition-all rounded-2xl ${
                  currentStep.targetKey === 'start_box'
                    ? 'ring-4 ring-amber-400/40 shadow-lg'
                    : ''
                }`}
              >
                <button
                  onClick={() => {
                    sounds.playClick();
                    setActiveTab('NIGHT');
                    setCurrentStepIndex(0);
                  }}
                  className="w-full bg-black hover:bg-neutral-800 text-white py-3 rounded-2xl text-xs sm:text-sm font-mono font-black uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-98 transition-all"
                >
                  <FourPointStar size={14} className="text-amber-400" />
                  <span>INICIAR PARTIDA (EXPERIMENTAR TELA DA NOITE)</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SIMULADOR DA TELA 2: AÇÃO NOTURNA */}
          {/* ================================================================= */}
          {activeTab === 'NIGHT' && (
            <div className="space-y-4 bg-[#091124] text-white p-4 rounded-2xl border-2 border-indigo-950">
              {/* Seletor de Papel no Tutorial */}
              <div className="flex items-center justify-between pb-1 border-b border-indigo-900/60">
                <div className="flex items-center gap-2">
                  <Moon size={16} className="text-indigo-400" />
                  <span className="text-xs font-mono font-bold uppercase text-indigo-200">
                    Madrugada Secreta — 1ª Noite
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-[#141E3D] p-1 rounded-xl border border-indigo-700/60">
                  <span className="text-[10px] font-mono text-indigo-300 px-1">Ver como:</span>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setDemoRole('SOLDADO');
                      setDemoNightTarget('demo_p2');
                      setDemoNightConfirmed(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer ${
                      demoRole === 'SOLDADO'
                        ? 'bg-red-600 text-white'
                        : 'text-indigo-200 hover:bg-indigo-900/50'
                    }`}
                  >
                    Soldado
                  </button>
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setDemoRole('PASTOR');
                      setDemoNightTarget('demo_p3');
                      setDemoNightConfirmed(false);
                    }}
                    className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold uppercase cursor-pointer ${
                      demoRole === 'PASTOR'
                        ? 'bg-indigo-600 text-white'
                        : 'text-indigo-200 hover:bg-indigo-900/50'
                    }`}
                  >
                    Pastor
                  </button>
                </div>
              </div>

              {/* Box 1: Identidade Secreta */}
              <div
                className={`p-3 rounded-2xl bg-[#141E3D] border transition-all ${
                  currentStep.targetKey === 'role_box'
                    ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-lg'
                    : 'border-indigo-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 ${
                      demoRole === 'SOLDADO'
                        ? 'bg-red-950/80 border-red-500 text-red-300'
                        : 'bg-indigo-950/80 border-indigo-400 text-indigo-200'
                    }`}
                  >
                    {demoRole === 'SOLDADO' ? <Crosshair size={24} /> : <Shield size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black font-mono uppercase tracking-wider text-white">
                        {demoRole === 'SOLDADO' ? 'SOLDADO INFILTRADO' : 'PASTOR DA VILA'}
                      </span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold uppercase ${
                          demoRole === 'SOLDADO'
                            ? 'bg-red-600 text-white'
                            : 'bg-indigo-600 text-white'
                        }`}
                      >
                        {demoRole === 'SOLDADO' ? 'Facção Infiltrados' : 'Facção Ovelhas'}
                      </span>
                    </div>
                    <p className="text-[11px] text-indigo-200 font-mono mt-0.5 leading-snug">
                      {demoRole === 'SOLDADO'
                        ? 'Elimine ovelhas durante a noite sem ser descoberto de dia.'
                        : 'Abençoe um irmão nesta madrugada para protegê-lo de qualquer ataque.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Box 2: Alvos Noturnos */}
              <div
                className={`p-3 rounded-2xl bg-[#0f172a] border transition-all space-y-2 ${
                  currentStep.targetKey === 'targets_box'
                    ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-lg'
                    : 'border-indigo-900'
                }`}
              >
                <span className="text-[10px] font-mono text-indigo-300 uppercase font-bold block">
                  Selecione o jogador alvo da sua ação:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {demoPlayers
                    .filter(p => p.id !== 'demo_p1')
                    .map(p => {
                      const isSelected = demoNightTarget === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            sounds.playClick();
                            setDemoNightTarget(p.id);
                            setDemoNightConfirmed(false);
                          }}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                            isSelected
                              ? demoRole === 'SOLDADO'
                                ? 'bg-red-950/80 border-red-500 text-white ring-2 ring-red-400'
                                : 'bg-indigo-900 border-indigo-400 text-white ring-2 ring-indigo-400'
                              : 'bg-[#1e293b]/60 border-indigo-900/60 text-neutral-300 hover:bg-[#1e293b]'
                          }`}
                        >
                          <PersonAvatar seed={p.name} color={p.color} size={26} />
                          <div className="min-w-0">
                            <span className="text-[11px] font-bold font-mono truncate block">
                              {p.name}
                            </span>
                            <span className="text-[9px] text-indigo-300 font-mono">
                              {isSelected
                                ? demoRole === 'SOLDADO'
                                  ? 'Alvo do Ataque'
                                  : 'Sob Proteção'
                                : 'Toque para mirar'}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Box 3: Confirmação em 2 Etapas & Box 4: Chat Secreto */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div
                  className={`p-3 rounded-2xl bg-[#141E3D] border transition-all ${
                    currentStep.targetKey === 'confirm_box'
                      ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-lg'
                      : 'border-indigo-800'
                  }`}
                >
                  <span className="text-[10px] font-mono text-indigo-300 uppercase font-bold block mb-1.5">
                    Confirmação de Ação:
                  </span>
                  <button
                    onClick={() => {
                      sounds.playGavelStrike();
                      setDemoNightConfirmed(prev => !prev);
                    }}
                    className={`w-full py-2.5 rounded-xl text-xs font-mono font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                      demoNightConfirmed
                        ? 'bg-emerald-600 text-white border-2 border-emerald-400'
                        : demoRole === 'SOLDADO'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    <Check size={14} />
                    <span>
                      {demoNightConfirmed
                        ? '✓ ESCOLHA BLOQUEADA E SALVA'
                        : `CONFIRMAR ${demoRole === 'SOLDADO' ? 'ATAQUE' : 'BÊNÇÃO'}`}
                    </span>
                  </button>
                </div>

                <div
                  className={`p-3 rounded-2xl bg-[#141E3D] border transition-all ${
                    currentStep.targetKey === 'chat_box'
                      ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-lg'
                      : 'border-indigo-800'
                  }`}
                >
                  <span className="text-[10px] font-mono text-indigo-300 uppercase font-bold block mb-1">
                    Canal Privativo dos Soldados:
                  </span>
                  <div className="p-2 bg-[#091124] rounded-xl text-[10px] font-mono text-neutral-300 space-y-1">
                    <p className="text-red-400 font-bold">🗡️ Tropa Secreta: "Vamos no João Diácono!"</p>
                    <p className="text-neutral-400">Você: "Concordo, ele fez muitas perguntas de dia."</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* SIMULADOR DA TELA 3: VOTAÇÃO */}
          {/* ================================================================= */}
          {activeTab === 'VOTING' && (
            <div className="space-y-4">
              {/* Box 1: Anúncio do Amanhecer */}
              <div
                className={`p-3.5 rounded-2xl border-2 transition-all ${
                  currentStep.targetKey === 'dawn_box'
                    ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50 shadow-md'
                    : 'bg-emerald-50/70 border-emerald-500'
                }`}
              >
                <div className="flex items-center gap-2 text-emerald-950 font-black font-mono text-xs uppercase mb-1">
                  <Sun size={15} className="text-amber-500" />
                  <span>Relatório do Alvorecer — 1º Dia</span>
                </div>
                <div className="p-2.5 bg-white border border-emerald-300 rounded-xl font-mono text-xs text-neutral-800 space-y-1">
                  <p className="font-bold text-emerald-900">
                    🛡️ <span className="bg-emerald-100 px-1 py-0.5 rounded font-black text-emerald-950">João Diácono</span> foi protegido pelo Pastor durante a madrugada!
                  </p>
                  <p className="text-[11px] text-neutral-600">
                    Nenhum irmão foi eliminado esta noite pela graça e vigilância da congregação.
                  </p>
                </div>
              </div>

              {/* Box 2: Cronômetro & Debate */}
              <div
                className={`p-3 rounded-2xl border-2 bg-neutral-50 transition-all flex items-center justify-between ${
                  currentStep.targetKey === 'debate_box'
                    ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50/50 shadow-md'
                    : 'border-black/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-neutral-700" />
                  <div>
                    <span className="text-[10px] font-mono uppercase text-neutral-500 font-bold block">
                      Tempo de Julgamento
                    </span>
                    <span className="text-base font-black font-mono text-black">01:15 restante</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-black/20 px-3 py-1.5 rounded-xl font-mono text-xs">
                  <MessageSquare size={14} className="text-blue-600" />
                  <span className="font-bold">Chat da Vila Liberado</span>
                </div>
              </div>

              {/* Box 3: Cédula de Votação */}
              <div
                className={`p-3 bg-white border-2 rounded-2xl space-y-2.5 transition-all ${
                  currentStep.targetKey === 'ballot_box'
                    ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50/30 shadow-md'
                    : 'border-black/20'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase flex items-center gap-1.5">
                    <Scale size={14} />
                    <span>Em quem você vota para ser julgado?</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">Toque para selecionar</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {demoPlayers.map(p => {
                    const isSelected = demoVoteTarget === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          sounds.playClick();
                          setDemoVoteTarget(p.id);
                          setDemoVoteConfirmed(false);
                        }}
                        className={`p-2 rounded-xl border text-left flex items-center gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-black text-white border-black ring-2 ring-black'
                            : 'bg-neutral-50 border-neutral-300 text-neutral-800 hover:bg-neutral-100'
                        }`}
                      >
                        <PersonAvatar seed={p.name} color={p.color} size={24} />
                        <div className="min-w-0">
                          <span className="text-[11px] font-bold font-mono truncate block">
                            {p.name}
                          </span>
                          <span className="text-[9px] opacity-70 font-mono">
                            {isSelected ? '✓ Seu Voto' : 'Suspeito'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setDemoVoteTarget('ABSTAIN');
                      setDemoVoteConfirmed(false);
                    }}
                    className={`p-2 rounded-xl border text-center flex items-center justify-center cursor-pointer transition-all ${
                      demoVoteTarget === 'ABSTAIN'
                        ? 'bg-neutral-700 text-white border-black'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 border-neutral-300'
                    }`}
                  >
                    <span className="text-[11px] font-mono font-bold uppercase">Abster-se</span>
                  </button>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => {
                      sounds.playGavelStrike();
                      setDemoVoteConfirmed(true);
                    }}
                    className={`flex-1 py-2.5 rounded-xl font-mono text-xs font-black uppercase flex items-center justify-center gap-1.5 cursor-pointer shadow-md transition-all ${
                      demoVoteConfirmed
                        ? 'bg-emerald-600 text-white'
                        : 'bg-black hover:bg-neutral-800 text-white'
                    }`}
                  >
                    <Check size={14} />
                    <span>
                      {demoVoteConfirmed ? '✓ VOTO DEPOSITADO NA URNA' : 'CONFIRMAR MEU VOTO'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Box 4: Condição de Vitória */}
              <div
                className={`p-3 bg-neutral-50 border-2 rounded-2xl transition-all ${
                  currentStep.targetKey === 'victory_box'
                    ? 'border-amber-500 ring-4 ring-amber-400/30 bg-amber-50/50 shadow-md'
                    : 'border-black/20'
                }`}
              >
                <div className="text-xs font-mono font-bold uppercase text-neutral-700 flex items-center gap-1.5 mb-1">
                  <Crown size={14} className="text-amber-500" />
                  <span>Condições de Vitória do Jogo</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="p-2 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-950">
                    <span className="font-black block">🐑 VITÓRIA DA VILA:</span>
                    Descubra e elimine todos os Soldados Infiltrados pelo voto ou converta-os com o Evangelista.
                  </div>
                  <div className="p-2 bg-red-50 border border-red-300 rounded-xl text-red-950">
                    <span className="font-black block">🗡️ VITÓRIA DOS SOLDADOS:</span>
                    Elimine ovelhas até que o número de soldados seja igual ou maior que os fiéis restantes.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TOOLTIP BANNER FLUTUANTE INFORMATIVO COM CONTROLES */}
          {/* ================================================================= */}
          <div className="mt-4 pt-3 border-t-2 border-black/10">
            <motion.div
              key={`${activeTab}_${currentStep.id}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-100/90 border-2 border-amber-600 rounded-2xl p-3.5 sm:p-4 text-black shadow-lg space-y-2 relative"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-500 text-black font-black text-[10px] font-mono px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {currentStep.badge}
                  </span>
                  <h3 className="text-xs sm:text-sm font-black font-sans uppercase tracking-tight text-neutral-950">
                    {currentStep.title}
                  </h3>
                </div>
                <span className="text-[10px] font-mono font-bold text-amber-900 shrink-0">
                  Passo {currentStepIndex + 1} de {currentSteps.length}
                </span>
              </div>

              <p className="text-xs sm:text-[13px] font-mono text-neutral-800 leading-relaxed">
                {currentStep.description}
              </p>

              {currentStep.actionHint && (
                <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-amber-950 pt-0.5">
                  <Sparkles size={13} className="text-amber-700 shrink-0" />
                  <span>{currentStep.actionHint}</span>
                </div>
              )}

              {/* Controles de Navegação do Passo a Passo */}
              <div className="flex items-center justify-between pt-2 border-t border-amber-300/80">
                <div className="flex items-center gap-1">
                  {currentSteps.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        sounds.playClick();
                        setCurrentStepIndex(idx);
                      }}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === currentStepIndex
                          ? 'w-6 bg-black'
                          : 'w-2 bg-amber-400 hover:bg-amber-500'
                      }`}
                      title={`Ir para passo ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handlePrev}
                    disabled={currentStepIndex === 0 && activeTab === 'LOBBY'}
                    className={`px-3 py-1.5 rounded-xl border border-black/30 font-mono text-xs font-bold uppercase flex items-center gap-1 transition-all ${
                      currentStepIndex === 0 && activeTab === 'LOBBY'
                        ? 'opacity-40 cursor-not-allowed bg-transparent'
                        : 'bg-white hover:bg-neutral-100 text-black cursor-pointer shadow-2xs'
                    }`}
                  >
                    <ArrowLeft size={13} />
                    <span className="hidden sm:inline">Anterior</span>
                  </button>

                  <button
                    onClick={handleNext}
                    className="px-4 py-1.5 bg-black hover:bg-neutral-800 text-white rounded-xl font-mono text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95 transition-all"
                  >
                    <span>
                      {currentStepIndex === currentSteps.length - 1 && activeTab === 'VOTING'
                        ? 'Concluir'
                        : 'Próximo'}
                    </span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom Options Bar: Toggle Dicas em Partidas & Fechar */}
        <div className="bg-neutral-100 border-t-2 border-black/20 px-4 py-2.5 sm:px-6 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <label className="flex items-center gap-2 cursor-pointer font-mono text-xs text-neutral-700 select-none">
            <input
              type="checkbox"
              checked={enableInGameTips}
              onChange={toggleInGameTips}
              className="w-4 h-4 rounded text-black focus:ring-black cursor-pointer"
            />
            <span className="text-[11px] font-bold">
              Mostrar dicas contextuais automáticas durante as partidas
            </span>
          </label>

          <button
            onClick={handleFinish}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-mono text-xs font-black uppercase flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <Check size={14} />
            <span>Entendi Tudo! Fechar Tutorial</span>
          </button>
        </div>
      </div>
    </div>
  );
};
