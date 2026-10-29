import React, { useState } from 'react';
import { Player, Role } from '../types/game';
import { sounds } from '../utils/audio';
import { FourPointStar } from './RoleIllustrations';
import { PersonAvatar } from './PersonAvatar';
import { Scale, CheckCircle2, UserX, AlertTriangle, Crown } from 'lucide-react';

interface Props {
  currentPlayer: Player;
  players: Player[];
  onCastVote: (targetId: string | 'ABSTAIN', useDoubleVote?: boolean) => void;
  onAdvanceVoting?: () => void;
  isHost?: boolean;
  isSecretBallot?: boolean;
  hideAvatars?: boolean;
}

export const VotingPanel: React.FC<Props> = ({
  currentPlayer,
  players,
  onCastVote,
  onAdvanceVoting,
  isHost,
  isSecretBallot = false,
  hideAvatars = false,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string | null>(currentPlayer.voteTargetId);
  const [hasConfirmedVote, setHasConfirmedVote] = useState(Boolean(currentPlayer.voteTargetId));

  // Mestre: Voto duplo secreto (máximo 2 vezes por partida)
  const isMaster = currentPlayer.role === 'MESTRE';
  const doubleVotesRemaining = currentPlayer.masterDoubleVotesRemaining ?? (isMaster ? 2 : 0);
  const [useDoubleVote, setUseDoubleVote] = useState<boolean>(false);

  React.useEffect(() => {
    setSelectedTargetId(currentPlayer.voteTargetId);
    setHasConfirmedVote(Boolean(currentPlayer.voteTargetId));
    setUseDoubleVote(false);
  }, [currentPlayer.id, currentPlayer.voteTargetId]);

  const livingPlayers = players.filter(p => p.isAlive);

  // Compute live vote tallies
  const voteTallies = new Map<string, number>();
  let totalVotesCast = 0;

  livingPlayers.forEach(p => {
    if (p.voteTargetId && p.voteTargetId !== 'ABSTAIN') {
      const weight = p.usedDoubleVoteThisRound ? 2 : 1;
      voteTallies.set(p.voteTargetId, (voteTallies.get(p.voteTargetId) || 0) + weight);
      totalVotesCast += weight;
    }
  });

  const handleVoteSubmit = () => {
    if (!selectedTargetId) return;
    sounds.playGavelStrike();
    onCastVote(selectedTargetId, isMaster && doubleVotesRemaining > 0 && useDoubleVote);
    setHasConfirmedVote(true);
  };

  const handleAbstain = () => {
    sounds.playClick();
    setSelectedTargetId('ABSTAIN');
    onCastVote('ABSTAIN', false);
    setHasConfirmedVote(true);
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 sm:p-4 space-y-3 animate-fadeIn">
      {/* Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest">
          <Scale size={12} />
          <span>Julgamento da Vila — Votação Diurna</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight text-black">
          TRIBUNAL DO REBANHO
        </h2>
        <p className="text-[11px] font-mono text-neutral-600 max-w-xs mx-auto">
          Escolha quem deve ser exilado da congregação. Voto secreto e individual na cabine.
        </p>
      </div>

      {/* Mestre: Painel Secreto de Voto Duplo (Máximo 2x por partida) */}
      {isMaster && (
        <div className="bg-amber-50 border-2 border-amber-600 p-3 rounded-2xl space-y-2 text-left font-mono shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-black text-amber-950 uppercase text-[11px] flex items-center gap-1.5">
              <Crown size={14} className="text-amber-700" />
              <span>Habilidade Secreta do Mestre:</span>
            </span>
            <span className="bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
              {doubleVotesRemaining}/2 Votos Duplos
            </span>
          </div>

          <p className="text-[10px] text-amber-900 leading-tight">
            Restrição: O voto duplo é <strong>secreto</strong> e pode ser ativado no máximo <strong>2 vezes por partida</strong>.
          </p>

          {doubleVotesRemaining > 0 ? (
            <label className="flex items-center gap-2 p-2 bg-white border border-amber-500 rounded-xl cursor-pointer hover:border-black transition-colors">
              <input
                type="checkbox"
                disabled={hasConfirmedVote}
                checked={useDoubleVote}
                onChange={e => {
                  sounds.playClick();
                  setUseDoubleVote(e.target.checked);
                }}
                className="accent-black w-4 h-4 rounded cursor-pointer"
              />
              <span className="text-[11px] font-black text-black uppercase">
                {useDoubleVote
                  ? '✓ VOTO DUPLO ATIVADO (SEU VOTO VALERÁ PESO 2 SECRETAMENTE)'
                  : 'Ativar Voto Duplo Secreto nesta votação?'}
              </span>
            </label>
          ) : (
            <div className="p-2 bg-amber-100 border border-amber-300 rounded-xl text-[10px] text-amber-900 font-bold">
              ✓ Limite de 2 votos duplos esgotado. Seu voto terá peso normal (1) até o fim do jogo.
            </div>
          )}
        </div>
      )}

      {/* Candidates List */}
      <div className="space-y-1 flex-1">
        <span className="text-[10px] font-mono font-bold uppercase text-neutral-600 block px-1">
          Candidatos Vivos à Eliminação:
        </span>
        <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto p-1 border-2 border-black rounded-2xl bg-neutral-50">
          {livingPlayers.map(target => {
            const votesReceived = voteTallies.get(target.id) || 0;
            const isSelected = selectedTargetId === target.id;
            const isMe = target.id === currentPlayer.id;

            return (
              <button
                key={target.id}
                disabled={hasConfirmedVote}
                onClick={() => {
                  sounds.playClick();
                  setSelectedTargetId(target.id);
                }}
                className={`p-2 rounded-xl text-left border-2 transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-black text-white border-black scale-[0.98]'
                    : 'bg-white text-black border-black/30 hover:border-black'
                }`}
              >
                {!hideAvatars && (
                  <PersonAvatar
                    avatar={target.avatar}
                    seed={target.name}
                    color={target.color || '#F59E0B'}
                    size={28}
                    className="border border-black/30 shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-mono font-bold truncate">
                      {target.name} {isMe ? '(Você)' : ''}
                    </span>
                    {!isSecretBallot && votesReceived > 0 && (
                      <span
                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-black shrink-0 ${
                          isSelected ? 'bg-white text-black' : 'bg-black text-white'
                        }`}
                      >
                        {votesReceived}v
                      </span>
                    )}
                  </div>
                  {!isSecretBallot && (
                    <div className="text-[9px] opacity-75 mt-0.5">
                      {target.voteTargetId ? '✓ Votou' : 'Aguardando voto'}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <button
            onClick={handleVoteSubmit}
            disabled={!selectedTargetId || selectedTargetId === 'ABSTAIN' || hasConfirmedVote}
            className={`flex-1 py-3 rounded-full flex items-center justify-center space-x-2 text-xs font-mono font-black uppercase tracking-wider transition-all ${
              hasConfirmedVote && selectedTargetId !== 'ABSTAIN'
                ? 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-md shadow-emerald-950/40'
                : selectedTargetId && selectedTargetId !== 'ABSTAIN' && !hasConfirmedVote
                ? 'bg-black text-white active:scale-95 shadow-md hover:bg-neutral-800'
                : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
            }`}
          >
            <FourPointStar size={12} />
            <span>
              {hasConfirmedVote && selectedTargetId !== 'ABSTAIN'
                ? '✓ VOTO CONFIRMADO E SALVO'
                : useDoubleVote
                ? 'CONDENAR COM VOTO DUPLO (PESO 2)'
                : 'CONDENAR ALVO'}
            </span>
            <FourPointStar size={12} />
          </button>

          <button
            onClick={handleAbstain}
            disabled={hasConfirmedVote}
            className={`px-4 py-3 rounded-full border-2 text-xs font-mono font-bold uppercase transition-all ${
              hasConfirmedVote && selectedTargetId === 'ABSTAIN'
                ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                : selectedTargetId === 'ABSTAIN'
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-black hover:bg-neutral-100'
            }`}
          >
            {hasConfirmedVote && selectedTargetId === 'ABSTAIN' ? '✓ Abstenção Salva' : 'Abster-se'}
          </button>
        </div>

        {/* Host Advance trigger */}
        {isHost && onAdvanceVoting && (
          <button
            onClick={onAdvanceVoting}
            className="w-full py-2 border-2 border-black rounded-full text-[10px] font-mono font-bold uppercase tracking-wider text-black hover:bg-black hover:text-white transition-colors"
          >
            Fechar Votação e Proferir Veredito (Anfitrião)
          </button>
        )}
      </div>
    </div>
  );
};
