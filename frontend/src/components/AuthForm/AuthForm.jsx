import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import React from "react";
import styles from './AuthForm.module.sass';

const AuthForm = ({ isRegister }) => {
    const { login, register } = useAuth();
    const [companyId, setCompanyId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState(''); // поле для регистрации
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isRegister) {
            if (email.trim() && password.trim() && companyId.trim()) {
                try {
                    await login(email, password, companyId);
                } catch (error) {
                    console.error('Ошибка при авторизации:', error);
                    setError('Ошибка авторизации. Пожалуйста, попробуйте снова.');
                }
            } else {
                alert('Пожалуйста, заполните все поля');
            }
        } else {
            if (email.trim() && password.trim() && companyId.trim() && name.trim()) {
                try {
                    await register(name, email, password, companyId);
                } catch (error) {
                    console.error('Ошибка при регистрации:', error);
                    if (error.response && error.response.data) {
                        const serverErrors = Object.values(error.response.data)
                            .flat()
                            .join(' ');
                        setError(serverErrors);
                    } else {
                        setError('Ошибка регистрации. Пожалуйста, попробуйте снова.');
                    }
                }
            } else {
                alert('Пожалуйста, заполните все поля');
            }
        }
    };

    return (
        <div className={styles.authFormContainer}>
            <form onSubmit={handleSubmit} className={styles.authForm}>
                <h2 className={styles.authFormTitle}>
                    {isRegister ? 'Регистрация' : 'Авторизация'}
                </h2>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ID компании:</label>
                    <input
                        type="text"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        required
                        className={styles.formInput}
                        placeholder="Введите ID компании"
                    />
                </div>
                {isRegister && (
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>ФИО:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            className={styles.formInput}
                            placeholder="Введите ваше ФИО"
                        />
                    </div>
                )}
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Электронная почта:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className={styles.formInput}
                        placeholder="Введите вашу почту"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Пароль:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={styles.formInput}
                        placeholder="Введите пароль"
                    />
                </div>
                <button type="submit" className={styles.btn_enter}>
                    {isRegister ? 'Зарегистрироваться' : 'Войти'}
                </button>
                <div className={styles.switchAuthText}>
                    {isRegister ? (
                        <p>
                            Есть аккаунт? <a href="/login">Войти</a>
                        </p>
                    ) : (
                        <p>
                            Нет аккаунта? <a href="/register">Зарегистрироваться</a>
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AuthForm;
