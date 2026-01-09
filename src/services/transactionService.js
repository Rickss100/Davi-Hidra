import { api } from './api';

export const transactionService = {
  getAll: () => api.get('/transactions'),
  create: async (transaction) => {
    // FORCE URL FOR DEBUG
    console.log('Attemping to fetch: http://localhost:3002/api/transactions');
    const response = await fetch('http://localhost:3002/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction)
    });
    if (!response.ok) throw new Error('Failed to create transaction: ' + response.statusText);
    return response.json();
  },
  remove: (id) => api.delete(`/transactions/${id}`),
};
