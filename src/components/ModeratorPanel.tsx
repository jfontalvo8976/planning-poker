'use client'

import { useState } from 'react'
import { PokerRoom } from '../lib/socket'
import { RotateCcw, Edit3, Coffee, UserCheck, UserX, Eye } from 'lucide-react'

interface ModeratorPanelProps {
  room: PokerRoom
  currentUser: string
  onRevealVotes: () => void
  onResetVoting: () => void
  onToggleModeratorVoting: () => void
  onUpdateVotingValues: (values: string[]) => void
  onPromoteToModerator?: (userId: string) => void
}

export default function ModeratorPanel({
  room,
  currentUser,
  onRevealVotes,
  onResetVoting,
  onToggleModeratorVoting,
  onUpdateVotingValues,
  onPromoteToModerator,
}: ModeratorPanelProps) {
  const [customValues, setCustomValues] = useState(room.votingValues.join(', '))
  const [isEditingValues, setIsEditingValues] = useState(false)
  
  const currentUserData = room.users.find(u => u.name === currentUser)
  const isCreator = currentUserData && room.creatorId === currentUserData.id
  const isModerator = currentUserData && (
    room.creatorId === currentUserData.id || 
    room.moderators.includes(currentUserData.id) ||
    currentUserData.role === 'moderator' // NUEVO: También verificar por rol
  )

  // DEBUG: Log para diagnosticar problemas de permisos
  console.log('🔍 [ModeratorPanel] Permission check:', {
    currentUser,
    currentUserData,
    currentUserId: currentUserData?.id,
    currentUserRole: currentUserData?.role,
    roomCreatorId: room.creatorId,
    roomModerators: room.moderators,
    isCreator,
    isModerator,
    shouldShowPanel: !!isModerator
  })

  const handleUpdateVotingValues = () => {
    const values = customValues
      .split(',')
      .map(v => v.trim())
      .filter(v => v.length > 0)
      
    if (values.length > 0) {
      onUpdateVotingValues(values)
      setIsEditingValues(false)
    }
  }

  if (!isModerator) return null

  const votedUsers = Object.keys(room.votes).length
  const totalUsers = room.users.filter(u => u.canVote).length
  const allVoted = votedUsers === totalUsers && totalUsers > 0
  const canReveal = votedUsers > 0 && allVoted // Solo se puede revelar cuando todos hayan votado

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-6 hover-lift animate-slide-in-right">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-2 rounded-xl shadow-lg">
          <Coffee className="w-5 h-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent font-bold text-xl">
          Panel de Control
        </span>
      </h3>

      {/* Progreso de votación */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-700 dark:text-gray-300 font-semibold">
            Progreso de votación
            {allVoted && (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-bold animate-pulse">
                ✅ ¡Listos para revelar!
              </span>
            )}
          </span>
          <span className="text-gray-600 dark:text-gray-400 font-bold">{votedUsers}/{totalUsers} votos</span>
        </div>
        <div className="w-full bg-gray-700 dark:bg-gray-700 rounded-full h-3 overflow-hidden shadow-inner ">
          <div 
            className={`h-3 rounded-full transition-all duration-500 ease-out ${
              allVoted 
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg animate-glow'
                : 'bg-gradient-to-r from-indigo-500 to-purple-600 shadow-md'
            }`}
            style={{ 
              width: `${totalUsers > 0 ? (votedUsers / totalUsers) * 100 : 0}%`,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
          />
        </div>
        {!allVoted && votedUsers > 0 && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            ⏳ Esperando a {totalUsers - votedUsers} participante{totalUsers - votedUsers !== 1 ? 's' : ''} más...
          </p>
        )}
      </div>

      {/* Botones de acción */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <button
          onClick={onRevealVotes}
          disabled={!canReveal}
          className={`
            bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border border-transparent rounded-xl shadow-lg font-bold py-3 px-4 transition-all duration-200 cursor-pointer transform hover:scale-105 flex items-center gap-2 justify-center hover-scale
            ${allVoted ? 'animate-glow' : ''}
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:from-gray-400 disabled:to-gray-500
          `}
          title={!canReveal ? "Espera a que todos los participantes voten" : "Revelar votos"}
        >
          <Eye className="w-4 h-4" />
          {allVoted ? '🎉 Revelar Todos' : `Revelar (${votedUsers}/${totalUsers})`}
        </button>

        <button
          onClick={onResetVoting}
          className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border border-transparent rounded-xl shadow-lg font-bold py-3 px-4 transition-all duration-200 cursor-pointer transform hover:scale-105 flex items-center gap-2 justify-center hover-scale"
        >
          <RotateCcw className="w-4 h-4" />
          Reiniciar
        </button>

        <button
          onClick={onToggleModeratorVoting}
          className={`border border-transparent rounded-xl shadow-lg font-bold py-3 px-4 transition-all duration-200 cursor-pointer transform hover:scale-105 flex items-center gap-2 justify-center hover-scale ${
            currentUserData?.canVote 
              ? 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
              : 'bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white'
          }`}
        >
          {currentUserData?.canVote ? (
            <>
              <UserCheck className="w-4 h-4" />
              Puedo votar
            </>
          ) : (
            <>
              <UserX className="w-4 h-4" />
              No voto
            </>
          )}
        </button>

        <button
          onClick={() => setIsEditingValues(!isEditingValues)}
          className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border border-transparent rounded-xl shadow-lg font-bold py-3 px-4 transition-all duration-200 cursor-pointer transform hover:scale-105 flex items-center gap-2 justify-center hover-scale"
        >
          <Edit3 className="w-4 h-4" />
          Valores
        </button>
      </div>

      {/* Editor de valores de votación */}
      {isEditingValues && (
        <div className="bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20  rounded-xl p-5 border border-indigo-200/50 dark:border-indigo-800/50 shadow-lg animate-scale-in">
          <h4 className="text-base font-bold mb-4 flex items-center gap-2">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-1.5 rounded-lg shadow-lg">
              <Edit3 className="w-4 h-4 text-white" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Personalizar valores de votación
            </span>
          </h4>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={customValues}
              onChange={(e) => setCustomValues(e.target.value)}
              placeholder="Ej: 0, 1, 2, 3, 5, 8, 13, ?"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200"
            />
            <div className="flex gap-3">
              <button
                onClick={handleUpdateVotingValues}
                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border border-transparent rounded-xl shadow-lg font-bold px-6 py-3 transition-all duration-200 cursor-pointer transform hover:scale-105"
              >
                Guardar
              </button>
              <button
                onClick={() => setIsEditingValues(false)}
                className="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white border border-transparent rounded-xl shadow-lg font-bold px-6 py-3 transition-all duration-200 cursor-pointer transform hover:scale-105"
              >
                Cancelar
              </button>
            </div>
          </div>
          <p className="text-sm text-indigo-700 dark:text-indigo-300 mt-3 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-lg p-2 font-medium">
            💡 Separa los valores con comas. Ejemplo: 0, 1, 2, 3, 5, 8, 13, 21, ?
          </p>
        </div>
      )}
    </div>
  )
}