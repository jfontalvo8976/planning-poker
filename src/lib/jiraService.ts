import axios from 'axios'

export interface JiraIssue {
  key: string
  summary: string
  description?: string
  issueType: string
  priority?: string
  assignee?: string
  reporter?: string
  status: string
  storyPoints?: number
  labels?: string[]
  components?: string[]
  url: string
}

export interface JiraConfig {
  domain?: string
  email?: string
  apiToken?: string
}

class JiraService {
  private config: JiraConfig = {}

  setConfig(config: JiraConfig) {
    this.config = config
  }

  // Extraer información de un URL de Jira
  extractJiraInfoFromUrl(url: string): { domain: string; issueKey: string } | null {
    try {
      const jiraUrlPattern = /https?:\/\/([^\/]+)\/browse\/([A-Z]+-\d+)/i
      const match = url.match(jiraUrlPattern)
      
      if (match) {
        return {
          domain: match[1],
          issueKey: match[2]
        }
      }
      return null
    } catch (error) {
      console.error('Error parsing Jira URL:', error)
      return null
    }
  }

  // Obtener información de un issue de Jira usando la API REST a través de nuestro endpoint
  async getIssueFromApi(domain: string, issueKey: string): Promise<JiraIssue | null> {
    if (!this.config.email || !this.config.apiToken) {
      throw new Error('Jira API credentials not configured')
    }

    try {
      const response = await axios.post('/api/jira', {
        domain,
        issueKey,
        email: this.config.email,
        apiToken: this.config.apiToken,
      })

      return response.data
    } catch (error: any) {
      console.error('Error fetching Jira issue via API:', error)
      throw error
    }
  }

  // Obtener información básica scrapeando la página (fallback cuando no hay API)
  async getIssueFromPage(url: string): Promise<Partial<JiraIssue> | null> {
    try {
      // Esta función requeriría un proxy o CORS handling para funcionar desde el frontend
      // Por ahora, retornamos la información básica que podemos extraer del URL
      const jiraInfo = this.extractJiraInfoFromUrl(url)
      if (!jiraInfo) return null

      return {
        key: jiraInfo.issueKey,
        url: url,
        summary: `Tarea ${jiraInfo.issueKey}`, // Placeholder
      }
    } catch (error) {
      console.error('Error scraping Jira page:', error)
      return null
    }
  }

  // Función principal para obtener información de Jira
  async getIssueInfo(url: string): Promise<JiraIssue | null> {
    const jiraInfo = this.extractJiraInfoFromUrl(url)
    if (!jiraInfo) return null

    try {
      // Intentar primero con la API si está configurada
      if (this.config.email && this.config.apiToken) {
        return await this.getIssueFromApi(jiraInfo.domain, jiraInfo.issueKey)
      } else {
        // Fallback a información básica del URL
        const basicInfo = await this.getIssueFromPage(url)
        return basicInfo as JiraIssue
      }
    } catch (error) {
      console.error('Error getting Jira issue info:', error)
      // Fallback a información mínima
      return {
        key: jiraInfo.issueKey,
        summary: `Tarea ${jiraInfo.issueKey}`,
        issueType: 'Story',
        status: 'Unknown',
        url: url,
      }
    }
  }

  // Validar si un string parece ser un URL de Jira
  isJiraUrl(text: string): boolean {
    const jiraUrlPattern = /https?:\/\/[^\/]+\/browse\/[A-Z]+-\d+/i
    return jiraUrlPattern.test(text)
  }

  // Extraer múltiples URLs de Jira de un texto
  extractJiraUrls(text: string): string[] {
    const jiraUrlPattern = /https?:\/\/[^\/]+\/browse\/[A-Z]+-\d+/gi
    return text.match(jiraUrlPattern) || []
  }
}

export const jiraService = new JiraService()
