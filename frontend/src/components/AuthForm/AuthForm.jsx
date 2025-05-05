import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from './AuthForm.module.css';

const AuthForm = ({ isRegister }) => {
    const authContext = useAuth();
    const { login, register, errorMessage, clearError } = authContext;

    const [companyId, setCompanyId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [confirmPasswordError, setConfirmPasswordError] = useState('');

    const validatePassword = (password) => {
        if (password.length < 8) {
            return 'Пароль должен содержать минимум 8 символов';
        }
        if (!/[A-Z]/.test(password)) {
            return 'Пароль должен содержать хотя бы одну заглавную букву';
        }
        if (!/\d/.test(password)) {
            return 'Пароль должен содержать хотя бы одну цифру';
        }
        return '';
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);

        if (isRegister) {
            setPasswordError(validatePassword(newPassword));
            // Проверяем совпадение паролей при изменении основного пароля
            if (confirmPassword && newPassword !== confirmPassword) {
                setConfirmPasswordError('Пароли не совпадают');
            } else {
                setConfirmPasswordError('');
            }
        }
    };

    const handleConfirmPasswordChange = (e) => {
        const newConfirmPassword = e.target.value;
        setConfirmPassword(newConfirmPassword);

        if (isRegister) {
            if (password !== newConfirmPassword) {
                setConfirmPasswordError('Пароли не совпадают');
            } else {
                setConfirmPasswordError('');
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        let validationPassed = true;

        if (!isRegister) {
            if (!email.trim() || !password.trim() || !companyId.trim()) {
                validationPassed = false;
            }
        } else {
            if (!email.trim() || !password.trim() || !companyId.trim() || !name.trim() || !confirmPassword.trim()) {
                validationPassed = false;
            }

            const passwordValidationError = validatePassword(password);
            if (passwordValidationError) {
                setPasswordError(passwordValidationError);
                validationPassed = false;
            }

            if (password !== confirmPassword) {
                setConfirmPasswordError('Пароли не совпадают');
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
                        onChange={handlePasswordChange}
                        required
                        className={`${styles.formInput} ${
                            (errorMessage || passwordError) ? styles.inputError : ''
                        }`}
                        placeholder="Введите пароль"
                    />
                    {isRegister && passwordError && (
                        <p className={styles.passwordHint}>
                            {passwordError}
                        </p>
                    )}
                    {isRegister && !passwordError && password.length > 0 && (
                        <p className={styles.passwordSuccess}>
                            Пароль соответствует требованиям
                        </p>
                    )}
                </div>
                {isRegister && (
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Повторите пароль:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={handleConfirmPasswordChange}
                            required
                            className={`${styles.formInput} ${
                                confirmPasswordError ? styles.inputError : ''
                            }`}
                            placeholder="Повторите пароль"
                        />
                        {confirmPasswordError && (
                            <p className={styles.passwordHint}>
                                {confirmPasswordError}
                            </p>
                        )}
                    </div>
                )}
                {errorMessage && (
                    <p style={{
                        color: 'red',
                        margin: '2px 0 10px 0',
                    }}>{errorMessage}</p>
                )}
                <button
                    type="submit"
                    className={styles.btn_enter}
                    disabled={isRegister && (passwordError || confirmPasswordError)}
                >
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