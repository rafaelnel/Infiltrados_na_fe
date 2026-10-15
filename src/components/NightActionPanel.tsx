import React, { useState, useEffect } from 'react';
import { Player, Role, Team, MODIFIERS_METADATA } from '../types/game';
import { RoleIllustration, FourPointStar } from './RoleIllustrations';
import { sounds } from '../utils/audio';
import {
  Shield,
  Sparkles,
  Crosshair,
  Users,
  Eye,
  Moon,
  Heart,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Check,
  Search,
} from 'lucide-react';

interface Props {
  player: Player;
  allPlayers: Player[];
  canSelfProtectPastor: boolean;
  onPerformAction: (
    targetId: string,
    secondaryTargetId?: string,
    angelSacrificeTonight?: boolean,
    spyData?: { targetId: string; result: string }
  ) => void;
  onAdvanceNight?: () => void;
  isHost?: boolean;
}

export const NightActionPanel: React.FC<Props> = ({
  player,
  allPlayers,
  canSelfProtectPastor,
  onPerformAction,
  onAdvanceNight,
  isHost,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(player.nightActionTargetId);
  const [selectedSecondaryId, setSelectedSecondaryId] = useState<string | null>(
    player.nightActionSecondaryId || null
  );

  // Estado para fluxo em duas etapas:
  // Etapa 1: Mostrar resultado primeiro
  // Etapa 2: Finalizar ação noturna
  const [resultRevealed, setResultRevealed] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  // Estados dos Modificadores Especiais
  const [angelSacrifice, setAngelSacrifice] = useState<boolean>(Boolean(player.angelSacrificeTonight));
  const [spyTargetId, setSpyTargetId] = useState<string | null>(null);
  const [spyPerformed, setSpyPerformed] = useState<boolean>(Boolean(player.spyUsed));
  const [spyResultText, setSpyResultText] = useState<string | null>(player.spyResult || null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setSelectedTargetId(player.nightActionTargetId);
    setSelectedSecondaryId(player.nightActionSecondaryId || null);
    setResultRevealed(false);
    setResultMessage(null);
    setAngelSacrifice(Boolean(player.angelSacrificeTonight));
    setSpyTargetId(null);
    setActionError(null);
    setSpyPerformed(Boolean(player.spyUsed));
    setSpyResultText(player.spyResult || null);
  }, [player.id, player.role]);

  const livingPlayers = allPlayers.filter(p => p.isAlive);

  // Filtros de alvos válidos de acordo com as regras
  let validTargets = livingPlayers;
  if (player.role === 'PASTOR' && !canSelfProtectPastor) {
    validTargets = livingPlayers.filter(p => p.id !== player.id);
  } else if (player.role === 'SOLDADO') {
    // Soldados não atacam seus companheiros infiltrados
    validTargets = livingPlayers.filter(p => p.team !== 'SOLDADOS');
  }

  // Pastor: Restrição de não proteger a mesma pessoa em duas noites consecutivas
  const pastorBlockedTargetId = player.role === 'PASTOR' ? player.lastProtectedTargetId : null;
  const pastorBlockedPlayer = pastorBlockedTargetId
    ? allPlayers.find(p => p.id === pastorBlockedTargetId)
    : null;

  // =========================================================================
  // Habilidade do Espião (Modificador Especial - Uso Único)
  // =========================================================================
  const handleExecuteSpy = () => {
    if (!spyTargetId || spyPerformed) return;
    sounds.playClick();
    const target = allPlayers.find(p => p.id === spyTargetId);
    if (!target) return;

    const res = `✦ ESPIONAGEM CONCLUÍDA:\nO jogador ${target.name} possui a função secreta: ${target.role} (Equipe: ${target.team})!`;
    setSpyResultText(res);
    setSpyPerformed(true);
  };

  // =========================================================================
  // ETAPA 1: Gerar e exibir o resultado primeiro para o jogador
  // =========================================================================
  const handleRevealResult = () => {
    sounds.playClick();

    // 1. Apóstolo (compara 2 jogadores e avalia afinidade de equipe)
    // Considera Falso Profeta na primeira investigação
    if (player.role === 'APOSTOLO') {
      if (!selectedTargetId || !selectedSecondaryId || selectedTargetId === selectedSecondaryId) return;
      const t1 = allPlayers.find(p => p.id === selectedTargetId);
      const t2 = allPlayers.find(p => p.id === selectedSecondaryId);
      if (t1 && t2) {
        let team1: Team = t1.team;
        let team2: Team = t2.team;

        if (t1.modifier === 'FALSO_PROFETA') {
          team1 = (t1.investigationCount || 0) === 0 ? 'OVELHAS' : 'SOLDADOS';
        }
        if (t2.modifier === 'FALSO_PROFETA') {
          team2 = (t2.investigationCount || 0) === 0 ? 'OVELHAS' : 'SOLDADOS';
        }

        const isSame = team1 === team2;
        setResultMessage(
          isSame
            ? `✦ DISCERNIMENTO DE AFINIDADE:\n${t1.name} e ${t2.name} pertencem à MESMA EQUIPE!`
            : `✦ DISCERNIMENTO DE AFINIDADE:\n${t1.name} e ${t2.name} pertencem a EQUIPES DIFERENTES!`
        );
        setResultRevealed(true);
      }
      return;
    }

    // 2. Profeta: Investiga 1 jogador por noite.
    // RETORNO: Revela APENAS a equipe do alvo ("Soldado" ou "Ovelha"), sem revelar a função específica.
    // Falso Profeta: Na PRIMEIRA VEZ investigado, aparece como "Ovelha". A partir da segunda, "Soldado".
    if (player.role === 'PROFETA') {
      if (!selectedTargetId) return;
      const target = allPlayers.find(p => p.id === selectedTargetId);
      if (target) {
        let revealedTeam = target.team === 'SOLDADOS' ? 'Soldado' : 'Ovelha';
        if (target.modifier === 'FALSO_PROFETA') {
          if ((target.investigationCount || 0) === 0) {
            revealedTeam = 'Ovelha'; // Disfarce na 1ª vez
          } else {
            revealedTeam = 'Soldado'; // Real na 2ª vez
          }
        }

        setResultMessage(
          `✦ REVELAÇÃO DO PROFETA:\nO jogador ${target.name} pertence à equipe: ${revealedTeam.toUpperCase()}!\n(Apenas a equipe é revelada pela visão celestial).`
        );
        setResultRevealed(true);
      }
      return;
    }

    // 3. Pastor (protege 1 jogador ou abstém)
    // Restrição: Não pode proteger a mesma pessoa em duas noites consecutivas
    if (player.role === 'PASTOR') {
      sounds.playHolyBlessing();
      if (selectedTargetId === 'ABSTAIN' || !selectedTargetId) {
        setResultMessage('✦ VIGÍLIA DO PASTOR:\nVocê optou por não proteger ninguém nesta noite.');
      } else {
        const target = allPlayers.find(p => p.id === selectedTargetId);
        setResultMessage(
          `✦ ESCUDO DO PASTOR:\n${
            target ? target.name : 'O jogador escolhido'
          } foi abençoado e está PROTEGIDO contra o ataque dos Soldados nesta noite!\n(Lembrete: você não poderá proteger ${
            target ? target.name : 'este jogador'
          } na próxima noite).`
        );
      }
      setResultRevealed(true);
      return;
    }

    // 4. Evangelista: Ore por 1 jogador a cada noite.
    // Restrição: Requer orar 2 vezes no mesmo Soldado para convertê-lo a Ovelha simples.
    // Limite: Apenas 1 única conversão bem-sucedida por partida.
    if (player.role === 'EVANGELISTA') {
      sounds.playHolyBlessing();
      const target = allPlayers.find(p => p.id === selectedTargetId);
      if (target) {
        const accumulated = (target.prayersReceived || 0) + 1;
        setResultMessage(
          `✦ ORAÇÃO DE REDENÇÃO:\nVocê orou fervorosamente por ${target.name}!\nEle acumula ${accumulated} oração(ões). Se for um Soldado e atingir 2 orações, será convertido em Ovelha simples (máximo de 1 conversão na partida).`
        );
      } else {
        setResultMessage('✦ ORAÇÃO:\nVocê não escolheu nenhum alvo para orar nesta noite.');
      }
      setResultRevealed(true);
      return;
    }

    // 5. Soldado (escolhe vítima para matar)
    if (player.role === 'SOLDADO') {
      const target = allPlayers.find(p => p.id === selectedTargetId);
      const multipleSoldiers = allPlayers.filter(p => p.role === 'SOLDADO' && p.isAlive && !p.converted).length >= 2;
      if (target) {
        setResultMessage(
          `✦ GOLPE DAS SOMBRAS:\nVocê marcou ${target.name} como o alvo a ser eliminado nesta noite.\n\n${
            multipleSoldiers
              ? '⚖️ Regra de Conspiração: Como há 2 ou mais Soldados ativos, se todos escolherem o mesmo nome a pessoa morre com certeza. Se escolherem nomes diferentes, a vítima será sorteada entre os escolhidos!'
              : '🗡️ Você é o único Soldado ativo e sua escolha é definitiva.'
          }`
        );
      } else {
        setResultMessage('✦ CONSPIRAÇÃO:\nNenhuma vítima foi selecionada.');
      }
      setResultRevealed(true);
      return;
    }

    // 6. Ovelha / Mestre
    setResultMessage('✦ DESCANSO DO REBANHO:\nVocê passou a noite em paz na sua cabana, orando pela vila.');
    setResultRevealed(true);
  };

  // =========================================================================
  // ETAPA 2: Finalizar ação noturna e passar para o próximo jogador
  // =========================================================================
  const handleFinalizeAction = () => {
    sounds.playClick();
    const finalTarget = selectedTargetId || 'ABSTAIN';
    const spyData = spyPerformed && spyTargetId && spyResultText
      ? { targetId: spyTargetId, result: spyResultText }
      : undefined;

    onPerformAction(
      finalTarget,
      selectedSecondaryId || undefined,
      angelSacrifice,
      spyData
    );
  };

  // Se o jogador quiser alterar a escolha antes de finalizar
  const handleResetChoice = () => {
    sounds.playClick();
    setResultRevealed(false);
    setResultMessage(null);
  };

  // Pastor: Se tentar selecionar o jogador bloqueado, não permite
  const handleSelectTarget = (targetId: string) => {
    sounds.playClick();
    if (player.role === 'PASTOR' && pastorBlockedTargetId && targetId === pastorBlockedTargetId) {
      setActionError(`Você não pode proteger ${pastorBlockedPlayer?.name || 'esta pessoa'} em duas noites consecutivas!`);
      return;
    }
    setActionError(null);
    setSelectedTargetId(targetId);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-3 sm:p-5 space-y-4 animate-fadeIn select-none bg-[#0B132B] text-white rounded-2xl">
      {/* Header Info - MODO ESCURO COM FUNDO AZUL ESCURO E LETRAS BRANCAS */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#1C2541] border border-indigo-400/40 text-indigo-200 rounded-full text-[11px] font-mono uppercase tracking-widest">
          <Moon size={13} className="text-indigo-300" />
          <span>Fase da Noite — Ação Oculta</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white font-sans">
          {player.role === 'SOLDADO' && 'CONSPIRAÇÃO DOS SOLDADOS'}
          {player.role === 'PASTOR' && 'GUARDA DO PASTOR'}
          {player.role === 'EVANGELISTA' && 'ORAÇÃO DE REDENÇÃO'}
          {player.role === 'APOSTOLO' && 'DISCERNIMENTO DE AFINIDADE'}
          {player.role === 'PROFETA' && 'REVELAÇÃO DO PROFETA'}
          {(player.role === 'OVELHA' || player.role === 'MESTRE') && 'REPOUSO NO APRISCO'}
        </h2>
        <p className="text-xs font-mono text-slate-300 max-w-sm mx-auto leading-relaxed">
          {player.role === 'SOLDADO' &&
            'Escolha uma vítima para eliminar. Havendo 2 ou mais Soldados: se escolherem o mesmo alvo, ele morre; caso divirjam, a vítima será sorteada entre os escolhidos.'}
          {player.role === 'PASTOR' &&
            'Escolha 1 jogador para proteger de eliminação. Não pode proteger a mesma pessoa em duas noites seguidas.'}
          {player.role === 'EVANGELISTA' &&
            'Ore por 1 jogador a cada noite. 2 orações no mesmo Soldado o convertem a Ovelha simples (máximo 1 conversão por partida).'}
          {player.role === 'APOSTOLO' &&
            'Selecione 2 jogadores vivos para descobrir se pertencem à mesma equipe.'}
          {player.role === 'PROFETA' &&
            'Investigue 1 jogador por noite para descobrir APENAS sua equipe ("Soldado" ou "Ovelha").'}
          {(player.role === 'OVELHA' || player.role === 'MESTRE') &&
            'Você não possui ações noturnas principais. Descanse no aprisco e prepare-se para a assembleia.'}
        </p>

        {actionError && (
          <div className="mt-2 p-2.5 bg-red-950/80 border border-red-500 rounded-xl text-red-200 text-xs font-mono font-bold flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="ml-2 font-black text-xs hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* Role Illustration & Card */}
      <div className="flex justify-center items-center py-1">
        <div className="p-3 bg-white/95 rounded-2xl border-2 border-indigo-400/40 shadow-lg shadow-black/40">
          <RoleIllustration role={player.role} className="w-24 h-24 sm:w-28 sm:h-28" />
        </div>
      </div>

      {/* ===================================================================== */}
      {/* SE O JOGADOR POSSUI UM MODIFICADOR ESPECIAL (CARD SECUNDÁRIO) */}
      {/* ===================================================================== */}
      {player.modifier && (
        <div className="p-3 bg-[#141E3D] border border-amber-400/60 rounded-xl space-y-2 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-300 uppercase flex items-center gap-1.5 text-[11px]">
              <Sparkles size={13} className="text-amber-400" />
              <span>Card Especial: {MODIFIERS_METADATA[player.modifier]?.name}</span>
            </span>
            <span className="text-[10px] bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full font-bold border border-amber-400/30">
              {MODIFIERS_METADATA[player.modifier]?.badge}
            </span>
          </div>

          {/* 1. Habilidade do Anjo */}
          {player.modifier === 'ANJO' && (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] text-slate-300 leading-tight">
                Você pode se <strong>sacrificar nesta noite</strong> para salvar a pessoa que for atacada pelos Soldados (uso único).
              </p>
              {player.angelUsed ? (
                <div className="p-2 bg-indigo-950/60 border border-slate-600 rounded-lg text-slate-400 text-[10px]">
                  ✓ Sacrifício heroico já utilizado nesta partida.
                </div>
              ) : (
                <label className="flex items-center gap-2 p-2 bg-[#1C2541] border border-indigo-400/50 rounded-xl cursor-pointer hover:border-indigo-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={angelSacrifice}
                    onChange={e => {
                      sounds.playClick();
                      setAngelSacrifice(e.target.checked);
                    }}
                    className="accent-white w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="text-[11px] font-bold text-white">
                    {angelSacrifice
                      ? '🕊️ SACRIFÍCIO HEROICO ATIVADO PARA ESTA NOITE'
                      : 'Ativar Sacrifício Heroico nesta noite?'}
                  </span>
                </label>
              )}
            </div>
          )}

          {/* 2. Habilidade do Espião */}
          {player.modifier === 'ESPIAO' && (
            <div className="space-y-2 pt-1">
              <p className="text-[10px] text-slate-300 leading-tight">
                Espione 1 jogador para descobrir sua <strong>função exata</strong> (uso único, 1 vez por partida).
              </p>
              {spyPerformed || player.spyUsed ? (
                <div className="p-2.5 bg-[#1C2541] border border-indigo-400/50 rounded-xl text-emerald-300 text-[11px] whitespace-pre-line font-bold">
                  {spyResultText || player.spyResult || '✓ Espionagem já executada nesta partida.'}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto p-1 bg-[#0B132B] rounded-lg border border-indigo-900/60">
                    {livingPlayers
                      .filter(p => p.id !== player.id)
                      .map(p => (
                        <button
                          key={'spy_' + p.id}
                          onClick={() => {
                            sounds.playClick();
                            setSpyTargetId(p.id);
                          }}
                          className={`p-1.5 rounded text-[10px] font-mono font-bold truncate border transition-all text-left ${
                            spyTargetId === p.id
                              ? 'bg-amber-500 text-black border-white'
                              : 'bg-[#1C2541] text-slate-200 border-indigo-900/60 hover:border-indigo-400'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                  </div>
                  <button
                    onClick={handleExecuteSpy}
                    disabled={!spyTargetId}
                    className="w-full py-1.5 bg-amber-400 text-black rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-amber-300 disabled:opacity-40 transition-colors"
                  >
                    🔍 Espionar Função Exata Agora (Uso Único)
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. Passiva do Falso Profeta */}
          {player.modifier === 'FALSO_PROFETA' && (
            <p className="text-[10px] text-amber-200 leading-tight">
              Sua passiva está ativa: na 1ª vez investigado, você aparecerá como Ovelha. (Investigações sofridas até agora: {player.investigationCount || 0}).
            </p>
          )}
        </div>
      )}

      {/* ===================================================================== */}
      {/* SE O RESULTADO JÁ FOI MOSTRADO (ETAPA 1 CONCLUÍDA) */}
      {/* Mostra o resultado claramente e exibe o SEGUNDO BOTÃO: Finalizar */}
      {/* ===================================================================== */}
      {resultRevealed ? (
        <div className="space-y-4 flex-1 flex flex-col justify-center animate-fadeIn">
          {/* Caixa de Resultado em Destaque Noturno */}
          <div className="p-5 bg-[#1C2541] border-2 border-indigo-400 rounded-2xl text-center space-y-3 shadow-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest">
              <CheckCircle2 size={13} className="text-emerald-400" />
              <span>Resultado da Sua Ação Noturna</span>
            </div>

            <p className="text-sm sm:text-base font-mono font-black text-white whitespace-pre-line leading-relaxed">
              {resultMessage}
            </p>

            <p className="text-[11px] font-mono text-slate-300 pt-1">
              Guarde esta informação em segredo. Ao clicar no botão abaixo, a tela será bloqueada para que o próximo jogador possa agir.
            </p>
          </div>

          {/* Botões: Finalizar Ação Noturna (Principal) e Alterar Escolha */}
          <div className="space-y-2">
            <button
              onClick={handleFinalizeAction}
              className="w-full bg-white text-[#0B132B] py-4 px-6 rounded-full flex items-center justify-center space-x-2 font-mono text-xs sm:text-sm font-black tracking-widest uppercase hover:bg-slate-200 active:scale-[0.98] transition-all shadow-xl shadow-indigo-900/50"
            >
              <FourPointStar size={16} className="text-[#0B132B]" />
              <span>FINALIZAR AÇÃO NOTURNA</span>
              <FourPointStar size={16} className="text-[#0B132B]" />
            </button>

            <button
              onClick={handleResetChoice}
              className="w-full py-2.5 border border-indigo-400/40 rounded-full text-[11px] font-mono text-indigo-200 hover:text-white hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={13} />
              <span>Alterar Escolha</span>
            </button>
          </div>
        </div>
      ) : (
        /* ===================================================================== */
        /* SE O RESULTADO AINDA NÃO FOI MOSTRADO (FASE DE SELEÇÃO DE ALVOS) */
        /* ===================================================================== */
        <div className="space-y-3 flex-1 flex flex-col justify-center">
          {/* 1. SE FOR OVELHA OU MESTRE (Sem ações ativas) */}
          {player.role === 'OVELHA' || player.role === 'MESTRE' ? (
            <div className="p-5 border-2 border-indigo-400/30 rounded-2xl bg-[#1C2541] text-center space-y-3">
              <Heart size={32} className="text-rose-400 mx-auto" />
              <h3 className="text-sm font-black uppercase text-white font-mono">
                Noite de Silêncio e Oração
              </h3>
              <p className="text-xs font-mono text-slate-300 leading-relaxed max-w-xs mx-auto">
                Você não possui ações noturnas principais. Descanse no aprisco e ore pelo rebanho.
              </p>
              {player.role === 'MESTRE' && (
                <div className="text-[11px] font-mono text-amber-300 bg-amber-950/40 border border-amber-500/40 p-2 rounded-xl">
                  👑 Você é o <strong>Mestre</strong>! Poderá ativar secretamente seu voto duplo (peso 2) nas votações do dia (máximo 2 vezes por partida).
                </div>
              )}

              {/* Botão 1: Ver Orientação / Confirmar repouso */}
              <button
                onClick={handleRevealResult}
                className="w-full py-3.5 bg-white text-[#0B132B] rounded-full text-xs font-mono font-black uppercase tracking-widest hover:bg-slate-200 active:scale-95 transition-all shadow-md mt-2"
              >
                CONFIRMAR REPOUSO E VER CONFIRMAÇÃO
              </button>
            </div>
          ) : /* 2. SE FOR APÓSTOLO (Seleciona 2 jogadores para comparar equipe) */
          player.role === 'APOSTOLO' ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase text-indigo-300 block">
                  1º Jogador para comparar:
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-indigo-400/40 rounded-xl bg-[#141E3D]">
                  {livingPlayers.map(p => (
                    <button
                      key={'apostle_1_' + p.id}
                      onClick={() => {
                        sounds.playClick();
                        setSelectedTargetId(p.id);
                      }}
                      className={`p-2 rounded-lg text-xs font-mono font-bold truncate border transition-all text-left ${
                        selectedTargetId === p.id
                          ? 'bg-blue-600 text-white border-white shadow-md'
                          : 'bg-[#1C2541] text-slate-200 border-indigo-900/60 hover:border-indigo-400'
                      }`}
                    >
                      {p.name} {p.id === player.id ? '(Você)' : ''}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono font-bold uppercase text-indigo-300 block">
                  2º Jogador para comparar:
                </span>
                <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-indigo-400/40 rounded-xl bg-[#141E3D]">
                  {livingPlayers
                    .filter(p => p.id !== selectedTargetId)
                    .map(p => (
                      <button
                        key={'apostle_2_' + p.id}
                        onClick={() => {
                          sounds.playClick();
                          setSelectedSecondaryId(p.id);
                        }}
                        className={`p-2 rounded-lg text-xs font-mono font-bold truncate border transition-all text-left ${
                          selectedSecondaryId === p.id
                            ? 'bg-blue-600 text-white border-white shadow-md'
                            : 'bg-[#1C2541] text-slate-200 border-indigo-900/60 hover:border-indigo-400'
                        }`}
                      >
                        {p.name} {p.id === player.id ? '(Você)' : ''}
                      </button>
                    ))}
                </div>
              </div>

              {/* Botão 1 do Apóstolo */}
              <button
                onClick={handleRevealResult}
                disabled={!selectedTargetId || !selectedSecondaryId}
                className={`w-full py-3.5 rounded-full flex items-center justify-center space-x-2 font-mono text-xs font-black tracking-widest uppercase transition-all ${
                  selectedTargetId && selectedSecondaryId
                    ? 'bg-white text-[#0B132B] hover:bg-slate-200 active:scale-95 shadow-lg'
                    : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Eye size={15} />
                <span>VER RESULTADO DA AFINIDADE</span>
              </button>
            </div>
          ) : (
            /* 3. DEMAIS PAPÉIS: PASTOR, EVANGELISTA, PROFETA, SOLDADO */
            <div className="space-y-2.5">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-mono font-bold uppercase text-indigo-300">
                  {player.role === 'PASTOR' && 'Selecione quem proteger nesta noite:'}
                  {player.role === 'EVANGELISTA' && 'Selecione por quem orar:'}
                  {player.role === 'PROFETA' && 'Selecione quem investigar (apenas equipe):'}
                  {player.role === 'SOLDADO' && 'Selecione o alvo do ataque:'}
                </span>

                {/* Opção rápida de abstenção para o Pastor */}
                {player.role === 'PASTOR' && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setSelectedTargetId('ABSTAIN');
                    }}
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border transition-colors ${
                      selectedTargetId === 'ABSTAIN'
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'text-indigo-300 border-indigo-500/50 hover:bg-white/10'
                    }`}
                  >
                    Não Proteger Ninguém
                  </button>
                )}
              </div>

              {/* Pastor: Alerta de restrição se houver alguém protegido na noite anterior */}
              {player.role === 'PASTOR' && pastorBlockedPlayer && (
                <div className="p-2 bg-amber-950/40 border border-amber-500/50 rounded-xl text-[10px] font-mono text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle size={13} className="shrink-0" />
                  <span>
                    <strong>{pastorBlockedPlayer.name}</strong> foi protegido ontem. Regra: Não pode proteger a mesma pessoa em 2 noites seguidas!
                  </span>
                </div>
              )}

              {/* Grid de Seleção de Alvos */}
              <div className="grid grid-cols-2 gap-2 max-h-44 overflow-y-auto p-1.5 border border-indigo-400/40 rounded-2xl bg-[#141E3D]">
                {/* Opção explícita de abstenção dentro da lista para o Pastor */}
                {player.role === 'PASTOR' && (
                  <button
                    onClick={() => {
                      sounds.playClick();
                      setSelectedTargetId('ABSTAIN');
                    }}
                    className={`p-2.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                      selectedTargetId === 'ABSTAIN'
                        ? 'bg-blue-600 text-white border-white scale-[0.98] shadow-md'
                        : 'bg-[#1C2541] text-slate-200 border-indigo-900/60 hover:border-indigo-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold font-mono">🛡️ Não Proteger</span>
                    </div>
                    <span className="text-[9px] text-slate-300 mt-1">
                      Passar guarda sem escudo
                    </span>
                  </button>
                )}

                {validTargets.map(target => {
                  const isSelected = selectedTargetId === target.id;
                  const isBlockedConsecutive =
                    player.role === 'PASTOR' && pastorBlockedTargetId === target.id;

                  return (
                    <button
                      key={target.id}
                      disabled={isBlockedConsecutive}
                      onClick={() => handleSelectTarget(target.id)}
                      className={`p-2.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                        isBlockedConsecutive
                          ? 'opacity-40 bg-neutral-900 border-neutral-700 cursor-not-allowed'
                          : isSelected
                          ? 'bg-blue-600 text-white border-white scale-[0.98] shadow-md'
                          : 'bg-[#1C2541] text-slate-200 border-indigo-900/60 hover:border-indigo-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-mono truncate">{target.name}</span>
                        {player.role === 'EVANGELISTA' && target.prayersReceived > 0 && (
                          <span className="text-[9px] font-mono bg-indigo-950 text-indigo-200 px-1.5 py-0.5 rounded-full font-bold border border-indigo-400/40">
                            {target.prayersReceived} 🙏
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-300 mt-1">
                        {isBlockedConsecutive
                          ? 'Protegido ontem (Bloqueado)'
                          : target.id === player.id
                          ? 'Você mesmo'
                          : 'Membro da vila'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Botão 1: PRIMEIRO BOTÃO PARA MOSTRAR O RESULTADO */}
              <div className="pt-1">
                <button
                  onClick={handleRevealResult}
                  disabled={!selectedTargetId}
                  className={`w-full py-3.5 rounded-full flex items-center justify-center space-x-2 font-mono text-xs font-black tracking-widest uppercase transition-all ${
                    selectedTargetId
                      ? 'bg-white text-[#0B132B] hover:bg-slate-200 active:scale-95 shadow-lg'
                      : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  <Eye size={15} />
                  <span>
                    {player.role === 'PROFETA'
                      ? 'INVESTIGAR E VER EQUIPE DO ALVO'
                      : player.role === 'PASTOR'
                      ? 'CONFIRMAR GUARDA E VER RESULTADO'
                      : player.role === 'EVANGELISTA'
                      ? 'ORAR E VER RESULTADO'
                      : 'CONFIRMAR ALVO E VER RESULTADO'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Host emergency advance button if needed */}
      {isHost && onAdvanceNight && (
        <button
          onClick={onAdvanceNight}
          className="w-full py-2 border border-indigo-400/40 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-300 hover:bg-white/10 transition-colors"
        >
          Amanhecer o Dia (Avançar como Anfitrião)
        </button>
      )}
    </div>
  );
};
