import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { toast } from 'react-toastify';

const API_URL = import.meta.env.VITE_API_URL;

// Получение списка отчетов
export const fetchReports = createAsyncThunk(
    'reports/fetchReports',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/api/report/list`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return data.data.map((report) => ({
                    id: report.id,
                    name: report.name,
                    extension: report.extension,
                    basket: report.basket,
                    created_at: report.created_at,
                    updated_at: report.updated_at,
                    creator: report.user?.name || 'Неизвестно',
                    category: report.category?.name || 'Загруженные отчеты',
                }));
            } else {
                return rejectWithValue(data.message || 'Ошибка при получении отчётов');
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Получение списка категорий
export const fetchCategories = createAsyncThunk(
    'reports/fetchCategories',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/api/categories`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return data.data;
            } else {
                return rejectWithValue(data.message || 'Ошибка при получении категорий');
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Получение списка пользователей
export const fetchUsers = createAsyncThunk(
    'reports/fetchUsers',
    async (_, { rejectWithValue }) => {
        try {
            const response = await fetch(`${API_URL}/api/users?confirmed=true`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                },
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return data.data;
            } else {
                return rejectWithValue(data.message || 'Ошибка при получении пользователей');
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Удаление отчета
export const deleteReport = createAsyncThunk(
    'reports/deleteReport',
    async ({ id, inBasket }, { rejectWithValue }) => {
        try {
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
                return rejectWithValue(data.message || 'Ошибка при удалении отчета');
            }

            return { id, inBasket };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Восстановление отчета из корзины
export const revertReport = createAsyncThunk(
    'reports/revertReport',
    async (id, { rejectWithValue }) => {
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
                return id;
            } else {
                return rejectWithValue(data.message || 'Не удалось восстановить отчет');
            }
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Экспорт отчета
export const exportReport = createAsyncThunk(
    'reports/exportReport',
    async ({ reportId, extension }, { rejectWithValue }) => {
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

            return { reportId };
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

// Слайс Redux
const reportsSlice = createSlice({
    name: 'reports',
    initialState: {
        reports: [],
        filteredReports: [],
        lastModifiedReports: [],
        categories: [],
        users: [],
        loading: false,
        error: null,
        selectedUser: null,
        selectedCategory: null,
        selectedBasket: false,
        searchQuery: "",
        currentPage: 1,
        sortByCreatedAt: null,
        sortByUpdatedAt: null,
        previewReport: null,
        newReportLoaded: false,
        reportsPerPage: 6,
        activeProcesses: JSON.parse(localStorage.getItem('activeProcesses')) || [],
        reportStatuses: JSON.parse(localStorage.getItem('reportStatuses')) || {},
    },
    reducers: {
        setSelectedUser: (state, action) => {
            state.selectedUser = action.payload;
        },
        setSelectedCategory: (state, action) => {
            state.selectedCategory = action.payload;
        },
        toggleSelectedBasket: (state) => {
            state.selectedBasket = !state.selectedBasket;
        },
        setSearchQuery: (state, action) => {
            state.searchQuery = action.payload;
        },
        setCurrentPage: (state, action) => {
            state.currentPage = action.payload;
        },
        setSortByCreatedAt: (state, action) => {
            state.sortByCreatedAt = action.payload;
            state.sortByUpdatedAt = null;
        },
        setSortByUpdatedAt: (state, action) => {
            state.sortByUpdatedAt = action.payload;
            state.sortByCreatedAt = null;
        },
        setPreviewReport: (state, action) => {
            state.previewReport = action.payload;
        },
        filterReports: (state) => {
            const { reports, selectedCategory, selectedUser, searchQuery, selectedBasket, categories, users } = state;

            state.filteredReports = reports.filter((report) => {
                const matchesCategory =
                    selectedCategory === null ||
                    report.category === categories.find((category) => category.id === selectedCategory)?.name;
                const matchesUser =
                    selectedUser === null ||
                    report.creator === users.find((user) => user.id === selectedUser)?.name;
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
        },
        sortReports: (state) => {
            const parseCustomDate = (dateString) => {
                if (!dateString) return new Date(0);
                const [datePart, timePart] = dateString.split(' в ');
                const [day, month, year] = datePart.split('.');
                const [hours, minutes] = timePart.split(':');
                return new Date(year, month - 1, day, hours, minutes);
            };

            if (state.sortByCreatedAt) {
                state.filteredReports.sort((a, b) => {
                    const dateA = parseCustomDate(a.created_at);
                    const dateB = parseCustomDate(b.created_at);
                    return state.sortByCreatedAt === 'asc' ? dateA - dateB : dateB - dateA;
                });
            } else if (state.sortByUpdatedAt) {
                state.filteredReports.sort((a, b) => {
                    const dateA = parseCustomDate(a.updated_at);
                    const dateB = parseCustomDate(b.updated_at);
                    return state.sortByUpdatedAt === 'asc' ? dateA - dateB : dateB - dateA;
                });
            }
        },
        addActiveProcess: (state, action) => {
            const existingIndex = state.activeProcesses.findIndex(p => p.id === action.payload.id);
            if (existingIndex === -1) {
                state.activeProcesses.push({
                    ...action.payload,
                    progress: 25,
                    startedAt: new Date().toLocaleString(),
                });
                state.reportStatuses[action.payload.id] = 'В работе';
                updateLocalStorage(state);
            }
        },
        updateProcessProgress: (state, action) => {
            const { id, progress } = action.payload;
            const process = state.activeProcesses.find(p => p.id === id);
            if (process) {
                process.progress = progress;
                if (progress >= 100) {
                    state.reportStatuses[id] = 'Завершен';
                }
                updateLocalStorage(state);
            }
        },
        removeActiveProcess: (state, action) => {
            state.activeProcesses = state.activeProcesses.filter(p => p.id !== action.payload);
            state.reportStatuses[action.payload] = 'Отменен';
            updateLocalStorage(state);
        },
        setReportStatus: (state, action) => {
            const { id, status } = action.payload;
            state.reportStatuses[id] = status;
            updateLocalStorage(state);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchReports.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchReports.fulfilled, (state, action) => {
                state.loading = false;
                state.reports = action.payload;
                state.filteredReports = action.payload;
                state.lastModifiedReports = [...action.payload]
                    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
                    .slice(0, 5);
                if (!state.newReportLoaded) {
                    state.newReportLoaded = true;
                }
            })
            .addCase(fetchReports.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
                toast.error(action.payload || 'Ошибка при загрузке отчетов');
            })
            .addCase(fetchCategories.fulfilled, (state, action) => {
                state.categories = action.payload;
            })
            .addCase(fetchCategories.rejected, (state, action) => {
                state.error = action.payload;
                toast.error(action.payload || 'Ошибка при загрузке категорий');
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.users = action.payload;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.error = action.payload;
                toast.error(action.payload || 'Ошибка при загрузке пользователей');
            })
            .addCase(deleteReport.fulfilled, (state, action) => {
                const { id, inBasket } = action.payload;
                if (!inBasket) {
                    state.reports = state.reports.map(report =>
                        report.id === id ? { ...report, basket: "1" } : report
                    );
                    toast.success('Отчет перемещен в корзину');
                } else {
                    state.reports = state.reports.filter(report => report.id !== id);
                    toast.success('Отчет окончательно удален из корзины');
                }
            })
            .addCase(deleteReport.rejected, (state, action) => {
                state.error = action.payload;
                toast.error(action.payload || 'Ошибка при удалении отчета');
            })
            .addCase(revertReport.fulfilled, (state, action) => {
                const id = action.payload;
                state.reports = state.reports.map(report =>
                    report.id === id ? { ...report, basket: null } : report
                );
                toast.success('Отчет восстановлен из корзины');
            })
            .addCase(revertReport.rejected, (state, action) => {
                state.error = action.payload;
                toast.error(action.payload || 'Ошибка при восстановлении отчета');
            })
            .addCase(exportReport.rejected, (state, action) => {
                state.error = action.payload;
                toast.error(action.payload || 'Ошибка при экспорте отчета');
            });
    },
});

const updateLocalStorage = (state) => {
    localStorage.setItem('activeProcesses', JSON.stringify(state.activeProcesses));
    localStorage.setItem('reportStatuses', JSON.stringify(state.reportStatuses));
};

export const {
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
    addActiveProcess,
    updateProcessProgress,
    removeActiveProcess,
    setReportStatus,
} = reportsSlice.actions;

export default reportsSlice.reducer;
