import { NextApiRequest } from 'next'
import { Server } from 'socket.io'
import { NextApiResponseServerIO } from '../../lib/socket'

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...')
    
    const io = new Server(res.socket.server, {
      path: '/api/socket',
      addTrailingSlash: false,
    })
    
    res.socket.server.io = io
    
    io.on('connection', (socket) => {
      console.log('🎉 Client connected:', socket.id)
      
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id)
      })
    })
    
    console.log('Socket.IO server ready')
  } else {
    console.log('Socket.IO server already running')
  }
  
  res.end()
}
