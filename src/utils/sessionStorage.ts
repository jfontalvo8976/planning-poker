'use client'

import { PokerRoom } from '../lib/socket'

export interface SessionData {
  roomId: string
  userName: string
  userRole: 'participant' | 'spectator' | 'moderator'
  userCanVote: boolean
  isCreator: boolean
  isModerator: boolean
  roomName: string
  votingValues: string[]
  showVotes: boolean
  isVotingComplete: boolean
  timestamp: string
}

// Constantes
const SESSION_KEY = 'planning-poker-session'
const SESSION_MAX_AGE = 60 * 60 * 1000 // 1 hora en milisegundos

// Función para validar y obtener sesión guardada
export const getValidSession = (): SessionData | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const savedSession = localStorage.getItem(SESSION_KEY)
    if (!savedSession) return null
    
    const sessionData = JSON.parse(savedSession) as SessionData
    const { roomId, userName, timestamp } = sessionData
    
    // Verificar que la sesión no sea muy antigua (más de 1 hora)
    const sessionAge = new Date().getTime() - new Date(timestamp || 0).getTime()
    
    if (sessionAge > SESSION_MAX_AGE) {
      console.log('Session too old, clearing...')
      localStorage.removeItem(SESSION_KEY)
      return null
    }
    
    if (!roomId || !userName) return null
    
    console.log('Valid session found:', sessionData)
    return sessionData
  } catch (error) {
    console.error('Error parsing saved session:', error)
    localStorage.removeItem(SESSION_KEY)
    return null
  }
}

// Función para guardar sesión completa
export const saveCompleteSession = (roomData: PokerRoom, userName: string, roomId: string): void => {
  if (typeof window === 'undefined') return
  
  const user = roomData.users.find(u => u.name === userName)
  if (!user) return
  
  const sessionData: SessionData = {
    roomId,
    userName,
    userRole: user.role,
    userCanVote: user.canVote,
    isCreator: roomData.creatorId === user.id,
    isModerator: roomData.moderators.includes(user.id),
    roomName: roomData.name,
    votingValues: roomData.votingValues,
    showVotes: roomData.showVotes,
    isVotingComplete: roomData.isVotingComplete,
    timestamp: new Date().toISOString()
  }
  
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData))
  console.log('Complete session saved:', sessionData)
}

// Función para limpiar sesión
export const clearSession = (): void => {
  if (typeof window === 'undefined') return
  localStorage.removeItem(SESSION_KEY)
  console.log('Session storage cleared - all saved session data removed')
}
