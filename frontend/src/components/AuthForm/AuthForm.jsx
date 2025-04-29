import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthForm.module.css';

const AuthForm = ({ isRegister }) => {
    const authContext = useAuth();
    const { login, register, errorMessage, clearError } = authContext;

    const [companyId, setCompanyId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();

        let validationPassed = true;

        if (!isRegister) {
            if (!email.trim() || !password.trim() || !companyId.trim()) {
                validationPassed = false;
            }
        } else {
            if (!email.trim() || !password.trim() || !companyId.trim() || !name.trim()) {
                validationPassed = false;
            }
        }

        if (validationPassed) {
            try {
                if (!isRegister) {
                    await login(email, password, companyId);
                } else {
                    await register(name, email, password, companyId);
                }
            } catch (err) {
                // Обработка ошибок
            }
        }
    };

    return (
        <div className={styles.authFormContainer}>
            <form onSubmit={handleSubmit} className={styles.authForm}>
                <h2 className={styles.authFormTitle}>
                    {isRegister ? 'Регистрация' : 'Авторизация'}
                </h2>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>ID компании:</label>
                    <input
                        type="text"
                        value={companyId}
                        onChange={(e) => setCompanyId(e.target.value)}
                        required
                        className={`${styles.formInput} ${errorMessage ? styles.inputError : ''}`}
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
                            className={`${styles.formInput} ${errorMessage ? styles.inputError : ''}`}
                            placeholder="Введите ваши имя и фамилию"
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
                        className={`${styles.formInput} ${errorMessage ? styles.inputError : ''}`}
                        placeholder="Введите электронную почту"
                    />
                </div>
                <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Пароль:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className={`${styles.formInput} ${errorMessage ? styles.inputError : ''}`}
                        placeholder="Введите пароль"
                    />
                </div>
                {errorMessage && <p style={{
                    color: 'red',
                    margin: '2px 0  10px 0',
                }}>{errorMessage}</p>}
                <button type="submit" className={styles.btn_enter}>
                    {isRegister ? 'Зарегистрироваться' : 'Войти'}
                </button>
                <div className={styles.switchAuthText}>
                    {isRegister ? (
                        <p>
                            Уже зарегистрированы?{' '}
                            <a href="/login">Вход</a>
                        </p>
                    ) : (
                        <p>
                            Еще нет аккаунта?{' '}
                            <a href="/register">Регистрация</a>
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
};

export default AuthForm;