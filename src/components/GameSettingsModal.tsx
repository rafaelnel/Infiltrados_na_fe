import React, { useState } from 'react';
import { Settings, RotateCcw, Home, X, AlertTriangle, ArrowLeft, Users, LogOut, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRestartGame: () => void;
  onReturnToLobby?: () => void;
  onReturnHome: () => void;
  onLeaveRoom?: () => void;
  isOnline?: boolean;
  isHost?: boolean;
}

type ConfirmAction = 'NONE' | 'RESTART' | 'LOBBY' | 'HOME' | 'LEAVE';

export const GameSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRestartGame,
  onReturnToLobby,
  onReturnHome,
  onLeaveRoom,
  isOnline = false,
  isHost = true,
}) => {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>('NONE');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    sounds.playClick();
    setConfirmAction('NONE');
    setIsSubmitting(false);
    onClose();
  };

  const handleConfirmRestart = () => {
    sounds.playGavelStrike();
    setIsSubmitting(true);
    setTimeout(() => {
      onRestartGame();
      setIsSubmitting(false);
      setConfirmAction('NONE');
      onClose();
    }, 250);
  };

  const handleConfirmLobby = () => {
    sounds.playClick();
    setIsSubmitting(true);
    setTimeout(() => {
      if (onReturnToLobby) {
        onReturnToLobby();
      } else {
        onRestartGame();
      }
      setIsSubmitting(false);
      setConfirmAction('NONE');
      onClose();
    }, 250);
  };

  const handleConfirmLeave = () => {
    sounds.playClick();
    setIsSubmitting(true);
    setTimeout(() => {
      if (onLeaveRoom) {
        onLeaveRoom();
      } else {
        onReturnHome();
      }
      setIsSubmitting(false);
      setConfirmAction('NONE');
      onClose();
    }, 250);
  };

  const handleConfirmHome = () => {
    sounds.playClick();
    setIsSubmitting(true);
    setTimeout(() => {
      onReturnHome();
      setIsSubmitting(false);
      setConfirmAction('NONE');
      onClose();
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-sm bg-white border-2 border-black rounded-2xl shadow-2xl p-5 space-y-4 font-mono text-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-black text-white flex items-center justify-center">
              <Settings size={16} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider font-sans">
                Ajustes da Partida
              </h2>
              <span className="text-[10px] text-neutral-500 font-bold">
                {isOnline
                  ? isHost
                    ? 'Painel do Anfitrião (Host)'
                    : 'Opções do Participante'
                  : 'Partida em Andamento'}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg border border-black/30 hover:bg-neutral-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Action Confirmation Views */}
        {confirmAction === 'RESTART' && (
          <div className="space-y-3 p-3 bg-red-50 border-2 border-red-500 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
              <AlertTriangle size={16} />
              <span>CONFIRMAR REINÍCIO DO JOGO</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              Tem certeza de que deseja <strong>reiniciar o jogo imediatamente</strong>? Novos papéis secretos
              serão sorteados e distribuídos para todos os jogadores na mesma sala.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmAction('NONE')}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 border border-neutral-400 bg-white rounded-xl text-[11px] font-bold uppercase hover:bg-neutral-100 flex items-center justify-center gap-1"
              >
                <ArrowLeft size={13} /> Voltar
              </button>
              <button
                onClick={handleConfirmRestart}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                  isSubmitting
                    ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Check size={14} />
                    <span>Confirmado ✓</span>
                  </>
                ) : (
                  'Sim, Reiniciar'
                )}
              </button>
            </div>
          </div>
        )}

        {confirmAction === 'LOBBY' && (
          <div className="space-y-3 p-3 bg-indigo-50 border-2 border-indigo-500 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
              <Users size={16} />
              <span>CONFIRMAR RETORNO AO LOBBY</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              Deseja <strong>voltar para a sala de espera (Lobby)</strong>? A rodada em andamento
              será pausada e todos os participantes voltarão ao lobby para adicionar bots ou ajustar o baralho.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmAction('NONE')}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 border border-neutral-400 bg-white rounded-xl text-[11px] font-bold uppercase hover:bg-neutral-100 flex items-center justify-center gap-1"
              >
                <ArrowLeft size={13} /> Voltar
              </button>
              <button
                onClick={handleConfirmLobby}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                  isSubmitting
                    ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Check size={14} />
                    <span>Confirmado ✓</span>
                  </>
                ) : (
                  'Sim, Voltar à Sala'
                )}
              </button>
            </div>
          </div>
        )}

        {confirmAction === 'LEAVE' && (
          <div className="space-y-3 p-3 bg-amber-50 border-2 border-amber-600 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <LogOut size={16} />
              <span>CONFIRMAR SAÍDA DA PARTIDA</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              {isHost ? (
                <>
                  Você é o <strong>anfitrião</strong> da sala. Se sair agora, <strong>outro jogador online será sorteado aleatoriamente como o novo anfitrião</strong>.
                </>
              ) : (
                <>
                  Tem certeza de que deseja <strong>desconectar da partida</strong>? Caso saia sem querer, você poderá retornar entrando na sala novamente com o mesmo nome!
                </>
              )}
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmAction('NONE')}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 border border-neutral-400 bg-white rounded-xl text-[11px] font-bold uppercase hover:bg-neutral-100 flex items-center justify-center gap-1"
              >
                <ArrowLeft size={13} /> Cancelar
              </button>
              <button
                onClick={handleConfirmLeave}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                  isSubmitting
                    ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black'
                    : 'bg-amber-600 text-white hover:bg-amber-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Check size={14} />
                    <span>Confirmado ✓</span>
                  </>
                ) : (
                  'Sim, Desconectar'
                )}
              </button>
            </div>
          </div>
        )}

        {confirmAction === 'HOME' && (
          <div className="space-y-3 p-3 bg-neutral-100 border-2 border-neutral-700 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-neutral-900 font-bold text-xs">
              <AlertTriangle size={16} />
              <span>CONFIRMAR SAÍDA</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              Tem certeza de que deseja <strong>voltar para o menu principal</strong>? A partida atual
              será encerrada.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmAction('NONE')}
                disabled={isSubmitting}
                className="flex-1 py-2 px-3 border border-neutral-400 bg-white rounded-xl text-[11px] font-bold uppercase hover:bg-neutral-100 flex items-center justify-center gap-1"
              >
                <ArrowLeft size={13} /> Voltar
              </button>
              <button
                onClick={handleConfirmHome}
                disabled={isSubmitting}
                className={`flex-1 py-2 px-3 rounded-xl text-[11px] font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                  isSubmitting
                    ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Check size={14} />
                    <span>Confirmado ✓</span>
                  </>
                ) : (
                  'Sim, Menu Inicial'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Default Menu Options */}
        {confirmAction === 'NONE' && (
          <div className="space-y-2.5">
            {/* Se for host online */}
            {isOnline && isHost && (
              <>
                <button
                  onClick={() => {
                    sounds.playClick();
                    setConfirmAction('LOBBY');
                  }}
                  className="w-full p-3 border-2 border-indigo-600 rounded-xl bg-indigo-50/50 hover:bg-indigo-50 transition-colors flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                      <Users size={16} />
                    </div>
                    <div>
                      <div className="text-xs font-black uppercase text-indigo-950">
                        Voltar para a Sala (Lobby)
                      </div>
                      <div className="text-[10px] text-indigo-700">
                        Pausar o jogo e retornar à sala de espera
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    sounds.playClick();
                    setConfirmAction('RESTART');
                  }}
                  className="w-full p-3 border-2 border-black rounded-xl bg-white hover:bg-neutral-50 transition-colors flex items-center justify-between text-left group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-black/20 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                      <RotateCcw size={15} />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase">Reiniciar o Jogo</div>
                      <div className="text-[10px] text-neutral-500">
                        Iniciar uma nova partida com novos papéis imediatamente
                      </div>
                    </div>
                  </div>
                </button>
              </>
            )}

            {/* Se não for online (Solo ou Pass & Play) */}
            {!isOnline && (
              <button
                onClick={() => {
                  sounds.playClick();
                  setConfirmAction('RESTART');
                }}
                className="w-full p-3 border-2 border-black rounded-xl bg-white hover:bg-neutral-50 transition-colors flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-black/20 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                    <RotateCcw size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase">Reiniciar Partida</div>
                    <div className="text-[10px] text-neutral-500">
                      Começar uma nova rodada com os mesmos jogadores
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Opção de sair/desconectar da partida */}
            {isOnline ? (
              <button
                onClick={() => {
                  sounds.playClick();
                  setConfirmAction('LEAVE');
                }}
                className="w-full p-3 border-2 border-amber-600 rounded-xl bg-white hover:bg-amber-50 transition-colors flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 border border-amber-300 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                    <LogOut size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase text-amber-950">
                      {isHost ? 'Sair da Sala (Migrar Anfitrião)' : 'Desconectar da Partida'}
                    </div>
                    <div className="text-[10px] text-neutral-500">
                      {isHost
                        ? 'Passar a liderança da sala para outro jogador online'
                        : 'Sair com opção de retorno a qualquer momento'}
                    </div>
                  </div>
                </div>
              </button>
            ) : (
              <button
                onClick={() => {
                  sounds.playClick();
                  setConfirmAction('HOME');
                }}
                className="w-full p-3 border-2 border-black rounded-xl bg-white hover:bg-neutral-50 transition-colors flex items-center justify-between text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-black/20 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
                    <Home size={15} />
                  </div>
                  <div>
                    <div className="text-xs font-bold uppercase">Voltar para o Início</div>
                    <div className="text-[10px] text-neutral-500">
                      Sair da partida e ir para o menu principal
                    </div>
                  </div>
                </div>
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-full py-2.5 text-center text-[11px] font-bold uppercase tracking-wider text-neutral-600 hover:text-black pt-1"
            >
              Continuar Jogando
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
