import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isLoginRequest = error.config?.url?.includes('/login');
    if (error.response?.status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (credentials) => api.post('/admin/state/login', credentials),
  municipalLogin: (credentials) => api.post('/admin/municipal/login', credentials),
};

export const dashboardApi = {
  getStats: () => api.get('/admin/state/stats'),
  getAllMunicipalities: () => api.get('/admin/all-municipalities'),
  getEscalatedComplaints: () => api.get('/admin/escalated-complaints'),
  getComplaintsByMunicipality: (municipalityName) => 
    api.post('/admin/fetch-complaints-by-municipality', { municipalityName }),
  getComplaintById: (id) => api.get(`/admin/complaint/${id}`),
  updateComplaintStatus: (complaintId, status) => 
    api.patch('/admin/complaint/update', { complaint_id: complaintId, status }),
  uploadEvidence: (formData) => 
    api.post('/admin/complaint/uploadEvidence', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  triggerEscalation: () => api.post('/admin/auto-escalate'),
};

export default api;
