import React from 'react';
import { Sun, Moon, Smartphone, X, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onSetTheme: (theme: 'light' | 'dark') => void;
  onDismiss: () => void;
  className?: string;
}

export const DarkModeSuggestionBanner: React.FC<Props> = ({
  theme,
  onToggleTheme,
  onSetTheme,
  onDismiss,
  className = '',
}) => {
  const isLight = theme === 'light';

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-2xl border-2 transition-all font-mono shadow-md animate-fadeIn text-left ${
        isLight
          ? 'bg-amber-50/95 border-amber-500 text-neutral-900 shadow-amber-900/10'
          : 'bg-[#141E3D] border-indigo-400 text-white shadow-indigo-950/40'
      } ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-2 pb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
              isLight
                ? 'bg-amber-400 border-amber-600 text-black'
                : 'bg-indigo-600 border-indigo-300 text-white'
            }`}
          >
            <Smartphone size={15} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-black text-xs uppercase tracking-tight truncate">
                Modo Noturno Detectado no Celular
              </span>
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                  isLight
                    ? 'bg-amber-200 text-amber-900 border border-amber-300'
                    : 'bg-indigo-900 text-indigo-200 border border-indigo-500'
                }`}
              >
                Dica de Visualização
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={() => {
            sounds.playClick();
            onDismiss();
          }}
          className={`p-1 rounded-lg border transition-colors shrink-0 cursor-pointer ${
            isLight
              ? 'border-neutral-300 hover:bg-amber-100 text-neutral-600'
              : 'border-indigo-400/50 hover:bg-white/10 text-slate-300'
          }`}
          title="Dispensar sugestão"
        >
          <X size={14} />
        </button>
      </div>

      {/* Explanation text */}
      <p
        className={`text-[11px] leading-snug pt-0.5 ${
          isLight ? 'text-neutral-700' : 'text-slate-200'
        }`}
      >
        Detectamos que seu celular está com o <strong>Modo Noturno</strong> ativado. O jogo foi desenhado e ilustrado para melhor leitura e contraste no <strong>Modo Claro</strong>!
      </p>

      {/* Interactive Toggle Control */}
      <div
        className={`mt-2.5 p-2 rounded-xl border flex items-center justify-between gap-3 ${
          isLight
            ? 'bg-white border-amber-300 shadow-2xs'
            : 'bg-[#0B132B] border-indigo-500/60'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isLight ? (
            <Sun size={18} className="text-amber-500 shrink-0" />
          ) : (
            <Moon size={18} className="text-indigo-400 shrink-0" />
          )}
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase truncate">
              {isLight ? '☀️ Modo Claro Ativado' : '🌙 Modo Noturno Ativado'}
            </div>
            <div
              className={`text-[9px] truncate ${
                isLight ? 'text-emerald-700 font-bold' : 'text-slate-400'
              }`}
            >
              {isLight
                ? '✓ Recomendado para melhor contraste'
                : 'Toque no interruptor para mudar para o Modo Claro'}
            </div>
          </div>
        </div>

        {/* Toggle Switch */}
        <button
          type="button"
          role="switch"
          aria-checked={isLight}
          onClick={() => {
            sounds.playClick();
            onToggleTheme();
          }}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-colors cursor-pointer ${
            isLight
              ? 'bg-amber-400 border-amber-600'
              : 'bg-neutral-700 border-neutral-500'
          }`}
          title="Alternar entre Modo Claro e Modo Noturno"
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white border border-black shadow-xs transition-transform ${
              isLight ? 'translate-x-5' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex gap-2 pt-2">
        {!isLight ? (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onSetTheme('light');
            }}
            className="flex-1 py-1.5 px-3 bg-amber-400 hover:bg-amber-300 text-black border-2 border-black rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Sun size={13} />
            <span>Mudar para Modo Claro</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              sounds.playClick();
              onDismiss();
            }}
            className="flex-1 py-1.5 px-3 bg-black hover:bg-neutral-800 text-white rounded-xl text-[11px] font-black uppercase flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Check size={13} />
            <span>Manter Modo Claro</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            sounds.playClick();
            onDismiss();
          }}
          className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase transition-colors cursor-pointer ${
            isLight
              ? 'border border-neutral-400 bg-white hover:bg-neutral-100 text-neutral-700'
              : 'border border-indigo-400/40 bg-white/10 hover:bg-white/20 text-indigo-200'
          }`}
        >
          Dispensar
        </button>
      </div>
    </div>
  );
};
