/**
 * Преобразует Excel serial number (дата в числовом формате) в объект Date
 * @param {number} serial - число из Excel (например 45490)
 * @returns {Date} дата
 */
export const excelSerialToDate = (serial) => {
    if (typeof serial !== 'number' || isNaN(serial)) return null;
    const utcDays = Math.floor(serial - 25569);
    const utcValue = utcDays * 86400;
    const date = new Date(utcValue * 1000);
    // Учитываем возможное смещение часового пояса
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

/**
 * Преобразует Excel serial number в строку с датой в нужном формате
 * @param {number} serial - число из Excel (например 45490)
 * @param {string} locale - локаль (по умолчанию 'ru-RU')
 * @returns {string} строка даты (например "01.07.2024")
 */
export const formatExcelSerialDate = (serial, locale = 'ru-RU') => {
    const date = excelSerialToDate(serial);
    return date ? date.toLocaleDateString(locale) : '';
};
