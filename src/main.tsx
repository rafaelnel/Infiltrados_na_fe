import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Elemento #root não foi encontrado no documento HTML.');
}

createRoot(rootElement).render(<App />);
