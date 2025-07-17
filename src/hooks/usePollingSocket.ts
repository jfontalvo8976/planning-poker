'use client'

import { useEffect, useState, useCallback } from 'react'
import { getValidSession, SessionData } from '../utils/sessionStorage'

export interface PollingSocketState {
  socket: any | null
  isConnected: boolean
  sessionData: SessionData | null
  shouldAutoReconnect: boolean
  clearAutoReconnect: () => void
}

export const usePollingSocket = (): PollingSocketState => {
  const [isConnected, setIsConnected] = useState(false)
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [shouldAutoReconnect, setShouldAutoReconnect] = useState(false)
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null)

  // Simular objeto socket con métodos para mantener compatibilidad
  const socketAPI = {
    emit: (event: string, data: any) => {
      console.log('📤 Emitting:', event, data)
      
      // Convertir eventos de Socket.IO a calls HTTP
      switch (event) {
        case 'create-room':
          return fetch('/api/polling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'create-room',
              roomId: data.roomId || generateRoomId(),
              userId: generateUserId(),
              data
            })
          })
          
        case 'join-room':
          return fetch('/api/polling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'join-room',
              roomId: data.roomId,
              userId: generateUserId(),
              data
            })
          })
          
        case 'vote':
          return fetch('/api/polling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'vote',
              roomId: data.roomId,
              userId: generateUserId(),
              data
            })
          })
          
        case 'reveal-votes':
          return fetch('/api/polling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'reveal-votes',
              roomId: data.roomId,
              userId: generateUserId(),
              data
            })
          })
          
        case 'reset-votes':
          return fetch('/api/polling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'reset-votes',
              roomId: data.roomId,
              userId: generateUserId(),
              data
            })
          })
      }
    },
    
    on: (event: string, callback: Function) => {
      console.log('👂 Listening for:', event)
      // Los eventos se manejarán via polling
    },
    
    disconnect: () => {
      console.log('🔌 Disconnecting polling...')
      if (pollingInterval) {
        clearInterval(pollingInterval)
        setPollingInterval(null)
      }
      setIsConnected(false)
    }
  }

  const startPolling = useCallback(() => {
    if (pollingInterval) return

    console.log('🔄 Starting polling...')
    setIsConnected(true)

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/polling?userId=${generateUserId()}&t=${Date.now()}`)
        if (response.ok) {
          const data = await response.json()
          console.log('📥 Poll response:', data)
          // Aquí puedes disparar eventos basados en cambios en el estado
        }
      } catch (error) {
        console.error('❌ Polling error:', error)
      }
    }, 2000) // Poll cada 2 segundos

    setPollingInterval(interval)
  }, [pollingInterval])

  useEffect(() => {
    console.log('🔌 Initializing Polling Socket...')
    
    // Verificar sesión válida
    const validSession = getValidSession()
    if (validSession) {
      console.log('Found valid session, will auto-reconnect:', validSession)
      setSessionData(validSession)
      setShouldAutoReconnect(true)
    }

    // Iniciar polling
    startPolling()

    // Cleanup
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval)
      }
    }
  }, [startPolling])

  const clearAutoReconnect = useCallback(() => {
    setShouldAutoReconnect(false)
    setSessionData(null)
  }, [])

  return {
    socket: socketAPI,
    isConnected,
    sessionData,
    shouldAutoReconnect,
    clearAutoReconnect
  }
}

// Helper functions
function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generateUserId(): string {
  return 'user_' + Math.random().toString(36).substring(2, 10)
}
