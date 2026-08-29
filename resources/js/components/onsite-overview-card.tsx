import { Link } from '@inertiajs/react';
import { motion, useReducedMotion } from 'framer-motion';
import {
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    MapPin,
    UsersRound,
} from 'lucide-react';

export interface OnsiteOverview {
    today_count: number;
    upcoming_count: number;
    events: Array<{
        id: number;
        appointment_date: string;
        status: string;
        bulk_employees_count: number;
        arrived_count: number;
        completed_count: number;
        company?: { company_name: string; address?: string | null } | null;
    }>;
}

export function OnsiteOverviewCard({
    summary,
    href,
}: {
    summary: OnsiteOverview;
    href: string;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <section className="overflow-hidden rounded-[2rem] border border-moss-200/70 bg-white shadow-[0_18px_50px_-34px_rgba(48,63,52,.45)]">
            <div className="relative overflow-hidden bg-moss-800 px-6 py-6 text-white sm:px-8">
                <div className="absolute -top-16 right-8 size-40 rounded-full bg-white/10 blur-2xl" />
                <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-white/15 bg-white/10 text-moss-100">
                            <Building2 className="size-6" />
                        </span>
                        <div>
                            <p className="text-xs font-bold tracking-[.16em] text-moss-200 uppercase">
                                Onsite assignments
                            </p>
                            <h2 className="mt-1 text-xl font-bold">
                                Company medical events
                            </h2>
                            <p className="mt-1 text-sm text-moss-100/80">
                                Your assigned events and employee progress.
                            </p>
                        </div>
                    </div>
                    <Link
                        href={href}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-moss-800 transition hover:-translate-y-0.5 hover:bg-moss-50"
                    >
                        Open onsite workspace
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </div>

            <div className="grid lg:grid-cols-[210px_1fr]">
                <div className="grid grid-cols-2 border-b border-moss-100 bg-moss-50/70 lg:grid-cols-1 lg:border-r lg:border-b-0">
                    <Metric
                        icon={CalendarDays}
                        label="Today"
                        value={summary.today_count}
                    />
                    <Metric
                        icon={UsersRound}
                        label="Upcoming"
                        value={summary.upcoming_count}
                        divided
                    />
                </div>
                <div className="p-5 sm:p-6">
                    {summary.events.length > 0 ? (
                        <div className="grid gap-3 xl:grid-cols-3">
                            {summary.events.map((event, index) => {
                                const total = event.bulk_employees_count || 0;
                                const completed = event.completed_count || 0;
                                const progress = total
                                    ? Math.round((completed / total) * 100)
                                    : 0;

                                return (
                                    <motion.div
                                        key={event.id}
                                        initial={
                                            reduceMotion
                                                ? false
                                                : { opacity: 0, y: 10 }
                                        }
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.06 }}
                                    >
                                        <Link
                                            href={`${href}/${event.id}`}
                                            className="group block h-full rounded-2xl border border-slate-200 bg-slate-50/60 p-4 transition hover:border-moss-300 hover:bg-moss-50/60 hover:shadow-sm"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900 group-hover:text-moss-800">
                                                        {event.company
                                                            ?.company_name ||
                                                            'Company event'}
                                                    </p>
                                                    <p className="mt-1 text-xs font-semibold text-moss-700">
                                                        {new Date(
                                                            `${event.appointment_date}T00:00:00`,
                                                        ).toLocaleDateString(
                                                            undefined,
                                                            {
                                                                month: 'short',
                                                                day: 'numeric',
                                                                year: 'numeric',
                                                            },
                                                        )}
                                                    </p>
                                                </div>
                                                <span className="rounded-full bg-moss-100 px-2.5 py-1 text-[10px] font-bold tracking-wide text-moss-800 uppercase">
                                                    {event.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </span>
                                            </div>
                                            <p className="mt-3 flex min-h-5 items-start gap-1.5 text-xs text-slate-500">
                                                <MapPin className="mt-0.5 size-3.5 shrink-0 text-moss-600" />
                                                <span className="line-clamp-2">
                                                    {event.company?.address ||
                                                        'Location provided by company'}
                                                </span>
                                            </p>
                                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                                <span className="flex items-center gap-1.5">
                                                    <UsersRound className="size-3.5" />
                                                    {event.arrived_count}/
                                                    {total} arrived
                                                </span>
                                                <span className="flex items-center gap-1.5 font-semibold text-moss-700">
                                                    <CheckCircle2 className="size-3.5" />
                                                    {completed} done
                                                </span>
                                            </div>
                                            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-moss-100">
                                                <div
                                                    className="h-full rounded-full bg-moss-600"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </Link>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex min-h-36 flex-col items-center justify-center rounded-2xl border border-dashed border-moss-200 bg-moss-50/40 px-5 text-center">
                            <CalendarDays className="size-7 text-moss-500" />
                            <p className="mt-3 text-sm font-bold text-slate-800">
                                No upcoming onsite assignments
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                                Newly assigned company events will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
    divided = false,
}: {
    icon: typeof CalendarDays;
    label: string;
    value: number;
    divided?: boolean;
}) {
    return (
        <div
            className={`flex items-center gap-3 px-5 py-5 lg:py-6 ${divided ? 'border-l border-moss-100 lg:border-t lg:border-l-0' : ''}`}
        >
            <span className="grid size-10 place-items-center rounded-xl bg-white text-moss-700 shadow-sm">
                <Icon className="size-5" />
            </span>
            <div>
                <p className="text-2xl font-extrabold text-moss-900">{value}</p>
                <p className="text-xs font-semibold text-moss-700">{label}</p>
            </div>
        </div>
    );
}
