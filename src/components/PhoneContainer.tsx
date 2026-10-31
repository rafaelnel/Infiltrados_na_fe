import React from 'react';
import { Volume2, VolumeX, BookOpen, Moon, Sun, Settings, LogOut } from 'lucide-react';
import { sounds } from '../utils/audio';
import { PWAInstallButton } from '../PWAInstallButton';

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
      className={`min-h-screen lg:h-screen lg:max-h-screen w-full transition-all duration-700 ease-in-out font-sans flex flex-col justify-between selection:bg-black selection:text-white relative overflow-x-hidden lg:overflow-hidden ${
        isNight
          ? 'bg-gradient-to-b from-[#091124] via-[#060D20] to-[#02050E] text-white'
          : 'bg-gradient-to-b from-[#fbfbfe] via-[#f1f3f9] to-[#e4e8f1] text-black'
      }`}
    >
      {/* Luz ambiente de fundo no topo (Sol dourado de dia, Aura azulada à noite) */}
      <div
        className={`absolute top-0 inset-x-0 h-96 pointer-events-none transition-opacity duration-1000 ${
          isNight
            ? 'opacity-40 bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.25),transparent_70%)]'
            : 'opacity-50 bg-[radial-gradient(ellipse_at_top,_rgba(251,191,36,0.2),transparent_70%)]'
        }`}
      />

      {/* Top Navbar */}
      <header
        className={`w-full shrink-0 sticky top-0 z-40 transition-all duration-700 backdrop-blur-md ${
          isNight
            ? 'bg-[#0B132B]/90 border-b-2 border-indigo-900/80 shadow-lg text-white'
            : 'bg-white/90 border-b-2 border-black shadow-xs text-black'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-2 lg:py-2.5 flex items-center justify-between">
          {/* Brand & Subtitle */}
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 lg:w-9 lg:h-9 border-2 rounded-xl flex items-center justify-center font-black text-xs font-mono transition-colors ${
                isNight
                  ? 'border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'border-black bg-black text-white'
              }`}
            >
              ✦
            </div>
            <div>
              <h1 className="text-sm sm:text-base lg:text-lg font-black tracking-wider uppercase font-sans leading-none">
                {title}
              </h1>
              <span
                className={`text-[9px] sm:text-[10px] font-mono font-bold uppercase tracking-widest block mt-0.5 ${
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
          <div className="flex items-center gap-2">
            {/* Night indicator badge */}
            {isNight && (
              <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-indigo-950 border border-indigo-500/40 rounded-lg text-[10px] font-mono text-indigo-300 font-bold">
                <Moon size={12} className="text-indigo-300" />
                <span>NOITE ATIVA</span>
              </div>
            )}

            {/* Botão de Baixar / Instalar App PWA */}
            <PWAInstallButton variant="header" isNight={isNight} />

            <button
              onClick={onOpenManual}
              className={`h-8 lg:h-9 px-2.5 lg:px-3 border-2 rounded-xl flex items-center gap-1.5 transition-colors text-xs font-mono font-bold uppercase tracking-wider ${
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
                className={`w-8 h-8 lg:w-9 lg:h-9 border-2 rounded-xl flex items-center justify-center transition-colors ${
                  isNight
                    ? 'border-indigo-400/60 bg-[#141E3D] text-indigo-100 hover:bg-indigo-900/60'
                    : 'border-black bg-white hover:bg-neutral-100 text-black'
                }`}
              >
                <Settings size={15} />
              </button>
            )}

            {onDisconnect && (
              <button
                onClick={onDisconnect}
                title="Desconectar / Sair da Partida"
                className={`h-8 lg:h-9 px-2.5 border-2 rounded-xl flex items-center gap-1.5 transition-colors text-xs font-mono font-bold uppercase tracking-wider ${
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
              className={`w-8 h-8 lg:w-9 lg:h-9 border-2 rounded-xl flex items-center justify-center transition-colors ${
                isNight
                  ? 'border-indigo-400/60 bg-[#141E3D] text-indigo-100 hover:bg-indigo-900/60'
                  : 'border-black bg-white hover:bg-neutral-100 text-black'
              }`}
            >
              {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Game Arena - WIDESCREEN DESKTOP SEM ROLAGEM EXTERNA */}
      <main className="flex-1 min-h-0 w-full max-w-6xl mx-auto p-2 sm:p-3 lg:px-6 lg:py-2.5 flex flex-col justify-center">
        <div
          className={`w-full flex-1 min-h-0 transition-all duration-700 rounded-3xl overflow-y-auto lg:overflow-hidden flex flex-col p-3 sm:p-4 lg:p-5 shadow-2xl relative ${
            isNight
              ? 'bg-gradient-to-b from-[#0E172E] via-[#0B132B] to-[#070D1E] border-2 border-indigo-500/50 text-white shadow-indigo-950/60 shadow-[0_0_50px_rgba(79,70,229,0.12)]'
              : 'bg-gradient-to-b from-white via-neutral-50/95 to-white border-2 sm:border-[3px] border-black text-black shadow-xl shadow-stone-900/10 shadow-[0_0_50px_rgba(245,158,11,0.06)]'
          }`}
        >
          {children}
        </div>
      </main>

      {/* Footer info */}
      <footer
        className={`w-full shrink-0 text-center py-1.5 lg:py-1 text-[10px] font-mono select-none ${
          isNight ? 'text-indigo-400/70' : 'text-neutral-500'
        }`}
      >
        <span>INFILTRADO NA FÉ · TRAIÇÃO & CONVERSÃO NO REBANHO</span>
      </footer>
    </div>
  );
};
