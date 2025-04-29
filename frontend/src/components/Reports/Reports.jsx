import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styles from "./Reports.module.sass";
import { formatExcelSerialDate } from '../Utils/excelDateUtils.jsx';
import {
    fetchReports,
    fetchCategories,
    fetchUsers,
    deleteReport,
    revertReport,
    exportReport,
    setSelectedUser,
    setSelectedCategory,
    toggleSelectedBasket,
    setSearchQuery,
    setCurrentPage,
    setSortByCreatedAt,
    setSortByUpdatedAt,
    setPreviewReport,
    filterReports,
    sortReports,
    setSelectedStatus,
    setSelectedExtension,
} from "../features/reportsSlice.jsx";
import 'react-toastify/dist/ReactToastify.css';

import edit from '../../assets/edit2.svg';
import del from '../../assets/del.svg';
import download from '../../assets/download2.svg';
import ref50 from '../../assets/ref50.svg';

const Reports = ({ onReportSelect }) => {
    const dispatch = useDispatch();
    const {
        reports,
        filteredReports,
        lastModifiedReports,
        categories,
        users,
        selectedUser,
        selectedCategory,
        selectedBasket,
        searchQuery,
        loading,
        currentPage,
        sortByCreatedAt,
        sortByUpdatedAt,
        reportsPerPage,
        activeProcesses,
        selectedStatus,
        selectedExtension,
        statuses,
        extensions,
    } = useSelector((state) => state.reports);

    const correctServerDate = (dateString) => {
        // Если дата пришла как число (Excel serial)
        if (typeof dateString === 'number') {
            return formatExcelSerialDate(dateString) + ' в 00:00';
        }

        // Если дата уже в правильном строковом формате
        if (dateString && dateString.includes(' в ')) {
            try {
                const [datePart, timePart] = dateString.split(' в ');
                const [day, month, year] = datePart.split('.');
                const [hours, minutes] = timePart.split(':');

                const utcDate = new Date(Date.UTC(year, month - 1, day, hours, minutes));
                const mskOffset = 0 * 60 * 60 * 1000;
                const localDate = new Date(utcDate.getTime() + mskOffset);

                const formattedDay = String(localDate.getDate()).padStart(2, '0');
                const formattedMonth = String(localDate.getMonth() + 1).padStart(2, '0');
                const formattedHours = String(localDate.getHours()).padStart(2, '0');
                const formattedMinutes = String(localDate.getMinutes()).padStart(2, '0');

                return `${formattedDay}.${formattedMonth}.${localDate.getFullYear()} в ${formattedHours}:${formattedMinutes}`;
            } catch (e) {
                console.error('Error formatting date:', e);
                return dateString || '—';
            }
        }

        return dateString || '—';
    };

    useEffect(() => {
        dispatch(fetchCategories());
        dispatch(fetchUsers());
        dispatch(fetchReports());
    }, [dispatch]);

    useEffect(() => {
        dispatch(filterReports());
        dispatch(sortReports());
    }, [
        reports,
        selectedCategory,
        selectedUser,
        searchQuery,
        selectedBasket,
        categories,
        users,
        sortByCreatedAt,
        sortByUpdatedAt,
        selectedStatus,
        selectedExtension,
        dispatch
    ]);

    const handleStatusChange = (event) => {
        const status = event.target.value !== "" ? event.target.value : null;
        dispatch(setSelectedStatus(status));
    };

    const handleExtensionChange = (event) => {
        const extension = event.target.value !== "" ? event.target.value : null;
        dispatch(setSelectedExtension(extension));
    };

    const handleRowClick = (report, e) => {
        if (e.target.tagName === 'IMG' || e.target.tagName === 'BUTTON') {
            return;
        }
        dispatch(setPreviewReport(report));
    };

    const handleSortByCreatedAt = () => {
        const newSort = sortByCreatedAt === 'asc' ? 'desc' : 'asc';
        dispatch(setSortByCreatedAt(newSort));
    };

    const handleSortByUpdatedAt = () => {
        const newSort = sortByUpdatedAt === 'asc' ? 'desc' : 'asc';
        dispatch(setSortByUpdatedAt(newSort));
    };

    const handleDeleteReport = (id, inBasket) => {
        dispatch(deleteReport({ id, inBasket }));
    };

    const handleRevertBasket = (id) => {
        dispatch(revertReport(id));
    };

    const handleExportReport = (report, extension) => {
        const formattedDate = formatExcelSerialDate(report.date_from);
        dispatch(exportReport({
            reportId: report.id,
            extension,
            dateFrom: formattedDate
        }));
    };

    const handlePageChange = (newPage) => {
        dispatch(setCurrentPage(newPage));
    };

    const handleUserChange = (event) => {
        const userId = Number(event.target.value);
        dispatch(setSelectedUser(userId !== 0 ? userId : null));
    };

    const handleCategoryChange = (event) => {
        const categoryId = Number(event.target.value);
        dispatch(setSelectedCategory(categoryId !== 0 ? categoryId : null));
    };

    const handleSearchChange = (event) => {
        dispatch(setSearchQuery(event.target.value));
    };

    const handleBasket = () => {
        dispatch(toggleSelectedBasket());
    };

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

                <select className={styles.container__btn_item} onChange={handleUserChange} value={selectedUser || 0}>
                    <option value="0">Выбор сотрудника</option>
                    {users.map((user) => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                </select>
                <select className={styles.container__btn_item} onChange={handleCategoryChange} value={selectedCategory !== null ? selectedCategory : ""}>
                    <option value="">Все категории</option>
                    {categories.map((category) => (
                        <option key={category.id || 0} value={category.id || ""}>{category.name}</option>
                    ))}
                </select>

                <select className={styles.container__btn_item} onChange={handleStatusChange} value={selectedStatus || ""}>
                    <option value="">Все статусы</option>
                    {statuses.map((status) => (
                        <option key={status} value={status}>{status}</option>
                    ))}
                </select>

                <select className={styles.container__btn_item} onChange={handleExtensionChange} value={selectedExtension || ""}>
                    <option value="">Все форматы</option>
                    {extensions.map((ext) => (
                        <option key={ext} value={ext}>{ext.toUpperCase()}</option>
                    ))}
                </select>
                <input
                    type="text"
                    className={styles.search}
                    placeholder="Поиск"
                    value={searchQuery}
                    onChange={handleSearchChange}
                />
                <label className={styles.customCheckbox}>
                    <input
                        type="checkbox"
                        className={styles.hiddenCheckbox}
                        checked={selectedBasket}
                        onChange={handleBasket}
                    />
                    <span className={styles.checkboxSwitch}></span>
                    В корзине
                </label>
            </div>
            <div className={styles.table__wrapper}>
                <table className={styles.table}>
                    <thead>
                    <tr>
                        <th>Наименование</th>
                        <th onClick={handleSortByCreatedAt} style={{cursor: 'pointer'}}>
                            Дата создания
                            <span className={styles.sortIcon}>
                              {sortByCreatedAt === 'asc' ? '↑ От старого к новому' : '↓ От нового к старому'}
                            </span>
                        </th>
                        <th onClick={handleSortByUpdatedAt} style={{cursor: 'pointer'}}>
                            Дата изменения
                            <span className={styles.sortIcon}>
                              {sortByUpdatedAt === 'asc' ? '↑ От старого к новому' : '↓ От нового к старому'}
                            </span>
                        </th>
                        <th>Кто создал</th>
                        <th>Категория</th>
                        <th>Статус</th>
                    </tr>
                    </thead>
                    <tbody>
                    {currentReports.map((report) => (
                        <tr
                            key={report.id}
                            onClick={(e) => handleRowClick(report, e)}
                            style={{ cursor: 'pointer' }}
                        >
                            <td>{report.name}</td>
                            <td>{correctServerDate(report.created_at)}</td>
                            <td>{correctServerDate(report.updated_at)}</td>
                            <td>{report.creator}</td>
                            <td>{report.category}</td>
                            <td>
                                <span className={`${styles.status} ${styles[report.status?.name?.toLowerCase().replace(/\s/g, '')]}`}>
                                  {report.status || "—"}
                                </span>
                            </td>
                            <td className={styles.btn_icon}>
                                {selectedBasket && (
                                    <img
                                        src={ref50}
                                        width="24"
                                        alt="Восстановить"
                                        title="Восстановление отчета"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRevertBasket(report.id);
                                        }}
                                    />
                                )}
                                <img
                                    src={edit}
                                    alt="Редактировать"
                                    title="Редактирование отчета"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onReportSelect(report.id);
                                    }}
                                />
                                <img
                                    src={download}
                                    alt="Экспорт"
                                    title="Экспорт отчета"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleExportReport(report, report.extension);
                                    }}
                                />

                                {!report.basket && (
                                    <img
                                        src={del}
                                        alt="Удалить"
                                        title="Удаление отчета"
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
                                        title="Удаление отчета (безвозвратно)"
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
                                className={`${styles["page-item"]} ${currentPage === page ? styles.active : ''}`}
                                onClick={() => handlePageChange(page)}
                            >
                                {page}
                            </span>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default Reports;
