import React, { useState, useEffect } from "react";
import styles from "./ReportCreation.module.sass";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Parser } from 'expr-eval';
import screp from '../../assets/screp.svg';
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";

const API_URL = import.meta.env.VITE_API_URL;

const FormulaEditorModal = ({ formula, onSave, onClose }) => {
    const [currentFormula, setCurrentFormula] = useState(formula);
    const [showExamples, setShowExamples] = useState(false);

    const handleSave = () => {
        onSave(currentFormula);
        onClose();
    };

    return (
        <div className={styles.formulaEditorModal}>
            <div className={styles.formulaEditorContent}>
                <h3>Редактор формул</h3>

                <textarea
                    value={currentFormula}
                    onChange={(e) => setCurrentFormula(e.target.value)}
                    className={styles.formulaTextarea}
                    placeholder="Введите формулу..."
                />

                <button
                    className={styles.exampleToggle}
                    onClick={() => setShowExamples(!showExamples)}
                >
                    {showExamples ? 'Скрыть примеры' : 'Показать примеры'}
                </button>

                {showExamples && (
                    <div className={styles.formulaExamples}>
                        <h4>Примеры формул:</h4>
                        <ul>
                            <li><code>SUM([revenue])</code> - Сумма по столбцу revenue</li>
                            <li><code>AVG([temperature])</code> - Среднее значение</li>
                            <li><code>COUNT([id])</code> - Количество записей</li>
                            <li><code>MIN([price])</code> - Минимальное значение</li>
                            <li><code>MAX([price])</code> - Максимальное значение</li>
                            <li><code>STDDEV([score])</code> - Стандартное отклонение</li>
                            <li><code>MOVING_AVG([sales], 7)</code> - 7-дневное скользящее среднее</li>
                            <li><code>CORREL([x], [y])</code> - Корреляция между столбцами</li>
                            <li><code>LOG([value])</code> - Натуральный логарифм</li>
                            <li><code>SQRT([value])</code> - Квадратный корень</li>
                            <li><code>[score] &gt; AVG([score])</code> ? "Выше среднего" : "Ниже"</li>
                            <li><code>SUM([profit]) / SUM([revenue]) * 100</code> - Маржа в %</li>
                            <li><code>IF([status] == "active", [price] * 0.9, [price])</code> - Скидка 10% для активных</li>
                            <li><code>ROUND([value], 2)</code> - Округление до 2 знаков</li>
                            <li><code>CONCAT([name], " ", [surname])</code> - Объединение строк</li>
                            <li><code>YEAR([date])</code> - Год из даты</li>
                        </ul>
                    </div>
                )}

                <div className={styles.formulaButtons}>
                    <button onClick={onClose}>Отмена</button>
                    <button onClick={handleSave}>Сохранить</button>
                </div>
            </div>
        </div>
    );
};

const ReportCreation = ({ idReport }) => {
    const [customWhereColumns, setCustomWhereColumns] = useState([]);
    const [dataWhereColumns, setDataWhereColumns] = useState([]);
    const [dataHeaders, setDataHeaders] = useState([]);
    const [dataReport, setDataReport] = useState([]);
    const [newDataReport, setNewDataReport] = useState([]);
    const [dataCategories, setDataCategories] = useState([]);
    const [dataExtensions, setDataExtensions] = useState([]);
    const [name, setName] = useState("");
    const [originalName, setOriginalName] = useState("");
    const [selectedExtension, setSelectedExtension] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [currentReportId, setCurrentReportId] = useState(idReport);
    const [reportNotFound, setReportNotFound] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [editingFormulaIndex, setEditingFormulaIndex] = useState(null);
    const [showFormulaModal, setShowFormulaModal] = useState(false);

    useEffect(() => {
        return () => {
            localStorage.removeItem('selectedReportId');
        };
    }, []);

    useEffect(() => {
        if (idReport && idReport !== currentReportId) {
            localStorage.removeItem('selectedReportId');
            setCurrentReportId(idReport);
            setReportNotFound(false);
        }
    }, [idReport]);

    const calculateAggregations = (values, func) => {
        // const nums = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        // if (nums.length === 0) return null;

        if (func.toUpperCase() === 'COUNT') {
            return values.filter(v => v !== null && v !== undefined && v !== '').length;
        }

        const nums = values.map(v => {
            if (typeof v === 'string' && v.includes(',')) {
                v = v.replace(',', '.');
            }
            return parseFloat(v);
        }).filter(v => !isNaN(v));

        if (nums.length === 0) return null;

        switch(func.toUpperCase()) {
            case 'SUM': return nums.reduce((a, b) => a + b, 0);
            case 'AVG': return nums.reduce((a, b) => a + b, 0) / nums.length;
            case 'MIN': return Math.min(...nums);
            case 'MAX': return Math.max(...nums);
            case 'STDDEV': {
                const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
                return Math.sqrt(nums.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / nums.length);
            }
            default: return null;
        }
    };

    const excelSerialToDate = (serial) => {
        if (typeof serial !== 'number' || isNaN(serial)) return null;
        const utcDays = Math.floor(serial - 25569);
        const utcValue = utcDays * 86400;
        const date = new Date(utcValue * 1000);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    };

    const processTimeSeries = (values, windowSize) => {
        const results = [];
        for (let i = 0; i < values.length; i++) {
            const start = Math.max(0, i - windowSize + 1);
            const window = values.slice(start, i + 1);
            const nums = window.map(v => parseFloat(v)).filter(v => !isNaN(v));
            results.push(nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null);
        }
        return results;
    };

    const calculateCorrelation = (values1, values2) => {
        if (values1.length !== values2.length || values1.length === 0) return null;

        const nums1 = values1.map(v => parseFloat(v)).filter(v => !isNaN(v));
        const nums2 = values2.map(v => parseFloat(v)).filter(v => !isNaN(v));

        if (nums1.length !== nums2.length) return null;

        const mean1 = nums1.reduce((a, b) => a + b, 0) / nums1.length;
        const mean2 = nums2.reduce((a, b) => a + b, 0) / nums2.length;

        let cov = 0, stddev1 = 0, stddev2 = 0;

        for (let i = 0; i < nums1.length; i++) {
            cov += (nums1[i] - mean1) * (nums2[i] - mean2);
            stddev1 += Math.pow(nums1[i] - mean1, 2);
            stddev2 += Math.pow(nums2[i] - mean2, 2);
        }

        return cov / Math.sqrt(stddev1 * stddev2);
    };

    const handleAddWhereColumn = () => {
        for (let i = 0; i < customWhereColumns.length; i++) {
            if (Array.isArray(customWhereColumns[i].where)) {
                customWhereColumns[i].where = {};
                break;
            }
        }
        setCustomWhereColumns([...customWhereColumns]);
    };

    const handleColumnWhereChange = (name, field, value = '', where = false) => {
        setCustomWhereColumns(prev => prev.map(column => {
            if (column.name === name) {
                column.where = Array.isArray(column.where) ? {} : column.where || {};
                if (where) column.where[field] = value;
            } else {
                column.where = [];
            }
            return column;
        }));
    };

    const handleDeleteWhereColumn = (name) => {
        for (let i = 0; i < customWhereColumns.length; i++) {
            if (customWhereColumns[i].name === name) {
                customWhereColumns[i].where = [];
                break;
            }
        }
        setCustomWhereColumns([...customWhereColumns]);
    };

    const handleAddColumn = () => {
        setCustomWhereColumns([...customWhereColumns, {
            fx: "",
            type: "a",
            name: "new_column_" + customWhereColumns.length,
            title: "",
            where: []
        }]);
    };

    const handleColumnChange = (index, field, value = '') => {
        setCustomWhereColumns(prev => prev.map((column, iCol) => {
            if (iCol === index) {
                column[field] = value;
            }
            return column;
        }));
    };

    const handleDeleteColumn = (index) => {
        const newRecords = [];
        const newColumns = customWhereColumns.filter((column, iCol) => {
            if (iCol === index) {
                dataReport.map((records) => {
                    records.splice(index, 1);
                    newRecords.push(records);
                });
            }
            return iCol !== index;
        });
        setNewDataReport([...newRecords]);
        setCustomWhereColumns([...newColumns]);
    };

    // const handleFormulaDoubleClick = (index) => {
    //     navigator.clipboard.writeText(`[${customWhereColumns[index].name}]`);
    //     toast.success(`Скопировано: [${customWhereColumns[index].name}]`, { position: "top-right" });
    // };

    const handleFormulaClick = (index) => {
        setEditingFormulaIndex(index);
        setShowFormulaModal(true);
    };

    const handleSaveFormula = (formula) => {
        handleColumnChange(editingFormulaIndex, "fx", formula);
        setShowFormulaModal(false);
    };

    useEffect(() => {
        const bearerToken = localStorage.getItem('api_token');

        if (!currentReportId) {
            setReportNotFound(true);
            return;
        }

        fetch(`${API_URL}/api/report/${currentReportId}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + bearerToken,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setReportNotFound(false);
                    const report = data.data;
                    setName(report.name);
                    setOriginalName(report.name);
                    setDataHeaders(report.headers);
                    setCustomWhereColumns(report.headers);
                    setDataReport(report?.whereData?.length > 0 ? report.whereData : report.data);
                    setSelectedExtension(report.extension);
                    setSelectedCategory(report.category_id);
                } else {
                    setReportNotFound(true);
                    setCurrentReportId(null);
                    localStorage.removeItem('selectedReportId');
                }
            })
            .catch((error) => {
                console.error('Ошибка при загрузке отчета:', error);
                setReportNotFound(true);
                setCurrentReportId(null);
                localStorage.removeItem('selectedReportId');
            });

        Promise.all([
            fetch(`${API_URL}/api/categories`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + bearerToken,
                },
            }),
            fetch(`${API_URL}/api/where`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + bearerToken,
                },
            }),
            fetch(`${API_URL}/api/report/extensions`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + bearerToken,
                },
            })
        ])
            .then(responses => Promise.all(responses.map(res => res.json())))
            .then(([categoriesData, whereData, extensionsData]) => {
                if (categoriesData.success) setDataCategories(categoriesData.data);
                if (whereData.success) setDataWhereColumns(whereData.data);
                if (extensionsData.success) setDataExtensions(extensionsData.data);
            });
    }, [currentReportId, reportNotFound]);

    const calculateYearsOfExperience = (date) => {
        const startDate = new Date(date);
        const currentDate = new Date();
        const diffTime = currentDate - startDate;
        return diffTime / (1000 * 3600 * 24 * 365);
    };

    const filterDataReport = () => {
        const arrayData = [...dataReport];
        const newArrayWhereData = [];

        // Функция для преобразования даты в timestamp
        const parseDateToTimestamp = (dateStr) => {
            if (!dateStr || typeof dateStr !== 'string') return null;
            const [day, month, year] = dateStr.split('.');
            return new Date(`${year}-${month}-${day}`).getTime();
        };

        // Нормализация чисел (замена запятых на точки)
        const normalizeNumbers = (expr) => {
            return expr.replace(/(\d+),(\d+)/g, "$1.$2");
        };

        // Подготовка выражения с автоматическим преобразованием сравнений дат
        const prepareExpression = (expr) => {
            if (typeof expr !== 'string') return expr;

            // Преобразование тернарных операторов с датами
            expr = expr.replace(
                /\[([^\]]+)\]\s*(<=|>=|<|>|==|!=)\s*"(\d{2}\.\d{2}\.\d{4})"\s*\?\s*"([^"]*)"\s*:\s*"([^"]*)"/g,
                (match, colName, operator, dateStr, trueVal, falseVal) => {
                    return `IF(COMPARE_DATES([${colName}], "${dateStr}", "${operator}"), "${trueVal}", "${falseVal}")`;
                }
            );

            // Преобразование простых сравнений дат
            expr = expr.replace(
                /\[([^\]]+)\]\s*(<=|>=|<|>|==|!=)\s*"(\d{2}\.\d{2}\.\d{4})"/g,
                'COMPARE_DATES([$1], "$3", "$2")'
            );

            return expr;
        };

        // Инициализация парсера с кастомными функциями
        const parser = new Parser();

        // Функция сравнения дат
        parser.functions.COMPARE_DATES = (colValue, dateStr, operator) => {
            try {
                // Функция для преобразования даты в timestamp
                const parseDate = (date) => {
                    if (!date) return null;
                    if (typeof date === 'number') return date;
                    if (typeof date === 'string' && date.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                        const [day, month, year] = date.split('.');
                        return new Date(`${year}-${month}-${day}`).getTime();
                    }
                    return null;
                };

                const date1 = parseDate(colValue);
                const date2 = parseDate(dateStr);

                if (date1 === null || date2 === null) return false;

                switch(operator) {
                    case '<': return date1 < date2;
                    case '<=': return date1 <= date2;
                    case '>': return date1 > date2;
                    case '>=': return date1 >= date2;
                    case '==': return date1 === date2;
                    case '!=': return date1 !== date2;
                    default: return false;
                }
            } catch (e) {
                console.error('Ошибка сравнения дат:', e);
                toast.error(`Ошибка сравнения дат: ${e.message}`, { position: "top-right" });
                return false;
            }
        };

        // Основные функции парсера
        parser.functions = {
            ...parser.functions,
            // Математические функции
            SUM: (...args) => args.reduce((a, b) => a + b, 0),
            AVG: (...args) => args.reduce((a, b) => a + b, 0) / args.length,
            COUNT: (...args) => args.length,
            MIN: (...args) => Math.min(...args),
            MAX: (...args) => Math.max(...args),
            STDDEV: (...args) => {
                const avg = args.reduce((a, b) => a + b, 0) / args.length;
                return Math.sqrt(args.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / args.length);
            },

            // Базовые математические
            LOG: Math.log,
            EXP: Math.exp,
            SQRT: Math.sqrt,
            POW: Math.pow,
            ABS: Math.abs,
            ROUND: (num, decimals = 0) => Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals),

            // Логические
            IF: (condition, trueVal, falseVal) => condition ? trueVal : falseVal,

            // Строковые
            CONCAT: (...args) => args.join(''),

            // Функции для работы с датами
            DATE: (dateStr) => {
                if (!dateStr) return null;

                // Если это уже timestamp
                if (typeof dateStr === 'number') return dateStr;

                // Обработка формата "dd.mm.yyyy"
                if (typeof dateStr === 'string') {
                    // Проверяем формат "dd.mm.yyyy"
                    const dateMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                    if (dateMatch) {
                        const [_, day, month, year] = dateMatch;
                        // Важно: месяцы в JavaScript начинаются с 0 (январь = 0)
                        return new Date(year, month - 1, day).getTime();
                    }

                    // Пробуем распарсить как ISO строку
                    const date = new Date(dateStr);
                    if (!isNaN(date.getTime())) return date.getTime();
                }

                return null;
            },
            DATE_TO_STR: (timestamp) => {
                if (!timestamp) return null;
                const date = new Date(timestamp);
                return `${String(date.getDate()).padStart(2, '0')}.${String(date.getMonth() + 1).padStart(2, '0')}.${date.getFullYear()}`;
            },
            YEAR: (dateStr) => {
                try {
                    // Если передано число (timestamp)
                    if (typeof dateStr === 'number') {
                        return new Date(dateStr).getFullYear();
                    }

                    // Если передана строка в формате "dd.mm.yyyy"
                    if (typeof dateStr === 'string') {
                        const dateMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                        if (dateMatch) {
                            const [_, day, month, year] = dateMatch;
                            return parseInt(year, 10);
                        }
                    }

                    // Стандартное преобразование через DATE
                    const timestamp = parser.functions.DATE(dateStr);
                    return timestamp ? new Date(timestamp).getFullYear() : null;
                } catch (e) {
                    console.error('Error in YEAR function:', e);
                    return null;
                }
            },
            MONTH: (dateStr) => {
                try {
                    if (typeof dateStr === 'string') {
                        const dateMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                        if (dateMatch) {
                            const [_, day, month, year] = dateMatch;
                            return parseInt(month, 10);
                        }
                    }
                    const timestamp = parser.functions.DATE(dateStr);
                    return timestamp ? new Date(timestamp).getMonth() + 1 : null;
                } catch (e) {
                    console.error('Error in MONTH function:', e);
                    return null;
                }
            },

            DAY: (dateStr) => {
                try {
                    if (typeof dateStr === 'string') {
                        const dateMatch = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
                        if (dateMatch) {
                            const [_, day, month, year] = dateMatch;
                            return parseInt(day, 10);
                        }
                    }
                    const timestamp = parser.functions.DATE(dateStr);
                    return timestamp ? new Date(timestamp).getDate() : null;
                } catch (e) {
                    console.error('Error in DAY function:', e);
                    return null;
                }
            },

            // Специальные функции
            TODAY: () => new Date().getTime(),
            NOW: () => Date.now()
        };

        // Обработка каждой колонки
        customWhereColumns.forEach((column, iCol) => {
            if (column.fx) {
                // Обработка агрегатных функций
                const aggMatch = column.fx.match(/^(SUM|AVG|COUNT|MIN|MAX|STDDEV)\(\[(.+?)\]\)/i);
                const windowMatch = column.fx.match(/^MOVING_AVG\(\[(.+?)\],\s*(\d+)\)/i);
                const corrMatch = column.fx.match(/^CORREL\(\[(.+?)\],\s*\[(.+?)\]\)/i);

                if (aggMatch) {
                    const [_, func, colName] = aggMatch;
                    const targetCol = customWhereColumns.findIndex(c => c.name === colName);
                    if (targetCol >= 0) {
                        const values = arrayData.map(row => row[targetCol]);
                        const result = calculateAggregations(values, func);
                        arrayData.forEach(row => row[iCol] = result !== null ? result : 'N/A');
                    }
                }
                else if (windowMatch) {
                    const [_, colName, windowSize] = windowMatch;
                    const targetCol = customWhereColumns.findIndex(c => c.name === colName);
                    if (targetCol >= 0) {
                        const values = arrayData.map(row => row[targetCol]);
                        const results = processTimeSeries(values, parseInt(windowSize));
                        arrayData.forEach((row, i) => row[iCol] = results[i] !== null ? results[i] : 'N/A');
                    }
                }
                else if (corrMatch) {
                    const [_, colName1, colName2] = corrMatch;
                    const targetCol1 = customWhereColumns.findIndex(c => c.name === colName1);
                    const targetCol2 = customWhereColumns.findIndex(c => c.name === colName2);

                    if (targetCol1 >= 0 && targetCol2 >= 0) {
                        const values1 = arrayData.map(row => row[targetCol1]);
                        const values2 = arrayData.map(row => row[targetCol2]);
                        const result = calculateCorrelation(values1, values2);
                        arrayData.forEach(row => row[iCol] = result !== null ? result : 'N/A');
                    }
                }
                else {
                    // Обработка обычных формул
                    arrayData.forEach((record) => {
                        try {
                            const variables = {};
                            customWhereColumns.forEach((col, index) => {
                                let value = record[index];
                                if (value === undefined || value === null) value = '';

                                // Нормализация чисел
                                if (typeof value === 'string' && value.includes(',')) {
                                    value = value.replace(',', '.');
                                }

                                // Парсинг чисел
                                const numValue = parseFloat(value);
                                variables[col.name] = !isNaN(numValue) ? numValue : value;
                                variables[`${col.name}_percent`] = typeof value === 'number' ? value * 100 : value;
                            });

                            let preparedExpression = prepareExpression(column.fx);

                            // Обработка процентов
                            if (preparedExpression.includes('%')) {
                                preparedExpression = preparedExpression.replace(/\[([^\]]+)\]/g, '[$1_percent]');
                                preparedExpression = preparedExpression.replace(/%/g, '');
                            }

                            // Подстановка переменных
                            preparedExpression = preparedExpression.replace(
                                /\[([^\]]+)]/g,
                                (match, varName) => {
                                    const val = variables[varName];
                                    return val !== undefined ?
                                        (typeof val === 'string' ? `"${val}"` : val) :
                                        '""';
                                }
                            );

                            // Удаляем лишние пробелы вокруг операторов
                            preparedExpression = preparedExpression.replace(/\s*([=><!+\-*/%])\s*/g, ' $1 ');

                            const result = parser.parse(preparedExpression).evaluate(variables);
                            record[iCol] = typeof result === 'boolean' ? (result ? "Да" : "Нет") : result;
                        } catch (error) {
                            console.error(`Ошибка в выражении для столбца ${column.name}:`, error);
                            record[iCol] = `Ошибка: ${error.message}`;
                        }
                    });
                }
            }

            // Обработка условий WHERE
            if (column.where && typeof column.where === "object" && !Array.isArray(column.where)) {
                const { operator = dataWhereColumns[0], value } = column.where;
                arrayData.forEach((record) => {
                    try {
                        let recordValue = record[iCol];
                        let compareValue = value;

                        // Обработка дат
                        if (typeof recordValue === 'string' && recordValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                            recordValue = parseDateToTimestamp(recordValue);
                        }
                        if (typeof compareValue === 'string' && compareValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                            compareValue = parseDateToTimestamp(compareValue);
                        }

                        // Нормализация чисел
                        recordValue = normalizeNumbers(String(recordValue));
                        compareValue = normalizeNumbers(String(compareValue));

                        // Парсинг чисел
                        const numRecordValue = parseFloat(recordValue);
                        const numCompareValue = parseFloat(compareValue);
                        if (!isNaN(numRecordValue)) recordValue = numRecordValue;
                        if (!isNaN(numCompareValue)) compareValue = numCompareValue;

                        // Формирование условия
                        const conditionExpr = `${recordValue} ${operator} ${compareValue}`;
                        const condition = parser.parse(conditionExpr).evaluate();

                        if (condition) {
                            newArrayWhereData.push(record);
                        }
                        const result = parser.parse(preparedExpression).evaluate(variables);
                        record[iCol] = typeof result === 'boolean' ? (result ? "Да" : "Нет") : result;

                    } catch (error) {
                        console.error(`Ошибка в выражении для столбца ${column.name}:`, error);
                        record[iCol] = `Ошибка: ${error.message}`;
                        toast.error(`Ошибка в формуле "${column.fx}": ${error.message}`, {
                            position: "top-right",
                            autoClose: 5000
                        });
                    }
                });
            }
        });

        const allReportData = newArrayWhereData.length > 0 ? newArrayWhereData : arrayData;
        setNewDataReport(allReportData);
        return allReportData;
    };

    const handlePreview = () => {
        const bearerToken = localStorage.getItem('api_token');

        try {
            // Фильтруем и обрабатываем данные
            const newDataReport = filterDataReport();

            // Форматируем данные, особенно даты
            const formattedData = newDataReport.map(row => {
                const newRow = Array.isArray(row) ? [...row] : {...row};

                customWhereColumns.forEach((col, index) => {
                    if (!newRow.hasOwnProperty(index)) return;

                    const isDateColumn = col.type === 'date' ||
                        (col.name && col.name.toLowerCase().includes('date'));

                    if (isDateColumn) {
                        try {
                            let dateValue = newRow[index];

                            // Если значение отсутствует
                            if (dateValue === null || dateValue === undefined || dateValue === '') {
                                newRow[index] = '';
                                return;
                            }

                            // Если это число (Excel serial date)
                            if (typeof dateValue === 'number') {
                                const date = excelSerialToDate(dateValue);
                                if (date) {
                                    const day = String(date.getDate()).padStart(2, '0');
                                    const month = String(date.getMonth() + 1).padStart(2, '0');
                                    const year = date.getFullYear();
                                    newRow[index] = `${day}.${month}.${year}`;
                                }
                                return;
                            }

                            // Если это строка в правильном формате
                            if (typeof dateValue === 'string' && dateValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                                return; // Оставляем как есть
                            }

                            // Пытаемся распарсить другие форматы дат
                            const parsedDate = new Date(dateValue);
                            if (!isNaN(parsedDate.getTime())) {
                                const day = String(parsedDate.getDate()).padStart(2, '0');
                                const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                                const year = parsedDate.getFullYear();
                                newRow[index] = `${day}.${month}.${year}`;
                            } else {
                                newRow[index] = ''; // Невалидная дата
                            }
                        } catch (error) {
                            console.error(`Ошибка форматирования даты в колонке ${col.name}:`, error);
                            newRow[index] = '';
                        }
                    }
                });

                return newRow;
            });

            // Подготавливаем данные для отправки
            const dataForm = {
                format: selectedExtension,
                name: name.trim(),
                headers: customWhereColumns.map(col => ({
                    name: col.name,
                    title: col.title || col.name,
                    type: (col.name && col.name.toLowerCase().includes('date')) ? 'date' : col.type,
                    fx: col.fx || null,
                    where: col.where || null
                })),
                data: formattedData.length > 0 ? formattedData : dataReport
            };

            // Проверка данных перед отправкой
            if (!dataForm.name) {
                toast.error("Название отчета не может быть пустым", { position: "top-right" });
                return;
            }

            if (!selectedExtension) {
                toast.error("Выберите формат экспорта", { position: "top-right" });
                return;
            }

            // Отправка запроса
            fetch(`${API_URL}/api/report/export/${currentReportId}/preview`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${bearerToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(dataForm),
            })
                .then(async res => {
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        throw new Error(errorData.message || 'Ошибка сервера');
                    }
                    return res.blob();
                })
                .then(blob => {
                    if (!blob || blob.size === 0) {
                        throw new Error("Получен пустой файл");
                    }

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${dataForm.name}.${selectedExtension}`;
                    document.body.appendChild(a);
                    a.click();

                    // Очистка
                    setTimeout(() => {
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                    }, 100);

                    toast.success(`Предпросмотр отчета "${dataForm.name}" успешно создан`, {
                        position: "top-right",
                        autoClose: 3000
                    });
                })
                .catch(error => {
                    console.error("Error while generating preview:", error);
                    toast.error(`Ошибка при создании предпросмотра: ${error.message}`, {
                        position: "top-right",
                        autoClose: 5000
                    });
                });

        } catch (error) {
            console.error("Unexpected error in handlePreview:", error);
            toast.error(`Непредвиденная ошибка: ${error.message}`, {
                position: "top-right",
                autoClose: 5000
            });
        }
    };

    const handleChangeToReport = () => {
        const bearerToken = localStorage.getItem('api_token');
        filterDataReport();

        const dataForm = {
            id: currentReportId,
            category_id: selectedCategory,
            name,
            extension: selectedExtension,
            headers: customWhereColumns,
            whereData: newDataReport.length > 0 ? newDataReport : dataReport,
        };

        fetch(`${API_URL}/api/report`, {
            method: 'PATCH',
            headers: {
                'Authorization': 'Bearer ' + bearerToken,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataForm),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    toast.success("Отчет успешно обновлен", {
                        position: "top-right",
                        autoClose: 3000
                    });
                    setOriginalName(name);
                } else {
                    toast.error(`Ошибка при сохранении: ${data.message || JSON.stringify(data)}`, {
                        position: "top-right",
                        autoClose: 5000
                    });
                }
            })
            .catch(error => {
                toast.error(`Ошибка сети: ${error.message}`, {
                    position: "top-right",
                    autoClose: 5000
                });
            });
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;
        const items = Array.from(customWhereColumns);
        const [reorderedItem] = items.splice(result.source.index, 1);
        items.splice(result.destination.index, 0, reorderedItem);
        setCustomWhereColumns(items);
    };

    if (reportNotFound || !currentReportId) {
        return (
            <div className={styles.container}>
                <div>
                    <h3>Выберите отчет из системы</h3>
                    <p>Пожалуйста, выберите существующий отчет для редактирования</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {showFormulaModal && (
                <FormulaEditorModal
                    formula={customWhereColumns[editingFormulaIndex]?.fx || ''}
                    onSave={handleSaveFormula}
                    onClose={() => setShowFormulaModal(false)}
                />
            )}

            <div className={styles.box}>
                <input
                    type="text"
                    placeholder="Введите название отчета"
                    value={name || ''}
                    onChange={(e) => setName(e.target.value)}
                />
                <select
                    className={styles.slctPart}
                    value={selectedCategory ?? ""}
                    onChange={(e) => setSelectedCategory(Number(e.target.value))}
                >
                    <option value="" disabled>Выберите категорию</option>
                    {dataCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                <select
                    className={styles.slctPart}
                    value={selectedExtension || ''}
                    onChange={(e) => setSelectedExtension(e.target.value)}
                >
                    {dataExtensions.map((extension) => (
                        <option key={extension} value={extension}>
                            {extension}
                        </option>
                    ))}
                </select>
                <button className={styles.btn_preview} onClick={handlePreview}>Предпросмотр</button>
            </div>

            <div className={styles.box3}>
                <div className={styles.box__title}>
                    <img src={screp} alt="screp" />
                    <label>Добавить условие для отчета:</label>
                    <span className={styles.addColumnBtn} onClick={handleAddWhereColumn}>+</span>
                </div>
            </div>

            {customWhereColumns.map((column) =>
                    column.where && !Array.isArray(column.where) && (
                        <div key={column.name} className={styles.column}>
                            <select
                                className={styles.slct_column}
                                value={column.name || ''}
                                onChange={(e) => handleColumnWhereChange(e.target.value, 'name')}
                            >
                                {dataHeaders.map((header) => (
                                    <option key={header.name} value={header.name}>
                                        {header.title}
                                    </option>
                                ))}
                            </select>
                            <select
                                className={styles.slct_column}
                                value={column.where?.operator || ''}
                                onChange={(e) => handleColumnWhereChange(column.name, "operator", e.target.value, true)}
                            >
                                {dataWhereColumns.map((where) => (
                                    <option key={where} value={where}>
                                        {where}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="text"
                                className={styles.inpt_js}
                                value={column.where?.value || ''}
                                onChange={(e) => handleColumnWhereChange(column.name, "value", e.target.value, true)}
                                placeholder="Значение"
                            />
                            <button onClick={() => handleDeleteWhereColumn(column.name)}>Удалить</button>
                        </div>
                    )
            )}

            <div className={styles.box3}>
                <div className={styles.box__title}>
                    <img src={screp} alt="screp" />
                    <label>Настройка столбцов:</label>
                    <span className={styles.addColumnBtn} onClick={handleAddColumn}>+</span>
                </div>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="columns">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef}>
                            {customWhereColumns.map((column, index) => (
                                <Draggable key={column.name} draggableId={column.name} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={styles.column}
                                        >
                                            <span className={styles.dragHandle} {...provided.dragHandleProps}>
                                                ☰
                                            </span>
                                            <span>{index + 1}.</span>
                                            <div className={styles.radioGroup}>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        checked={column.type === "a"}
                                                        onChange={() => handleColumnChange(index, "type", "a")}
                                                    /> a
                                                </label>
                                                <label>
                                                    <input
                                                        type="radio"
                                                        checked={column.type === "fx"}
                                                        onChange={() => handleColumnChange(index, "type", "fx")}
                                                    /> f(x)
                                                </label>
                                            </div>
                                            {column.type === "a" && typeof column.name === "string" && !column.name.includes('new_column_') && (
                                                <input
                                                    type="text"
                                                    className={styles.inpt_js}
                                                    value={column.title || ''}
                                                    onChange={(e) => handleColumnChange(index, "title", e.target.value)}
                                                    placeholder="Введите заголовок"
                                                />
                                            )}
                                            {column.name?.indexOf('new_column_') === 0 && (
                                                <input
                                                    type="text"
                                                    className={styles.inpt_js}
                                                    value={column.title || ''}
                                                    onChange={(e) => handleColumnChange(index, "title", e.target.value)}
                                                    placeholder="Введите заголовок"
                                                />
                                            )}
                                            {column.type === "fx" && column.where && (
                                                <div className={styles.formulaInputContainer}>
                                                    <input
                                                        type="text"
                                                        className={styles.inpt_js}
                                                        value={column.fx ?? ''}
                                                        onClick={() => handleFormulaClick(index)}
                                                        onChange={(e) => handleColumnChange(index, "fx", e.target.value)}
                                                        placeholder='Пример: [professiya] == "Web-разработчик" ? "Да" : "Нет"'
                                                    />
                                                    <button
                                                        className={styles.copyButton}
                                                        onClick={() => {
                                                            navigator.clipboard.writeText(`[${column.name}]`);
                                                            toast.success(`Скопировано: [${column.name}]`, { position: "top-right" });
                                                        }}
                                                        title="Копировать имя столбца"
                                                    >
                                                        <img width="20" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAACXBIWXMAAAsTAAALEwEAmpwYAAAA6ElEQVR4nO2WUQ6DIAyGedqhNnc9ddea2U3UW/z8CwlsjIBYwnyRJn2oxH7yl0qVEhrJC4AHgBXAAmAwz9S/DcCotabvAPojwIuBkbySvFnwUiU5PTnD3Tk3UAeOuS3DKCoDInKWujkDEvBHznAtBYio1onLoBPJ7EdNkV09pXlUlRcS1sBZa1I7A/Ayp3pvHCqHYH231OYlv3VycQQ8pVpvE3y+dkKuRpk8qFXjAvDUavxjrcaHtRO+E0hXCiV5t0PCLAEPFWeufncf2ylzcDsvBM4G6k+ZEP4HTmwQ3se5WAIW3cdb8RsttbBVCsntVwAAAABJRU5ErkJggg==" alt="copy-2"/>
                                                    </button>
                                                </div>
                                            )}

                                            <button onClick={() => handleDeleteColumn(index)}>Удалить</button>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            <button onClick={handleChangeToReport} className={styles.addToReportBtn}>
                Сохранить изменения
            </button>
        </div>
    );
};

export default ReportCreation;