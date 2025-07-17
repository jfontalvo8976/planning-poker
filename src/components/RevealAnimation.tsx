'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'

interface RevealAnimationProps {
  isRevealing: boolean
  onComplete: () => void
  votingValues: string[]
  votes: Record<string, { userId: string; value: string | null; hasVoted: boolean }>
}

export default function RevealAnimation({ isRevealing, onComplete, votingValues, votes }: RevealAnimationProps) {
  const [countdown, setCountdown] = useState(3)
  const [show, setShow] = useState(false)
  const [showCards, setShowCards] = useState(false)

  // Obtener valores únicos votados
  const votedValues = Object.values(votes).map(vote => vote.value).filter((value): value is string => value !== null)
  const uniqueValues = [...new Set(votedValues)]
  
  // Seleccionar algunos valores para mostrar en la animación
  const displayValues = uniqueValues.length > 0 ? uniqueValues.slice(0, 5) : votingValues.slice(0, 5)

  useEffect(() => {
    if (isRevealing) {
      setShow(true)
      setShowCards(false)
      setCountdown(3)
      
      const interval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval)
            setShowCards(true)
            
            // Auto-cerrar el modal después de 1 segundo adicional cuando las cartas se revelan
            setTimeout(() => {
              onComplete()
            }, 1000)
            
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(interval)
    } else {
      // Cuando isRevealing cambia a false, ocultar el modal
      setShow(false)
      setShowCards(false)
    }
  }, [isRevealing, onComplete])

  if (!show) return null

  return (
    <div className="w-full py-8 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 sm:p-12 text-center shadow-xl border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto animate-slide-up">
        <div className="mb-8">
          {/* Header con icono */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-xl shadow-lg animate-float">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white ">
              {countdown > 0 ? 'Revelando Votos' : '¡Revelado Completo!'}
            </h2>
          </div>
          
          <div className="relative">
            {/* Cartas animadas */}
            <div className="flex justify-center space-x-2 sm:space-x-4 mb-8">
              {displayValues.map((value, i) => (
                <div
                  key={i}
                  className={`w-12 h-20 sm:w-16 sm:h-28 bg-gradient-to-b from-indigo-400 to-indigo-600 rounded-xl shadow-xl transform transition-all duration-1000 cursor-pointer ${
                    showCards ? 'rotateY-180 scale-110' : 'rotateY-0 hover:scale-105'
                  }`}
                  style={{
                    animationDelay: `${i * 0.2}s`,
                    perspective: '1000px',
                    transformStyle: 'preserve-3d'
                  }}
                >
                  {/* Parte frontal de la carta (reverso) */}
                  <div className={`absolute inset-0 w-full h-full backface-hidden ${showCards ? 'invisible' : 'visible'}`}>
                    <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-indigo-700 rounded-xl flex items-center justify-center border-2 border-indigo-300/50 shadow-inner">
                      <div className="text-white">
                        {/* Patrón decorativo mejorado */}
                        <div className="grid grid-cols-3 gap-1 opacity-40">
                          {[...Array(9)].map((_, idx) => (
                            <div key={idx} className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white rounded-full animate-pulse" style={{animationDelay: `${idx * 0.1}s`}}></div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Parte trasera de la carta (valor) */}
                  <div className={`absolute inset-0 w-full h-full backface-hidden rotateY-180 ${showCards ? 'visible' : 'invisible'}`}>
                    <div className="w-full h-full bg-gradient-to-br from-white to-gray-50 rounded-xl flex items-center justify-center border-2 border-gray-200 shadow-lg">
                      <div className="text-2xl sm:text-4xl font-black text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text">
                        {value === '?' ? '?' : value}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Efectos de partículas mejorados */}
            {showCards && (
              <div className="absolute inset-0 flex items-center justify-center">
                {[...Array(16)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 sm:w-3 sm:h-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      left: `${50 + Math.cos(i * Math.PI / 8) * 70}%`,
                      top: `${50 + Math.sin(i * Math.PI / 8) * 70}%`,
                    }}
                  />
                ))}
                {/* Sparkles adicionales */}
                {[...Array(8)].map((_, i) => (
                  <div
                    key={`sparkle-${i}`}
                    className="absolute text-yellow-400 animate-ping"
                    style={{
                      animationDelay: `${i * 0.2 + 0.5}s`,
                      left: `${40 + Math.random() * 20}%`,
                      top: `${40 + Math.random() * 20}%`,
                    }}
                  >
                    ✨
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {countdown > 0 ? (
          <div className="space-y-4">
            <div className="text-5xl sm:text-7xl font-black text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 bg-clip-text animate-pulse">
              {countdown}
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-800 dark:text-white">
              Preparando la gran revelación...
            </div>
            <div className="text-sm text-gray-800 dark:text-white" style={{animationDelay: '0.2s'}}>
              ¡Las cartas están a punto de voltearse! 🃏
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-3xl sm:text-5xl font-black text-transparent bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 bg-clip-text animate-heartbeat">
              🎉 ¡Revelado! 🎉
            </div>
            <div className="text-base sm:text-lg text-gray-800 dark:text-white font-semibold">
              {votedValues.length > 0 
                ? `Se han revelado ${votedValues.length} voto${votedValues.length > 1 ? 's' : ''} exitosamente`
                : 'Las cartas han sido reveladas con éxito'
              }
            </div>
            <div className="text-sm text-gray-800 dark:text-white mb-4">
              Revisa los resultados y el análisis detallado 📊
            </div>
            <div className="text-xs text-gray-800 dark:text-white0 animate-pulse">
              Cerrando automáticamente en unos segundos...
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotateY-180 {
          transform: rotateY(180deg);
        }
        .rotateY-0 {
          transform: rotateY(0deg);
        }
      `}</style>
    </div>
  )
}
