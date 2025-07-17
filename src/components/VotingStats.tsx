'use client'

import { PokerRoom } from '../lib/socket'
import { TrendingUp, Target, BarChart3, TrendingDown, Activity } from 'lucide-react'

interface VotingStatsProps {
  room: PokerRoom
}

export default function VotingStats({ room }: VotingStatsProps) {
  if (!room.showVotes) return null

  const votes = Object.values(room.votes).map(v => v.value).filter(v => v !== null && v !== '?')
  if (votes.length === 0) return null

  const numericVotes = votes.map(v => parseFloat(v as string)).filter(v => !isNaN(v))
  if (numericVotes.length === 0) return null

  const sortedVotes = numericVotes.sort((a, b) => a - b)
  const avg = numericVotes.reduce((a, b) => a + b, 0) / numericVotes.length
  const min = Math.min(...numericVotes)
  const max = Math.max(...numericVotes)
  
  // Mediana
  const mid = Math.floor(sortedVotes.length / 2)
  const median = sortedVotes.length % 2 !== 0 
    ? sortedVotes[mid] 
    : (sortedVotes[mid - 1] + sortedVotes[mid]) / 2

  // Moda (valor más frecuente)
  const frequency: Record<number, number> = {}
  numericVotes.forEach(vote => {
    frequency[vote] = (frequency[vote] || 0) + 1
  })
  
  const maxFrequency = Math.max(...Object.values(frequency))
  const modes = Object.keys(frequency)
    .filter(vote => frequency[parseFloat(vote)] === maxFrequency)
    .map(vote => parseFloat(vote))

  // Distribución de votos
  const voteDistribution = Object.entries(frequency)
    .sort(([a], [b]) => parseFloat(a) - parseFloat(b))

  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 dark:border-gray-700/30 p-6 lg:p-8 mb-8">
      <div className="flex items-center mb-6">
        <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-3 rounded-xl shadow-lg mr-4">
          <BarChart3 className="w-6 h-6 text-white drop-shadow-lg" />
        </div>
        <div>
          <h2 className="text-2xl lg:text-3xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Análisis de Resultados
          </h2>
          <p className="text-gray-600 dark:text-gray-300 font-semibold mt-1">
            Estadísticas detalladas de la votación 📊
          </p>
        </div>
      </div>
      
      {/* Métricas principales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8">
        <div className="text-center p-4 lg:p-6 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl border border-white/40 dark:border-gray-600/40 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="bg-gradient-to-br from-red-500 to-pink-600 p-3 rounded-xl mb-3 w-fit mx-auto shadow-lg">
            <TrendingDown className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <div className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-2">{min}</div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 px-3 py-1 rounded-full border border-red-200 dark:border-red-800">Mínimo</div>
        </div>
        
        <div className="text-center p-4 lg:p-6 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl border border-white/40 dark:border-gray-600/40 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl mb-3 w-fit mx-auto shadow-lg">
            <Activity className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <div className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">{avg.toFixed(1)}</div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 px-3 py-1 rounded-full border border-blue-200 dark:border-blue-800">Promedio</div>
        </div>
        
        <div className="text-center p-4 lg:p-6 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl border border-white/40 dark:border-gray-600/40 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-3 rounded-xl mb-3 w-fit mx-auto shadow-lg">
            <Target className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <div className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-2">{median}</div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gradient-to-r from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">Mediana</div>
        </div>
        
        <div className="text-center p-4 lg:p-6 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-xl border border-white/40 dark:border-gray-600/40 shadow-md hover:shadow-lg transition-all duration-200">
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-3 rounded-xl mb-3 w-fit mx-auto shadow-lg">
            <TrendingUp className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <div className="text-3xl lg:text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">{max}</div>
          <div className="text-sm font-bold text-gray-600 dark:text-gray-300 bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">Máximo</div>
        </div>
      </div>

      {/* Moda */}
      {modes.length === 1 && (
        <div className="mb-6 p-4 lg:p-6 bg-gradient-to-r from-amber-50/90 via-orange-50/90 to-yellow-50/90 dark:from-amber-900/20 dark:via-orange-900/20 dark:to-yellow-900/20 backdrop-blur-sm border border-amber-200/50 dark:border-amber-800/50 rounded-2xl shadow-lg">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 rounded-xl shadow-lg mr-4">
              <Target className="w-6 h-6 text-white drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-lg font-black bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                🎯 Valor más seleccionado
              </h3>
              <p className="text-gray-700 dark:text-gray-300 font-bold">
                <span className="font-black text-2xl bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">{modes[0]}</span> 
                <span className="ml-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 text-amber-700 dark:text-amber-300 px-3 py-1 rounded-full text-sm border border-amber-200 dark:border-amber-800">con {maxFrequency} voto{maxFrequency !== 1 ? 's' : ''}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Distribución */}
      <div className="mb-6 animate-slide-in-right">
        <div className="flex items-center mb-4">
          <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-2 rounded-lg mr-3 shadow-lg">
            <BarChart3 className="w-5 h-5 text-white drop-shadow-sm" />
          </div>
          <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Distribución de votos
          </h3>
        </div>
        <div className="space-y-3">
          {voteDistribution.map(([value, count], index) => {
            const percentage = (count / numericVotes.length) * 100
            return (
              <div key={value} className="stagger-item flex items-center p-3 bg-white/60 dark:bg-gray-700/60 backdrop-blur-sm rounded-lg border border-white/40 dark:border-gray-600/40 shadow-md hover:shadow-lg transition-all duration-200" style={{animationDelay: `${index * 0.1}s`}}>
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-lg flex items-center justify-center font-bold text-lg shadow-lg">
                  {value}
                </div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200/60 dark:bg-gray-600/60 rounded-full h-3 shadow-inner backdrop-blur-sm">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-purple-600 h-3 rounded-full transition-all duration-700 animate-glow shadow-md"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900 dark:text-white">
                    {count}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    voto{count !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Consenso */}
      <div className="p-4 lg:p-6 bg-gradient-to-r from-indigo-50/90 via-purple-50/90 to-pink-50/90 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 backdrop-blur-sm border border-indigo-200/50 dark:border-indigo-800/50 rounded-xl shadow-lg animate-scale-in">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg mr-4 animate-float">
              <TrendingUp className="w-5 h-5 text-white drop-shadow-sm" />
            </div>
            <div>
              <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Nivel de Consenso
              </h3>
              <p className="text-indigo-700 dark:text-indigo-300 text-sm">
                Basado en la dispersión de votos
              </p>
            </div>
          </div>
          <div className="text-center lg:text-right">
            <div className={`inline-flex items-center px-4 py-3 rounded-xl font-bold text-lg shadow-lg backdrop-blur-sm ${
              max - min <= 2 
                ? 'bg-gradient-to-r from-green-100/90 to-emerald-100/90 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border border-green-200 dark:border-green-800'
                : max - min <= 5 
                ? 'bg-gradient-to-r from-yellow-100/90 to-amber-100/90 text-yellow-800 dark:from-yellow-900/30 dark:to-amber-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800'
                : 'bg-gradient-to-r from-red-100/90 to-pink-100/90 text-red-800 dark:from-red-900/30 dark:to-pink-900/30 dark:text-red-300 border border-red-200 dark:border-red-800'
            }`}>
              <span className="text-2xl mr-2">
                {max - min <= 2 ? '🟢' : max - min <= 5 ? '🟡' : '🔴'}
              </span>
              {max - min <= 2 ? 'Alto' : max - min <= 5 ? 'Medio' : 'Bajo'}
            </div>
            <div className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
              Diferencia: {max - min} puntos
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
