/**
 * Utility functions for URL management
 */

/**
 * Clears all query parameters from the current URL
 */
export const clearUrlQueries = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    const url = new URL(window.location.href)
    url.search = '' // Remove all query parameters
    window.history.replaceState({}, '', url.toString())
    console.log('URL queries cleared:', url.toString())
  } catch (error) {
    console.error('Error clearing URL queries:', error)
  }
}

/**
 * Gets a specific query parameter from the URL
 */
export const getUrlQuery = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  
  try {
    const urlParams = new URLSearchParams(window.location.search)
    return urlParams.get(key)
  } catch (error) {
    console.error('Error getting URL query:', error)
    return null
  }
}

/**
 * Sets a query parameter in the URL
 */
export const setUrlQuery = (key: string, value: string): void => {
  if (typeof window === 'undefined') return
  
  try {
    const url = new URL(window.location.href)
    url.searchParams.set(key, value)
    window.history.replaceState({}, '', url.toString())
    console.log(`URL query set: ${key}=${value}`)
  } catch (error) {
    console.error('Error setting URL query:', error)
  }
}

/**
 * Removes a specific query parameter from the URL
 */
export const removeUrlQuery = (key: string): void => {
  if (typeof window === 'undefined') return
  
  try {
    const url = new URL(window.location.href)
    url.searchParams.delete(key)
    window.history.replaceState({}, '', url.toString())
    console.log(`URL query removed: ${key}`)
  } catch (error) {
    console.error('Error removing URL query:', error)
  }
}
