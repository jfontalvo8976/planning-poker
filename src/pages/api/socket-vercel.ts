import { NextApiRequest, NextApiResponse } from 'next'
import { Server as ServerIO } from 'socket.io'
import { Server as NetServer } from 'http'
import { Socket as NetSocket } from 'net'
import { v4 as uuidv4 } from 'uuid'

// Fallback para Vercel - API endpoint simple para polling
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Respuesta de handshake básica para Socket.IO
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    // Simular respuesta de Socket.IO para handshake
    const response = {
      sid: uuidv4(),
      upgrades: ['websocket'],
      pingInterval: 25000,
      pingTimeout: 60000,
      maxPayload: 1000000
    }
    
    res.status(200).json(response)
  } else if (req.method === 'POST') {
    // Manejar mensajes de Socket.IO
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    
    // Respuesta básica para POST
    res.status(200).send('ok')
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
