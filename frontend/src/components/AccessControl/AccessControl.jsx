import { useState, useEffect } from 'react';
import styles from './AccessControl.module.sass';
// import { User } from "./AccessControl.interface.ts";

const API_URL = import.meta.env.VITE_API_URL;

import agree from "../../assets/agree.svg";
import close from "../../assets/close.svg";

const AccessControl = () => {
    const [users, setUsers] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [token, setToken] = useState(null);

    useEffect(() => {
        const role = localStorage.getItem('role');
        setIsAdmin(role === '2');

        const storedToken = localStorage.getItem('api_token');
        setToken(storedToken);
    }, []);

    useEffect(() => {
        if (isAdmin) {
            const fetchUsers = async () => {
                try {
                    const response = await fetch(`${API_URL}/api/users`, {
                        method: 'GET',
                        headers: {
                            'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                            'Content-Type': 'application/json',
                        },
                    });
                    const data = await response.json();

                    if (data.success) {
                        setUsers(data.data);
                    }
                } catch (error) {
                    console.error("Ошибка при загрузке пользователей:", error);
                }
            };

            fetchUsers();
        }
    }, [isAdmin]);

    const handleAccessChange = async (userId, allowAccess) => {
        if (!token) {
            console.error("Токен отсутствует!");
            return;
        }

        try {
            const url = allowAccess
                ? `${API_URL}/api/user/confirmed`
                : `${API_URL}/api/user`;

            const method = allowAccess ? 'PATCH' : 'DELETE';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ user_id: userId }),
            });

            if (!response.ok) {
                throw new Error(`Ошибка HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                if (allowAccess) {
                    setUsers((prevUsers) =>
                        prevUsers.map((user) =>
                            user.id === userId ? { ...user, confirmed: true, accessAllowed: true } : user
                        )
                    );
                } else {
                    setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
                }
            } else {
                console.error("Ошибка при обновлении статуса пользователя:", data);
            }
        } catch (error) {
            console.error("Ошибка при отправке запроса:", error);
        }
    };

    if (!isAdmin) {
        return <p>У вас нет доступа к этой странице.</p>;
    }

    return (
        <div className={styles.accessControl}>
            <ul className={styles.userList}>
                {users.map((user) => (
                    <li key={user.id} className={styles.userItem}>
                        <div className={styles.userInfo}>
                            <p>{user.name}</p>
                            <p>{user.email}</p>
                        </div>
                        <div className={styles.actionButtons}>
                            {user.confirmed === null && (
                                <button
                                    className={styles.allowButton}
                                    onClick={() => handleAccessChange(user.id, true)}
                                >
                                    <p>Разрешить</p>
                                    <img src={agree} alt="agree"/>
                                </button>
                            )}
                            <button
                                className={styles.denyButton}
                                onClick={() => handleAccessChange(user.id, false)}
                            >
                                <p>Удалить</p>
                                <img src={close} alt="deny"/>
                            </button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default AccessControl;
