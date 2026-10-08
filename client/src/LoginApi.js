import axios from 'axios'

const LoginApi = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true,
})

export default LoginApi