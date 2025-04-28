import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import styles from './ProcessControl.module.sass';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_URL = import.meta.env.VITE_API_URL;

const ProcessControl = () => {
    const dispatch = useDispatch();
    const [recentFiles, setRecentFiles] = useState([]);
    const [activeProcesses, setActiveProcesses] = useState([]);
    const [reportCount, setReportCount] = useState(0);
    const [selectedReport, setSelectedReport] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);

    const correctServerTime = (dateString) => {
        if (!dateString || !dateString.includes(' в ')) return dateString || '—';

        try {
            // Парсим дату с сервера (предполагаем UTC+3)
            const [datePart, timePart] = dateString.split(' в ');
            const [day, month, year] = datePart.split('.');
            const [hours, minutes] = timePart.split(':');

            const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

            // 3. Корректируем на часовой пояс пользователя (MSK = UTC+3)
            const mskOffset = 0 * 60 * 60 * 1000; // 3 часа в миллисекундах
            const localDate = new Date(utcDate.getTime() + mskOffset);

            // 4. Форматируем в нужный вид
            const formattedDay = String(localDate.getDate()).padStart(2, '0');
            const formattedMonth = String(localDate.getMonth() + 1).padStart(2, '0');
            const formattedHours = String(localDate.getHours()).padStart(2, '0');
            const formattedMinutes = String(localDate.getMinutes()).padStart(2, '0');

            return `${formattedDay}.${formattedMonth}.${localDate.getFullYear()} в ${formattedHours}:${formattedMinutes}`;
        } catch (e) {
            console.error('Error correcting server time:', e);
            return dateString || '—';
        }
    };

    const mapReportStatus = (report) => {
        if (report.status_id === 3) return 'Завершен';
        if (report.status_id === 2) return 'В работе';
        if (report.status_id === 1) return 'Загружен';
        if (report.is_ready) return 'Завершен';
        if (report.processing || report.status === 'processing') return 'В работе';
        return 'Загружен';
    };

    const loadReports = async () => {
        try {
            const response = await fetch(`${API_URL}/api/report/list`, {
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                },
            });

            if (!response.ok) throw new Error('Ошибка при получении отчётов');

            const data = await response.json();
            const reports = data.data;
            setReportCount(reports.length);

            // Активные процессы (статус 2 или 3)
            const active = reports
                .filter(report => report.status_id === 2 || report.status_id === 3)
                .map(report => ({
                    id: report.id,
                    name: report.name || `Отчет #${report.id}`,
                    creator: report.user?.name || 'Неизвестно',
                    startedAt: report.created_at || '—', // Используем исходный формат
                    progress: report.status_id === 3 ? 100 : 50,
                    status_id: report.status_id,
                    created_at: report.created_at, // Сохраняем оригинальные значения
                    updated_at: report.updated_at,
                    processing_started: report.processing_started,
                    completed_at: report.completed_at
                }));
            setActiveProcesses(active);

            // Последние 5 отчетов
            const latestReports = reports
                .sort((a, b) => {
                    const dateA = parseCustomDate(a.created_at);
                    const dateB = parseCustomDate(b.created_at);
                    return dateB - dateA;
                })
                .slice(0, 5)
                .map(report => ({
                    id: report.id,
                    name: report.name || `Отчет #${report.id}`,
                    date: formatDateTime(report.created_at), // Форматируем дату
                    status: mapReportStatus(report),
                    status_id: report.status_id,
                    created_at: report.created_at,
                    updated_at: report.updated_at,
                    processing_started: report.processing_started,
                    completed_at: report.completed_at,
                    creator: report.user?.name || 'Неизвестно',
                    extension: report.extension,
                    category_id: report.category_id,
                    category_name: (() => {
                        switch(report.category_id) {
                            case null:
                                return 'Загруженные отчеты';
                            case 1:
                                return 'Отчеты по проектам';
                            case 2:
                                return 'Отчеты по задачам';
                            default:
                                return 'Неизвестная категория';
                        }
                    })()
                }));

            setRecentFiles(latestReports);
        } catch (error) {
            toast.error("Ошибка загрузки данных", { position: "top-right" });
        }
    };

    useEffect(() => {
        loadReports();
    }, []);

    const parseCustomDate = (dateString) => {
        if (!dateString) return new Date(0);
        try {
            const [datePart, timePart] = dateString.split(' в ');
            const [day, month, year] = datePart.split('.');
            const [hours, minutes] = timePart.split(':');

            // Создаем дату в UTC+0 (без учета локального времени)
            const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));

            // Корректируем на часовой пояс пользователя
            const userTimezoneOffset = new Date().getTimezoneOffset() * 60000;
            return new Date(utcDate.getTime() + userTimezoneOffset);
        } catch (e) {
            return new Date(0);
        }
    };

    const handleCompleteProcess = async (processId) => {
        try {
            const reportResponse = await fetch(`${API_URL}/api/report/${processId}/complete`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    status: 'Завершен',
                    status_id: 3,
                    completed_at: new Date().toISOString()
                }),
            });

            if (!reportResponse.ok) throw new Error('Ошибка при обновлении статуса отчета');

            // Обновляем списки
            const updatedActive = activeProcesses.filter(p => p.id !== processId);
            setActiveProcesses(updatedActive);

            const updatedReports = recentFiles.map(report =>
                report.id === processId
                    ? { ...report, status: 'Завершен', status_id: 3 }
                    : report
            );
            setRecentFiles(updatedReports);

            toast.success(`Процесс #${processId} завершен`, { position: "top-right" });

        } catch (error) {
            toast.error(`Ошибка: ${error.message}`, { position: "top-right" });
        }
    };

    const handleShowDetails = async (report) => {
        console.log('Открыт отчет:', report);
        setSelectedReport(report);
        setShowDetailsModal(true);
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return '—';

        // Если дата уже в нужном формате
        if (dateString.includes(' в ')) {
            return dateString;
        }

        try {
            // Для ISO строк корректируем часовой пояс
            const date = new Date(dateString);
            const timezoneOffset = date.getTimezoneOffset() * 60000;
            const adjustedDate = new Date(date.getTime() - timezoneOffset);

            return adjustedDate.toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }).replace(',', ' в ');
        } catch (error) {
            return '—';
        }
    };


    return (
        <div className={styles.processControl}>
            <div className={styles.section}>
                <h3>Активные процессы</h3>
                <div className={styles.processList}>
                    {activeProcesses.length > 0 ? (
                        activeProcesses.map(process => (
                            <div key={process.id} className={styles.processItem}>
                                <div className={styles.processInfo}>
                                    <span className={styles.reportName}>{process.name}</span>
                                    <span>Пользователь: {process.creator}</span>
                                    <span>Начато: {process.startedAt}</span>
                                </div>
                                <div className={styles.progressContainer}>
                                    <progress value={process.progress} max="100" />
                                    <span>{process.progress}%</span>
                                </div>
                                {process.status_id === 2 && (
                                    <>
                                        <button
                                            className={styles.abortButton}
                                            onClick={() => handleCompleteProcess(process.id)}
                                        >
                                            Завершить
                                        </button>
                                    </>
                                )}
                            </div>
                        ))
                    ) : (
                        <p>Нет активных процессов</p>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <h3>Недавние файлы</h3>
                <div className={styles.fileList}>
                    {recentFiles.length > 0 ? (
                        <table>
                            <thead>
                            <tr>
                                <th>Имя файла</th>
                                <th>Дата</th>
                                <th>Статус</th>
                                <th>Действия</th>
                            </tr>
                            </thead>
                            <tbody>
                            {recentFiles.map(file => (
                                <tr key={file.id}>
                                    <td>{file.name}</td>
                                    <td>{file.date}</td>
                                    <td>
                                            <span className={`${styles.status} ${styles[file.status.toLowerCase().replace(' ', '')]}`}>
                                                {file.status}
                                            </span>
                                    </td>
                                    <td>
                                        <button
                                            className={styles.actionButton}
                                            onClick={() => handleShowDetails(file)}
                                        >
                                            Подробнее
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    ) : (
                        <p>Нет недавних файлов</p>
                    )}
                </div>
            </div>

            <div className={styles.section}>
                <h3>Статистика работы</h3>
                <div className={styles.stats}>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>{reportCount}</span>
                        <span className={styles.statLabel}>Отчетов загружено</span>
                    </div>
                    <div className={styles.statCard}>
                        <span className={styles.statValue}>
                            {recentFiles.filter(f => f.status === 'Завершен').length}
                        </span>
                        <span className={styles.statLabel}>Отчетов обработано</span>
                    </div>
                </div>
            </div>

            {/* Модальное окно с деталями отчета */}
            {showDetailsModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.reportDetails}>
                            <h3>Детали отчета: {selectedReport?.name}</h3>

                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Статус:</span>
                                <span className={`${styles.detailValue} ${styles[selectedReport?.status.toLowerCase().replace(' ', '')]}`}>
                                    {selectedReport?.status}
                                </span>
                            </div>

                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Создатель:</span>
                                <span className={styles.detailValue}>{selectedReport?.creator}</span>
                            </div>

                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Формат:</span>
                                <span className={styles.detailValue}>
                                    {selectedReport.extension?.toUpperCase() || 'Не указан'}
                                </span>
                            </div>

                            <div className={styles.detailRow}>
                                <span className={styles.detailLabel}>Категория:</span>
                                <span className={styles.detailValue}>
                                    {selectedReport?.category_name || 'Не указана'}
                                </span>
                            </div>

                            {selectedReport?.created_at && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Дата загрузки:</span>
                                    <span className={styles.detailValue}>{correctServerTime(selectedReport?.created_at)}</span>
                                </div>
                            )}

                            {selectedReport?.processing_started && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Начало обработки:</span>
                                    <span className={styles.detailValue}>{correctServerTime(selectedReport.processing_started)}</span>
                                </div>
                            )}

                            {selectedReport?.completed_at && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Завершено:</span>
                                    <span className={styles.detailValue}>{correctServerTime(selectedReport.completed_at)}</span>
                                </div>
                            )}

                            {selectedReport?.updated_at && (
                                <div className={styles.detailRow}>
                                    <span className={styles.detailLabel}>Последнее обновление:</span>
                                    <span className={styles.detailValue}>{formatDateTime(selectedReport.updated_at)}</span>
                                </div>
                            )}

                            <div className={styles.modalActions}>
                                {selectedReport?.status_id === 2 && (
                                    <button
                                        className={styles.abortButtonModal}
                                        onClick={() => {
                                            handleCompleteProcess(selectedReport.id);
                                            setShowDetailsModal(false);
                                        }}
                                    >
                                        Завершить
                                    </button>
                                )}
                                <button
                                    className={styles.closeButton}
                                    onClick={() => setShowDetailsModal(false)}
                                >
                                    Закрыть
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcessControl;