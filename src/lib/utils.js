// Генерация сетки строго для 2026 года (с 1 января по 31 декабря)
export function generateYearGrid(year = 2026) {
    const days = [];
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        // Собираем дату вручную в формат YYYY-MM-DD
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');

        days.push({
            date: `${yyyy}-${mm}-${dd}`,
            completed: 0
        });
    }
    return days;
}

// Логика цветов на основе достигнутой цели с учетом даты создания аккаунта
export function getContributionColor(completed, goal, dateStr) {
    const launchDate = '2026-06-28';

    // Если день идет ДО создания аккаунта — красим в нейтральный серый (прочерк)
    if (dateStr < launchDate) {
        return 'bg-gray-800 opacity-40 cursor-default';
    }

    // Для дней начиная с 28 июня включается обычная цветная логика
    if (completed === 0) return 'bg-[#a63d40]'; // Красный (цель не начата)
    if (completed > 0 && completed < goal) return 'bg-[#d18b47]'; // Оранжевый (меньше цели)

    if (completed >= goal) {
        const overflow = completed - goal;
        if (overflow === 0) return 'bg-[#2d6a4f]'; // Цель выполнена
        if (overflow <= 2) return 'bg-[#40916c]';  // Перевыполнена слегка
        if (overflow <= 5) return 'bg-[#52b788]';  // Отличный результат
        return 'bg-[#74c69d]';                     // Максимум
    }

    return 'bg-bgSec';
}