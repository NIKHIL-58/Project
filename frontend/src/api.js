// frontend/src/api.js
import axios from "axios";

// ✅ Deployed FastAPI backend URL
const API_URL = "https://fastapi-backend-fcs2.onrender.com";

export const register = (username, password) => {
  return axios.post(`${API_URL}/register`, { username, password });
};

export const login = (username, password) => {
  return axios.post(`${API_URL}/login`, { username, password });
};

// ✅ ADD THIS (fixes: "generateJD is not exported")
export const generateJD = (profile) => {
  return axios.post(`${API_URL}/generate-jd`, { profile });
};
