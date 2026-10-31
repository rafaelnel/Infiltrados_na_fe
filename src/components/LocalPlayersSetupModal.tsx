import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  RotateCcw,
  Check,
  Play,
  ShieldAlert,
  Sparkles,
  X,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Minus,
  Clock,
  Shield,
  Eye,
} from 'lucide-react';
import { Role, ROLES_METADATA, ModifiersConfig } from '../types/game';
import { FourPointStar, RoleIllustration } from './RoleIllustrations';
import { PersonAvatar, encodeAvatar, getRandomAvatar, generateRandomCharacterConfig } from './PersonAvatar';
import { AvatarCustomizerModal, pickRandomAvailableColor } from './AvatarCustomizerModal';
import { sounds } from '../utils/audio';

export type LocalPlayerProfilesMap = Record<string, { color: string; avatar: string }>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStartWithPlayers: (
    playerNames: string[],
    customDeck?: Role[],
    discussionTimeSeconds?: number,
    modifiersConfig?: ModifiersConfig,
    playerProfiles?: LocalPlayerProfilesMap,
    blockFirstNightElimination?: boolean
  ) => void;
}

const STORAGE_KEY = 'infiltrado_saved_local_players';
const PROFILES_STORAGE_KEY = 'infiltrado_saved_local_profiles';
const BLOCK_FIRST_NIGHT_KEY = 'infiltrado_local_block_first_night';

const DEFAULT_PLAYERS = [
  'Rafael',
  'Lucas',
  'Mateus',
  'Sara',
  'Davi',
  'Ester',
  'Gabriel',
  'Rebeca',
];

function buildCompleteProfiles(
  names: string[],
  existing: LocalPlayerProfilesMap = {}
): LocalPlayerProfilesMap {
  const result: LocalPlayerProfilesMap = { ...existing };
  const assignedColors: string[] = [];

  names.forEach((rawName, idx) => {
    const key = rawName.trim() || `Player ${idx + 1}`;
    const current = result[key] || result[rawName];
    const resolvedColor = pickRandomAvailableColor(current?.color, assignedColors, key).color;
    assignedColors.push(resolvedColor);
    const resolvedAvatar = current?.avatar || encodeAvatar(getRandomAvatar(key));
    result[key] = {
      color: resolvedColor,
      avatar: resolvedAvatar,
    };
  });

  return result;
}

// Regra de segurança anti-snowballing: calcula o limite máximo seguro de soldados
export function getMaxAllowedSoldiers(totalPlayers: number): number {
  if (totalPlayers <= 6) return 1; // 5-6 jogadores: no MÁXIMO 1 soldado (se fossem 2, na 1ª noite matam 1 e fica 2x2 = vitória no Dia 1)
  if (totalPlayers <= 9) return 2; // 7-9 jogadores: no MÁXIMO 2 soldados
  if (totalPlayers <= 13) return 3; // 10-13 jogadores: no MÁXIMO 3 soldados
  return 4; // 14-16 jogadores: no MÁXIMO 4 soldados
}

// Gera baralho recomendado padrão baseado no total de jogadores
export function generateRecommendedDeck(totalPlayers: number): Record<Role, number> {
  const maxSoldiers = getMaxAllowedSoldiers(totalPlayers);
  const counts: Record<Role, number> = {
    SOLDADO: maxSoldiers,
    PASTOR: 1,
    EVANGELISTA: 1,
    APOSTOLO: 1,
    PROFETA: 1,
    MESTRE: totalPlayers >= 6 ? 1 : 0,
    OVELHA: 0,
  };

  const specialAllocated =
    counts.SOLDADO + counts.PASTOR + counts.EVANGELISTA + counts.APOSTOLO + counts.PROFETA + counts.MESTRE;

  counts.OVELHA = Math.max(0, totalPlayers - specialAllocated);
  return counts;
}

export const LocalPlayersSetupModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onStartWithPlayers,
}) => {
  const [step, setStep] = useState<'NAMES' | 'ROLES'>('NAMES');
  const [players, setPlayers] = useState<string[]>([]);
  const [playerProfiles, setPlayerProfiles] = useState<LocalPlayerProfilesMap>({});
  const [customizingPlayerIdx, setCustomizingPlayerIdx] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Contadores de papéis selecionados
  const [roleCounts, setRoleCounts] = useState<Record<Role, number>>({
    SOLDADO: 2,
    PASTOR: 1,
    EVANGELISTA: 1,
    APOSTOLO: 1,
    PROFETA: 1,
    MESTRE: 1,
    OVELHA: 1,
  });

  // Timer de debate da assembleia (padrão 2 minutos = 120s)
  const [discussionSeconds, setDiscussionSeconds] = useState<number>(120);

  // Modificadores / Cards Especiais (Sorteio Secundário)
  const [modifiersConfig, setModifiersConfig] = useState<ModifiersConfig>({
    falsoProfeta: true,
    espiao: true,
    anjo: true,
  });

  // Bloquear eliminação na 1ª Noite
  const [blockFirstNightElimination, setBlockFirstNightElimination] = useState<boolean>(() => {
    try {
      return localStorage.getItem(BLOCK_FIRST_NIGHT_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const saveProfilesToStorage = (updatedProfiles: LocalPlayerProfilesMap) => {
    setPlayerProfiles(updatedProfiles);
    try {
      localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(updatedProfiles));
    } catch (e) {
      console.error(e);
    }
  };

  // Load from localStorage on mount
  useEffect(() => {
    let initialNames = DEFAULT_PLAYERS;
    let storedProfiles: LocalPlayerProfilesMap = {};
    try {
      const rawProfiles = localStorage.getItem(PROFILES_STORAGE_KEY);
      if (rawProfiles) {
        storedProfiles = JSON.parse(rawProfiles) || {};
      }
    } catch (e) {
      console.error(e);
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length >= 5) {
          initialNames = parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }

    setPlayers(initialNames);
    setRoleCounts(generateRecommendedDeck(initialNames.length));
    const completeProfiles = buildCompleteProfiles(initialNames, storedProfiles);
    saveProfilesToStorage(completeProfiles);
  }, [isOpen]);

  // Recalcula baralho recomendado quando entra no Passo 2 se o total de jogadores mudou
  const handleProceedToRoles = () => {
    const validPlayers = players.map(p => p.trim()).filter(Boolean);
    if (validPlayers.length < 5) {
      setErrorMessage('Mínimo de 5 jogadores necessários para uma partida equilibrada.');
      return;
    }
    setErrorMessage(null);
    sounds.playClick();
    setRoleCounts(generateRecommendedDeck(validPlayers.length));
    setStep('ROLES');
  };

  // Salvar nomes no storage e garantir que todos tenham cor única e avatar
  const saveToStorage = (updated: string[], existingProfiles: LocalPlayerProfilesMap = playerProfiles) => {
    setPlayers(updated);
    const complete = buildCompleteProfiles(updated, existingProfiles);
    saveProfilesToStorage(complete);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 1500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddPlayer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (players.length >= 16) {
      setErrorMessage('Máximo de 16 jogadores permitido.');
      return;
    }
    setErrorMessage(null);
    sounds.playClick();
    const updated = [...players, trimmed];
    saveToStorage(updated);
    setNewName('');
  };

  const handleRemovePlayer = (index: number) => {
    sounds.playClick();
    const updated = players.filter((_, i) => i !== index);
    saveToStorage(updated);
  };

  const handleUpdateName = (index: number, val: string) => {
    const oldName = players[index]?.trim();
    const newTrimmed = val.trim();
    const nextProfiles = { ...playerProfiles };
    if (oldName && newTrimmed && nextProfiles[oldName] && !nextProfiles[newTrimmed]) {
      nextProfiles[newTrimmed] = nextProfiles[oldName];
    }
    const updated = [...players];
    updated[index] = val;
    saveToStorage(updated, nextProfiles);
  };

  const handleRandomizeSinglePlayer = (index: number) => {
    sounds.playClick();
    const pName = players[index]?.trim() || `Player ${index + 1}`;
    const otherTakenColors = players
      .map((name, i) => (i === index ? null : playerProfiles[name.trim() || `Player ${i + 1}`]?.color))
      .filter((c): c is string => Boolean(c));
    const randomColor = pickRandomAvailableColor(undefined, otherTakenColors).color;
    const randomAvatar = encodeAvatar(generateRandomCharacterConfig());
    const nextProfiles = {
      ...playerProfiles,
      [pName]: {
        color: randomColor,
        avatar: randomAvatar,
      },
    };
    saveProfilesToStorage(nextProfiles);
  };

  const handleRandomizeAllProfiles = () => {
    sounds.playClick();
    const assignedColors: string[] = [];
    const nextProfiles: LocalPlayerProfilesMap = { ...playerProfiles };
    players.forEach((rawName, idx) => {
      const key = rawName.trim() || `Player ${idx + 1}`;
      const chosenColor = pickRandomAvailableColor(undefined, assignedColors).color;
      assignedColors.push(chosenColor);
      nextProfiles[key] = {
        color: chosenColor,
        avatar: encodeAvatar(generateRandomCharacterConfig()),
      };
    });
    saveProfilesToStorage(nextProfiles);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1500);
  };

  const handleResetDefaults = () => {
    sounds.playClick();
    saveToStorage(DEFAULT_PLAYERS);
  };

  const handleClearAll = () => {
    sounds.playClick();
    saveToStorage([]);
  };

  // -------------------------------------------------------------
  // LÓGICA DO PASSO 2: CONTROLE E EQUILÍBRIO DE PERSONAGENS
  // -------------------------------------------------------------
  const totalPlayers = players.length;
  const totalAllocated = Object.values(roleCounts).reduce((a, b) => a + b, 0);
  const remainingSlots = totalPlayers - totalAllocated;
  const maxAllowedSoldiers = getMaxAllowedSoldiers(totalPlayers);
  const currentSoldiers = roleCounts.SOLDADO;

  const handleRoleCountChange = (role: Role, delta: number) => {
    sounds.playClick();
    setRoleCounts(prev => {
      const current = prev[role] || 0;
      const next = current + delta;
      if (next < 0) return prev;

      // Trava de equilíbrio para Soldados: não permite ultrapassar o limite seguro
      if (role === 'SOLDADO' && delta > 0 && next > maxAllowedSoldiers) {
        return prev;
      }

      // Não permite ultrapassar o total de vagas disponíveis
      if (delta > 0 && totalAllocated >= totalPlayers) {
        return prev;
      }

      return {
        ...prev,
        [role]: next,
      };
    });
  };

  // Preencher restante com ovelhas comuns
  const handleFillRemainingWithSheep = () => {
    sounds.playClick();
    if (remainingSlots <= 0) return;
    setRoleCounts(prev => ({
      ...prev,
      OVELHA: prev.OVELHA + remainingSlots,
    }));
  };

  // Aplicar Preset Recomendado
  const handleApplyRecommendedPreset = () => {
    sounds.playClick();
    setRoleCounts(generateRecommendedDeck(totalPlayers));
  };

  // Validação de finalização
  const isDeckValid = totalAllocated === totalPlayers && currentSoldiers >= 1 && currentSoldiers <= maxAllowedSoldiers;

  const handleStartFinalGame = () => {
    if (!isDeckValid) return;
    sounds.playMorningBell();

    // Converte os contadores no baralho de papéis em array ordenado/aleatorizado
    const deck: Role[] = [];
    (Object.keys(roleCounts) as Role[]).forEach(role => {
      const count = roleCounts[role];
      for (let i = 0; i < count; i++) {
        deck.push(role);
      }
    });

    const finalProfiles = buildCompleteProfiles(players, playerProfiles);
    onStartWithPlayers(
      players,
      deck,
      discussionSeconds,
      modifiersConfig,
      finalProfiles,
      blockFirstNightElimination
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white border-[4px] border-black rounded-[36px] w-full max-w-lg max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header com Navegação de Passos */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b-2 border-black bg-neutral-50">
          <div className="flex items-center gap-2">
            <FourPointStar size={16} className="text-black" />
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-black font-sans">
              {step === 'NAMES' ? '1. Nomes dos Participantes' : '2. Escolha dos Personagens'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* ========================================================= */}
        {/* PASSO 1: CONFIGURAÇÃO DE NOMES */}
        {/* ========================================================= */}
        {step === 'NAMES' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <p className="text-[11px] text-neutral-600 leading-tight">
                Cadastre os nomes dos amigos presentes. Eles ficam salvos no seu aparelho para as próximas rodadas!
              </p>
              {savedSuccess && (
                <span className="text-[10px] text-green-700 font-bold flex items-center gap-1 animate-fadeIn">
                  <Check size={12} /> Salvo no navegador!
                </span>
              )}
            </div>

            {errorMessage && (
              <div className="p-2.5 bg-red-50 border-2 border-red-600 rounded-xl text-red-900 text-xs font-bold flex items-center justify-between animate-fadeIn">
                <span>{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="ml-2 w-5 h-5 border border-red-400 rounded-full flex items-center justify-center font-black text-xs hover:bg-red-200"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleAddPlayer} className="flex gap-2">
              <input
                type="text"
                placeholder="Nome do Jogador (ex: Lucas)"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                maxLength={20}
                className="flex-1 px-3 py-2 border-2 border-black rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
              <button
                type="submit"
                disabled={!newName.trim()}
                className="px-4 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 hover:bg-neutral-800 disabled:opacity-40 transition-colors shrink-0"
              >
                <UserPlus size={14} /> Adicionar
              </button>
            </form>

            {/* Roster List */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center px-1">
                <span className="font-bold uppercase tracking-wider text-black text-[11px] flex items-center gap-1">
                  <Users size={13} />
                  <span>Lista de Membros ({players.length}/16)</span>
                </span>
                <span className={`text-[10px] font-bold ${players.length >= 5 ? 'text-green-700' : 'text-neutral-500'}`}>
                  {players.length >= 5 ? '✓ Mínimo atingido' : `Faltam ${5 - players.length} para o mínimo`}
                </span>
              </div>

              <div className="border-2 border-black rounded-2xl p-2 bg-neutral-50 max-h-56 overflow-y-auto space-y-1.5">
                {players.length === 0 ? (
                  <div className="text-center py-6 text-neutral-400 text-xs">
                    Nenhum jogador cadastrado. Adicione pelo menos 5 nomes acima.
                  </div>
                ) : (
                  players.map((pName, idx) => {
                    const key = pName.trim() || `Player ${idx + 1}`;
                    const profile = playerProfiles[key] || {
                      color: '#F59E0B',
                      avatar: encodeAvatar(getRandomAvatar(key)),
                    };

                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-white border border-neutral-300 rounded-xl gap-2 hover:border-black transition-colors"
                      >
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setCustomizingPlayerIdx(idx);
                            }}
                            title="Personalizar Avatar e Cor"
                            className="relative shrink-0 cursor-pointer group"
                          >
                            <PersonAvatar
                              avatar={profile.avatar}
                              color={profile.color}
                              seed={key}
                              size={36}
                              className="border-2 border-black shrink-0 group-hover:scale-105 transition-transform"
                            />
                            <span
                              className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full text-white border border-black flex items-center justify-center text-[9px] font-bold shadow-2xs"
                              style={{ backgroundColor: profile.color }}
                            >
                              {idx + 1}
                            </span>
                          </button>

                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                              style={{ backgroundColor: profile.color }}
                              title="Cor do participante"
                            />
                            <input
                              type="text"
                              value={pName}
                              onChange={e => handleUpdateName(idx, e.target.value)}
                              className="flex-1 bg-transparent font-bold text-xs focus:outline-none border-b border-transparent focus:border-black truncate"
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRandomizeSinglePlayer(idx)}
                            title="Gerar Avatar e Cor Aleatórios"
                            className="px-1.5 py-1 border border-black/30 bg-amber-100 hover:bg-amber-200 text-black rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                          >
                            🎲
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playClick();
                              setCustomizingPlayerIdx(idx);
                            }}
                            title="Personalizar Rosto e Cor"
                            className="px-2 py-1 border border-black bg-black text-white hover:bg-neutral-800 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles size={10} className="text-amber-400" />
                            <span>Cor</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemovePlayer(idx)}
                            title="Remover Jogador"
                            className="p-1 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={handleRandomizeAllProfiles}
                className="flex-1 py-1.5 px-2 border-2 border-black bg-amber-300 hover:bg-amber-400 rounded-xl text-[10px] font-black uppercase transition-colors flex items-center justify-center gap-1 text-black cursor-pointer"
              >
                <span>🎲 Gerar Avatares & Cores Aleatórios</span>
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="py-1.5 px-2.5 border border-black/40 rounded-xl text-[10px] font-bold uppercase hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1 text-neutral-700 cursor-pointer"
              >
                <RotateCcw size={12} /> Padrão (8)
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="px-2.5 py-1.5 border border-neutral-300 rounded-xl text-[10px] font-bold uppercase hover:bg-red-50 text-neutral-600 hover:text-red-700 transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>

            {/* Advance to Step 2 Button */}
            <div className="pt-2">
              <button
                onClick={handleProceedToRoles}
                disabled={players.length < 5}
                className={`w-full py-3.5 rounded-full flex items-center justify-center space-x-2 text-xs font-mono font-black uppercase tracking-widest transition-transform ${
                  players.length >= 5
                    ? 'bg-black text-white active:scale-95 shadow-md hover:bg-neutral-800'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <span>ESCOLHER PERSONAGENS ({players.length} JOGADORES)</span>
                <ArrowRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PASSO 2: ESCOLHA E EQUILÍBRIO DE PERSONAGENS */}
        {/* ========================================================= */}
        {step === 'ROLES' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 font-mono text-xs">
            {/* Resumo de Vagas & Status do Baralho */}
            <div className="p-3 border-2 border-black rounded-2xl bg-neutral-50 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-bold uppercase tracking-wider text-black text-[11px]">
                  Total de Vagas:
                </span>
                <span className="font-black text-sm text-black">
                  {totalAllocated} / {totalPlayers} Jogadores
                </span>
              </div>

              {/* Barra de Preenchimento */}
              <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden border border-black/20">
                <div
                  className={`h-full transition-all ${
                    totalAllocated === totalPlayers
                      ? 'bg-green-600'
                      : totalAllocated > totalPlayers
                      ? 'bg-red-600'
                      : 'bg-black'
                  }`}
                  style={{ width: `${Math.min(100, (totalAllocated / totalPlayers) * 100)}%` }}
                />
              </div>

              {/* Status e Feedback */}
              <div className="text-[10.5px]">
                {totalAllocated < totalPlayers && (
                  <span className="text-neutral-700 font-bold block">
                    ⚠️ Faltam {remainingSlots} vaga(s) para completar o baralho.
                  </span>
                )}
                {totalAllocated > totalPlayers && (
                  <span className="text-red-700 font-bold block">
                    ⚠️ Excesso de {totalAllocated - totalPlayers} vaga(s)! Reduza algum papel.
                  </span>
                )}
                {totalAllocated === totalPlayers && (
                  <span className="text-green-700 font-bold block">
                    ✓ Baralho completo! Exatamente {totalPlayers} papéis para {totalPlayers} jogadores.
                  </span>
                )}
              </div>

              {/* Alerta de Trava de Equilíbrio dos Soldados */}
              <div className="p-2 border border-black/30 rounded-xl bg-white space-y-1 text-[10px]">
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase text-black">
                    🛡️ Trava de Equilíbrio (Anti-Snowball):
                  </span>
                  <span className="bg-black text-white px-1.5 py-0.5 rounded font-bold">
                    Máx: {maxAllowedSoldiers} Soldado(s)
                  </span>
                </div>
                <p className="text-neutral-600 leading-tight">
                  Para {totalPlayers} jogadores, o limite é de <strong>{maxAllowedSoldiers} Soldado(s)</strong> para evitar que a partida acabe logo no 1º turno pela superioridade dos infiltrados.
                </p>
                {currentSoldiers === 0 && (
                  <span className="text-red-700 font-bold block">
                    ⚠️ Adicione pelo menos 1 Soldado para o jogo funcionar.
                  </span>
                )}
              </div>
            </div>

            {/* Botões Rápidos de Ajuste */}
            <div className="flex gap-2">
              <button
                onClick={handleApplyRecommendedPreset}
                className="flex-1 py-1.5 border-2 border-black rounded-xl text-[10px] font-bold uppercase hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1 bg-white"
              >
                <Sparkles size={12} /> Preset Equilibrado
              </button>
              {remainingSlots > 0 && (
                <button
                  onClick={handleFillRemainingWithSheep}
                  className="py-1.5 px-3 border-2 border-black rounded-xl text-[10px] font-bold uppercase hover:bg-neutral-100 transition-colors bg-white"
                >
                  + Completar c/ Ovelhas ({remainingSlots})
                </button>
              )}
            </div>

            {/* Lista dos 7 Papéis com Controles + / - */}
            <div className="space-y-2 border-2 border-black rounded-2xl p-2.5 bg-neutral-50 max-h-64 overflow-y-auto">
              {(
                [
                  'SOLDADO',
                  'PASTOR',
                  'EVANGELISTA',
                  'APOSTOLO',
                  'PROFETA',
                  'MESTRE',
                  'OVELHA',
                ] as Role[]
              ).map(role => {
                const info = ROLES_METADATA[role];
                const count = roleCounts[role] || 0;
                const isSoldier = role === 'SOLDADO';
                const isSoldierMax = isSoldier && count >= maxAllowedSoldiers;
                const isDeckFull = totalAllocated >= totalPlayers;

                return (
                  <div
                    key={role}
                    className={`flex items-center justify-between p-2.5 rounded-xl border transition-all ${
                      count > 0 ? 'bg-white border-black shadow-2xs' : 'bg-neutral-100 border-neutral-300 opacity-70'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xs text-black uppercase">
                          {info.name}
                        </span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                            isSoldier ? 'bg-red-950 text-white' : 'bg-neutral-200 text-neutral-800'
                          }`}
                        >
                          {info.team === 'SOLDADOS' ? 'Infiltrado' : 'Ovelhas'}
                        </span>
                      </div>
                      <span className="text-[10px] text-neutral-600 block line-clamp-1 mt-0.5">
                        {info.abilityDescription}
                      </span>
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleRoleCountChange(role, -1)}
                        disabled={count <= 0}
                        className="w-7 h-7 rounded-lg border border-black flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black transition-colors"
                      >
                        <Minus size={14} />
                      </button>

                      <span className="w-5 text-center font-black text-sm font-mono text-black">
                        {count}
                      </span>

                      <button
                        onClick={() => handleRoleCountChange(role, 1)}
                        disabled={isDeckFull || isSoldierMax}
                        title={isSoldierMax ? 'Limite de segurança de soldados atingido' : 'Adicionar'}
                        className="w-7 h-7 rounded-lg border border-black flex items-center justify-center hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-black transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Configuração do Timer de Debate da Assembleia (Padrão 2 minutos) */}
            <div className="p-3 border-2 border-black rounded-2xl bg-neutral-50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-black text-[11px] flex items-center gap-1.5">
                  <Clock size={14} />
                  <span>Timer da Assembleia (Debate):</span>
                </span>
                <span className="font-mono font-black text-xs px-2.5 py-0.5 bg-black text-white rounded-full">
                  {Math.floor(discussionSeconds / 60)}m {discussionSeconds % 60 ? `${discussionSeconds % 60}s` : '00s'}
                </span>
              </div>

              {/* Botões de Predefinição Rápida */}
              <div className="grid grid-cols-4 gap-1.5 text-[10px] font-mono font-bold">
                {[
                  { label: '1 min', sec: 60 },
                  { label: '2 min (Padrão)', sec: 120 },
                  { label: '3 min', sec: 180 },
                  { label: '5 min', sec: 300 },
                ].map(opt => (
                  <button
                    key={opt.sec}
                    type="button"
                    onClick={() => {
                      sounds.playClick();
                      setDiscussionSeconds(opt.sec);
                    }}
                    className={`py-1.5 px-1 rounded-xl border transition-colors ${
                      discussionSeconds === opt.sec
                        ? 'bg-black text-white border-black font-black shadow-xs'
                        : 'bg-white text-black border-neutral-300 hover:border-black'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Ajuste fino + / - 30s */}
              <div className="flex items-center justify-between pt-0.5 text-[10px] font-mono text-neutral-600">
                <span>Ajuste fino (+ / - 30s):</span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={discussionSeconds <= 30}
                    onClick={() => {
                      sounds.playClick();
                      setDiscussionSeconds(prev => Math.max(30, prev - 30));
                    }}
                    className="px-2 py-0.5 border border-black rounded-lg hover:bg-black hover:text-white disabled:opacity-30 transition-colors font-bold"
                  >
                    -30s
                  </button>
                  <button
                    type="button"
                    disabled={discussionSeconds >= 600}
                    onClick={() => {
                      sounds.playClick();
                      setDiscussionSeconds(prev => Math.min(600, prev + 30));
                    }}
                    className="px-2 py-0.5 border border-black rounded-lg hover:bg-black hover:text-white disabled:opacity-30 transition-colors font-bold"
                  >
                    +30s
                  </button>
                </div>
              </div>
              <p className="text-[9.5px] font-mono text-neutral-500 leading-tight">
                ⏳ Ao término deste tempo na assembleia, a fase de votação iniciará automaticamente.
              </p>
            </div>

            {/* ========================================================= */}
            {/* REGRA DE PROTEÇÃO: BLOQUEAR ELIMINAÇÃO NA 1ª NOITE */}
            {/* ========================================================= */}
            <div
              onClick={() => {
                sounds.playClick();
                const nextVal = !blockFirstNightElimination;
                setBlockFirstNightElimination(nextVal);
                try {
                  localStorage.setItem(BLOCK_FIRST_NIGHT_KEY, String(nextVal));
                } catch {}
              }}
              className={`p-3 border-2 rounded-2xl cursor-pointer transition-all flex items-center justify-between gap-3 ${
                blockFirstNightElimination
                  ? 'border-emerald-600 bg-emerald-50/90 shadow-xs'
                  : 'border-black bg-neutral-50 hover:bg-neutral-100'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck
                    size={15}
                    className={blockFirstNightElimination ? 'text-emerald-700 shrink-0' : 'text-black shrink-0'}
                  />
                  <span className="font-black uppercase tracking-wider text-black text-[11px]">
                    Bloquear Eliminação na 1ª Noite
                  </span>
                </div>
                <p className="text-[9.5px] font-mono text-neutral-600 leading-tight mt-0.5">
                  Impede que os Soldados eliminem alguém na primeira noite, garantindo que todos participem do 1º Dia.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={blockFirstNightElimination}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-black transition-colors ${
                  blockFirstNightElimination ? 'bg-emerald-600' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white border border-black transition-transform ${
                    blockFirstNightElimination ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>
            </div>

            {/* ========================================================= */}
            {/* CARDS ESPECIAIS & MODIFICADORES (SORTEIO SECUNDÁRIO) */}
            {/* ========================================================= */}
            <div className="p-3 border-2 border-black rounded-2xl bg-neutral-50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-black text-[11px] flex items-center gap-1.5">
                  <Sparkles size={14} className="text-black" />
                  <span>Modificadores / Cards Especiais:</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-500 font-bold">
                  Sorteio Secundário
                </span>
              </div>
              <p className="text-[10px] text-neutral-600 leading-tight">
                Ative individualmente os modificadores secretos. Eles são sorteados além do papel principal!
              </p>

              {/* Time dos Soldados */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono font-black uppercase text-red-700 tracking-wider block">
                  A) Modificador dos Soldados (Lobos):
                </span>
                <label className="flex items-start gap-2.5 p-2 bg-white border border-black/30 rounded-xl cursor-pointer hover:border-black transition-colors">
                  <input
                    type="checkbox"
                    checked={modifiersConfig.falsoProfeta}
                    onChange={e => {
                      sounds.playClick();
                      setModifiersConfig(prev => ({ ...prev, falsoProfeta: e.target.checked }));
                    }}
                    className="mt-0.5 accent-black w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex-1 text-[10px] leading-tight font-mono">
                    <div className="flex items-center justify-between">
                      <strong className="text-black font-black uppercase">Falso Profeta</strong>
                      <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.2 rounded font-bold">
                        1 Soldado
                      </span>
                    </div>
                    <p className="text-neutral-600 text-[9.5px] mt-0.5">
                      Na <strong>1ª vez</strong> investigado (Profeta ou Apóstolo), sua equipe aparecerá como <strong>Ovelha</strong>. A partir da 2ª vez, revelará <strong>Soldado</strong>.
                    </p>
                  </div>
                </label>
              </div>

              {/* Time das Ovelhas */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[9px] font-mono font-black uppercase text-blue-700 tracking-wider block">
                  B) Modificadores das Ovelhas (Independentes):
                </span>

                {/* Espião */}
                <label className="flex items-start gap-2.5 p-2 bg-white border border-black/30 rounded-xl cursor-pointer hover:border-black transition-colors">
                  <input
                    type="checkbox"
                    checked={modifiersConfig.espiao}
                    onChange={e => {
                      sounds.playClick();
                      setModifiersConfig(prev => ({ ...prev, espiao: e.target.checked }));
                    }}
                    className="mt-0.5 accent-black w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex-1 text-[10px] leading-tight font-mono">
                    <div className="flex items-center justify-between">
                      <strong className="text-black font-black uppercase">Espião</strong>
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                        Uso Único
                      </span>
                    </div>
                    <p className="text-neutral-600 text-[9.5px] mt-0.5">
                      Permite espionar 1 jogador a qualquer momento para descobrir sua <strong>função exata</strong> (1x por partida).
                    </p>
                  </div>
                </label>

                {/* Anjo */}
                <label className="flex items-start gap-2.5 p-2 bg-white border border-black/30 rounded-xl cursor-pointer hover:border-black transition-colors">
                  <input
                    type="checkbox"
                    checked={modifiersConfig.anjo}
                    onChange={e => {
                      sounds.playClick();
                      setModifiersConfig(prev => ({ ...prev, anjo: e.target.checked }));
                    }}
                    className="mt-0.5 accent-black w-4 h-4 rounded cursor-pointer"
                  />
                  <div className="flex-1 text-[10px] leading-tight font-mono">
                    <div className="flex items-center justify-between">
                      <strong className="text-black font-black uppercase">Anjo</strong>
                      <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-bold">
                        Uso Único
                      </span>
                    </div>
                    <p className="text-neutral-600 text-[9.5px] mt-0.5">
                      Pode se <strong>sacrificar durante a noite</strong> para salvar a pessoa que seria morta pelos Soldados (1x por partida).
                    </p>
                  </div>
                </label>

                <div className="p-1.5 bg-neutral-100 border border-black/20 rounded-lg text-[9px] font-mono text-neutral-600 leading-tight">
                  🔒 <strong>Validação Obrigatória:</strong> O Anjo e o Espião NUNCA são atribuídos ao mesmo jogador na mesma partida.
                </div>
              </div>
            </div>

            {/* Ações Finais do Passo 2 */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleStartFinalGame}
                disabled={!isDeckValid}
                className={`w-full py-3.5 rounded-full flex items-center justify-center space-x-2 text-xs font-mono font-black uppercase tracking-widest transition-transform ${
                  isDeckValid
                    ? 'bg-black text-white active:scale-95 shadow-md hover:bg-neutral-800'
                    : 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                }`}
              >
                <Play size={14} />
                <span>
                  {totalAllocated !== totalPlayers
                    ? `AJUSTE PARA ${totalPlayers} PAPÉIS (${totalAllocated}/${totalPlayers})`
                    : currentSoldiers === 0
                    ? 'ADICIONE PELO MENOS 1 SOLDADO'
                    : `INICIAR PARTIDA (${totalPlayers} JOGADORES)`}
                </span>
                <FourPointStar size={12} />
              </button>

              <button
                onClick={() => setStep('NAMES')}
                className="w-full py-2 border border-black/40 rounded-full text-[11px] font-bold uppercase hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1.5 text-neutral-700"
              >
                <ArrowLeft size={13} /> Voltar aos Nomes
              </button>
            </div>
          </div>
        )}

        {/* Modal de Personalização de Avatar e Cor para o Integrante Selecionado */}
        {customizingPlayerIdx !== null && players[customizingPlayerIdx] !== undefined && (() => {
          const targetName = players[customizingPlayerIdx]?.trim() || `Player ${customizingPlayerIdx + 1}`;
          const currentProf = playerProfiles[targetName] || {
            color: '#F59E0B',
            avatar: encodeAvatar(getRandomAvatar(targetName)),
          };
          const otherTakenColors = players
            .map((name, i) =>
              i === customizingPlayerIdx ? null : playerProfiles[name.trim() || `Player ${i + 1}`]?.color
            )
            .filter((c): c is string => Boolean(c));

          return (
            <AvatarCustomizerModal
              isOpen={true}
              onClose={() => setCustomizingPlayerIdx(null)}
              initialAvatar={currentProf.avatar}
              initialColor={currentProf.color}
              playerName={targetName}
              takenColors={otherTakenColors}
              onSave={(newAvatar, newColor) => {
                const resolvedColor = pickRandomAvailableColor(newColor, otherTakenColors).color;
                const nextProfiles = {
                  ...playerProfiles,
                  [targetName]: {
                    avatar: newAvatar,
                    color: resolvedColor,
                  },
                };
                saveProfilesToStorage(nextProfiles);
                setCustomizingPlayerIdx(null);
              }}
            />
          );
        })()}
      </div>
    </div>
  );
};
