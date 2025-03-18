import { useEffect, useState } from "react";
import styles from "./Reports.module.sass";
const API_URL = import.meta.env.VITE_API_URL;
import edit from '../../assets/edit2.svg';
import del from '../../assets/del.svg';
import download from '../../assets/download2.svg';
import ref50 from '../../assets/ref50.svg';

import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const Reports = ({ onReportSelect }) => {
    const [reports, setReports] = useState([]);
    const [lastModifiedReports, setLastModifiedReports] = useState([]);
    const [selectedReport, setSelectedReport] = useState(null);
    const [categories, setCategories] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedBasket, setSelectedBasket] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(false);
    const [newReportLoaded, setNewReportLoaded] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [sortByCreatedAt, setSortByCreatedAt] = useState(null);
    const [sortByUpdatedAt, setSortByUpdatedAt] = useState(null);
    const [filteredReports, setFilteredReports] = useState([]); // Новое состояние для отфильтрованных отчетов
    const reportsPerPage = 6;

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            try {
                const response = await fetch(`${API_URL}/api/report/list`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const formattedReports = data.data.map((report) => ({
                        id: report.id,
                        name: report.name,
                        extension: report.extension,
                        basket: report.basket,
                        created_at: report.created_at,
                        updated_at: report.updated_at,
                        creator: report.user?.name || 'Неизвестно',
                        category: report.category?.name || 'Загруженные отчеты',
                    }));

                    setReports(formattedReports);
                    setFilteredReports(formattedReports); // Инициализируем отфильтрованные отчеты

                    if (!newReportLoaded) {
                        setShowToast(true);
                        setNewReportLoaded(true);
                    }
                } else {
                    console.error("Ошибка при получении отчётов:", data);
                    toast.error("Ошибка при загрузке отчета.");
                }
            } catch (error) {
                console.error("Ошибка при получении отчётов:", error);
                toast.error("Ошибка при загрузке отчета.");
            } finally {
                setLoading(false);
            }
        };

        const fetchCategories = async () => {
            try {
                const response = await fetch(`${API_URL}/api/categories`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setCategories(data.data);
                } else {
                    console.error("Ошибка при получении категорий:", data);
                }
            } catch (error) {
                console.error("Ошибка при получении категорий:", error);
            }
        };

        const fetchUsers = async () => {
            try {
                const response = await fetch(`${API_URL}/api/users?confirmed=true`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setUsers(data.data);
                } else {
                    console.error("Ошибка при получении пользователей:", data);
                }
            } catch (error) {
                console.error("Ошибка при получении пользователей:", error);
            }
        };

        fetchCategories();
        fetchUsers();
        fetchReports();
    }, []);

    useEffect(() => {
        const sortedReports = [...reports].sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0, 5);
        setLastModifiedReports(sortedReports);
    }, [reports]);

    const handleSortByCreatedAt = () => {
        const newSort = sortByCreatedAt === 'asc' ? 'desc' : 'asc';
        setSortByCreatedAt(newSort);
        setSortByUpdatedAt(null);
        sortReports('created_at', newSort);
    };

    const handleSortByUpdatedAt = () => {
        const newSort = sortByUpdatedAt === 'asc' ? 'desc' : 'asc';
        setSortByUpdatedAt(newSort);
        setSortByCreatedAt(null);
        sortReports('updated_at', newSort);
    };

    const sortReports = (field, direction) => {
        const sortedReports = [...filteredReports].sort((a, b) => {
            const dateA = new Date(a[field]);
            const dateB = new Date(b[field]);
            return direction === 'asc' ? dateA - dateB : dateB - dateA;
        });
        setCurrentPage(1); // Сбросить страницу на первую после сортировки
        setFilteredReports(sortedReports); // Обновляем отфильтрованные отчеты
    };


    const handleDeleteReport = async (id, inBasket) => {
        try {
            const isAdmin = user.role_id === 2;

            const dataForm = { report_id: id };
            if (!inBasket) {
                dataForm.basket = 1;
            }

            const response = await fetch(`${API_URL}/api/report`, {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataForm),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(data.message || 'Ошибка при удалении отчета');
                return;
            }

            if (!inBasket) {
                setReports((prevReports) =>
                    prevReports.map((report) =>
                        report.id === id ? { ...report, basket: "1" } : report
                    )
                );
            } else if (isAdmin) {
                setReports((prevReports) => prevReports.filter((report) => report.id !== id));
            }
        } catch (error) {
            console.error('Ошибка при удалении отчета:', error);
        }
    };

    const handleEditReport = (id) => {
        onReportSelect(id);
    };

    const handleRevertBasket = async (id) => {
        try {
            const response = await fetch(`${API_URL}/api/report`, {
                method: 'PATCH',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id, basket: null }),
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setReports((prevReports) =>
                    prevReports.map((report) =>
                        report.id === id ? { ...report, basket: null } : report
                    )
                );
            } else {
                console.error(data.message || 'Не удалось восстановить отчет');
            }
        } catch (error) {
            console.error('Ошибка при восстановлении отчета:', error);
        }
    };

    const handleExportReport = async (reportId, extension) => {
        try {
            const response = await fetch(`${API_URL}/api/report/export/${reportId}?format=${extension}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                },
            });

            if (!response.ok) {
                throw new Error('Ошибка при загрузке отчета');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `report_${reportId}.${extension}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Ошибка экспорта отчета:", error);
            toast.error("Ошибка при экспорте отчета.");
        }
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleUserChange = (event) => {
        const userId = Number(event.target.value);
        setSelectedUser(userId !== 0 ? userId : null);
    };

    const handleCategoryChange = (event) => {
        const categoryId = Number(event.target.value);
        setSelectedCategory(categoryId !== 0 ? categoryId : null);
    };

    const handleSearchChange = (event) => {
        setSearchQuery(event.target.value);
    };

    const handleBasket = () => {
        setSelectedBasket(!selectedBasket);
    };

    useEffect(() => {
        const filtered = reports.filter((report) => {
            const matchesCategory =
                selectedCategory === null || report.category === categories.find((category) => category.id === selectedCategory)?.name;
            const matchesUser =
                selectedUser === null || report.creator === users.find((user) => user.id === selectedUser)?.name;
            const matchesSearch = [
                report.name,
                report.creator,
                report.category || "",
            ].some((field) => field.toLowerCase().includes(searchQuery.toLowerCase()));

            if (selectedBasket) {
                return report.basket && matchesCategory && matchesUser && matchesSearch;
            } else {
                return !report.basket && matchesCategory && matchesUser && matchesSearch;
            }
        });

        setFilteredReports(filtered); // Обновляем отфильтрованные отчеты
    }, [reports, selectedCategory, selectedUser, searchQuery, selectedBasket, categories, users]);

    const indexOfLastReport = currentPage * reportsPerPage;
    const indexOfFirstReport = indexOfLastReport - reportsPerPage;
    const currentReports = filteredReports.slice(indexOfFirstReport, indexOfLastReport);
    const totalPages = Math.ceil(filteredReports.length / reportsPerPage);

    const renderPagination = () => {
        const pages = [];
        const totalNumbers = 3;

        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            pages.push(1);
            if (currentPage > 3) {
                pages.push("...");
            }

            let startPage = Math.max(2, currentPage - 1);
            let endPage = Math.min(totalPages - 1, currentPage + 1);

            for (let i = startPage; i <= endPage; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push("...");
            }

            pages.push(totalPages);
        }
        return pages;
    };

    const pages = renderPagination();

    const user = JSON.parse(localStorage.getItem("role") || "{}");

    return (
        <div className={styles.container}>
            {loading && <div>Загрузка...</div>}
            <div className={styles.container__btn}>
                <select className={styles.container__btn_item} onChange={(e) => setSelectedUser(Number(e.target.value) || null)}>
                    <option value="0">Выбор сотрудника</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
                <select className={styles.container__btn_item} onChange={(e) => setSelectedCategory(Number(e.target.value) || null)}>
                    <option value="0">Выбор категории</option>
                    {categories.map((category) => (
                        <option key={category.id || 0} value={category.id || 0}>{category.name}</option>
                    ))}
                </select>
                <input
                    type="text"
                    className={styles.search}
                    placeholder="Поиск"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <label className={styles.customCheckbox}>
                    <input type="checkbox" className={styles.hiddenCheckbox} onChange={() => setSelectedBasket(!selectedBasket)} />
                    <span className={styles.checkboxSwitch}></span>
                    В корзине
                </label>
            </div>
            <div className={styles.table__wrapper}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Наименование</th>
                        <th>
                            Дата создания
                            <span onClick={handleSortByCreatedAt} className={styles.sortIcon}>
                                    {sortByCreatedAt === 'asc' ? '↑' : '↓'}
                                </span>
                        </th>
                        <th>
                            Дата изменения
                            <span onClick={handleSortByUpdatedAt} className={styles.sortIcon}>
                                    {sortByUpdatedAt === 'asc' ? '↑' : '↓'}
                                </span>
                        </th>
                        <th>Кто создал</th>
                        <th>Категория</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentReports.map((report) => (
                        <tr
                            key={report.id}
                            className={selectedReport?.id === report.id ? styles.selected : ''}
                            onClick={() => setSelectedReport(report)}
                        >
                            <td>{report.name}</td>
                            <td>{report.created_at}</td>
                            <td>{report.updated_at}</td>
                            <td>{report.creator}</td>
                            <td>{report.category}</td>
                            <td className={styles.btn_icon}>
                                {selectedBasket && (
                                    <img
                                        src={ref50}
                                        width="24"
                                        alt="Восстановить"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRevertBasket(report.id);
                                        }}
                                    />
                                )}
                                <img
                                    src={edit}
                                    alt="Редактировать"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleEditReport(report.id);
                                    }}
                                />
                                <img
                                    src={download}
                                    alt="Экспорт"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleExportReport(report.id, report.extension);
                                    }}
                                />

                                {!report.basket && (
                                    <img
                                        src={del}
                                        alt="Удалить"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteReport(report.id, false);
                                        }}
                                    />
                                )}

                                {report.basket && (user === 2 || user === 3) && (
                                    <img
                                        src={del}
                                        alt="Удалить навсегда"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteReport(report.id, true);
                                        }}
                                    />
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
            <div className={styles.pagination}>
                <div className={styles["page-numbers"]}>
                    {pages.map((page, index) =>
                        page === "..." ? (
                            <span key={index} className={styles.dots}>...</span>
                        ) : (
                            <span
                                key={index}
                                className={`${styles["page-item"]} ${currentPage === page ? styles.active : ""}`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </span>
                        )
                    )}
                </div>
            </div>

            {showToast && <ToastContainer />}

            <h3 className={styles.last_reports}>Последние измененные отчеты</h3>
            <div className={styles.lastModifiedReports}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Дата создания</th>
                        <th>Пользователь</th>
                        <th>Статус</th>
                        <th>Результат</th>
                    </tr>
                    </thead>
                    <tbody>
                    {lastModifiedReports.map((report) => (
                        <tr
                            key={report.id}
                            onClick={() => handleExportReport(report.id, report.extension)} // Скачивание отчета при клике
                            style={{ cursor: 'pointer' }} // Курсор в виде указателя
                        >
                            <td>{report.created_at}</td>
                            <td>{report.creator}</td>
                            <td>{report.basket ? "В корзине" : "Активен"}</td>
                            <td>{report.name}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Reports;