import React, { useState, useEffect } from 'react'; // Добавьте useEffect
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
import ProcessControl from "../ProcessControl/ProcessControl.jsx";
import {useSelector} from "react-redux";

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
    const { logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const [reports, setReports] = useState([]);
    const activeReports = useSelector(state => state.reports.activeProcesses);


    const fetchReports = async () => {
        try {
            const response = await fetch(`${API_URL}/api/report/list`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) throw new Error('Ошибка при получении отчетов');

            const data = await response.json();
            console.log('Fetched reports:', data);
            setReports(Array.isArray(data) ? data : []); // обновляем список отчетов
        } catch (error) {
            toast.error("Ошибка загрузки отчетов", { position: "top-right" });
        }
    };

    useEffect(() => {
        fetchReports();
    }, []);

    // Загружаем сохранённую вкладку из localStorage при инициализации
    const [active, setActive] = useState(() => {
        const savedTab = localStorage.getItem('activeTab');
        return savedTab !== null ? Number(savedTab) : 0;
    });

    const [selectedReportId, setSelectedReportId] = useState(() => {
        const savedReportId = localStorage.getItem('selectedReportId');
        return savedReportId !== null ? Number(savedReportId) : null;
    });
    const userRole = Number(localStorage.getItem('role'));
    const isConfirmed =
        userRole === 2 ||
        userRole === 3 ||
        (userRole === 1 && localStorage.getItem('confirmed') === 'true');

    useEffect(() => {
        if (selectedReportId !== null) {
            localStorage.setItem('selectedReportId', selectedReportId.toString());
        } else {
            localStorage.removeItem('selectedReportId');
        }
    }, [selectedReportId]);

    // Сохраняем активную вкладку в localStorage при её изменении
    useEffect(() => {
        localStorage.setItem('activeTab', active.toString());
        if (selectedReportId !== null) {
            localStorage.setItem('selectedReportId', selectedReportId.toString());
        } else {
            localStorage.removeItem('selectedReportId');
        }
    }, [active, selectedReportId]);

    const onReportSelect = (id) => {
        setSelectedReportId(id);
        setActive(1);
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
            title: 'Конструктор отчетов',
            content: (
                <DataContainer title="Конструктор отчетов">
                    {selectedReportId !== null ? (
                        <ReportCreation idReport={selectedReportId} />
                    ) : (
                        <p>Выберите отчет из системы</p>
                    )}
                </DataContainer>
            ),
        },
        {
            title: 'Контроль процессов',
            content: (
                <DataContainer title="Контроль процессов">
                    <ProcessControl activeProcesses={activeReports} />
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
        const fileType = file.name.split('.').pop().toLowerCase();
        console.log("Загружаемый файл:", file);
        console.log("Тип файла:", fileType);

        if (fileType === 'json') {
            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const jsonData = JSON.parse(event.target.result);
                    const formData = new FormData();
                    formData.append("file", new Blob([JSON.stringify(jsonData)], { type: 'application/json' }), file.name);

                    const response = await fetch(`${API_URL}/api/report/import`, {
                        method: 'POST',
                        headers: { Authorization: `Bearer ${bearerToken}` },
                        body: formData,
                    });

                    const responseText = await response.text();
                    try {
                        const result = JSON.parse(responseText);
                        console.log("Результат от сервера:", result);
                        if (result.success) {
                            toast.success("Отчет успешно импортирован", { position: "top-right" });
                            fetchReports();
                        } else {
                            toast.error(`Ошибка: ${JSON.stringify(result)}`, { position: "top-right" });
                        }
                    } catch (err) {
                        console.error("Не удалось разобрать JSON. Сервер вернул:", responseText);
                        toast.error("Сервер вернул неожиданный ответ (возможно, HTML)", { position: "top-right" });
                    }
                } catch (error) {
                    console.error("Ошибка при обработке JSON:", error);
                    toast.error("Ошибка при обработке JSON файла", { position: "top-right" });
                }
            };

            reader.readAsText(file);
        } else if (['xls', 'xlsx', 'ods', 'csv'].includes(fileType)) {
            try {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const workbook = XLSX.read(event.target.result, { type: 'binary' });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true });

                        // Преобразуем числовые даты в строки
                        jsonData.forEach(row => {
                            Object.entries(row).forEach(([key, value]) => {
                                if (typeof value === 'number' && value > 30000 && value < 60000) {
                                    const parsedDate = XLSX.SSF.parse_date_code(value);
                                    if (parsedDate) {
                                        const day = String(parsedDate.d).padStart(2, '0');
                                        const month = String(parsedDate.m).padStart(2, '0');
                                        const year = String(parsedDate.y);
                                        row[key] = `${day}.${month}.${year}`;
                                    }
                                }
                            });
                        });

                        // Перезапишем worksheet
                        const newWorksheet = XLSX.utils.json_to_sheet(jsonData);
                        const newWorkbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, workbook.SheetNames[0]);

                        // Создаем Blob из workbook
                        const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
                        const modifiedFile = new Blob([wbout], { type: file.type });

                        const formData = new FormData();
                        formData.append("file", new File([modifiedFile], file.name, { type: file.type }));

                        const response = await fetch(`${API_URL}/api/report/import`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${bearerToken}` },
                            body: formData,
                        });

                        const responseText = await response.text();
                        try {
                            const result = JSON.parse(responseText);
                            console.log("Результат от сервера (XLSX/ODS/CSV):", result);

                            if (result.success) {
                                toast.success("Отчет успешно импортирован", { position: "top-right" });
                                fetchReports();
                            } else {
                                toast.error(`Ошибка: ${JSON.stringify(result)}`, { position: "top-right" });
                            }
                        } catch (err) {
                            console.error("Сервер вернул не JSON:", responseText);
                            toast.error("Сервер вернул неожиданный ответ", { position: "top-right" });
                        }
                    } catch (error) {
                        console.error("Ошибка при отправке файла:", error);
                        toast.error("Ошибка при отправке Excel/ODS файла", { position: "top-right" });
                    }
                };

                reader.readAsBinaryString(file);
            } catch (error) {
                console.error("Ошибка при чтении Excel файла:", error);
                toast.error("Ошибка при обработке Excel/ODS/CSV файла", { position: "top-right" });
            }
        } else {
            toast.warn("Формат файла не поддерживается", { position: "top-right" });
        }
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
