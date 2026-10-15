import React from 'react';
import { Sun, ShieldAlert, Heart, Sparkles, MessageCircle } from 'lucide-react';
import { GameLog } from '../types/game';
import { FourPointStar } from './RoleIllustrations';
import { sounds } from '../utils/audio';

interface Props {
  dayNumber: number;
  logs: GameLog[];
  onProceedToDiscussion: () => void;
  isHost?: boolean;
}

export const DayAnnouncementView: React.FC<Props> = ({
  dayNumber,
  logs,
  onProceedToDiscussion,
}) => {
  // Get logs from this night
  const nightLogs = logs.filter(
    l => l.dayNumber === dayNumber && (l.type === 'DEATH' || l.type === 'CONVERSION' || l.type === 'INFO')
  );

  const deathLog = nightLogs.find(l => l.type === 'DEATH');
  const conversionLog = nightLogs.find(l => l.type === 'CONVERSION');
  const protectionLog = nightLogs.find(l => l.text.includes('Pastor') || l.text.includes('salvou') || l.text.includes('protegeu'));

  const handleProceed = () => {
    sounds.playClick();
    onProceedToDiscussion();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 sm:p-4 space-y-4 animate-fadeIn select-none">
      {/* Sun Header */}
      <div className="text-center space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest">
          <Sun size={12} />
          <span>Amanhecer na Vila — {dayNumber}º Dia</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
          O SOL NASCEU
        </h2>
        <p className="text-xs font-mono text-neutral-600">
          Os sinos da capela tocam para reunir o rebanho na praça central.
        </p>
      </div>

      {/* Morning Event Cards */}
      <div className="flex-1 flex flex-col justify-center space-y-3">
        {/* Death or Peaceful Night Box */}
        {deathLog ? (
          <div className="border-4 border-black p-4 rounded-3xl bg-neutral-50 text-center space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto">
              <ShieldAlert size={24} />
            </div>
            <h3 className="text-sm font-black uppercase text-black font-mono">
              Tragédia na Calada da Noite
            </h3>
            <p className="text-xs font-mono text-neutral-800 leading-relaxed font-bold">
              {deathLog.text}
            </p>
          </div>
        ) : (
          <div className="border-4 border-black p-4 rounded-3xl bg-neutral-50 text-center space-y-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto">
              <Heart size={24} />
            </div>
            <h3 className="text-sm font-black uppercase text-black font-mono">
              Uma Noite Abençoada
            </h3>
            <p className="text-xs font-mono text-neutral-800 leading-relaxed font-bold">
              Nenhum membro da congregação faleceu esta noite! A vigilância do Pastor e as orações guardaram os inocentes.
            </p>
          </div>
        )}

        {/* Conversion Miracle Notice */}
        {conversionLog && (
          <div className="border-2 border-black p-3 rounded-2xl bg-white text-center space-y-1">
            <div className="flex items-center justify-center gap-1 text-black">
              <Sparkles size={16} />
              <span className="text-xs font-black uppercase font-mono">Milagre da Fé</span>
            </div>
            <p className="text-[11px] font-mono text-neutral-700">
              {conversionLog.text}
            </p>
          </div>
        )}
      </div>

      {/* Proceed Button */}
      <button
        onClick={handleProceed}
        className="w-full py-3.5 bg-black text-white rounded-full flex items-center justify-center space-x-2 text-xs font-mono font-black uppercase tracking-widest active:scale-95 transition-transform shadow-md hover:bg-neutral-800"
      >
        <FourPointStar size={14} />
        <span>REUNIR CONGREGAÇÃO PARA O DEBATE</span>
        <FourPointStar size={14} />
      </button>
    </div>
  );
};
