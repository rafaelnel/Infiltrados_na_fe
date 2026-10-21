import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Share, X } from 'lucide-react';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  // Se já estiver instalado em tela cheia/standalone, não exibe o botão
  if (isInstalled) {
    return null;
  }

  // Dispositivos Android / Chrome / Edge / Desktop com suporte ao prompt nativo
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500 hover:bg-amber-400 text-black shadow-md transition-all active:scale-95 ${className}`}
        title="Instalar aplicativo no celular"
      >
        <Download className="w-4 h-4" />
        <span>Instalar App</span>
      </button>
    );
  }

  // Dispositivos iOS (iPhone/iPad no Safari)
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSModal(true)}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-amber-400 border border-amber-500/30 transition-all ${className}`}
          title="Como instalar no iPhone/iPad"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Instalar no iPhone</span>
        </button>

        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl bg-gray-900 border border-gray-700 p-5 shadow-2xl text-white">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <h3 className="font-bold text-base text-amber-400">Instalar no iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSModal(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-sm text-gray-300">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800 text-amber-400 shrink-0">
                    <Share className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-white block">1. Toque em Compartilhar</strong>
                    No Safari, toque no ícone de compartilhamento na barra inferior do navegador.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-800 text-amber-400 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <strong className="text-white block">2. Adicionar à Tela de Início</strong>
                    Role as opções para baixo e selecione <em>"Adicionar à Tela de Início"</em>.
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowIOSModal(false)}
                className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 font-bold text-black text-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
