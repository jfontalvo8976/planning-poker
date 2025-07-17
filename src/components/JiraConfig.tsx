'use client'

import { useState } from 'react'
import { Settings, Eye, EyeOff, ExternalLink, Info } from 'lucide-react'
import { jiraService } from '../lib/jiraService'

interface JiraConfigProps {
  onConfigChange?: () => void
}

export default function JiraConfig({ onConfigChange }: JiraConfigProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [domain, setDomain] = useState('')
  const [email, setEmail] = useState('')
  const [apiToken, setApiToken] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = () => {
    jiraService.setConfig({
      domain: domain.trim(),
      email: email.trim(),
      apiToken: apiToken.trim(),
    })
    setIsOpen(false)
    onConfigChange?.()
  }

  const handleTest = async () => {
    if (!domain || !email || !apiToken) {
      setTestResult('Por favor, completa todos los campos')
      return
    }

    setIsLoading(true)
    setTestResult(null)

    try {
      jiraService.setConfig({
        domain: domain.trim(),
        email: email.trim(),
        apiToken: apiToken.trim(),
      })

      // Test con un issue de ejemplo (esto fallará pero nos dirá si las credenciales son válidas)
      await jiraService.getIssueFromApi(domain.trim(), 'TEST-1')
      setTestResult('✅ Conexión exitosa')
    } catch (error: any) {
      if (error.response?.status === 404) {
        setTestResult('✅ Credenciales válidas (issue TEST-1 no existe, pero eso es normal)')
      } else if (error.response?.status === 401) {
        setTestResult('❌ Credenciales inválidas')
      } else if (error.response?.status === 403) {
        setTestResult('❌ Sin permisos para acceder a Jira')
      } else {
        setTestResult(`❌ Error: ${error.response?.data?.error || error.message}`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        <Settings className="w-4 h-4 mr-2" />
        Configurar Jira
      </button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuración de Jira
          </h3>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {/* Información */}
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start">
              <Info className="w-4 h-4 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800 dark:text-blue-200">
                <p className="mb-2">Para obtener automáticamente información de Jira:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Ve a tu perfil de Jira → Security → API tokens</li>
                  <li>Crea un nuevo token</li>
                  <li>Ingresa los datos aquí</li>
                </ol>
                <a
                  href="https://id.atlassian.com/manage-profile/security/api-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Crear API Token
                </a>
              </div>
            </div>
          </div>

          {/* Domain */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dominio de Jira
            </label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="tuempresa.atlassian.net"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email de Jira
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu-email@empresa.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* API Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Token
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Tu API token de Jira"
                className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg text-sm ${
              testResult.includes('✅') 
                ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
            }`}>
              {testResult}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleTest}
              disabled={isLoading || !domain || !email || !apiToken}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Probando...' : 'Probar conexión'}
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
