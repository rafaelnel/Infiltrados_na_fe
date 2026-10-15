import {
  Player,
  Role,
  Team,
  Phase,
  ChatMessage,
  GameLog,
  GameConfig,
  ModifiersConfig,
} from '../types/game';

const BOT_NAMES = [
  'Gabriel',
  'Mateus',
  'Rebeca',
  'Davi',
  'Sara',
  'Lucas',
  'Ester',
  'Samuel',
  'Isaque',
  'Raquel',
  'Noé',
  'Miriam',
];

export interface LocalGameState {
  phase: Phase;
  dayNumber: number;
  players: Player[];
  messages: ChatMessage[];
  logs: GameLog[];
  winner: Team | null;
  config: GameConfig;
  currentPlayerIndex: number; // for Pass & Play
  successfulConversionsCount: number; // Limite: apenas 1 conversão bem-sucedida por partida
}

export const DEFAULT_MODIFIERS_CONFIG: ModifiersConfig = {
  falsoProfeta: true,
  espiao: true,
  anjo: true,
};

export function createInitialLocalGame(
  humanPlayerName: string = 'Você',
  totalPlayers: number = 7
): LocalGameState {
  const config: GameConfig = {
    revealRolesOnDeath: false,
    pastorCanSelfProtect: true,
    discussionTimeSeconds: 120, // 2 minutos padrão para a assembleia
    votingTimeSeconds: 60,
    nightTimeSeconds: 60,
    modifiersConfig: { ...DEFAULT_MODIFIERS_CONFIG },
  };

  const players: Player[] = [];

  // Human player
  players.push({
    id: 'p_human',
    name: humanPlayerName.trim() || 'Você',
    role: 'OVELHA',
    team: 'OVELHAS',
    isAlive: true,
    isHost: true,
    isBot: false,
    prayersReceived: 0,
    converted: false,
    hasActedTonight: false,
    voteTargetId: null,
    nightActionTargetId: null,
    masterDoubleVotesRemaining: 0,
    usedDoubleVoteThisRound: false,
    modifier: null,
    investigationCount: 0,
    spyUsed: false,
    angelUsed: false,
    angelSacrificeTonight: false,
  });

  // Bots
  for (let i = 1; i < totalPlayers; i++) {
    const name = BOT_NAMES[i - 1] || `Irmão ${i + 1}`;
    players.push({
      id: `p_bot_${i}`,
      name,
      role: 'OVELHA',
      team: 'OVELHAS',
      isAlive: true,
      isHost: false,
      isBot: true,
      prayersReceived: 0,
      converted: false,
      hasActedTonight: false,
      voteTargetId: null,
      nightActionTargetId: null,
      masterDoubleVotesRemaining: 0,
      usedDoubleVoteThisRound: false,
      modifier: null,
      investigationCount: 0,
      spyUsed: false,
      angelUsed: false,
      angelSacrificeTonight: false,
    });
  }

  // Shuffle roles & assign modifiers
  distributeLocalRoles(players, config.modifiersConfig);

  return {
    phase: 'NIGHT',
    dayNumber: 1,
    players,
    messages: [
      {
        id: 'msg_welcome',
        senderId: 'SYSTEM',
        senderName: 'Vila',
        text: 'A 1ª Noite caiu sobre a Vila das Ovelhas. Mantenha seu papel e cartas especiais em segredo!',
        timestamp: Date.now(),
        channel: 'PUBLIC',
      },
    ],
    logs: [
      {
        id: 'log_start',
        phase: 'NIGHT',
        dayNumber: 1,
        text: `Partida iniciada com ${players.length} membros. Os lobos tramam nas sombras.`,
        timestamp: Date.now(),
        type: 'INFO',
      },
    ],
    winner: null,
    config,
    currentPlayerIndex: 0,
    successfulConversionsCount: 0,
  };
}

export function createLocalGameFromRoster(
  roster: string[],
  customDeck?: Role[],
  customDiscussionSeconds: number = 120,
  customModifiersConfig?: ModifiersConfig
): LocalGameState {
  const modifiersConfig: ModifiersConfig = customModifiersConfig
    ? { ...customModifiersConfig }
    : { ...DEFAULT_MODIFIERS_CONFIG };

  const config: GameConfig = {
    revealRolesOnDeath: false,
    pastorCanSelfProtect: true,
    discussionTimeSeconds: customDiscussionSeconds || 120,
    votingTimeSeconds: 60,
    nightTimeSeconds: 60,
    modifiersConfig,
  };

  const players: Player[] = roster.map((name, idx) => ({
    id: `local_p_${idx}_${Math.random().toString(36).substring(2, 6)}`,
    name: name.trim() || `Jogador ${idx + 1}`,
    role: 'OVELHA',
    team: 'OVELHAS',
    isAlive: true,
    isHost: idx === 0,
    isBot: false,
    prayersReceived: 0,
    converted: false,
    hasActedTonight: false,
    voteTargetId: null,
    nightActionTargetId: null,
    masterDoubleVotesRemaining: 0,
    usedDoubleVoteThisRound: false,
    modifier: null,
    investigationCount: 0,
    spyUsed: false,
    angelUsed: false,
    angelSacrificeTonight: false,
  }));

  if (customDeck && customDeck.length === players.length) {
    const shuffled = [...customDeck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    players.forEach((p, idx) => {
      const r = shuffled[idx];
      p.role = r;
      p.team = r === 'SOLDADO' ? 'SOLDADOS' : 'OVELHAS';
      p.masterDoubleVotesRemaining = r === 'MESTRE' ? 2 : 0;
    });
  } else {
    distributeLocalRoles(players, modifiersConfig);
  }

  // Sorteio secundário de modificadores especiais
  distributeLocalModifiers(players, modifiersConfig);

  return {
    phase: 'NIGHT',
    dayNumber: 1,
    players,
    messages: [
      {
        id: 'msg_welcome_' + Date.now(),
        senderId: 'SYSTEM',
        senderName: 'Vila',
        text: 'A 1ª Noite caiu sobre a Vila! Mantenham suas telas em segredo e passem o aparelho conforme instruído.',
        timestamp: Date.now(),
        channel: 'PUBLIC',
      },
    ],
    logs: [
      {
        id: 'log_start_' + Date.now(),
        phase: 'NIGHT',
        dayNumber: 1,
        text: `Partida local iniciada com ${players.length} membros reunidos. Modificadores ativados: ${
          [
            modifiersConfig.falsoProfeta ? 'Falso Profeta' : null,
            modifiersConfig.espiao ? 'Espião' : null,
            modifiersConfig.anjo ? 'Anjo' : null,
          ]
            .filter(Boolean)
            .join(', ') || 'Nenhum'
        }.`,
        timestamp: Date.now(),
        type: 'INFO',
      },
    ],
    winner: null,
    config,
    currentPlayerIndex: 0,
    successfulConversionsCount: 0,
  };
}

export function distributeLocalRoles(players: Player[], modifiersConfig?: ModifiersConfig) {
  const n = players.length;
  let soldierCount = 1;
  if (n >= 7 && n <= 10) soldierCount = 2;
  else if (n >= 11 && n <= 13) soldierCount = 3;
  else if (n >= 14) soldierCount = 4;

  const deck: Role[] = [];
  for (let i = 0; i < soldierCount; i++) deck.push('SOLDADO');
  deck.push('PASTOR');
  deck.push('EVANGELISTA');
  deck.push('APOSTOLO');
  deck.push('PROFETA');
  if (n >= 6) deck.push('MESTRE');

  while (deck.length < n) {
    deck.push('OVELHA');
  }

  // Shuffle roles
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  players.forEach((p, idx) => {
    const r = deck[idx];
    p.role = r;
    p.team = r === 'SOLDADO' ? 'SOLDADOS' : 'OVELHAS';
    p.isAlive = true;
    p.prayersReceived = 0;
    p.converted = false;
    p.hasActedTonight = false;
    p.voteTargetId = null;
    p.nightActionTargetId = null;
    p.nightActionSecondaryId = null;
    p.lastInspectionResult = null;
    p.lastProtectedTargetId = null;
    p.masterDoubleVotesRemaining = r === 'MESTRE' ? 2 : 0;
    p.usedDoubleVoteThisRound = false;
    p.modifier = null;
    p.investigationCount = 0;
    p.spyUsed = false;
    p.spyResult = null;
    p.angelUsed = false;
    p.angelSacrificeTonight = false;
  });

  if (modifiersConfig) {
    distributeLocalModifiers(players, modifiersConfig);
  }
}

// ============================================================================
// MECÂNICA DE MODIFICADORES / CARDS ESPECIAIS (SORTEIO SECUNDÁRIO)
// ============================================================================
export function distributeLocalModifiers(players: Player[], config: ModifiersConfig) {
  // Limpar modificadores existentes
  players.forEach(p => {
    p.modifier = null;
    p.investigationCount = 0;
    p.spyUsed = false;
    p.spyResult = null;
    p.angelUsed = false;
    p.angelSacrificeTonight = false;
  });

  // A) MODIFICADORES DO TIME DOS SOLDADOS (LOBOS):
  // Falso Profeta: Sorteado aleatoriamente para 1 jogador pertencente ao time dos Soldados
  if (config.falsoProfeta) {
    const soldiers = players.filter(p => p.team === 'SOLDADOS');
    if (soldiers.length > 0) {
      const chosenSoldier = soldiers[Math.floor(Math.random() * soldiers.length)];
      chosenSoldier.modifier = 'FALSO_PROFETA';
      chosenSoldier.investigationCount = 0;
    }
  }

  // B) MODIFICADORES DO TIME DAS OVELHAS:
  // Sorteie de forma independente até 2 modificadores especiais exclusivamente entre os jogadores do time das Ovelhas:
  // Espião (uso único) e Anjo (uso único)
  // VALIDAÇÃO OBRIGATÓRIA: Anjo e Espião NUNCA podem ser atribuídos ao mesmo jogador na mesma partida!
  const sheepPlayers = players.filter(p => p.team === 'OVELHAS');
  const availableSheep = [...sheepPlayers].sort(() => Math.random() - 0.5);

  if (config.espiao && availableSheep.length > 0) {
    const spyRecipient = availableSheep.pop()!;
    spyRecipient.modifier = 'ESPIAO';
    spyRecipient.spyUsed = false;
  }

  if (config.anjo && availableSheep.length > 0) {
    const angelRecipient = availableSheep.pop()!;
    angelRecipient.modifier = 'ANJO';
    angelRecipient.angelUsed = false;
    angelRecipient.angelSacrificeTonight = false;
  }
}

export function simulateLocalBotsNight(state: LocalGameState) {
  const aliveBots = state.players.filter(p => p.isBot && p.isAlive);
  const alivePlayers = state.players.filter(p => p.isAlive);

  for (const bot of aliveBots) {
    if (bot.role === 'SOLDADO' && !bot.converted) {
      const targets = alivePlayers.filter(p => p.team !== 'SOLDADOS');
      if (targets.length > 0) {
        bot.nightActionTargetId = targets[Math.floor(Math.random() * targets.length)].id;
        bot.hasActedTonight = true;
      }
    } else if (bot.role === 'PASTOR') {
      // Restrição: Não pode proteger a mesma pessoa em duas noites consecutivas
      const targets = alivePlayers.filter(p => {
        if (!state.config.pastorCanSelfProtect && p.id === bot.id) return false;
        if (bot.lastProtectedTargetId && p.id === bot.lastProtectedTargetId) return false;
        return true;
      });
      const validTargets = targets.length > 0 ? targets : alivePlayers;
      bot.nightActionTargetId = validTargets[Math.floor(Math.random() * validTargets.length)].id;
      bot.hasActedTonight = true;
    } else if (bot.role === 'EVANGELISTA') {
      const targets = alivePlayers.filter(p => p.id !== bot.id);
      if (targets.length > 0) {
        bot.nightActionTargetId = targets[Math.floor(Math.random() * targets.length)].id;
        bot.hasActedTonight = true;
      }
    } else if (bot.role === 'APOSTOLO') {
      const targets = alivePlayers.filter(p => p.id !== bot.id);
      if (targets.length >= 2) {
        bot.nightActionTargetId = targets[0].id;
        bot.nightActionSecondaryId = targets[1].id;
        bot.hasActedTonight = true;
      }
    } else if (bot.role === 'PROFETA') {
      const targets = alivePlayers.filter(p => p.id !== bot.id);
      if (targets.length > 0) {
        bot.nightActionTargetId = targets[Math.floor(Math.random() * targets.length)].id;
        bot.hasActedTonight = true;
      }
    }
  }
}

export function resolveLocalNight(state: LocalGameState): LocalGameState {
  const next = { ...state };
  next.logs = [...state.logs];
  next.messages = [...state.messages];

  // 1. Pastor shield com restrição de não repetir alvo da noite anterior
  const pastor = next.players.find(p => p.role === 'PASTOR' && p.isAlive);
  const protectedId = pastor ? pastor.nightActionTargetId : null;
  if (pastor) {
    pastor.lastProtectedTargetId = protectedId;
  }

  // 2. Soldados kill target
  // Regra: "Quando os soldados forem dois ou mais cada um seleciona um nome, se forem nomes iguais a pessoa morre. Se não, entre os dois escolhidos será sorteado o que morrerá."
  const soldiers = next.players.filter(p => p.role === 'SOLDADO' && p.isAlive && !p.converted);
  let targetId: string | null = null;
  if (soldiers.length > 0) {
    const chosenTargetIds = soldiers
      .map(s => s.nightActionTargetId)
      .filter((id): id is string => Boolean(id) && id !== 'ABSTAIN');

    if (soldiers.length >= 2) {
      if (chosenTargetIds.length > 0) {
        // Se todos os soldados escolheram o mesmo nome
        const allSame =
          chosenTargetIds.length === soldiers.length &&
          chosenTargetIds.every(id => id === chosenTargetIds[0]);

        if (allSame) {
          targetId = chosenTargetIds[0];
        } else {
          // Se não forem iguais, sorteia entre os alvos escolhidos
          const distinctTargets = Array.from(new Set(chosenTargetIds));
          const randomIndex = Math.floor(Math.random() * distinctTargets.length);
          targetId = distinctTargets[randomIndex];
        }
      }
    } else {
      // Apenas 1 soldado vivo
      targetId = chosenTargetIds[0] || null;
    }
  }

  // 3. Evangelista prayers
  // Restrição: Requer orar DUAS vezes no mesmo Soldado para convertê-lo.
  // Limite: Apenas 1 única conversão bem-sucedida por partida!
  const evangelista = next.players.find(p => p.role === 'EVANGELISTA' && p.isAlive);
  if (evangelista && evangelista.nightActionTargetId) {
    const prayed = next.players.find(p => p.id === evangelista.nightActionTargetId);
    if (prayed) {
      prayed.prayersReceived += 1;
      if (
        prayed.role === 'SOLDADO' &&
        prayed.prayersReceived >= 2 &&
        !prayed.converted &&
        next.successfulConversionsCount === 0
      ) {
        prayed.team = 'OVELHAS';
        prayed.role = 'OVELHA'; // Perde o poder de matar e torna-se Ovelha simples
        prayed.converted = true;
        next.successfulConversionsCount = 1;
        next.logs.push({
          id: 'log_conv_' + Date.now(),
          phase: 'NIGHT',
          dayNumber: next.dayNumber,
          text: `✨ Milagre da Fé: As orações converteram ${prayed.name}! O Soldado perdeu o poder de matar e tornou-se uma Ovelha simples do rebanho (Limite de 1 conversão na partida alcançado).`,
          timestamp: Date.now(),
          type: 'CONVERSION',
        });
      }
    }
  }

  // 4. Apóstolo (Discernimento de Afinidade)
  // Considera o Falso Profeta na 1ª investigação
  const apostolo = next.players.find(p => p.role === 'APOSTOLO' && p.isAlive);
  if (apostolo && apostolo.nightActionTargetId && apostolo.nightActionSecondaryId) {
    const t1 = next.players.find(p => p.id === apostolo.nightActionTargetId);
    const t2 = next.players.find(p => p.id === apostolo.nightActionSecondaryId);
    if (t1 && t2) {
      let team1: Team = t1.team;
      let team2: Team = t2.team;

      if (t1.modifier === 'FALSO_PROFETA') {
        if ((t1.investigationCount || 0) === 0) {
          team1 = 'OVELHAS'; // Aparece como Ovelha na primeira vez
        } else {
          team1 = 'SOLDADOS'; // Revela Soldado a partir da segunda
        }
        t1.investigationCount = (t1.investigationCount || 0) + 1;
      }

      if (t2.modifier === 'FALSO_PROFETA') {
        if ((t2.investigationCount || 0) === 0) {
          team2 = 'OVELHAS';
        } else {
          team2 = 'SOLDADOS';
        }
        t2.investigationCount = (t2.investigationCount || 0) + 1;
      }

      const same = team1 === team2;
      apostolo.lastInspectionResult = same
        ? `[Discernimento]: ${t1.name} e ${t2.name} pertencem à MESMA EQUIPE.`
        : `[Discernimento]: ${t1.name} e ${t2.name} pertencem a EQUIPES DIFERENTES.`;
    }
  }

  // 5. Profeta (Revela APENAS a equipe: "Soldado" ou "Ovelha", sem revelar a função específica)
  // Habilidade Passiva do Falso Profeta: Na 1ª vez aparece como "Ovelha". A partir da 2ª vez, revela seu time real ("Soldado")
  const profeta = next.players.find(p => p.role === 'PROFETA' && p.isAlive);
  if (profeta && profeta.nightActionTargetId) {
    const t = next.players.find(p => p.id === profeta.nightActionTargetId);
    if (t) {
      let revealedTeamLabel = t.team === 'SOLDADOS' ? 'Soldado' : 'Ovelha';
      if (t.modifier === 'FALSO_PROFETA') {
        if ((t.investigationCount || 0) === 0) {
          revealedTeamLabel = 'Ovelha'; // Passiva: primeira vez disfarçado
        } else {
          revealedTeamLabel = 'Soldado'; // Segunda vez em diante: real
        }
        t.investigationCount = (t.investigationCount || 0) + 1;
      }
      profeta.lastInspectionResult = `[Visão Sagrada]: ${t.name} pertence à equipe dos ${
        revealedTeamLabel === 'Soldado' ? 'Soldados' : 'Ovelhas'
      }.`;
    }
  }

  // 6. Death resolution com verificação do ANJO (Sacrifício heroico de uso único)
  let victimName: string | null = null;
  if (targetId) {
    if (targetId === protectedId) {
      next.logs.push({
        id: 'log_prot_' + Date.now(),
        phase: 'NIGHT',
        dayNumber: next.dayNumber,
        text: `🛡️ Proteção Divina: O Pastor intercedeu pelo alvo dos Soldados! Ninguém faleceu nesta noite.`,
        timestamp: Date.now(),
        type: 'INFO',
      });
    } else {
      const victim = next.players.find(p => p.id === targetId);
      // Checar se o ANJO ativou sacrifício para salvar a pessoa
      const angel = next.players.find(
        p => p.modifier === 'ANJO' && p.isAlive && !p.angelUsed && p.angelSacrificeTonight
      );

      if (angel && victim) {
        // O Anjo se sacrifica no lugar da vítima!
        angel.isAlive = false;
        angel.angelUsed = true;
        angel.angelSacrificeTonight = false;
        victimName = angel.name;

        next.logs.push({
          id: 'log_angel_sac_' + Date.now(),
          phase: 'NIGHT',
          dayNumber: next.dayNumber,
          text: `🕊️ Sacrifício do Anjo: O Anjo (${angel.name}) entregou sua própria vida nas sombras para salvar ${victim.name} do golpe dos Soldados! ${victim.name} foi salvo, mas o Anjo pereceu.`,
          timestamp: Date.now(),
          type: 'SACRIFICE',
        });
      } else if (victim) {
        victim.isAlive = false;
        victimName = victim.name;
        next.logs.push({
          id: 'log_death_' + Date.now(),
          phase: 'NIGHT',
          dayNumber: next.dayNumber,
          text: `💀 Tragédia: ${victim.name} foi eliminado na calada da noite! Sua verdadeira identidade e função permanecem em segredo.`,
          timestamp: Date.now(),
          type: 'DEATH',
        });
      }
    }
  }

  // Reset de flags de ação noturna
  next.players.forEach(p => {
    p.hasActedTonight = false;
    p.nightActionTargetId = null;
    p.nightActionSecondaryId = null;
    p.angelSacrificeTonight = false;
  });

  // Check victory
  const winner = checkLocalWinner(next.players);
  if (winner) {
    next.winner = winner;
    next.phase = 'GAME_OVER';
    return next;
  }

  next.phase = 'DAY_ANNOUNCEMENT';
  next.messages.push({
    id: 'msg_dawn_' + Date.now(),
    senderId: 'SYSTEM',
    senderName: 'Vila',
    text: victimName
      ? `☀️ O sol nasceu. ${victimName} foi encontrado sem vida.`
      : `☀️ O sol nasceu em paz! Ninguém pereceu esta noite.`,
    timestamp: Date.now(),
    channel: 'PUBLIC',
  });

  return next;
}

export function simulateLocalBotsChatAndVotes(state: LocalGameState): LocalGameState {
  const next = { ...state };
  next.messages = [...state.messages];
  const aliveBots = next.players.filter(p => p.isBot && p.isAlive);
  const alivePlayers = next.players.filter(p => p.isAlive);

  const samplePhrases = [
    'Acho muito suspeito o silêncio de alguns irmãos...',
    'Irmãos, devemos prestar atenção nas orações.',
    'Eu confio plenamente na inocência das ovelhas.',
    'Cuidado com quem tenta desviar as suspeitas!',
    'Que a verdade seja revelada nesta assembleia.',
  ];

  if (aliveBots.length > 0) {
    const randomBot = aliveBots[Math.floor(Math.random() * aliveBots.length)];
    const phrase = samplePhrases[Math.floor(Math.random() * samplePhrases.length)];
    next.messages.push({
      id: 'msg_bot_' + Date.now(),
      senderId: randomBot.id,
      senderName: randomBot.name,
      text: phrase,
      timestamp: Date.now(),
      channel: 'PUBLIC',
    });
  }

  // Simulate bot votes
  for (const bot of aliveBots) {
    const others = alivePlayers.filter(p => p.id !== bot.id);
    if (others.length > 0) {
      bot.voteTargetId = others[Math.floor(Math.random() * others.length)].id;
    }
  }

  return next;
}

export function resolveLocalDayVotes(state: LocalGameState): LocalGameState {
  const next = { ...state };
  next.logs = [...state.logs];
  next.messages = [...state.messages];

  const voteTallies = new Map<string, number>();
  const living = next.players.filter(p => p.isAlive);

  for (const voter of living) {
    if (!voter.voteTargetId || voter.voteTargetId === 'ABSTAIN') continue;
    // Mestre: Voto duplo secreto se ativado (máximo 2 vezes por partida)
    const weight = voter.usedDoubleVoteThisRound ? 2 : 1;
    voteTallies.set(voter.voteTargetId, (voteTallies.get(voter.voteTargetId) || 0) + weight);
  }

  let topId: string | null = null;
  let maxVotes = 0;
  let isTie = false;

  for (const [id, count] of voteTallies.entries()) {
    if (count > maxVotes) {
      maxVotes = count;
      topId = id;
      isTie = false;
    } else if (count === maxVotes) {
      isTie = true;
    }
  }

  let executedName: string | null = null;
  if (isTie || !topId || maxVotes === 0) {
    next.logs.push({
      id: 'log_tie_' + Date.now(),
      phase: 'DAY_VOTING',
      dayNumber: next.dayNumber,
      text: `⚖️ Votação sem veredito: Empate ou abstenção majoritária. Ninguém foi exilado hoje.`,
      timestamp: Date.now(),
      type: 'VOTE',
    });
  } else {
    const executed = next.players.find(p => p.id === topId);
    if (executed) {
      executed.isAlive = false;
      executedName = executed.name;
      next.logs.push({
        id: 'log_exile_' + Date.now(),
        phase: 'DAY_VOTING',
        dayNumber: next.dayNumber,
        text: `⚖️ Sentença: ${executed.name} recebeu ${maxVotes} votos e foi exilado da congregação! Sua verdadeira identidade e função permanecem em segredo.`,
        timestamp: Date.now(),
        type: 'DEATH',
      });
    }
  }

  // Reset flag de voto duplo da rodada
  next.players.forEach(p => {
    p.usedDoubleVoteThisRound = false;
    p.voteTargetId = null;
  });

  next.messages.push({
    id: 'msg_res_' + Date.now(),
    senderId: 'SYSTEM',
    senderName: 'Vila',
    text: executedName
      ? `⚖️ ${executedName} foi expulso da vila pela maioria dos votos!`
      : `⚖️ A assembleia encerrou sem consenso. Ninguém foi banido.`,
    timestamp: Date.now(),
    channel: 'PUBLIC',
  });

  const winner = checkLocalWinner(next.players);
  if (winner) {
    next.winner = winner;
    next.phase = 'GAME_OVER';
  } else {
    next.phase = 'DAY_RESULT';
  }

  return next;
}

export function checkLocalWinner(players: Player[]): Team | null {
  const living = players.filter(p => p.isAlive);
  const soldiers = living.filter(p => p.team === 'SOLDADOS');
  const sheep = living.filter(p => p.team === 'OVELHAS');

  if (soldiers.length === 0) return 'OVELHAS';
  if (soldiers.length >= sheep.length) return 'SOLDADOS';
  return null;
}
