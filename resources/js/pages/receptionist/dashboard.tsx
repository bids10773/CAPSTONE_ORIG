import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    CheckCircle2,
    CircleX,
    Clock3,
    ListOrdered,
    Users,
} from 'lucide-react';
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

const cards = [
    {
        key: 'total',
        label: "Today's walk-ins",
        icon: Users,
        tone: 'bg-sky-50 text-sky-700',
    },
    {
        key: 'waiting',
        label: 'Waiting patients',
        icon: Clock3,
        tone: 'bg-amber-50 text-amber-700',
    },
    {
        key: 'processing',
        label: 'Currently processing',
        icon: Activity,
        tone: 'bg-violet-50 text-violet-700',
    },
    {
        key: 'completed',
        label: 'Completed today',
        icon: CheckCircle2,
        tone: 'bg-emerald-50 text-emerald-700',
    },
    {
        key: 'cancelled',
        label: 'Cancelled today',
        icon: CircleX,
        tone: 'bg-rose-50 text-rose-700',
    },
] as const;

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
            <div className="space-y-7 p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-semibold text-moss-700">
                            Front desk · {new Date().toLocaleDateString()}
                        </p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                            Good day, {auth.user.first_name}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Manage today’s walk-in queue from one focused
                            workspace.
                        </p>
                    </div>
                    <Link
                        href="/receptionist/walk-ins"
                        className="rounded-xl bg-moss-700 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-moss-800"
                    >
                        Register walk-in
                    </Link>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {cards.map(({ key, label, icon: Icon, tone }) => (
                        <div
                            key={key}
                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                        >
                            <span
                                className={`inline-flex rounded-xl p-2.5 ${tone}`}
                            >
                                <Icon className="size-5" />
                            </span>
                            <p className="mt-5 text-3xl font-bold text-slate-950">
                                {metrics[key]}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                                {label}
                            </p>
                        </div>
                    ))}
                </section>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col justify-between gap-2 border-b border-slate-200 p-6 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-slate-950">
                                Today&apos;s online queue
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Individual and company-referral appointments
                                scheduled online for today.
                            </p>
                        </div>
                        <span className="w-fit rounded-full bg-moss-100 px-3 py-1 text-sm font-bold text-moss-800">
                            {metrics.online} waiting
                        </span>
                    </div>

                    {onlineQueue.length === 0 ? (
                        <div className="p-10 text-center text-sm text-slate-500">
                            No active online appointments scheduled for today.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {onlineQueue.map((item) => (
                                <article
                                    key={item.id}
                                    className="grid gap-4 p-5 sm:grid-cols-[100px_minmax(0,1fr)_150px_130px] sm:items-center"
                                >
                                    <strong className="text-lg text-moss-800">
                                        {item.queue_number}
                                    </strong>
                                    <div className="min-w-0">
                                        <p className="truncate font-bold text-slate-950">
                                            {item.patient_name}
                                        </p>
                                        <p className="mt-1 truncate text-sm text-slate-500">
                                            {item.services.join(', ') ||
                                                'No service listed'}
                                        </p>
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-semibold text-slate-800">
                                            {item.start_time ?? 'Time pending'}
                                        </p>
                                        <p className="text-slate-500 capitalize">
                                            {item.type.replaceAll('_', ' ')}
                                        </p>
                                    </div>
                                    <span className="w-fit rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700 capitalize">
                                        {item.status.replaceAll('_', ' ')}
                                    </span>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-bold tracking-[.16em] text-moss-300 uppercase">
                                Current queue number
                            </p>
                            <p className="mt-2 text-5xl font-black tracking-tight">
                                {metrics.currentQueueNumber ?? '—'}
                            </p>
                            <p className="mt-2 text-sm text-slate-400">
                                Processing is prioritized, followed by the next
                                waiting patient.
                            </p>
                        </div>
                        <Link
                            href="/receptionist/queue"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100"
                        >
                            <ListOrdered className="size-4" /> Open queue
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}

ReceptionistDashboard.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
