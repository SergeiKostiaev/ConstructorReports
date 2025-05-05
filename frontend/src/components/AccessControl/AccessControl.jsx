import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import styles from './AccessControl.module.sass';

const API_URL = import.meta.env.VITE_API_URL;

import agree from "../../assets/agree.svg";
import close from "../../assets/close.svg";
import editIcon from "../../assets/edit.svg";
import eyeOpen from "../../assets/eye.png";

const AccessControl = () => {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [token, setToken] = useState(null);

    const [companyName, setCompanyName] = useState('');
    const [companyId, setCompanyId] = useState('');
    const [companyIdSuffix, setCompanyIdSuffix] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [editingUser, setEditingUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const [newPasswordError, setNewPasswordError] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        const role = Number(localStorage.getItem('role'));
        const storedToken = localStorage.getItem('api_token');

        setToken(storedToken);
        setIsSuperAdmin(role === 3);
        setIsAdmin(role === 2);
    }, []);

    const validatePassword = (pass) => {
        if (pass.length < 8) {
            return 'Пароль должен быть на латинице, содержать минимум 8 символов';
        }
        if (!/[A-Z]/.test(pass)) {
            return 'Пароль должен содержать хотя бы одну заглавную букву';
        }
        if (!/\d/.test(pass)) {
            return 'Пароль должен содержать хотя бы одну цифру';
        }
        return '';
    };

    const generateCompanyId = () => {
        const suffix = Math.random().toString(36).substr(2, 5).toUpperCase();
        setCompanyIdSuffix(suffix);
        const formattedName = companyName.trim().replace(/\s+/g, '-').toUpperCase();
        setCompanyId(`ID-${formattedName}-${suffix}`);
    };

    const handleCompanyNameChange = (e) => {
        const name = e.target.value;
        setCompanyName(name);
        if (companyIdSuffix) {
            const formattedName = name.trim().replace(/\s+/g, '-').toUpperCase();
            setCompanyId(`ID-${formattedName}-${companyIdSuffix}`);
        }
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordError(validatePassword(value));
    };

    const handleNewPasswordChange = (e) => {
        const value = e.target.value;
        setNewPassword(value);
        setNewPasswordError(value ? validatePassword(value) : '');
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleNewPasswordVisibility = () => {
        setShowNewPassword(!showNewPassword);
    };

    useEffect(() => {
        if (!token || (!isSuperAdmin && !isAdmin)) return;

        const fetchData = async () => {
            try {
                const [usersRes, companiesRes] = await Promise.all([
                    fetch(`${API_URL}/api/users`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                        }
                    }),
                    fetch(`${API_URL}/api/companies`, {
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                        }
                    })
                ]);

                if (!usersRes.ok || !companiesRes.ok) {
                    throw new Error('Ошибка загрузки данных');
                }

                const usersData = await usersRes.json();
                const companiesData = await companiesRes.json();

                if (usersData.success) setUsers(usersData.data);
                if (companiesData.success) setCompanies(companiesData.data);
            } catch (error) {
                console.error("Ошибка загрузки данных:", error);
                toast.error("Ошибка загрузки данных");
            }
        };

        fetchData();
    }, [isSuperAdmin, isAdmin, token]);

    const handleCreateCompanyAndAdmin = async () => {
        if (!companyId || !adminName || !adminEmail || !password) {
            toast.warning("Заполните все поля!");
            return;
        }

        if (passwordError) {
            return;
        }

        try {
            const companyResponse = await fetch(`${API_URL}/api/company`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: companyId })
            });

            const companyData = await companyResponse.json();

            if (!companyResponse.ok || !companyData.success) {
                toast.error(`Ошибка при создании компании: ${companyData.message}`);
                return;
            }

            const adminPayload = {
                company_id: companyId,
                name: adminName,
                email: adminEmail,
                password: password
            };

            const adminResponse = await fetch(`${API_URL}/api/user/admin`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminPayload)
            });

            const adminData = await adminResponse.json();

            if (!adminResponse.ok || !adminData.success) {
                toast.error(`Ошибка при создании админа: ${adminData.message}`);
                return;
            }

            const [updatedCompaniesRes, updatedUsersRes] = await Promise.all([
                fetch(`${API_URL}/api/companies`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    }
                }),
                fetch(`${API_URL}/api/users`, {
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    }
                })
            ]);

            const updatedCompaniesData = await updatedCompaniesRes.json();
            const updatedUsersData = await updatedUsersRes.json();

            if (updatedCompaniesData.success) setCompanies(updatedCompaniesData.data);
            if (updatedUsersData.success) setUsers(updatedUsersData.data);

            setCompanyName('');
            setCompanyId('');
            setCompanyIdSuffix('');
            setAdminName('');
            setAdminEmail('');
            setPassword('');
            setPasswordError('');

            toast.success("Компания и администратор успешно созданы!");
        } catch (error) {
            console.log("Произошла ошибка при отправке запроса:", error);
            toast.error("Ошибка при создании компании и администратора");
        }
    };

    const handleAccessChange = async (userId, allow) => {
        try {
            if (!allow) {
                if (!window.confirm("Вы уверены, что хотите удалить этого пользователя?")) {
                    return;
                }

                const response = await fetch(`${API_URL}/api/user`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user_id: userId })
                });

                const data = await response.json();

                if (!response.ok) {
                    toast.error(data.message || "Ошибка при удалении пользователя");
                    return;
                }

                setUsers(users.filter(user => user.id !== userId));
                toast.success("Пользователь успешно удален");
                return;
            }

            const response = await fetch(`${API_URL}/api/user/confirmed`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId, confirmed: true })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || "Ошибка при изменении доступа");
                return;
            }

            setUsers(users.map(user => user.id === userId ? { ...user, confirmed: true } : user));
            toast.success("Доступ пользователя успешно подтвержден");
        } catch (error) {
            console.error("Ошибка обновления доступа:", error);
            toast.error("Ошибка при изменении доступа");
        }
    };

    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту компанию?")) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/company/${companyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Ошибка при удалении компании");
            }

            setCompanies(companies.filter(company => company.id !== companyId));
            toast.success("Компания успешно удалена");
        } catch (error) {
            console.error("Ошибка при удалении компании:", error);
            toast.error("Ошибка при удалении компании");
        }
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setNewPassword('');
        setNewPasswordError('');
    };

    const handleSaveUser = async () => {
        if (!editingUser) return;

        if (newPassword && newPasswordError) {
            return;
        }

        try {
            const payload = {
                user_id: editingUser.id,
                name: editingUser.name,
                email: editingUser.email,
            };

            if (newPassword) {
                payload.password = newPassword;
            }

            const response = await fetch(`${API_URL}/api/user/${editingUser.id}/update`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Ошибка при обновлении пользователя");
            }

            const usersRes = await fetch(`${API_URL}/api/users`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                }
            });
            const usersData = await usersRes.json();
            if (usersData.success) setUsers(usersData.data);

            setEditingUser(null);
            setNewPassword('');
            setNewPasswordError('');

            toast.success("Данные пользователя успешно обновлены");
        } catch (error) {
            console.error("Ошибка при обновлении пользователя:", error);
            toast.error("Ошибка при обновлении пользователя");
        }
    };

    const handleCloseEditModal = () => {
        setEditingUser(null);
        setNewPassword('');
        setNewPasswordError('');
    };

    return (
        <div className={styles.accessControl}>
            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
            />

            {isSuperAdmin && (
                <div className={styles.createCompanyForm}>
                    <h3 className={styles.formTitle}>Добавление новой компании</h3>
                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Название компании</label>
                        <input
                            type="text"
                            placeholder="Введите название компании"
                            value={companyName}
                            onChange={handleCompanyNameChange}
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>ID компании</label>
                        <div className={styles.companyIdGroup}>
                            <div className={styles.companyId}>
                                <input
                                    type="text"
                                    value={companyId}
                                    readOnly
                                    placeholder="ID будет сгенерирован"
                                    className={styles.formInput}
                                />
                                <button
                                    className={styles.generateButton}
                                    onClick={generateCompanyId}
                                    disabled={!companyName.trim()}
                                >
                                    Сгенерировать
                                </button>
                            </div>
                            {companyIdSuffix && (
                                <p className={styles.idSuffix}>Сгенерированный суффикс: {companyIdSuffix}</p>
                            )}
                        </div>
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>ФИО администратора</label>
                        <input
                            type="text"
                            placeholder="Введите ФИО администратора"
                            value={adminName}
                            onChange={(e) => setAdminName(e.target.value)}
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Email администратора</label>
                        <input
                            type="email"
                            placeholder="Введите email администратора"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            className={styles.formInput}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label className={styles.formLabel}>Пароль</label>
                        <div className={styles.passwordInputWrapper}>
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Введите пароль"
                                value={password}
                                onChange={handlePasswordChange}
                                className={`${styles.formInput} ${passwordError ? styles.inputError : ''}`}
                            />
                            <button
                                type="button"
                                className={styles.togglePassword}
                                onClick={togglePasswordVisibility}
                            >
                                <img
                                    src={eyeOpen}
                                    alt={showPassword ? "Скрыть пароль" : "Показать пароль"}
                                />
                            </button>
                        </div>
                        {passwordError && (
                            <p className={styles.passwordError}>{passwordError}</p>
                        )}
                        {!passwordError && password.length > 0 && (
                            <p className={styles.passwordSuccess}>Пароль соответствует требованиям</p>
                        )}
                    </div>

                    <button
                        className={styles.submitButton}
                        onClick={handleCreateCompanyAndAdmin}
                        disabled={!!passwordError || !password || !companyId}
                    >
                        Добавить компанию
                    </button>
                </div>
            )}

            {isSuperAdmin && companies.length > 0 && (
                <div className={styles.section}>
                    <h3 className={styles.sectionTitle}>Список компаний</h3>
                    <div className={styles.companiesList}>
                        {companies.map(company => (
                            <div key={company.id} className={styles.companyItem}>
                                <div className={styles.companyInfo}>
                                    <span className={styles.companyName}>{company.name}</span>
                                    <span className={styles.companyDate}>({new Date(company.created_at).toLocaleDateString()})</span>
                                </div>
                                <button
                                    className={styles.deleteButton}
                                    onClick={() => handleDeleteCompany(company.id)}
                                    aria-label="Удалить компанию"
                                >
                                    <img src={close} alt="Удалить"/>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className={styles.section}>
                <h3 className={styles.sectionTitle}>
                    {isSuperAdmin ? "Список администраторов" : "Список пользователей"}
                </h3>

                {users.length > 0 ? (
                    <div className={styles.usersTable}>
                        <div className={styles.tableHeader}>
                            <div className={styles.headerCell}>ФИО</div>
                            <div className={styles.headerCell}>Email</div>
                            <div className={styles.headerCell}>Действия</div>
                        </div>

                        <div className={styles.tableBody}>
                            {users
                                .filter(user => (isSuperAdmin && user.role_id === 2) || (isAdmin && user.role_id === 1))
                                .map(user => (
                                    <div key={user.id} className={styles.tableRow}>
                                        <div className={styles.tableCell}>{user.name}</div>
                                        <div className={styles.tableCell}>{user.email}</div>
                                        <div className={styles.tableCell}>
                                            <div className={styles.actionButtons}>
                                                {user.confirmed === null && (
                                                    <button
                                                        className={styles.allowButton}
                                                        onClick={() => handleAccessChange(user.id, true)}
                                                        aria-label="Подтвердить доступ"
                                                    >
                                                        <img src={agree} alt="Подтвердить" width={18} height={18} />
                                                    </button>
                                                )}
                                                {isSuperAdmin && (
                                                    <button
                                                        className={styles.editButton}
                                                        onClick={() => handleEditUser(user)}
                                                        aria-label="Редактировать"
                                                    >
                                                        <img src={editIcon} alt="Редактировать" />
                                                    </button>
                                                )}
                                                <button
                                                    className={styles.denyButton}
                                                    onClick={() => handleAccessChange(user.id, false)}
                                                    aria-label="Отклонить доступ"
                                                >
                                                    <img src={close} alt="Отклонить" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </div>
                ) : (
                    <p className={styles.noDataMessage}>
                        {isSuperAdmin ? "Администраторов нет" : "Пользователей нет"}
                    </p>
                )}
            </div>

            {editingUser && (
                <div className={styles.modalOverlay}>
                    <div className={styles.editModal}>
                        <div className={styles.modalHeader}>
                            <h3 className={styles.modalTitle}>Редактирование пользователя</h3>
                            <button
                                className={styles.closeModalButton}
                                onClick={handleCloseEditModal}
                                aria-label="Закрыть"
                            >
                                &times;
                            </button>
                        </div>

                        <div className={styles.modalContent}>
                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Имя пользователя</label>
                                <input
                                    type="text"
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    placeholder="Введите имя"
                                    className={styles.formInput}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Email пользователя</label>
                                <input
                                    type="email"
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                                    placeholder="Введите email"
                                    className={styles.formInput}
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label className={styles.formLabel}>Новый пароль</label>
                                <div className={styles.passwordInputWrapper}>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={handleNewPasswordChange}
                                        placeholder="Оставьте пустым, чтобы не менять"
                                        className={`${styles.formInput} ${newPasswordError ? styles.inputError : ''}`}
                                    />
                                    <button
                                        type="button"
                                        className={styles.togglePassword}
                                        onClick={toggleNewPasswordVisibility}
                                        aria-label={showNewPassword ? "Скрыть пароль" : "Показать пароль"}
                                    >
                                        <img
                                            src={eyeOpen}
                                            alt={showNewPassword ? "Скрыть пароль" : "Показать пароль"}
                                        />
                                    </button>
                                </div>
                                {newPasswordError && (
                                    <p className={styles.passwordError}>{newPasswordError}</p>
                                )}
                                {!newPasswordError && newPassword.length > 0 && (
                                    <p className={styles.passwordSuccess}>Пароль соответствует требованиям</p>
                                )}
                            </div>
                        </div>

                        <div className={styles.modalFooter}>
                            <button
                                className={styles.cancelButton}
                                onClick={handleCloseEditModal}
                            >
                                Отмена
                            </button>
                            <button
                                className={styles.saveButton}
                                onClick={handleSaveUser}
                                disabled={!!newPasswordError}
                            >
                                Сохранить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AccessControl;