import { api } from './api';

export const userService = {
  login: async (email, password) => {
    return api.post('/users/login', { email, password });
  },

  getAll: async () => {
    return api.get('/users');
  },

  create: async (userData) => {
    return api.post('/users', userData);
  },

  update: async (id, userData) => {
    return api.put(`/users/${id}`, userData);
  },

  remove: async (id) => {
    return api.delete(`/users/${id}`);
  },

  getPortfolio: async (id) => {
    return api.get(`/users/${id}/portfolio`);
  }
};
