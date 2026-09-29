import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { useClinicHours } from '@/lib/clinic-hours';
import type { ClinicHoursSettings } from '@/lib/clinic-hours';
import { cn } from '@/lib/utils';

export function ClinicStatusLogo({
    children,
    className,
    labelClassName,
}: {
    children: ReactNode;
    className?: string;
    labelClassName?: string;
}) {
    const { clinicHours } = usePage<{ clinicHours: ClinicHoursSettings }>()
        .props;
    const { isOpen } = useClinicHours(clinicHours);
    const label = isOpen ? 'Open Now' : 'Closed Now';

    return (
        <span
            role="status"
            aria-label={`Clinic ${label.toLowerCase()}`}
            title={`Clinic ${label.toLowerCase()}`}
            className={cn(
                'relative inline-flex shrink-0 items-center justify-center rounded-xl border-2 bg-moss-100 shadow-sm',
                isOpen ? 'border-emerald-500' : 'border-rose-500',
                className,
            )}
        >
            {children}
            <span
                className={cn(
                    'absolute -bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full border bg-card px-1.5 py-0.5 text-[7px] leading-none font-extrabold whitespace-nowrap uppercase shadow-sm',
                    isOpen
                        ? 'border-emerald-500 text-emerald-700'
                        : 'border-rose-500 text-rose-700',
                    labelClassName,
                )}
            >
                {label}
            </span>
        </span>
    );
}
