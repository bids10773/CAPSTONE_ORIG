import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export function DashboardClinicBadge({
    icon: Icon,
    children,
}: {
    icon: LucideIcon;
    children: ReactNode;
}) {
    return (
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-bold tracking-[0.16em] text-moss-100 uppercase">
            <Icon className="size-4 shrink-0" />
            {children}
        </span>
    );
}
