/** Date helpers for financial period calculations. All dates are stored as
 * "YYYY-MM-DD" strings, which sort lexicographically in chronological order,
 * so string comparisons work fine for range filtering. */
export function pad2(n) {
    return n < 10 ? `0${n}` : `${n}`;
}
export function toDateStr(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
export function monthKey(d) {
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}
export function monthRange(monthKeyStr) {
    const [yearStr, monthStr] = monthKeyStr.split("-");
    const year = Number(yearStr);
    const month = Number(monthStr);
    const start = `${yearStr}-${monthStr}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${yearStr}-${monthStr}-${pad2(lastDay)}`;
    return { start, end };
}
export function yearRange(year) {
    return { start: `${year}-01-01`, end: `${year}-12-31` };
}
/** Returns the last `count` month keys ending at `end` (inclusive), oldest first. */
export function lastMonthKeys(end, count) {
    const keys = [];
    for (let i = count - 1; i >= 0; i--) {
        const d = new Date(end.getFullYear(), end.getMonth() - i, 1);
        keys.push(monthKey(d));
    }
    return keys;
}
/** Returns the last `count` calendar years ending at `endYear` (inclusive), oldest first. */
export function lastYears(endYear, count) {
    const years = [];
    for (let i = count - 1; i >= 0; i--) {
        years.push(endYear - i);
    }
    return years;
}
