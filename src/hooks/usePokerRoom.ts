'use client'

import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { PokerRoom } from '../lib/socket'
import { saveCompleteSession, clearSession, SessionData, getValidSession } from '../utils/sessionStorage'
import { clearUrlQueries } from '../utils/urlUtils'

export interface PokerRoomState {
  room: PokerRoom | null
  currentUser: string
  roomId: string
  reconnectionFailed: boolean
  usernameError: string | null
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
  clearUsernameError: () => void
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
  const [usernameError, setUsernameError] = useState<string | null>(null)

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
        
        // Incluir datos de sesión en la auto-reconexión
        const rejoinData = {
          roomId: savedRoomId,
          userName: savedUserName,
          sessionShowVotes: sessionData.showVotes || false,
          sessionIsVotingComplete: sessionData.isVotingComplete || false,
          sessionUserVote: sessionData.userVote || null, // Incluir voto del usuario
          sessionIsModerator: sessionData.isModerator || false, // NUEVO: incluir estado de moderador
          sessionIsCreator: sessionData.isCreator || false, // NUEVO: incluir estado de creador
          sessionUserRole: sessionData.userRole || 'participant', // NUEVO: incluir rol del usuario
          sessionCanVote: sessionData.userCanVote !== undefined ? sessionData.userCanVote : true // NUEVO: incluir canVote
        }
        
        console.log(`📊 Auto-reconnecting with session data:`, rejoinData)
        socket.emit('rejoin-room', rejoinData)
        
        // Timeout de seguridad más corto - si no hay respuesta en 5 segundos, marcar como fallido
        const timeoutId = setTimeout(() => {
          console.log('⚠️ Auto-reconnection timeout - marking as failed')
          setIsAutoReconnecting(false)
          setReconnectionFailed(true)
          clearAutoReconnect()
        }, 5000) // 5 segundos timeout
        
        // Limpiar timeout si se logra reconectar antes
        return () => {
          clearTimeout(timeoutId)
        }
      }
    }
  }, [socket, socket?.connected, shouldAutoReconnect, sessionData, isAutoReconnecting, room, clearAutoReconnect])

  // Efecto para restaurar showVotes inmediatamente si hay sesión válida
  useEffect(() => {
    if (room && sessionData && sessionData.showVotes && sessionData.isVotingComplete && !room.showVotes) {
      console.log('📊 [usePokerRoom] Restoring showVotes state from session storage - votes were MANUALLY revealed')
      // Crear una copia de la sala con el estado restaurado SOLO si fue revelado manualmente
      const updatedRoom = {
        ...room,
        showVotes: true,
        isVotingComplete: true
      }
      setRoom(updatedRoom)
      
      // Guardar inmediatamente para sincronizar
      if (roomId && currentUser) {
        saveCompleteSession(updatedRoom, currentUser, roomId)
      }
    }
  }, [room, sessionData, roomId, currentUser])

  // Efecto para verificar sesión al montar el componente y restaurar estado inmediatamente
  useEffect(() => {
    if (!room && sessionData && sessionData.showVotes) {
      console.log('📊 Session indicates votes were revealed, will ensure state is restored on reconnection')
    }
  }, []) // Solo al montar

  // Guardar sesión cuando se une o crea una sala, y también cuando cambia showVotes
  useEffect(() => {
    if (roomId && currentUser && room) {
      console.log('💾 Saving session - showVotes:', room.showVotes, 'isVotingComplete:', room.isVotingComplete)
      saveCompleteSession(room, currentUser, roomId)
    }
  }, [roomId, currentUser, room, room?.showVotes, room?.isVotingComplete]) // Agregar dependencias adicionales

  // Socket event listeners
  useEffect(() => {
    if (!socket) return

    const handleRoomCreated = (data: { roomId: string; room: PokerRoom }) => {
      console.log('Room created successfully:', data.roomId)
      setRoom(data.room)
      setRoomId(data.roomId)
      
      // Guardar inmediatamente la sesión del creador
      if (currentUser) {
        console.log('Saving creator session:', { roomId: data.roomId, currentUser, room: data.room })
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
      
      // CRÍTICO: Guardar sesión en TODAS las actualizaciones para mantener persistencia
      if (roomId && currentUser) {
        console.log('💾 Saving session on room update to preserve all state changes')
        saveCompleteSession(data.room, currentUser, roomId)
      }
    }

    const handleVotingReset = (data: { room: PokerRoom }) => {
      console.log('🔄 Voting reset received:', data.room.id)
      setRoom(data.room)
      
      // CRÍTICO: Actualizar sesión inmediatamente para reflejar el reset
      if (roomId && currentUser) {
        console.log('💾 [RESET] Updating session to reflect voting reset - showVotes=false')
        saveCompleteSession(data.room, currentUser, roomId)
      }
    }

    const handleVoteCast = (data: { room: PokerRoom; votes: Record<string, any>; isComplete: boolean }) => {
      console.log('📊 Vote cast update received:', data.room.id, 'votes:', Object.keys(data.votes).length)
      setRoom(data.room)
      
      // Actualizar sesión inmediatamente cuando los votos cambian - CRÍTICO para persistencia
      if (roomId && currentUser) {
        console.log('💾 Saving session immediately after vote cast to preserve vote state')
        saveCompleteSession(data.room, currentUser, roomId)
      }
    }

    const handleRoomUpdateWithSession = (data: { room: PokerRoom }) => {
      console.log('Room update received:', data)
      setRoom(data.room)
      if (roomId && currentUser) {
        saveCompleteSession(data.room, currentUser, roomId)
      }
    }

    const handleUserPromoted = (data: { room: PokerRoom; promotedUserId: string }) => {
      console.log('User promoted event received:', data.promotedUserId)
      setRoom(data.room)
      
      // CRÍTICO: Si YO fui promovido, actualizar mi sesión inmediatamente
      const currentUserData = data.room.users.find(u => u.name === currentUser)
      if (currentUserData && currentUserData.id === data.promotedUserId) {
        console.log(`🎉 [PROMOTION] I was promoted to moderator! Updating my session immediately`)
        if (roomId && currentUser) {
          saveCompleteSession(data.room, currentUser, roomId)
        }
      } else if (roomId && currentUser) {
        // Para otros usuarios, solo actualizar la sesión normalmente
        saveCompleteSession(data.room, currentUser, roomId)
      }
    }

    const handleRoomRejoined = (data: { 
      room: PokerRoom; 
      isReconnection: boolean; 
      isCreator?: boolean;
      debugInfo?: {
        hasVotes: boolean;
        showVotes: boolean;
        isVotingComplete: boolean;
        sessionData: { showVotes?: boolean; isVotingComplete?: boolean };
      }
    }) => {
      console.log('Successfully rejoined room:', data.room.id)
      console.log('📊 Debug info from server:', data.debugInfo)
      console.log('User role after rejoin:', {
        isCreator: data.isCreator,
        creatorId: data.room.creatorId,
        currentUser,
        userInRoom: data.room.users.find(u => u.name === currentUser)
      })
      
      // The server now handles showVotes restoration based on session data we sent
      console.log('📊 Room rejoined with showVotes:', data.room.showVotes, 'isVotingComplete:', data.room.isVotingComplete)
      
      // CRITICAL FIX: Solo forzar showVotes si fue REVELADO MANUALMENTE
      let finalRoom = data.room
      if (sessionData && sessionData.showVotes && sessionData.isVotingComplete) {
        console.log('🔧 FORCING showVotes restoration from session data - votes were MANUALLY revealed')
        finalRoom = {
          ...data.room,
          showVotes: true,
          isVotingComplete: true
        }
      }
      // NO forzar auto-reveal - mantener estado de votación activa
      else {
        console.log('🔧 MAINTAINING voting state - votes NOT manually revealed, keeping VotingCards visible')
        finalRoom = {
          ...data.room,
          showVotes: false // Asegurar que se mantengan las cartas de votación
        }
      }
      
      setRoom(finalRoom)
      setIsAutoReconnecting(false) // Detener el proceso de reconexión
      setReconnectionFailed(false) // Limpiar cualquier estado de fallo anterior
      
      if (roomId && currentUser) {
        saveCompleteSession(finalRoom, currentUser, roomId)
      }
      
      if (data.isReconnection) {
        console.log('Successfully reconnected to room as:', data.isCreator ? 'CREATOR' : 'participant/moderator')
      }
      
      // Limpiar la bandera de auto-reconexión - reconexión exitosa
      clearAutoReconnect()
    }

    const handleUserDemoted = (data: { room: PokerRoom; demotedUserId: string }) => {
      console.log('User demoted event received:', data.demotedUserId)
      setRoom(data.room)
      
      // CRÍTICO: Si YO fui degradado, actualizar mi sesión inmediatamente
      const currentUserData = data.room.users.find(u => u.name === currentUser)
      if (currentUserData && currentUserData.id === data.demotedUserId) {
        console.log(`📉 [DEMOTION] I was demoted from moderator! Updating my session immediately`)
        if (roomId && currentUser) {
          saveCompleteSession(data.room, currentUser, roomId)
        }
      } else if (roomId && currentUser) {
        // Para otros usuarios, solo actualizar la sesión normalmente
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
      
      // Mostrar notificación al usuario
      alert(`${data.message}: ${data.roomName}`)
      
      // Redirigir automáticamente a la página principal para crear una nueva sala
      window.location.href = '/'
    }

    const handleRevealModalClosed = (data: { room: PokerRoom }) => {
      console.log('🔒 Reveal modal closed:', data.room.id)
      setRoom(data.room)
    }

    const handleUsernameTaken = (data: { message: string }) => {
      console.log('❌ Username taken:', data.message)
      setUsernameError(data.message)
    }

    // Event listeners
    socket.on('room-created', handleRoomCreated)
    socket.on('room-joined', handleRoomJoined)
    socket.on('room-not-found', handleRoomNotFound)
    socket.on('username-taken', handleUsernameTaken)
    socket.on('user-joined', handleRoomUpdate)
    socket.on('user-left', handleRoomUpdate)
    socket.on('vote-updated', handleRoomUpdate)
    socket.on('vote-cast', handleVoteCast)
    socket.on('votes-revealed', handleRoomUpdate)
    socket.on('reveal-started', handleRoomUpdate)
    socket.on('reveal-modal-closed', handleRevealModalClosed)
    socket.on('voting-reset', handleVotingReset)
    socket.on('moderator-voting-toggled', handleRoomUpdateWithSession)
    socket.on('voting-values-updated', handleRoomUpdateWithSession)
    socket.on('user-promoted', handleUserPromoted)
    socket.on('user-demoted', handleUserDemoted)
    socket.on('room-rejoined', handleRoomRejoined)
    socket.on('user-rejoined', handleRoomUpdate)
    socket.on('room-ended', handleRoomEnded)

    return () => {
      socket.off('room-created', handleRoomCreated)
      socket.off('room-joined', handleRoomJoined)
      socket.off('room-not-found', handleRoomNotFound)
      socket.off('username-taken', handleUsernameTaken)
      socket.off('user-joined', handleRoomUpdate)
      socket.off('user-left', handleRoomUpdate)
      socket.off('vote-updated', handleRoomUpdate)
      socket.off('vote-cast', handleVoteCast)
      socket.off('votes-revealed', handleRoomUpdate)
      socket.off('reveal-started', handleRoomUpdate)
      socket.off('reveal-modal-closed', handleRevealModalClosed)
      socket.off('voting-reset', handleVotingReset)
      socket.off('moderator-voting-toggled', handleRoomUpdateWithSession)
      socket.off('voting-values-updated', handleRoomUpdateWithSession)
      socket.off('user-promoted', handleUserPromoted)
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
      console.log('🎯 [usePokerRoom] joinRoom called with:', { roomId, userName, role })
      console.log('🎯 [usePokerRoom] Socket connected?', socket.connected)
      setCurrentUser(userName)
      setRoomId(roomId)
      setUsernameError(null) // Limpiar error anterior
      socket.emit('join-room', { roomId, userName, role })
      console.log('🎯 [usePokerRoom] join-room event emitted')
    } else {
      console.error('❌ [usePokerRoom] Socket not available for joinRoom')
    }
  }

  const rejoinRoom = (roomId: string, userName: string) => {
    if (socket) {
      console.log(`Attempting to rejoin room: ${roomId} with user: ${userName}`)
      
      // Verificar si el usuario en sessionStorage era el creador
      const sessionData = getValidSession()
      if (sessionData && sessionData.isCreator) {
        console.log(`🔑 Rejoining as CREATOR: ${userName} to room ${roomId}`)
      }
      
      // Enviar datos de sesión para restaurar showVotes y voto del usuario
      const rejoinData = {
        roomId,
        userName,
        sessionShowVotes: sessionData?.showVotes || false,
        sessionIsVotingComplete: sessionData?.isVotingComplete || false,
        sessionUserVote: sessionData?.userVote || null, // Incluir voto del usuario en rejoin manual
        sessionIsModerator: sessionData?.isModerator || false, // NUEVO: incluir estado de moderador
        sessionIsCreator: sessionData?.isCreator || false, // NUEVO: incluir estado de creador
        sessionUserRole: sessionData?.userRole || 'participant', // NUEVO: incluir rol del usuario
        sessionCanVote: sessionData?.userCanVote !== undefined ? sessionData.userCanVote : true // NUEVO: incluir canVote
      }
      
      console.log(`📊 Rejoining with session data:`, rejoinData)
      
      setCurrentUser(userName)
      setRoomId(roomId)
      socket.emit('rejoin-room', rejoinData)
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

  const clearUsernameError = () => {
    setUsernameError(null)
  }

  return {
    room,
    currentUser,
    roomId,
    reconnectionFailed,
    usernameError,
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
    clearUsernameError,
  }
}
