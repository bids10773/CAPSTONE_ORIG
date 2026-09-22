export function formatAppointmentDate(value: string): string {
    const datePart = value.slice(0, 10);
    const date = new Date(`${datePart}T00:00:00`);

    if (Number.isNaN(date.getTime())) return 'Date unavailable';

    return new Intl.DateTimeFormat('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

export function formatAppointmentTime(value?: string | null): string {
    if (!value) return 'Time not assigned';

    const match = value.match(/(\d{1,2}):(\d{2})/);
    if (!match) return 'Time not assigned';

    const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export function formatAppointmentDateTime(
    date: string,
    startTime?: string | null,
): string {
    return `${formatAppointmentDate(date)} · ${formatAppointmentTime(startTime)}`;
}

export function formatEventDateRange(
    startDate: string,
    endDate?: string | null,
): string {
    if (!endDate) {
        return `${formatAppointmentDate(startDate)} · Duration pending clinic approval`;
    }

    if (endDate && endDate.slice(0, 10) !== startDate.slice(0, 10)) {
        return `${formatAppointmentDate(startDate)} – ${formatAppointmentDate(endDate)}`;
    }

    return `${formatAppointmentDate(startDate)} · Whole day`;
}
