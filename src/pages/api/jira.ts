import { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { domain, issueKey, email, apiToken } = req.body

  if (!domain || !issueKey || !email || !apiToken) {
    return res.status(400).json({ error: 'Missing required parameters' })
  }

  try {
    const auth = Buffer.from(`${email}:${apiToken}`).toString('base64')
    
    const response = await axios.get(
      `https://${domain}/rest/api/3/issue/${issueKey}`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    )

    const issue = response.data
    
    const jiraIssue = {
      key: issue.key,
      summary: issue.fields.summary,
      description: issue.fields.description?.content?.[0]?.content?.[0]?.text || '',
      issueType: issue.fields.issuetype.name,
      priority: issue.fields.priority?.name,
      assignee: issue.fields.assignee?.displayName,
      reporter: issue.fields.reporter?.displayName,
      status: issue.fields.status.name,
      storyPoints: issue.fields.customfield_10016 || issue.fields.storypoints,
      labels: issue.fields.labels || [],
      components: issue.fields.components?.map((c: any) => c.name) || [],
      url: `https://${domain}/browse/${issueKey}`,
    }

    res.status(200).json(jiraIssue)
  } catch (error: any) {
    console.error('Error fetching Jira issue:', error)
    
    if (error.response?.status === 401) {
      res.status(401).json({ error: 'Invalid Jira credentials' })
    } else if (error.response?.status === 404) {
      res.status(404).json({ error: 'Jira issue not found' })
    } else if (error.response?.status === 403) {
      res.status(403).json({ error: 'No permission to access this Jira issue' })
    } else {
      res.status(500).json({ error: 'Failed to fetch Jira issue' })
    }
  }
}
