import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        const token = localStorage.getItem('token');
        if (token) {
            fetchProfile();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchProfile = async () => {
        try {
            const data = await api.get('/auth/me');
            if (data && data.user) {
                setUser({ ...data.user, requiresPasswordChange: data.requiresPasswordChange });
            } else {
                signOut();
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            signOut();
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const data = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        setUser({ ...data.user, requiresPasswordChange: data.requiresPasswordChange });
        return data;
    };

    const signOut = async () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    const resetPassword = async (email) => {
        const data = await api.post('/auth/reset-password', { email });
        return data;
    };

    const changePassword = async (newPassword) => {
        const data = await api.post('/auth/change-password', { newPassword });
        setUser(prev => ({ ...prev, requiresPasswordChange: false }));
        return data;
    };

    const updateProfile = async (values) => {
        const data = await api.put('/auth/profile', values);
        if (data.user) {
            setUser(prev => ({ ...prev, ...data.user }));
        }
        return data;
    };


    const value = {
        user,
        profile: user, // For backwards compatibility with existing components
        loading,
        login,
        signOut,
        resetPassword,
        changePassword,
        updateProfile,
        isIssuer: user?.role === 'Issuer',
        isIndenter: user?.role === 'Indenter'
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
