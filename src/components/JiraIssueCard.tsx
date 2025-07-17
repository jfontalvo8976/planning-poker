'use client'

import { JiraIssue } from '../lib/jiraService'
import { ExternalLink, User, Flag, Tag, Clock } from 'lucide-react'

interface JiraIssueCardProps {
  issue: JiraIssue
  onUseAsTask: () => void
}

export default function JiraIssueCard({ issue, onUseAsTask }: JiraIssueCardProps) {
  const getIssueTypeColor = (type: string) => {
    const lowerType = type.toLowerCase()
    if (lowerType.includes('bug')) return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    if (lowerType.includes('story')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
    if (lowerType.includes('task')) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
    if (lowerType.includes('epic')) return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  const getPriorityColor = (priority?: string) => {
    if (!priority) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
    const lowerPriority = priority.toLowerCase()
    if (lowerPriority.includes('highest') || lowerPriority.includes('critical')) 
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
    if (lowerPriority.includes('high')) 
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-200'
    if (lowerPriority.includes('medium')) 
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
    if (lowerPriority.includes('low')) 
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200'
    return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">
            {issue.key}
          </span>
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getIssueTypeColor(issue.issueType)}`}>
            {issue.issueType}
          </span>
          {issue.priority && (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(issue.priority)}`}>
              <Flag className="w-3 h-3 mr-1" />
              {issue.priority}
            </span>
          )}
        </div>
        <a
          href={issue.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {issue.summary}
      </h3>

      {/* Description */}
      {issue.description && (
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-3">
          {issue.description}
        </p>
      )}

      {/* Metadata */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 text-sm">
        {issue.assignee && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <User className="w-4 h-4 mr-2" />
            <span>Asignado: {issue.assignee}</span>
          </div>
        )}
        
        <div className="flex items-center text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4 mr-2" />
          <span>Estado: {issue.status}</span>
        </div>

        {issue.storyPoints && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Tag className="w-4 h-4 mr-2" />
            <span>Story Points: {issue.storyPoints}</span>
          </div>
        )}

        {issue.components && issue.components.length > 0 && (
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Tag className="w-4 h-4 mr-2" />
            <span>Componentes: {issue.components.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Labels */}
      {issue.labels && issue.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {issue.labels.map((label, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
            >
              {label}
            </span>
          ))}
        </div>
      )}

      {/* Action */}
      <button
        onClick={onUseAsTask}
        className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
      >
        Usar como tarea actual
      </button>
    </div>
  )
}
