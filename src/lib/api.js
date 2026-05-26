const API_BASE_URL = 'http://localhost:3005/api';

const request = async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');

    const headers = {
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Only set Content-Type to application/json if it's not a FormData request
    if (!(options.body instanceof FormData)) {
        headers['Content-Type'] = headers['Content-Type'] || 'application/json';
        if (options.body && typeof options.body === 'object') {
            options.body = JSON.stringify(options.body);
        }
    }

    const config = {
        ...options,
        headers,
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Handle no-content responses
        if (response.status === 204) {
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'API Request Failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

export const api = {
    get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
    post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
    put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
    delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
};

