// frontend/src/api.js
import axios from "axios";

// ✅ Deployed FastAPI backend URL
const API_URL = "https://smarthire-backend-acen.onrender.com";

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

export const saveJD = (username, profile, jd_text) => {
  return axios.post(`${API_URL}/save-jd`, { username, profile, jd_text });
};

export const getMyJDs = (username) => {
  return axios.get(`${API_URL}/my-jds`, { params: { username } });
};
