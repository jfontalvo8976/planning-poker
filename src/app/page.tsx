'use client'

import { useEffect } from 'react'
import { useSocket } from '../hooks/useSocket'
import { usePokerRoom } from '../hooks/usePokerRoom'
import { getUrlQuery } from '../utils/urlUtils'
import JoinCreateRoom from '../components/JoinCreateRoom'
import PokerRoom from '../components/PokerRoom'

export default function Home() {
  // Usar siempre Socket.IO por ahora - resolver el problema de Vercel después
  const { socket, isConnected, sessionData, shouldAutoReconnect, clearAutoReconnect } = useSocket()
  
  console.log('Socket state:', { socket, isConnected, sessionData, shouldAutoReconnect })
  
  const {
    room,
    currentUser,
    roomId,
    reconnectionFailed,
    createRoom,
    joinRoom,
    vote,
    revealVotes,
    resetVoting,
    toggleModeratorVoting,
    updateVotingValues,
    promoteToModerator,
    demoteFromModerator,
    endRoom,
    clearReconnectionFailed,
  } = usePokerRoom(socket, sessionData, shouldAutoReconnect, clearAutoReconnect)

  useEffect(() => {
    // Check if there's a room ID in the URL
    const roomIdFromUrl = getUrlQuery('room')
    
    // Si hay un roomId en la URL y es diferente al guardado en sessionStorage, limpiar el storage
    if (roomIdFromUrl && sessionData && sessionData.roomId !== roomIdFromUrl) {
      console.log('URL room ID differs from stored session, clearing storage and URL')
      console.log('URL room ID:', roomIdFromUrl, 'Stored room ID:', sessionData.roomId)
      clearReconnectionFailed() // Esto limpia la sesión y también la URL
    }
  }, [sessionData, clearReconnectionFailed])


  if (room) {
    return (
      <PokerRoom
        room={room}
        currentUser={currentUser}
        roomId={roomId}
        onVote={vote}
        onRevealVotes={revealVotes}
        onResetVoting={resetVoting}
        onToggleModeratorVoting={toggleModeratorVoting}
        onUpdateVotingValues={updateVotingValues}
        onPromoteToModerator={promoteToModerator}
        onDemoteFromModerator={demoteFromModerator}
        onEndRoom={endRoom}
      />
    )
  }

  // Si la reconexión falló, mostrar opciones al usuario
  if (reconnectionFailed && sessionData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-all duration-500">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-8 text-center max-w-md mx-auto animate-scale-in hover-lift">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-amber-500 via-orange-600 to-red-600 rounded-full flex items-center justify-center shadow-lg">
            <span className="text-3xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent mb-2 animate-slide-in-left">
            No se pudo reconectar
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 animate-fade-in">
            La sala guardada no está disponible o ya no existe.
          </p>
          <div className="mb-6 p-3 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-sm text-amber-700 dark:text-amber-300 font-medium mb-2">Sesión guardada:</p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Sala: <span className="font-medium">{sessionData.roomName}</span><br/>
              Usuario: <span className="font-medium">{sessionData.userName}</span>
            </p>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                if (sessionData.roomId && sessionData.userName) {
                  joinRoom(sessionData.roomId, sessionData.userName, 'participant')
                }
              }}
              className="w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 hover:from-indigo-600 hover:via-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105"
            >
              Intentar reconectar
            </button>
            <button
              onClick={clearReconnectionFailed}
              className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl cursor-pointer transform hover:scale-105"
            >
              Empezar de nuevo
            </button>
          </div>
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Estado de conexión: {isConnected ? '✅ Conectado' : '⏳ Conectando...'}
          </div>
        </div>
      </div>
    )
  }

  // Mostrar pantalla de reconexión solo si shouldAutoReconnect está activo
  if (shouldAutoReconnect) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-all duration-500">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-8 text-center max-w-md mx-auto animate-scale-in hover-lift">
          <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-full flex items-center justify-center shadow-lg animate-spin">
            <div className="w-8 h-8 border-3 border-white border-t-transparent rounded-full"></div>
          </div>
          <h2 className="text-xl font-semibold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 animate-slide-in-left">
            Reconectando...
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4 animate-fade-in">
            Restaurando tu sesión anterior
            {sessionData && (
              <span className="block text-sm bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-medium mt-2 animate-slide-in-up">
                Sala: {sessionData.roomName} | Usuario: {sessionData.userName}
              </span>
            )}
          </p>
          
          {/* Iconos de roles mientras reconecta */}
          <div className="mb-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-200 dark:border-indigo-800 animate-fade-in">
            <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-medium">Iconos de roles en la sala:</div>
            <div className="flex justify-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 rounded-full shadow-sm">
                  <span className="text-white text-[0.6rem] w-3 h-3 flex items-center justify-center">👑</span>
                </div>
                <span className="text-amber-700 dark:text-amber-300 font-medium">Creador</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5 rounded-full shadow-sm">
                  <span className="text-white text-[0.6rem] w-3 h-3 flex items-center justify-center">⭐</span>
                </div>
                <span className="text-emerald-700 dark:text-emerald-300 font-medium">Moderador</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="bg-gradient-to-br from-indigo-400 to-purple-500 p-0.5 rounded-full shadow-sm">
                  <span className="text-white text-[0.6rem] w-3 h-3 flex items-center justify-center">👤</span>
                </div>
                <span className="text-indigo-700 dark:text-indigo-300 font-medium">Participante</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="bg-gradient-to-br from-gray-400 to-slate-500 p-0.5 rounded-full shadow-sm">
                  <span className="text-white text-[0.6rem] w-3 h-3 flex items-center justify-center">👁️</span>
                </div>
                <span className="text-gray-700 dark:text-gray-300 font-medium">Observador</span>
              </div>
            </div>
          </div>
          
          <div className="mb-4">
            <button
              onClick={clearAutoReconnect}
              className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer transform hover:scale-105"
            >
              Cancelar reconexión
            </button>
          </div>
          
          <div className="text-xs text-gray-500 dark:text-gray-400 animate-pulse">
            Estado de conexión: {isConnected ? '✅ Conectado' : '⏳ Conectando...'}
          </div>
        </div>
      </div>
    )
  }

  return (
    <JoinCreateRoom
      onCreateRoom={createRoom}
      onJoinRoom={(roomId, userName, role) => joinRoom(roomId, userName, role)}
      isConnected={isConnected}
      sessionData={sessionData}
    />
  )
}
