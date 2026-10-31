import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Lock, Check, Sparkles } from 'lucide-react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Role, ROLES_METADATA, ModifierId, MODIFIERS_METADATA } from '../types/game';
import { RoleIllustration, FourPointStar } from './RoleIllustrations';
import { PersonAvatar } from './PersonAvatar';
import { sounds } from '../utils/audio';

interface Props {
  role: Role;
  playerName: string;
  isCoveredDefault?: boolean;
  onConfirm: () => void;
  confirmLabel?: string;
  nextPlayerName?: string;
  extraInfo?: string;
  modifier?: ModifierId | null;
  avatar?: string;
  color?: string;
  hideAvatar?: boolean;
}

// Configuração suave de slide-in com mola amortecida para os cards de revelação
const cardSlideVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 36,
    scale: 0.96,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      damping: 24,
      stiffness: 260,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    y: -28,
    scale: 0.96,
    transition: {
      duration: 0.22,
      ease: [0.4, 0, 0.2, 1],
    },
  },
};

export const RoleCardSecret: React.FC<Props> = ({
  role,
  playerName,
  isCoveredDefault = true,
  onConfirm,
  confirmLabel = 'CONFIRMAR PAPEL',
  nextPlayerName,
  extraInfo,
  modifier,
  avatar,
  color,
  hideAvatar = false,
}) => {
  // Começa sempre coberto para garantir o sigilo ao passar o celular
  const [isRevealed, setIsRevealed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const metadata = ROLES_METADATA[role] || ROLES_METADATA.OVELHA;

  // Quando o jogador ativo mudar, força o travamento imediato da tela
  useEffect(() => {
    setIsRevealed(false);
    setIsConfirmed(false);
  }, [playerName, role]);

  const handleReveal = () => {
    sounds.playClick();
    setIsRevealed(true);
  };

  const handleHideAndPass = () => {
    sounds.playClick();
    setIsConfirmed(true);
    setTimeout(() => {
      // Oculta primeiro
      setIsRevealed(false);
      setIsConfirmed(false);
      // Dispara callback de confirmação
      onConfirm();
    }, 280);
  };

  return (
    <div className="flex-1 flex flex-col justify-between w-full h-full relative overflow-hidden">
      <AnimatePresence mode="wait">
        {!isRevealed ? (
          // =========================================================================
          // TELA 1: CORTINA DE PRIVACIDADE / PASSE O CELULAR (Slide-in)
          // =========================================================================
          <motion.div
            key={`curtain_${playerName}`}
            variants={cardSlideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col lg:flex-row items-center justify-between lg:justify-center lg:gap-12 p-3 sm:p-6 text-center space-y-3 lg:space-y-0 select-none"
          >
            <div className="flex flex-col items-center space-y-3 lg:w-5/12">
              <div className="space-y-1">
                <div className="inline-block px-3 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest shadow-xs">
                  🔒 Cortina de Sigilo
                </div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-black font-sans">
                  PASSE O CELULAR
                </h2>
              </div>

              {/* Illustrated Citizen Avatar of Recipient with Lock Badge or Clean Padlock */}
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.08, type: 'spring', damping: 20 }}
                className="relative my-1"
              >
                {hideAvatar ? (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-black flex flex-col items-center justify-center bg-neutral-100 shadow-inner">
                    <Lock size={40} className="text-black" />
                    <span className="text-[10px] font-mono font-black uppercase tracking-widest text-black mt-1">
                      SIGILOSO
                    </span>
                  </div>
                ) : (
                  <>
                    <PersonAvatar
                      seed={playerName}
                      avatar={avatar}
                      color={color}
                      size={108}
                      className="border-3 border-black shadow-lg"
                    />
                    <div className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full border-2 border-black bg-white flex items-center justify-center shadow-md">
                      <Lock size={16} className="text-black" />
                    </div>
                  </>
                )}
              </motion.div>
            </div>

            <div className="flex flex-col items-center space-y-4 w-full max-w-xs lg:max-w-sm lg:w-7/12">
              {/* Recipient Notice */}
              <div className="space-y-2 w-full">
                <p className="text-xs font-mono uppercase tracking-widest text-neutral-500 font-bold">
                  Entregue este aparelho para:
                </p>
                <div className="p-3 border-2 border-black rounded-2xl bg-white shadow-sm">
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-black uppercase block">
                    {playerName}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-neutral-600 leading-tight pt-1">
                  ⚠️ Ninguém além de <strong>{playerName}</strong> deve olhar para a tela agora.
                </p>
              </div>

              {/* Reveal Button */}
              <button
                onClick={handleReveal}
                className="w-full bg-black text-white py-3.5 px-6 rounded-full flex items-center justify-center space-x-2 active:scale-[0.97] transition-transform text-xs font-black tracking-widest uppercase hover:bg-neutral-800 shadow-lg cursor-pointer"
              >
                <Eye size={16} />
                <span>SOU EU, {playerName.toUpperCase()} — REVELAR</span>
              </button>
            </div>
          </motion.div>
        ) : (
          // =========================================================================
          // TELA 2: CARD DE REVELAÇÃO DO PAPEL (Slide-in com Framer Motion)
          // =========================================================================
          <motion.div
            key={`role_${playerName}_${role}`}
            variants={cardSlideVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex-1 flex flex-col justify-between items-center text-center p-2 sm:p-3 space-y-2 select-none min-h-0"
          >
            {/* Top Tag & Instant Conceal button */}
            <div className="w-full flex items-center justify-between px-2 shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest shadow-xs">
                {!hideAvatar && (
                  <PersonAvatar seed={playerName} avatar={avatar} color={color} size={18} className="border border-white/40 shrink-0" />
                )}
                <span className="truncate max-w-[200px]">Papel de {playerName}</span>
              </div>
              <button
                onClick={() => setIsRevealed(false)}
                title="Ocultar tela imediatamente"
                className="px-2.5 py-1 border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer active:scale-95"
              >
                <EyeOff size={13} />
                <span>Ocultar</span>
              </button>
            </div>

            {/* Conteúdo Principal: Vertical no Mobile, Lado a Lado (2 Colunas) no Desktop */}
            <div className="flex-1 w-full flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 items-center justify-between lg:justify-center min-h-0">
              {/* Coluna Esquerda no Desktop: Ilustração */}
              <div className="relative w-full lg:col-span-5 flex items-center justify-center my-0 max-h-[175px] sm:max-h-[200px] lg:max-h-none">
                {/* Decorative Stars */}
                <div className="absolute left-4 top-2 text-black">
                  <FourPointStar size={20} />
                </div>
                <div className="absolute left-10 top-12 text-black">
                  <FourPointStar size={12} />
                </div>
                <div className="absolute right-4 bottom-4 text-black">
                  <FourPointStar size={24} />
                </div>
                <div className="absolute right-12 bottom-12 text-black">
                  <FourPointStar size={14} />
                </div>

                {/* Dynamic character illustration with entrance scale */}
                <motion.div
                  initial={{ scale: 0.86, opacity: 0, y: 16 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.08, type: 'spring', damping: 20, stiffness: 250 }}
                  className="p-1 transform hover:scale-105 transition-transform"
                >
                  <RoleIllustration role={role} className="w-36 h-36 sm:w-44 sm:h-44 lg:w-52 lg:h-52 drop-shadow-md" />
                </motion.div>
              </div>

              {/* Coluna Direita no Desktop: Informações do Papel + Botão de Confirmação */}
              <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.14, duration: 0.3 }}
                className="lg:col-span-7 flex flex-col items-center lg:items-stretch text-center lg:text-left space-y-2 w-full max-w-xs lg:max-w-none"
              >
                <div className="space-y-0.5">
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tight text-black">
                    VOCÊ É {role === 'OVELHA' ? 'UMA OVELHA' : `UM ${metadata.name.toUpperCase()}`}
                  </h2>
                  <p className="text-xs font-mono font-bold text-neutral-800 tracking-tight">
                    {metadata.subtitle}
                  </p>
                </div>

                <div className="text-[11px] leading-relaxed text-neutral-800 font-mono px-3 py-2 space-y-1.5 text-left border-t border-b border-black my-1 bg-neutral-50/50 rounded-lg">
                  <p>
                    <span className="font-black text-black">OBJETIVO: </span>
                    {role === 'SOLDADO'
                      ? 'Elimine ou iguale em número as Ovelhas da vila sem ser descoberto.'
                      : 'Descubra e elimine ou converta todos os Soldados infiltrados.'}
                  </p>
                  <p>
                    <span className="font-black text-black">HABILIDADE: </span>
                    <span className="font-bold underline">{metadata.abilityName}:</span> {metadata.abilityDescription}
                  </p>
                  {extraInfo && (
                    <p className="bg-neutral-100 p-1 rounded font-bold text-[10px] text-black">
                      {extraInfo}
                    </p>
                  )}

                  {modifier && (
                    <div className="bg-amber-50 border-2 border-amber-600 rounded-xl p-2 text-left space-y-1 my-1 shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-amber-900 text-[10px] uppercase flex items-center gap-1">
                          <Sparkles size={12} className="text-amber-700" />
                          <span>CARD ESPECIAL (MODIFICADOR):</span>
                        </span>
                        <span className="bg-amber-600 text-white font-mono font-black text-[9px] px-1.5 py-0.5 rounded uppercase">
                          {MODIFIERS_METADATA[modifier]?.name}
                        </span>
                      </div>
                      <p className="text-[10px] font-mono font-bold text-amber-950 leading-tight">
                        {MODIFIERS_METADATA[modifier]?.abilityDescription}
                      </p>
                    </div>
                  )}
                </div>

                {/* Privacy Notice */}
                <div className="w-full text-center lg:text-left py-0.5">
                  <p className="text-[10px] font-mono tracking-tight text-black uppercase font-bold flex items-center justify-center lg:justify-start gap-1">
                    <Shield size={12} />
                    <span>Mantenha sua tela em segredo absoluto</span>
                  </p>
                </div>

                {/* Action / Next Player Button */}
                <motion.button
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18, duration: 0.28 }}
                  type="button"
                  onClick={handleHideAndPass}
                  disabled={isConfirmed}
                  className={`w-full py-3 rounded-full flex items-center justify-center space-x-2 active:scale-[0.98] transition-all shadow-md text-xs font-black tracking-widest uppercase cursor-pointer ${
                    isConfirmed
                      ? 'bg-emerald-600 text-white border-2 border-emerald-700 font-black shadow-emerald-950/40'
                      : 'bg-black text-white hover:bg-neutral-800'
                  }`}
                >
                  {isConfirmed ? (
                    <>
                      <Check size={16} />
                      <span>CONFIRMADO ✓</span>
                    </>
                  ) : (
                    <>
                      <FourPointStar size={14} className="text-white" />
                      <span>
                        {nextPlayerName
                          ? `OCULTAR E PASSAR PARA ${nextPlayerName.toUpperCase()}`
                          : confirmLabel}
                      </span>
                      <FourPointStar size={14} className="text-white" />
                    </>
                  )}
                </motion.button>
              </motion.section>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
