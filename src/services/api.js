export const API_URL = import.meta.env?.VITE_API_URL || '/api';

const getAuthHeaders = () => {
    const headers = { 'Content-Type': 'application/json' };
    try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user?.id) {
                headers['X-User-Id'] = String(user.id);
            }
        }
    } catch (e) {
        // ignora erro de parse
    }
    return headers;
};

export const api = {
    get: async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: getAuthHeaders()
            });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    post: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `API Error: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    put: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `API Error: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },
    delete: async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });
            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.error || `API Error: ${response.statusText}`);
            }
            return response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    },
    patch: async (endpoint, data) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'PATCH',
                headers: getAuthHeaders(),
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return response.json();
        } catch (error) {
            console.error('API PATCH Error:', error);
            throw error;
        }
    }
};
