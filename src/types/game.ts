export type Role = 'SOLDADO' | 'OVELHA' | 'PASTOR' | 'EVANGELISTA' | 'APOSTOLO' | 'PROFETA' | 'MESTRE';
export type Team = 'SOLDADOS' | 'OVELHAS';
export type Phase =
  | 'LOBBY'
  | 'ROLE_REVEAL'
  | 'NIGHT'
  | 'DAY_ANNOUNCEMENT'
  | 'DAY_DISCUSSION'
  | 'DAY_VOTING'
  | 'DAY_RESULT'
  | 'GAME_OVER';

export interface RoleInfo {
  id: Role;
  name: string;
  team: Team;
  badge: string;
  subtitle: string;
  description: string;
  abilityName: string;
  abilityDescription: string;
  nightActive: boolean;
  maxRecommended?: number;
}

export const ROLES_METADATA: Record<Role, RoleInfo> = {
  SOLDADO: {
    id: 'SOLDADO',
    name: 'Soldado',
    team: 'SOLDADOS',
    badge: 'Elmo • Infiltrado',
    subtitle: 'Elmo • Lobo em Pele de Cordeiro',
    description: 'Você faz parte da facção minoritária informada. À noite você conspira com outros Soldados para escolher uma vítima. De dia, finja ser uma ovelha santa.',
    abilityName: 'Golpe das Sombras',
    abilityDescription: 'Escolha uma vítima para eliminar. Havendo 2 ou mais Soldados: se escolherem nomes iguais a pessoa morre; se escolherem nomes diferentes, a vítima será sorteada entre os escolhidos.',
    nightActive: true,
  },
  OVELHA: {
    id: 'OVELHA',
    name: 'Ovelha',
    team: 'OVELHAS',
    badge: 'Rebanho Inocente',
    subtitle: 'Membro Fiel da Vila',
    description: 'Você é um aldeão comum, sem poderes noturnos especiais. Sua força reside no debate público e no voto coletivo.',
    abilityName: 'Graça Ingênua',
    abilityDescription: 'Sem poder noturno. Participe das discussões e vote nas reuniões diurnas.',
    nightActive: false,
  },
  PASTOR: {
    id: 'PASTOR',
    name: 'Pastor',
    team: 'OVELHAS',
    badge: 'Cajado • Guardião',
    subtitle: 'Cajado • Escudo do Rebanho',
    description: 'Pode escolher 1 jogador por noite para proteger de eliminação. Restrição: Não pode proteger a mesma pessoa em duas noites consecutivas.',
    abilityName: 'Guarda Pastoral',
    abilityDescription: 'Protege 1 jogador por noite contra ataque dos Soldados. Não pode proteger a mesma pessoa 2 noites seguidas.',
    nightActive: true,
  },
  EVANGELISTA: {
    id: 'EVANGELISTA',
    name: 'Evangelista',
    team: 'OVELHAS',
    badge: 'Bíblia • Pregador',
    subtitle: 'Bíblia • Conversor de Almas',
    description: 'Pode orar por um jogador a cada noite. Requer orar DUAS vezes no mesmo Soldado para convertê-lo. Ao ser convertido, o Soldado perde o poder de matar e torna-se uma Ovelha simples. Limite: Apenas 1 única conversão bem-sucedida por partida.',
    abilityName: 'Oração de Redenção',
    abilityDescription: 'Ore por 1 jogador a cada noite. 2 orações no mesmo Soldado o convertem a Ovelha simples (máximo 1 conversão na partida).',
    nightActive: true,
  },
  APOSTOLO: {
    id: 'APOSTOLO',
    name: 'Apóstolo',
    team: 'OVELHAS',
    badge: 'Balança de Justiça',
    subtitle: 'Balança de Justiça • Afinidade',
    description: 'Dotado de discernimento de espíritos, você escolhe duas pessoas por noite e descobre se pertencem à MESMA equipe ou a EQUIPES DIFERENTES.',
    abilityName: 'Discernimento de Afinidade',
    abilityDescription: 'Escolha 2 jogadores vivos por noite para descobrir se são da mesma facção ou não.',
    nightActive: true,
  },
  PROFETA: {
    id: 'PROFETA',
    name: 'Profeta',
    team: 'OVELHAS',
    badge: 'Shofar • Visão Sagrada',
    subtitle: 'Shofar • Voz da Verdade',
    description: 'Investiga 1 jogador por noite. Retorno: Revela APENAS a equipe do alvo ("Soldado" ou "Ovelha"), sem revelar a função específica.',
    abilityName: 'Visão de Equipe',
    abilityDescription: 'Investigue 1 jogador por noite para descobrir APENAS a sua equipe ("Soldado" ou "Ovelha").',
    nightActive: true,
  },
  MESTRE: {
    id: 'MESTRE',
    name: 'Mestre',
    team: 'OVELHAS',
    badge: 'Pena de Escritor',
    subtitle: 'Pena de Escritor • Voto Duplo Secreto',
    description: 'Pode usar voto duplo durante as votações do dia. O voto duplo é secreto e pode ser ativado no máximo 2 vezes por partida.',
    abilityName: 'Voto de Autoridade Secreto',
    abilityDescription: 'Voto duplo secreto na assembleia de eliminação. Pode ser ativado no máximo 2 vezes por partida.',
    nightActive: false,
  },
};

// ============================================================================
// MECÂNICA DE MODIFICADORES / CARDS ESPECIAIS (SORTEIO SECUNDÁRIO)
// ============================================================================
export type ModifierId = 'FALSO_PROFETA' | 'ESPIAO' | 'ANJO';

export interface ModifierInfo {
  id: ModifierId;
  name: string;
  allowedTeam: Team;
  badge: string;
  iconName: string;
  description: string;
  abilityDescription: string;
}

export const MODIFIERS_METADATA: Record<ModifierId, ModifierInfo> = {
  FALSO_PROFETA: {
    id: 'FALSO_PROFETA',
    name: 'Falso Profeta',
    allowedTeam: 'SOLDADOS',
    badge: 'Disfarce / Soldados',
    iconName: 'Sparkles',
    description: 'Modificador sorteado aleatoriamente para 1 jogador pertencente ao time dos Soldados.',
    abilityDescription: 'Habilidade Passiva: Na PRIMEIRA VEZ que este jogador for investigado (seja pelo Profeta ou comparado pelo Apóstolo), sua equipe aparecerá como "Ovelha". A partir da segunda investigação sobre ele, revelará seu time real ("Soldado").',
  },
  ESPIAO: {
    id: 'ESPIAO',
    name: 'Espião',
    allowedTeam: 'OVELHAS',
    badge: 'Olho Secreto / Ovelhas',
    iconName: 'Eye',
    description: 'Modificador especial sorteado exclusivamente para 1 jogador pertencente ao time das Ovelhas.',
    abilityDescription: 'Permite espionar 1 jogador a qualquer momento da partida para descobrir sua função exata (uso único, 1 vez por partida).',
  },
  ANJO: {
    id: 'ANJO',
    name: 'Anjo',
    allowedTeam: 'OVELHAS',
    badge: 'Sacrifício Heroico / Ovelhas',
    iconName: 'Shield',
    description: 'Modificador especial sorteado exclusivamente para 1 jogador pertencente ao time das Ovelhas (nunca o mesmo do Espião).',
    abilityDescription: 'Pode se sacrificar durante a noite para salvar a pessoa que seria morta pelos Soldados (uso único, 1 vez por partida).',
  },
};

export interface ModifiersConfig {
  falsoProfeta: boolean;
  espiao: boolean;
  anjo: boolean;
}

export interface Player {
  id: string;
  name: string;
  color?: string;
  avatar?: string;
  role: Role;
  team: Team;
  isAlive: boolean;
  isHost: boolean;
  isBot: boolean;
  prayersReceived: number;
  converted: boolean;
  hasActedTonight: boolean;
  voteTargetId: string | null;
  nightActionTargetId: string | null;
  nightActionSecondaryId?: string | null;
  lastInspectionResult?: string | null;

  hasConfirmedRole?: boolean;
  hasApprovedPhase?: boolean;
  disconnected?: boolean;

  // Regras de Funções
  lastProtectedTargetId?: string | null; // Pastor: não pode repetir 2 noites seguidas
  masterDoubleVotesRemaining?: number; // Mestre: máximo 2 por partida
  usedDoubleVoteThisRound?: boolean; // Mestre: se ativou voto duplo nesta votação

  // Modificadores / Cards Especiais
  modifier?: ModifierId | null;
  investigationCount?: number; // Falso Profeta: contador de investigações sofridas
  spyUsed?: boolean; // Espião: se já executou o uso único
  spyResult?: string | null; // Espião: mensagem de revelação obtida
  angelUsed?: boolean; // Anjo: se já executou o sacrifício único
  angelSacrificeTonight?: boolean; // Anjo: se declarou sacrifício para a noite em andamento
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole?: Role;
  text: string;
  timestamp: number;
  channel: 'PUBLIC' | 'SOLDIERS' | 'SYSTEM';
}

export interface GameLog {
  id: string;
  phase: string;
  dayNumber: number;
  text: string;
  timestamp: number;
  type: 'INFO' | 'DEATH' | 'CONVERSION' | 'VOTE' | 'NIGHT_RESULT' | 'SACRIFICE' | 'SPY';
}

export interface GameConfig {
  revealRolesOnDeath: boolean;
  pastorCanSelfProtect: boolean;
  blockFirstNightElimination?: boolean;
  discussionTimeSeconds: number;
  votingTimeSeconds: number;
  nightTimeSeconds: number;
  modifiersConfig: ModifiersConfig;
}

export interface RoomState {
  code: string;
  hostId: string;
  phase: Phase;
  dayNumber: number;
  phaseTimeRemaining: number;
  players: Player[];
  messages: ChatMessage[];
  logs: GameLog[];
  winner: Team | null;
  config: GameConfig;
  self?: Player | null;
  soldiersList?: Array<{ id: string; name: string }>;
  successfulConversionsCount?: number;
}
