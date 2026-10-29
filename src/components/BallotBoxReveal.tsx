import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { sounds } from '../utils/audio';
import { Scroll, Sparkles, CheckCircle2, UserX, Ban } from 'lucide-react';
import { Player, GameLog } from '../types/game';
import { PersonAvatar } from './PersonAvatar';

export function findEliminatedTribunalPlayer(
  players: Player[],
  lastLog?: GameLog | { text?: string; type?: string }
): Player | null {
  if (!lastLog?.text) return null;
  const text = lastLog.text;
  if (
    text.includes('sem veredito') ||
    text.includes('Ninguém foi') ||
    text.includes('sem consenso')
  ) {
    return null;
  }

  // Procura entre os jogadores mortos cujo nome consta na sentença do tribunal
  const deadPlayers = players.filter(p => !p.isAlive);
  for (const p of deadPlayers) {
    if (p.name && text.includes(p.name)) {
      return p;
    }
  }
  return null;
}

interface ExiledPlayerAvatarVerdictProps {
  player: Player;
  compact?: boolean;
}

export const ExiledPlayerAvatarVerdict: React.FC<ExiledPlayerAvatarVerdictProps> = ({
  player,
  compact = false,
}) => {
  const avatarSize = compact ? 64 : 88;
  const playerColor = player.color || '#F59E0B';

  return (
    <div
      className={`flex flex-col items-center justify-center select-none ${
        compact ? 'py-1.5 space-y-1.5' : 'py-2 space-y-2.5'
      }`}
    >
      <div className="relative flex items-center justify-center">
        {/* Onda de choque vermelha de banimento */}
        <motion.div
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: [0.85, 1.55], opacity: [0.75, 0] }}
          transition={{
            delay: 0.45,
            duration: 1.1,
            repeat: Infinity,
            repeatDelay: 1.6,
            ease: 'easeOut',
          }}
          className="absolute inset-0 rounded-full border-2 border-red-600 pointer-events-none"
        />

        {/* Avatar do jogador sofrendo animação dramática de Fade-Out e dessaturação */}
        <motion.div
          initial={{ opacity: 1, scale: 1, filter: 'grayscale(0%) brightness(1)' }}
          animate={{
            opacity: [1, 0.92, 0.26],
            scale: [1, 1.06, 0.9],
            filter: [
              'grayscale(0%) brightness(1)',
              'grayscale(65%) brightness(0.85)',
              'grayscale(100%) brightness(0.65)',
            ],
          }}
          transition={{
            duration: 1.45,
            times: [0, 0.35, 1],
            ease: 'easeInOut',
          }}
          className="relative rounded-full p-1 border-3 shadow-lg bg-white"
          style={{ borderColor: playerColor }}
        >
          <PersonAvatar
            avatar={player.avatar}
            color={playerColor}
            seed={player.name}
            size={avatarSize}
            className="border-2 border-black"
          />
        </motion.div>

        {/* Tarja diagonal de exclusão sobre o avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 1.6, rotate: -25 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{
            delay: 0.42,
            type: 'spring',
            stiffness: 300,
            damping: 18,
          }}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div className="w-full h-full rounded-full border-3 border-red-600/90 bg-red-950/25 flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.45)]">
            <Ban
              size={compact ? 42 : 56}
              strokeWidth={2.5}
              className="text-red-600 drop-shadow-[0_2px_6px_rgba(0,0,0,0.65)]"
            />
          </div>
        </motion.div>

        {/* Ícone de Exclusão (UserX) cravado no canto inferior direito */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -35 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{
            delay: 0.6,
            type: 'spring',
            stiffness: 340,
            damping: 16,
          }}
          className={`absolute -bottom-1 -right-1 rounded-full bg-red-600 text-white border-2 border-black flex items-center justify-center shadow-md ${
            compact ? 'w-7 h-7' : 'w-9 h-9'
          }`}
          title="Jogador Eliminado no Tribunal"
        >
          <UserX size={compact ? 14 : 18} strokeWidth={2.5} />
        </motion.div>
      </div>

      {/* Nome do jogador riscado + Selo de Exilado */}
      <div className="flex flex-col items-center space-y-1">
        <div className="relative inline-flex items-center gap-1.5 px-2.5 py-0.5">
          <span
            className="w-2.5 h-2.5 rounded-full border border-black shrink-0 opacity-60"
            style={{ backgroundColor: playerColor }}
          />
          <motion.span
            initial={{ opacity: 1 }}
            animate={{ opacity: 0.55 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className={`font-mono font-black uppercase tracking-wider text-neutral-800 ${
              compact ? 'text-xs' : 'text-sm sm:text-base'
            }`}
          >
            {player.name}
          </motion.span>
          {/* Linha animada riscando o nome */}
          <motion.span
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 0.55, duration: 0.45, ease: 'easeOut' }}
            className="SaveLine absolute left-0 top-1/2 h-[2.5px] bg-red-600 -translate-y-1/2 rounded-full pointer-events-none"
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 6, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.65, duration: 0.3 }}
          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white border border-black text-[9px] font-mono font-black uppercase tracking-widest shadow-xs"
        >
          <UserX size={11} />
          <span>Exilado pelo Tribunal</span>
        </motion.div>
      </div>
    </div>
  );
};

interface BallotBoxRevealProps {
  dayNumber: number;
  logText: string;
  eliminatedPlayer?: Player | null;
  onComplete: () => void;
  autoCloseDelay?: number;
}

export const BallotBoxReveal: React.FC<BallotBoxRevealProps> = ({
  dayNumber,
  logText,
  eliminatedPlayer,
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
      <div className="relative my-4 flex items-center justify-center w-64 h-64 z-10">
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
            <path d="M 25,165 A 75,12 0 1,0 175,165 A 75,12 0 1,0 25,165 Z" fill="#000000" opacity="0.6" stroke="none" />

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
                animate={{ y: -55, scale: 1, opacity: 1 }}
                transition={{ duration: 0.6, type: 'spring', bounce: 0.4 }}
                className="absolute left-1/2 -translate-x-1/2 -top-10 w-60 bg-neutral-100 border-3 border-black text-black rounded-2xl p-3.5 shadow-2xl z-30 font-mono text-left space-y-2"
              >
                <div className="flex items-center justify-between border-b-2 border-black/30 pb-1">
                  <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider flex items-center gap-1">
                    <Scroll size={12} />
                    Veredito Oficial
                  </span>
                  <span className="text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-bold">
                    {dayNumber}º Dia
                  </span>
                </div>

                {eliminatedPlayer && (
                  <ExiledPlayerAvatarVerdict player={eliminatedPlayer} compact={true} />
                )}

                <p className="text-xs font-bold leading-snug line-clamp-3 text-neutral-900 text-center">
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
