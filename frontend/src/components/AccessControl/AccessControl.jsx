import { useState, useEffect } from 'react';
import styles from './AccessControl.module.sass';

const API_URL = import.meta.env.VITE_API_URL;

import agree from "../../assets/agree.svg";
import close from "../../assets/close.svg";

const AccessControl = () => {
    const [users, setUsers] = useState([]);
    const [companies, setCompanies] = useState([]);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [token, setToken] = useState(null);

    const [companyId, setCompanyId] = useState('');
    const [adminName, setAdminName] = useState('');
    const [adminEmail, setAdminEmail] = useState('');
    const [password, setPassword] = useState('');

    useEffect(() => {
        const role = Number(localStorage.getItem('role'));
        const storedToken = localStorage.getItem('api_token');

        setToken(storedToken);
        setIsSuperAdmin(role === 3);
        setIsAdmin(role === 2);
        generateCompanyId(); // Генерация ID при загрузке
    }, []);

    useEffect(() => {
        if (!token || (!isSuperAdmin && !isAdmin)) return;

        const fetchData = async () => {
            try {
                const [usersRes, companiesRes] = await Promise.all([
                    fetch(`${API_URL}/api/users`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    }),
                    fetch(`${API_URL}/api/companies`, {
                        headers: { 'Authorization': `Bearer ${token}` }
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
            }
        };

        fetchData();
    }, [isSuperAdmin, isAdmin, token]);

    const generateCompanyId = () => {
        setCompanyId(`COMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    };

    const handleCreateCompanyAndAdmin = async () => {
        if (!companyId || !adminName || !adminEmail || !password) {
            alert("Заполните все поля!");
            return;
        }

        try {
            // Создание компании
            const companyResponse = await fetch(`${API_URL}/api/company`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: companyId })
            });

            const companyData = await companyResponse.json();
            if (!companyResponse.ok || !companyData.name) {
                alert(`Ошибка при создании компании: ${JSON.stringify(companyData)}`);
                return;
            }

            // Добавление администратора
            const adminResponse = await fetch(`${API_URL}/api/user/admin`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    company_id: companyId,
                    name: adminName,
                    email: adminEmail,
                    password: password
                })
            });

            const adminData = await adminResponse.json();
            if (!adminResponse.ok || !adminData.company_id) {
                alert(`Ошибка при создании админа: ${JSON.stringify(adminData)}`);
                return;
            }

            alert("Компания и администратор успешно созданы!");

            // Обновление списка пользователей (запрос свежих данных с сервера)
            const usersRes = await fetch(`${API_URL}/api/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const usersData = await usersRes.json();
            if (usersData.success) {
                setUsers(usersData.data); // Обновляем весь список пользователей
            }

            // Очистка полей и генерация нового ID компании
            generateCompanyId();
            setAdminName('');
            setAdminEmail('');
            setPassword('');
        } catch (error) {
            alert("Произошла ошибка при отправке запроса.");
        }
    };


    const handleAccessChange = async (userId, allow) => {
        try {
            const response = await fetch(`${API_URL}/api/user/confirmed`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ user_id: userId, confirmed: allow })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Ошибка при изменении доступа");
                return;
            }

            setUsers(users.map(user => user.id === userId ? { ...user, confirmed: allow } : user));
        } catch (error) {
            console.error("Ошибка обновления доступа:", error);
        }
    };


    const handleDeleteCompany = async (companyId) => {
        if (!window.confirm("Вы уверены, что хотите удалить эту компанию?")) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/companies/${company_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error("Ошибка при удалении компании");
            }

            // Обновляем список компаний после удаления
            setCompanies(companies.filter(company => company.id !== companyId));
            alert("Компания успешно удалена!");
        } catch (error) {
            console.error("Ошибка при удалении компании:", error);
            alert("Ошибка при удалении компании");
        }
    };

    return (
        <div className={styles.accessControl}>
            {isSuperAdmin && <h2>Админ панель: SuperAdmin</h2>}
            {isAdmin && <h2>Админ панель</h2>}

            {isSuperAdmin && (
                <div className={styles.createCompanyForm}>
                    <h3>Новая компания</h3>
                    <div className={styles.companyId}>
                        <input type="text" value={companyId} readOnly />
                        <button onClick={generateCompanyId}>🔄</button>
                    </div>
                    <input
                        type="text"
                        placeholder="Имя администратора"
                        value={adminName}
                        onChange={(e) => setAdminName(e.target.value)}
                    />
                    <input
                        type="email"
                        placeholder="Email администратора"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={handleCreateCompanyAndAdmin}>Добавить компанию</button>
                </div>
            )}

            {isSuperAdmin && (
                <>
                    <h4>Список компаний</h4>
                    <ul>
                        {companies.length > 0 ? (
                            companies.map(company => (
                                <li key={company.id} className={styles.companyItem}>
                                    <span>{company.name} ({company.created_at})</span>
                                    <button className={styles.deleteButton} onClick={() => handleDeleteCompany(company.id)}>
                                        ❌
                                    </button>
                                </li>
                            ))
                        ) : (
                            <p>Компаний пока нет</p>
                        )}
                    </ul>
                </>
            )}

            {isSuperAdmin && <h3>Список администраторов</h3>}
            <ul className={styles.userList}>
                {users.length > 0 ? (
                    users.map(user => (
                        <li key={user.id} className={styles.userItem}>
                            <div className={styles.userName}>
                                <p>{user.name}</p>
                            </div>
                            <div className={styles.userEmail}>
                                <p>{user.email}</p>
                            </div>
                            <div className={styles.actionButtons}>
                                {user.confirmed === null && (
                                    <button className={styles.allowButton} onClick={() => handleAccessChange(user.id, true)}>
                                        <img src={agree} alt="Разрешить" width={18} height={18} />
                                    </button>
                                )}
                                <button className={styles.denyButton} onClick={() => handleAccessChange(user.id, false)}>
                                    <img src={close} alt="Отклонить" />
                                </button>
                            </div>
                        </li>
                    ))
                ) : (
                    <p>Администраторов нет</p>
                )}
            </ul>
        </div>
    );
};

export default AccessControl;
