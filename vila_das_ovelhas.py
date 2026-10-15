"""
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
            attacked_target_id = max(target_counts, key=target_counts.get)

        # 3. Processar Oração do Evangelista e Conversão
        evangelista = next((p for p in self.players.values() if p.role == Role.EVANGELISTA and p.is_alive), None)
        if evangelista and evangelista.night_target_id:
            prayed_player = self.players.get(evangelista.night_target_id)
            if prayed_player and prayed_player.is_alive:
                prayed_player.prayers_received += 1
                self.log(f"Evangelista orou por {prayed_player.name} (Total de orações: {prayed_player.prayers_received}).")

                # Regra: 2 orações no mesmo Soldado convertem-no!
                if prayed_player.role == Role.SOLDADO and prayed_player.prayers_received >= 2 and not prayed_player.converted:
                    prayed_player.team = Team.OVELHAS
                    prayed_player.converted = True
                    results["converted_player"] = prayed_player.name
                    self.log(f"MILAGRE! {prayed_player.name} foi convertido para a equipe das Ovelhas!")

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
        voter.vote_target_id = target_id

    def resolve_day_votes(self) -> Optional[Player]:
        tallies: Dict[str, int] = {}
        for voter in self.players.values():
            if not voter.is_alive or not voter.vote_target_id:
                continue

            weight = 2 if voter.role == Role.MESTRE else 1
            tgt = voter.vote_target_id
            tallies[tgt] = tallies.get(tgt, 0) + weight

        if not tallies:
            self.log("Votação unânime em abstenção. Ninguém foi eliminado.")
            self._prepare_next_round()
            return None

        sorted_votes = sorted(tallies.items(), key=lambda x: x[1], reverse=True)
        top_target_id, top_score = sorted_votes[0]

        if len(sorted_votes) > 1 and sorted_votes[1][1] == top_score:
            self.log(f"Empate na votação com {top_score} votos. Ninguém foi eliminado!")
            self._prepare_next_round()
            return None

        executed = self.players[top_target_id]
        executed.is_alive = False
        self.log(f"Veredito: {executed.name} recebeu {top_score} votos (peso duplo se houver Mestre) e foi exilado!")

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

        if len(alive_soldiers) == 0:
            self.winner = Team.OVELHAS
            self.phase = Phase.GAME_OVER
            self.log("VITÓRIA DAS OVELHAS! Todos os infiltrados foram derrotados ou convertidos!")
            return Team.OVELHAS

        if len(alive_soldiers) >= len(alive_sheep):
            self.winner = Team.SOLDADOS
            self.phase = Phase.GAME_OVER
            self.log("VITÓRIA DOS SOLDADOS! Os infiltrados dominaram a vila!")
            return Team.SOLDADOS

        return None


if __name__ == "__main__":
    game = VilaDasOvelhasGame()
    nomes = ["Ester", "Lucas", "Mateus", "Raquel", "Davi", "Sara", "Gabriel", "Samuel"]
    for i, nome in enumerate(nomes):
        game.add_player(f"p_{i}", nome)

    game.setup_roles_and_start()

    print("\n--- JOGADORES SORTEADOS ---")
    for p in game.players.values():
        print(f"[{p.name}] -> Papel: {p.role.value} | Equipe: {p.team.value}")
