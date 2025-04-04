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
import { FaUserCircle } from "react-icons/fa";
import * as XLSX from 'xlsx';

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
    const { logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);

    // const name = localStorage.getItem("name") || "Гость";
    // const initials = name !== "Гость"
    //     ? name.split(" ").map((word) => word[0]).slice(2, 8).join("").toUpperCase()
    //     : null;

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
        console.log('Загрузка отчетов...');
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
        ...(userRole === 2 || userRole === 3 ? [{
            title: "Доступ",
            content: (
                <DataContainer title={`Доступ: ${userRole === 2 ? "Админ" : "Супер Админ"}`}>
                    <AccessControl />
                </DataContainer>
            ),
        }] : [])
    ] : [];

    const openTab = (e) => {
        const index = Number(e.currentTarget.dataset.index ?? 0);
        setActive(index >= 0 && index < items.length ? index : 0);
    };

    const handleUploadFile = async (e) => {
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

        const file = e.target.files[0];
        const reader = new FileReader();

        reader.onload = async (event) => {
            const data = new Uint8Array(event.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

            // Исправление дат
            jsonData.forEach(row => {
                Object.keys(row).forEach(key => {
                    if (!isNaN(row[key]) && row[key] > 30000) { // Простая проверка на дату
                        row[key] = XLSX.SSF.format("dd.mm.yyyy", row[key]); // Преобразование в дату
                    }
                });
            });

            // Отправляем данные на сервер
            const formData = new FormData();
            formData.append("file", file);

            try {
                const response = await fetch(`${API_URL}/api/report/import`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${bearerToken}` },
                    body: formData,
                });
                const result = await response.json();
                if (result.success) {
                    toast.success("Отчет успешно импортирован", { position: "top-right" });
                    fetchReports();
                } else {
                    toast.error(`Ошибка: ${JSON.stringify(result)}`, { position: "top-right" });
                }
            } catch (error) {
                toast.error("Ошибка загрузки файла", { position: "top-right" });
            }
        };

        reader.readAsArrayBuffer(file);
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
                    <div className={styles.avatarContainer} onMouseEnter={() => setMenuOpen(true)} onMouseLeave={() => setMenuOpen(false)}>
                        <p className={styles.userName}>{localStorage.getItem('name') || 'Гость'}</p>
                        <FaUserCircle className={styles.defaultAvatar} size={40} />

                        {menuOpen && (
                            <div className={styles.menu}>
                                <p className={styles.menuItem} onClick={logout}>
                                    Выйти
                                </p>
                            </div>
                        )}
                    </div>

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
