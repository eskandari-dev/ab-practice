export const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export async function api(path, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers.Authorization = 'Bearer ' + token

  const res = await fetch(API_URL + path, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })
  const data = await res.json().catch(() => ({}))

  if (!res.ok) {
    const error = new Error(typeof data.detail === 'string' ? data.detail : 'Something went wrong')
    error.status = res.status
    throw error
  }
  return data
}
