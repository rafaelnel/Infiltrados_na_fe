import React from 'react';
import { Volume2, VolumeX, BookOpen, Moon, Sun, Settings, LogOut } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  children: React.ReactNode;
  title?: string;
  onOpenManual: () => void;
  onOpenSettings?: () => void;
  showSettings?: boolean;
  onDisconnect?: () => void;
  roomCode?: string;
  phaseLabel?: string;
  isNight?: boolean;
}

export const PhoneContainer: React.FC<Props> = ({
  children,
  title = 'INFILTRADO NA FÉ',
  onOpenManual,
  onOpenSettings,
  showSettings = false,
  onDisconnect,
  roomCode,
  phaseLabel,
  isNight = false,
}) => {
  const [isMuted, setIsMuted] = React.useState(!sounds.enabled);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setIsMuted(!sounds.enabled);
    if (sounds.enabled) {
      sounds.playClick();
    }
  };

  return (
    <div
      className={`min-h-screen w-full transition-colors duration-500 font-sans flex flex-col justify-between selection:bg-black selection:text-white ${
        isNight ? 'bg-[#060D20] text-white' : 'bg-[#f0f2f5] text-black'
      }`}
    >
      {/* Top Navbar */}
      <header
        className={`w-full sticky top-0 z-40 transition-colors duration-500 ${
          isNight
            ? 'bg-[#0B132B] border-b-2 border-indigo-900/80 shadow-lg text-white'
            : 'bg-white border-b-2 border-black shadow-xs text-black'
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 border-2 rounded-xl flex items-center justify-center font-black text-xs font-mono transition-colors ${
                isNight
                  ? 'border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'border-black bg-black text-white'
              }`}
            >
              ✦
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-wider uppercase font-sans leading-none">
                {title}
              </h1>
              <span
                className={`text-[10px] font-mono font-bold uppercase tracking-widest block mt-0.5 ${
                  isNight ? 'text-indigo-300' : 'text-neutral-500'
                }`}
              >
                {phaseLabel || (isNight ? 'Fase da Noite — Modo Escuro' : 'Dedução Social & Mistério')}
              </span>
            </div>
          </div>

          {/* Center Info / Room Code Badge */}
          {roomCode && (
            <div
              className={`hidden sm:flex items-center gap-2 px-3 py-1 rounded-full font-mono text-xs font-bold uppercase tracking-widest ${
                isNight
                  ? 'bg-indigo-900/70 border border-indigo-500/40 text-indigo-200'
                  : 'bg-black text-white'
              }`}
            >
              <span className={isNight ? 'text-indigo-400 text-[10px]' : 'text-neutral-400 text-[10px]'}>
                SALA:
              </span>
              <span>{roomCode}</span>
            </div>
          )}

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5">
            {/* Night indicator badge */}
            {isNight && (
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-indigo-950 border border-indigo-500/40 rounded-lg text-[10px] font-mono text-indigo-300 font-bold">
                <Moon size={12} className="text-indigo-300" />
                <span>NOITE ATIVA</span>
              </div>
            )}

            <button
              onClick={onOpenManual}
              className={`h-9 px-3 border-2 rounded-xl flex items-center gap-1.5 transition-colors text-xs font-mono font-bold uppercase tracking-wider ${
                isNight
                  ? 'border-indigo-400/60 bg-[#141E3D] text-indigo-100 hover:bg-indigo-900/60'
                  : 'border-black bg-white hover:bg-neutral-100 text-black active:bg-black active:text-white'
              }`}
              title="Manual do Jogo, Socket.IO e Código Python"
            >
              <BookOpen size={14} />
              <span className="hidden sm:inline">Manual do Sistema</span>
              <span className="sm:hidden">Regras</span>
            </button>

            {showSettings && onOpenSettings && (
              <button
                onClick={onOpenSettings}
                title="Ajustes do Anfitrião (Reiniciar ou Voltar)"
                className={`w-9 h-9 border-2 rounded-xl flex items-center justify-center transition-colors ${
                  isNight
                    ? 'border-indigo-400/60 bg-[#141E3D] text-indigo-100 hover:bg-indigo-900/60'
                    : 'border-black bg-white hover:bg-neutral-100 text-black'
                }`}
              >
                <Settings size={16} />
              </button>
            )}

            {onDisconnect && (
              <button
                onClick={onDisconnect}
                title="Desconectar / Sair da Partida"
                className={`h-9 px-2.5 border-2 rounded-xl flex items-center gap-1.5 transition-colors text-xs font-mono font-bold uppercase tracking-wider ${
                  isNight
                    ? 'border-red-400/60 bg-[#1f162b] text-red-300 hover:bg-red-950/80'
                    : 'border-red-600 bg-red-50 hover:bg-red-100 text-red-700'
                }`}
              >
                <LogOut size={14} />
                <span className="hidden sm:inline">Desconectar</span>
              </button>
            )}

            <button
              onClick={toggleSound}
              title={isMuted ? 'Ativar Efeitos Sonoros' : 'Silenciar Sons'}
              className={`w-9 h-9 border-2 rounded-xl flex items-center justify-center transition-colors ${
                isNight
                  ? 'border-indigo-400/60 bg-[#141E3D] text-indigo-100 hover:bg-indigo-900/60'
                  : 'border-black bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Arena - LAYOUT NORMAL SEM MOLDURA DE CELULAR */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-3 sm:p-6 flex flex-col justify-center">
        <div
          className={`w-full transition-colors duration-500 rounded-3xl overflow-hidden min-h-[580px] sm:min-h-[640px] flex flex-col p-4 sm:p-6 shadow-2xl ${
            isNight
              ? 'bg-[#0B132B] border-2 border-indigo-500/40 text-white shadow-indigo-950/40'
              : 'bg-white border-2 sm:border-[3px] border-black text-black'
          }`}
        >
          {children}
        </div>
      </main>

      {/* Footer info */}
      <footer
        className={`w-full text-center py-3 text-[11px] font-mono select-none ${
          isNight ? 'text-indigo-400/70' : 'text-neutral-500'
        }`}
      >
        <span>INFILTRADO NA FÉ · TRAIÇÃO & CONVERSÃO NO REBANHO</span>
      </footer>
    </div>
  );
};
