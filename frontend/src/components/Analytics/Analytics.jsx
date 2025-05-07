import { useState, useEffect } from "react";
import styles from "./Analytics.module.sass";
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LogarithmicScale } from 'chart.js';
import zoomPlugin from 'chartjs-plugin-zoom';

import jsPDF from "jspdf";
import PptxGenJS from "pptxgenjs";
import html2canvas from "html2canvas";

const API_URL = import.meta.env.VITE_API_URL;

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    zoomPlugin,
    LogarithmicScale
);

const Analytics = () => {
    const [reports, setReports] = useState([]);
    const [selectedReports, setSelectedReports] = useState([]);
    const [localColumns, setLocalColumns] = useState([]);
    const [textColumns, setTextColumns] = useState([]);
    const [displayedColumns, setDisplayedColumns] = useState([]);
    const [displayedTextColumns, setDisplayedTextColumns] = useState([]);
    const [chartDatasets, setChartDatasets] = useState([]);
    const [textChartDatasets, setTextChartDatasets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [chartType, setChartType] = useState("bar");
    const [yAxisType, setYAxisType] = useState("linear");
    const [fullscreenChart, setFullscreenChart] = useState(null);

    const handleChartTypeChange = (event) => {
        setChartType(event.target.value);
    };

    const handleYAxisTypeChange = (event) => {
        setYAxisType(event.target.value);
    };

    const openFullscreenChart = (chartData, isTextChart = false) => {
        setFullscreenChart({ data: chartData, isTextChart });
    };

    const closeFullscreenChart = () => {
        setFullscreenChart(null);
    };

    useEffect(() => {
        const fetchReports = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch(`${API_URL}/api/report/list`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    },
                });
                const data = await response.json();

                if (response.ok && data.success) {
                    const filteredReports = data.data.filter(report => !report.isDeleted);

                    const formattedReports = filteredReports.map((report) => ({
                        id: report.id,
                        name: report.name,
                        headers: report.headers || [],
                        data: report.data || [],
                    }));

                    setReports(formattedReports);
                } else {
                    setError(data.message || "Не удалось загрузить отчёты.");
                }
            } catch (error) {
                setError("Ошибка при получении отчётов: " + error);
            } finally {
                setLoading(false);
            }
        };
        fetchReports();
    }, []);

    useEffect(() => {
        if (selectedReports.length > 0) {
            const report = selectedReports[0];

            setLocalColumns([]);
            setTextColumns([]);
            setDisplayedColumns([]);
            setDisplayedTextColumns([]);

            const numericColumns = [];
            const textColumns = [];

            // Проверяем все возможные колонки (из headers и из данных)
            const allPossibleColumns = new Set();

            // Добавляем колонки из headers
            report.headers.forEach(header => {
                allPossibleColumns.add(header.name);
            });

            // Добавляем колонки из данных (для новых колонок)
            report.data.forEach(row => {
                Object.keys(row).forEach(key => {
                    if (!isNaN(key)) return; // Пропускаем числовые индексы
                    allPossibleColumns.add(key);
                });
            });

            // Проверяем тип данных для каждой колонки
            Array.from(allPossibleColumns).forEach(columnName => {
                let isNumeric = false;

                // Пытаемся найти колонку в headers
                const headerIndex = report.headers.findIndex(h => h.name === columnName);

                if (headerIndex !== -1) {
                    // Колонка есть в headers, проверяем данные
                    isNumeric = report.data.some(item => {
                        const numValue = Number(item[headerIndex]);
                        return !isNaN(numValue) && item[headerIndex] !== null && item[headerIndex] !== '';
                    });
                } else {
                    // Новая колонка, проверяем данные по имени
                    isNumeric = report.data.some(item => {
                        const value = item[columnName];
                        if (value === undefined || value === null) return false;
                        const numValue = Number(value);
                        return !isNaN(numValue) && value !== '';
                    });
                }

                if (isNumeric) {
                    numericColumns.push(columnName);
                } else {
                    textColumns.push(columnName);
                }
            });

            setLocalColumns(numericColumns);
            setTextColumns(textColumns);
            setDisplayedColumns(numericColumns.slice(0, Math.min(3, numericColumns.length)));
            if (textColumns.length > 0) {
                setDisplayedTextColumns([textColumns[0]]);
            }
        }
    }, [selectedReports]);

    useEffect(() => {
        if (selectedReports.length > 0 && displayedColumns.length > 0) {
            const newChartDatasets = selectedReports.map((report) => {
                // Первая колонка всегда будет labels
                const labels = report.data.map(item => {
                    // Пытаемся получить первый столбец из headers или по индексу 0
                    if (report.headers.length > 0) {
                        return item[0] || '';
                    }
                    return '';
                });

                const datasets = displayedColumns.map((column, index) => {
                    // Пытаемся найти индекс колонки в headers
                    const headerIndex = report.headers.findIndex(header => header.name === column);

                    let data;
                    if (headerIndex !== -1) {
                        // Колонка есть в headers, берем данные по индексу
                        data = report.data.map(item => {
                            const value = item[headerIndex];
                            return value !== null && value !== '' ? Number(value) : null;
                        }).filter(val => val !== null);
                    } else {
                        // Новая колонка, ищем данные по имени
                        data = report.data.map(item => {
                            const value = item[column];
                            return value !== null && value !== '' && value !== undefined ? Number(value) : null;
                        }).filter(val => val !== null);
                    }

                    return {
                        label: column,
                        data,
                        backgroundColor: `rgba(${(index * 100 + 50) % 255}, ${(index * 150 + 50) % 255}, ${(index * 200 + 50) % 255}, 0.8)`,
                        borderColor: `rgba(${(index * 100 + 50) % 255}, ${(index * 150 + 50) % 255}, ${(index * 200 + 50) % 255}, 1)`,
                        borderWidth: 1,
                    };
                });

                return { labels, datasets };
            });
            setChartDatasets(newChartDatasets);
        }

        if (textColumns.length > 0 && displayedTextColumns.length > 0) {
            const newTextChartDatasets = selectedReports.flatMap(report => {
                return displayedTextColumns.map(column => {
                    const textCount = {};

                    // Пытаемся найти индекс колонки в headers
                    const headerIndex = report.headers.findIndex(header => header.name === column);

                    report.data.forEach(item => {
                        let textValue;
                        if (headerIndex !== -1) {
                            textValue = item[headerIndex];
                        } else {
                            // Новая колонка, ищем по имени
                            textValue = item[column];
                        }

                        if (typeof textValue === 'string' || (textValue !== null && textValue !== undefined)) {
                            const strValue = String(textValue);
                            textCount[strValue] = (textCount[strValue] || 0) + 1;
                        }
                    });

                    const textLabels = Object.keys(textCount);
                    const textValues = Object.values(textCount);

                    return {
                        labels: textLabels,
                        datasets: [{
                            label: `Текстовые данные из ${column}`,
                            data: textValues,
                            backgroundColor: textLabels.map((_, index) => `rgba(${(index * 100 + 50) % 255}, ${(index * 150 + 50) % 255}, ${(index * 200 + 50) % 255}, 0.8)`),
                            borderColor: textLabels.map((_, index) => `rgba(${(index * 100 + 50) % 255}, ${(index * 150 + 50) % 255}, ${(index * 200 + 50) % 255}, 1)`),
                            borderWidth: 1,
                        }]
                    };
                });
            });

            setTextChartDatasets(newTextChartDatasets);
        }
    }, [selectedReports, displayedColumns, displayedTextColumns]);

    const handleSelectReport = async (reportId) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/api/report/${reportId}`, {
                method: 'GET',
                headers: {
                    'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                },
            });
            const data = await response.json();
            if (response.ok && data.success) {
                const report = {
                    id: data.data.id,
                    name: data.data.name,
                    headers: data.data.headers || [],
                    data: data.data.data || [],
                };
                setSelectedReports([report]);
            } else {
                setError(data.message || "Не удалось загрузить отчёт.");
            }
        } catch (error) {
            setError("Ошибка при получении отчёта: " + error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleColumn = (columnName) => {
        setDisplayedColumns(prevColumns =>
            prevColumns.includes(columnName)
                ? prevColumns.filter(col => col !== columnName)
                : [...prevColumns, columnName]
        );
    };

    const handleToggleTextColumn = (columnName) => {
        setDisplayedTextColumns(prevColumns =>
            prevColumns.includes(columnName)
                ? prevColumns.filter(col => col !== columnName)
                : [...prevColumns, columnName]
        );
    };

    const handleDownloadChart = async (format) => {
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) return;

        if (format === 'png') {
            const canvas = await html2canvas(chartContainer);
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'chart.png';
            link.click();
        } else if (format === 'pdf') {
            const canvas = await html2canvas(chartContainer);
            const pdf = new jsPDF();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 180, 160);
            pdf.save('chart.pdf');
        } else if (format === 'pptx') {
            const pptx = new PptxGenJS();
            const slide = pptx.addSlide();
            const canvas = await html2canvas(chartContainer);
            slide.addImage({ data: canvas.toDataURL('image/png'), x: 0.5, y: 0.5, w: 8, h: 5 });
            pptx.writeFile({ fileName: 'chart.pptx' });
        }
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                type: yAxisType,
            },
        },
        plugins: {
            zoom: {
                wheel: {
                    enabled: true,
                    speed: 0.1,
                },
                drag: {
                    enabled: true,
                },
                pinch: {
                    enabled: true,
                },
            },
        },
    };

    return (
        <div className={styles.container}>
            {fullscreenChart && (
                <div className={styles.fullscreenModal} onClick={closeFullscreenChart}>
                    <div className={styles.fullscreenContent} onClick={e => e.stopPropagation()}>
                        <button className={styles.closeButton} onClick={closeFullscreenChart}>×</button>
                        {chartType === "bar" && !fullscreenChart.isTextChart ? (
                            <Bar
                                data={fullscreenChart.data}
                                options={{
                                    ...chartOptions,
                                    maintainAspectRatio: true,
                                    responsive: true
                                }}
                                width={800}
                                height={600}
                            />
                        ) : (
                            <Doughnut
                                data={fullscreenChart.data}
                                options={{
                                    ...chartOptions,
                                    maintainAspectRatio: true,
                                    responsive: true
                                }}
                                width={800}
                                height={600}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className={styles.reportSelection}>
                <label className={styles.label}>Выберите отчет:</label>
                <select
                    onChange={(e) => handleSelectReport(Number(e.target.value))}
                    defaultValue=""
                    className={styles.select}
                >
                    <option value="" disabled>Выберите отчет</option>
                    {reports.filter(report => !report.isDeleted).map((report) => (
                        <option key={report.id} value={report.id}>{report.name}</option>
                    ))}
                </select>
            </div>

            {loading && <div className={styles.loading}>Загрузка...</div>}
            {error && <div className={styles.error}>{error}</div>}

            {selectedReports.length > 0 && (
                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <h3 className={styles.controlTitle}>Выберите тип диаграммы:</h3>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioContainer}>
                                <input
                                    type="radio"
                                    value="bar"
                                    checked={chartType === "bar"}
                                    onChange={handleChartTypeChange}
                                    className={styles.radioInput}
                                />
                                <span className={styles.radioLabel}>Бар</span>
                            </label>
                            <label className={styles.radioContainer}>
                                <input
                                    type="radio"
                                    value="doughnut"
                                    checked={chartType === "doughnut"}
                                    onChange={handleChartTypeChange}
                                    className={styles.radioInput}
                                />
                                <span className={styles.radioLabel}>Круговая</span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.controlGroup}>
                        <h3 className={styles.controlTitle}>Выберите тип шкалы для оси Y:</h3>
                        <div className={styles.radioGroup}>
                            <label className={styles.radioContainer}>
                                <input
                                    type="radio"
                                    value="linear"
                                    checked={yAxisType === "linear"}
                                    onChange={handleYAxisTypeChange}
                                    className={styles.radioInput}
                                />
                                <span className={styles.radioLabel}>Линейная</span>
                            </label>
                            <label className={styles.radioContainer}>
                                <input
                                    type="radio"
                                    value="logarithmic"
                                    checked={yAxisType === "logarithmic"}
                                    onChange={handleYAxisTypeChange}
                                    className={styles.radioInput}
                                />
                                <span className={styles.radioLabel}>Логарифмическая</span>
                            </label>
                        </div>
                    </div>

                    <div className={styles.controlGroup}>
                        <h3 className={styles.controlTitle}>Выберите числовые столбцы:</h3>
                        <div className={styles.columnsContainer}>
                            {localColumns.map((column) => (
                                <button
                                    key={column}
                                    className={`${styles.columnButton} ${displayedColumns.includes(column) ? styles.selected : ''}`}
                                    onClick={() => handleToggleColumn(column)}
                                >
                                    {column} {displayedColumns.includes(column) ? '✓' : ''}
                                </button>
                            ))}
                        </div>
                    </div>

                    {textColumns.length > 0 && (
                        <div className={styles.controlGroup}>
                            <h3 className={styles.controlTitle}>Выберите текстовые столбцы:</h3>
                            <div className={styles.columnsContainer}>
                                {textColumns.map((column) => (
                                    <button
                                        key={column}
                                        className={`${styles.columnButton} ${displayedTextColumns.includes(column) ? styles.selected : ''}`}
                                        onClick={() => handleToggleTextColumn(column)}
                                    >
                                        {column} {displayedTextColumns.includes(column) ? '✓' : ''}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div id="chartContainer" className={styles.chartContainer}>
                {chartDatasets.map((chartData, index) => (
                    <div
                        key={`chart-${index}`}
                        className={styles.chartWrapper}
                        onClick={() => openFullscreenChart(chartData)}
                    >
                        <h4 className={styles.chartTitle}>График данных</h4>
                        <div className={styles.chart}>
                            {chartType === "bar" ? (
                                <Bar data={chartData} options={chartOptions} />
                            ) : (
                                <Doughnut data={chartData} options={chartOptions} />
                            )}
                        </div>
                    </div>
                ))}
                {textChartDatasets.map((chartData, index) => (
                    <div
                        key={`text-chart-${index}`}
                        className={styles.chartWrapper}
                        onClick={() => openFullscreenChart(chartData, true)}
                    >
                        <h4 className={styles.chartTitle}>График текстовых данных</h4>
                        <div className={styles.chart}>
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                    </div>
                ))}
            </div>

            {(chartDatasets.length > 0 || textChartDatasets.length > 0) && (
                <div className={styles.downloadButtons}>
                    <button
                        onClick={() => handleDownloadChart('png')}
                    >
                        Скачать PNG
                    </button>
                    <button
                        onClick={() => handleDownloadChart('pdf')}
                    >
                        Скачать PDF
                    </button>
                    <button
                        onClick={() => handleDownloadChart('pptx')}
                    >
                        Скачать PPTX
                    </button>
                </div>
            )}
        </div>
    );
};

export default Analytics;