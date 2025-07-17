'use client'

import { PokerRoom, User, Vote } from '../lib/socket'
import { Crown, Star, UserPlus, UserMinus } from 'lucide-react'

interface UserListProps {
  room: PokerRoom
  currentUser: string
  onPromoteToModerator: (userId: string) => void
  onDemoteFromModerator: (userId: string) => void
}

export default function UserList({ room, currentUser, onPromoteToModerator, onDemoteFromModerator }: UserListProps) {
  const currentUserData = room.users.find(u => u.name === currentUser)
  const isCreator = currentUserData && room.creatorId === currentUserData.id

  console.log(`👥 UserList render - Users: ${room.users.length}, Votes:`, room.votes, 'ShowVotes:', room.showVotes)

  const getUserVote = (userId: string): Vote | undefined => {
    return room.votes[userId]
  }

  const getVoteDisplay = (user: User) => {
    const vote = getUserVote(user.id)
    
    if (!user.canVote) {
      return (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 border border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-500 dark:text-gray-400 shadow-md">
          👁️
        </div>
      )
    }

    if (!vote?.hasVoted) {
      return (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-700 border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 shadow-md">
          ?
        </div>
      )
    }

    if (room.showVotes && vote.value) {
      return (
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 text-white flex items-center justify-center text-sm font-bold shadow-lg animate-glow">
          {vote.value}
        </div>
      )
    }

    return (
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center text-xs shadow-lg animate-pulse">
        ✓
      </div>
    )
  }

  const getRoleIcon = (user: User) => {
    // Priorizar la lista de moderadores sobre el role del usuario
    if (room.creatorId === user.id) {
      return (
        <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-1 rounded-full shadow-md">
          <Crown className="w-3 h-3 text-white drop-shadow-sm" />
        </div>
      )
    }
    if (room.moderators.includes(user.id)) {
      return (
        <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-1 rounded-full shadow-md">
          <Star className="w-3 h-3 text-white drop-shadow-sm" />
        </div>
      )
    }
    if (!user.canVote || user.role === 'spectator') {
      return (
        <div className="bg-gradient-to-br from-gray-400 to-slate-500 p-1 rounded-full shadow-md">
          <span className="text-white text-xs">👁️</span>
        </div>
      )
    }
    return (
      <div className="bg-gradient-to-br from-indigo-400 to-purple-500 p-1 rounded-full shadow-md">
        <span className="text-white text-xs">👤</span>
      </div>
    )
  }

  const getRoleText = (user: User) => {
    if (room.creatorId === user.id) return 'Creador'
    if (room.moderators.includes(user.id)) return 'Moderador'
    if (user.role === 'spectator') return 'Espectador'
    return 'Participante'
  }

  const canPromoteUser = (user: User) => {
    const result = isCreator && 
                   room.creatorId !== user.id && 
                   !room.moderators.includes(user.id) &&
                   user.role !== 'spectator'
    return result
  }

  const canDemoteUser = (user: User) => {
    const result = isCreator && 
                   room.creatorId !== user.id && 
                   room.moderators.includes(user.id)
    console.log(`Can demote ${user.name}:`, result, 'isCreator:', isCreator, 'moderators:', room.moderators, 'userId:', user.id)
    return result
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
      <h3 className="text-xl font-bold mb-6 flex flex-col gap-3">
        <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          👥 Lista de Usuarios ({room.users.length})
        </span>
        {isCreator && (
          <span className="text-sm bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800 flex items-center gap-2">
            👑 Usa <UserPlus className="w-3 h-3" /> para promover y <UserMinus className="w-3 h-3" /> para degradar moderadores
          </span>
        )}
        {/* Leyenda de iconos de roles */}
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-1 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 px-2 py-1 rounded-full">
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 rounded-full">
              <Crown className="w-2 h-2 text-white" />
            </div>
            <span className="text-amber-700 dark:text-amber-300 font-medium">Creador</span>
          </div>
          <div className="flex items-center gap-1 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 px-2 py-1 rounded-full">
            <div className="bg-gradient-to-br from-emerald-400 to-teal-500 p-0.5 rounded-full">
              <Star className="w-2 h-2 text-white" />
            </div>
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">Moderador</span>
          </div>
          <div className="flex items-center gap-1 bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 px-2 py-1 rounded-full">
            <div className="bg-gradient-to-br from-indigo-400 to-purple-500 p-0.5 rounded-full">
              <span className="text-white text-[0.5rem]">👤</span>
            </div>
            <span className="text-indigo-700 dark:text-indigo-300 font-medium">Participante</span>
          </div>
          <div className="flex items-center gap-1 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700/30 dark:to-slate-700/30 px-2 py-1 rounded-full">
            <div className="bg-gradient-to-br from-gray-400 to-slate-500 p-0.5 rounded-full">
              <span className="text-white text-[0.5rem]">👁️</span>
            </div>
            <span className="text-gray-700 dark:text-gray-300 font-medium">Observador</span>
          </div>
        </div>
      </h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {room.users.map((user, index) => (
          <div
            key={user.id}
            className={`
              p-4 rounded-xl border-2 transition-all duration-200
              ${user.name === currentUser 
                ? 'bg-gradient-to-r from-indigo-100/80 to-purple-100/80 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-400 dark:border-indigo-600 shadow-md' 
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md'
              }
            `}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  {getRoleIcon(user) && (
                    <div>
                      {getRoleIcon(user)}
                    </div>
                  )}
                  <span className={`
                    text-sm font-semibold truncate
                    ${user.name === currentUser ? 'text-indigo-800 dark:text-indigo-200' : 'text-gray-700 dark:text-gray-300'}
                  `}>
                    {user.name}
                  </span>
                </div>
                
                {/* Botones de moderación */}
                <div className="flex items-center gap-1">
                  {canPromoteUser(user) && (
                    <button
                      onClick={() => onPromoteToModerator(user.id)}
                      className="p-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg transition-all duration-200 cursor-pointer group shadow-md hover:shadow-lg transform hover:scale-105 animate-pulse"
                      title="Promover a moderador"
                    >
                      <UserPlus className="w-3.5 h-3.5 drop-shadow-sm" />
                    </button>
                  )}
                  {canDemoteUser(user) && (
                    <button
                      onClick={() => {
                        console.log('Demoting user:', user.name, 'ID:', user.id)
                        onDemoteFromModerator(user.id)
                      }}
                      className="p-1.5 bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 text-white rounded-lg transition-all duration-200 cursor-pointer group shadow-md hover:shadow-lg transform hover:scale-105"
                      title="Quitar permisos de moderador"
                    >
                      <UserMinus className="w-3.5 h-3.5 drop-shadow-sm" />
                    </button>
                  )}
                </div>
              </div>
              <div>
                {getVoteDisplay(user)}
              </div>
            </div>
            
            <div className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {getRoleText(user)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
