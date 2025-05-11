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

    // Функция для преобразования значений в числа
    const convertToNumber = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return isNaN(num) ? null : num;
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
            const numericColumns = [];
            const textColumns = [];

            // Собираем все возможные колонки из заголовков
            const allColumns = report.headers.map(header => ({
                name: header.name,
                title: header.title || header.name
            }));

            // Определяем тип колонок
            allColumns.forEach(column => {
                let isNumeric = report.data.some(row => {
                    const value = row[column.name] ?? row[report.headers.findIndex(h => h.name === column.name)];
                    if (value === null || value === undefined || value === '') return false;
                    return !isNaN(Number(value));
                });

                if (isNumeric) {
                    numericColumns.push(column);
                } else {
                    textColumns.push(column);
                }
            });

            setLocalColumns(numericColumns);
            setTextColumns(textColumns);
            setDisplayedColumns(numericColumns.slice(0, Math.min(3, numericColumns.length)).map(c => c.name));
            setDisplayedTextColumns(textColumns.length > 0 ? [textColumns[0].name] : []);
        }
    }, [selectedReports]);

    // Обработка числовых данных для графиков
    useEffect(() => {
        if (selectedReports.length > 0 && displayedColumns.length > 0) {
            const newChartDatasets = selectedReports.map((report) => {
                const labels = report.data.map(item => {
                    return item[0] ?? item[report.headers[0]?.name] ?? '';
                });

                const datasets = displayedColumns.map((column, index) => {
                    const headerIndex = report.headers.findIndex(h => h.name === column);
                    const data = report.data.map(item => {
                        const value = headerIndex !== -1
                            ? item[headerIndex] ?? item[column]
                            : item[column];
                        return convertToNumber(value);
                    }).filter(val => val !== null);

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
    }, [selectedReports, displayedColumns, chartType]);

    // Обработка текстовых данных для графиков
    useEffect(() => {
        if (textColumns.length > 0 && displayedTextColumns.length > 0) {
            const newTextChartDatasets = selectedReports.flatMap(report => {
                return displayedTextColumns.map(column => {
                    const textCount = {};

                    report.data.forEach(item => {
                        const headerIndex = report.headers.findIndex(h => h.name === column);
                        const textValue = headerIndex !== -1
                            ? item[headerIndex] ?? item[column]
                            : item[column];

                        if (textValue !== null && textValue !== undefined) {
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
                            backgroundColor: textLabels.map((_, i) => `rgba(${(i * 100 + 50) % 255}, ${(i * 150 + 50) % 255}, ${(i * 200 + 50) % 255}, 0.8)`),
                            borderColor: textLabels.map((_, i) => `rgba(${(i * 100 + 50) % 255}, ${(i * 150 + 50) % 255}, ${(i * 200 + 50) % 255}, 1)`),
                            borderWidth: 1,
                        }]
                    };
                });
            });
            setTextChartDatasets(newTextChartDatasets);
        }
    }, [selectedReports, displayedTextColumns]);

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
                // Парсим заголовки столбцов
                const parsedHeaders = Array.isArray(data.data.headers)
                    ? data.data.headers.map(header => {
                        if (typeof header === 'string') {
                            return { name: header, title: header };
                        }
                        return {
                            name: header.name || header.title || '',
                            title: header.title || header.name || ''
                        };
                    })
                    : [];

                setSelectedReports([{
                    id: data.data.id,
                    name: data.data.name,
                    headers: parsedHeaders, // Используем распарсенные заголовки
                    data: data.data.data || [],
                }]);
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
        setDisplayedColumns(prev =>
            prev.includes(columnName)
                ? prev.filter(c => c !== columnName)
                : [...prev, columnName]
        );
    };

    const handleToggleTextColumn = (columnName) => {
        setDisplayedTextColumns(prev =>
            prev.includes(columnName)
                ? prev.filter(c => c !== columnName)
                : [...prev, columnName]
        );
    };

    const handleDownloadChart = async (format) => {
        const chartContainer = document.getElementById('chartContainer');
        if (!chartContainer) return;

        const canvas = await html2canvas(chartContainer);

        if (format === 'png') {
            const link = document.createElement('a');
            link.href = canvas.toDataURL('image/png');
            link.download = 'chart.png';
            link.click();
        }
        else if (format === 'pdf') {
            const pdf = new jsPDF();
            pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 10, 10, 180, 160);
            pdf.save('chart.pdf');
        }
        else if (format === 'pptx') {
            const pptx = new PptxGenJS();
            const slide = pptx.addSlide();
            slide.addImage({
                data: canvas.toDataURL('image/png'),
                x: 0.5,
                y: 0.5,
                w: 8,
                h: 5
            });
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
                wheel: { enabled: true, speed: 0.1 },
                drag: { enabled: true },
                pinch: { enabled: true },
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
                                options={{ ...chartOptions, maintainAspectRatio: true }}
                                width={800}
                                height={600}
                            />
                        ) : (
                            <Doughnut
                                data={fullscreenChart.data}
                                options={{ ...chartOptions, maintainAspectRatio: true }}
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
                    {reports.filter(r => !r.isDeleted).map(report => (
                        <option key={report.id} value={report.id}>{report.name}</option>
                    ))}
                </select>
            </div>

            {loading && <div className={styles.loading}>Загрузка...</div>}
            {error && <div className={styles.error}>{error}</div>}

            {selectedReports.length > 0 && (
                <div className={styles.controls}>
                    <div className={styles.controlGroup}>
                        <h3>Тип диаграммы:</h3>
                        <div className={styles.radioGroup}>
                            <label>
                                <input
                                    type="radio"
                                    value="bar"
                                    checked={chartType === "bar"}
                                    onChange={handleChartTypeChange}
                                />
                                Бар
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="doughnut"
                                    checked={chartType === "doughnut"}
                                    onChange={handleChartTypeChange}
                                />
                                Круговая
                            </label>
                        </div>
                    </div>

                    <div className={styles.controlGroup}>
                        <h3>Тип шкалы Y:</h3>
                        <div className={styles.radioGroup}>
                            <label>
                                <input
                                    type="radio"
                                    value="linear"
                                    checked={yAxisType === "linear"}
                                    onChange={handleYAxisTypeChange}
                                />
                                Линейная
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    value="logarithmic"
                                    checked={yAxisType === "logarithmic"}
                                    onChange={handleYAxisTypeChange}
                                />
                                Логарифмическая
                            </label>
                        </div>
                    </div>

                    <div className={styles.controlGroup}>
                        <h3>Числовые столбцы:</h3>
                        <div className={styles.columnsContainer}>
                            {localColumns.map(column => (
                                <button
                                    key={column.name}
                                    className={`${styles.columnButton} ${displayedColumns.includes(column.name) ? styles.selected : ''}`}
                                    onClick={() => handleToggleColumn(column.name)}
                                    title={column.title !== column.name ? column.title : ''}
                                >
                                    {column.title} {displayedColumns.includes(column.name) ? '✓' : ''}
                                </button>
                            ))}
                        </div>
                    </div>

                    {textColumns.length > 0 && (
                        <div className={styles.controlGroup}>
                            <h3>Текстовые столбцы:</h3>
                            <div className={styles.columnsContainer}>
                                {textColumns.map(column => (
                                    <button
                                        key={column.name}
                                        className={`${styles.columnButton} ${displayedTextColumns.includes(column.name) ? styles.selected : ''}`}
                                        onClick={() => handleToggleTextColumn(column.name)}
                                        title={column.title !== column.name ? column.title : ''}
                                    >
                                        {column.title} {displayedTextColumns.includes(column.name) ? '✓' : ''}
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
                        <h4>График данных</h4>
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
                        <h4>График текстовых данных</h4>
                        <div className={styles.chart}>
                            <Doughnut data={chartData} options={chartOptions} />
                        </div>
                    </div>
                ))}
            </div>

            {(chartDatasets.length > 0 || textChartDatasets.length > 0) && (
                <div className={styles.downloadButtons}>
                    <button onClick={() => handleDownloadChart('png')}>PNG</button>
                    <button onClick={() => handleDownloadChart('pdf')}>PDF</button>
                    <button onClick={() => handleDownloadChart('pptx')}>PPTX</button>
                </div>
            )}
        </div>
    );
};

export default Analytics;