import { NextApiRequest, NextApiResponse } from 'next'

// Simple polling endpoint para Vercel
// En lugar de Socket.IO completo, usamos polling HTTP

interface PollRequest {
  roomId?: string
  userId?: string
  lastUpdate?: number
}

interface PollResponse {
  success: boolean
  data?: any
  timestamp: number
}

// Store simple en memoria (en producción usarías Redis o una DB)
const gameState: Record<string, any> = {}
const userConnections: Record<string, { lastSeen: number; roomId?: string }> = {}

export default function handler(req: NextApiRequest, res: NextApiResponse<PollResponse>) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const timestamp = Date.now()

  if (req.method === 'GET') {
    // Polling para obtener estado actual
    const { roomId, userId, lastUpdate = 0 } = req.query as PollRequest
    
    if (userId) {
      userConnections[userId] = { 
        lastSeen: timestamp, 
        roomId: roomId || userConnections[userId]?.roomId 
      }
    }

    // Cleanup de conexiones antiguas (más de 30 segundos)
    Object.keys(userConnections).forEach(id => {
      if (timestamp - userConnections[id].lastSeen > 30000) {
        delete userConnections[id]
      }
    })

    const response: PollResponse = {
      success: true,
      data: {
        room: roomId ? gameState[roomId] : null,
        connectedUsers: Object.keys(userConnections).length,
        timestamp
      },
      timestamp
    }

    res.status(200).json(response)
  } else if (req.method === 'POST') {
    // Actualizar estado del juego
    const { action, roomId, userId, data } = req.body

    if (!roomId || !userId) {
      res.status(400).json({ success: false, timestamp })
      return
    }

    // Actualizar última actividad del usuario
    userConnections[userId] = { lastSeen: timestamp, roomId }

    // Procesar acciones del juego
    switch (action) {
      case 'create-room':
        gameState[roomId] = {
          id: roomId,
          name: data.roomName,
          users: [{ id: userId, name: data.userName, role: 'moderator' }],
          votes: {},
          isVotingComplete: false,
          showVotes: false,
          createdAt: new Date(),
          lastUpdate: timestamp
        }
        break
        
      case 'join-room':
        if (gameState[roomId]) {
          const existingUser = gameState[roomId].users.find((u: any) => u.id === userId)
          if (!existingUser) {
            gameState[roomId].users.push({ id: userId, name: data.userName, role: 'participant' })
            gameState[roomId].lastUpdate = timestamp
          }
        }
        break
        
      case 'vote':
        if (gameState[roomId]) {
          gameState[roomId].votes[userId] = { value: data.vote, userId, hasVoted: true }
          gameState[roomId].lastUpdate = timestamp
        }
        break
        
      case 'reveal-votes':
        if (gameState[roomId]) {
          gameState[roomId].showVotes = true
          gameState[roomId].lastUpdate = timestamp
        }
        break
        
      case 'reset-votes':
        if (gameState[roomId]) {
          gameState[roomId].votes = {}
          gameState[roomId].showVotes = false
          gameState[roomId].isVotingComplete = false
          gameState[roomId].lastUpdate = timestamp
        }
        break
    }

    res.status(200).json({ success: true, timestamp })
  } else {
    res.status(405).json({ success: false, timestamp })
  }
}
