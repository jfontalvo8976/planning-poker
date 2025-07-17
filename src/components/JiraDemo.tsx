'use client'

import { useState } from 'react'
import { Info, ExternalLink, Copy, Check } from 'lucide-react'

export default function JiraDemo() {
  const [copied, setCopied] = useState(false)
  
  const exampleUrl = "https://tu-empresa.atlassian.net/browse/PROJ-123"
  
  const copyExample = async () => {
    try {
      await navigator.clipboard.writeText(exampleUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy: ', err)
    }
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
      <div className="flex items-start">
        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-3 mt-0.5 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🚀 ¡Nueva funcionalidad: Integración automática con Jira!
          </h3>
          
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <p>
              Ahora puedes pegar cualquier enlace de Jira en el campo de tarea y la aplicación 
              extraerá automáticamente toda la información del issue.
            </p>
            
            <div className="bg-white dark:bg-blue-900/30 rounded-md p-3 border border-blue-200 dark:border-blue-700">
              <p className="font-medium mb-2">Ejemplo de URL de Jira:</p>
              <div className="flex items-center space-x-2">
                <code className="flex-1 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs font-mono">
                  {exampleUrl}
                </code>
                <button
                  onClick={copyExample}
                  className="flex items-center px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-800 rounded hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3 h-3 mr-1" />
                      ¡Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3 mr-1" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="font-medium">✅ Información extraída automáticamente:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>Título y descripción</li>
                  <li>Tipo de issue (Story, Bug, Task)</li>
                  <li>Prioridad y estado</li>
                  <li>Asignado y reportero</li>
                </ul>
              </div>
              <div>
                <p className="font-medium">⚙️ Para configurar:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-xs">
                  <li>Haz clic en "Configurar Jira"</li>
                  <li>Ingresa tu dominio de Jira</li>
                  <li>Agrega tu email y API token</li>
                  <li>¡Listo para usar!</li>
                </ul>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
              <span className="text-xs">
                Sin configuración, obtienes información básica del URL.
              </span>
              <a
                href="https://id.atlassian.com/manage-profile/security/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Crear API Token
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
