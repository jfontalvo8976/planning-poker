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
    console.log('🔌 Initializing Socket.IO client...')
    
    // Verificar sesión válida
    const validSession = getValidSession()
    if (validSession) {
      console.log('Found valid session, will auto-reconnect:', validSession)
      setSessionData(validSession)
      setShouldAutoReconnect(true)
    }

    // Configuración simplificada para debugging
    const socketInstance = io({
      path: '/socket.io',
      transports: ['polling'],
      upgrade: false,
      forceNew: true,
      timeout: 10000
    })

    console.log('🔌 Socket.IO client created, waiting for connection...')
    
    // Establecer el socket inmediatamente
    setSocket(socketInstance)

    socketInstance.on('connect', () => {
      console.log('✅ CONNECTED! Socket ID:', socketInstance.id)
      setIsConnected(true)
      setSocket(socketInstance) // Asegurar que el socket se setea aquí también
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected:', reason)
      setIsConnected(false)
    })

    socketInstance.on('connect_error', (error) => {
      console.error('🔥 Connection error:', error)
      setIsConnected(false)
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
    })

    socketInstance.on('reconnect_error', (error) => {
      console.error('🔄❌ Reconnection failed:', error)
    })

    setSocket(socketInstance)

    return () => {
      console.log('🧹 Cleaning up socket connection...')
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
