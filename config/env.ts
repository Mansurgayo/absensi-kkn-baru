/**
 * Environment configuration
 * Auto-detects API URL based on deployment environment
 */

export const getApiUrl = (): string => {
  // Server-side: use internal URL
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  }

  // Client-side: use public URL
  const apiUrl = process.env.NEXT_PUBLIC_API_URL
  
  // If explicitly set, use it (local dev or custom)
  if (apiUrl && apiUrl !== 'http://localhost:3000/api') {
    return apiUrl
  }

  // Auto-detect for Vercel deployment
  if (typeof window !== 'undefined') {
    const host = window.location.hostname
    const protocol = window.location.protocol
    
    // If running on localhost, keep localhost
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3000/api'
    }
    
    // Otherwise use current domain (works for Vercel, custom domains, etc)
    return `${protocol}//${host}/api`
  }

  return 'http://localhost:3000/api'
}

export const API_URL = getApiUrl()
