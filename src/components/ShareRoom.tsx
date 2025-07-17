'use client'

import { useState } from 'react'
import { Clipboard, ExternalLink, Share2, Check } from 'lucide-react'

interface ShareRoomProps {
  roomId: string
  roomName: string
}

export default function ShareRoom({ roomId, roomName }: ShareRoomProps) {
  const [copied, setCopied] = useState(false)
  
  const roomUrl = `${window.location.origin}?room=${roomId}`
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(roomUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  const shareViaWebShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Planning Poker: ${roomName}`,
          text: `Únete a nuestra sesión de Planning Poker: ${roomName}`,
          url: roomUrl,
        })
      } catch (err) {
        console.error('Error sharing: ', err)
      }
    }
  }

  return (
    <div className="glass-morphism rounded-xl shadow-lg border border-white/20 p-4 sm:p-5 animate-slideInRight">
      <div className="flex items-center gap-3 mb-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-2 rounded-lg shadow-lg animate-float">
          <Share2 className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-base font-bold text-gray-800 gradient-text">
          Compartir Sala
        </h3>
      </div>
      
      <div className="space-y-3">
        {/* URL Input con diseño mejorado */}
        <div className="relative">
          <input
            type="text"
            value={roomUrl}
            readOnly
            className="w-full text-sm bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg px-4 py-3 text-gray-700 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            placeholder="URL de la sala..."
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            <ExternalLink className="w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Botones mejorados */}
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={copyToClipboard}
            className={`
              flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-[1.02] ripple cursor-pointer
              ${copied 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white animate-heartbeat'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              }
            `}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 animate-zoomIn" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Clipboard className="w-4 h-4" />
                Copiar URL
              </>
            )}
          </button>
          
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <button
              onClick={shareViaWebShare}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-700 transition-all duration-300 transform hover:scale-[1.02] ripple cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              Compartir
            </button>
          )}
        </div>

        {/* Room ID con diseño mejorado */}
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg p-3 border border-indigo-200/50">
          <p className="text-xs text-indigo-700 flex items-center gap-2">
            <span className="font-medium">ID de la sala:</span>
            <code className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-mono font-bold tracking-wider">
              {roomId}
            </code>
          </p>
        </div>
      </div>
    </div>
  )
}
