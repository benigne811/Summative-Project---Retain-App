
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

interface ApiErrorResponse {
  message?: string
  error?: string
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers)
  const token = localStorage.getItem('retain_session')
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    })
  } catch {
    throw new Error(
      'Could not connect to the Retain server. Make sure the backend is running.',
    )
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`

    try {
      const errorData = (await response.json()) as ApiErrorResponse
      message = errorData.message || errorData.error || message
    } catch {
      // Keep the status-based message if the response isn't JSON.
    }

    throw new Error(message)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}
