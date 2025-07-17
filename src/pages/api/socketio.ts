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
      socket.on('rejoin-room', (data: { roomId: string; userName: string }) => {
        console.log(`🔄 Rejoin attempt: ${data.userName} to room ${data.roomId}`)
        
        const room = pokersRooms[data.roomId]
        if (!room) {
          console.log(`❌ Room not found for rejoin: ${data.roomId}`)
          socket.emit('room-not-found')
          return
        }

        // Verificar si el usuario ya existe en la sala
        const existingUserIndex = room.users.findIndex(u => u.name === data.userName)
        
        if (existingUserIndex !== -1) {
          // Usuario existe, actualizar su socket ID
          const existingUser = room.users[existingUserIndex]
          const oldSocketId = existingUser.id
          
          // Actualizar el socket ID
          existingUser.id = socket.id
          
          // Si había un voto con el socket ID anterior, actualízarlo
          if (room.votes[oldSocketId]) {
            room.votes[socket.id] = { ...room.votes[oldSocketId], userId: socket.id }
            delete room.votes[oldSocketId]
          }
          
          socket.join(data.roomId)
          console.log(`✅ User ${data.userName} rejoined room ${data.roomId} with new socket ID`)
          
          socket.emit('room-rejoined', { room, isReconnection: true, isCreator: room.creatorId === socket.id })
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
          
          socket.emit('room-rejoined', { room, isReconnection: false })
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

        // Registrar el voto
        room.votes[socket.id] = { value: data.value, userId: socket.id, hasVoted: true }
        
        console.log(`✅ Vote registered: ${data.value} by ${socket.id}`)
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

      // Resetear votación
      socket.on('reset-voting', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        room.votes = {}
        room.isVotingComplete = false
        room.showVotes = false
        room.isRevealing = false

        console.log(`Voting reset in room: ${data.roomId}`)
        io.to(data.roomId).emit('voting-reset', { room })
      })

      // Manejar desconexión
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id)
        
        // Remover usuario de todas las salas
        Object.keys(pokersRooms).forEach(roomId => {
          const room = pokersRooms[roomId]
          const userIndex = room.users.findIndex(u => u.id === socket.id)
          
          if (userIndex !== -1) {
            room.users.splice(userIndex, 1)
            delete room.votes[socket.id]
            
            // Si la sala está vacía, eliminarla después de 5 minutos
            if (room.users.length === 0) {
              setTimeout(() => {
                if (pokersRooms[roomId] && pokersRooms[roomId].users.length === 0) {
                  delete pokersRooms[roomId]
                  console.log(`Room ${roomId} deleted due to inactivity`)
                }
              }, 5 * 60 * 1000)
            } else {
              // Notificar a otros usuarios
              socket.to(roomId).emit('user-left', { 
                userId: socket.id, 
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
