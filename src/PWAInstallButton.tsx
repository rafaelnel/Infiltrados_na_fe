import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share, X, ExternalLink, Smartphone, CheckCircle, Monitor, Sparkles } from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'header' | 'default';
  isNight?: boolean;
}

export const PWAInstallButton: React.FC<Props> = ({
  className = '',
  variant = 'header',
  isNight = false,
}) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Se o aplicativo já estiver rodando instalado na tela inicial (modo standalone)
  if (isInstalled) {
    return (
      <div
        className={`h-9 px-2.5 border-2 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider select-none ${
          isNight
            ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400'
            : 'border-emerald-600 bg-emerald-50 text-emerald-700'
        } ${className}`}
        title="Aplicativo instalado e em execução no modo nativo!"
      >
        <CheckCircle size={14} />
        <span className="hidden sm:inline">Instalado</span>
      </div>
    );
  }

  const handleOpenModal = () => {
    setShowModal(true);
  };

  const handleConfirmInstall = async () => {
    if (isInstallable) {
      setIsInstalling(true);
      const outcome = await install();
      setIsInstalling(false);
      if (outcome) {
        setShowModal(false);
      }
    } else if (isInIframe) {
      // Abre em nova aba para que o navegador exiba o prompt nativo fora do iframe
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
      setShowModal(false);
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
    setShowModal(false);
  };

  return (
    <>
      {/* Botão Único na Navbar */}
      <button
        onClick={handleOpenModal}
        title="Baixar / Instalar Infiltrado na Fé no Celular ou PC"
        className={`h-9 px-3 border-2 rounded-xl flex items-center gap-1.5 transition-all text-xs font-mono font-bold uppercase tracking-wider active:scale-95 shadow-xs cursor-pointer ${
          isNight
            ? 'border-amber-400/80 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
            : 'border-black bg-amber-400 hover:bg-amber-300 text-black font-extrabold'
        } ${className}`}
      >
        <Download size={14} className="shrink-0 animate-bounce" />
        <span className="hidden sm:inline">Baixar App</span>
        <span className="sm:hidden">Baixar</span>
      </button>

      {/* Modal de Confirmação de Instalação com a Capa Oficial */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs animate-fadeIn select-none">
          <div className="w-full max-w-sm sm:max-w-md rounded-3xl bg-neutral-900 border-2 border-neutral-700 p-5 sm:p-6 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
            {/* Top Bar com Fechar */}
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
                <h3 className="font-sans font-black text-sm sm:text-base text-amber-400 tracking-tight uppercase">
                  Confirmação de Instalação
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>

            {/* Capa do App ao Baixar */}
            <div className="relative rounded-2xl overflow-hidden border-2 border-amber-400/80 bg-white shadow-xl group">
              <img
                src="./app-cover.png"
                alt="Capa Oficial Infiltrado na Fé"
                className="w-full h-44 sm:h-52 object-contain bg-white p-2 transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute top-2 left-2 bg-black/85 text-amber-400 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border border-amber-400/50 flex items-center gap-1 shadow-md">
                <Sparkles size={11} />
                <span>Capa Oficial</span>
              </div>
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 text-left">
                <h4 className="font-sans font-black text-white text-base leading-tight uppercase drop-shadow-md">
                  Infiltrado na Fé
                </h4>
                <p className="text-[11px] font-mono text-amber-300 drop-shadow-xs">
                  Vila das Ovelhas vs Soldados Infiltrados
                </p>
              </div>
            </div>

            {/* Destaques / Vantagens da Instalação */}
            <div className="grid grid-cols-2 gap-2 text-left font-sans text-xs">
              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-start gap-2">
                <Smartphone size={16} className="text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-[11px]">Tela Cheia</strong>
                  <span className="text-neutral-400 text-[10px] leading-tight block">
                    Sem barra de endereço, igual a app nativo.
                  </span>
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-neutral-800/80 border border-neutral-700/60 flex items-start gap-2">
                <CheckCircle size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-white text-[11px]">Ícone Exclusivo</strong>
                  <span className="text-neutral-400 text-[10px] leading-tight block">
                    Adicionado à tela inicial com a ovelha.
                  </span>
                </div>
              </div>
            </div>

            {/* Caso esteja em iframe (AI Studio preview) */}
            {isInIframe && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2 text-amber-200 text-left">
                <p className="font-bold flex items-center gap-1.5 text-xs text-amber-300">
                  <span>ℹ️</span>
                  <span>Janela incorporada (Preview)</span>
                </p>
                <p className="text-[11px] text-neutral-300 leading-relaxed">
                  Para instalar diretamente no celular com 1 toque, abra em uma aba externa:
                </p>
                <button
                  onClick={handleOpenNewTab}
                  className="w-full py-2 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <ExternalLink size={14} />
                  <span>Abrir em Nova Aba para Instalar</span>
                </button>
              </div>
            )}

            {/* Instruções por Plataforma (Android / iOS / PC) */}
            <div className="space-y-2 font-sans text-xs text-left">
              {isIOS ? (
                <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-sky-400 font-bold text-xs">
                    <Share size={15} />
                    <span>Passo a Passo no iPhone / iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px]">
                    <li>No Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima).</li>
                    <li>Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.</li>
                    <li>Toque em <strong>Adicionar</strong> no canto superior.</li>
                  </ol>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-neutral-800/80 border border-neutral-700/60 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                    <Smartphone size={15} />
                    <span>Instalação no Android (Chrome / Brave / Edge)</span>
                  </div>
                  <p className="text-neutral-300 text-[11px] leading-relaxed">
                    Clique em <strong>Confirmar Instalação</strong> abaixo ou no menu <strong className="text-white">⋮</strong> &gt; <strong className="text-white">"Instalar aplicativo"</strong> / <strong className="text-white">"Adicionar à tela inicial"</strong>.
                  </p>
                </div>
              )}
            </div>

            {/* Ações Finais: Confirmar Instalação / Fechar */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2">
              {isInstallable && (
                <button
                  onClick={handleConfirmInstall}
                  disabled={isInstalling}
                  className="w-full sm:flex-1 py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <Download size={16} />
                  <span>{isInstalling ? 'Instalando...' : 'Confirmar Instalação'}</span>
                </button>
              )}

              <button
                onClick={() => setShowModal(false)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
              >
                {isInstallable ? 'Cancelar' : 'Entendido / Fechar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
