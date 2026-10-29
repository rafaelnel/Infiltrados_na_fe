import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { FourPointStar } from './RoleIllustrations';

export type AtmosphericTransitionType = 'DAWN' | 'DUSK' | null;

interface Props {
  type: AtmosphericTransitionType;
  onComplete?: () => void;
}

export const AtmosphericTransition: React.FC<Props> = ({ type, onComplete }) => {
  useEffect(() => {
    if (!type) return;
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 3400);
    return () => clearTimeout(timer);
  }, [type, onComplete]);

  // Estrelas fixas para o anoitecer
  const stars = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      x: ((i * 137.5) % 94) + 3,
      y: ((i * 61.8) % 80) + 5,
      size: (i % 3) + 2,
      delay: (i * 0.08) % 1.2,
    }));
  }, []);

  // Fagulhas de ouro para o amanhecer
  const dawnSparks = useMemo(() => {
    return Array.from({ length: 24 }).map((_, i) => ({
      id: i,
      x: ((i * 149.3) % 90) + 5,
      size: (i % 4) + 3,
      duration: 2.2 + (i % 3) * 0.4,
      delay: (i * 0.06) % 0.9,
    }));
  }, []);

  return (
    <AnimatePresence>
      {type && (
        <motion.div
          key={`atmos_${type}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 pointer-events-none overflow-hidden select-none"
        >
          {/* =====================================================================
              1. TRANSIÇÃO DE AMANHECER (DAWN / SUNRISE GRADIENT)
              ===================================================================== */}
          {type === 'DAWN' && (
            <div className="absolute inset-0">
              {/* Gradiente Atmosférico Principal do Amanhecer:
                  De violeta noturno -> rubi crepuscular -> pêssego dourado -> luz solar cristalina */}
              <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{
                  opacity: [0, 0.92, 0.98, 0.75, 0],
                  scale: [1.05, 1, 1, 1.02, 1],
                }}
                transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-gradient-to-t from-[#F59E0B] via-[#F43F5E]/70 to-[#4338CA]/40"
              />

              {/* Clarão Dourado do Sol Rompendo o Horizonte */}
              <motion.div
                initial={{ opacity: 0, y: '80%', scale: 0.7 }}
                animate={{
                  opacity: [0, 0.95, 1, 0.6, 0],
                  y: ['80%', '20%', '-10%', '-25%'],
                  scale: [0.7, 1.2, 1.6, 1.9],
                }}
                transition={{ duration: 3.2, ease: 'easeOut' }}
                className="absolute inset-x-0 bottom-0 flex justify-center items-center"
              >
                <div className="w-[120vw] h-[70vh] rounded-full bg-gradient-to-t from-amber-300 via-yellow-200/80 to-transparent blur-3xl opacity-90" />
              </motion.div>

              {/* Feixes de Luz Radiante Solar */}
              <motion.div
                initial={{ opacity: 0, rotate: -8 }}
                animate={{
                  opacity: [0, 0.6, 0.75, 0.3, 0],
                  rotate: [-8, 0, 8],
                }}
                transition={{ duration: 3.2, ease: 'easeInOut' }}
                className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-amber-200/60 via-amber-400/25 to-transparent blur-xl"
              />

              {/* Ícone Eéreo do Sol Nascente no Centro */}
              <motion.div
                initial={{ opacity: 0, scale: 0.4, y: 60 }}
                animate={{
                  opacity: [0, 0.85, 1, 0.7, 0],
                  scale: [0.4, 1.1, 1.25, 1.35],
                  y: [60, 0, -30, -60],
                }}
                transition={{ duration: 3.0, ease: 'easeOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center text-amber-900"
              >
                <div className="p-5 rounded-full bg-amber-400/30 backdrop-blur-xs border border-amber-300/60 shadow-[0_0_60px_rgba(251,191,36,0.9)]">
                  <Sun size={64} className="text-amber-100 drop-shadow-[0_0_20px_rgba(254,240,138,1)] animate-pulse" />
                </div>
              </motion.div>

              {/* Fagulhas Douradas Flutuando na Brisa da Manhã */}
              {dawnSparks.map((spark) => (
                <motion.div
                  key={`spark_${spark.id}`}
                  initial={{
                    x: `${spark.x}%`,
                    y: '100%',
                    opacity: 0,
                    scale: 0.5,
                  }}
                  animate={{
                    y: ['100%', '10%'],
                    opacity: [0, 0.9, 1, 0],
                    scale: [0.5, 1.2, 0.8],
                  }}
                  transition={{
                    duration: spark.duration,
                    delay: spark.delay,
                    ease: 'easeOut',
                  }}
                  style={{ position: 'absolute' }}
                  className="text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.9)]"
                >
                  <FourPointStar size={spark.size * 3} />
                </motion.div>
              ))}
            </div>
          )}

          {/* =====================================================================
              2. TRANSIÇÃO DE ANOITECER (DUSK / NIGHTFALL GRADIENT)
              ===================================================================== */}
          {type === 'DUSK' && (
            <div className="absolute inset-0">
              {/* Gradiente Atmosférico Principal do Crepúsculo:
                  De dourado poente -> carmim pôr-do-sol -> violeta real -> escuridão celestial */}
              <motion.div
                initial={{ opacity: 0, scale: 1 }}
                animate={{
                  opacity: [0, 0.92, 0.98, 0.8, 0],
                  scale: [1, 1.03, 1, 1],
                }}
                transition={{ duration: 3.2, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 bg-gradient-to-b from-[#0B132B] via-[#311042]/90 via-[#831843]/60 to-[#D97706]/40"
              />

              {/* Manto da Noite Descendente (Cortina de Escuridão Cósmica) */}
              <motion.div
                initial={{ opacity: 0, y: '-70%' }}
                animate={{
                  opacity: [0, 0.85, 1, 0.75, 0],
                  y: ['-70%', '-20%', '0%', '20%'],
                }}
                transition={{ duration: 3.2, ease: 'easeInOut' }}
                className="absolute inset-x-0 top-0 h-[85vh] bg-gradient-to-b from-[#030712] via-[#0B132B]/95 to-transparent blur-2xl"
              />

              {/* Brilho Azulado Noturno Lunar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: [0, 0.7, 0.9, 0.5, 0],
                  scale: [0.8, 1, 1.2, 1.3],
                }}
                transition={{ duration: 3.2, ease: 'easeOut' }}
                className="absolute top-10 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-gradient-to-b from-indigo-500/30 via-indigo-900/20 to-transparent blur-3xl"
              />

              {/* Ícone Eéreo da Lua Noturna no Centro */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5, y: -40 }}
                animate={{
                  opacity: [0, 0.85, 1, 0.7, 0],
                  scale: [0.5, 1.05, 1.2, 1.3],
                  y: [-40, 0, 20, 40],
                }}
                transition={{ duration: 3.0, ease: 'easeOut' }}
                className="absolute inset-0 flex flex-col items-center justify-center text-indigo-200"
              >
                <div className="p-5 rounded-full bg-indigo-950/50 backdrop-blur-xs border border-indigo-500/50 shadow-[0_0_60px_rgba(99,102,241,0.8)]">
                  <Moon size={60} className="text-indigo-200 drop-shadow-[0_0_18px_rgba(165,180,252,0.9)]" />
                </div>
              </motion.div>

              {/* Estrelas Cintilando no Céu Crepuscular */}
              {stars.map((star) => (
                <motion.div
                  key={`star_${star.id}`}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{
                    opacity: [0, 0.85, 1, 0.3, 0],
                    scale: [0.4, 1.1, 1, 0.6],
                  }}
                  transition={{
                    duration: 2.4,
                    delay: star.delay + 0.3,
                    ease: 'easeInOut',
                  }}
                  style={{
                    position: 'absolute',
                    left: `${star.x}%`,
                    top: `${star.y}%`,
                    width: star.size,
                    height: star.size,
                  }}
                  className="rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.9)]"
                />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
