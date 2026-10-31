import React from 'react';
import { Team, Player } from '../types/game';
import { RoleIllustration, FourPointStar } from './RoleIllustrations';
import { Trophy, RefreshCw, Users, Shield } from 'lucide-react';
import { sounds } from '../utils/audio';
import { PersonAvatar } from './PersonAvatar';

interface Props {
  winner: Team;
  players: Player[];
  onRestart: () => void;
  isHost?: boolean;
}

export const GameOverView: React.FC<Props> = ({ winner, players, onRestart, isHost }) => {
  const isSheepWin = winner === 'OVELHAS';

  return (
    <div className="flex-1 flex flex-col lg:grid lg:grid-cols-12 lg:gap-6 lg:items-center justify-between p-2 sm:p-4 space-y-3 lg:space-y-0 animate-fadeIn select-none min-h-0">
      {/* Coluna Esquerda no Desktop: Cabeçalho de Vitória + Ilustração + Botão Jogar Novamente */}
      <div className="lg:col-span-5 flex flex-col items-center justify-center space-y-3">
        {/* Victory Header */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white rounded-full text-[10px] font-mono uppercase tracking-widest">
            <Trophy size={12} />
            <span>Fim de Jogo</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-black">
            {isSheepWin ? 'VITÓRIA DAS OVELHAS! 🐑' : 'VITÓRIA DOS SOLDADOS! 🗡️'}
          </h2>
          <p className="text-xs font-mono text-neutral-600 max-w-xs mx-auto">
            {isSheepWin
              ? 'Todos os infiltrados foram descobertos ou redimidos pela oração. A paz voltou à vila!'
              : 'Os Soldados dominaram a congregação e assumiram o controle total da vila!'}
          </p>
        </div>

        {/* Victor Illustration */}
        <div className="flex justify-center items-center py-0">
          <RoleIllustration
            role={isSheepWin ? 'OVELHA' : 'SOLDADO'}
            className="w-32 h-32 sm:w-36 sm:h-36 lg:w-44 lg:h-44"
          />
        </div>

        {/* Restart Button (Visível no Desktop aqui na esquerda; também visível no Mobile abaixo da tabela) */}
        <button
          onClick={() => {
            sounds.playClick();
            onRestart();
          }}
          className="hidden lg:flex w-full py-3.5 bg-black text-white rounded-full items-center justify-center space-x-2 text-xs font-mono font-black uppercase tracking-widest active:scale-95 transition-transform shadow-md hover:bg-neutral-800 cursor-pointer"
        >
          <FourPointStar size={14} />
          <RefreshCw size={14} />
          <span>JOGAR NOVAMENTE</span>
          <FourPointStar size={14} />
        </button>
      </div>

      {/* Coluna Direita no Desktop: Tabela de Identidades Reveladas */}
      <div className="lg:col-span-7 flex-1 flex flex-col justify-center space-y-2 min-h-0">
        <span className="text-[10px] font-mono font-bold uppercase text-neutral-600 block px-1">
          Identidades Reveladas de Todos os Membros:
        </span>
        <div className="border-2 border-black rounded-2xl overflow-y-auto max-h-48 lg:max-h-[340px] p-1 bg-neutral-50 text-xs font-mono">
          <table className="w-full text-left">
            <thead className="bg-black text-white text-[9px] uppercase tracking-wider">
              <tr>
                <th className="p-1.5">Jogador</th>
                <th className="p-1.5">Papel</th>
                <th className="p-1.5">Status</th>
                <th className="p-1.5">Obs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20">
              {players.map(p => (
                <tr key={p.id} className={p.team === 'SOLDADOS' ? 'bg-red-50/50' : ''}>
                  <td className="p-1.5 font-bold truncate flex items-center gap-1.5 min-w-0">
                    <PersonAvatar
                      avatar={p.avatar}
                      color={p.color || '#F59E0B'}
                      seed={p.name}
                      size={20}
                      className="border border-black/30 shrink-0"
                    />
                    <span className="truncate">{p.name}</span>
                  </td>
                  <td className="p-1.5">
                    <span className="font-bold">{p.role}</span>
                  </td>
                  <td className="p-1.5">
                    <span className={p.isAlive ? 'text-green-700 font-bold' : 'text-neutral-500'}>
                      {p.isAlive ? 'Vivo' : 'Eliminado'}
                    </span>
                  </td>
                  <td className="p-1.5 text-[10px]">
                    {p.converted && (
                      <span className="bg-yellow-100 text-yellow-900 px-1 py-0.5 rounded font-bold">
                        Convertido ✨
                      </span>
                    )}
                    {p.prayersReceived > 0 && !p.converted && (
                      <span className="text-neutral-500">{p.prayersReceived}🙏</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Restart Button Mobile */}
        <button
          onClick={() => {
            sounds.playClick();
            onRestart();
          }}
          className="lg:hidden w-full py-3.5 bg-black text-white rounded-full flex items-center justify-center space-x-2 text-xs font-mono font-black uppercase tracking-widest active:scale-95 transition-transform shadow-md hover:bg-neutral-800 cursor-pointer"
        >
          <FourPointStar size={14} />
          <RefreshCw size={14} />
          <span>JOGAR NOVAMENTE</span>
          <FourPointStar size={14} />
        </button>
      </div>
    </div>
  );
};
