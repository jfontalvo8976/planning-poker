import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import { Socket as NetSocket } from 'net'
import { v4 as uuidv4 } from 'uuid'
import { pokersRooms, PokerRoom, User, getDefaultVotingValues } from '../../lib/socket'

interface SocketServer extends NetServer {
  io?: ServerIO | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseWithSocket) {
  // Detectar si estamos en Vercel
  const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV
  
  if (isVercel) {
    // En Vercel, responder con un mensaje claro sobre las limitaciones
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }
    
    // Retornar error específico para debugging
    return res.status(503).json({ 
      error: 'Socket.IO not supported in Vercel serverless environment',
      message: 'This app has been moved to Render for better Socket.IO support.',
      suggestion: 'Please visit the Render deployment for full functionality.'
    })
  }

  if (!res.socket.server.io) {
    console.log('🚀 Starting Socket.IO')
    
    const io = new ServerIO(res.socket.server, {
      path: '/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NODE_ENV === 'production' 
          ? ["https://*.onrender.com", "https://your-app.onrender.com"] 
          : "*",
        methods: ["GET", "POST"],
        credentials: false
      },
      allowEIO3: true,
      transports: ['polling', 'websocket'],
      pingTimeout: 60000,
      pingInterval: 25000,
      upgradeTimeout: 30000,
      maxHttpBufferSize: 1e6,
      // Configuraciones específicas para Render
      connectionStateRecovery: {
        maxDisconnectionDuration: 2 * 60 * 1000,
        skipMiddlewares: true,
      }
    })
    
    res.socket.server.io = io
    console.log('✅ Socket.IO initialized')

    io.on('connection', (socket) => {
      console.log('🎉 NEW CLIENT CONNECTED:', socket.id)

      // Crear una sala
      socket.on('create-room', (data: { userName: string; roomName: string }) => {
        const roomId = uuidv4()
        const user: User = {
          id: socket.id,
          name: data.userName,
          role: 'moderator',
          canVote: true
        }

        const room: PokerRoom = {
          id: roomId,
          name: data.roomName,
          users: [user],
          votes: {},
          isVotingComplete: false,
          showVotes: false,
          votingValues: getDefaultVotingValues(),
          createdAt: new Date(),
          moderators: [user.id],
          creatorId: user.id,
          isRevealing: false
        }

        pokersRooms[roomId] = room
        socket.join(roomId)

        console.log(`Room created: ${roomId} by ${data.userName}`)
        socket.emit('room-created', { roomId, room, user })
      })

      // Unirse a una sala
      socket.on('join-room', (data: { roomId: string; userName: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        const user: User = {
          id: socket.id,
          name: data.userName,
          role: 'participant',
          canVote: true
        }

        room.users.push(user)
        socket.join(data.roomId)

        console.log(`${data.userName} joined room: ${data.roomId}`)
        
        socket.emit('room-joined', { room, user })
        socket.to(data.roomId).emit('user-joined', { user, room })
      })

      // Rejoinear a una sala (reconexión)
      socket.on('rejoin-room', (data: { roomId: string; userName: string; sessionShowVotes?: boolean; sessionIsVotingComplete?: boolean }) => {
        console.log(`🔄 Rejoin attempt: ${data.userName} to room ${data.roomId}`)
        console.log(`📊 Session showVotes: ${data.sessionShowVotes}, isVotingComplete: ${data.sessionIsVotingComplete}`)
        
        const room = pokersRooms[data.roomId]
        if (!room) {
          console.log(`❌ Room not found for rejoin: ${data.roomId}`)
          socket.emit('room-not-found')
          return
        }

        // Verificar si los votos deberían estar revelados basado en session data o estado actual
        const votingUsers = room.users.filter(u => u.canVote && !u.id.startsWith('disconnected_'))
        const activeVotes = Object.keys(room.votes).filter(voteId => !voteId.startsWith('disconnected_'))
        const hasVotes = activeVotes.length > 0
        
        // CRITICAL LOGIC: Prioridad para restaurar showVotes
        console.log(`📊 Rejoin logic check: hasVotes=${hasVotes}, sessionShowVotes=${data.sessionShowVotes}, sessionIsVotingComplete=${data.sessionIsVotingComplete}`)
        
        // REGLA FUNDAMENTAL: Si hay votos Y había votación completa, SIEMPRE mostrar votos
        if (hasVotes && (room.isVotingComplete || data.sessionIsVotingComplete)) {
          room.showVotes = true
          room.isVotingComplete = true
          console.log(`📊 FUNDAMENTAL RULE: Votes exist and voting was/is complete - FORCING showVotes=true`)
        }
        // Si el usuario tenía showVotes=true en su sesión, restaurar ese estado
        else if (data.sessionShowVotes && data.sessionIsVotingComplete) {
          room.showVotes = true
          room.isVotingComplete = true
          console.log(`📊 RESTORED votes state from session - user had showVotes=true`)
        }
        // Auto-reveal si todos han votado
        else if (hasVotes && votingUsers.length > 0 && activeVotes.length === votingUsers.length) {
          room.showVotes = true
          room.isVotingComplete = true
          console.log(`📊 Auto-revealing votes - all users have voted`)
        }

        // Verificar si el usuario ya existe en la sala (incluir desconectados)
        let existingUserIndex = room.users.findIndex(u => u.name === data.userName)
        
        if (existingUserIndex !== -1) {
          // Usuario existe, actualizar su socket ID
          const existingUser = room.users[existingUserIndex]
          const oldSocketId = existingUser.id
          const wasDisconnected = oldSocketId.startsWith('disconnected_')
          
          // Verificar si era el creador antes de cambiar el socket ID
          const wasCreator = room.creatorId === oldSocketId || room.creatorId.includes(oldSocketId.split('_')[1]) || 
                           (wasDisconnected && room.users.find(u => u.name === data.userName && room.creatorId.includes(u.id)))
          const wasModerator = room.moderators.includes(oldSocketId) || 
                              room.moderators.some(modId => modId.includes(oldSocketId.split('_')[1]))
          
          // Actualizar el socket ID
          existingUser.id = socket.id
          
          // Si era el creador, actualizar el creatorId
          if (wasCreator || (wasDisconnected && room.creatorId.includes(oldSocketId.split('_')[1]))) {
            room.creatorId = socket.id
            existingUser.role = 'moderator' // Asegurar que el creador tenga rol de moderador
            console.log(`✅ CREATOR ${data.userName} reconnected, creatorId updated to ${socket.id}`)
          }
          
          // Si era moderador, actualizar la lista de moderadores
          if (wasModerator) {
            room.moderators = room.moderators.filter(id => !id.includes(oldSocketId) && id !== oldSocketId)
            room.moderators.push(socket.id)
            console.log(`✅ Moderator ${data.userName} reconnected, moderator list updated`)
          }
          
          // Si había un voto con el socket ID anterior, actualízalo
          if (room.votes[oldSocketId]) {
            room.votes[socket.id] = { ...room.votes[oldSocketId], userId: socket.id }
            delete room.votes[oldSocketId]
            console.log(`📊 Restored vote for ${data.userName}: ${room.votes[socket.id].value}`)
          } else {
            // Buscar voto por nombre de usuario como fallback para reconexiones completas
            const existingVoteEntry = Object.entries(room.votes).find(([voteSocketId, vote]) => {
              const voteUser = room.users.find(u => u.id === vote.userId)
              return voteUser && voteUser.name === data.userName
            })
            
            if (existingVoteEntry) {
              const [oldVoteSocketId, userVote] = existingVoteEntry
              room.votes[socket.id] = { ...userVote, userId: socket.id }
              delete room.votes[oldVoteSocketId]
              console.log(`📊 Restored vote by username for ${data.userName}: ${room.votes[socket.id].value}`)
            }
          }
          
          socket.join(data.roomId)
          console.log(`✅ User ${data.userName} rejoined room ${data.roomId} with new socket ID. Creator: ${wasCreator}, Moderator: ${wasModerator}, WasDisconnected: ${wasDisconnected}`)
          
          // Verificar si todos los usuarios activos han votado y revelar automáticamente
          const activeUsers = room.users.filter(u => u.canVote && !u.id.startsWith('disconnected_'))
          const activeVotes = Object.keys(room.votes).filter(voteId => !voteId.startsWith('disconnected_'))
          
          if (activeUsers.length > 0 && activeVotes.length === activeUsers.length && !room.showVotes) {
            room.showVotes = true
            room.isVotingComplete = true
            console.log(`🎯 Auto-revealing votes on rejoin - all ${activeUsers.length} users have voted`)
          }
          
          socket.emit('room-rejoined', { 
            room, 
            isReconnection: true, 
            isCreator: room.creatorId === socket.id,
            debugInfo: {
              hasVotes: Object.keys(room.votes).length > 0,
              showVotes: room.showVotes,
              isVotingComplete: room.isVotingComplete,
              sessionData: { showVotes: data.sessionShowVotes, isVotingComplete: data.sessionIsVotingComplete }
            }
          })
          console.log(`📤 Sent room-rejoined event with showVotes=${room.showVotes}, isVotingComplete=${room.isVotingComplete}`)
          socket.to(data.roomId).emit('user-rejoined', { user: existingUser, room })
        } else {
          // Usuario no existe, crear nuevo usuario
          const user: User = {
            id: socket.id,
            name: data.userName,
            role: 'participant',
            canVote: true
          }

          room.users.push(user)
          socket.join(data.roomId)

          console.log(`✅ New user ${data.userName} joined room ${data.roomId} via rejoin`)
          
          // Verificar si todos los usuarios activos han votado y revelar automáticamente
          const activeUsers = room.users.filter(u => u.canVote && !u.id.startsWith('disconnected_'))
          const activeVotes = Object.keys(room.votes).filter(voteId => !voteId.startsWith('disconnected_'))
          
          if (activeUsers.length > 0 && activeVotes.length >= activeUsers.length - 1 && !room.showVotes && !data.sessionShowVotes) {
            // Si todos menos el que acaba de llegar han votado, mostrar los votos
            room.showVotes = true
            room.isVotingComplete = true
            console.log(`🎯 Auto-revealing votes for new user - voting was already complete`)
          }
          // Si el nuevo usuario tiene sesión con showVotes=true, asegurar que se mantenga
          else if (data.sessionShowVotes && data.sessionIsVotingComplete) {
            room.showVotes = true
            room.isVotingComplete = true
            console.log(`📊 Ensuring votes remain revealed for new user with session data`)
          }
          
          socket.emit('room-rejoined', { 
            room, 
            isReconnection: false,
            debugInfo: {
              hasVotes: Object.keys(room.votes).length > 0,
              showVotes: room.showVotes,
              isVotingComplete: room.isVotingComplete,
              sessionData: { showVotes: data.sessionShowVotes, isVotingComplete: data.sessionIsVotingComplete }
            }
          })
          console.log(`📤 Sent room-rejoined event for new user with showVotes=${room.showVotes}, isVotingComplete=${room.isVotingComplete}`)
          socket.to(data.roomId).emit('user-joined', { user, room })
        }
      })

      // Votar
      socket.on('vote', (data: { roomId: string; value: string }) => {
        console.log(`📝 Vote received: ${data.value} in room ${data.roomId} from ${socket.id}`)
        
        const room = pokersRooms[data.roomId]
        if (!room) {
          console.log(`❌ Room not found: ${data.roomId}`)
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        const user = room.users.find(u => u.id === socket.id)
        if (!user) {
          console.log(`❌ User not found in room for vote`)
          socket.emit('room-error', { message: 'User not found' })
          return
        }

        if (!user.canVote) {
          console.log(`❌ User ${user.name} cannot vote`)
          socket.emit('room-error', { message: 'Cannot vote' })
          return
        }

        // Registrar el voto
        room.votes[socket.id] = { value: data.value, userId: socket.id, hasVoted: true, userName: user.name }
        
        console.log(`✅ Vote registered: ${data.value} by ${user.name} (${socket.id})`)
        console.log(`📊 Current votes in room ${data.roomId}:`, Object.keys(room.votes).length)
        
        // Verificar si todos han votado
        const votingUsers = room.users.filter(u => u.canVote)
        const votesCount = Object.keys(room.votes).length
        
        console.log(`👥 Voting users: ${votingUsers.length}, votes cast: ${votesCount}`)
        
        if (votesCount === votingUsers.length) {
          room.isVotingComplete = true
          console.log(`🎯 All users have voted in room ${data.roomId}`)
        }

        // Emitir a toda la sala incluyendo al votante
        console.log(`📡 Broadcasting vote-cast to room ${data.roomId}`)
        io.to(data.roomId).emit('vote-cast', { room, votes: room.votes, isComplete: room.isVotingComplete })
        
        // También emitir al votante para confirmar
        socket.emit('vote-confirmed', { vote: data.value, room })
      })

      // Revelar votos
      socket.on('reveal-votes', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        room.showVotes = true
        room.isRevealing = true

        console.log(`Votes revealed in room: ${data.roomId}`)
        io.to(data.roomId).emit('votes-revealed', { room })
        
        // Cerrar automáticamente el modal de revelación después de 4 segundos
        setTimeout(() => {
          if (pokersRooms[data.roomId]) {
            pokersRooms[data.roomId].isRevealing = false
            console.log(`Reveal modal closed automatically in room: ${data.roomId}`)
            io.to(data.roomId).emit('reveal-modal-closed', { room: pokersRooms[data.roomId] })
          }
        }, 4000) // 4 segundos para que la animación complete
      })

      // Resetear votación (solo moderadores y creador)
      socket.on('reset-voting', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        const user = room.users.find(u => u.id === socket.id)
        if (!user || (!room.moderators.includes(user.id) && room.creatorId !== user.id)) {
          socket.emit('room-error', { message: 'Not authorized to reset voting' })
          console.log(`❌ Unauthorized reset attempt by ${user?.name || 'unknown'} (${socket.id}) in room ${data.roomId}`)
          return
        }

        room.votes = {}
        room.isVotingComplete = false
        room.showVotes = false
        room.isRevealing = false

        console.log(`Voting reset in room: ${data.roomId} by ${user.name} (${user.role})`)
        io.to(data.roomId).emit('voting-reset', { room })
      })

      // Toggle moderador puede votar
      socket.on('toggle-moderator-voting', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        const user = room.users.find(u => u.id === socket.id)
        if (!user || (!room.moderators.includes(user.id) && room.creatorId !== user.id)) {
          socket.emit('room-error', { message: 'Not authorized' })
          return
        }

        // Cambiar el estado de canVote del moderador
        user.canVote = !user.canVote
        
        // Si deja de poder votar, eliminar su voto
        if (!user.canVote && room.votes[user.id]) {
          delete room.votes[user.id]
        }

        console.log(`Moderator ${user.name} voting toggled to: ${user.canVote} in room: ${data.roomId}`)
        io.to(data.roomId).emit('moderator-voting-toggled', { room })
      })

      // Actualizar valores de votación
      socket.on('update-voting-values', (data: { roomId: string; values: string[] }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        const user = room.users.find(u => u.id === socket.id)
        if (!user || (!room.moderators.includes(user.id) && room.creatorId !== user.id)) {
          socket.emit('room-error', { message: 'Not authorized' })
          return
        }

        room.votingValues = data.values
        
        // Limpiar votos existentes al cambiar valores
        room.votes = {}
        room.isVotingComplete = false
        room.showVotes = false

        console.log(`Voting values updated in room: ${data.roomId}`, data.values)
        io.to(data.roomId).emit('voting-values-updated', { room })
      })

      // Promover a moderador
      socket.on('promote-to-moderator', (data: { roomId: string; userId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        const requester = room.users.find(u => u.id === socket.id)
        if (!requester || room.creatorId !== requester.id) {
          socket.emit('room-error', { message: 'Only creator can promote moderators' })
          return
        }

        const userToPromote = room.users.find(u => u.id === data.userId)
        if (!userToPromote) {
          socket.emit('room-error', { message: 'User not found' })
          return
        }

        if (room.moderators.includes(data.userId)) {
          socket.emit('room-error', { message: 'User is already a moderator' })
          return
        }

        // Promover a moderador
        room.moderators.push(data.userId)
        userToPromote.role = 'moderator'

        console.log(`User ${userToPromote.name} promoted to moderator in room: ${data.roomId}`)
        io.to(data.roomId).emit('user-promoted', { room, promotedUserId: data.userId })
      })

      // Degradar de moderador
      socket.on('demote-from-moderator', (data: { roomId: string; userId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        const requester = room.users.find(u => u.id === socket.id)
        if (!requester || room.creatorId !== requester.id) {
          socket.emit('room-error', { message: 'Only creator can demote moderators' })
          return
        }

        if (data.userId === room.creatorId) {
          socket.emit('room-error', { message: 'Cannot demote the creator' })
          return
        }

        const userToDemote = room.users.find(u => u.id === data.userId)
        if (!userToDemote) {
          socket.emit('room-error', { message: 'User not found' })
          return
        }

        // Quitar de moderadores
        room.moderators = room.moderators.filter(id => id !== data.userId)
        userToDemote.role = 'participant'

        console.log(`User ${userToDemote.name} demoted from moderator in room: ${data.roomId}`)
        io.to(data.roomId).emit('user-demoted', { room, demotedUserId: data.userId })
      })

      // Terminar sala
      socket.on('end-room', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        const requester = room.users.find(u => u.id === socket.id)
        if (!requester || room.creatorId !== requester.id) {
          socket.emit('room-error', { message: 'Only creator can end the room' })
          return
        }

        console.log(`Room ${data.roomId} ended by creator`)
        
        // Notificar a todos los usuarios antes de eliminar la sala
        io.to(data.roomId).emit('room-ended', { 
          roomId: data.roomId, 
          roomName: room.name,
          message: 'La sala ha sido cerrada por el creador'
        })
        
        // Eliminar la sala
        delete pokersRooms[data.roomId]
      })

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id)
        
        // Remover usuario de todas las salas
        Object.keys(pokersRooms).forEach(roomId => {
          const room = pokersRooms[roomId]
          const userIndex = room.users.findIndex(u => u.id === socket.id)
          
          if (userIndex !== -1) {
            const disconnectedUser = room.users[userIndex]
            
            // Si es el creador, no eliminar completamente sino marcar como desconectado
            if (room.creatorId === socket.id) {
              console.log(`🔑 Creator ${disconnectedUser.name} disconnected from room ${roomId}, preserving user data`)
              // Marcar como desconectado pero mantener en la lista para reconexión
              disconnectedUser.id = `disconnected_${socket.id}_${Date.now()}`
            } else {
              // Para usuarios normales, eliminar de la lista
              room.users.splice(userIndex, 1)
              // Remover de moderadores si era moderador
              room.moderators = room.moderators.filter(id => id !== socket.id)
            }
            
            // Eliminar votos del usuario desconectado
            delete room.votes[socket.id]
            
            // Si la sala está vacía (sin usuarios conectados), eliminarla después de 1 hora
            const connectedUsers = room.users.filter(u => !u.id.startsWith('disconnected_'))
            if (connectedUsers.length === 0) {
              setTimeout(() => {
                if (pokersRooms[roomId] && pokersRooms[roomId].users.filter(u => !u.id.startsWith('disconnected_')).length === 0) {
                  delete pokersRooms[roomId]
                  console.log(`Room ${roomId} deleted due to inactivity (1 hour)`)
                }
              }, 60 * 60 * 1000) // 1 hora
            } else {
              // Notificar a otros usuarios
              socket.to(roomId).emit('user-left', { 
                userId: socket.id, 
                userName: disconnectedUser.name,
                room: pokersRooms[roomId] 
              })
            }
          }
        })
      })
    })
  } else {
    console.log('✅ Socket.IO already running')
  }

  res.end()
}
