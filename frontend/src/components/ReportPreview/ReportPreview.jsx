import {useEffect, useState} from "react";
import styles from "./ReportPreview.module.sass";

const API_URL = import.meta.env.VITE_API_URL;

const ReportPreview = ({ report, onClose }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPreview = async () => {
            try {
                const response = await fetch(`${API_URL}/api/report/export/${report.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': 'Bearer ' + localStorage.getItem('api_token'),
                    },
                });

                if (response.ok) {
                    const data = await response.text();
                    setContent(data);
                } else {
                    setContent('Не удалось загрузить предпросмотр');
                }
            } catch (error) {
                console.error("Ошибка при загрузке предпросмотра:", error);
                setContent('Ошибка загрузки предпросмотра');
            } finally {
                setLoading(false);
            }
        };

        fetchPreview();
    }, [report.id]);

    return (
        <div className={styles.previewModal}>
            <div className={styles.previewContent}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h3>{report.name}</h3>
                {loading ? (
                    <div>Загрузка...</div>
                ) : (
                    <div className={styles.previewFrame} dangerouslySetInnerHTML={{ __html: content }} />
                )}
            </div>
        </div>
    );
};


export default ReportPreview;