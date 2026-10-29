import React, { useMemo } from 'react';
import { Sun, ShieldAlert, Heart, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { GameLog } from '../types/game';
import { FourPointStar } from './RoleIllustrations';
import { sounds } from '../utils/audio';

interface Props {
  dayNumber: number;
  logs: GameLog[];
  onProceedToDiscussion: () => void;
  isHost?: boolean;
}

interface Particle {
  id: number;
  x: number; // porcentagem horizontal (0 a 100)
  size: number; // diâmetro em pixels
  duration: number; // segundos de subida
  delay: number; // delay inicial
  driftX: number; // oscilação horizontal
  type: 'dust' | 'mote' | 'sparkle';
  glowColor: string;
}

export const DayAnnouncementView: React.FC<Props> = ({
  dayNumber,
  logs,
  onProceedToDiscussion,
}) => {
  // Logs da noite anterior
  const nightLogs = logs.filter(
    l => l.dayNumber === dayNumber && (l.type === 'DEATH' || l.type === 'CONVERSION' || l.type === 'INFO')
  );

  const deathLog = nightLogs.find(l => l.type === 'DEATH');
  const conversionLog = nightLogs.find(l => l.type === 'CONVERSION');

  const [hasConfirmed, setHasConfirmed] = React.useState(false);

  // Gera partículas de luz e poeira suspensa estáveis na montagem do componente
  const particles = useMemo<Particle[]>(() => {
    const list: Particle[] = [];
    const count = 26; // quantidade de partículas atmosféricas
    for (let i = 0; i < count; i++) {
      const typeChoice = i % 4 === 0 ? 'sparkle' : i % 2 === 0 ? 'mote' : 'dust';
      list.push({
        id: i,
        x: 4 + ((i * 137.5) % 92), // distribuição espalhada harmônica (Golden Angle)
        size: typeChoice === 'sparkle' ? 12 : typeChoice === 'mote' ? 5 + (i % 4) : 3 + (i % 3),
        duration: 5.5 + ((i * 1.3) % 4.5), // entre 5.5s e 10s
        delay: (i * 0.28) % 3.2,
        driftX: -18 + ((i * 29) % 36), // oscilação lateral suave
        type: typeChoice,
        glowColor: i % 3 === 0 ? '#F59E0B' : i % 3 === 1 ? '#FDE047' : '#FCD34D',
      });
    }
    return list;
  }, []);

  const handleProceed = () => {
    sounds.playClick();
    setHasConfirmed(true);
    onProceedToDiscussion();
  };

  return (
    <div className="flex-1 flex flex-col justify-between p-2 sm:p-4 space-y-4 select-none relative overflow-hidden">
      {/* =========================================================================
          CAMADA DE ATMOSFERA & PARTÍCULAS DE LUZ DO AMANHECER (Framer Motion)
          ========================================================================= */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Feixe de Luz Dourada do Sol Nascente */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.35, 0.6, 0.4, 0.65, 0.35],
            scale: [1, 1.08, 1, 1.05, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-b from-amber-300/40 via-yellow-200/20 to-transparent blur-3xl"
        />

        {/* Raios sutis de sol diagonais */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.15, 0.3, 0.2, 0.35, 0.15] }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-400/15 via-amber-200/5 to-transparent"
        />

        {/* Partículas Flutuantes: Poeira Solar e Fagulhas de Luz */}
        {particles.map((p) => {
          if (p.type === 'sparkle') {
            return (
              <motion.div
                key={p.id}
                initial={{
                  x: `${p.x}%`,
                  y: '105%',
                  opacity: 0,
                  rotate: 0,
                  scale: 0.6,
                }}
                animate={{
                  y: '-10%',
                  opacity: [0, 0.85, 0.95, 0.8, 0],
                  x: [`${p.x}%`, `${p.x + p.driftX * 0.15}%`, `${p.x - p.driftX * 0.15}%`, `${p.x}%`],
                  rotate: [0, 90, 180, 270],
                  scale: [0.6, 1.1, 0.9, 1],
                }}
                transition={{
                  duration: p.duration * 1.1,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
                style={{ position: 'absolute', width: p.size, height: p.size }}
                className="text-amber-500 drop-shadow-[0_0_6px_rgba(245,158,11,0.8)]"
              >
                <FourPointStar size={p.size} className="fill-amber-400 stroke-amber-500" />
              </motion.div>
            );
          }

          if (p.type === 'mote') {
            return (
              <motion.div
                key={p.id}
                initial={{
                  x: `${p.x}%`,
                  y: '105%',
                  opacity: 0,
                  scale: 0.5,
                }}
                animate={{
                  y: '-15%',
                  opacity: [0, 0.75, 0.9, 0.6, 0],
                  x: [
                    `${p.x}%`,
                    `${p.x + p.driftX * 0.2}%`,
                    `${p.x - p.driftX * 0.2}%`,
                    `${p.x}%`,
                  ],
                  scale: [0.5, 1.15, 0.95, 0.6],
                }}
                transition={{
                  duration: p.duration,
                  repeat: Infinity,
                  delay: p.delay,
                  ease: 'easeInOut',
                }}
                style={{
                  position: 'absolute',
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.glowColor,
                }}
                className="rounded-full blur-[0.5px] shadow-[0_0_10px_rgba(251,191,36,0.9)]"
              />
            );
          }

          // Partícula de Poeira Fina Dourada ("dust")
          return (
            <motion.div
              key={p.id}
              initial={{
                x: `${p.x}%`,
                y: '105%',
                opacity: 0,
              }}
              animate={{
                y: '-12%',
                opacity: [0, 0.65, 0.85, 0.5, 0],
                x: [
                  `${p.x}%`,
                  `${p.x + p.driftX * 0.12}%`,
                  `${p.x - p.driftX * 0.12}%`,
                  `${p.x}%`,
                ],
              }}
              transition={{
                duration: p.duration * 0.95,
                repeat: Infinity,
                delay: p.delay,
                ease: 'easeInOut',
              }}
              style={{
                position: 'absolute',
                width: p.size,
                height: p.size,
                backgroundColor: p.glowColor,
              }}
              className="rounded-full blur-[0.3px] opacity-70 shadow-[0_0_6px_rgba(253,224,71,0.8)]"
            />
          );
        })}
      </div>

      {/* =========================================================================
          CONTEÚDO PRINCIPAL (COM ANIMAÇÕES SUAVES DE ENTRADA)
          ========================================================================= */}
      <div className="relative z-10 flex-1 flex flex-col justify-between space-y-4">
        {/* Sun Header com pulso suave */}
        <motion.div
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="text-center space-y-1.5"
        >
          <motion.div
            animate={{
              boxShadow: [
                '0 0 0px rgba(245, 158, 11, 0)',
                '0 0 16px rgba(245, 158, 11, 0.45)',
                '0 0 0px rgba(245, 158, 11, 0)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-black text-amber-300 rounded-full text-[10px] font-mono uppercase tracking-widest border border-amber-400/40"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
              className="shrink-0 flex items-center justify-center"
            >
              <Sun size={13} className="text-amber-400" />
            </motion.div>
            <span>Amanhecer na Vila — {dayNumber}º Dia</span>
          </motion.div>
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black font-sans drop-shadow-xs">
            O SOL NASCEU
          </h2>
          <p className="text-xs font-mono text-neutral-700 max-w-xs mx-auto">
            Os raios de sol e o canto do galo reúnem o rebanho na praça central.
          </p>
        </motion.div>

        {/* Morning Event Cards com slide suave */}
        <motion.div
          initial={{ opacity: 0, y: 22, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.12, type: 'spring', damping: 24, stiffness: 260 }}
          className="flex-1 flex flex-col justify-center space-y-3"
        >
          {/* Death or Peaceful Night Box */}
          {deathLog ? (
            <div className="border-4 border-black p-4 rounded-3xl bg-neutral-50/95 backdrop-blur-xs text-center space-y-2 shadow-lg">
              <div className="w-12 h-12 rounded-full bg-black text-white flex items-center justify-center mx-auto shadow-md">
                <ShieldAlert size={24} className="text-red-400" />
              </div>
              <h3 className="text-sm font-black uppercase text-black font-mono">
                Tragédia na Calada da Noite
              </h3>
              <p className="text-xs font-mono text-neutral-800 leading-relaxed font-bold">
                {deathLog.text}
              </p>
            </div>
          ) : (
            <div className="border-4 border-black p-4 rounded-3xl bg-amber-50/90 backdrop-blur-xs text-center space-y-2 shadow-lg border-amber-950">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center mx-auto shadow-md border-2 border-black">
                <Heart size={24} className="fill-white text-white" />
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
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              className="border-2 border-amber-600 bg-amber-50 p-3 rounded-2xl text-center space-y-1 shadow-md"
            >
              <div className="flex items-center justify-center gap-1.5 text-amber-900">
                <Sparkles size={16} className="text-amber-600" />
                <span className="text-xs font-black uppercase font-mono">Milagre da Fé</span>
                <Sparkles size={16} className="text-amber-600" />
              </div>
              <p className="text-[11px] font-mono text-amber-950 font-bold">
                {conversionLog.text}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Proceed Button com efeito pulsante */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26, duration: 0.3 }}
        >
          <button
            onClick={handleProceed}
            disabled={hasConfirmed}
            className={`w-full py-3.5 rounded-full flex items-center justify-center space-x-2 text-xs font-mono font-black uppercase tracking-widest active:scale-95 transition-all shadow-md cursor-pointer ${
              hasConfirmed
                ? 'bg-emerald-600 text-white border-2 border-emerald-700 shadow-emerald-950/40'
                : 'bg-black text-white hover:bg-neutral-800'
            }`}
          >
            <FourPointStar size={14} />
            <span>
              {hasConfirmed
                ? '✓ CONFIRMADO — REUNINDO REBANHO...'
                : 'REUNIR CONGREGAÇÃO PARA O DEBATE'}
            </span>
            <FourPointStar size={14} />
          </button>
        </motion.div>
      </div>
    </div>
  );
};
