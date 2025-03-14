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
    const reportsPerPage = 6;

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true); // Показываем индикатор загрузки
            try {
                const response = await fetch(`${API_URL}/api/report/list`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    const formattedReports = data.data.map((report) => {
                        // const category = categories.find(cat => cat.id === report.category_id);
                        return {
                            id: report.id,
                            name: report.name,
                            extension: report.extension,
                            basket: report.basket,
                            created_at: report.created_at,
                            updated_at: report.updated_at,
                            creator: report.user?.name || 'Неизвестно',
                            category: report.category?.name ? report.category?.name  : 'Загруженные отчеты', // category ? category.name : 'Загруженные отчеты'
                        };
                    });

                    setReports(formattedReports);

                    // Показываем уведомление только один раз
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
                setLoading(false); // Скрываем индикатор загрузки
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

    const handleDeleteReport = async (id, inBasket) => {
        try {
            // Проверяем, является ли пользователь админом
            const isAdmin = user.role_id === 2;

            // Формируем тело запроса
            const dataForm = { report_id: id };
            if (!inBasket) {
                dataForm.basket = 1; // Если не в корзине, просто отправляем в нее
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

            // Если отчет НЕ в корзине → отправляем в корзину
            if (!inBasket) {
                console.log(`Отчет с id ${id} перемещен в корзину.`);
                setReports((prevReports) =>
                    prevReports.map((report) =>
                        report.id === id ? { ...report, basket: "1" } : report
                    )
                );
            }
            else if (isAdmin) {
                console.log(`Отчет с id ${id} удален из базы.`);
                setReports((prevReports) => prevReports.filter((report) => report.id !== id));
            }
        } catch (error) {
            console.error('Ошибка при удалении отчета:', error);
        }
    };



    const handleEditReport = (id) => {
        onReportSelect(id);
        console.log(id);
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
                console.log(`Отчет с id ${id} восстановлен.`);
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

    const filteredReports = reports.filter((report) => {
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
    // console.log(user)

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
                        <th>Дата создания</th>
                        <th>Дата изменения</th>
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

                                {/* Если отчет в корзине, удалить может только админ */}
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
        </div>
    );
};

export default Reports;