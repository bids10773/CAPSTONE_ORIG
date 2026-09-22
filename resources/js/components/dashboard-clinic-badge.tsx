import { usePage } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { useClinicHours } from '@/lib/clinic-hours';
import type { ClinicHoursSettings } from '@/lib/clinic-hours';

export function DashboardClinicBadge({
    icon: Icon,
    children,
}: {
    icon: LucideIcon;
    children: ReactNode;
}) {
    const { clinicHours } = usePage<{ clinicHours: ClinicHoursSettings }>()
        .props;
    const { isOpen } = useClinicHours(clinicHours);

    return (
        <span
            role="status"
            aria-live="polite"
            className={`relative inline-flex w-fit items-center gap-2 rounded-full border-2 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.16em] text-moss-100 uppercase ${isOpen ? 'border-emerald-400' : 'border-rose-400'}`}
        >
            <Icon className="size-4 shrink-0" />
            {children}
            <span
                className={`absolute -top-2 right-4 bg-moss-800 px-1.5 text-[10px] leading-4 tracking-normal normal-case ${isOpen ? 'text-emerald-200' : 'text-rose-200'}`}
            >
                {isOpen ? 'Open now' : 'Closed now'}
            </span>
        </span>
    );
}
