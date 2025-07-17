import { NextApiRequest } from 'next'
import { Server } from 'socket.io'
import { NextApiResponseServerIO, pokersRooms, PokerRoom, User, getDefaultVotingValues } from '../../lib/socket'
import { v4 as uuidv4 } from 'uuid'

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    console.log('🚀 Initializing Socket.IO server...')
    
    const io = new Server(res.socket.server, {
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
    console.log('✅ Socket.IO server initialized')
    
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
        socket.emit('room-created', { roomId, room })
        console.log(`Room created: ${roomId}`)
      })

      // Unirse a una sala
      socket.on('join-room', (data: { roomId: string; userName: string; role: 'participant' | 'spectator' }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          const user: User = {
            id: socket.id,
            name: data.userName,
            role: data.role,
            canVote: data.role === 'participant'
          }

          const existingUserIndex = room.users.findIndex(u => u.name === data.userName)
          if (existingUserIndex >= 0) {
            room.users[existingUserIndex] = user
          } else {
            room.users.push(user)
          }

          socket.join(data.roomId)
          socket.emit('room-joined', { room })
          socket.to(data.roomId).emit('user-joined', { user, room })
          console.log(`User ${data.userName} joined room ${data.roomId}`)
        } else {
          socket.emit('room-not-found')
        }
      })

      // Votar
      socket.on('vote', (data: { roomId: string; value: string }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          const user = room.users.find(u => u.id === socket.id)
          if (user && user.canVote) {
            room.votes[socket.id] = {
              userId: socket.id,
              value: data.value,
              hasVoted: true,
            }

            const votingUsers = room.users.filter(u => u.canVote)
            const votedUsers = Object.keys(room.votes)
            room.isVotingComplete = votingUsers.length === votedUsers.length

            io.to(data.roomId).emit('vote-updated', { 
              votes: room.votes, 
              isVotingComplete: room.isVotingComplete,
              room 
            })
            console.log(`Vote received from ${user.name}: ${data.value}`)
          }
        }
      })

      // Revelar votos
      socket.on('reveal-votes', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          const user = room.users.find(u => u.id === socket.id)
          if (user && (user.role === 'moderator' || room.moderators.includes(user.id))) {
            room.showVotes = true
            room.isRevealing = true
            io.to(data.roomId).emit('votes-revealed', { room })
            console.log(`Votes revealed in room ${data.roomId}`)
          }
        }
      })

      // Nueva ronda
      socket.on('new-round', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          const user = room.users.find(u => u.id === socket.id)
          if (user && (user.role === 'moderator' || room.moderators.includes(user.id))) {
            room.votes = {}
            room.showVotes = false
            room.isVotingComplete = false
            room.isRevealing = false
            io.to(data.roomId).emit('new-round-started', { room })
            console.log(`New round started in room ${data.roomId}`)
          }
        }
      })

      // Desconexión
      socket.on('disconnect', (reason) => {
        console.log('❌ Client disconnected:', socket.id, 'Reason:', reason)
        
        Object.values(pokersRooms).forEach(room => {
          const userIndex = room.users.findIndex(user => user.id === socket.id)
          if (userIndex >= 0) {
            const user = room.users[userIndex]
            console.log(`User ${user.name} disconnected from room ${room.id}`)
            
            delete room.votes[socket.id]
            socket.to(room.id).emit('user-left', { userId: socket.id, room })
            
            if (room.creatorId !== user.id && !room.moderators.includes(user.id)) {
              setTimeout(() => {
                const currentRoom = pokersRooms[room.id]
                if (currentRoom) {
                  const currentUserIndex = currentRoom.users.findIndex(u => u.name === user.name)
                  if (currentUserIndex >= 0 && currentRoom.users[currentUserIndex].id === socket.id) {
                    currentRoom.users.splice(currentUserIndex, 1)
                    console.log(`Removed inactive user ${user.name} from room ${room.id}`)
                  }
                }
              }, 2 * 60 * 1000)
            }
            
            setTimeout(() => {
              const currentRoom = pokersRooms[room.id]
              if (currentRoom && currentRoom.users.length === 0) {
                delete pokersRooms[room.id]
                console.log(`Room ${room.id} deleted due to inactivity`)
              }
            }, 5 * 60 * 1000)
          }
        })
      })
    })
  }
  
  // Socket.IO maneja automáticamente las respuestas cuando se inicializa correctamente
  console.log('🔄 Socket.IO handling request...')
  res.end()
}

export default SocketHandler
