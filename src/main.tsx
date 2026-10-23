import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Registro do Service Worker para suporte a PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = `${import.meta.env.BASE_URL || '/'}sw.js`.replace(/\/+/g, '/');
    navigator.serviceWorker
      .register(swPath)
      .then((registration) => {
        console.log('Service Worker registrado com sucesso no escopo:', registration.scope);
      })
      .catch((error) => {
        console.warn('Falha ao registrar o Service Worker:', error);
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento #root não foi encontrado no documento HTML.');
}

createRoot(rootElement).render(<App />);
