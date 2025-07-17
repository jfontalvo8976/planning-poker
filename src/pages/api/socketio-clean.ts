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
  if (!res.socket.server.io) {
    console.log('🚀 Starting Socket.IO')
    
    const io = new ServerIO(res.socket.server, {
      path: '/socket.io',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      allowEIO3: true,
      transports: ['polling', 'websocket']
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

      // Votar
      socket.on('vote', (data: { roomId: string; vote: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('room-error', { message: 'Room not found' })
          return
        }

        room.votes[socket.id] = { value: data.vote, userId: socket.id, hasVoted: true }

        console.log(`Vote cast in room ${data.roomId}: ${data.vote}`)
        
        // Verificar si todos han votado
        const votingUsers = room.users.filter(u => u.canVote)
        const votesCount = Object.keys(room.votes).length
        if (votesCount === votingUsers.length) {
          room.isVotingComplete = true
        }

        io.to(data.roomId).emit('vote-cast', { room })
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
