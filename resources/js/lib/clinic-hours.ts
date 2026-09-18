import { useEffect, useState } from 'react';

export interface ClinicHoursSettings {
    timezone: string;
    opensAt: string;
    closesAt: string;
    workingDays: string[];
    serverNow: string;
}

export function useClinicHours(hours: ClinicHoursSettings) {
    const [clock, setClock] = useState(() => ({
        serverTime: new Date(hours.serverNow).getTime(),
        localTime: Date.now(),
    }));
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const timer = window.setInterval(
            () => setTick((value) => value + 1),
            15_000,
        );
        return () => window.clearInterval(timer);
    }, []);

    useEffect(() => {
        setClock({
            serverTime: new Date(hours.serverNow).getTime(),
            localTime: Date.now(),
        });
    }, [hours.serverNow]);

    const current = new Date(clock.serverTime + Date.now() - clock.localTime);
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: hours.timezone,
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
    const workingDay = hours.workingDays.includes(
        part('weekday').toLowerCase(),
    );
    const isOpen = workingDay && time >= hours.opensAt && time < hours.closesAt;
    const earliestBookableDate =
        time >= hours.closesAt ? new Date(`${today}T12:00:00Z`) : null;
    if (earliestBookableDate)
        earliestBookableDate.setUTCDate(earliestBookableDate.getUTCDate() + 1);
    const minDate = earliestBookableDate
        ? earliestBookableDate.toISOString().slice(0, 10)
        : today;

    void tick;
    return { today, time, minDate, isOpen };
}
