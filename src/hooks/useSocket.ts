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

    // Configuración optimizada para Render y desarrollo
    const socketInstance = io({
      path: '/socket.io',
      transports: ['polling', 'websocket'],
      upgrade: true,
      rememberUpgrade: true,
      forceNew: true,
      timeout: 5000,
      reconnection: true,
      reconnectionDelay: 500,
      reconnectionDelayMax: 2000,
      reconnectionAttempts: 10,
      autoConnect: true,
      // Configuración específica para Render
      withCredentials: false,
      secure: process.env.NODE_ENV === 'production'
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
      
      // Si es un error 503, mostrar mensaje específico sobre Vercel
      if (error.message.includes('503')) {
        console.error('❌ Socket.IO not supported in this environment (likely Vercel)')
        console.error('💡 This app needs to run on a server that supports persistent connections')
      }
    })

    socketInstance.on('reconnect', (attemptNumber) => {
      console.log('🔄 Reconnected after', attemptNumber, 'attempts')
      setIsConnected(true)
    })

    socketInstance.on('reconnect_error', (error) => {
      console.error('🔄❌ Reconnection failed:', error)
    })

    // Eventos específicos para debugging de votos
    socketInstance.on('vote-confirmed', (data) => {
      console.log('✅ Vote confirmed:', data)
    })

    socketInstance.on('vote-cast', (data) => {
      console.log('📊 Vote cast event received:', data)
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
