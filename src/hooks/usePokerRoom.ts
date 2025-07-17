'use client'

import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { PokerRoom } from '../lib/socket'
import { saveCompleteSession, clearSession, SessionData } from '../utils/sessionStorage'
import { clearUrlQueries } from '../utils/urlUtils'

export interface PokerRoomState {
  room: PokerRoom | null
  currentUser: string
  roomId: string
  reconnectionFailed: boolean
  createRoom: (userName: string, roomName: string) => void
  joinRoom: (roomId: string, userName: string, role?: 'participant' | 'spectator') => void
  rejoinRoom: (roomId: string, userName: string) => void
  vote: (value: string) => void
  revealVotes: () => void
  resetVoting: () => void
  toggleModeratorVoting: () => void
  updateVotingValues: (values: string[]) => void
  promoteToModerator: (userId: string) => void
  demoteFromModerator: (userId: string) => void
  endRoom: () => void
  clearReconnectionFailed: () => void
}

export const usePokerRoom = (
  socket: Socket | null, 
  sessionData: SessionData | null = null, 
  shouldAutoReconnect: boolean = false, 
  clearAutoReconnect: () => void
): PokerRoomState => {
  const [room, setRoom] = useState<PokerRoom | null>(null)
  const [currentUser, setCurrentUser] = useState<string>('')
  const [roomId, setRoomId] = useState<string>('')
  const [isAutoReconnecting, setIsAutoReconnecting] = useState(false)
  const [reconnectionFailed, setReconnectionFailed] = useState(false)

  // Auto-reconexión basada en sessionData
  useEffect(() => {
    if (socket && socket.connected && shouldAutoReconnect && sessionData && !isAutoReconnecting && !room) {
      console.log('Auto-reconnecting to room with session data:', sessionData)
      setIsAutoReconnecting(true)
      
      const { roomId: savedRoomId, userName: savedUserName } = sessionData
      
      if (savedRoomId && savedUserName) {
        console.log('Attempting auto-reconnection...')
        setCurrentUser(savedUserName)
        setRoomId(savedRoomId)
        socket.emit('rejoin-room', { roomId: savedRoomId, userName: savedUserName })
        
        // Limpiar la bandera de auto-reconexión después de un tiempo
        setTimeout(() => {
          setIsAutoReconnecting(false)
          clearAutoReconnect()
        }, 5000)
      }
    }
  }, [socket, socket?.connected, shouldAutoReconnect, sessionData, isAutoReconnecting, room, clearAutoReconnect])

  // Efecto adicional para reconexión inmediata cuando no hay room pero sí sesión
  useEffect(() => {
    if (socket && socket.connected && sessionData && !room && !isAutoReconnecting && !shouldAutoReconnect) {
      console.log('Immediate reconnection attempt with session data:', sessionData)
      setIsAutoReconnecting(true)
      
      const { roomId: savedRoomId, userName: savedUserName } = sessionData
      
      if (savedRoomId && savedUserName) {
        console.log('Starting immediate reconnection...')
        setCurrentUser(savedUserName)
        setRoomId(savedRoomId)
        socket.emit('rejoin-room', { roomId: savedRoomId, userName: savedUserName })
        
        setTimeout(() => {
          setIsAutoReconnecting(false)
        }, 5000)
      }
    }
  }, [socket, socket?.connected, sessionData, room, isAutoReconnecting, shouldAutoReconnect])

  // Guardar sesión cuando se une o crea una sala
  useEffect(() => {
    if (roomId && currentUser && room) {
      saveCompleteSession(room, currentUser, roomId)
    }
  }, [roomId, currentUser, room])

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleRoomCreated = (data: { roomId: string; room: PokerRoom }) => {
      console.log('Room created successfully:', data.roomId)
      setRoom(data.room)
      setRoomId(data.roomId)
      
      if (currentUser) {
        saveCompleteSession(data.room, currentUser, data.roomId)
      }
    }

    const handleRoomJoined = (data: { room: PokerRoom }) => {
      console.log('Room joined successfully:', roomId)
      setRoom(data.room)
      
      if (roomId && currentUser) {
        saveCompleteSession(data.room, currentUser, roomId)
      }
    }

    const handleRoomNotFound = () => {
      console.warn('Sala no encontrada durante reconexión')
      
      // Si estamos en proceso de auto-reconexión, no eliminar la sesión inmediatamente
      // Permitir que el usuario decida si quiere mantener o eliminar la sesión
      if (shouldAutoReconnect || isAutoReconnecting) {
        console.log('Auto-reconnection failed, but preserving session for user decision')
        setIsAutoReconnecting(false)
        setReconnectionFailed(true)
        clearAutoReconnect()
        // No llamar clearSession() aquí - dejar que el usuario decida
      } else {
        // Solo eliminar la sesión si no es una auto-reconexión
        console.error('Sala no encontrada - clearing session')
        clearSession()
        setRoom(null)
        setRoomId('')
        setCurrentUser('')
        
        // Limpiar parámetros de la URL cuando la sala no existe
        clearUrlQueries()
      }
    }

    const handleRoomUpdate = (data: { room: PokerRoom }) => {
      console.log('🔄 Room update received:', data.room.id)
      setRoom(data.room)
    }

    const handleVoteCast = (data: { room: PokerRoom; votes: Record<string, any>; isComplete: boolean }) => {
      console.log('📊 Vote cast update received:', data.room.id, 'votes:', Object.keys(data.votes).length)
      setRoom(data.room)
    }

    const handleRoomUpdateWithSession = (data: { room: PokerRoom }) => {
      console.log('Room update received:', data)
      setRoom(data.room)
      if (roomId && currentUser) {
        saveCompleteSession(data.room, currentUser, roomId)
      }
    }

    const handleRoomRejoined = (data: { room: PokerRoom; isReconnection: boolean; isCreator?: boolean }) => {
      console.log('Successfully rejoined room:', data.room.id)
      setRoom(data.room)
      setIsAutoReconnecting(false) // Detener el proceso de reconexión
      
      if (roomId && currentUser) {
        saveCompleteSession(data.room, currentUser, roomId)
      }
      
      if (data.isReconnection) {
        console.log('Successfully reconnected to room')
      }
      
      // Limpiar la bandera de auto-reconexión
      clearAutoReconnect()
    }

    const handleUserDemoted = (data: { room: PokerRoom; demotedUserId: string }) => {
      console.log('User demoted event received:', data.demotedUserId)
      setRoom(data.room)
      if (roomId && currentUser) {
        saveCompleteSession(data.room, currentUser, roomId)
      }
    }

    const handleRoomEnded = (data: { roomId: string; roomName: string; message: string }) => {
      console.log('Room ended:', data.message)
      // Limpiar todo el estado y sesión
      clearSession()
      setRoom(null)
      setRoomId('')
      setCurrentUser('')
      setReconnectionFailed(false)
      clearAutoReconnect()
      
      // Limpiar parámetros de la URL
      clearUrlQueries()
      
      // Mostrar notificación al usuario (opcional)
      alert(`${data.message}: ${data.roomName}`)
    }

    // Event listeners
    socket.on('room-created', handleRoomCreated)
    socket.on('room-joined', handleRoomJoined)
    socket.on('room-not-found', handleRoomNotFound)
    socket.on('user-joined', handleRoomUpdate)
    socket.on('user-left', handleRoomUpdate)
    socket.on('vote-updated', handleRoomUpdate)
    socket.on('vote-cast', handleVoteCast)
    socket.on('votes-revealed', handleRoomUpdate)
    socket.on('reveal-started', handleRoomUpdate)
    socket.on('voting-reset', handleRoomUpdate)
    socket.on('moderator-voting-toggled', handleRoomUpdateWithSession)
    socket.on('voting-values-updated', handleRoomUpdateWithSession)
    socket.on('user-promoted', handleRoomUpdateWithSession)
    socket.on('user-demoted', handleUserDemoted)
    socket.on('room-rejoined', handleRoomRejoined)
    socket.on('user-rejoined', handleRoomUpdate)
    socket.on('room-ended', handleRoomEnded)

    return () => {
      socket.off('room-created', handleRoomCreated)
      socket.off('room-joined', handleRoomJoined)
      socket.off('room-not-found', handleRoomNotFound)
      socket.off('user-joined', handleRoomUpdate)
      socket.off('user-left', handleRoomUpdate)
      socket.off('vote-updated', handleRoomUpdate)
      socket.off('vote-cast', handleVoteCast)
      socket.off('votes-revealed', handleRoomUpdate)
      socket.off('reveal-started', handleRoomUpdate)
      socket.off('voting-reset', handleRoomUpdate)
      socket.off('moderator-voting-toggled', handleRoomUpdateWithSession)
      socket.off('voting-values-updated', handleRoomUpdateWithSession)
      socket.off('user-promoted', handleRoomUpdateWithSession)
      socket.off('user-demoted', handleUserDemoted)
      socket.off('room-rejoined', handleRoomRejoined)
      socket.off('user-rejoined', handleRoomUpdate)
      socket.off('room-ended', handleRoomEnded)
    }
  }, [socket, roomId, currentUser])

  // Actions
  const createRoom = (userName: string, roomName: string) => {
    if (socket) {
      setCurrentUser(userName)
      socket.emit('create-room', { userName, roomName })
    }
  }

  const joinRoom = (roomId: string, userName: string, role: 'participant' | 'spectator' = 'participant') => {
    if (socket) {
      setCurrentUser(userName)
      setRoomId(roomId)
      socket.emit('join-room', { roomId, userName, role })
    }
  }

  const rejoinRoom = (roomId: string, userName: string) => {
    if (socket) {
      console.log(`Attempting to rejoin room: ${roomId} with user: ${userName}`)
      setCurrentUser(userName)
      setRoomId(roomId)
      socket.emit('rejoin-room', { roomId, userName })
    }
  }

  const vote = (value: string) => {
    if (socket && roomId) {
      console.log(`🗳️ Sending vote: ${value} to room ${roomId}`)
      socket.emit('vote', { roomId, value })
    } else {
      console.error('❌ Cannot vote: socket or roomId missing', { socket: !!socket, roomId })
    }
  }

  const revealVotes = () => {
    if (socket && roomId) {
      socket.emit('reveal-votes', { roomId })
    }
  }

  const resetVoting = () => {
    if (socket && roomId) {
      socket.emit('reset-voting', { roomId })
    }
  }

  const toggleModeratorVoting = () => {
    if (socket && roomId) {
      socket.emit('toggle-moderator-voting', { roomId })
    }
  }

  const updateVotingValues = (values: string[]) => {
    if (socket && roomId) {
      socket.emit('update-voting-values', { roomId, values })
    }
  }

  const promoteToModerator = (userId: string) => {
    if (socket && roomId) {
      socket.emit('promote-to-moderator', { roomId, userId })
    }
  }

  const demoteFromModerator = (userId: string) => {
    if (socket && roomId) {
      console.log('Demoting user:', userId, 'from room:', roomId)
      socket.emit('demote-from-moderator', { roomId, userId })
    }
  }

  const endRoom = () => {
    if (socket && roomId) {
      console.log('Ending room:', roomId)
      socket.emit('end-room', { roomId })
    }
  }

  const clearReconnectionFailed = () => {
    console.log('Clearing session and starting fresh...')
    setReconnectionFailed(false)
    clearSession() // Elimina el sessionStorage
    setRoom(null)
    setRoomId('')
    setCurrentUser('')
    
    // Limpiar parámetros de la URL
    clearUrlQueries()
  }

  return {
    room,
    currentUser,
    roomId,
    reconnectionFailed,
    createRoom,
    joinRoom,
    rejoinRoom,
    vote,
    revealVotes,
    resetVoting,
    toggleModeratorVoting,
    updateVotingValues,
    promoteToModerator,
    demoteFromModerator,
    endRoom,
    clearReconnectionFailed,
  }
}
