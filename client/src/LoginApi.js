import axios from 'axios'

const LoginApi = axios.create({
  // In production, vercel.json forwards /api and /auth to the backend
  baseURL: import.meta.env.PROD ? '' : 'http://localhost:8000',
  withCredentials: true,
})

export default LoginApi