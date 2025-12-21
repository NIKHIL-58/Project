import axios from "axios";

const API_URL = "https://smarthire-backend-acen.onrender.com";

const authHeader = () => {
  const token = localStorage.getItem("token");
  // ✅ token nahi hai to empty headers bhejo
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const register = (username, password) =>
  axios.post(`${API_URL}/register`, { username, password });

export const login = (username, password) =>
  axios.post(`${API_URL}/login`, { username, password });

export const generateJD = (profile) =>
  axios.post(`${API_URL}/generate-jd`, { profile }, { headers: authHeader() });

export const saveJD = (profile, jd_text) =>
  axios.post(`${API_URL}/save-jd`, { profile, jd_text }, { headers: authHeader() });

export const getMyJDs = () =>
  axios.get(`${API_URL}/my-jds`, { headers: authHeader() });

export const uploadResume = (file) => {
  const form = new FormData();
  form.append("file", file);

  return axios.post(`${API_URL}/upload-resume`, form, {
    headers: {
      ...authHeader(),
      "Content-Type": "multipart/form-data",
    },
  });
};

export const getMyResumes = () =>
  axios.get(`${API_URL}/my-resumes`, { headers: authHeader() });

export const matchResumes = (jd_id, top_k = 5) =>
  axios.post(
    `${API_URL}/match-resumes`,
    { jd_id, top_k },
    { headers: authHeader() }
  );

export const getMyMatches = () =>
  axios.get(`${API_URL}/my-matches`, { headers: authHeader() });
