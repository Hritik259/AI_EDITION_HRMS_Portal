import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.error || err.response?.data?.detail || 'Something went wrong'
    console.error('[API Error]', msg)
    return Promise.reject({ ...err, message: msg })
  }
)

export default api
