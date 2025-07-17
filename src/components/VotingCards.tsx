'use client'

import { PokerRoom } from '../lib/socket'

interface VotingCardsProps {
  room: PokerRoom
  currentUser: string
  onVote: (value: string) => void
}

export default function VotingCards({ room, currentUser, onVote }: VotingCardsProps) {
  const currentUserData = room.users.find(u => u.name === currentUser)
  const canVote = currentUserData?.canVote
  const userVote = currentUserData ? room.votes[currentUserData.id] : null

  console.log(`🎯 VotingCards render - User: ${currentUser}, UserData:`, currentUserData, 'Vote:', userVote, 'All votes:', room.votes)

  const handleVote = (value: string) => {
    console.log(`🗳️ Voting: ${value} by user ${currentUser} (ID: ${currentUserData?.id})`)
    onVote(value)
  }

  if (!canVote) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 animate-slide-up hover-lift">
        <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
          👁️ Modo Espectador
        </h3>
        <div className="text-center py-12">
          <div className="text-8xl mb-6 animate-float">👀</div>
          <p className="text-gray-600 dark:text-gray-300 text-lg font-medium leading-relaxed">
            Estás en modo observador. Puedes seguir todo el progreso de la votación 
            <br className="hidden sm:block" />
            pero no puedes participar votando.
          </p>
          <div className="mt-6 bg-gradient-to-r from-gray-100 to-slate-100 dark:from-gray-700 dark:to-slate-700 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-full border border-gray-200 dark:border-gray-600">
            ℹ️ Solo observación
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 animate-slide-up hover-lift">
      <h3 className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6 flex items-center gap-3">
        🎯 Elige tu estimación
        {userVote?.hasVoted && (
          <span className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 animate-pulse">
            ✅ Votaste: {userVote.value}
          </span>
        )}
      </h3>
      
      <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
        {room.votingValues.map((value, index) => (
          <button
            key={value}
            onClick={() => handleVote(value)}
            className={`
              voting-card w-14 h-24 p-2 rounded-xl border-2 font-bold text-base sm:text-lg transition-all duration-300 cursor-pointer hover-scale flex items-center justify-center
              ${userVote?.value === value
                ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-emerald-400 text-white shadow-lg shadow-emerald-200/50 transform scale-105 animate-glow'
                : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg cursor-pointer'
              }
            `}
            style={{
              animationDelay: `${index * 0.05}s`
            }}
          >
            {value}
          </button>
        ))}
      </div>
      
      {userVote?.hasVoted && (
        <div className="mt-8 p-6 bg-gradient-to-r from-emerald-50/90 via-teal-50/90 to-cyan-50/90 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 border border-emerald-200/50 dark:border-emerald-800/50 rounded-xl animate-scale-in ">
          <p className="text-emerald-800 dark:text-emerald-200 text-center font-bold text-lg flex items-center justify-center gap-3">
            <span className="text-2xl">🎉</span>
            ¡Perfecto! Tu voto ha sido registrado exitosamente
            <span className="text-2xl">🎉</span>
          </p>
          <p className="text-emerald-600 dark:text-emerald-300 text-center mt-2 font-medium">
            Puedes cambiar tu estimación seleccionando otra carta cuando quieras
          </p>
        </div>
      )}
    </div>
  )
}
