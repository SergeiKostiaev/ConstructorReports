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
            }
        };

        fetchData();
    }, [isSuperAdmin, isAdmin, token]);

    const generateCompanyId = () => {
        setCompanyId(`ID-${Math.random().toString(36).substr(2, 5).toUpperCase()}`);
    };

    const handleCreateCompanyAndAdmin = async () => {
        if (!companyId || !adminName || !adminEmail || !password) {
            alert("Заполните все поля!");
            return;
        }

        try {
            const generatedCompanyId = `ID-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

            const companyResponse = await fetch(`${API_URL}/api/company`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: generatedCompanyId })
            });

            const companyData = await companyResponse.json();
            console.log("Ответ при создании компании:", companyData);

            if (!companyResponse.ok || !companyData.success) {
                alert(`Ошибка при создании компании: ${JSON.stringify(companyData)}`);
                return;
            }

            const adminPayload = {
                company_id: generatedCompanyId, // Теперь передаем строку
                name: adminName,
                email: adminEmail,
                password: password
            };

            console.log("Отправляем запрос на создание администратора:", adminPayload);

            const adminResponse = await fetch(`${API_URL}/api/user/admin`, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(adminPayload)
            });

            const adminData = await adminResponse.json();
            console.log("Ответ при создании администратора:", adminData);

            if (!adminResponse.ok || !adminData.success) {
                alert(`Ошибка при создании админа: ${JSON.stringify(adminData)}`);
                return;
            }

            console.log("Компания и администратор успешно созданы!");

            // Очистка полей
            generateCompanyId();
            setAdminName('');
            setAdminEmail('');
            setPassword('');
        } catch (error) {
            console.log("Произошла ошибка при отправке запроса:", error);
        }
    };

    const handleAccessChange = async (userId, allow) => {
        try {
            if (!allow) {
                // Если "Отклонить", отправляем DELETE-запрос
                const response = await fetch(`${API_URL}/api/user`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ user_id: userId }) // Удаляем пользователя
                });

                const data = await response.json();

                if (!response.ok) {
                    console.log(data.message || "Ошибка при удалении пользователя");
                    return;
                }

                console.log(data.message); // Логируем сообщение "Пользователь удален"

                // Удаляем пользователя из списка
                setUsers(users.filter(user => user.id !== userId));
                return;
            }

            // Если "Подтвердить", отправляем PATCH-запрос
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
                console.log(data.message || "Ошибка при изменении доступа");
                return;
            }

            console.log("Пользователь подтвержден");

            // Обновляем статус пользователя
            setUsers(users.map(user => user.id === userId ? { ...user, confirmed: true } : user));
        } catch (error) {
            console.error("Ошибка обновления доступа:", error);
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

            // Обновляем список компаний после удаления
            setCompanies(companies.filter(company => company.id !== companyId));
            console.log("Компания успешно удалена!");
        } catch (error) {
            console.error("Ошибка при удалении компании:", error);
            console.log("Ошибка при удалении компании");
        }
    };


    return (
        <div className={styles.accessControl}>
            {/*{isSuperAdmin && <h3>Админ панель: SuperAdmin</h3>}*/}
            {/*{isAdmin && <h2>Админ панель</h2>}*/}

            {isSuperAdmin && (
                <div className={styles.createCompanyForm}>
                    <p>Добавление новой компании</p>
                    <div className={styles.companyId}>
                        <input type="text" value={companyId} readOnly />
                        <button onClick={generateCompanyId}>🔄</button>
                    </div>
                    <input
                        type="text"
                        placeholder="ФИО администратора"
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
                    <h3>Список компаний</h3>
                    <ul>
                        {companies.length > 0 ? (
                            companies.map(company => (
                                <li key={company.id} className={styles.companyItem}>
                                    <span>{company.name} ({company.created_at})</span>
                                    <button className={styles.deleteButton} onClick={() => handleDeleteCompany(company.id)}>
                                        <img src={close} alt="delete"/>
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
            {isAdmin && <h3>Список пользователей</h3>}

            <ul className={styles.userList}>
                {users.filter(user => (isSuperAdmin && (user.role_id === 2)) || (isAdmin && user.role_id === 1)).length > 0 ? (
                    users
                        .filter(user => (isSuperAdmin && (user.role_id === 2)) || (isAdmin && user.role_id === 1))
                        .map(user => (
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
                    <p>{isSuperAdmin ? "Администраторов нет" : "Пользователей нет"}</p>
                )}
            </ul>

        </div>
    );
};

export default AccessControl;
