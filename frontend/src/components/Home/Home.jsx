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

// Вспомогательные функции для работы с датами
const excelSerialToDate = (serial) => {
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const date = new Date(utcValue * 1000);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() + offset);
};

const formatDate = (date) => {
    if (!date) return '';

    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return '';

    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();

    return `${day}.${month}.${year}`;
};

// Улучшенная функция проверки даты
const isDateColumn = (header, sampleValue, allValues) => {
    const dateKeywords = ['дата', 'date', 'рожд', 'прием', 'начало', 'конец', 'срок'];
    const isDateByName = dateKeywords.some(keyword =>
        header.toLowerCase().includes(keyword)
    );

    if (!isDateByName) return false;

    const dateValuesCount = allValues.filter(val => {
        if (val === null || val === undefined || val === '') return false;

        // Проверка формата dd.mm.yyyy
        if (typeof val === 'string' && /^\d{2}\.\d{2}\.\d{4}$/.test(val)) {
            const [day, month, year] = val.split('.');
            const date = new Date(year, month-1, day);
            return !isNaN(date.getTime());
        }

        // Проверка Excel serial date
        if (typeof val === 'number' && val > 0 && val < 50000) {
            const date = excelSerialToDate(val);
            return !isNaN(date.getTime());
        }

        // Проверка ISO формата
        if (typeof val === 'string') {
            const date = new Date(val);
            return !isNaN(date.getTime());
        }

        return false;
    }).length;

    return dateValuesCount / allValues.filter(v => v !== null && v !== undefined && v !== '').length > 0.7;
};

const Home = () => {
    const { logout } = useAuth();
    const [menuOpen, setMenuOpen] = useState(false);
    const dispatch = useDispatch();
    const activeReports = useSelector(state => state.reports.activeProcesses);

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

    useEffect(() => {
        if (selectedReportId !== null) {
            localStorage.setItem('selectedReportId', selectedReportId.toString());
        } else {
            localStorage.removeItem('selectedReportId');
        }
    }, [selectedReportId]);

    useEffect(() => {
        localStorage.setItem('activeTab', active.toString());
    }, [active]);

    const onReportSelect = (id) => {
        setSelectedReportId(id);
        // setActive(1);
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

        const tempReport = {
            id: Date.now(),
            name: fileName,
            created_at: new Date().toLocaleString('ru-RU'),
            updated_at: new Date().toLocaleString('ru-RU'),
            creator: localStorage.getItem('name') || 'Вы',
            status: 'Загружается...',
            isTemp: true,
        };

        dispatch(addNewReport(tempReport));

        try {
            let response;
            let result;

            if (fileType === 'xlsx' || fileType === 'xls' || fileType === 'ods') {
                const reader = new FileReader();
                reader.onload = async (event) => {
                    try {
                        const workbook = XLSX.read(event.target.result, { type: 'binary' });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null });

                        // Собираем все значения по колонкам для анализа
                        const columnValues = {};
                        const headers = Object.keys(jsonData[0] || {});

                        headers.forEach(header => {
                            columnValues[header] = jsonData.map(row => row[header]);
                        });

                        const processedData = jsonData.map((row) => {
                            const newRow = { ...row };

                            headers.forEach((header) => {
                                const value = newRow[header];
                                // Передаем все значения колонки для анализа
                                if (isDateColumn(header, value, columnValues[header])) {
                                    if (typeof value === 'number') {
                                        const date = excelSerialToDate(value);
                                        newRow[header] = formatDate(date);
                                    } else if (typeof value === 'string') {
                                        // Проверяем, не является ли это числом в строке (например, "50000")
                                        if (!/^\d+$/.test(value)) {
                                            const parsedDate = new Date(value);
                                            if (!isNaN(parsedDate.getTime())) {
                                                newRow[header] = formatDate(parsedDate);
                                            }
                                        }
                                    }
                                }
                            });

                            return newRow;
                        });

                        const newWorksheet = XLSX.utils.json_to_sheet(processedData);
                        const newWorkbook = XLSX.utils.book_new();
                        XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Sheet1');

                        const wbout = XLSX.write(newWorkbook, { bookType: 'xlsx', type: 'array' });
                        const modifiedFile = new Blob([wbout], { type: file.type });

                        const formData = new FormData();
                        formData.append("file", new File([modifiedFile], file.name, { type: file.type }));

                        response = await fetch(`${API_URL}/api/report/import`, {
                            method: 'POST',
                            headers: { Authorization: `Bearer ${bearerToken}` },
                            body: formData,
                        });

                        result = await response.json();

                        if (response.ok && result.success) {
                            toast.success("Отчет успешно импортирован");
                            dispatch(fetchReports());
                        } else {
                            toast.error(result.message || "Ошибка при импорте отчета");
                        }
                    } catch (error) {
                        console.error("Ошибка при обработке Excel:", error);
                        toast.error("Ошибка при обработке файла");
                    }
                };
                reader.readAsBinaryString(file);
                return;
            }

            // Для CSV/JSON
            const formData = new FormData();
            formData.append("file", file);
            response = await fetch(`${API_URL}/api/report/import`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${bearerToken}` },
                body: formData,
            });

            result = await response.json();

            if (response.ok && result.success) {
                toast.success("Отчет успешно импортирован");
                dispatch(fetchReports());
            } else {
                toast.error(result.message || "Ошибка при импорте отчета");
            }
        } catch (error) {
            console.error("Ошибка загрузки:", error);
            toast.error("Ошибка при отправке файла");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.container__wrap}>
                <div className={styles.header}>
                    <div className={styles.header__btn}>
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