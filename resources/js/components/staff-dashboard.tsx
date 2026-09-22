import { Link } from '@inertiajs/react';
import { ArrowRight, CalendarDays } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { DashboardClinicBadge } from '@/components/dashboard-clinic-badge';

export function StaffDashboardHero({
    role,
    name,
    description,
    icon: Icon,
    action,
    todayLabel,
    todayValue,
}: {
    role: string;
    name: string;
    description: string;
    icon: LucideIcon;
    action: { label: string; href: string };
    todayLabel: string;
    todayValue: number;
}) {
    return (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
            <section className="relative flex min-h-56 flex-col justify-between overflow-hidden rounded-[2rem] bg-moss-800 p-7 text-white shadow-[0_10px_30px_-24px_rgba(48,63,52,.45)] sm:p-9">
                <div className="absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -bottom-24 left-1/3 size-48 rounded-full bg-moss-400/20 blur-3xl" />
                <div className="relative">
                    <DashboardClinicBadge icon={Icon}>
                        {role} dashboard
                    </DashboardClinicBadge>
                    <p className="mt-9 text-sm font-semibold text-moss-200">
                        Welcome back
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                        {name}
                    </h1>
                    <p className="mt-3 max-w-xl text-sm text-moss-100/85">
                        {description}
                    </p>
                </div>
                <Link
                    href={action.href}
                    className="relative mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-moss-800 transition hover:bg-moss-50"
                >
                    {action.label}
                    <ArrowRight className="size-4" />
                </Link>
            </section>

            <section className="relative overflow-hidden rounded-[2rem] border border-moss-200 bg-gradient-to-br from-moss-50 via-white to-emerald-50 p-7 shadow-[0_8px_24px_-20px_rgba(47,107,74,.3)] sm:p-8 dark:border-moss-700 dark:from-moss-950 dark:via-card dark:to-emerald-950/40">
                <div className="absolute -top-10 -right-8 size-36 rounded-full bg-moss-200/45 blur-2xl dark:bg-moss-500/10" />
                <div className="relative flex h-full min-h-44 flex-col justify-between">
                    <div className="flex items-center justify-between gap-4">
                        <span className="text-sm font-extrabold tracking-[0.14em] text-moss-700 uppercase dark:text-moss-200">
                            Today
                        </span>
                        <span className="grid size-12 place-items-center rounded-2xl bg-moss-700 text-white shadow-lg shadow-moss-700/20">
                            <CalendarDays className="size-6" />
                        </span>
                    </div>
                    <div className="mt-6">
                        <strong className="text-6xl leading-none font-black tracking-tight text-moss-900 sm:text-7xl dark:text-white">
                            {todayValue}
                        </strong>
                        <p className="mt-2 text-sm font-bold text-moss-700 dark:text-moss-200">
                            {todayLabel}
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
}

export function StaffDashboardStat({
    label,
    value,
    icon: Icon,
    iconClassName = 'bg-moss-50 text-moss-700',
}: {
    label: string;
    value: number | string;
    icon: LucideIcon;
    iconClassName?: string;
}) {
    return (
        <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/70">
            <span
                className={`grid size-12 place-items-center rounded-2xl ${iconClassName}`}
            >
                <Icon className="size-6" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-500 dark:text-slate-400">
                {label}
            </p>
            <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-white">
                {value}
            </p>
        </div>
    );
}

export function StaffDashboardAction({
    title,
    href,
    label,
    icon: Icon,
}: {
    title: string;
    href: string;
    label: string;
    icon: LucideIcon;
}) {
    return (
        <div className="flex flex-col justify-between rounded-[2rem] border border-moss-200 bg-gradient-to-br from-moss-700 to-moss-900 p-6 text-white shadow-sm sm:col-span-2 xl:col-span-1">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-xs font-extrabold tracking-[0.14em] text-moss-200 uppercase">
                        Quick action
                    </p>
                    <h2 className="mt-2 text-xl font-bold">{title}</h2>
                </div>
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-moss-100">
                    <Icon className="size-6" />
                </span>
            </div>
            <Link
                href={href}
                className="mt-6 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-moss-800 transition hover:bg-moss-50"
            >
                {label}
                <ArrowRight className="size-4" />
            </Link>
        </div>
    );
}

export function StaffDashboardList({
    title,
    href,
    children,
}: {
    title: string;
    href: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-[2rem] border border-white bg-white/60 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-card/70">
            <div className="flex items-center justify-between gap-4 bg-moss-700 px-6 py-5 text-white">
                <h2 className="text-xl font-bold">{title}</h2>
                <Link
                    href={href}
                    className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/20"
                >
                    View all
                </Link>
            </div>
            <div className="space-y-3 p-6">{children}</div>
        </section>
    );
}

export function dashboardServices(value: string[] | string | null): string[] {
    if (Array.isArray(value)) return value;
    if (!value) return [];

    try {
        const parsed: unknown = JSON.parse(value);
        return Array.isArray(parsed)
            ? parsed.filter(
                  (service): service is string => typeof service === 'string',
              )
            : [value];
    } catch {
        return [value];
    }
}

export function dashboardTime(value?: string | null): string {
    if (!value) return 'Time pending';
    const [hours = '0', minutes = '0'] = value.split(':');
    const hour = Number(hours);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
}
