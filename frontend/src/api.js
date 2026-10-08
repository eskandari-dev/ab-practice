// in production the backend serves this site and the API under /api (backend/server.py)
export const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.DEV ? 'http://127.0.0.1:8000' : '/api')

export async function api(path, options = {}) {
  const token = localStorage.getItem('token')
  const isForm = options.body instanceof FormData
  // the browser sets the multipart Content-Type (with boundary) for FormData itself
  const headers = isForm ? {} : { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = 'Bearer ' + token

  const res = await fetch(API_URL + path, {
    method: options.method || 'GET',
    headers,
    body: isForm ? options.body : options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(typeof data.detail === 'string' ? data.detail : 'Something went wrong')
    error.status = res.status
    throw error
  }
  return data
}
