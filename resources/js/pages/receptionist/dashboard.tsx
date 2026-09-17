import { Head, usePage } from '@inertiajs/react';
import {
    Activity,
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
                                <span className="w-fit rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700 capitalize">
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
