import React, { useState } from 'react';
import { Server, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, X, Globe, Sparkles } from 'lucide-react';

interface ServerConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentServerUrl: string;
  onSaveServerUrl: (url: string) => void;
}

export const ServerConfigModal: React.FC<ServerConfigModalProps> = ({
  isOpen,
  onClose,
  currentServerUrl,
  onSaveServerUrl,
}) => {
  const [urlInput, setUrlInput] = useState(currentServerUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const target = urlInput.trim().replace(/\/+$/, '');
    const healthUrl = target ? `${target}/api/health` : '/api/health';
    setTestStatus('testing');
    setTestMessage('Testando conexão com o servidor...');

    try {
      const start = Date.now();
      const res = await fetch(healthUrl, { method: 'GET' });
      const elapsed = Date.now() - start;

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error(
          'O endereço respondeu, mas não é um servidor Node.js/Express válido (retornou página HTML ou 404).'
        );
      }

      const data = await res.json();
      if (res.ok && data?.status === 'ok') {
        setTestStatus('success');
        setTestMessage(`Conexão estabelecida com sucesso! (${elapsed}ms) - Servidor ativo.`);
      } else {
        throw new Error(data?.error || `Resposta inesperada do servidor (${res.status})`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(
        err.message || 'Não foi possível alcançar o servidor. Verifique a URL e se o serviço está ativo.'
      );
    }
  };

  const handleSave = () => {
    const cleaned = urlInput.trim().replace(/\/+$/, '');
    onSaveServerUrl(cleaned);
    onClose();
  };

  const handleResetDefault = () => {
    setUrlInput('');
    onSaveServerUrl('');
    setTestStatus('idle');
    setTestMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border-3 border-black rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4 font-mono text-black max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <Server className="w-5 h-5 text-black" />
            <h3 className="font-black text-sm uppercase tracking-wider">Configurar Servidor Online</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 border-2 border-black rounded-full flex items-center justify-center font-bold text-xs hover:bg-neutral-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        <div className="text-xs text-neutral-600 leading-relaxed space-y-2">
          <p>
            O <strong>GitHub Pages</strong> hospeda apenas páginas estáticas (HTML/CSS/JS) e não executa o servidor Node.js/Socket.IO.
          </p>
          <p>
            Para jogar o modo <strong>Multiplayer Online</strong> entre aparelhos diferentes, informe a URL do seu servidor backend (ex: Render, Railway, Fly.io):
          </p>
        </div>

        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase text-neutral-700 block">
            URL do Servidor Backend (API / WebSocket):
          </label>
          <div className="relative">
            <input
              type="url"
              placeholder="Ex: https://infiltrado-na-fe.onrender.com"
              value={urlInput}
              onChange={e => {
                setUrlInput(e.target.value);
                setTestStatus('idle');
                setTestMessage('');
              }}
              className="w-full px-3 py-2 border-2 border-black rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-black pr-8"
            />
            {urlInput && (
              <button
                type="button"
                onClick={() => setUrlInput('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black font-bold text-xs"
              >
                ✕
              </button>
            )}
          </div>
          <span className="text-[10px] text-neutral-500 block">
            {urlInput ? `Conectará em: ${urlInput}` : 'Deixe em branco para usar a mesma origem (modo local/dev).'}
          </span>
        </div>

        {/* Test Connection Button & Status */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testStatus === 'testing'}
            className="w-full py-2 border-2 border-black rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-1.5 hover:bg-neutral-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={13} className={testStatus === 'testing' ? 'animate-spin' : ''} />
            <span>{testStatus === 'testing' ? 'Testando Conexão...' : 'Testar Conexão Agora'}</span>
          </button>

          {testStatus !== 'idle' && (
            <div
              className={`p-2.5 rounded-xl border-2 text-xs flex items-start gap-2 ${
                testStatus === 'success'
                  ? 'border-green-800 bg-green-50 text-green-900'
                  : testStatus === 'error'
                  ? 'border-red-800 bg-red-50 text-red-900'
                  : 'border-neutral-400 bg-neutral-50 text-neutral-800'
              }`}
            >
              {testStatus === 'success' && <CheckCircle2 size={16} className="text-green-700 shrink-0 mt-0.5" />}
              {testStatus === 'error' && <AlertCircle size={16} className="text-red-700 shrink-0 mt-0.5" />}
              {testStatus === 'testing' && <RefreshCw size={16} className="animate-spin text-neutral-600 shrink-0 mt-0.5" />}
              <div className="leading-tight">{testMessage}</div>
            </div>
          )}
        </div>

        {/* Guia Rápido Grátis (Render / Railway) */}
        <div className="border border-neutral-300 rounded-2xl p-3 bg-neutral-50 space-y-2">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase text-neutral-800 hover:text-black"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles size={14} />
              Como hospedar o backend grátis no Render (2 min)
            </span>
            <span>{showGuide ? '▲' : '▼'}</span>
          </button>

          {showGuide && (
            <div className="text-[11px] text-neutral-700 space-y-2 pt-2 border-t border-neutral-200">
              <ol className="list-decimal pl-4 space-y-1">
                <li>Crie uma conta gratuita em <strong>render.com</strong>.</li>
                <li>Clique em <strong>New +</strong> &gt; <strong>Web Service</strong>.</li>
                <li>Conecte seu repositório do GitHub.</li>
                <li>
                  Nas configurações preencha:
                  <ul className="list-disc pl-4 mt-0.5 space-y-0.5 font-sans">
                    <li><strong>Build Command:</strong> <code className="font-mono bg-neutral-200 px-1 rounded">npm install</code></li>
                    <li><strong>Start Command:</strong> <code className="font-mono bg-neutral-200 px-1 rounded">npm start</code></li>
                  </ul>
                </li>
                <li>Clique em <strong>Create Web Service</strong>.</li>
                <li>Copie a URL fornecida (ex: <code className="bg-neutral-200 px-1 rounded">https://meu-jogo.onrender.com</code>) e cole no campo acima!</li>
              </ol>
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[10px]">
                💡 Enquanto não configura o servidor online, você pode jogar normalmente no GitHub Pages com os modos <strong>Passar o Celular (Local)</strong> e <strong>Solo vs Bots</strong>, que não precisam de servidor!
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={handleResetDefault}
            className="px-3 py-2.5 border-2 border-neutral-300 rounded-xl text-xs font-bold uppercase hover:bg-neutral-100"
          >
            Padrão
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-black text-white rounded-xl text-xs font-bold uppercase hover:bg-neutral-800 shadow-md active:scale-95 transition-transform"
          >
            Salvar Servidor
          </button>
        </div>
      </div>
    </div>
  );
};
