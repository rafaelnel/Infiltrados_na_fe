import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share, X, ExternalLink, Smartphone, CheckCircle, Monitor } from 'lucide-react';

interface Props {
  className?: string;
  variant?: 'default' | 'header' | 'banner';
  isNight?: boolean;
}

export const PWAInstallButton: React.FC<Props> = ({
  className = '',
  variant = 'default',
  isNight = false,
}) => {
  const { isInstallable, isInstalled, isIOS, isInIframe, browserType, install } = usePWAInstall();
  const [showModal, setShowModal] = useState(false);

  // Se o aplicativo já estiver rodando instalado na tela inicial (modo standalone)
  if (isInstalled) {
    if (variant === 'header') {
      return (
        <div
          className={`h-9 px-2.5 border-2 rounded-xl flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider select-none ${
            isNight
              ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-400'
              : 'border-emerald-600 bg-emerald-50 text-emerald-700'
          }`}
          title="Aplicativo instalado e executando em modo nativo!"
        >
          <CheckCircle size={14} />
          <span className="hidden sm:inline">Instalado</span>
        </div>
      );
    }
    return null;
  }

  const handleClick = async () => {
    // Se o evento nativo beforeinstallprompt estiver disponível, dispara imediatamente
    if (isInstallable) {
      const installed = await install();
      if (!installed) {
        // Se o usuário dispensou ou houve bloqueio, abre o modal de ajuda
        setShowModal(true);
      }
    } else {
      // Abre o guia visual de instalação adequado para o dispositivo/navegador
      setShowModal(true);
    }
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, '_blank', 'noopener,noreferrer');
  };

  // Botão para o Header / Navbar do PhoneContainer
  if (variant === 'header') {
    return (
      <>
        <button
          onClick={handleClick}
          title="Baixar / Instalar Aplicativo no Celular ou Computador"
          className={`h-9 px-3 border-2 rounded-xl flex items-center gap-1.5 transition-all text-xs font-mono font-bold uppercase tracking-wider active:scale-95 shadow-xs ${
            isNight
              ? 'border-amber-400/80 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
              : 'border-black bg-amber-400 hover:bg-amber-300 text-black font-extrabold'
          } ${className}`}
        >
          <Download size={14} className="shrink-0 animate-bounce" />
          <span className="hidden sm:inline">Baixar App</span>
          <span className="sm:hidden">Baixar</span>
        </button>

        {showModal && renderModal()}
      </>
    );
  }

  // Botão em formato de Banner
  if (variant === 'banner') {
    return (
      <>
        <div
          className={`p-3 rounded-2xl border-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-left font-mono shadow-md ${
            isNight
              ? 'border-amber-500/60 bg-amber-950/30 text-amber-200'
              : 'border-black bg-amber-50 text-black'
          } ${className}`}
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-black bg-white flex items-center justify-center shrink-0 shadow-xs">
              <img src="/pwa-192x192.png" alt="Ícone Infiltrado" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="font-sans font-black text-sm uppercase leading-tight">
                Instale no seu Celular
              </p>
              <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                Abra em tela cheia e acesse direto pela tela inicial com o ícone da ovelha.
              </p>
            </div>
          </div>
          <button
            onClick={handleClick}
            className="w-full sm:w-auto px-4 py-2 bg-black text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Download size={14} />
            <span>Instalar Agora</span>
          </button>
        </div>

        {showModal && renderModal()}
      </>
    );
  }

  // Botão Padrão (Hero na tela inicial)
  return (
    <>
      <button
        onClick={handleClick}
        className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl font-mono text-xs sm:text-sm font-black uppercase tracking-wider border-2 border-black bg-amber-400 hover:bg-amber-300 text-black shadow-[3px_3px_0px_#000] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all cursor-pointer ${className}`}
        title="Baixar aplicativo e adicionar à tela inicial"
      >
        <img src="/pwa-192x192.png" alt="" className="w-5 h-5 rounded-md border border-black/40 object-cover" />
        <span>Baixar / Instalar Jogo</span>
      </button>

      {showModal && renderModal()}
    </>
  );

  function renderModal() {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-fadeIn select-none">
        <div className="w-full max-w-md rounded-3xl bg-neutral-900 border-2 border-neutral-700 p-6 shadow-2xl text-white space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-amber-400 bg-white shadow-md shrink-0">
                <img src="/pwa-192x192.png" alt="Ícone do Jogo" className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="font-sans font-black text-base text-amber-400 tracking-tight leading-none uppercase">
                  Como Baixar / Instalar
                </h3>
                <span className="text-[10px] font-mono text-neutral-400">
                  Infiltrado na Fé (PWA)
                </span>
              </div>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-1.5 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Se estiver no Iframe (ex: preview do AI Studio), instruções e link para abrir fora */}
          {isInIframe && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs space-y-2 text-amber-200">
              <p className="font-bold flex items-center gap-1.5">
                <span>⚠️</span>
                <span>Visualizando em janela incorporada</span>
              </p>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                Navegadores bloqueiam o banner de instalação automático dentro de iframes. Para instalar com 1 toque no celular ou PC:
              </p>
              <button
                onClick={handleOpenNewTab}
                className="w-full py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs flex items-center justify-center gap-2 transition-all"
              >
                <ExternalLink size={14} />
                <span>Abrir em Nova Aba para Instalar</span>
              </button>
            </div>
          )}

          {/* Instruções por Plataforma */}
          <div className="space-y-3 font-sans text-xs">
            {/* Opção A: Android / Google Chrome */}
            <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                <Smartphone size={16} />
                <span>No Android (Chrome, Brave, Edge, Samsung)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px] leading-relaxed">
                <li>Toque no menu de <strong>três pontinhos (⋮)</strong> no canto superior direito do navegador.</li>
                <li>Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</li>
                <li>Confirme em <strong>"Instalar"</strong>. O ícone aparecerá junto aos seus outros aplicativos!</li>
              </ol>
            </div>

            {/* Opção B: iPhone / iPad (Safari) */}
            <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 space-y-2">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-xs">
                <Share size={16} />
                <span>No iPhone / iPad (Safari)</span>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-neutral-300 text-[11px] leading-relaxed">
                <li>Abra o link no <strong>Safari</strong>.</li>
                <li>Toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima na barra inferior).</li>
                <li>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</li>
              </ol>
            </div>

            {/* Opção C: Computador (PC / Mac) */}
            <div className="p-3.5 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Monitor size={16} />
                <span>No Computador (Chrome / Edge)</span>
              </div>
              <p className="text-neutral-300 text-[11px] leading-relaxed">
                Clique no ícone de <strong>Computador com Seta</strong> que aparece do lado direito da barra de endereço do navegador, ou vá no menu ⋮ &gt; <strong>"Instalar Infiltrado na Fé..."</strong>.
              </p>
            </div>
          </div>

          {/* Botão de Fechar ou Disparo Nativo */}
          <div className="pt-2 flex gap-2">
            {isInstallable && (
              <button
                onClick={() => {
                  setShowModal(false);
                  install();
                }}
                className="flex-1 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-black font-extrabold text-xs uppercase tracking-wider transition-all"
              >
                Disparar Instalação Agora
              </button>
            )}
            <button
              onClick={() => setShowModal(false)}
              className="flex-1 py-2.5 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }
};
