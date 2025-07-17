const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { Server } = require('socket.io')
const { v4: uuidv4 } = require('uuid')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3000

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

// In-memory storage for poker rooms
const pokersRooms = {}

const getDefaultVotingValues = () => [
  '0', '1', '2', '3', '5', '8', '13', '21', '34', '55', '89', '?'
]

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })

  const io = new Server(server, {
    cors: {
      origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000'],
      methods: ['GET', 'POST'],
    },
  })

  // Hacer io accesible globalmente para timeouts
  global.io = io

  io.on('connection', (socket) => {
    console.log('New client connected')

    // Crear una sala
    socket.on('create-room', (data) => {
      const roomId = uuidv4()
      const user = {
        id: socket.id,
        name: data.userName,
        role: 'moderator',
        canVote: true // Por defecto el moderador puede votar
      }

      const room = {
        id: roomId,
        name: data.roomName,
        users: [user],
        votes: {},
        isVotingComplete: false,
        showVotes: false,
        isRevealing: false,
        votingValues: getDefaultVotingValues(),
        createdAt: new Date(),
        moderators: [socket.id], // Array de moderadores
        creatorId: socket.id, // ID del creador original
      }

      pokersRooms[roomId] = room
      socket.join(roomId)
      socket.emit('room-created', { roomId, room })
      console.log(`Room created: ${roomId}`)
    })

    // Unirse a una sala
    socket.on('join-room', (data) => {
      const room = pokersRooms[data.roomId]
      if (!room) {
        console.log(`❌ Room not found for join: ${data.roomId}`)
        socket.emit('room-not-found')
        return
      }
      
      const user = {
        id: socket.id,
        name: data.userName,
        role: data.role || 'participant', // 'participant' o 'spectator'
        canVote: (data.role || 'participant') === 'participant' // Solo participantes pueden votar por defecto
      }

      // Verificar si el usuario ya existe (reconexión)
      const existingUserIndex = room.users.findIndex(u => u.name === data.userName)
      if (existingUserIndex >= 0) {
        console.log(`User ${data.userName} already exists, updating socket ID`)
        room.users[existingUserIndex] = user
      } else {
        room.users.push(user)
      }

      socket.join(data.roomId)
      socket.emit('room-joined', { room })
      socket.to(data.roomId).emit('user-joined', { user, room })
      console.log(`User ${data.userName} joined room ${data.roomId} as ${user.role}`)
    })

    // Votar (solo usuarios con canVote=true)
    socket.on('vote', (data) => {
      const room = pokersRooms[data.roomId]
      if (!room) {
        console.log(`❌ Room not found for vote: ${data.roomId}`)
        return
      }
      
      const user = room.users.find(u => u.id === socket.id)
      if (!user) {
        console.log(`❌ User not found in room ${data.roomId} for vote`)
        return
      }
      
      if (user.canVote) {
        room.votes[socket.id] = {
          userId: socket.id,
          value: data.value,
          hasVoted: true,
        }

        // Verificar si todos los usuarios que pueden votar han votado
        const votingUsers = room.users.filter(u => u.canVote)
        const votesCount = Object.keys(room.votes).length
        
        if (votingUsers.length === votesCount) {
          room.isVotingComplete = true
        }

        console.log(`Vote registered: ${data.value} by ${user.name} in room ${data.roomId} (${votesCount}/${votingUsers.length})`)
        io.to(data.roomId).emit('vote-updated', { room })
      } else {
        console.log(`❌ User ${user.name} cannot vote in room ${data.roomId}`)
      }
    })

    // Toggle moderator voting (solo moderadores y creador)
    socket.on('toggle-moderator-voting', (data) => {
      const room = pokersRooms[data.roomId]
      if (!room) {
        console.log(`❌ Room not found for toggle-moderator-voting: ${data.roomId}`)
        return
      }
      
      if (room.moderators.includes(socket.id) || room.creatorId === socket.id) {
        const moderator = room.users.find(u => u.id === socket.id)
        if (moderator) {
          moderator.canVote = !moderator.canVote
          
          // Si el moderador desactiva su voto y ya había votado, eliminar su voto
          if (!moderator.canVote && room.votes[socket.id]) {
            delete room.votes[socket.id]
          }
          
          // Recalcular si la votación está completa
          const votingUsers = room.users.filter(u => u.canVote)
          const votesCount = Object.keys(room.votes).length
          room.isVotingComplete = votingUsers.length === votesCount
          
          console.log(`Moderator ${moderator.name} voting toggled to: ${moderator.canVote} in room: ${data.roomId}`)
          io.to(data.roomId).emit('moderator-voting-toggled', { room })
        }
      } else {
        console.log(`❌ Unauthorized moderator voting toggle attempt by ${socket.id} in room ${data.roomId}`)
      }
    })

    // Update voting values (solo moderadores y creador)
    socket.on('update-voting-values', (data) => {
      const room = pokersRooms[data.roomId]
      if (!room) {
        console.log(`❌ Room not found for update-voting-values: ${data.roomId}`)
        return
      }
      
      if ((room.moderators.includes(socket.id) || room.creatorId === socket.id) && Array.isArray(data.values)) {
        room.votingValues = data.values
        // Reiniciar votación cuando se cambian los valores
        room.votes = {}
        room.isVotingComplete = false
        room.showVotes = false
        room.isRevealing = false
        
        const user = room.users.find(u => u.id === socket.id)
        console.log(`Voting values updated in room: ${data.roomId} by ${user?.name || 'unknown'} to:`, data.values)
        io.to(data.roomId).emit('voting-values-updated', { room })
      } else {
        console.log(`❌ Unauthorized voting values update attempt by ${socket.id} in room ${data.roomId}`)
      }
    })

    // Revelar votos (solo moderadores y creador) con animación
    socket.on('reveal-votes', (data) => {
      const room = pokersRooms[data.roomId]
      if (!room) {
        console.log(`❌ Room not found for reveal-votes: ${data.roomId}`)
        return
      }
      
      if (room.moderators.includes(socket.id) || room.creatorId === socket.id) {
        room.isRevealing = true
        io.to(data.roomId).emit('reveal-started', { room })
        
        const user = room.users.find(u => u.id === socket.id)
        console.log(`Votes revealed in room: ${data.roomId} by ${user?.name || 'unknown'} (${user?.role || 'unknown'})`)
        
        // Esperar 4.5 segundos: 3 para countdown + 1.5 para mostrar cartas
        setTimeout(() => {
          if (pokersRooms[data.roomId]) { // Verificar que la sala aún existe
            pokersRooms[data.roomId].showVotes = true
            pokersRooms[data.roomId].isRevealing = false
            io.to(data.roomId).emit('votes-revealed', { room: pokersRooms[data.roomId] })
          }
        }, 4500)
      } else {
        console.log(`❌ Unauthorized reveal attempt by ${socket.id} in room ${data.roomId}`)
      }
    })

    // Reiniciar votación (solo moderadores y creador)
    socket.on('reset-voting', (data) => {
      const room = pokersRooms[data.roomId]
      if (room && (room.moderators.includes(socket.id) || room.creatorId === socket.id)) {
        room.votes = {}
        room.isVotingComplete = false
        room.showVotes = false
        room.isRevealing = false
        
        const user = room.users.find(u => u.id === socket.id)
        console.log(`Voting reset in room: ${data.roomId} by ${user?.name || 'unknown'} (${user?.role || 'unknown'})`)
        io.to(data.roomId).emit('voting-reset', { room })
      } else {
        console.log(`❌ Unauthorized reset attempt by ${socket.id} in room ${data.roomId}`)
      }
    })

    // Promover a moderador (solo el creador puede hacerlo)
    socket.on('promote-to-moderator', (data) => {
      const room = pokersRooms[data.roomId]
      if (!room) {
        console.log(`❌ Room not found for promote-to-moderator: ${data.roomId}`)
        return
      }
      
      if (socket.id !== room.creatorId) {
        console.log(`❌ Unauthorized promote attempt by ${socket.id} in room ${data.roomId}`)
        return
      }
      
      const user = room.users.find(u => u.id === data.userId)
      if (!user) {
        console.log(`❌ User not found for promotion: ${data.userId}`)
        return
      }
      
      if (user.role !== 'moderator') {
        user.role = 'moderator'
        user.canVote = true // Los nuevos moderadores pueden votar por defecto
        room.moderators.push(data.userId)
        
        console.log(`User ${user.name} promoted to moderator in room ${data.roomId}`)
        io.to(data.roomId).emit('user-promoted', { room, promotedUserId: data.userId })
      } else {
        console.log(`User ${user.name} is already a moderator`)
      }
    })

    // Degradar de moderador (solo el creador puede hacerlo)
    socket.on('demote-from-moderator', (data) => {
      console.log('Demote request received:', data)
      const room = pokersRooms[data.roomId]
      if (!room) {
        console.log('Room not found:', data.roomId)
        return
      }
      
      if (socket.id !== room.creatorId) {
        console.log('User is not creator. Socket ID:', socket.id, 'Creator ID:', room.creatorId)
        return
      }
      
      console.log('Creator validation passed')
      const user = room.users.find(u => u.id === data.userId)
      if (!user) {
        console.log('User not found:', data.userId)
        return
      }
      
      console.log('User found:', user.name, 'Current role:', user.role)
      console.log('Current moderators:', room.moderators)
      console.log('User is moderator:', room.moderators.includes(data.userId))
      
      if (!room.moderators.includes(data.userId)) {
        console.log('User is not a moderator')
        return
      }
      
      console.log('Demoting user:', user.name)
      user.role = 'participant'
      user.canVote = true // Asegurar que pueda votar como participante
      
      // Remover de la lista de moderadores
      const oldModerators = [...room.moderators]
      room.moderators = room.moderators.filter(id => id !== data.userId)
      console.log('Old moderators:', oldModerators)
      console.log('New moderators list:', room.moderators)
      
      io.to(data.roomId).emit('user-demoted', { room, demotedUserId: data.userId })
      console.log('User demoted successfully, event emitted')
    })

    // Reconexión a sala existente
    socket.on('rejoin-room', (data) => {
      console.log(`🔄 Rejoin attempt: ${data.userName} to room ${data.roomId}`)
      console.log(`📊 Session showVotes: ${data.sessionShowVotes}, isVotingComplete: ${data.sessionIsVotingComplete}`)
      
      const room = pokersRooms[data.roomId]
      if (room) {
        // Verificar si los votos deberían estar revelados basado en session data o estado actual
        const votingUsers = room.users.filter(u => u.canVote && !u.id.startsWith('disconnected_'))
        const activeVotes = Object.keys(room.votes).filter(voteId => !voteId.startsWith('disconnected_'))
        const hasVotes = activeVotes.length > 0
        
        // Prioridad 1: Si el usuario tenía showVotes=true en su sesión, restaurar ese estado
        if (data.sessionShowVotes && data.sessionIsVotingComplete) {
          room.showVotes = true
          room.isVotingComplete = true
          console.log(`📊 Restoring votes state from session - user had showVotes=true`)
        }
        // Prioridad 2: Si hay votos y la votación estaba completa, mantener showVotes como true
        else if (hasVotes && room.isVotingComplete) {
          room.showVotes = true
          console.log(`📊 Auto-revealing votes for rejoining user ${data.userName} - voting was already complete`)
        }
        // Prioridad 3: Auto-reveal si todos han votado (SOLO si no conflicta con sesión)
        else if (hasVotes && votingUsers.length > 0 && activeVotes.length === votingUsers.length && !data.sessionShowVotes) {
          room.showVotes = true
          room.isVotingComplete = true
          console.log(`📊 Auto-revealing votes - all users have voted`)
        }
        
        // Buscar si el usuario ya existe por nombre (incluyendo desconectados)
        let existingUser = room.users.find(u => u.name === data.userName)
        
        if (existingUser) {
          // Actualizar el socket ID del usuario existente
          const oldSocketId = existingUser.id
          existingUser.id = socket.id
          
          // Marcar como reconectado
          existingUser.isDisconnected = false
          delete existingUser.disconnectedAt
          
          // Actualizar votos si los había - buscar por socket ID anterior
          if (room.votes[oldSocketId]) {
            room.votes[socket.id] = room.votes[oldSocketId]
            delete room.votes[oldSocketId]
            console.log(`📊 Restored vote for ${data.userName}: ${room.votes[socket.id].value}`)
          } else {
            // Buscar voto por nombre de usuario como fallback
            const userVote = Object.values(room.votes).find(vote => {
              const voteUser = room.users.find(u => u.id === vote.userId)
              return voteUser && voteUser.name === data.userName
            })
            
            if (userVote) {
              // Encontró el voto por nombre, actualizar con nuevo socket ID
              const oldVoteSocketId = userVote.userId
              room.votes[socket.id] = { ...userVote, userId: socket.id }
              delete room.votes[oldVoteSocketId]
              console.log(`📊 Restored vote by username for ${data.userName}: ${room.votes[socket.id].value}`)
            }
          }
          
          // Actualizar array de moderadores si era moderador
          if (room.moderators.includes(oldSocketId)) {
            const moderatorIndex = room.moderators.indexOf(oldSocketId)
            room.moderators[moderatorIndex] = socket.id
          }
          
          // Actualizar creatorId si era el creador
          if (room.creatorId === oldSocketId) {
            room.creatorId = socket.id
          }
          
          socket.join(data.roomId)
          socket.emit('room-rejoined', { 
            room, 
            isReconnection: true,
            isCreator: room.creatorId === socket.id 
          })
          socket.to(data.roomId).emit('user-rejoined', { user: existingUser, room })
          console.log(`User ${data.userName} rejoined room ${data.roomId}${room.creatorId === socket.id ? ' (creator)' : ''} ${existingUser.isDisconnected ? '(was disconnected)' : ''}`)
        } else {
          // El usuario no existe en la sala, permitir unirse como nuevo usuario
          console.log(`User ${data.userName} not found in room ${data.roomId}, creating new user`)
          const user = {
            id: socket.id,
            name: data.userName,
            role: 'participant',
            canVote: true,
            isDisconnected: false
          }
          room.users.push(user)
          
          // Auto-reveal votes si todos ya habían votado antes de que llegara el nuevo usuario
          if (hasVotes && votingUsers.length > 0 && activeVotes.length >= votingUsers.length && !room.showVotes && !data.sessionShowVotes) {
            room.showVotes = true
            room.isVotingComplete = true
            console.log(`📊 Auto-revealing votes for new user - voting was already complete`)
          }
          // Si el nuevo usuario tiene sesión con showVotes=true, asegurar que se mantenga
          else if (data.sessionShowVotes && data.sessionIsVotingComplete) {
            room.showVotes = true
            room.isVotingComplete = true
            console.log(`📊 Ensuring votes remain revealed for new user with session data`)
          }
          
          socket.join(data.roomId)
          socket.emit('room-rejoined', { 
            room, 
            isReconnection: false,
            isCreator: false 
          })
          socket.to(data.roomId).emit('user-joined', { user, room })
          console.log(`User ${data.userName} joined room ${data.roomId} as new participant`)
        }
      } else {
        socket.emit('room-not-found')
      }
    })

    // Finalizar sala (solo el creador puede hacerlo)
    socket.on('end-room', (data) => {
      console.log('End room request received:', data)
      const room = pokersRooms[data.roomId]
      if (!room) {
        console.log('Room not found:', data.roomId)
        return
      }
      
      if (socket.id !== room.creatorId) {
        console.log('User is not creator. Socket ID:', socket.id, 'Creator ID:', room.creatorId)
        return
      }
      
      console.log('Creator validation passed, ending room:', room.name)
      
      // Notificar a todos los usuarios que la sala se está cerrando
      io.to(data.roomId).emit('room-ended', { 
        roomId: data.roomId, 
        roomName: room.name,
        message: 'La sala ha sido finalizada por el creador' 
      })
      
      // Desconectar a todos los usuarios de la sala
      const sockets = io.sockets.adapter.rooms.get(data.roomId)
      if (sockets) {
        sockets.forEach(socketId => {
          const clientSocket = io.sockets.sockets.get(socketId)
          if (clientSocket) {
            clientSocket.leave(data.roomId)
          }
        })
      }
      
      // Eliminar la sala
      delete pokersRooms[data.roomId]
      console.log(`Room ${data.roomId} ended by creator`)
    })

    // Desconexión
    socket.on('disconnect', () => {
      console.log('Client disconnected')
      // Marcar usuario como desconectado en lugar de eliminarlo inmediatamente
      Object.values(pokersRooms).forEach(room => {
        const user = room.users.find(user => user.id === socket.id)
        if (user) {
          // Marcar como desconectado pero mantener en la sala temporalmente
          user.isDisconnected = true
          user.disconnectedAt = Date.now()
          
          console.log(`User ${user.name} marked as disconnected in room ${room.id}`)
          socket.to(room.id).emit('user-disconnected', { userId: socket.id, room })
          
          // Eliminar el usuario después de 2 minutos si no se reconecta
          setTimeout(() => {
            const currentRoom = pokersRooms[room.id]
            if (currentRoom) {
              const disconnectedUser = currentRoom.users.find(u => u.id === socket.id && u.isDisconnected)
              if (disconnectedUser) {
                const userIndex = currentRoom.users.indexOf(disconnectedUser)
                currentRoom.users.splice(userIndex, 1)
                delete currentRoom.votes[socket.id]
                
                console.log(`User ${disconnectedUser.name} permanently removed from room ${room.id} after timeout`)
                
                // Si la sala queda vacía, eliminarla después de 5 minutos adicionales
                if (currentRoom.users.length === 0) {
                  setTimeout(() => {
                    if (pokersRooms[room.id] && pokersRooms[room.id].users.length === 0) {
                      delete pokersRooms[room.id]
                      console.log(`Room ${room.id} deleted due to inactivity`)
                    }
                  }, 5 * 60 * 1000) // 5 minutos
                } else {
                  // Enviar evento de usuario eliminado definitivamente
                  global.io.to(room.id).emit('user-left', { userId: socket.id, room: currentRoom })
                }
              }
            }
          }, 2 * 60 * 1000) // 2 minutos para reconectar
        }
      })
    })
  })

  server
    .once('error', (err) => {
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`)
    })
})
