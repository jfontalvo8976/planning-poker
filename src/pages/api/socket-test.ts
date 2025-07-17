import { NextApiRequest } from 'next'
import { Server as ServerIO } from 'socket.io'
import { NextApiResponseServerIO } from '../../lib/socket'

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (res.socket.server.io) {
    console.log('Socket is already running')
    res.end()
    return
  }

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
    allowEIO3: true
  })

  res.socket.server.io = io

  io.on('connection', (socket) => {
    console.log('🎉 NEW CLIENT CONNECTED:', socket.id)
    
    socket.emit('welcome', { message: 'Connected to Socket.IO!' })
    
    socket.on('disconnect', (reason) => {
      console.log('Client disconnected:', socket.id, reason)
    })
    
    socket.on('test-message', (data) => {
      console.log('Test message received:', data)
      socket.emit('test-response', { received: data })
    })
  })

  console.log('✅ Socket.IO server setup complete')
  res.end()
}

export default SocketHandler
