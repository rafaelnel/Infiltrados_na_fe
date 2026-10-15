import React, { useState } from 'react';
import { Settings, RotateCcw, Home, X, AlertTriangle, ArrowLeft } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onRestartGame: () => void;
  onReturnHome: () => void;
  isOnline?: boolean;
  isHost?: boolean;
}

type ConfirmAction = 'NONE' | 'RESTART' | 'HOME';

export const GameSettingsModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onRestartGame,
  onReturnHome,
  isOnline = false,
  isHost = true,
}) => {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>('NONE');

  if (!isOpen) return null;

  const handleClose = () => {
    sounds.playClick();
    setConfirmAction('NONE');
    onClose();
  };

  const handleConfirmRestart = () => {
    sounds.playGavelStrike();
    setConfirmAction('NONE');
    onRestartGame();
    onClose();
  };

  const handleConfirmHome = () => {
    sounds.playClick();
    setConfirmAction('NONE');
    onReturnHome();
    onClose();
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
                {isOnline ? 'Multiplayer Online (Host)' : 'Partida em Andamento'}
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
              <span>CONFIRMAR REINÍCIO</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              Tem certeza de que deseja <strong>reiniciar a partida</strong>? Todo o progresso,
              papéis e histórico da rodada atual serão descartados.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmAction('NONE')}
                className="flex-1 py-2 px-3 border border-neutral-400 bg-white rounded-xl text-[11px] font-bold uppercase hover:bg-neutral-100 flex items-center justify-center gap-1"
              >
                <ArrowLeft size={13} /> Voltar
              </button>
              <button
                onClick={handleConfirmRestart}
                className="flex-1 py-2 px-3 bg-red-600 text-white rounded-xl text-[11px] font-bold uppercase hover:bg-red-700 transition-colors shadow-sm"
              >
                Sim, Reiniciar
              </button>
            </div>
          </div>
        )}

        {confirmAction === 'HOME' && (
          <div className="space-y-3 p-3 bg-amber-50 border-2 border-amber-500 rounded-xl animate-fadeIn">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
              <AlertTriangle size={16} />
              <span>CONFIRMAR SAÍDA</span>
            </div>
            <p className="text-[11px] text-neutral-700 leading-relaxed">
              Tem certeza de que deseja <strong>voltar para a tela inicial</strong>? A partida atual
              será encerrada {isOnline && 'e a sala será desfeita'}.
            </p>
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => setConfirmAction('NONE')}
                className="flex-1 py-2 px-3 border border-neutral-400 bg-white rounded-xl text-[11px] font-bold uppercase hover:bg-neutral-100 flex items-center justify-center gap-1"
              >
                <ArrowLeft size={13} /> Voltar
              </button>
              <button
                onClick={handleConfirmHome}
                className="flex-1 py-2 px-3 bg-black text-white rounded-xl text-[11px] font-bold uppercase hover:bg-neutral-800 transition-colors shadow-sm"
              >
                Sim, Voltar ao Início
              </button>
            </div>
          </div>
        )}

        {/* Default Menu Options */}
        {confirmAction === 'NONE' && (
          <div className="space-y-2.5">
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
