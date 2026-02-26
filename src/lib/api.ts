export class ApiError extends Error {
  status: number
  description?: string

  constructor(message: string, status: number, description?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.description = description
  }
}

function getErrorMessage(status: number): { title: string; description?: string } {
  switch (status) {
    case 401:
      return {
        title: 'Sign in required',
        description: 'Please sign in to continue.'
      }
    case 403:
      return {
        title: 'Access denied',
        description: 'You don\'t have permission to perform this action.'
      }
    case 404:
      return {
        title: 'Not found',
        description: 'The requested resource could not be found.'
      }
    case 429:
      return {
        title: 'Too many requests',
        description: 'Please wait a moment and try again.'
      }
    case 500:
      return {
        title: 'Server error',
        description: 'Something went wrong on our end. Please try again later.'
      }
    case 502:
    case 503:
    case 504:
      return {
        title: 'Service unavailable',
        description: 'The service is temporarily unavailable. Please try again in a moment.'
      }
    default:
      return { title: 'Request failed' }
  }
}

export async function apiFetch<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(url, options)
  const contentType = response.headers.get('content-type')

  if (!response.ok) {
    const { title, description } = getErrorMessage(response.status)
    let errorMessage = title
    let errorDescription = description

    if (contentType?.includes('application/json')) {
      try {
        const errorData = await response.json()
        if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string'
            ? errorData.error
            : (errorData.error.message ?? errorMessage)
        } else if (errorData?.message) {
          errorMessage = errorData.message
        }
        if (errorData?.details && typeof errorData.details === 'string') {
          errorDescription = errorData.details
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    throw new ApiError(errorMessage, response.status, errorDescription)
  }

  if (!contentType?.includes('application/json')) {
    const text = await response.text()
    if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
      throw new ApiError(
        'Unexpected response',
        500,
        'The server returned an invalid response. Please refresh the page and try again.'
      )
    }
    return text as T
  }

  return response.json()
}

/**
 * Parse an error into a user-friendly message
 */
export function parseError(error: unknown): { title: string; description?: string } {
  if (error instanceof ApiError) {
    return { title: error.message, description: error.description }
  }

  if (error instanceof Error) {
    if (error.message.includes('DOCTYPE') || error.message.includes('not valid JSON')) {
      return {
        title: 'Connection error',
        description: 'The server returned an unexpected response. Please refresh and try again.'
      }
    }
    if (error.message.includes('fetch') || error.message.includes('network') || error.message.includes('Failed to fetch')) {
      return {
        title: 'Network error',
        description: 'Please check your internet connection and try again.'
      }
    }
    return { title: error.message }
  }

  return { title: 'Something went wrong' }
}
