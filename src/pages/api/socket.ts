import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { v4 as uuidv4 } from 'uuid'
import { NextApiResponseServerIO, pokersRooms, PokerRoom, User, getDefaultVotingValues } from '../../lib/socket'

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (res.socket.server.io) {
    console.log('Socket is already running')
    res.end()
    return
  } else {
    console.log('Socket is initializing')
    const io = new ServerIO(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true
    })
    res.socket.server.io = io

    io.on('connection', (socket) => {
      console.log('New client connected')

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

          // Verificar si el usuario ya existe (reconexión)
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

            // Verificar si todos los que pueden votar han votado
            const usersWhoCanVote = room.users.filter(u => u.canVote).length
            const votesCount = Object.keys(room.votes).length
            
            if (usersWhoCanVote === votesCount) {
              room.isVotingComplete = true
            }

            io.to(data.roomId).emit('vote-updated', { room })
          }
        }
      })

      // Revelar votos
      socket.on('reveal-votes', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          room.showVotes = true
          io.to(data.roomId).emit('votes-revealed', { room })
        }
      })

      // Reiniciar votación
      socket.on('reset-voting', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          room.votes = {}
          room.isVotingComplete = false
          room.showVotes = false
          room.isRevealing = false
          io.to(data.roomId).emit('voting-reset', { room })
        }
      })

      // Toggle moderator voting
      socket.on('toggle-moderator-voting', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          const user = room.users.find(u => u.id === socket.id)
          if (user && room.moderators.includes(user.id)) {
            user.canVote = !user.canVote
            io.to(data.roomId).emit('moderator-voting-toggled', { room })
          }
        }
      })

      // Update voting values
      socket.on('update-voting-values', (data: { roomId: string; values: string[] }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          const user = room.users.find(u => u.id === socket.id)
          if (user && room.moderators.includes(user.id)) {
            room.votingValues = data.values
            // Reset voting when values change
            room.votes = {}
            room.isVotingComplete = false
            room.showVotes = false
            room.isRevealing = false
            io.to(data.roomId).emit('voting-values-updated', { room })
          }
        }
      })

      // Promote to moderator
      socket.on('promote-to-moderator', (data: { roomId: string; userId: string }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          const requester = room.users.find(u => u.id === socket.id)
          const userToPromote = room.users.find(u => u.id === data.userId)
          
          // Only creator can promote to moderator
          if (requester && room.creatorId === requester.id && userToPromote) {
            userToPromote.role = 'moderator'
            userToPromote.canVote = true
            room.moderators.push(userToPromote.id)
            io.to(data.roomId).emit('user-promoted', { room })
          }
        }
      })

      // Demote from moderator
      socket.on('demote-from-moderator', (data: { roomId: string; userId: string }) => {
        console.log('API: Demote request received:', data)
        const room = pokersRooms[data.roomId]
        if (room) {
          const requester = room.users.find(u => u.id === socket.id)
          const userToDemote = room.users.find(u => u.id === data.userId)
          
          // Only creator can demote moderators
          if (requester && room.creatorId === requester.id && userToDemote && room.moderators.includes(data.userId)) {
            console.log('API: Demoting user:', userToDemote.name)
            userToDemote.role = 'participant'
            userToDemote.canVote = true
            // Remove from moderators list
            room.moderators = room.moderators.filter(id => id !== data.userId)
            console.log('API: New moderators list:', room.moderators)
            io.to(data.roomId).emit('user-demoted', { room, demotedUserId: data.userId })
            console.log('API: User demoted successfully')
          } else {
            console.log('API: Permission denied or user not found')
          }
        } else {
          console.log('API: Room not found')
        }
      })

      // Rejoin room (for session persistence)
      socket.on('rejoin-room', (data: { roomId: string; userName: string }) => {
        console.log(`Rejoin attempt: roomId=${data.roomId}, userName=${data.userName}`)
        const room = pokersRooms[data.roomId]
        
        if (room) {
          console.log(`Room found. Users in room: ${room.users.map(u => u.name).join(', ')}`)
          const existingUser = room.users.find(u => u.name === data.userName)
          
          if (existingUser) {
            console.log(`User ${data.userName} found in room. Updating socket ID from ${existingUser.id} to ${socket.id}`)
            // Update socket ID for reconnection
            existingUser.id = socket.id
            socket.join(data.roomId)
            socket.emit('room-rejoined', { room })
            socket.to(data.roomId).emit('user-rejoined', { user: existingUser, room })
            console.log(`User ${data.userName} successfully rejoined room ${data.roomId}`)
          } else {
            console.log(`User ${data.userName} not found in room. Available users: ${room.users.map(u => u.name).join(', ')}`)
            socket.emit('room-not-found')
          }
        } else {
          console.log(`Room ${data.roomId} not found. Available rooms: ${Object.keys(pokersRooms).join(', ')}`)
          socket.emit('room-not-found')
        }
      })

      // Reveal votes with animation
      socket.on('reveal-votes', (data: { roomId: string }) => {
        const room = pokersRooms[data.roomId]
        if (room) {
          // Start revealing animation
          room.isRevealing = true
          io.to(data.roomId).emit('votes-revealing', { room })
          
          // After animation, show actual votes
          setTimeout(() => {
            room.showVotes = true
            room.isRevealing = false
            io.to(data.roomId).emit('votes-revealed', { room })
          }, 3500) // Match RevealAnimation duration
        }
      })

      // Desconexión
      socket.on('disconnect', () => {
        console.log('Client disconnected')
        // Buscar usuario en todas las salas
        Object.values(pokersRooms).forEach(room => {
          const userIndex = room.users.findIndex(user => user.id === socket.id)
          if (userIndex >= 0) {
            const user = room.users[userIndex]
            console.log(`User ${user.name} disconnected from room ${room.id}`)
            
            // Limpiar su voto pero mantener al usuario en la sala por reconexión
            delete room.votes[socket.id]
            
            // Marcar al usuario como desconectado pero no eliminarlo inmediatamente
            // Esto permite la reconexión dentro de un período de gracia
            
            // Solo notificar a otros usuarios que se desconectó
            socket.to(room.id).emit('user-left', { userId: socket.id, room })
            
            // Después de 2 minutos, eliminar usuarios regulares (no creadores/moderadores)
            if (room.creatorId !== user.id && !room.moderators.includes(user.id)) {
              setTimeout(() => {
                const currentRoom = pokersRooms[room.id]
                if (currentRoom) {
                  const currentUserIndex = currentRoom.users.findIndex(u => u.name === user.name)
                  if (currentUserIndex >= 0) {
                    // Verificar si el usuario no se ha reconectado (mismo socket ID)
                    if (currentRoom.users[currentUserIndex].id === socket.id) {
                      currentRoom.users.splice(currentUserIndex, 1)
                      console.log(`Removed inactive user ${user.name} from room ${room.id}`)
                    }
                  }
                }
              }, 2 * 60 * 1000) // 2 minutos de gracia para reconexión
            }
            
            // Si la sala queda sin usuarios conectados, eliminarla después de 5 minutos
            setTimeout(() => {
              const currentRoom = pokersRooms[room.id]
              if (currentRoom && currentRoom.users.length === 0) {
                delete pokersRooms[room.id]
                console.log(`Room ${room.id} deleted due to inactivity`)
              }
            }, 5 * 60 * 1000) // 5 minutos
          }
        })
      })
    })
  }
  res.end()
}
