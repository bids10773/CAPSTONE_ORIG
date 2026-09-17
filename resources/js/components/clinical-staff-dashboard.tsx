import { CheckCircle2, Clock3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { OnsiteOverviewCard } from '@/components/onsite-overview-card';
import type { OnsiteOverview } from '@/components/onsite-overview-card';
import {
    dashboardServices,
    dashboardTime,
    StaffDashboardAction,
    StaffDashboardHero,
    StaffDashboardList,
    StaffDashboardStat,
} from '@/components/staff-dashboard';

export type ClinicalDashboardAppointment = {
    id: number;
    appointment_date: string;
    start_time?: string | null;
    service_types: string[] | string | null;
    user: { first_name: string; last_name: string };
};

export function ClinicalStaffDashboard({
    role,
    name,
    description,
    icon: Icon,
    todayCount,
    todayLabel,
    pendingCount,
    pendingLabel,
    completedCount,
    completedLabel,
    appointments,
    appointmentsTitle,
    emptyMessage,
    actionTitle,
    actionLabel,
    appointmentsHref,
    onsiteHref,
    onsiteSummary,
    extraStat,
}: {
    role: string;
    name: string;
    description: string;
    icon: LucideIcon;
    todayCount: number;
    todayLabel: string;
    pendingCount: number;
    pendingLabel: string;
    completedCount: number;
    completedLabel: string;
    appointments: ClinicalDashboardAppointment[];
    appointmentsTitle: string;
    emptyMessage: string;
    actionTitle: string;
    actionLabel: string;
    appointmentsHref: string;
    onsiteHref: string;
    onsiteSummary: OnsiteOverview;
    extraStat?: { label: string; value: string | number; icon: LucideIcon };
}) {
    return (
        <div className="min-h-screen space-y-6 bg-gray-50 p-6">
            <StaffDashboardHero
                role={role}
                name={name}
                description={description}
                icon={Icon}
                action={{ label: actionLabel, href: appointmentsHref }}
                todayLabel={todayLabel}
                todayValue={todayCount}
            />

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                <StaffDashboardStat
                    label={pendingLabel}
                    value={pendingCount}
                    icon={Clock3}
                    iconClassName="bg-amber-50 text-amber-700"
                />
                <StaffDashboardStat
                    label={completedLabel}
                    value={completedCount}
                    icon={CheckCircle2}
                    iconClassName="bg-emerald-50 text-emerald-700"
                />
                <StaffDashboardAction
                    title={actionTitle}
                    href={appointmentsHref}
                    label={actionLabel}
                    icon={Icon}
                />
                {extraStat && (
                    <StaffDashboardStat
                        label={extraStat.label}
                        value={extraStat.value}
                        icon={extraStat.icon}
                        iconClassName="bg-violet-50 text-violet-700"
                    />
                )}
            </div>

            <OnsiteOverviewCard summary={onsiteSummary} href={onsiteHref} />

            <StaffDashboardList
                title={appointmentsTitle}
                href={appointmentsHref}
            >
                {appointments.length === 0 ? (
                    <p className="rounded-2xl bg-gray-50/50 p-4 text-sm text-slate-500">
                        {emptyMessage}
                    </p>
                ) : (
                    appointments.map((appointment) => {
                        const services = dashboardServices(
                            appointment.service_types,
                        );
                        return (
                            <article
                                key={appointment.id}
                                className="flex flex-col gap-3 rounded-2xl border border-transparent bg-gray-50/50 p-4 transition hover:border-moss-200 hover:bg-moss-50/40 sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-900 dark:text-white">
                                        {appointment.user.first_name}{' '}
                                        {appointment.user.last_name}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {services.join(', ') ||
                                            'No services listed'}
                                    </p>
                                </div>
                                <div className="shrink-0 text-sm text-slate-600 sm:text-right dark:text-slate-300">
                                    <p className="font-semibold">
                                        {appointment.appointment_date.slice(
                                            0,
                                            10,
                                        )}
                                    </p>
                                    <p className="text-xs">
                                        {dashboardTime(appointment.start_time)}
                                    </p>
                                </div>
                            </article>
                        );
                    })
                )}
            </StaffDashboardList>
        </div>
    );
}
