import { usePage } from '@inertiajs/react';
import { useClinicHours, type ClinicHoursSettings } from '@/lib/clinic-hours';

export function ClinicStatus() {
    const { clinicHours } = usePage<{ clinicHours: ClinicHoursSettings }>()
        .props;
    const { isOpen } = useClinicHours(clinicHours);

    return (
        <span
            role="status"
            aria-live="polite"
            aria-label={`Clinic ${isOpen ? 'open' : 'closed'} now`}
            title="Clinic hours: Monday–Friday, 8:00 AM–5:00 PM (Manila time)"
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-xs font-semibold ${
                isOpen
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                    : 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200'
            }`}
        >
            <span
                className={`size-2 rounded-full ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
            <span className="hidden sm:inline">Clinic</span>
            {isOpen ? 'Open' : 'Closed'}
        </span>
    );
}
