import axios from 'axios';

const API_URL = 'http://localhost:8000'; // अपना FastAPI का URL यहाँ डालें

export const login = (username, password) =>
  axios.post(`${API_URL}/login`, { username, password });

export const register = (username, password) =>
  axios.post(`${API_URL}/register`, { username, password });
