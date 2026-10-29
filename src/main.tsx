import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Limpeza de caches antigos em ambiente de desenvolvimento e registro seguro em produção
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then((names) => {
        for (const name of names) {
          caches.delete(name);
        }
      }).catch(() => {});
    }
  } else {
    window.addEventListener('load', () => {
      const swPath = `${import.meta.env.BASE_URL || '/'}sw.js`.replace(/\/+/g, '/');
      navigator.serviceWorker
        .register(swPath)
        .then((registration) => {
          registration.update().catch(() => {});
        })
        .catch((error) => {
          console.warn('Falha ao registrar o Service Worker:', error);
        });
    });
  }
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMessage: string;
}

class RootErrorBoundary extends React.Component<{ children: React.ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error?.message || 'Erro inesperado na renderização.',
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Erro capturado pelo ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    try {
      localStorage.removeItem('online_room_code');
      localStorage.removeItem('online_player_id');
    } catch {}
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-neutral-100 text-black flex flex-col items-center justify-center p-6 font-mono text-center">
          <div className="max-w-md w-full bg-white border-3 border-black rounded-3xl p-6 shadow-xl space-y-4">
            <h1 className="text-xl font-black uppercase">Infiltrados na Fé</h1>
            <p className="text-xs text-neutral-600">
              Ocorreu um problema temporário ao carregar a tela. Clique abaixo para restaurar a congregação.
            </p>
            {this.state.errorMessage && (
              <p className="text-[11px] bg-neutral-100 border border-neutral-300 rounded-xl p-2 text-neutral-700 break-words">
                {this.state.errorMessage}
              </p>
            )}
            <button
              type="button"
              onClick={this.handleReset}
              className="w-full py-3 bg-black text-white rounded-full text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 cursor-pointer"
            >
              Recarregar Jogo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento #root não foi encontrado no documento HTML.');
}

createRoot(rootElement).render(
  <RootErrorBoundary>
    <App />
  </RootErrorBoundary>
);

