import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:5000/api';

export const registerStudent = async (formData) => {
  return await axios.post(`${API_BASE_URL}/register-student`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const recognizeFrame = async (imageBlob) => {
  const formData = new FormData();
  formData.append('image', imageBlob, 'frame.jpg');
  return await axios.post(`${API_BASE_URL}/recognize-frame`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};