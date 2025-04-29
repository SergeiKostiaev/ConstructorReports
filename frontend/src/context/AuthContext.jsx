import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;
const INACTIVITY_TIMEOUT = 60*60*1000; // для теста (поменять на 60*1000 для минуты)

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        return storedAuth ? JSON.parse(storedAuth) : false;
    });

    const [errorMessage, setErrorMessage] = useState('');
    const [inactivityTimer, setInactivityTimer] = useState(null);
    const navigate = useNavigate();

    // Функция для сброса таймера неактивности
    const resetInactivityTimer = () => {
        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }

        const timer = setTimeout(() => {
            logout();
            localStorage.setItem('sessionExpired', 'true');
        }, INACTIVITY_TIMEOUT);

        setInactivityTimer(timer);
        localStorage.setItem('lastActivity', Date.now());
    };

    // Обработчики событий активности
    const setupActivityListeners = () => {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];

        events.forEach(event => {
            window.addEventListener(event, resetInactivityTimer);
        });

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, resetInactivityTimer);
            });
        };
    };

    useEffect(() => {
        if (isAuthenticated) {
            resetInactivityTimer();
            const cleanup = setupActivityListeners();

            return () => {
                if (inactivityTimer) {
                    clearTimeout(inactivityTimer);
                }
                cleanup();
            };
        }
    }, [isAuthenticated]);

    const login = async (email, password, companyId) => {
        try {
            const response = await fetch(`${API_URL}/api/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ company_id: companyId, email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                setErrorMessage('Неверные учетные данные или ошибка сервера');
                return { success: false, message: 'Неверные учетные данные' };
            }

            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', JSON.stringify(true));
            localStorage.setItem('api_token', data.data.api_token);
            localStorage.setItem('name', data.data.user.name);
            localStorage.setItem('role', data.data.user.role_id);
            localStorage.setItem('confirmed', data.data.user.confirmed);
            localStorage.removeItem('sessionExpired');
            navigate('/home');

            return { success: true };
        } catch (error) {
            console.error('Ошибка:', error);
            setErrorMessage('Ошибка сети или сервера');
            return { success: false, message: 'Ошибка сети' };
        }
    };

    const register = async (name, email, password, companyId) => {
        try {
            const response = await fetch(`${API_URL}/api/user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ company_id: companyId, name, email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                const errorMessages = Object.values(data.data).flat().join(' ');
                setErrorMessage(errorMessages || 'Ошибка регистрации');
                return { success: false, message: errorMessages };
            }

            setIsAuthenticated(true);
            localStorage.setItem('isAuthenticated', JSON.stringify(true));
            navigate('/login');

            return { success: true };
        } catch (error) {
            console.error('Ошибка:', error);
            setErrorMessage('Ошибка сети или сервера');
            return { success: false, message: 'Ошибка сети' };
        }
    };

    const logout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('api_token');
        localStorage.removeItem('name');
        localStorage.removeItem('role');
        localStorage.removeItem('lastActivity');

        if (inactivityTimer) {
            clearTimeout(inactivityTimer);
        }

        navigate('/login');
    };

    const clearError = () => {
        setErrorMessage('');
    };

    useEffect(() => {
        const storedAuth = localStorage.getItem('isAuthenticated');
        if (storedAuth) {
            setIsAuthenticated(JSON.parse(storedAuth));
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                isAuthenticated,
                register,
                login,
                logout,
                errorMessage,
                clearError,
            }}>
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