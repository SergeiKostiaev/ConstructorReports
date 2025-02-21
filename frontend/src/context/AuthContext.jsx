import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        return storedAuth ? JSON.parse(storedAuth) : false;
    });

    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    const navigate = useNavigate();

    const login = async (email, password, companyId) => {
        try {
            // Отправляем запрос на API для авторизации
            const response = await fetch(`${API_URL}/api/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    company_id: companyId,
                    email: email,
                    password: password,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error('Ошибка авторизации');
            }

            setIsAuthenticated(true);
            setUser(data.user);
            localStorage.setItem('isAuthenticated', JSON.stringify(true));
            localStorage.setItem('api_token', data.data.api_token);
            localStorage.setItem('name', data.data.user.name);
            localStorage.setItem('role', data.data.user.role_id);
            localStorage.setItem('confirmed', data.data.user.confirmed);
            navigate('/home');
        } catch (error) {
            alert('Неверные учетные данные или ошибка сервера');
        }
    };

    const register = async (name, email, password, companyId) => {
        try {
            const response = await fetch(`${API_URL}/api/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    company_id: companyId,
                    name: name,
                    email: email,
                    password: password,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                const errorMessages = Object.values(data.data).flat().join(' ');
                throw new Error(errorMessages || 'Ошибка регистрации');
            }

            setIsAuthenticated(true);
            setUser(data.user);
            localStorage.setItem('isAuthenticated', JSON.stringify(true));
            navigate('/login');
        } catch (error) {
            alert(error.message || 'Неверные учетные данные или ошибка сервера');
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('api_token');
        localStorage.removeItem('name');
        navigate('/login');
    };

    useEffect(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        const storedUser = localStorage.getItem('user');
        if (storedAuth && storedUser) {
            setIsAuthenticated(JSON.parse(storedAuth));
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{ isAuthenticated, user, currentUser: user, register, login, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth должен использоваться внутри AuthProvider');
    }
    return context;
};
