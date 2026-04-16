import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: (process.env.REACT_APP_API_URL || 'http://localhost:5000/api').replace(/\/+$/, ''),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// API service functions
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

export const goalService = {
  getGoals: () => api.get('/goals'),
  createGoal: (goalData) => api.post('/goals', goalData),
  updateGoal: (id, goalData) => api.put(`/goals/${id}`, goalData),
  approveGoal: (id, weightage) => api.put(`/goals/${id}/approve`, { weightage }),
  rejectGoal: (id, rejectionReason) => api.put(`/goals/${id}/reject`, { rejectionReason }),
  deleteGoal: (id) => api.delete(`/goals/${id}`),
};

export const feedbackService = {
  getFeedback: (userId) => api.get(`/feedback/user/${userId}`),
  getGoalFeedback: (goalId) => api.get(`/feedback/goal/${goalId}`),
  getPendingFeedback: () => api.get('/feedback/pending'),
  createFeedback: (feedbackData) => api.post('/feedback', feedbackData),
};

export const userService = {
  getUsers: () => api.get('/users'),
  getDashboardStats: () => api.get('/users/dashboard/stats'),
};

export default api;
