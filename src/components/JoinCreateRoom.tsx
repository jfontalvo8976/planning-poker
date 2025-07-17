'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, LogIn } from 'lucide-react'
import { getUrlQuery } from '../utils/urlUtils'

interface JoinCreateRoomProps {
  onCreateRoom: (userName: string, roomName: string) => void
  onJoinRoom: (roomId: string, userName: string, role: 'participant' | 'spectator') => void
  isConnected: boolean
  sessionData?: {
    roomId: string
    userName: string
    roomName: string
  } | null
}

export default function JoinCreateRoom({ onCreateRoom, onJoinRoom, isConnected, sessionData }: JoinCreateRoomProps) {
  const [userName, setUserName] = useState('')
  const [roomName, setRoomName] = useState('')
  const [roomId, setRoomId] = useState('')
  const [activeTab, setActiveTab] = useState<'create' | 'join'>('create')
  const [userRole, setUserRole] = useState<'participant' | 'spectator'>('participant')

  useEffect(() => {
    const roomIdFromUrl = getUrlQuery('room')
    
    // Pre-llenar con datos de sesión si están disponibles
    if (sessionData) {
      setUserName(sessionData.userName)
      setRoomName(sessionData.roomName)
      setRoomId(sessionData.roomId)
      setActiveTab('join')
    } else if (roomIdFromUrl) {
      setRoomId(roomIdFromUrl)
      setActiveTab('join')
    }
  }, [sessionData])

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (userName.trim() && roomName.trim()) {
      onCreateRoom(userName.trim(), roomName.trim())
    }
  }

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (userName.trim() && roomId.trim()) {
      onJoinRoom(roomId.trim(), userName.trim(), userRole)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4 transition-all duration-500">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-4 rounded-2xl shadow-xl animate-float">
              <Users className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            Planning Poker
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
            Estima tareas de Jira en tiempo real con tu equipo
          </p>
          <div className="animate-scale-in">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 dark:from-green-900/30 dark:to-emerald-900/30 dark:text-green-300 border border-green-200 dark:border-green-800">
              <div className="w-3 h-3 rounded-full mr-2 bg-green-500 animate-pulse"></div>
              {isConnected ? '✅ Conectado' : '⏳ Conectando...'}
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 lg:p-8 hover-lift animate-slide-up" style={{animationDelay: '0.3s'}}>
          <div className="flex mb-8">
            <button
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-l-xl border transition-all duration-200 cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-lg animate-glow'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 dark:border-gray-600 hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-600 dark:hover:to-gray-500'
              }`}
            >
              <Plus className="w-4 h-4 inline mr-2" />
              Crear Sala
            </button>
            <button
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-3 px-6 text-sm font-semibold rounded-r-xl border-t border-r border-b transition-all duration-200 cursor-pointer ${
                activeTab === 'join'
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-indigo-500 shadow-lg animate-glow'
                  : 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 border-gray-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-300 dark:border-gray-600 hover:from-indigo-50 hover:to-purple-50 dark:hover:from-gray-600 dark:hover:to-gray-500'
              }`}
            >
              <LogIn className="w-4 h-4 inline mr-2" />
              Unirse a Sala
            </button>
          </div>

          {activeTab === 'create' ? (
            <form onSubmit={handleCreateRoom} className="space-y-6 animate-fade-in">
              <div className="stagger-item">
                <label htmlFor="userName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tu nombre
                </label>
                <input
                  type="text"
                  id="userName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                  placeholder="Ingresa tu nombre"
                  required
                />
              </div>
              <div className="stagger-item">
                <label htmlFor="roomName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Nombre de la sala
                </label>
                <input
                  type="text"
                  id="roomName"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                  placeholder="Ej: Sprint 24 - Historias de Usuario"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={!isConnected || !userName.trim() || !roomName.trim()}
                className="stagger-item w-full btn-gradient flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer transform hover:scale-105 disabled:transform-none"
              >
                <Plus className="w-5 h-5 mr-2" />
                Crear Sala
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-6 animate-fade-in">
              <div className="stagger-item">
                <label htmlFor="joinUserName" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Tu nombre
                </label>
                <input
                  type="text"
                  id="joinUserName"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:shadow-md"
                  placeholder="Ingresa tu nombre"
                  required
                />
              </div>
              <div className="stagger-item">
                <label htmlFor="roomId" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  ID de la sala
                </label>
                <input
                  type="text"
                  id="roomId"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white transition-all duration-200 hover:shadow-md font-mono"
                  placeholder="Pega el ID de la sala aquí"
                  required
                />
              </div>
              <div className="stagger-item">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  Tipo de participación
                </label>
                <div className="space-y-3">
                  <label className="flex items-start p-4 bg-gradient-to-r from-indigo-50/80 to-purple-50/80 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800 cursor-pointer hover:shadow-md transition-all duration-200 group">
                    <input
                      type="radio"
                      name="userRole"
                      value="participant"
                      checked={userRole === 'participant'}
                      onChange={(e) => setUserRole(e.target.value as 'participant' | 'spectator')}
                      className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-lg mr-2">🗳️</span>
                        <span className="text-sm font-bold text-indigo-800 dark:text-indigo-200">Participante</span>
                      </div>
                      <span className="text-xs text-indigo-700 dark:text-indigo-300">
                        Puedo votar en las estimaciones
                      </span>
                    </div>
                  </label>
                  <label className="flex items-start p-4 bg-gradient-to-r from-gray-50/80 to-slate-50/80 dark:from-gray-700/80 dark:to-slate-700/80 rounded-xl border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-all duration-200 group">
                    <input
                      type="radio"
                      name="userRole"
                      value="spectator"
                      checked={userRole === 'spectator'}
                      onChange={(e) => setUserRole(e.target.value as 'participant' | 'spectator')}
                      className="mt-1 mr-3 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                    <div>
                      <div className="flex items-center mb-1">
                        <span className="text-lg mr-2">👁️</span>
                        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">Espectador</span>
                      </div>
                      <span className="text-xs text-gray-700 dark:text-gray-300">
                        Solo observo, no puedo votar
                      </span>
                    </div>
                  </label>
                </div>
              </div>
              <button
                type="submit"
                disabled={!isConnected || !userName.trim() || !roomId.trim()}
                className="stagger-item w-full btn-gradient flex justify-center items-center py-4 px-6 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 cursor-pointer transform hover:scale-105 disabled:transform-none"
              >
                <LogIn className="w-5 h-5 mr-2" />
                Unirse a Sala
              </button>
            </form>
          )}
        </div>

        {/* <div className="text-center mt-10 animate-fade-in" style={{animationDelay: '0.5s'}}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
            <p className="text-gray-600 dark:text-gray-300 mb-3 font-medium">
              💡 ¿Primera vez usando Planning Poker?{' '}
              <a href="#" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline decoration-2 underline-offset-2 transition-colors duration-200 font-semibold cursor-pointer">
                Lee nuestra guía rápida
              </a>
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1">
                ❤️ Hecho con amor para equipos ágiles
              </span>
              <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
              <span className="flex items-center gap-1">
                🚀 Versión 2.0
              </span>
            </div>
          </div>
        </div> */}
      </div>
    </div>
  )
}
