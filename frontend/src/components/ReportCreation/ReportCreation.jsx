import React, { useState, useEffect } from "react";
import styles from "./ReportCreation.module.sass";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Parser } from 'expr-eval';
import screp from '../../assets/screp.svg';
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";
import del from '../../assets/del.svg';

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
                        <h4>Примеры формул</h4>
                        <ul>
                            {[
                                { formula: 'SUM([Зарплата (руб.)])', desc: 'Общий фонд оплаты труда' },
                                { formula: 'AVG([Зарплата (руб.)])', desc: 'Средняя зарплата' },
                                { formula: 'MIN([Зарплата (руб.)])', desc: 'Минимальная зарплата' },
                                { formula: 'MAX([Зарплата (руб.)])', desc: 'Максимальная зарплата' },
                                { formula: 'STDDEV([Зарплата (руб.)])', desc: 'Стандартное отклонение зарплат' },
                                { formula: 'YEAR([Дата рождения])', desc: 'Год из даты' },
                                { formula: 'DATEDIFF([Дата приёма], TODAY())', desc: 'Стаж работы в днях' },
                                { formula: 'COMPARE_DATES([Дата рождения], "19.05.2000", "<")', desc: 'Категоризация по дате рождения' },
                                { formula: 'IF(AND([Подарки] == "Да", [Зарплата] < 60000), ...)', desc: 'Проверка получения подарков' },
                                { formula: 'CONCAT([ФИО], ", ", [Должность])', desc: 'Конкатенация строк' },
                                { formula: '[Подарки] == "Да" ? "Получает подарки" : "Без подарков"', desc: 'Проверка подарков (тернарный оператор)' },
                                { formula: '[Зарплата (руб.)] > AVG([Зарплата (руб.)]) ? "Выше среднего" : "Ниже среднего"', desc: 'Сравнение зарплаты со средним' },
                                { formula: '[Должность] == "Менеджер по продажам" ? [Зарплата (руб.)] * 1.1 : [Зарплата (руб.)]', desc: 'Повышение зарплаты менеджерам' },
                                { formula: '[Примечание] == "" ? "Нет примечания" : [Примечание]', desc: 'Проверка пустого примечания' },
                                { formula: 'ROUND([Зарплата (руб.)] / 30 * [Отпуск (дни)], 2)', desc: 'Расчёт отпускных' },
                                { formula: '[Зарплата (руб.)] * 12', desc: 'Годовая зарплата' },
                                { formula: 'LOG([Зарплата (руб.)])', desc: 'Натуральный логарифм зарплаты' },
                                { formula: 'IF(AND([column_9] == "Да", [zarplata_rub] < 60000), "Низкооплачиваемый, но с подарками", "Другая категория")', desc: 'Категоризация по зарплате и подаркам' },
                                { formula: 'IF([Должность] CONTAINS "специалист", [Зарплата (руб.)] * 1.05, [Зарплата (руб.)])', desc: 'Повышение зарплаты специалистам' },
                                { formula: 'CORREL([Зарплата (руб.)], [Год из даты])', desc: 'Корреляция зарплаты и года рождения' },
                                { formula: 'MOVING_AVG([Зарплата (руб.)], 3)', desc: 'Скользящее среднее зарплаты' },
                            ].map((item, index) => (
                                <li
                                    key={index}
                                    data-description={item.desc}
                                    onClick={() => {
                                        navigator.clipboard.writeText(item.formula)
                                            .then(() => {
                                                // Можно добавить уведомление или временное выделение
                                                const element = document.querySelector(`[data-description="${item.desc}"]`);
                                                if (element) {
                                                    element.classList.add(styles.copied);
                                                    setTimeout(() => {
                                                        element.classList.remove(styles.copied);
                                                    }, 1000);
                                                }
                                            })
                                            .catch(err => console.error('Ошибка копирования:', err));
                                    }}
                                    style={{cursor: 'pointer'}}
                                >
                                    <code>{item.formula}</code>
                                </li>
                            ))}
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

    const parseDateValue = (value) => {
        if (value === null || value === undefined || value === '') {
            return null;
        }

        if (typeof value === 'number') {
            if (value > 0 && value < 50000) {
                const date = excelSerialToDate(value);
                return date.getTime();
            }
            return value;
        }

        if (typeof value === 'string') {
            const trimmed = value.trim().replace(/"/g, '');

            // Попробуем разные форматы дат
            const formats = [
                /^(\d{1,2})[\.\/-](\d{1,2})[\.\/-](\d{4})$/, // DD.MM.YYYY
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
                /^(\d{4})(\d{2})(\d{2})$/, // YYYYMMDD
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // MM/DD/YYYY
            ];

            for (const format of formats) {
                const match = trimmed.match(format);
                if (match) {
                    let day, month, year;

                    if (format === formats[0] || format === formats[3]) {
                        // DD.MM.YYYY или MM/DD/YYYY
                        day = format === formats[0] ? match[1] : match[2];
                        month = format === formats[0] ? match[2] : match[1];
                        year = match[3];
                    } else {
                        // YYYY-MM-DD или YYYYMMDD
                        year = match[1];
                        month = match[2];
                        day = match[3];
                    }

                    const pad = num => num.length === 1 ? `0${num}` : num;
                    const normalizedDate = `${pad(day)}.${pad(month)}.${year}`;
                    const date = new Date(normalizedDate.split('.').reverse().join('-'));
                    if (!isNaN(date.getTime())) {
                        return date.getTime();
                    }
                }
            }
        }

        if (value instanceof Date) {
            return value.getTime();
        }

        return null;
    };

    const excelSerialToDate = (serial) => {
        if (typeof serial !== 'number' || serial < 0) return null;
        const utcDays = Math.floor(serial - 25569);
        const utcValue = utcDays * 86400;
        const date = new Date(utcValue * 1000);
        const offset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() + offset);
    };

    const formatDateToString = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';
            const day = String(date.getDate()).padStart(2, '0');
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
        } catch (e) {
            console.error('Error formatting date:', e);
            return '';
        }
    };

    const initParserFunctions = () => {
        const parser = new Parser();

        // Добавляем пользовательские функции
        parser.functions.DATEDIFF = (date1, date2) => {
            const d1 = parseDateValue(date1);
            const d2 = parseDateValue(date2);
            if (d1 === null || d2 === null) return null;
            return Math.abs((d1 - d2) / (1000 * 60 * 60 * 24) / 360); // Разница в днях
        };

        parser.functions.CONTAINS = (str, substr) => {
            if (typeof str !== 'string' || typeof substr !== 'string') return false;
            return str.includes(substr);
        };

        parser.functions.AND = (...args) => {
            return args.every(arg => Boolean(arg));
        };

        parser.functions.MOVING_AVG = (values, windowSize) => {
            if (!Array.isArray(values)) return null;
            windowSize = parseInt(windowSize);
            const results = [];
            for (let i = 0; i < values.length; i++) {
                const start = Math.max(0, i - windowSize + 1);
                const window = values.slice(start, i + 1);
                const nums = window.map(v => parseFloat(v)).filter(v => !isNaN(v));
                results.push(nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : null);
            }
            return results;
        };

        parser.functions.CASE = (...args) => {
            // Реализация CASE через вложенные IF
            for (let i = 0; i < args.length - 1; i += 2) {
                if (args[i]) return args[i + 1];
            }
            return args.length % 2 === 1 ? args[args.length - 1] : null;
        };

        parser.functions = {
            ...parser.functions,
            // Остальные стандартные функции
            SUM: (...args) => args.reduce((a, b) => a + b, 0),
            AVG: (...args) => args.reduce((a, b) => a + b, 0) / args.length,
            COUNT: (...args) => args.length,
            MIN: (...args) => Math.min(...args),
            MAX: (...args) => Math.max(...args),
            STDDEV: (...args) => {
                const avg = args.reduce((a, b) => a + b, 0) / args.length;
                return Math.sqrt(args.reduce((sq, n) => sq + Math.pow(n - avg, 2), 0) / args.length);
            },
            LOG: Math.log,
            EXP: Math.exp,
            SQRT: Math.sqrt,
            POW: Math.pow,
            ABS: Math.abs,
            ROUND: (num, decimals = 0) => {
                const factor = Math.pow(10, decimals);
                return Math.round((num + Number.EPSILON) * factor) / factor;
            },
            IF: (condition, trueVal, falseVal) => condition ? trueVal : falseVal,
            CONCAT: (...args) => args.join(''),
            DATE: (dateStr) => parseDateValue(dateStr),
            DATE_TO_STR: (timestamp) => formatDateToString(timestamp),
            YEAR: (dateStr) => {
                try {
                    const timestamp = parseDateValue(dateStr);
                    if (timestamp === null) return null;
                    const date = new Date(timestamp);
                    return date.getFullYear();
                } catch (e) {
                    console.error('[YEAR] Error:', e);
                    return null;
                }
            },
            TODAY: () => new Date().getTime(),
            NOW: () => Date.now(),
            COMPARE_DATES: (date1, date2, operator) => {
                try {
                    const timestamp1 = parseDateValue(date1);
                    const timestamp2 = parseDateValue(date2);

                    if (timestamp1 === null || timestamp2 === null) return false;

                    switch(operator) {
                        case '<': return timestamp1 < timestamp2;
                        case '<=': return timestamp1 <= timestamp2;
                        case '>': return timestamp1 > timestamp2;
                        case '>=': return timestamp1 >= timestamp2;
                        case '==': return timestamp1 === timestamp2;
                        case '!=': return timestamp1 !== timestamp2;
                        default: return false;
                    }
                } catch (e) {
                    console.error('Ошибка сравнения дат:', e);
                    return false;
                }
            },
            CORREL: (values1, values2) => {
                if (!Array.isArray(values1)) values1 = [values1];
                if (!Array.isArray(values2)) values2 = [values2];

                if (values1.length !== values2.length || values1.length === 0) return null;

                const nums1 = values1.map(v => parseFloat(v)).filter(v => !isNaN(v));
                const nums2 = values2.map(v => parseFloat(v)).filter(v => !isNaN(v));

                if (nums1.length !== nums2.length || nums1.length === 0) return null;

                const mean1 = nums1.reduce((a, b) => a + b, 0) / nums1.length;
                const mean2 = nums2.reduce((a, b) => a + b, 0) / nums2.length;

                let cov = 0, stddev1 = 0, stddev2 = 0;

                for (let i = 0; i < nums1.length; i++) {
                    cov += (nums1[i] - mean1) * (nums2[i] - mean2);
                    stddev1 += Math.pow(nums1[i] - mean1, 2);
                    stddev2 += Math.pow(nums2[i] - mean2, 2);
                }

                return cov / Math.sqrt(stddev1 * stddev2);
            },
            // Добавляем поддержку CASE WHEN
            WHEN: (condition, value) => condition ? value : null,
            ELSE: (value) => value
        };

        return parser;
    };

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

    const normalizeNumbers = (value) => {
        if (typeof value === 'string') {
            return value.replace(/,/g, '.');
        }
        return value;
    };

    const calculateAggregations = (values, func) => {
        if (func.toUpperCase() === 'COUNT') {
            return values.filter(v => v !== null && v !== undefined && v !== '').length;
        }

        const nums = values.map(v => {
            if (typeof v === 'string') {
                v = normalizeNumbers(v);
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
        setCustomWhereColumns(prev => {
            const newColumns = [...prev];
            for (let i = 0; i < newColumns.length; i++) {
                if (Array.isArray(newColumns[i].where)) {
                    newColumns[i].where = {};
                    break;
                }
            }
            return newColumns;
        });
    };

    const handleColumnWhereChange = (name, field, value = '', where = false) => {
        setCustomWhereColumns(prev => prev.map(column => {
            if (column.name === name) {
                if (where) {
                    return {
                        ...column,
                        where: {
                            ...(column.where || {}),
                            [field]: value
                        }
                    };
                }
                return {
                    ...column,
                    [field]: value
                };
            }
            return column;
        }));
    };

    const handleDeleteWhereColumn = (name) => {
        setCustomWhereColumns(prev => prev.map(column => {
            if (column.name === name) {
                return {
                    ...column,
                    where: []
                };
            }
            return column;
        }));
    };

    const maxNumber = customWhereColumns.reduce((max, col) => {
        const match = col.name.match(/^column_(\d+)$/);
        if (match) {
            const num = parseInt(match[1], 10);
            return num > max ? num : max;
        }
        return max;
    }, 0);

    const handleAddColumn = () => {
        const newColumn = {
            fx: "",
            type: "a",
            name: `column_${maxNumber + 1}`,
            title: "",
            where: []
        };
        setCustomWhereColumns([...customWhereColumns, newColumn]);

        // Добавляем пустые значения для нового столбца во все строки данных
        setDataReport(prevData => prevData.map(row => [...row, '']));
    };

    const handleColumnChange = (index, field, value = '') => {
        setCustomWhereColumns(prev => prev.map((column, iCol) => {
            if (iCol === index) {
                return {
                    ...column,
                    [field]: value
                };
            }
            return column;
        }));
    };

    const handleDeleteColumn = (index) => {
        setCustomWhereColumns(prev => prev.filter((_, iCol) => iCol !== index));
        setDataReport(prevData => prevData.map(row => {
            const newRow = [...row];
            newRow.splice(index, 1);
            return newRow;
        }));
    };

    const handleFormulaClick = (index) => {
        setEditingFormulaIndex(index);
        setShowFormulaModal(true);
    };

    const handleSaveFormula = (formula) => {
        handleColumnChange(editingFormulaIndex, "fx", formula);
        setShowFormulaModal(false);
    };

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const newColumns = [...customWhereColumns];
        const [removed] = newColumns.splice(result.source.index, 1);
        newColumns.splice(result.destination.index, 0, removed);

        // Переставляем данные в строках соответствующим образом
        const newData = dataReport.map(row => {
            const newRow = [...row];
            const [removedValue] = newRow.splice(result.source.index, 1);
            newRow.splice(result.destination.index, 0, removedValue);
            return newRow;
        });

        setCustomWhereColumns(newColumns);
        setDataReport(newData);
    };

    const transformCaseExpression = (expr) => {
        // Преобразуем CASE WHEN ... THEN ... ELSE ... END в серию вложенных IF
        return expr.replace(
            /CASE\s+WHEN\s+(.+?)\s+THEN\s+(.+?)(?:\s+WHEN\s+(.+?)\s+THEN\s+(.+?))*\s+ELSE\s+(.+?)\s+END/gi,
            (match, firstCondition, firstValue, ...rest) => {
                let result = `IF(${firstCondition}, ${firstValue}`;
                const pairs = [];

                // Обрабатываем оставшиеся WHEN/THEN пары
                for (let i = 0; i < rest.length - 1; i += 2) {
                    if (rest[i] && rest[i+1]) {
                        pairs.push(`IF(${rest[i]}, ${rest[i+1]}`);
                    }
                }

                // Добавляем ELSE в конец
                const elseValue = rest[rest.length - 1];
                result = pairs.join(', ') + (pairs.length > 0 ? ', ' : '') + result;

                // Закрываем все скобки
                return result + ')' + ')'.repeat(pairs.length);
            }
        );
    };

    const filterDataReport = () => {
        const parser = initParserFunctions();
        const arrayData = [...dataReport];
        const newArrayWhereData = [];

        const prepareExpression = (expr) => {
            if (typeof expr !== 'string') return expr;

            // Преобразуем CASE WHEN выражения
            expr = transformCaseExpression(expr);

            // Преобразуем IF с датами
            expr = expr.replace(
                /IF\s*\(\s*\[([^\]]+)\]\s*(<=|>=|<|>|==|!=)\s*"(\d{2}\.\d{2}\.\d{4})"\s*,\s*("[^"]*"|[^,]+)\s*,\s*("[^"]*"|[^)]+)\s*\)/g,
                (match, colName, operator, dateStr, trueVal, falseVal) => {
                    return `IF(COMPARE_DATES([${colName}], "${dateStr}", "${operator}"), ${trueVal}, ${falseVal})`;
                }
            );

            expr = expr.replace(/&&/g, ' AND ');
            expr = expr.replace(/\|\|/g, ' OR ');

            // Преобразуем CONTAINS
            expr = expr.replace(
                /\[([^\]]+)\]\s+CONTAINS\s+"([^"]+)"/g,
                (match, colName, substr) => {
                    return `CONTAINS([${colName}], "${substr}")`;
                }
            );

            return expr;
        };

        customWhereColumns.forEach((column, iCol) => {
            if (column.fx) {
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
                    arrayData.forEach((record, rowIndex) => {
                        try {
                            const variables = {};
                            customWhereColumns.forEach((col, index) => {
                                let value = record[index];
                                if (value === undefined || value === null) value = '';

                                if (col.type === 'date' || col.name.toLowerCase().includes('date')) {
                                    value = parseDateValue(value);
                                    variables[col.name] = value !== null ? value : '""';
                                } else {
                                    // Для строковых значений добавляем кавычки
                                    if (typeof value === 'string' && !/^-?\d*\.?\d+$/.test(value)) {
                                        variables[col.name] = `"${value}"`;
                                    } else {
                                        variables[col.name] = value;
                                    }
                                }
                            });

                            if (column.fx) {
                                let preparedExpression = prepareExpression(column.fx);

                                // Заменяем ссылки на столбцы их значениями
                                preparedExpression = preparedExpression.replace(/\[([^\]]+)\]/g,
                                    (match, colName) => variables[colName] || '""'
                                );

                                // Вычисляем выражение
                                const result = parser.parse(preparedExpression).evaluate(variables);

                                // Форматируем результат
                                if (typeof result === 'number') {
                                    if (Number.isInteger(result)) {
                                        record[iCol] = result;
                                    } else {
                                        record[iCol] = parseFloat(result.toFixed(4));
                                    }
                                } else {
                                    record[iCol] = result;
                                }
                            }
                        } catch (error) {
                            console.error(`Ошибка в выражении для столбца ${column.name}, строка ${rowIndex + 1}:`, error);
                            record[iCol] = `Ошибка: ${error.message}`;
                        }
                    });
                }
            }

            if (column.where && typeof column.where === "object" && !Array.isArray(column.where)) {
                const { operator = dataWhereColumns[0], value } = column.where;
                arrayData.forEach((record) => {
                    try {
                        let recordValue = record[iCol];
                        let compareValue = value;

                        if (column.type === 'date' || column.name.toLowerCase().includes('date')) {
                            recordValue = parseDateValue(recordValue);
                            compareValue = parseDateValue(compareValue);
                        } else {
                            recordValue = normalizeNumbers(String(recordValue));
                            compareValue = normalizeNumbers(String(compareValue));

                            const numRecordValue = parseFloat(recordValue);
                            const numCompareValue = parseFloat(compareValue);
                            if (!isNaN(numRecordValue)) recordValue = numRecordValue;
                            if (!isNaN(numCompareValue)) compareValue = numCompareValue;
                        }

                        const conditionExpr = `${recordValue} ${operator} ${compareValue}`;
                        const condition = parser.parse(conditionExpr).evaluate();

                        if (condition) {
                            newArrayWhereData.push(record);
                        }
                    } catch (error) {
                        console.error(`Ошибка в выражении для столбца ${column.name}:`, error);
                        record[iCol] = `Ошибка: ${error.message}`;
                    }
                });
            }
        });
        return newArrayWhereData.length > 0 ? newArrayWhereData : arrayData;
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

    const handlePreview = () => {
        const bearerToken = localStorage.getItem('api_token');
        try {
            const newDataReport = filterDataReport();

            const formattedData = newDataReport.map(row => {
                const newRow = Array.isArray(row) ? [...row] : {...row};

                customWhereColumns.forEach((col, index) => {
                    if (!newRow.hasOwnProperty(index)) return;

                    const isDateColumn = col.type === 'date' ||
                        (col.name && col.name.toLowerCase().includes('date'));

                    if (isDateColumn) {
                        try {
                            newRow[index] = formatDateToString(newRow[index]);
                        } catch (error) {
                            console.error(`Ошибка форматирования даты:`, error);
                            newRow[index] = '';
                        }
                    }
                });

                return newRow;
            });

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

            if (!dataForm.name) {
                toast.error("Название отчета не может быть пустым", { position: "top-right" });
                return;
            }

            if (!selectedExtension) {
                toast.error("Выберите формат экспорта", { position: "top-right" });
                return;
            }

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
        const filteredData = filterDataReport();

        const formattedData = filteredData.map((row, rowIndex) => {
            const newRow = {};

            customWhereColumns.forEach((col, colIndex) => {
                newRow[colIndex] = row[colIndex];
                newRow[col.name] = row[colIndex];
            });

            return newRow;
        });

        const dataForm = {
            id: currentReportId,
            category_id: selectedCategory,
            name,
            extension: selectedExtension,
            headers: customWhereColumns,
            whereData: newDataReport.length > 0 ? newDataReport : dataReport,
            data: formattedData,
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
                                onChange={(e) => handleColumnWhereChange(column.name, 'name', e.target.value)}
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

                                            <input
                                                type="text"
                                                className={styles.inpt_js}
                                                value={column.title || ''}
                                                onChange={(e) => handleColumnChange(index, "title", e.target.value)}
                                                placeholder="Введите заголовок"
                                            />

                                            {column.type === "fx" && (
                                                <div className={styles.formulaInputContainer}>
                                                    <input
                                                        type="text"
                                                        className={styles.inpt_js}
                                                        value={column.fx ?? ''}
                                                        onClick={() => handleFormulaClick(index)}
                                                        onChange={(e) => handleColumnChange(index, "fx", e.target.value)}
                                                        placeholder='Введите формулу или скопируйте поле'
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

                                            <button onClick={() => handleDeleteColumn(index)}>
                                                Удалить
                                            </button>
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