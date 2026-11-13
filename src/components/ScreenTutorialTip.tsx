import React, { useState } from 'react';
import { Sparkles, X, GraduationCap, ChevronRight } from 'lucide-react';
import { sounds } from '../utils/audio';

interface Props {
  screenName: 'LOBBY' | 'NIGHT' | 'VOTING';
  title: string;
  tip: string;
  onOpenFullTutorial?: () => void;
}

export const ScreenTutorialTip: React.FC<Props> = ({
  screenName,
  title,
  tip,
  onOpenFullTutorial,
}) => {
  const storageKey = `dismissed_tip_${screenName}`;
  const [isDismissed, setIsDismissed] = useState(() => {
    try {
      const enabled = localStorage.getItem('tutorial_in_game_tips') !== 'false';
      if (!enabled) return true;
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    sounds.playClick();
    setIsDismissed(true);
    try {
      localStorage.setItem(storageKey, 'true');
    } catch {}
  };

  return (
    <div className="w-full bg-amber-100/95 border-2 border-amber-600 rounded-2xl p-2.5 sm:p-3 text-black shadow-md flex items-start justify-between gap-2.5 font-mono animate-fadeIn mb-2 shrink-0">
      <div className="flex items-start gap-2 min-w-0">
        <div className="w-6 h-6 rounded-lg bg-amber-400 text-black flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} className="text-black" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-black uppercase bg-amber-500 text-black px-1.5 py-0.2 rounded-md">
              Tutorial Rápido
            </span>
            <span className="text-xs font-black uppercase text-amber-950 font-sans truncate">
              {title}
            </span>
          </div>
          <p className="text-[11px] text-neutral-800 leading-snug mt-0.5">
            {tip}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {onOpenFullTutorial && (
          <button
            onClick={() => {
              sounds.playClick();
              onOpenFullTutorial();
            }}
            className="px-2 py-1 bg-black hover:bg-neutral-800 text-white rounded-lg text-[10px] font-mono font-bold uppercase flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
            title="Abrir Tutorial Interativo Completo"
          >
            <GraduationCap size={12} className="text-amber-400" />
            <span className="hidden sm:inline">Guia Completo</span>
          </button>
        )}
        <button
          onClick={handleDismiss}
          className="w-6 h-6 rounded-lg hover:bg-amber-200 text-amber-900 flex items-center justify-center cursor-pointer transition-colors"
          title="Dispensar esta dica"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};
