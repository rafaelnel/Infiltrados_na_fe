import React, { useState } from 'react';
import { X, Copy, Check, Download, BookOpen, Code2, ShieldAlert, Cpu } from 'lucide-react';
import { FourPointStar } from './RoleIllustrations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const PYTHON_SOURCE_CODE = `"""
VILA DAS OVELHAS (TRAIÇÃO NA FÉ) - MOTOR DE JOGO EM PYTHON
===========================================================
Desenvolvido para jogos de dedução social com facções assimétricas:
Soldados (Máfia informada) vs Ovelhas (Aldeões com papéis especiais).
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import List, Dict, Optional, Tuple
import random


class Role(str, Enum):
    SOLDADO = "SOLDADO"
    OVELHA = "OVELHA"
    PASTOR = "PASTOR"
    EVANGELISTA = "EVANGELISTA"
    APOSTOLO = "APOSTOLO"
    PROFETA = "PROFETA"
    MESTRE = "MESTRE"


class Team(str, Enum):
    SOLDADOS = "SOLDADOS"
    OVELHAS = "OVELHAS"


class Phase(str, Enum):
    LOBBY = "LOBBY"
    NIGHT = "NIGHT"
    DAY_ANNOUNCEMENT = "DAY_ANNOUNCEMENT"
    DAY_DISCUSSION = "DAY_DISCUSSION"
    DAY_VOTING = "DAY_VOTING"
    DAY_RESULT = "DAY_RESULT"
    GAME_OVER = "GAME_OVER"


@dataclass
class Player:
    id: str
    name: str
    role: Role
    team: Team
    is_alive: bool = True
    prayers_received: int = 0
    converted: bool = False
    is_protected: bool = False
    night_target_id: Optional[str] = None
    night_secondary_target_id: Optional[str] = None
    vote_target_id: Optional[str] = None
    inspection_result: Optional[str] = None


@dataclass
class GameConfig:
    reveal_roles_on_death: bool = True
    pastor_can_self_protect: bool = False
    require_unanimous_soldiers: bool = False


class VilaDasOvelhasGame:
    def __init__(self, config: Optional[GameConfig] = None):
        self.config = config or GameConfig()
        self.players: Dict[str, Player] = {}
        self.phase: Phase = Phase.LOBBY
        self.round_number: int = 0
        self.winner: Optional[Team] = None
        self.logs: List[str] = []

    def log(self, message: str):
        self.logs.append(f"[R{self.round_number}][{self.phase.value}] {message}")
        print(f"[LOG] {message}")

    # -------------------------------------------------------------------------
    # 1. CONFIGURAÇÃO E BALANCEAMENTO
    # -------------------------------------------------------------------------
    def add_player(self, player_id: str, name: str) -> Player:
        if self.phase != Phase.LOBBY:
            raise ValueError("Não é possível adicionar jogadores com partida em andamento.")
        player = Player(id=player_id, name=name, role=Role.OVELHA, team=Team.OVELHAS)
        self.players[player_id] = player
        return player

    def setup_roles_and_start(self):
        n = len(self.players)
        if n < 5:
            raise ValueError("Mínimo de 5 jogadores para iniciar a Vila das Ovelhas.")

        # Proporção balanceada:
        # 5-6 jogadores: 1 Soldado, 1 Pastor, 1 Evangelista, 1 Apóstolo, 1 Profeta, resto Ovelha/Mestre
        # 7-10 jogadores: 2 Soldados, 1 Pastor, 1 Evangelista, 1 Apóstolo, 1 Profeta, 1 Mestre, resto Ovelhas
        # 11-13 jogadores: 3 Soldados, 1 Pastor, 1 Evangelista, 1 Apóstolo, 1 Profeta, 1 Mestre, resto Ovelhas
        # 14+ jogadores: 4 Soldados, etc.
        soldier_count = 1
        if 7 <= n <= 10:
            soldier_count = 2
        elif 11 <= n <= 13:
            soldier_count = 3
        elif n >= 14:
            soldier_count = 4

        deck: List[Role] = [Role.SOLDADO] * soldier_count
        deck.append(Role.PASTOR)
        deck.append(Role.EVANGELISTA)
        deck.append(Role.APOSTOLO)
        deck.append(Role.PROFETA)
        if n >= 6:
            deck.append(Role.MESTRE)

        while len(deck) < n:
            deck.append(Role.OVELHA)

        random.shuffle(deck)

        for player, assigned_role in zip(self.players.values(), deck):
            player.role = assigned_role
            player.team = Team.SOLDADOS if assigned_role == Role.SOLDADO else Team.OVELHAS
            player.is_alive = True
            player.prayers_received = 0
            player.converted = False
            player.is_protected = False

        self.round_number = 1
        self.phase = Phase.NIGHT
        self.log(f"Partida iniciada com {n} jogadores! A 1ª Noite caiu sobre a Vila.")

    # -------------------------------------------------------------------------
    # 2. AÇÕES NOTURNAS INDIVIDUAIS
    # -------------------------------------------------------------------------
    def action_pastor_protect(self, pastor_id: str, target_id: str):
        pastor = self.players.get(pastor_id)
        target = self.players.get(target_id)
        if not pastor or not pastor.is_alive or pastor.role != Role.PASTOR:
            raise ValueError("Apenas o Pastor vivo pode realizar esta ação.")
        if not target or not target.is_alive:
            raise ValueError("Alvo inválido ou eliminado.")
        if not self.config.pastor_can_self_protect and pastor_id == target_id:
            raise ValueError("O Pastor não pode proteger a si mesmo nesta regra.")

        pastor.night_target_id = target_id

    def action_soldier_target(self, soldier_id: str, target_id: str):
        soldier = self.players.get(soldier_id)
        target = self.players.get(target_id)
        if not soldier or not soldier.is_alive or soldier.team != Team.SOLDADOS:
            raise ValueError("Apenas Soldados leais podem votar na vítima da noite.")
        if not target or not target.is_alive:
            raise ValueError("Alvo inválido ou eliminado.")

        soldier.night_target_id = target_id

    def action_evangelista_pray(self, evangelista_id: str, target_id: str):
        ev = self.players.get(evangelista_id)
        target = self.players.get(target_id)
        if not ev or not ev.is_alive or ev.role != Role.EVANGELISTA:
            raise ValueError("Apenas o Evangelista vivo pode orar.")
        if not target or not target.is_alive:
            raise ValueError("Alvo inválido ou eliminado.")

        ev.night_target_id = target_id

    def action_apostolo_investigate(self, apostolo_id: str, target_a_id: str, target_b_id: str):
        ap = self.players.get(apostolo_id)
        target_a = self.players.get(target_a_id)
        target_b = self.players.get(target_b_id)
        if not ap or not ap.is_alive or ap.role != Role.APOSTOLO:
            raise ValueError("Apenas o Apóstolo vivo pode investigar afinidade.")
        if not target_a or not target_b or not target_a.is_alive or not target_b.is_alive:
            raise ValueError("Ambos os alvos devem estar vivos.")
        if target_a_id == target_b_id:
            raise ValueError("O Apóstolo deve escolher dois jogadores distintos.")

        ap.night_target_id = target_a_id
        ap.night_secondary_target_id = target_b_id

    def action_profeta_investigate(self, profeta_id: str, target_id: str):
        prof = self.players.get(profeta_id)
        target = self.players.get(target_id)
        if not prof or not prof.is_alive or prof.role != Role.PROFETA:
            raise ValueError("Apenas o Profeta vivo pode receber revelação.")
        if not target or not target.is_alive:
            raise ValueError("Alvo inválido ou eliminado.")

        prof.night_target_id = target_id

    # -------------------------------------------------------------------------
    # 3. PIPELINE DE RESOLUÇÃO NOTURNA (ORDEM RIGOROSA DE PRIORIDADE)
    # -------------------------------------------------------------------------
    def resolve_night(self) -> Dict[str, any]:
        """
        Ordem de Prioridade:
        1. PASTOR: Escudo de proteção é armado primeiro.
        2. SOLDADOS: Alvo de eliminação é calculado por consenso.
        3. EVANGELISTA: Oração é contabilizada. Se 2ª oração em Soldado, CONVERSÃO ocorre!
        4. APÓSTOLO: Afinidade entre alvos é revelada com base nas equipes do momento.
        5. PROFETA: Papel exato do alvo é revelado.
        6. EXECUÇÃO DO ATAQUE: Se o alvo dos Soldados estiver protegido, ele sobrevive.
        7. VERIFICAÇÃO DE FIM DE JOGO.
        """
        results = {
            "victim_killed": None,
            "shielded_player": None,
            "converted_player": None,
            "apostolo_feedback": None,
            "profeta_feedback": None,
        }

        # 1. Identificar Protegido pelo Pastor
        pastor = next((p for p in self.players.values() if p.role == Role.PASTOR and p.is_alive), None)
        protected_id = pastor.night_target_id if pastor else None

        # 2. Identificar Alvo dos Soldados
        active_soldiers = [p for p in self.players.values() if p.team == Team.SOLDADOS and p.is_alive]
        target_counts: Dict[str, int] = {}
        for s in active_soldiers:
            if s.night_target_id:
                target_counts[s.night_target_id] = target_counts.get(s.night_target_id, 0) + 1

        attacked_target_id = None
        if target_counts:
            # Maioria simples entre os votos dos soldados
            attacked_target_id = max(target_counts, key=target_counts.get)

        # 3. Processar Oração do Evangelista e Possível Conversão
        evangelista = next((p for p in self.players.values() if p.role == Role.EVANGELISTA and p.is_alive), None)
        if evangelista and evangelista.night_target_id:
            prayed_player = self.players.get(evangelista.night_target_id)
            if prayed_player and prayed_player.is_alive:
                prayed_player.prayers_received += 1
                self.log(f"Evangelista orou por {prayed_player.name} (Total: {prayed_player.prayers_received}).")

                # Regra de ouro: 2 orações no mesmo Soldado convertem-no!
                if prayed_player.role == Role.SOLDADO and prayed_player.prayers_received >= 2 and not prayed_player.converted:
                    prayed_player.team = Team.OVELHAS
                    prayed_player.converted = True
                    results["converted_player"] = prayed_player.name
                    self.log(f"MILAGRE! {prayed_player.name} foi convertido para as Ovelhas!")

        # 4. Apóstolo Investigação
        apostolo = next((p for p in self.players.values() if p.role == Role.APOSTOLO and p.is_alive), None)
        if apostolo and apostolo.night_target_id and apostolo.night_secondary_target_id:
            t1 = self.players.get(apostolo.night_target_id)
            t2 = self.players.get(apostolo.night_secondary_target_id)
            if t1 and t2:
                same_team = (t1.team == t2.team)
                feedback = "MESMA EQUIPE" if same_team else "EQUIPES DIFERENTES"
                apostolo.inspection_result = f"{t1.name} e {t2.name} pertencem a {feedback}."
                results["apostolo_feedback"] = apostolo.inspection_result
                self.log(f"Apóstolo investigou afinidade: {apostolo.inspection_result}")

        # 5. Profeta Investigação
        profeta = next((p for p in self.players.values() if p.role == Role.PROFETA and p.is_alive), None)
        if profeta and profeta.night_target_id:
            target = self.players.get(profeta.night_target_id)
            if target:
                profeta.inspection_result = f"{target.name} é {target.role.value}."
                results["profeta_feedback"] = profeta.inspection_result
                self.log(f"Profeta recebeu revelação: {profeta.inspection_result}")

        # 6. Resolução da Morte
        if attacked_target_id:
            if attacked_target_id == protected_id:
                shielded_target = self.players[attacked_target_id]
                results["shielded_player"] = shielded_target.name
                self.log(f"O Pastor protegeu {shielded_target.name}! Nenhum óbito registrado.")
            else:
                victim = self.players[attacked_target_id]
                victim.is_alive = False
                results["victim_killed"] = victim.name
                self.log(f"Tragédia: {victim.name} ({victim.role.value}) foi assassinado na noite!")

        # Limpar alvos noturnos temporários
        for p in self.players.values():
            p.night_target_id = None
            p.night_secondary_target_id = None

        # Checar Fim de Jogo
        self.check_game_over()
        if self.winner is None:
            self.phase = Phase.DAY_DISCUSSION
        else:
            self.phase = Phase.GAME_OVER

        return results

    # -------------------------------------------------------------------------
    # 4. FASE DIURNA: VOTAÇÃO COM VOTO DUPLO DO MESTRE
    # -------------------------------------------------------------------------
    def cast_day_vote(self, voter_id: str, target_id: Optional[str]):
        voter = self.players.get(voter_id)
        if not voter or not voter.is_alive:
            raise ValueError("Apenas jogadores vivos podem votar.")
        voter.vote_target_id = target_id  # None representa abstenção

    def resolve_day_votes(self) -> Optional[Player]:
        """
        Calcula os votos ponderados:
        - Mestre: Peso 2 (voto duplo)
        - Demais Ovelhas e Soldados: Peso 1
        Em caso de empate no topo: ninguém é eliminado.
        """
        tallies: Dict[str, int] = {}
        for voter in self.players.values():
            if not voter.is_alive or not voter.vote_target_id:
                continue

            weight = 2 if voter.role == Role.MESTRE else 1
            tgt = voter.vote_target_id
            tallies[tgt] = tallies.get(tgt, 0) + weight

        # Encontrar o mais votado
        if not tallies:
            self.log("Votação unânime em abstenção. Ninguém foi eliminado.")
            self._prepare_next_round()
            return None

        sorted_votes = sorted(tallies.items(), key=lambda x: x[1], reverse=True)
        top_target_id, top_score = sorted_votes[0]

        # Verificar se houve empate
        if len(sorted_votes) > 1 and sorted_votes[1][1] == top_score:
            self.log(f"Empate na votação com {top_score} votos. Ninguém foi eliminado!")
            self._prepare_next_round()
            return None

        executed = self.players[top_target_id]
        executed.is_alive = False
        self.log(f"Veredito do Rebanho: {executed.name} recebeu {top_score} votos e foi exilado! (Papel: {executed.role.value})")

        self.check_game_over()
        self._prepare_next_round()
        return executed

    def _prepare_next_round(self):
        for p in self.players.values():
            p.vote_target_id = None
        if self.winner is None:
            self.round_number += 1
            self.phase = Phase.NIGHT

    # -------------------------------------------------------------------------
    # 5. VERIFICADORES DE FIM DE JOGO
    # -------------------------------------------------------------------------
    def check_game_over(self) -> Optional[Team]:
        alive_soldiers = [p for p in self.players.values() if p.is_alive and p.team == Team.SOLDADOS]
        alive_sheep = [p for p in self.players.values() if p.is_alive and p.team == Team.OVELHAS]

        # Condição 1: Todos os Soldados eliminados ou convertidos -> OVELHAS VENCEM
        if len(alive_soldiers) == 0:
            self.winner = Team.OVELHAS
            self.phase = Phase.GAME_OVER
            self.log("VITÓRIA DAS OVELHAS! A fé prevaleceu e todos os infiltrados foram derrotados ou convertidos!")
            return Team.OVELHAS

        # Condição 2: Soldados >= Ovelhas vivas -> SOLDADOS VENCEM
        if len(alive_soldiers) >= len(alive_sheep):
            self.winner = Team.SOLDADOS
            self.phase = Phase.GAME_OVER
            self.log("VITÓRIA DOS SOLDADOS! Os lobos assumiram o controle total da vila!")
            return Team.SOLDADOS

        return None


# =============================================================================
# EXEMPLO DE PARTIDA DE TESTE (SIMULAÇÃO COMPLETA)
# =============================================================================
if __name__ == "__main__":
    game = VilaDasOvelhasGame()
    nomes = ["Ester", "Lucas", "Mateus", "Raquel", "Davi", "Sara", "Gabriel", "Samuel"]
    for i, nome in enumerate(nomes):
        game.add_player(f"p_{i}", nome)

    game.setup_roles_and_start()

    print("\\n--- JOGADORES SORTEADOS ---")
    for p in game.players.values():
        print(f"[{p.name}] -> Papel: {p.role.value} | Equipe: {p.team.value}")
`;

export const SystemDocumentationModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'REGRAS' | 'PIPELINE' | 'PYTHON' | 'CASOS' | 'SOCKET_IO'>('REGRAS');
  const [copied, setCopied] = useState(false);
  const [copiedSocket, setCopiedSocket] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(PYTHON_SOURCE_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([PYTHON_SOURCE_CODE], { type: 'text/x-python;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'vila_das_ovelhas.py');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="bg-white border-[4px] border-black rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-neutral-50">
          <div className="flex items-center space-x-2">
            <FourPointStar size={18} className="text-black" />
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wider text-black font-sans">
              Manual do Sistema & Código Python
            </h2>
            <FourPointStar size={18} className="text-black" />
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 border-2 border-black rounded-full flex items-center justify-center hover:bg-black hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b-2 border-black bg-white overflow-x-auto no-scrollbar px-4 pt-2 gap-2 text-xs font-mono font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('REGRAS')}
            className={`px-4 py-2 rounded-t-xl border-t-2 border-x-2 border-black transition-colors flex items-center gap-1.5 ${
              activeTab === 'REGRAS' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            <BookOpen size={14} /> Regras & Balanceamento
          </button>
          <button
            onClick={() => setActiveTab('PIPELINE')}
            className={`px-4 py-2 rounded-t-xl border-t-2 border-x-2 border-black transition-colors flex items-center gap-1.5 ${
              activeTab === 'PIPELINE' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            <Cpu size={14} /> Pipeline Noturno
          </button>
          <button
            onClick={() => setActiveTab('PYTHON')}
            className={`px-4 py-2 rounded-t-xl border-t-2 border-x-2 border-black transition-colors flex items-center gap-1.5 ${
              activeTab === 'PYTHON' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            <Code2 size={14} /> Código Python
          </button>
          <button
            onClick={() => setActiveTab('CASOS')}
            className={`px-4 py-2 rounded-t-xl border-t-2 border-x-2 border-black transition-colors flex items-center gap-1.5 ${
              activeTab === 'CASOS' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            <ShieldAlert size={14} /> Casos de Borda
          </button>
          <button
            onClick={() => setActiveTab('SOCKET_IO')}
            className={`px-4 py-2 rounded-t-xl border-t-2 border-x-2 border-black transition-colors flex items-center gap-1.5 ${
              activeTab === 'SOCKET_IO' ? 'bg-black text-white' : 'bg-gray-100 text-black hover:bg-gray-200'
            }`}
          >
            <Cpu size={14} /> Rede & Socket.IO
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-sm leading-relaxed space-y-4">
          {activeTab === 'REGRAS' && (
            <div className="space-y-6 text-black">
              <section className="space-y-2">
                <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-1">
                  <span>✦</span> 1. Proporção Ideal de Jogadores (Presets de Equilíbrio)
                </h3>
                <p className="text-xs text-neutral-700">
                  Para manter a tensão equilibrada, a proporção recomendada de Soldados é entre 20% e 28% dos participantes.
                </p>
                <div className="border-2 border-black rounded-xl overflow-hidden mt-2 text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-black text-white uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-2 border-r border-white/20">Jogadores</th>
                        <th className="p-2 border-r border-white/20">Soldados</th>
                        <th className="p-2 border-r border-white/20">Especiais (Ovelhas)</th>
                        <th className="p-2">Ovelhas Comuns</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/20">
                      <tr>
                        <td className="p-2 font-bold">5 a 6</td>
                        <td className="p-2">1 Soldado</td>
                        <td className="p-2">Pastor, Evangelista, Apóstolo, Profeta</td>
                        <td className="p-2">0 a 1 (+ Mestre se 6)</td>
                      </tr>
                      <tr className="bg-neutral-50">
                        <td className="p-2 font-bold">7 a 8</td>
                        <td className="p-2">2 Soldados</td>
                        <td className="p-2">Pastor, Evangelista, Apóstolo, Profeta, Mestre</td>
                        <td className="p-2">0 a 1 Ovelha comum</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold">9 a 11</td>
                        <td className="p-2">2 a 3 Soldados</td>
                        <td className="p-2">Pastor, Evangelista, Apóstolo, Profeta, Mestre</td>
                        <td className="p-2">2 a 3 Ovelhas comuns</td>
                      </tr>
                      <tr className="bg-neutral-50">
                        <td className="p-2 font-bold">12 a 16</td>
                        <td className="p-2">3 a 4 Soldados</td>
                        <td className="p-2">Pastor, Evangelista, Apóstolo, Profeta, Mestre</td>
                        <td className="p-2">4 a 7 Ovelhas comuns</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-1">
                  <span>✦</span> 2. Condições de Vitória
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="border-2 border-black p-3 rounded-2xl bg-neutral-50">
                    <span className="font-black uppercase text-xs block mb-1">Vitória dos Soldados 🗡️</span>
                    <p className="text-xs">
                      Acontece no instante em que o número de Soldados vivos for <strong>igual ou maior</strong> ao número de Ovelhas vivas (ex: 2 Soldados e 2 Ovelhas). Os infiltrados controlam a votação e dominam a vila.
                    </p>
                  </div>
                  <div className="border-2 border-black p-3 rounded-2xl bg-neutral-50">
                    <span className="font-black uppercase text-xs block mb-1">Vitória das Ovelhas 🐑</span>
                    <p className="text-xs">
                      Acontece quando <strong>todos os Soldados</strong> tiverem sido eliminados no tribunal diurno ou <strong>convertidos</strong> pela oração do Evangelista.
                    </p>
                  </div>
                </div>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-1">
                  <span>✦</span> 3. Papéis e Habilidades Especiais
                </h3>
                <ul className="text-xs space-y-2">
                  <li><strong>• Soldado:</strong> Conspira em segredo à noite para escolher a vítima em consenso. De dia, disfarça sua índole.</li>
                  <li><strong>• Pastor:</strong> Escolhe 1 jogador por noite para defender de eliminação. <em>Restrição: Não pode proteger a mesma pessoa em duas noites consecutivas.</em></li>
                  <li><strong>• Evangelista:</strong> Ora por 1 jogador a cada noite. Requer orar DUAS vezes no mesmo Soldado para convertê-lo. Ao ser convertido, o Soldado perde o poder de matar e torna-se uma Ovelha simples. <em>Limite: Apenas 1 única conversão bem-sucedida por partida.</em></li>
                  <li><strong>• Apóstolo:</strong> Escolhe 2 jogadores por noite e descobre se pertencem à MESMA equipe ou a EQUIPES DIFERENTES.</li>
                  <li><strong>• Profeta:</strong> Investiga 1 jogador por noite. <em>Retorno: Revela APENAS a equipe do alvo ("Soldado" ou "Ovelha"), sem revelar a função específica.</em></li>
                  <li><strong>• Mestre:</strong> Pode usar voto duplo durante as votações do dia. <em>Restrição: O voto duplo é secreto e pode ser ativado no máximo 2 vezes por partida.</em></li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="text-base font-black uppercase tracking-wider flex items-center gap-2 border-b-2 border-black pb-1">
                  <span>✦</span> 4. Modificadores e Cards Especiais (Sorteio Secundário)
                </h3>
                <ul className="text-xs space-y-2">
                  <li><strong>• Falso Profeta (Soldados):</strong> Sorteado para 1 Soldado. Habilidade Passiva: Na PRIMEIRA VEZ que for investigado (Profeta ou Apóstolo), sua equipe aparecerá como "Ovelha". A partir da segunda investigação, revelará "Soldado".</li>
                  <li><strong>• Espião (Ovelhas):</strong> Permite espionar 1 jogador a qualquer momento da partida para descobrir sua função exata (uso único, 1 vez por partida).</li>
                  <li><strong>• Anjo (Ovelhas):</strong> Pode se sacrificar durante a noite para salvar a pessoa que seria morta pelos Soldados (uso único, 1 vez por partida).</li>
                  <li><em>🔒 Validação Obrigatória: O modificador Anjo e o modificador Espião NUNCA podem ser atribuídos ao mesmo jogador na mesma partida.</em></li>
                </ul>
              </section>
            </div>
          )}

          {activeTab === 'PIPELINE' && (
            <div className="space-y-4 text-black text-xs">
              <h3 className="text-base font-black uppercase tracking-wider border-b-2 border-black pb-1">
                Pipeline de Execução Noturna (Ordem Rigorosa)
              </h3>
              <p>
                Para eliminar paradoxos e ambiguidades nas regras de dedução social, a transição noturna segue estritamente as seguintes 7 etapas ordenadas:
              </p>

              <div className="space-y-3 font-mono">
                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-bold uppercase text-black block mb-0.5">Etapa 1: Pastor (Escudo da Fé)</span>
                  <p>O Pastor seleciona 1 alvo para proteger. O escudo é registrado preventivamente no estado da rodada.</p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-bold uppercase text-black block mb-0.5">Etapa 2: Soldados (Alvo de Ataque)</span>
                  <p>Os Soldados vivos votam em um alvo. O alvo majoritário é marcado para eliminação.</p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-bold uppercase text-black block mb-0.5">Etapa 3: Evangelista (Oração & Conversão)</span>
                  <p>
                    O Evangelista ora por 1 jogador. O contador de orações desse alvo é incrementado. Se o alvo for um Soldado e atingir 2 orações, ele é <strong>imediatamente convertido</strong> para a equipe das Ovelhas!
                  </p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-bold uppercase text-black block mb-0.5">Etapa 4: Apóstolo (Discernimento)</span>
                  <p>
                    O Apóstolo compara 2 alvos vivos. A afinidade é calculada considerando o estado das equipes naquele momento (se um Soldado acabou de ser convertido na Etapa 3, ele já conta como Ovelha!).
                  </p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-bold uppercase text-black block mb-0.5">Etapa 5: Profeta (Revelação)</span>
                  <p>O Profeta investiga 1 jogador e recebe o papel exato do jogador investigado.</p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-bold uppercase text-black block mb-0.5">Etapa 6: Resolução de Óbito</span>
                  <p>
                    O alvo atacado pelos Soldados é verificado: se for o protegido do Pastor, ele sobrevive (o Pastor salvou a vida). Caso contrário, o jogador falece.
                  </p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-bold uppercase text-black block mb-0.5">Etapa 7: Verificação de Vitória</span>
                  <p>
                    Checa se todos os Soldados morreram/foram convertidos (Vitória Ovelhas) ou se Soldados &ge; Ovelhas (Vitória Soldados). Se ninguém venceu, amanhece o dia!
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'PYTHON' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-black">
                  Script Python Completo e Autônomo (vila_das_ovelhas.py)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="border-2 border-black px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 hover:bg-black hover:text-white transition-colors"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="bg-black text-white px-3 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 hover:bg-neutral-800 transition-colors"
                  >
                    <Download size={14} /> Baixar .py
                  </button>
                </div>
              </div>
              <pre className="bg-neutral-900 text-neutral-100 p-4 rounded-2xl overflow-x-auto text-[11px] font-mono border-2 border-black max-h-[450px]">
                {PYTHON_SOURCE_CODE}
              </pre>
            </div>
          )}

          {activeTab === 'CASOS' && (
            <div className="space-y-4 text-black text-xs">
              <h3 className="text-base font-black uppercase tracking-wider border-b-2 border-black pb-1">
                Perguntas Frequentes & Resolução de Casos de Borda
              </h3>

              <div className="space-y-3">
                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-black text-xs block mb-1">
                    1. E se o último Soldado for convertido pelo Evangelista?
                  </span>
                  <p>
                    A conversão é concluída na Etapa 3 do pipeline. Como não restam mais Soldados leais, as Ovelhas vencem imediatamente! O soldado convertido vence junto com as Ovelhas.
                  </p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-black text-xs block mb-1">
                    2. O que acontece se o Pastor for assassinado pelos Soldados na mesma noite?
                  </span>
                  <p>
                    O escudo do Pastor foi levantado no início da noite (Etapa 1). Portanto, a pessoa que ele protegeu continua salva, mesmo que o Pastor seja morto ou não possa agir em rodadas futuras.
                  </p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-black text-xs block mb-1">
                    3. O que acontece se o Evangelista orar por alguém que morre na mesma noite?
                  </span>
                  <p>
                    A oração é registrada, mas como o jogador falece na Etapa 6, a conversão não se aplica a jogadores mortos.
                  </p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-black text-xs block mb-1">
                    4. Como funciona o empate na votação do Dia com o voto do Mestre?
                  </span>
                  <p>
                    O voto do Mestre conta exatamente como 2 votos no somatório final. Se mesmo assim houver empate na pontuação máxima entre dois jogadores, o tribunal da vila não chega a um consenso e ninguém é eliminado naquele dia.
                  </p>
                </div>

                <div className="border-2 border-black p-3 rounded-xl bg-neutral-50">
                  <span className="font-black text-xs block mb-1">
                    5. O Apóstolo descobre papéis específicos?
                  </span>
                  <p>
                    Não! O Apóstolo só recebe &ldquo;Mesma Equipe&rdquo; ou &ldquo;Equipes Diferentes&rdquo;. Por exemplo, comparar um Pastor e um Profeta retorna &ldquo;Mesma Equipe&rdquo;, sem revelar quem é quem.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'SOCKET_IO' && (
            <div className="space-y-5 text-black text-xs">
              <div className="border-b-2 border-black pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black uppercase tracking-wider font-sans">
                    Arquitetura de Rede & Lobby (Node.js + Socket.IO)
                  </h3>
                  <p className="text-[11px] text-neutral-600 font-mono mt-0.5">
                    Sistema de salas em memória, código de 5 caracteres (ex: X7B2K), controle de host e sincronização.
                  </p>
                </div>
              </div>

              {/* Terminal Quickstart */}
              <div className="border-2 border-black p-3.5 rounded-2xl bg-neutral-900 text-neutral-100 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-white block">
                  💻 Como Testar Localmente no Terminal (Passo a Passo):
                </span>
                <ol className="list-decimal list-inside space-y-1 text-[11px] font-mono text-neutral-300">
                  <li>Crie uma pasta e inicialize o projeto: <code className="bg-black text-white px-1 py-0.5 rounded">npm init -y</code></li>
                  <li>Instale as bibliotecas necessárias: <code className="bg-black text-white px-1 py-0.5 rounded">npm install express socket.io</code></li>
                  <li>Crie o arquivo <code className="bg-black text-white px-1 py-0.5 rounded">server.js</code> com o código do Back-end abaixo.</li>
                  <li>Execute o servidor: <code className="bg-black text-white px-1 py-0.5 rounded">node server.js</code></li>
                  <li>Abra <code className="bg-black text-white px-1 py-0.5 rounded">http://localhost:3000</code> em 2 abas diferentes para testar a comunicação em tempo real!</li>
                </ol>
              </div>

              {/* Eventos Socket.IO */}
              <div className="border-2 border-black p-3 rounded-2xl bg-neutral-50 space-y-2">
                <span className="font-black uppercase text-xs block text-black">
                  📡 Eventos Implementados no Socket.IO:
                </span>
                <ul className="space-y-1.5 text-[11px] font-mono">
                  <li><strong>• create-room:</strong> Cria sala com ID de 5 letras (ex: X7B2K), define o socket como host e retorna o código.</li>
                  <li><strong>• join-room:</strong> Valida se a sala existe, se não está cheia e se o jogo não iniciou. Coloca o jogador no canal do socket.</li>
                  <li><strong>• start-game:</strong> Autorizado exclusivamente para o Host; altera estado da sala para 'playing' e notifica todos via <code className="bg-neutral-200 px-1 rounded">game-started</code>.</li>
                  <li><strong>• leave-room / disconnect:</strong> Remove o jogador, deleta salas vazias e transfere o host para o próximo caso o criador saia.</li>
                </ul>
              </div>

              {/* Back-end code card */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase text-[11px] text-black">
                    1. Back-end: server.js (Node.js + Socket.IO)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    Disponível no projeto como /socket_lobby_example.js
                  </span>
                </div>
                <div className="border-2 border-black rounded-xl p-3 bg-neutral-900 text-neutral-200 font-mono text-[10.5px] max-h-56 overflow-y-auto">
                  <pre>{`// server.js - Gerenciador de Salas Socket.IO
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Estrutura de salas na memória
const rooms = {};

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  // Criar sala
  socket.on('create-room', (data, callback) => {
    let roomCode = generateRoomCode();
    while (rooms[roomCode]) roomCode = generateRoomCode();

    rooms[roomCode] = {
      code: roomCode,
      hostId: socket.id,
      state: 'waiting',
      maxPlayers: 16,
      players: [{ socketId: socket.id, name: data.playerName || 'Anfitrião', isHost: true }]
    };

    socket.join(roomCode);
    const res = { success: true, roomCode, room: rooms[roomCode] };
    socket.emit('room-created', res);
    if (callback) callback(res);
  });

  // Entrar em sala
  socket.on('join-room', (data, callback) => {
    const code = (data.roomCode || '').toUpperCase().trim();
    const room = rooms[code];

    if (!room) return socket.emit('join-error', { message: 'Sala não encontrada.' });
    if (room.state !== 'waiting') return socket.emit('join-error', { message: 'Partida em andamento.' });
    if (room.players.length >= room.maxPlayers) return socket.emit('join-error', { message: 'Sala cheia.' });

    const newPlayer = { socketId: socket.id, name: data.playerName || 'Irmão', isHost: false };
    room.players.push(newPlayer);
    socket.join(code);

    socket.emit('room-joined', { success: true, roomCode: code, room });
    io.to(code).emit('player-joined', { newPlayer, players: room.players });
  });

  // Iniciar partida (Host)
  socket.on('start-game', (data) => {
    const room = rooms[data.roomCode];
    if (room && room.hostId === socket.id) {
      room.state = 'playing';
      io.to(data.roomCode).emit('game-started', { room });
    }
  });

  // Desconexão
  socket.on('disconnect', () => {
    for (const code in rooms) {
      const room = rooms[code];
      const idx = room.players.findIndex(p => p.socketId === socket.id);
      if (idx !== -1) {
        room.players.splice(idx, 1);
        if (room.players.length === 0) {
          delete rooms[code];
        } else {
          if (room.hostId === socket.id) {
            room.hostId = room.players[0].socketId;
            room.players[0].isHost = true;
          }
          io.to(code).emit('player-left', { players: room.players, newHostId: room.hostId });
        }
        break;
      }
    }
  });
});

server.listen(3000, () => console.log('Servidor rodando na porta 3000'));`}</pre>
                </div>
              </div>

              {/* Front-end client card */}
              <div className="space-y-2">
                <span className="font-bold uppercase text-[11px] text-black block">
                  2. Front-end: index.html (Cliente Socket.IO com Menus)
                </span>
                <p className="text-[11px] text-neutral-600">
                  O arquivo completo está salvo na raiz como <code className="bg-neutral-200 px-1 rounded">socket_lobby_client_example.html</code>. Ele contém os menus para criar partida, entrar por código de 5 letras, lista de jogadores sincronizada em tempo real e tela de início de jogo.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t-2 border-black bg-neutral-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-black text-white rounded-full font-black text-xs uppercase tracking-wider hover:bg-neutral-800 transition-colors"
          >
            Fechar Manual
          </button>
        </div>
      </div>
    </div>
  );
};
