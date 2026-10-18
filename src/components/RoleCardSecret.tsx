import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, Lock, Check, Sparkles } from 'lucide-react';
import { Role, ROLES_METADATA, ModifierId, MODIFIERS_METADATA } from '../types/game';
import { RoleIllustration, FourPointStar } from './RoleIllustrations';
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
}

export const RoleCardSecret: React.FC<Props> = ({
  role,
  playerName,
  isCoveredDefault = true,
  onConfirm,
  confirmLabel = 'CONFIRMAR PAPEL',
  nextPlayerName,
  extraInfo,
  modifier,
}) => {
  // Always start covered whenever player or role changes!
  const [isRevealed, setIsRevealed] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const metadata = ROLES_METADATA[role] || ROLES_METADATA.OVELHA;

  // Whenever the active player changes, ALWAYS force-lock the screen immediately!
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
      // Instantly hide role first
      setIsRevealed(false);
      setIsConfirmed(false);
      // Then call parent confirm/transition callback
      onConfirm();
    }, 280);
  };

  // =========================================================================
  // TELA DE CORTINA DE PRIVACIDADE / BLOQUEIO TOTAL
  // (Exibida antes da pessoa ver e enquanto passa o aparelho de mão em mão)
  // =========================================================================
  if (!isRevealed) {
    return (
      <div className="flex-1 flex flex-col items-center justify-between p-6 text-center space-y-4 animate-fadeIn select-none">
        <div className="space-y-1">
          <div className="inline-block px-3 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest">
            🔒 Cortina de Sigilo
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black font-sans">
            PASSE O CELULAR
          </h2>
        </div>

        {/* Big Privacy Lock Emblem */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-black flex flex-col items-center justify-center bg-neutral-100 shadow-inner my-2">
          <Lock size={44} className="text-black" />
          <span className="text-[9px] font-mono font-black uppercase tracking-wider text-black mt-1">
            CONFIDENCIAL
          </span>
        </div>

        {/* Recipient Notice */}
        <div className="space-y-2 w-full max-w-xs">
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
          className="w-full max-w-xs bg-black text-white py-4 px-6 rounded-full flex items-center justify-center space-x-2 active:scale-[0.97] transition-transform text-xs font-black tracking-widest uppercase hover:bg-neutral-800 shadow-lg"
        >
          <Eye size={16} />
          <span>SOU EU, {playerName.toUpperCase()} — REVELAR</span>
        </button>
      </div>
    );
  }

  // =========================================================================
  // TELA DE PAPEL SEGRETO REVELADO
  // (Exibida apenas quando a pessoa autorizada desbloqueia a tela)
  // =========================================================================
  return (
    <div className="flex-1 flex flex-col justify-between items-center text-center p-2 sm:p-4 space-y-2 animate-fadeIn select-none">
      {/* Top Tag & Instant Conceal button */}
      <div className="w-full flex items-center justify-between px-2">
        <div className="inline-block px-3 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest">
          Papel Secreto de {playerName}
        </div>
        <button
          onClick={() => setIsRevealed(false)}
          title="Ocultar tela imediatamente"
          className="px-2.5 py-1 border-2 border-black rounded-full hover:bg-black hover:text-white transition-colors text-[10px] font-mono font-bold flex items-center gap-1"
        >
          <EyeOff size={13} />
          <span>Ocultar</span>
        </button>
      </div>

      {/* Vector Illustration */}
      <div className="relative w-full flex-1 flex items-center justify-center my-0 max-h-[220px]">
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

        {/* Dynamic character illustration */}
        <div className="p-1 transform hover:scale-105 transition-transform">
          <RoleIllustration role={role} className="w-44 h-44 sm:w-48 sm:h-48" />
        </div>
      </div>

      {/* Character Info */}
      <section className="text-center space-y-1 w-full max-w-xs">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
          VOCÊ É {role === 'OVELHA' ? 'UMA OVELHA' : `UM ${metadata.name.toUpperCase()}`}
        </h2>
        <p className="text-xs font-mono font-bold text-neutral-800 tracking-tight">
          {metadata.subtitle}
        </p>

        <div className="text-[11px] leading-relaxed text-neutral-800 font-mono px-3 py-2 space-y-1.5 text-left border-t border-b border-black my-1 bg-neutral-50/50">
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
            <div className="bg-amber-50 border-2 border-amber-600 rounded-xl p-2.5 text-left space-y-1 my-1 shadow-xs">
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
      </section>

      {/* Privacy Notice */}
      <div className="w-full text-center py-1">
        <p className="text-[10px] font-mono tracking-tight text-black uppercase font-bold flex items-center justify-center gap-1">
          <Shield size={12} />
          <span>Mantenha sua tela em segredo absoluto</span>
        </p>
      </div>

      {/* Action / Next Player Button */}
      <button
        type="button"
        onClick={handleHideAndPass}
        disabled={isConfirmed}
        className={`w-full max-w-xs py-3.5 rounded-full flex items-center justify-center space-x-2 active:scale-[0.98] transition-all shadow-md text-xs font-black tracking-widest uppercase ${
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
      </button>
    </div>
  );
};
