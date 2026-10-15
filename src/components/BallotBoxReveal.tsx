import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../utils/audio';
import { Scroll, Sparkles, CheckCircle2 } from 'lucide-react';

interface BallotBoxRevealProps {
  dayNumber: number;
  logText: string;
  onComplete: () => void;
  autoCloseDelay?: number;
}

export const BallotBoxReveal: React.FC<BallotBoxRevealProps> = ({
  dayNumber,
  logText,
  onComplete,
}) => {
  // Estágios da animação:
  // 1. 'COUNTING': urna tremendo, apurando votos (0s - 1.6s)
  // 2. 'OPENING': cadeado abrindo, tampa subindo e feixe de luz (1.6s - 2.8s)
  // 3. 'REVEALED': papiro da sentença subindo com o resultado (2.8s+)
  const [stage, setStage] = useState<'COUNTING' | 'OPENING' | 'REVEALED'>('COUNTING');

  useEffect(() => {
    // Inicia som de suspense
    sounds.playUrnSuspense();

    // Transição para abertura da tampa
    const openTimer = setTimeout(() => {
      setStage('OPENING');
      sounds.playUrnOpen();
    }, 1600);

    // Transição para revelação do pergaminho do veredito
    const revealTimer = setTimeout(() => {
      setStage('REVEALED');
      sounds.playGavelStrike();
    }, 2900);

    return () => {
      clearTimeout(openTimer);
      clearTimeout(revealTimer);
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-between p-4 sm:p-6 text-center select-none animate-fadeIn bg-gradient-to-b from-neutral-900 via-neutral-950 to-black text-white rounded-3xl border-3 border-black shadow-2xl relative overflow-hidden">
      {/* Luz mística de fundo quando a urna abre */}
      <AnimatePresence>
        {stage !== 'COUNTING' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.35, scale: 1.4 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-400 blur-3xl pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Header com badge */}
      <div className="space-y-1.5 z-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-neutral-800 border border-neutral-600 rounded-full text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
          <Sparkles size={12} className="animate-spin text-amber-400" />
          <span>Apuração dos Votos • {dayNumber}º Dia</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase font-mono tracking-wide text-white">
          {stage === 'COUNTING' && 'Apurando as Cédulas'}
          {stage === 'OPENING' && 'Abrindo as Urnas'}
          {stage === 'REVEALED' && 'Sentença Revelada!'}
        </h2>
        <p className="text-xs font-mono text-neutral-400 max-w-xs mx-auto">
          {stage === 'COUNTING' && 'Os votos sagrados foram depositados e estão sendo conferidos...'}
          {stage === 'OPENING' && 'Os lacres da congregação foram rompidos!'}
          {stage === 'REVEALED' && 'O julgamento da assembleia foi proferido.'}
        </p>
      </div>

      {/* Ilustração da Urna Sagrada da Assembleia com tampa animada */}
      <div className="relative my-4 flex items-center justify-center w-64 h-56 z-10">
        {/* Caixa da Urna (Base) */}
        <motion.div
          animate={
            stage === 'COUNTING'
              ? { x: [-2, 2, -3, 3, -1, 1, 0], y: [-1, 1, -1, 1, 0] }
              : { x: 0, y: 0 }
          }
          transition={
            stage === 'COUNTING'
              ? { repeat: Infinity, duration: 0.28, ease: 'easeInOut' }
              : { duration: 0.2 }
          }
          className="relative w-48 h-40 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 200 180"
            className="w-full h-full drop-shadow-[0_10px_20px_rgba(0,0,0,0.8)]"
            fill="none"
            stroke="#ffffff"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {/* Sombra de apoio no chão */}
            <ellipse cx="100" cy="165" rx="75" ry="12" fill="#000000" opacity="0.6" stroke="none" />

            {/* Corpo da Urna de Madeira Antiga com Placas */}
            <path
              d="M40 70 L50 155 L150 155 L160 70 Z"
              fill="#1e1e24"
              stroke="#ffffff"
              strokeWidth="3.5"
            />

            {/* Placas de Reforço com Rebites de Bronze */}
            <line x1="50" y1="155" x2="60" y2="70" strokeWidth="2.5" stroke="#ffffff" />
            <line x1="150" y1="155" x2="140" y2="70" strokeWidth="2.5" stroke="#ffffff" />
            <line x1="100" y1="155" x2="100" y2="70" strokeWidth="2" strokeDasharray="6 4" stroke="#ffffff" />

            {/* Rebites nos cantos */}
            <circle cx="56" cy="80" r="2.5" fill="#ffffff" />
            <circle cx="53" cy="145" r="2.5" fill="#ffffff" />
            <circle cx="144" cy="80" r="2.5" fill="#ffffff" />
            <circle cx="147" cy="145" r="2.5" fill="#ffffff" />

            {/* Brasão Sagrado no centro (Coroa de Louros / Cruz da Assembleia) */}
            <circle cx="100" cy="112" r="18" fill="#121216" stroke="#ffffff" strokeWidth="2.5" />
            <line x1="100" y1="100" x2="100" y2="124" strokeWidth="3" stroke="#ffffff" />
            <line x1="91" y1="108" x2="109" y2="108" strokeWidth="3" stroke="#ffffff" />

            {/* Feixe de luz divino saindo de dentro da urna quando aberta */}
            {stage !== 'COUNTING' && (
              <g>
                <polygon
                  points="50,70 20,-20 180,-20 150,70"
                  fill="url(#urnGlow)"
                  opacity="0.85"
                  stroke="none"
                />
                <line x1="70" y1="65" x2="40" y2="-10" stroke="#fef08a" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="100" y1="65" x2="100" y2="-15" stroke="#fef08a" strokeWidth="3" />
                <line x1="130" y1="65" x2="160" y2="-10" stroke="#fef08a" strokeWidth="2" strokeDasharray="4 4" />
              </g>
            )}

            <defs>
              <linearGradient id="urnGlow" x1="0%" y1="100%" x2="0%" y2="0%">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                <stop offset="60%" stopColor="#fbbf24" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>

          {/* Tampa da Urna (Articulada com animação de abertura para cima) */}
          <motion.div
            initial={{ rotateX: 0, y: 0 }}
            animate={
              stage === 'COUNTING'
                ? { rotateX: 0, y: 0 }
                : { rotateX: -65, y: -26, scale: 0.96 }
            }
            transition={{
              duration: 0.8,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="absolute top-1 left-0 right-0 origin-top flex items-center justify-center pointer-events-none"
          >
            <svg
              viewBox="0 0 200 45"
              className="w-full h-12 drop-shadow-md"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Tampa com fenda de votos e puxador */}
              <path
                d="M32 32 L40 12 L160 12 L168 32 Z"
                fill="#2a2a32"
                stroke="#ffffff"
                strokeWidth="3.5"
              />
              {/* Fenda para depositar os votos */}
              <rect x="75" y="18" width="50" height="5" rx="2" fill="#000000" stroke="#ffffff" strokeWidth="2" />
              {/* Puxador da Tampa */}
              <path d="M92 12 Q100 2 108 12" stroke="#ffffff" strokeWidth="3" fill="none" />
              {/* Fecho / Cadeado */}
              <circle cx="100" cy="34" r="5" fill="#f59e0b" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </motion.div>

          {/* Cédulas voando durante a contagem */}
          {stage === 'COUNTING' && (
            <motion.div
              animate={{
                y: [10, -8, 10],
                rotate: [-6, 6, -6],
              }}
              transition={{ repeat: Infinity, duration: 1, ease: 'easeInOut' }}
              className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-100 text-black px-2 py-0.5 rounded text-[9px] font-mono font-black border border-black shadow-md flex items-center gap-1"
            >
              <Scroll size={10} />
              <span>VOTO</span>
            </motion.div>
          )}

          {/* Pergaminho subindo de dentro da urna quando revelado */}
          <AnimatePresence>
            {stage === 'REVEALED' && (
              <motion.div
                initial={{ y: 50, scale: 0.5, opacity: 0 }}
                animate={{ y: -45, scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                className="absolute left-1/2 -translate-x-1/2 -top-6 w-56 bg-neutral-100 border-3 border-black text-black rounded-2xl p-3.5 shadow-2xl z-30 font-mono text-left"
              >
                <div className="flex items-center justify-between border-b-2 border-black/30 pb-1 mb-2">
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                    <Scroll size={12} />
                    Veredito Oficial
                  </span>
                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-bold">
                    {dayNumber}º Dia
                  </span>
                </div>
                <p className="text-xs font-bold leading-snug line-clamp-4 text-neutral-900">
                  {logText}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Barra de ação inferior */}
      <div className="w-full max-w-sm space-y-2.5 z-10">
        {stage === 'REVEALED' ? (
          <motion.button
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={onComplete}
            className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-black rounded-full text-xs font-mono font-black uppercase tracking-widest active:scale-95 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            <CheckCircle2 size={16} />
            <span>CONTINUAR PARA O RESULTADO</span>
          </motion.button>
        ) : (
          <button
            onClick={onComplete}
            className="w-full py-2.5 text-[11px] font-mono text-neutral-400 hover:text-white transition-colors underline uppercase tracking-wider"
          >
            Pular suspense ➔
          </button>
        )}
      </div>
    </div>
  );
};
