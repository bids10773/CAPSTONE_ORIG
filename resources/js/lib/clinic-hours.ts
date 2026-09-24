import { useEffect, useState } from 'react';

export interface ClinicHoursSettings {
    timezone: string;
    opensAt: string;
    closesAt: string;
    workingDays: string[];
    serverNow: string;
}

export function useClinicHours(hours?: Partial<ClinicHoursSettings>) {
    const timezone = hours?.timezone ?? 'Asia/Manila';
    const opensAt = hours?.opensAt ?? '08:00';
    const closesAt = hours?.closesAt ?? '17:00';
    const workingDays = Array.isArray(hours?.workingDays)
        ? hours.workingDays
        : ['mon', 'tue', 'wed', 'thu', 'fri'];
    const serverNow = hours?.serverNow ?? new Date().toISOString();
    const [currentTime, setCurrentTime] = useState(() =>
        new Date(serverNow).getTime(),
    );

    useEffect(() => {
        const timer = window.setInterval(
            () => setCurrentTime((value) => value + 15_000),
            15_000,
        );
        return () => window.clearInterval(timer);
    }, []);

    const current = new Date(currentTime);
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(current);
    const part = (type: string) =>
        parts.find((item) => item.type === type)?.value ?? '';
    const today = `${part('year')}-${part('month')}-${part('day')}`;
    const time = `${part('hour')}:${part('minute')}`;
    const workingDay = workingDays.includes(part('weekday').toLowerCase());
    const isOpen = workingDay && time >= opensAt && time < closesAt;
    const earliestBookableDate =
        time >= closesAt ? new Date(`${today}T12:00:00Z`) : null;
    if (earliestBookableDate)
        earliestBookableDate.setUTCDate(earliestBookableDate.getUTCDate() + 1);
    const minDate = earliestBookableDate
        ? earliestBookableDate.toISOString().slice(0, 10)
        : today;

    return { today, time, minDate, isOpen };
}
