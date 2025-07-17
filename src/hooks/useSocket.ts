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

    // Conectar socket
    let socketUrl = 'http://localhost:3000'
    let socketPath = '/socket.io'
    
    if (process.env.NODE_ENV === 'production') {
      socketUrl = window.location.origin
      socketPath = '/api/socket'
    }
    
    console.log('Connecting to:', socketUrl, 'with path:', socketPath)
    
    const socketInstance = io(socketUrl, {
      path: socketPath,
      transports: ['polling', 'websocket'],
      upgrade: true,
      timeout: 20000,
      forceNew: false,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    })

    socketInstance.on('connect', () => {
      console.log('✅ Connected to server successfully')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server:', reason)
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
