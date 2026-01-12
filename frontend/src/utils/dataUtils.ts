import { MONTHS } from './constants';
import type { Month } from './constants';

export interface WealthEntry {
    id?: string;
    month: Month;
    year: number;
    values: Record<string, number>;
    isEstimate?: boolean;
    // For convenience in calculations
    total?: number;
    cash?: number;
    investment?: number;
    pension?: number;
}

import { type WealthSource } from '../api';

export const getDefaultColor = (index: number) => {
    const colors = [
        '#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#EC4899', '#06B6D4', '#F97316', '#14B8A6', '#64748B'
    ];
    return colors[index % colors.length];
};

export const sortSources = (sources: WealthSource[]) => {
    return [...sources].sort((a, b) => {
        const categoryOrder = { cash: 0, investment: 1, pension: 2 };
        const orderA = categoryOrder[a.category] ?? 3;
        const orderB = categoryOrder[b.category] ?? 3;
        if (orderA !== orderB) return orderA - orderB;
        return a.name.localeCompare(b.name);
    });
};

export type ViewMode = 'monthly' | 'quarterly' | 'yearly';

export const processWealthData = (data: WealthEntry[], sources: WealthSource[], mode: ViewMode = 'monthly'): WealthEntry[] => {
    if (data.length === 0) return [];

    // Sort data chronologically
    const sortedData = [...data].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return MONTHS.indexOf(a.month) - MONTHS.indexOf(b.month);
    });

    // Helper to calculate aggregations for an entry
    const aggregateEntry = (entry: WealthEntry): WealthEntry => {
        let cash = 0;
        let investment = 0;
        let pension = 0;

        Object.entries(entry.values || {}).forEach(([sourceId, value]) => {
            const source = sources.find(s => s.id === sourceId);
            if (source) {
                if (source.category === 'cash') cash += value;
                else if (source.category === 'investment') investment += value;
                else if (source.category === 'pension') pension += value;
            }
        });

        return {
            ...entry,
            cash,
            investment,
            pension,
            total: cash + investment + pension
        };
    };

    const latestData = sortedData.length > 0 ? sortedData[sortedData.length - 1] : null;
    const result: WealthEntry[] = [];

    // Determine window end based on current real date
    const now = new Date();
    const currentRealMonthIdx = now.getMonth();
    const currentRealYear = now.getFullYear();

    // Helper to get Financial Quarter info
    // Q1: Apr-Jun, Q2: Jul-Sep, Q3: Oct-Dec, Q4: Jan-Mar
    const getFinancialQuarter = (monthIdx: number, year: number) => {
        if (monthIdx >= 3 && monthIdx <= 5) return { q: 1, year }; // Apr-Jun
        if (monthIdx >= 6 && monthIdx <= 8) return { q: 2, year }; // Jul-Sep
        if (monthIdx >= 9 && monthIdx <= 11) return { q: 3, year }; // Oct-Dec
        return { q: 4, year: monthIdx <= 2 ? year - 1 : year }; // Jan-Mar (belongs to prev year's financial cycle)
    };

    // Generalized helper to process a target label (month/year or custom label)
    const processLabel = (
        existing: WealthEntry | undefined | null,
        monthLabel: string,
        year: number,
        isCustomLabel = false
    ) => {
        if (existing) {
            const aggregated = aggregateEntry(existing);
            result.push({
                ...aggregated,
                month: (isCustomLabel ? monthLabel : existing.month) as Month, // Override if custom label
                year: year || existing.year,
                isEstimate: false
            });
        } else {
            // Gap filling
            const lastKnown = result.length > 0 ? result[result.length - 1] : null;

            if (lastKnown && lastKnown.total !== undefined) {
                result.push({
                    ...lastKnown,
                    month: monthLabel as Month,
                    year: year,
                    isEstimate: true
                });
            } else {
                // Search before window in sortedData
                const beforeWindow = [...sortedData].reverse().find(d => {
                    if (isCustomLabel) return true;
                    return d.year < year || (d.year === year && MONTHS.indexOf(d.month) < MONTHS.indexOf(monthLabel as Month));
                });

                const fallback = beforeWindow || sortedData[sortedData.length - 1];

                if (fallback) {
                    const aggregated = aggregateEntry(fallback);
                    result.push({
                        ...aggregated,
                        month: monthLabel as Month,
                        year: year,
                        isEstimate: true
                    });
                } else {
                    result.push({
                        month: monthLabel as Month,
                        year: year,
                        values: {},
                        cash: 0,
                        investment: 0,
                        pension: 0,
                        total: 0,
                        isEstimate: true
                    });
                }
            }
        }
    };

    if (mode === 'monthly') {
        let endMonthIdx = currentRealMonthIdx;
        let endYear = currentRealYear;

        if (latestData) {
            const latestIdx = MONTHS.indexOf(latestData.month);
            if (latestData.year > endYear || (latestData.year === endYear && latestIdx > endMonthIdx)) {
                endMonthIdx = latestIdx;
                endYear = latestData.year;
            }
        }

        // Generate 12 labels (trailing 11 months + current target)
        let currentMonthIdx = endMonthIdx;
        let currentYear = endYear;

        const targetLabels: { month: Month, year: number }[] = [];
        for (let i = 0; i < 12; i++) {
            targetLabels.unshift({ month: MONTHS[currentMonthIdx], year: currentYear });
            currentMonthIdx--;
            if (currentMonthIdx < 0) {
                currentMonthIdx = 11;
                currentYear--;
            }
        }

        targetLabels.forEach(label => {
            const existing = sortedData.find(d => d.month === label.month && d.year === label.year);
            processLabel(existing, label.month, label.year);
        });

    } else if (mode === 'quarterly') {
        // Show last 8 quarters (2 years)
        const fq = getFinancialQuarter(currentRealMonthIdx, currentRealYear);
        let targetQ = fq.q;
        let targetFY = fq.year;

        if (latestData) {
            const lIdx = MONTHS.indexOf(latestData.month);
            const lFq = getFinancialQuarter(lIdx, latestData.year);
            if (lFq.year > targetFY || (lFq.year === targetFY && lFq.q > targetQ)) {
                targetQ = lFq.q;
                targetFY = lFq.year;
            }
        }

        const quarters = [];
        for (let i = 0; i < 8; i++) {
            quarters.unshift({ q: targetQ, fy: targetFY });
            targetQ--;
            if (targetQ < 1) {
                targetQ = 4;
                targetFY--;
            }
        }

        quarters.forEach(q => {
            const qMonths = q.q === 4
                ? [{ m: 0, y: q.fy + 1 }, { m: 1, y: q.fy + 1 }, { m: 2, y: q.fy + 1 }]
                : [{ m: (q.q - 1) * 3 + 3, y: q.fy }, { m: (q.q - 1) * 3 + 4, y: q.fy }, { m: (q.q - 1) * 3 + 5, y: q.fy }];

            let match = null;
            for (let i = 2; i >= 0; i--) {
                const search = qMonths[i];
                const found = sortedData.find(d => MONTHS.indexOf(d.month) === search.m && d.year === search.y);
                if (found) {
                    match = found;
                    break;
                }
            }

            const labelStr = `Q${q.q} FY${q.fy.toString().slice(-2)}`;
            const calendarYear = q.q === 4 ? q.fy + 1 : q.fy;
            processLabel(match, labelStr, calendarYear, true);
        });

    } else if (mode === 'yearly') {
        // Show last 5 Financial Years
        let targetFY = getFinancialQuarter(currentRealMonthIdx, currentRealYear).year;

        if (latestData) {
            const lFq = getFinancialQuarter(MONTHS.indexOf(latestData.month), latestData.year);
            if (lFq.year > targetFY) targetFY = lFq.year;
        }

        const years = [];
        for (let i = 0; i < 5; i++) {
            years.unshift(targetFY - i);
        }

        years.forEach(fy => {
            const candidates = sortedData.filter(d => {
                const mIndex = MONTHS.indexOf(d.month);
                if (d.year === fy + 1 && mIndex <= 2) return true; // Jan-Mar next year
                if (d.year === fy && mIndex >= 3) return true; // Apr-Dec this year
                return false;
            });

            const match = candidates.length > 0 ? candidates[candidates.length - 1] : null;
            processLabel(match, `FY${fy.toString().slice(-2)}/${(fy + 1).toString().slice(-2)}`, fy + 1, true);
        });
    }

    // FILTER: Remove any entries strictly before the earliest recorded data
    if (sortedData.length > 0) {
        const earliest = sortedData[0];
        const earliestTime = earliest.year * 12 + MONTHS.indexOf(earliest.month);

        return result.filter(d => {
            let entryTime = 0;
            if (mode === 'monthly') {
                entryTime = d.year * 12 + MONTHS.indexOf(d.month as Month);
            } else if (mode === 'quarterly') {
                const qMatch = d.month.match(/Q(\d)/);
                const q = qMatch ? parseInt(qMatch[1]) : 4;
                const endMonthMap: Record<number, number> = { 1: 5, 2: 8, 3: 11, 4: 2 };
                entryTime = d.year * 12 + endMonthMap[q];
            } else if (mode === 'yearly') {
                entryTime = d.year * 12 + 2; // Ends Mar of d.year (which is next year of FY start)
            }

            // Show if the period ends on or after the earliest data
            return entryTime >= earliestTime;
        });
    }

    return result;
};

export type ProjectionTimeline = 'monthly' | 'quarterly' | 'yearly';

export interface ProjectionEntry {
    label: string;
    value: number;
    isProjection: boolean;
}

/**
 * Calculate future wealth projections based on historical trend.
 * Uses a simple linear average of monthly changes.
 */
export const calculateProjections = (
    data: WealthEntry[],
    sources: WealthSource[],
    timeline: ProjectionTimeline,
    sourceId?: string // undefined = total wealth
): ProjectionEntry[] => {
    if (data.length === 0) return [];

    // Process the raw data to get aggregated totals
    const processed = processWealthData(data, sources, 'monthly');
    const actualData = processed.filter(e => !e.isEstimate);

    if (actualData.length === 0) return [];

    // Get the value for a specific entry
    const getValue = (entry: WealthEntry): number => {
        if (sourceId) {
            return entry.values?.[sourceId] || 0;
        }
        return entry.total || 0;
    };

    // Calculate average monthly growth from actual data
    let totalGrowth = 0;
    let growthCount = 0;
    for (let i = 1; i < actualData.length; i++) {
        const prev = getValue(actualData[i - 1]);
        const curr = getValue(actualData[i]);
        totalGrowth += curr - prev;
        growthCount++;
    }
    const avgMonthlyGrowth = growthCount > 0 ? totalGrowth / growthCount : 0;

    const now = new Date();
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    const result: ProjectionEntry[] = [];
    const latestValue = getValue(actualData[actualData.length - 1]);
    const latestEntry = actualData[actualData.length - 1];
    const latestMonthIdx = MONTHS.indexOf(latestEntry.month);
    const latestYear = latestEntry.year;

    if (timeline === 'monthly') {
        // -2 months history + current + 12 months future
        let startMonthIdx = currentMonthIdx - 2;
        let startYear = currentYear;
        if (startMonthIdx < 0) {
            startMonthIdx += 12;
            startYear--;
        }

        for (let i = 0; i < 15; i++) { // 2 past + 1 current + 12 future
            let mIdx = startMonthIdx + i;
            let y = startYear;
            while (mIdx > 11) { mIdx -= 12; y++; }

            const label = `${MONTHS[mIdx]} '${y.toString().slice(-2)}`;
            const isCurrentOrPast = y < currentYear || (y === currentYear && mIdx <= currentMonthIdx);

            // Try to find actual data
            const found = processed.find(d => MONTHS.indexOf(d.month) === mIdx && d.year === y && !d.isEstimate);
            if (found) {
                result.push({ label, value: getValue(found), isProjection: false });
            } else if (isCurrentOrPast) {
                // Forward fill from last known
                const lastKnown = result.length > 0 ? result[result.length - 1].value : latestValue;
                result.push({ label, value: lastKnown, isProjection: false });
            } else {
                // Calculate projection
                const monthsFromLatest = (y - latestYear) * 12 + (mIdx - latestMonthIdx);
                const projected = latestValue + (avgMonthlyGrowth * monthsFromLatest);
                result.push({ label, value: Math.max(0, projected), isProjection: true });
            }
        }
    } else if (timeline === 'quarterly') {
        // -1 quarter history + current + 5 years future (20 quarters)
        const getQuarter = (mIdx: number) => Math.floor(mIdx / 3) + 1;
        const currentQ = getQuarter(currentMonthIdx);

        let startQ = currentQ - 1;
        let startY = currentYear;
        if (startQ < 1) { startQ = 4; startY--; }

        for (let i = 0; i < 22; i++) { // 1 past + 1 current + 20 future
            let q = startQ + i;
            let y = startY;
            while (q > 4) { q -= 4; y++; }

            const label = `Q${q} '${y.toString().slice(-2)}`;
            const qEndMonth = q * 3 - 1; // Q1->2 (Mar), Q2->5 (Jun), etc
            const isCurrentOrPast = y < currentYear || (y === currentYear && qEndMonth <= currentMonthIdx);

            if (isCurrentOrPast) {
                // Find last month of quarter in actual data
                const qMonths = [q * 3 - 3, q * 3 - 2, q * 3 - 1];
                let found = null;
                for (let j = 2; j >= 0; j--) {
                    const check = processed.find(d => MONTHS.indexOf(d.month) === qMonths[j] && d.year === y && !d.isEstimate);
                    if (check) { found = check; break; }
                }
                if (found) {
                    result.push({ label, value: getValue(found), isProjection: false });
                } else {
                    const lastKnown = result.length > 0 ? result[result.length - 1].value : latestValue;
                    result.push({ label, value: lastKnown, isProjection: false });
                }
            } else {
                const monthsFromLatest = (y - latestYear) * 12 + (qEndMonth - latestMonthIdx);
                const projected = latestValue + (avgMonthlyGrowth * monthsFromLatest);
                result.push({ label, value: Math.max(0, projected), isProjection: true });
            }
        }
    } else if (timeline === 'yearly') {
        // -1 year history + current + 10 years future
        for (let i = -1; i <= 10; i++) {
            const y = currentYear + i;
            const label = `${y}`;
            const isCurrentOrPast = y <= currentYear;

            if (isCurrentOrPast) {
                // Find Dec of that year (or latest if current year)
                const targetMonth = y === currentYear ? currentMonthIdx : 11;
                let found = null;
                for (let mIdx = targetMonth; mIdx >= 0; mIdx--) {
                    const check = processed.find(d => MONTHS.indexOf(d.month) === mIdx && d.year === y && !d.isEstimate);
                    if (check) { found = check; break; }
                }
                if (found) {
                    result.push({ label, value: getValue(found), isProjection: false });
                } else {
                    const lastKnown = result.length > 0 ? result[result.length - 1].value : latestValue;
                    result.push({ label, value: lastKnown, isProjection: false });
                }
            } else {
                const monthsFromLatest = (y - latestYear) * 12 + (11 - latestMonthIdx); // Project to Dec
                const projected = latestValue + (avgMonthlyGrowth * monthsFromLatest);
                result.push({ label, value: Math.max(0, projected), isProjection: true });
            }
        }
    }

    return result;
};
