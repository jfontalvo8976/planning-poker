import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { NextApiResponseServerIO } from '../../lib/socket'

export default function SocketHandler(req: NextApiRequest, res: NextApiResponseServerIO) {
  console.log('Socket API called, method:', req.method, 'headers:', req.headers)
  
  // Manejar preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-socket-id')
    res.setHeader('Access-Control-Allow-Credentials', 'false')
    res.status(200).end()
    return
  }

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
        methods: ["GET", "POST"],
        credentials: false
      },
      transports: ['polling', 'websocket'],
      allowEIO3: true,
      pingTimeout: 60000,
      pingInterval: 25000
    })
    res.socket.server.io = io

    console.log('✅ Socket.IO server initialized successfully')
    
    io.on('connection', (socket) => {
      console.log('🎉 NEW CLIENT CONNECTED:', socket.id)
      
      socket.emit('welcome', { message: 'Welcome to Socket.IO!' })
      
      socket.on('disconnect', (reason) => {
        console.log('❌ Client disconnected:', socket.id, 'Reason:', reason)
      })
    })
  }
  res.end()
}
