import { api } from './api';

export const transactionService = {
  getAll: (userId) => {
    const query = userId ? `?userId=${userId}` : '';
    return api.get(`/transactions${query}`);
  },
  create: (transaction) => {
    return api.post('/transactions', transaction);
  },
  remove: (id) => api.delete(`/transactions/${id}`),
};
