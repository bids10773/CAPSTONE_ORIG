import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    CalendarClock,
    CheckCircle2,
    CircleX,
    ClipboardList,
    Clock3,
    ListOrdered,
    Users,
} from 'lucide-react';
import {
    StaffDashboardAction,
    StaffDashboardHero,
    StaffDashboardList,
    StaffDashboardStat,
} from '@/components/staff-dashboard';
import AppLayout from '@/layouts/app-layout';

type Metrics = {
    total: number;
    waiting: number;
    processing: number;
    completed: number;
    cancelled: number;
    currentQueueNumber: string | null;
    online: number;
    pendingRequests: number;
};

type OnlineQueueItem = {
    id: number;
    queue_number: string;
    patient_name: string;
    start_time: string | null;
    services: string[];
    status: string;
    type: 'individual' | 'company_referral';
};

export default function ReceptionistDashboard({
    metrics,
    onlineQueue,
}: {
    metrics: Metrics;
    onlineQueue: OnlineQueueItem[];
}) {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="Receptionist Dashboard" />
            <div className="min-h-screen space-y-6 bg-gray-50 p-6">
                <StaffDashboardHero
                    role="Receptionist"
                    name={auth?.user?.name ?? 'Receptionist'}
                    description="Keep today's online appointments and walk-in queue moving."
                    icon={ClipboardList}
                    action={{
                        label: 'Register walk-in',
                        href: '/receptionist/walk-ins',
                    }}
                    todayLabel={
                        metrics.total === 1 ? 'walk-in today' : 'walk-ins today'
                    }
                    todayValue={metrics.total}
                />

                <Link
                    href="/receptionist/appointment-requests"
                    className="group flex flex-col justify-between gap-4 rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm transition hover:border-amber-300 hover:bg-amber-100/70 focus-visible:ring-4 focus-visible:ring-amber-500/20 focus-visible:outline-none sm:flex-row sm:items-center dark:border-amber-900 dark:bg-amber-950/35 dark:hover:bg-amber-950/55"
                >
                    <div className="flex items-center gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-sm">
                            <CalendarClock className="size-6" />
                        </span>
                        <div>
                            <p className="font-bold text-slate-900 dark:text-white">
                                Appointment requests
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {metrics.pendingRequests === 0
                                    ? 'No requests are waiting for review.'
                                    : `${metrics.pendingRequests} ${metrics.pendingRequests === 1 ? 'request needs' : 'requests need'} your review.`}
                            </p>
                        </div>
                    </div>
                    <span className="inline-flex items-center gap-3 self-end font-bold text-amber-800 sm:self-auto dark:text-amber-300">
                        <span className="grid min-w-10 place-items-center rounded-full bg-amber-500 px-3 py-2 text-sm text-white">
                            {metrics.pendingRequests}
                        </span>
                        Review requests
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                </Link>

                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    <StaffDashboardStat
                        label="Waiting walk-ins"
                        value={metrics.waiting}
                        icon={Clock3}
                        iconClassName="bg-amber-50 text-amber-700"
                    />
                    <StaffDashboardStat
                        label="Currently processing"
                        value={metrics.processing}
                        icon={Activity}
                        iconClassName="bg-violet-50 text-violet-700"
                    />
                    <StaffDashboardAction
                        title="Patient queue"
                        href="/receptionist/queue"
                        label="Open queue"
                        icon={ListOrdered}
                    />
                    <StaffDashboardStat
                        label="Completed walk-ins today"
                        value={metrics.completed}
                        icon={CheckCircle2}
                        iconClassName="bg-emerald-50 text-emerald-700"
                    />
                    <StaffDashboardStat
                        label="Cancelled walk-ins today"
                        value={metrics.cancelled}
                        icon={CircleX}
                        iconClassName="bg-rose-50 text-rose-700"
                    />
                    <StaffDashboardStat
                        label="Active online appointments"
                        value={metrics.online}
                        icon={Users}
                    />
                </div>

                <section className="rounded-[2rem] border border-moss-200 bg-moss-50 p-6 dark:border-moss-700 dark:bg-moss-950/40">
                    <p className="text-xs font-extrabold tracking-[0.14em] text-moss-700 uppercase dark:text-moss-200">
                        Current queue number
                    </p>
                    <p className="mt-2 text-4xl font-black text-moss-900 dark:text-white">
                        {metrics.currentQueueNumber ?? 'None waiting'}
                    </p>
                </section>

                <StaffDashboardList
                    title="Today's online queue"
                    href="/receptionist/queue"
                >
                    {onlineQueue.length === 0 ? (
                        <p className="rounded-2xl bg-gray-50/50 p-4 text-sm text-slate-500">
                            No active online appointments scheduled for today.
                        </p>
                    ) : (
                        onlineQueue.map((item) => (
                            <article
                                key={item.id}
                                className="grid gap-3 rounded-2xl border border-transparent bg-gray-50/50 p-4 sm:grid-cols-[80px_minmax(0,1fr)_120px_110px] sm:items-center"
                            >
                                <strong className="text-moss-800 dark:text-moss-200">
                                    {item.queue_number}
                                </strong>
                                <div className="min-w-0">
                                    <p className="truncate font-bold text-slate-900 dark:text-white">
                                        {item.patient_name}
                                    </p>
                                    <p className="truncate text-xs text-slate-500">
                                        {item.services.join(', ') ||
                                            'No service listed'}
                                    </p>
                                </div>
                                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                                    {item.start_time ?? 'Time pending'}
                                </span>
                                <span className="status-text-only w-fit text-xs font-bold text-amber-700 capitalize dark:text-amber-400">
                                    {item.status.replaceAll('_', ' ')}
                                </span>
                            </article>
                        ))
                    )}
                </StaffDashboardList>
            </div>
        </>
    );
}

ReceptionistDashboard.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
