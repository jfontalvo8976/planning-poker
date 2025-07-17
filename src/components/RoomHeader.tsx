'use client'

import { useState } from 'react'
import { PokerRoom } from '../lib/socket'
import { Users, Crown, XCircle, Share2, Copy, ExternalLink, Menu, X } from 'lucide-react'

interface RoomHeaderProps {
  room: PokerRoom
  roomId: string
  currentUser: string
  onEndRoom: () => void
}

export default function RoomHeader({ room, roomId, currentUser, onEndRoom }: RoomHeaderProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [copySuccess, setCopySuccess] = useState<'url' | 'id' | null>(null)
  
  const currentUserData = room.users.find(u => u.name === currentUser)
  const isCreator = currentUserData && room.creatorId === currentUserData.id
  const isModerator = currentUserData && room.moderators.includes(currentUserData.id)

  const roomUrl = `${window.location.origin}?room=${roomId}`

  const copyToClipboard = async (text: string, type: 'url' | 'id') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopySuccess(type)
      setTimeout(() => setCopySuccess(null), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareViaWeb = () => {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      navigator.share({
        title: `Planning Poker - ${room.name}`,
        text: `Únete a nuestra sesión de Planning Poker: ${room.name}`,
        url: roomUrl,
      })
    }
  }

  return (
    <>
      {/* Navigation Header */}
      <nav className="sticky-nav bg-white/95 dark:bg-gray-800/95 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg supports-[backdrop-filter]:bg-white/60 supports-[backdrop-filter]:dark:bg-gray-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 lg:h-20">
            
            {/* Left Section - Room Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
              <div className="bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 p-2.5 rounded-xl shadow-lg hover-scale animate-glow">
                <Users className="w-5 h-5 text-white drop-shadow-lg" />
              </div>
              
              <div className="flex-1 min-w-0">
                <h1 className="text-lg lg:text-xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent truncate">
                  {room.name}
                </h1>
                <div className="flex items-center space-x-2 text-xs lg:text-sm">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 dark:from-purple-900/30 dark:to-indigo-900/30 dark:text-purple-300">
                    👥 {room.users.length} miembros
                  </span>
                  {(isCreator || isModerator) && (
                    <div className="flex items-center space-x-1">
                      {isCreator && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md">
                          <Crown className="w-3 h-3 mr-1" />
                          Creador
                        </span>
                      )}
                      {isModerator && !isCreator && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-md">
                          <Crown className="w-3 h-3 mr-1" />
                          Moderador
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Center Section - Navigation Actions (Desktop) */}
            <div className="hidden lg:flex items-center space-x-3 flex-shrink-0">
              <button
                onClick={() => setIsShareModalOpen(true)}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all duration-200 cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-md"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Compartir
              </button>
              
              {isCreator && (
                <button
                  onClick={() => {
                    if (window.confirm('¿Estás seguro de que quieres finalizar la sala? Todos los participantes serán desconectados y la sala se eliminará permanentemente.')) {
                      onEndRoom()
                    }
                  }}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-800 rounded-lg hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 dark:hover:from-red-900/50 dark:hover:to-pink-900/50 transition-all duration-200 cursor-pointer transform hover:scale-105 shadow-sm hover:shadow-md"
                  title="Finalizar sala (solo creador)"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Finalizar
                </button>
              )}
            </div>

            {/* Right Section - Mobile Menu Button */}
            <div className="lg:hidden flex-shrink-0">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                aria-label="Menú"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 py-3 animate-fade-in">
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsShareModalOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                  className="w-full flex items-center px-3 py-2 text-sm font-medium text-indigo-700 dark:text-indigo-300 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-gradient-to-r hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/50 dark:hover:to-purple-900/50 transition-all duration-200"
                >
                  <Share2 className="w-4 h-4 mr-3" />
                  Compartir Sala
                </button>
                
                {isCreator && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      if (window.confirm('¿Estás seguro de que quieres finalizar la sala? Todos los participantes serán desconectados y la sala se eliminará permanentemente.')) {
                        onEndRoom()
                      }
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/30 border border-red-200 dark:border-red-800 rounded-lg hover:bg-gradient-to-r hover:from-red-100 hover:to-pink-100 dark:hover:from-red-900/50 dark:hover:to-pink-900/50 transition-all duration-200"
                  >
                    <XCircle className="w-4 h-4 mr-3" />
                    Finalizar Sala
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-modal-title"
        >
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-gray-500/75 dark:bg-gray-900/80 backdrop-blur-sm" 
            onClick={() => setIsShareModalOpen(false)}
            aria-hidden="true"
          />

          {/* Modal Content */}
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-2xl transform transition-all max-w-lg w-full max-h-[90vh] z-20 overflow-y-auto animate-scale-in">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg mr-3">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 
                    id="share-modal-title"
                    className="text-lg font-bold text-gray-900 dark:text-white"
                  >
                    Compartir Sala
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Invita a tu equipo a unirse
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Room Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-800">
                <h4 className="font-semibold text-indigo-800 dark:text-indigo-200 mb-1">
                  {room.name}
                </h4>
                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                  ID de la sala: <span className="font-mono font-bold">{roomId}</span>
                </p>
              </div>

              {/* Copy URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Enlace de la sala
                </label>
                <div className="flex rounded-lg shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={roomUrl}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(roomUrl, 'url')}
                    className={`px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-sm font-medium transition-all duration-200 ${
                      copySuccess === 'url'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {copySuccess === 'url' ? '✓ Copiado' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Copy Room ID */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Solo ID de la sala
                </label>
                <div className="flex rounded-lg shadow-sm">
                  <input
                    type="text"
                    readOnly
                    value={roomId}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono focus:outline-none"
                  />
                  <button
                    onClick={() => copyToClipboard(roomId, 'id')}
                    className={`px-4 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-lg text-sm font-medium transition-all duration-200 ${
                      copySuccess === 'id'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {copySuccess === 'id' ? '✓ Copiado' : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Share Actions */}
              <div className="flex space-x-3 pt-2">
                {typeof navigator !== 'undefined' && 'share' in navigator && (
                  <button
                    onClick={shareViaWeb}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Compartir
                  </button>
                )}
                <button
                  onClick={() => setIsShareModalOpen(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-gray-800 dark:text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                >
                  Cerrar
                </button>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  💡 <strong>Tip:</strong> Los miembros pueden unirse usando el enlace completo o pegando solo el ID en la página principal.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
