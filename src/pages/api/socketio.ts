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
  if (res.socket.server.io) {
    console.log('✅ Socket.IO already running')
  } else {
    console.log('🚀 Starting Socket.IO')

    const io = new ServerIO(res.socket.server, {
      path: '/api/socketio',
      addTrailingSlash: false,
    })

    res.socket.server.io = io

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

        console.log(`Room created: ${roomId}`)
        socket.emit('room-created', { roomId, room })
      })

      // Unirse a una sala
      socket.on('join-room', (data: { roomId: string; userName: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) {
          socket.emit('error', { message: 'Room not found' })
          return
        }

        const existingUser = room.users.find(u => u.name === data.userName)
        if (existingUser) {
          socket.emit('error', { message: 'Username already taken' })
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

        console.log(`User ${data.userName} joined room ${data.roomId}`)
        
        socket.emit('joined-room', { roomId: data.roomId, room })
        socket.to(data.roomId).emit('user-joined', { user, room })
      })

      // Votar
      socket.on('vote', (data: { roomId: string; vote: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) return

        room.votes[socket.id] = { value: data.vote, userId: socket.id, hasVoted: true }
        
        const votingUsers = room.users.filter(u => u.canVote)
        const hasEveryoneVoted = votingUsers.every(user => room.votes[user.id])
        
        if (hasEveryoneVoted) {
          room.isVotingComplete = true
        }

        console.log(`Vote received from ${socket.id}: ${data.vote}`)
        io.to(data.roomId).emit('vote-updated', { room })
      })

      // Mostrar votos
      socket.on('reveal-votes', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) return

        const user = room.users.find(u => u.id === socket.id)
        if (!user || user.role !== 'moderator') return

        room.showVotes = true
        room.isRevealing = true

        console.log(`Votes revealed for room ${data.roomId}`)
        io.to(data.roomId).emit('votes-revealed', { room })
      })

      // Nueva ronda
      socket.on('new-round', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (!room) return

        const user = room.users.find(u => u.id === socket.id)
        if (!user || user.role !== 'moderator') return

        room.votes = {}
        room.isVotingComplete = false
        room.showVotes = false
        room.isRevealing = false

        console.log(`New round started for room ${data.roomId}`)
        io.to(data.roomId).emit('new-round-started', { room })
      })

      // Desconexión
      socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id)
        
        for (const roomId in pokersRooms) {
          const room = pokersRooms[roomId]
          const userIndex = room.users.findIndex(u => u.id === socket.id)
          
          if (userIndex !== -1) {
            const user = room.users[userIndex]
            room.users.splice(userIndex, 1)
            delete room.votes[socket.id]
            
            if (room.users.length === 0) {
              delete pokersRooms[roomId]
              console.log(`Room ${roomId} deleted - no users`)
            } else {
              socket.to(roomId).emit('user-left', { user, room })
            }
            break
          }
        }
      })
    })

    console.log('✅ Socket.IO initialized')
  }
  
  res.end()
}
