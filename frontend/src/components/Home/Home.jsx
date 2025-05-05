import React, { useState, useEffect } from 'react';
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
import ProcessControl from "../ProcessControl/ProcessControl.jsx";
import * as XLSX from 'xlsx';

import { useSelector, useDispatch } from "react-redux";
import { addNewReport, fetchReports } from '../features/reportsSlice';

import Logo from '/logo.svg';

const API_URL = import.meta.env.VITE_API_URL;

const Home = () => {
    const { logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const dispatch = useDispatch();
    const activeReports = useSelector(state => state.reports.activeProcesses);

    // Загружаем сохранённую вкладку из localStorage
    const [active, setActive] = useState(() => {
        const savedTab = localStorage.getItem('activeTab');
        return savedTab !== null ? Number(savedTab) : 0;
    });

    const [selectedReportId, setSelectedReportId] = useState(() => {
        const savedReportId = localStorage.getItem('selectedReportId');
        return savedReportId !== null ? Number(savedReportId) : null;
    });

    const userRole = Number(localStorage.getItem('role'));
    const isConfirmed = userRole === 2 || userRole === 3 ||
        (userRole === 1 && localStorage.getItem('confirmed') === 'true');

    // Сохраняем выбранный отчет в localStorage
    useEffect(() => {
        if (selectedReportId !== null) {
            localStorage.setItem('selectedReportId', selectedReportId.toString());
        } else {
            localStorage.removeItem('selectedReportId');
        }
    }, [selectedReportId]);
    // Сохраняем активную вкладку в localStorage
    useEffect(() => {
        localStorage.setItem('activeTab', active.toString());
    }, [active]);

    const onReportSelect = (id) => {
        setSelectedReportId(id);
        setActive(1);
    };

    const items = isConfirmed ? [
        {
            title: 'Отчеты',
            content: (
                <DataContainer title="Отчеты">
                    <Reports onReportSelect={onReportSelect} />
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
            toast.error("Ошибка: отсутствует токен авторизации");
            return;
        }

        if (!e.target.files || e.target.files.length === 0) {
            toast.warn("Файл не выбран");
            return;
        }

        const file = e.target.files[0];
        const fileName = file.name.split('.')[0];
        const fileType = file.name.split('.').pop().toLowerCase();

        // Оптимистичное добавление отчета
        const tempReport = {
            id: Date.now(), // временный ID
            name: fileName,
            created_at: new Date().toLocaleString('ru-RU'),
            updated_at: new Date().toLocaleString('ru-RU'),
            creator: localStorage.getItem('name') || 'Вы',
            status: 'Загружается...',
            isTemp: true
        };

        dispatch(addNewReport(tempReport));

        try {
            let response;
            let result;

            // Для Excel и OpenDocument файлов (XLSX/XLS/ODS)
            if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'ods') {
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

                        response = await fetch(`${API_URL}/api/report/import`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${bearerToken}` },
                            body: formData,
                        });

                        // Обработка ответа сервера
                        try {
                            const responseText = await response.text();
                            result = responseText ? JSON.parse(responseText) : {};

                            if (response.ok && result.success) {
                                toast.success("Отчет успешно импортирован");
                                dispatch(fetchReports());
                            } else {
                                toast.error(result.message || "Ошибка при импорте отчета");
                            }
                        } catch (jsonError) {
                            console.error("Ошибка парсинга JSON:", jsonError);
                            toast.error("Сервер вернул неожиданный ответ");
                        }
                    } catch (error) {
                        console.error("Ошибка при обработке Excel файла:", error);
                        toast.error("Ошибка при обработке Excel файла");
                    }
                };
                reader.readAsBinaryString(file);
                return; // Выходим из функции, так как обработка асинхронная
            } else {
                // Для CSV/JSON файлов загружаем как есть
                const formData = new FormData();
                formData.append("file", file);
                response = await fetch(`${API_URL}/api/report/import`, {
                    method: 'POST',
                    headers: { Authorization: `Bearer ${bearerToken}` },
                    body: formData,
                });
            }

            // Обработка ответа сервера для не-Excel файлов
            try {
                const responseText = await response.text();
                result = responseText ? JSON.parse(responseText) : {};

                if (response.ok && result.success) {
                    toast.success("Отчет успешно импортирован");
                    dispatch(fetchReports());
                } else {
                    toast.error(result.message || "Ошибка при импорте отчета");
                }
            } catch (jsonError) {
                console.error("Ошибка парсинга JSON:", jsonError);
                toast.error("Сервер вернул неожиданный ответ");
            }
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            toast.error("Ошибка при отправке файла");
        }
    };

    // Вспомогательная функция для загрузки файла
    const uploadFile = async (formData, bearerToken) => {
        try {
            const response = await fetch(`${API_URL}/api/report/import`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                },
                body: formData,
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("Отчет успешно загружен");
                dispatch(fetchReports());
            } else {
                toast.error(result.message || "Ошибка при загрузке отчета");
                throw new Error(result.message || "Ошибка при загрузке отчета");
            }
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            throw error;
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.container__wrap}>
                <div className={styles.header}>
                    <div className={styles.header__btn}>
                        {/*<h1>Конструктор отчетов</h1>*/}
                        <img src={Logo} alt="Logo" width={115}/>
                        {isConfirmed && (
                            <div className={styles.header__itemBtn} style={{ position: 'relative' }}>
                                <p>Импортировать отчет</p>
                                <input
                                    type="file"
                                    style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                                    accept=".xlsx,.xls,.ods,.csv,.json"
                                    onChange={handleUploadFile}
                                />
                            </div>
                        )}
                    </div>
                    <div
                        className={styles.avatarContainer}
                        onMouseEnter={() => setMenuOpen(true)}
                        onMouseLeave={() => setMenuOpen(false)}
                    >
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
                            <button key={i}
                                    className={`${styles.tablinks} ${i === active ? styles.active : ''}`}
                                    onClick={openTab}
                                    data-index={i}
                            >
                                {n.title}
                            </button>
                        ))
                    ) : (
                        <p className={styles.error_user}>
                            Ваш профиль еще не подтвержден, <br /> зайдите позже!
                        </p>
                    )}
                </div>

                {isConfirmed && <div className={styles.tabContent}>{items[active]?.content}</div>}
            </div>
        </div>
    );
};

export default Home;