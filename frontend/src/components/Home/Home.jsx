import React, { useState } from 'react';
import styles from './Home.module.sass';
import { useAuth } from "../../context/AuthContext";
import AccessControl from "../AccessControl/AccessControl.jsx";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import DataContainer from "../DataContainer/DataContainer.jsx";
import Reports from "../Reports/Reports.jsx";
import ReportCreation from "../ReportCreation/ReportCreation.jsx";
import Analytics from "../Analytics/Analytics.jsx";

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
    const { logout } = useAuth();
    const [active, setActive] = useState(0);
    const [selectedReportId, setSelectedReportId] = useState(null);
    const userRole = Number(localStorage.getItem('role'));
    const isConfirmed =
        userRole === 2 ||
        userRole === 3 ||
        (userRole === 1 && localStorage.getItem('confirmed') === 'true');


    const onReportSelect = (id) => {
        setSelectedReportId(id);
        setActive(1);
    };

    const fetchReports = () => {
        console.log('Fetching reports...');
    };

    const items = isConfirmed ? [
        {
            title: 'Отчеты',
            content: (
                <DataContainer title="Отчеты">
                    <Reports onReportSelect={onReportSelect} fetchReports={fetchReports} />
                </DataContainer>
            ),
        },
        {
            title: 'Настройка отчетов',
            content: (
                <DataContainer title="Настройка отчетов">
                    {selectedReportId !== null ? (
                        <ReportCreation idReport={selectedReportId} />
                    ) : (
                        <p>Выберите отчет из системы</p>
                    )}
                </DataContainer>
            ),
        },
        {
            title: 'Аналитика',
            content: (
                <DataContainer title="Аналитика">
                    <Analytics />
                </DataContainer>
            ),
        },
        ...(userRole === '2' || userRole === '3' ? [{
            title: 'Доступ',
            content: (
                <DataContainer title="Доступ">
                    <AccessControl />
                </DataContainer>
            ),
        }] : []),
    ] : [];

    const openTab = (e) => {
        const index = Number(e.currentTarget.dataset.index ?? 0);
        setActive(index >= 0 && index < items.length ? index : 0);
    };

    const handleUploadFile = (e) => {
        e.preventDefault();
        const bearerToken = localStorage.getItem("api_token");

        if (!bearerToken) {
            toast.error("Ошибка: отсутствует токен авторизации", { position: "top-right" });
            return;
        }

        if (!e.target.files || e.target.files.length === 0) {
            toast.warn("Файл не выбран", { position: "top-right" });
            return;
        }

        const data = new FormData();
        data.append("file", e.target.files[0]);

        fetch(`${API_URL}/api/report/import`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${bearerToken}`,
            },
            body: data,
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    toast.success("Отчет успешно импортирован", { position: "top-right" });
                    fetchReports();
                } else {
                    toast.error(`Ошибка: ${JSON.stringify(data)}`, { position: "top-right" });
                }
            })
            .catch((error) => {
                toast.error("Ошибка загрузки файла", { position: "top-right" });
            });
    };

    return (
        <div className={styles.container}>
            <div className={styles.container__wrap}>
                <div className={styles.header}>
                    <div className={styles.header__btn}>
                        <h1>Конструктор отчетов</h1>
                        {isConfirmed && (
                            <div className={styles.header__itemBtn} style={{ position: 'relative' }}>
                                <p>Выбрать отчет из системы</p>
                                <input
                                    type="file"
                                    style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    accept=".xlsx,.xls,.ods,.csv,.json"
                                    onChange={handleUploadFile}
                                />
                            </div>
                        )}
                    </div>
                    <p>Добро пожаловать, {localStorage.getItem('name') || 'гость'}!</p>
                    <p className={styles.exit} onClick={logout}>Выйти</p>
                </div>

                <div className={styles.tabs}>
                    {isConfirmed ? (
                        items.map((n, i) => (
                            <button
                                key={i}
                                className={`${styles.tablinks} ${i === active ? styles.active : ''}`}
                                onClick={openTab}
                                data-index={i}
                            >
                                {n.title}
                            </button>
                        ))
                    ) : (
                        <p className={styles.error_user}>Ваш профиль еще не подтвержден, <br /> зайдите позже!</p>
                    )}
                </div>
                {isConfirmed && <div className={styles.tabContent}>{items[active]?.content}</div>}
            </div>
        </div>
    );
};

export default Home;
