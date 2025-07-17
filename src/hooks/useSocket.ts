'use client'

import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { getValidSession, SessionData } from '../utils/sessionStorage'

export interface SocketState {
  socket: Socket | null
  isConnected: boolean
  sessionData: SessionData | null
  shouldAutoReconnect: boolean
  clearAutoReconnect: () => void
}

export const useSocket = (): SocketState => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [shouldAutoReconnect, setShouldAutoReconnect] = useState(false)

  useEffect(() => {
    // Primero verificar si hay una sesión válida
    const validSession = getValidSession()
    
    if (validSession) {
      console.log('Found valid session, will auto-reconnect:', validSession)
      setSessionData(validSession)
      setShouldAutoReconnect(true)
    }

    // Conectar socket con configuración correcta para Vercel
    let socketUrl: string
    let socketPath: string
    
    if (process.env.NODE_ENV === 'production') {
      socketUrl = window.location.origin
      socketPath = '/socket.io'  // Vercel redirects this to /api/socket
    } else {
      socketUrl = 'http://localhost:3000'
      socketPath = '/socket.io'
    }
    
    console.log('🔌 Connecting to:', socketUrl, 'with path:', socketPath)
    
    // Configuración optimizada para Vercel serverless
    const socketConfig = {
      path: socketPath,
      transports: process.env.NODE_ENV === 'production' 
        ? ['polling', 'websocket']  // Polling first for Vercel compatibility
        : ['websocket', 'polling'],
      upgrade: true,
      timeout: 20000,
      forceNew: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
      withCredentials: false
    }

    let socketInstance = io(socketUrl, socketConfig)

    let connectionAttempts = 0
    const maxAttempts = 3

    const tryConnection = () => {
      connectionAttempts++
      console.log(`🔌 Connection attempt ${connectionAttempts}/${maxAttempts}`)
      
      if (connectionAttempts > maxAttempts) {
        console.error('❌ Max connection attempts reached')
        return
      }

      // En caso de error, solo intentar reconectar si no se ha conectado
      if (connectionAttempts > 1 && !socketInstance.connected) {
        console.log('🔄 Retrying connection...')
        socketInstance.connect()
      }
    }

    const setupSocketListeners = (socket: any) => {
      socket.on('connect', () => {
        console.log('✅ Connected to server successfully')
        console.log('✅ Transport:', socket.io.engine.transport.name)
        connectionAttempts = 0 // Reset counter on successful connection
        setIsConnected(true)
      })

      socket.on('disconnect', (reason: string) => {
        console.log('❌ Disconnected from server:', reason)
        setIsConnected(false)
      })

      socket.on('connect_error', (error: any) => {
        console.error('🔥 Connection error:', error)
        console.error('🔥 Error type:', error.type)
        console.error('🔥 Error description:', error.description)
        setIsConnected(false)
        
        // Solo intentar reconexión si no hemos superado max attempts
        if (connectionAttempts < maxAttempts) {
          console.log('🔄 Will retry connection...')
          setTimeout(tryConnection, 2000)
        }
      })

      socket.on('reconnect', (attemptNumber: number) => {
        console.log('🔄 Reconnected after', attemptNumber, 'attempts')
        console.log('🔄 Transport:', socket.io.engine.transport.name)
        setIsConnected(true)
      })

      socket.on('reconnect_error', (error: any) => {
        console.error('🔄❌ Reconnection failed:', error)
      })

      // Listener para upgrade de transport
      socket.io.on('upgrade', () => {
        console.log('⬆️ Upgraded to transport:', socket.io.engine.transport.name)
      })
    }

    // Setup initial listeners
    setupSocketListeners(socketInstance)

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const clearAutoReconnect = () => setShouldAutoReconnect(false)

  return { 
    socket, 
    isConnected, 
    sessionData, 
    shouldAutoReconnect,
    clearAutoReconnect
  }
}
