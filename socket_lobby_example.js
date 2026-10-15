/**
 * ============================================================================
 * INFILTRADOS NA FÉ - SERVIDOR DE LOBBY MULTIPLAYER (Node.js + Socket.IO)
 * ============================================================================
 * Este arquivo contém o código completo e comentado em português para o
 * gerenciamento de salas na memória, geração de código de 5 caracteres (ex: X7B2K),
 * controle de host, entrada/saída de jogadores e início de partida.
 *
 * COMO RODAR LOCALMENTE:
 * 1. Inicialize um projeto (se ainda não tiver):
 *    npm init -y
 * 2. Instale as dependências:
 *    npm install express socket.io
 * 3. Execute o servidor:
 *    node socket_lobby_example.js
 * 4. Acesse http://localhost:3000 no seu navegador.
 * ============================================================================
 */

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Permite conexões de qualquer origem para testes locais
  },
});

const PORT = process.env.PORT || 3000;

// ----------------------------------------------------------------------------
// 1. GERENCIAMENTO DE SALAS NA MEMÓRIA
// ----------------------------------------------------------------------------
// Estrutura do objeto rooms:
// {
//   "X7B2K": {
//     code: "X7B2K",
//     hostId: "socket_id_do_criador",
//     state: "waiting", // "waiting" | "playing"
//     maxPlayers: 16,
//     players: [
//       { socketId: "...", name: "Rafael", isHost: true }
//     ]
//   }
// }
const rooms = {};

/**
 * Função utilitária para gerar código único de 5 caracteres alfanuméricos em caixa alta.
 * Exemplo de retorno: "X7B2K", "M9P4L", "A3D7Q"
 */
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sem O/0 e I/1 para evitar confusão visual
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ----------------------------------------------------------------------------
// 2. CONFIGURAÇÃO DOS EVENTOS DO SOCKET.IO
// ----------------------------------------------------------------------------
io.on('connection', (socket) => {
  console.log(`[Conexão] Novo jogador conectado: ${socket.id}`);

  /**
   * EVENTO: create-room
   * O criador solicita a criação de uma nova sala.
   * Entrada: { playerName: "Rafael" }
   * Retorno: callback({ success: true, roomCode: "X7B2K", room: {...} })
   */
  socket.on('create-room', (data, callback) => {
    // 1. Gerar código único de 5 caracteres
    let roomCode = generateRoomCode();
    while (rooms[roomCode]) {
      roomCode = generateRoomCode();
    }

    const playerName = (data?.playerName || 'Anfitrião').trim();

    // 2. Criar a estrutura da sala
    rooms[roomCode] = {
      code: roomCode,
      hostId: socket.id,
      state: 'waiting',
      maxPlayers: 16,
      players: [
        {
          socketId: socket.id,
          name: playerName,
          isHost: true,
        },
      ],
    };

    // 3. Adicionar o socket do host à sala Socket.IO
    socket.join(roomCode);
    console.log(`[Sala Criada] Sala: ${roomCode} criada por ${playerName} (${socket.id})`);

    const response = {
      success: true,
      roomCode: roomCode,
      room: rooms[roomCode],
    };

    // Emite para o próprio socket e executa o callback se fornecido
    socket.emit('room-created', response);
    if (typeof callback === 'function') callback(response);
  });

  /**
   * EVENTO: join-room
   * Outro jogador tenta entrar usando o código de 5 caracteres.
   * Entrada: { roomCode: "X7B2K", playerName: "Lucas" }
   * Validações: se a sala existe, se não está cheia e se o jogo não começou.
   */
  socket.on('join-room', (data, callback) => {
    const roomCode = (data?.roomCode || '').toUpperCase().trim();
    const playerName = (data?.playerName || 'Irmão Convidado').trim();
    const room = rooms[roomCode];

    // Validação 1: Verificar se a sala existe
    if (!room) {
      const err = { success: false, message: 'Sala não encontrada. Verifique o código.' };
      socket.emit('join-error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    // Validação 2: Verificar se a partida já começou
    if (room.state !== 'waiting') {
      const err = { success: false, message: 'A partida nesta sala já está em andamento.' };
      socket.emit('join-error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    // Validação 3: Verificar capacidade máxima
    if (room.players.length >= room.maxPlayers) {
      const err = { success: false, message: 'A sala está cheia.' };
      socket.emit('join-error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    // Adiciona o jogador à sala
    const newPlayer = {
      socketId: socket.id,
      name: playerName,
      isHost: false,
    };

    room.players.push(newPlayer);
    socket.join(roomCode);

    console.log(`[Jogador Entrou] ${playerName} (${socket.id}) entrou na sala ${roomCode}`);

    const response = {
      success: true,
      roomCode: roomCode,
      room: room,
    };

    // Notifica quem acabou de entrar
    socket.emit('room-joined', response);
    if (typeof callback === 'function') callback(response);

    // Notifica todos na sala que um novo jogador entrou com a lista atualizada
    io.to(roomCode).emit('player-joined', {
      newPlayer: newPlayer,
      players: room.players,
    });
  });

  /**
   * EVENTO: start-game
   * Permite apenas ao criador (host) iniciar a partida.
   * Entrada: { roomCode: "X7B2K" }
   */
  socket.on('start-game', (data, callback) => {
    const roomCode = (data?.roomCode || '').toUpperCase().trim();
    const room = rooms[roomCode];

    if (!room) {
      if (typeof callback === 'function') callback({ success: false, message: 'Sala inexistente.' });
      return;
    }

    // Apenas o host pode dar start
    if (room.hostId !== socket.id) {
      const err = { success: false, message: 'Apenas o anfitrião pode iniciar a partida.' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    // Validação mínima de jogadores para início (ex: mínimo 2 para teste ou 5 no jogo completo)
    if (room.players.length < 2) {
      const err = { success: false, message: 'Mínimo de 2 jogadores para iniciar.' };
      socket.emit('error', err);
      if (typeof callback === 'function') callback(err);
      return;
    }

    // Muda o estado da sala para "playing"
    room.state = 'playing';
    console.log(`[Jogo Iniciado] Partida começou na sala ${roomCode}`);

    // Envia evento para todos os jogadores na sala carregarem a tela do jogo
    io.to(roomCode).emit('game-started', {
      roomCode: roomCode,
      room: room,
    });

    if (typeof callback === 'function') callback({ success: true });
  });

  /**
   * EVENTO: leave-room / disconnect
   * Trata o jogador saindo voluntariamente ou desconexão inesperada.
   */
  function handlePlayerExit() {
    for (const roomCode in rooms) {
      const room = rooms[roomCode];
      const playerIndex = room.players.findIndex((p) => p.socketId === socket.id);

      if (playerIndex !== -1) {
        const leavingPlayer = room.players[playerIndex];
        room.players.splice(playerIndex, 1);
        socket.leave(roomCode);

        console.log(`[Saída] ${leavingPlayer.name} saiu da sala ${roomCode}`);

        // Caso 1: Sala ficou vazia -> Deleta a sala da memória
        if (room.players.length === 0) {
          delete rooms[roomCode];
          console.log(`[Sala Deletada] Sala ${roomCode} vazia e removida da memória.`);
          return;
        }

        // Caso 2: O jogador que saiu era o Host -> Migra o host para o próximo
        let newHostId = room.hostId;
        if (room.hostId === socket.id) {
          const nextHost = room.players[0];
          nextHost.isHost = true;
          room.hostId = nextHost.socketId;
          newHostId = nextHost.socketId;
          console.log(`[Host Transferido] Novo host da sala ${roomCode}: ${nextHost.name}`);
        }

        // Notifica os jogadores restantes na sala
        io.to(roomCode).emit('player-left', {
          socketId: socket.id,
          playerName: leavingPlayer.name,
          newHostId: newHostId,
          players: room.players,
        });

        break;
      }
    }
  }

  socket.on('leave-room', handlePlayerExit);
  socket.on('disconnect', handlePlayerExit);
});

// Endpoint básico de verificação de saúde da API
app.get('/health', (req, res) => {
  res.json({ status: 'online', activeRooms: Object.keys(rooms).length });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
