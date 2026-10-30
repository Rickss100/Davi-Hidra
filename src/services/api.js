export const API_URL = import.meta.env?.VITE_API_URL || '/api';

export const getAuthHeaders = (includeJsonContentType = true) => {
    const headers = {};
    if (includeJsonContentType) {
        headers['Content-Type'] = 'application/json';
    }
    try {
        const token = localStorage.getItem('auth_token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            const user = JSON.parse(savedUser);
            if (user?.id) {
                headers['X-User-Id'] = String(user.id);
            }
            if (user?.uuid) {
                headers['X-User-UUID'] = String(user.uuid);
            }
        }

        const impersonatorId = localStorage.getItem('impersonator_id');
        if (impersonatorId) {
            headers['X-Impersonator-Id'] = String(impersonatorId);
        }
    } catch {
        // Ignora erro de parse do storage local
    }
    return headers;
};

/**
 * Interceptor global de window.fetch para garantir que qualquer componente
 * que chame fetch('/api/...') diretamente receba automaticamente o token JWT
 * (Authorization: Bearer) e trate sessões expiradas (HTTP 401).
 */
export const installApiFetchInterceptor = () => {
    if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;
    if (window.__norteFetchIntercepted) return;

    const originalFetch = window.fetch.bind(window);
    window.__norteFetchIntercepted = true;

    window.fetch = async (input, init = {}) => {
        const urlStr = typeof input === 'string'
            ? input
            : (input instanceof URL ? input.toString() : (input?.url || ''));

        const isInternalApi =
            urlStr.startsWith('/api/') ||
            urlStr === '/api' ||
            (API_URL && API_URL !== '/api' && urlStr.startsWith(API_URL)) ||
            urlStr.includes('localhost:3002/api/');

        if (!isInternalApi) {
            return originalFetch(input, init);
        }

        const headers = new Headers(init.headers || (typeof Request !== 'undefined' && input instanceof Request ? input.headers : undefined));
        const authHeaders = getAuthHeaders(false);

        Object.entries(authHeaders).forEach(([key, value]) => {
            if (value && !headers.has(key)) {
                headers.set(key, value);
            }
        });

        const response = await originalFetch(input, {
            ...init,
            headers
        });

        const isPublicAuthEndpoint =
            urlStr.includes('/users/login') ||
            urlStr.includes('/users/register') ||
            urlStr.includes('/users/forgot-password') ||
            urlStr.includes('/users/reset-password');

        if (response.status === 401 && !isPublicAuthEndpoint) {
            if (localStorage.getItem('auth_token') || localStorage.getItem('user')) {
                window.dispatchEvent(new CustomEvent('auth-unauthorized'));
            }
        }

        return response;
    };
};

// Instala automaticamente ao carregar o módulo
installApiFetchInterceptor();

const handleResponse = async (response) => {
    if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        const err = new Error(errData.message || errData.error || `API Error: ${response.statusText}`);
        err.code = errData.error;
        err.status = response.status;
        throw err;
    }
    return response.json();
};

export const api = {
    get: async (endpoint) => {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                headers: getAuthHeaders()
            });
            return await handleResponse(response);
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
            return await handleResponse(response);
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
            return await handleResponse(response);
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
            return await handleResponse(response);
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
            return await handleResponse(response);
        } catch (error) {
            console.error('API PATCH Error:', error);
            throw error;
        }
    }
};
