import React, { useState, useEffect } from "react";
import styles from "./ReportCreation.module.sass";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Parser } from 'expr-eval';
// import { addActiveProcess, setReportStatus } from '../features/reportsSlice.jsx';

import screp from '../../assets/screp.svg';
import {DragDropContext, Draggable, Droppable} from "react-beautiful-dnd";

const API_URL = import.meta.env.VITE_API_URL;

const ReportCreation = ({ idReport }) => {
    const [customWhereColumns, setCustomWhereColumns] = useState([]);
    const [dataWhereColumns, setDataWhereColumns] = useState([]);
    const [dataHeaders, setDataHeaders] = useState([]);
    const [dataReport, setDataReport] = useState([]);
    const [newDataReport, setNewDataReport] = useState([]);
    const [dataCategories, setDataCategories] = useState([]);
    const [dataExtensions, setDataExtensions] = useState([]);
    const [name, setName] = useState("");
    const [selectedExtension, setSelectedExtension] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [currentReportId, setCurrentReportId] = useState(idReport);
    const [reportNotFound, setReportNotFound] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        return () => {
            localStorage.removeItem('selectedReportId');
        };
    }, []);

    useEffect(() => {
        // Если пришел новый idReport, используем его и очищаем localStorage
        if (idReport && idReport !== currentReportId) {
            localStorage.removeItem('selectedReportId');
            setCurrentReportId(idReport);
            setReportNotFound(false);
        }
    }, [idReport]);

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

        console.log('Условия выборки полей изменились');
        console.log(customWhereColumns);
    };

    const handleDeleteWhereColumn = (name) => {
        for (let i = 0; i < customWhereColumns.length; i++) {
            if (customWhereColumns[i].name === name) {
                customWhereColumns[i].where = [];
                break;
            }
        }
        console.log('Удаление условия для столбца');
        console.log(customWhereColumns);

        setCustomWhereColumns([...customWhereColumns]);
    };

    const handleAddColumn = () => {
        setCustomWhereColumns([...customWhereColumns, { fx: "", type: "a", name: "new_column_" + customWhereColumns.length, title: "", where: [] }]);

        console.log('Условия настройки полей изменились');
        console.log(customWhereColumns);
    };

    const handleColumnChange = (index, field, value = '') => {
        setCustomWhereColumns(prev => prev.map((column, iCol) => {
            if (iCol === index) {
                column[field] = value;
            }
            return column;
        }));

        console.log('Условия настройки полей изменились');
        console.log(customWhereColumns);
    };

    const handleDeleteColumn = (index) => {
        const newRecords = [];
        const newColumns = customWhereColumns.filter((column, iCol) => {
            if (iCol === index) {
                console.log({ column, iCol, index });

                dataReport.map((records) => {
                    records.splice(index, 1);
                    newRecords.push(records);
                });
            }

            return iCol !== index;
        });

        console.log('===============new===========');
        console.log({ newRecords });

        setNewDataReport([...newRecords]);
        setCustomWhereColumns([...newColumns]);
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

        fetch(`${API_URL}/api/categories`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + bearerToken,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setDataCategories(data.data);
                }
            });

        fetch(`${API_URL}/api/where`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + bearerToken,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setDataWhereColumns(data.data);
                }
            });

        fetch(`${API_URL}/api/report/extensions`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer ' + bearerToken,
            },
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.success) {
                    setDataExtensions(data.data);
                }
            });
    }, [currentReportId, reportNotFound]);

    const calculateYearsOfExperience = (date) => {
        const startDate = new Date(date);
        const currentDate = new Date();
        const diffTime = currentDate - startDate;  // разница в миллисекундах
        const diffYears = diffTime / (1000 * 3600 * 24 * 365);  // конвертируем в годы
        return diffYears;
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

        // Функция для замены дат в строке выражения на timestamp
        const replaceDatesInExpression = (expr) => {
            return expr.replace(/(\d{2}\.\d{2}\.\d{4})/g, (match) => {
                return parseDateToTimestamp(match);
            });
        };

        // // Функция для замены строк в кавычках
        // const replaceStringsInExpression = (expr) => {
        //     // 1. Заменяем все строки в одинарных/двойных кавычках на временные метки
        //     const stringMap = {};
        //     let counter = 0;
        //
        //     expr = expr.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, match => {
        //         const key = `__STR${counter++}__`;
        //         stringMap[key] = match;
        //         return key;
        //     });
        //
        //     // 2. Заменяем все оставшиеся слова в сравнениях на строки
        //     expr = expr.replace(/(==|!=|>=|<=|>|<)\s*([а-яА-ЯёЁa-zA-Z-]+)/g, '$1 "$2"');
        //
        //     // 3. Восстанавливаем оригинальные строки
        //     for (const [key, value] of Object.entries(stringMap)) {
        //         expr = expr.replace(key, value);
        //     }
        //
        //     return expr;
        // };
        //
        // const prepareVariables = (record, columns) => {
        //     const variables = {};
        //
        //     columns.forEach((col, index) => {
        //         let value = record[index];
        //
        //         // Обработка специальных случаев
        //         if (value === undefined || value === null) {
        //             value = '';
        //         }
        //
        //         // Для строковых значений добавляем кавычки
        //         if (typeof value === 'string' && !value.match(/^\d+$/) && !value.startsWith('"') && !value.startsWith("'")) {
        //             value = `"${value}"`;
        //         }
        //
        //         variables[col.name] = value;
        //     });
        //
        //     return variables;
        // };
        //
        // const validateExpression = (expr) => {
        //     // Проверяем наличие незакавыченных слов
        //     const unquotedWords = expr.match(/(==|!=|>=|<=|>|<)\s*([а-яА-ЯёЁa-zA-Z-]+)(?![^"']*["'])/g);
        //     if (unquotedWords) {
        //         throw new Error(`Незакавыченные значения: ${unquotedWords.join(', ')}`);
        //     }
        //
        //     // Проверяем синтаксис тернарного оператора
        //     if (expr.includes('?')) {
        //         const parts = expr.split('?');
        //         if (parts.length !== 2 || !parts[1].includes(':')) {
        //             throw new Error('Некорректный тернарный оператор');
        //         }
        //     }
        // };

        // Функция для нормализации чисел с запятыми
        const normalizeNumbers = (expr) => {
            return expr.replace(/(\d+),(\d+)/g, "$1.$2");
        };

        customWhereColumns.forEach((column, iCol) => {
            if (column.fx) {
                arrayData.forEach((record) => {
                    try {
                        const variables = {};

                        // 1. Сначала добавляем все стандартные переменные из столбцов
                        customWhereColumns.forEach((col, index) => {
                            let value = record[index];
                            if (value === undefined || value === null) value = '';

                            // Для дат преобразуем в timestamp
                            if (typeof value === "string" && value.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                                value = parseDateToTimestamp(value);
                            }

                            // Для строк добавляем кавычки
                            if (typeof value === 'string' && !value.match(/^".*"$|^'.*'$|^\d+$/)) {
                                value = `"${value}"`;
                            }

                            variables[col.name] = value;
                        });

                        // 2. Добавляем yearsOfExperience для текущего столбца, если это дата
                        const currentValue = record[iCol];
                        if (currentValue && typeof currentValue === "string" && currentValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                            variables['yearsOfExperience'] = calculateYearsOfExperience(currentValue);
                        }

                        // 3. Подготавливаем выражение
                        let preparedExpression = column.fx;

                        // Автодобавление кавычек к строкам в условиях
                        preparedExpression = preparedExpression.replace(
                            /(\b[а-яА-ЯёЁa-zA-Z-]+\b)(?=\s*[=><!])/g,
                            '"$1"'
                        );

                        // Обработка тернарного оператора
                        preparedExpression = preparedExpression.replace(
                            /\?\s*([а-яА-ЯёЁa-zA-Z-]+)\s*:/g,
                            '? "$1" :'
                        );
                        preparedExpression = preparedExpression.replace(
                            /:\s*([а-яА-ЯёЁa-zA-Z-]+)$/g,
                            ': "$1"'
                        );

                        // Замена технических значений
                        preparedExpression = replaceDatesInExpression(preparedExpression);
                        preparedExpression = normalizeNumbers(preparedExpression);

                        // 4. Подставляем переменные
                        preparedExpression = preparedExpression.replace(
                            /\[([^\]]+)]/g,
                            (match, varName) => variables[varName] || '""'
                        );

                        // 5. Вычисляем результат
                        const parser = new Parser();
                        const expression = parser.parse(preparedExpression);
                        const result = expression.evaluate(variables);

                        // 6. Сохраняем результат
                        record[iCol] = typeof result === 'boolean'
                            ? (result ? "Да" : "Нет")
                            : result;

                    } catch (error) {
                        console.error(`Ошибка в выражении для столбца ${column.name}:`, error);
                        record[iCol] = `Ошибка: ${error.message}`;
                    }
                });
            }

            // Обработка условий WHERE (остаётся без изменений)
            if (column.where && typeof column.where === "object" && !Array.isArray(column.where)) {
                const { operator = dataWhereColumns[0], value } = column.where;

                arrayData.forEach((record) => {
                    try {
                        let recordValue = record[iCol];
                        let compareValue = value;

                        if (typeof recordValue === 'string' && recordValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                            recordValue = parseDateToTimestamp(recordValue);
                        }
                        if (typeof compareValue === 'string' && compareValue.match(/^\d{2}\.\d{2}\.\d{4}$/)) {
                            compareValue = parseDateToTimestamp(compareValue);
                        }

                        if (typeof recordValue === 'string' && !recordValue.match(/^".*"$|^'.*'$/)) {
                            recordValue = `"${recordValue}"`;
                        }
                        if (typeof compareValue === 'string' && !compareValue.match(/^".*"$|^'.*'$/)) {
                            compareValue = `"${compareValue}"`;
                        }

                        let conditionExpr = `${recordValue} ${operator} ${compareValue}`;
                        conditionExpr = replaceDatesInExpression(conditionExpr);
                        conditionExpr = normalizeNumbers(conditionExpr);

                        const parser = new Parser();
                        const condition = parser.parse(conditionExpr).evaluate();

                        if (condition) {
                            newArrayWhereData.push(record);
                        }
                    } catch (error) {
                        console.error(`Ошибка в условии WHERE:`, error);
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
        const newDataReport = filterDataReport();

        const dataForm = {
            format: selectedExtension,
            name,
            headers: customWhereColumns,
            data: newDataReport.length > 0 ? newDataReport : dataReport
        };

        fetch(`${API_URL}/api/report/export/${currentReportId}/preview`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${bearerToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataForm),
        })
            .then(res => res.blob())
            .then(blob => {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${name}.${selectedExtension}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error("Error while generating preview:", error);
                toast.error("Ошибка при создании предпросмотра", { position: "top-right" });
            });
    };

    const handleChangeToReport = () => {
        const bearerToken = localStorage.getItem('api_token');

        filterDataReport();

        const updatedColumns = [...customWhereColumns];

        updatedColumns.forEach((column, iCol) => {
            if (column.fx) {
                if (column.fx.includes('yearsOfExperience')) {
                    const dateColumnIndex = customWhereColumns.findIndex(col => col.type === "date");

                    if (dateColumnIndex !== -1) {
                        const updatedReport = [...dataReport];

                        updatedReport.forEach((record) => {
                            try {
                                const dateStartValue = record[dateColumnIndex]; // Предположим, что это дата контракта

                                if (dateStartValue) {
                                    const currentDate = new Date();
                                    const startDate = new Date(dateStartValue);
                                    const yearsOfExperience = currentDate.getFullYear() - startDate.getFullYear();

                                    // Вычисляем стаж
                                    record[iCol] = yearsOfExperience > 0 ? yearsOfExperience : 0;
                                }
                            } catch (error) {
                                console.error(`Ошибка при вычислении стажа для записи:`, error);
                            }
                        });

                        setDataReport(updatedReport);
                    } else {
                        console.warn('Не удается найти столбец с датой.');
                    }
                }
            }
        });

        const dataForm = {
            id: currentReportId,
            category_id: selectedCategory,
            name,
            extension: selectedExtension,
            headers: updatedColumns,
            whereData: newDataReport.length > 0 ? newDataReport : dataReport,
        };

        console.log('Обновленные данные отчета:', dataForm);

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
                    toast.success("Отчет успешно обновлен", { position: "top-right" });
                } else {
                    toast.error(`Ошибка: ${JSON.stringify(data)}`, { position: "top-right" });
                }
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
                                                <input
                                                    type="text"
                                                    className={styles.inpt_js}
                                                    value={column.fx ?? ''}
                                                    onChange={(e) => {
                                                        handleColumnChange(index, "fx", e.target.value);
                                                    }}
                                                    placeholder='Пример: [professiya] == "Web-разработчик" ? "Да" : "Нет"'
                                                    title="Формат: [поле] оператор 'значение' ? 'если_да' : 'если_нет'"
                                                    onDoubleClick={() => navigator.clipboard.writeText(`[${column.name}]`)}
                                                />
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

            <button onClick={handleChangeToReport} className={styles.addToReportBtn}>Изменить отчет</button>
        </div>
    );
};

export default ReportCreation;
