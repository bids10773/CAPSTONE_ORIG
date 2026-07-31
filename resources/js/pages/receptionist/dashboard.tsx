import { Head, Link, usePage } from '@inertiajs/react';
import { Activity, CheckCircle2, CircleX, Clock3, ListOrdered, Users } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

type Metrics = {
    total: number;
    waiting: number;
    processing: number;
    completed: number;
    cancelled: number;
    currentQueueNumber: string | null;
};

const cards = [
    { key: 'total', label: "Today's walk-ins", icon: Users, tone: 'bg-sky-50 text-sky-700' },
    { key: 'waiting', label: 'Waiting patients', icon: Clock3, tone: 'bg-amber-50 text-amber-700' },
    { key: 'processing', label: 'Currently processing', icon: Activity, tone: 'bg-violet-50 text-violet-700' },
    { key: 'completed', label: 'Completed today', icon: CheckCircle2, tone: 'bg-emerald-50 text-emerald-700' },
    { key: 'cancelled', label: 'Cancelled today', icon: CircleX, tone: 'bg-rose-50 text-rose-700' },
] as const;

export default function ReceptionistDashboard({ metrics }: { metrics: Metrics }) {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="Walk-in Dashboard" />
            <div className="space-y-7 p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-semibold text-moss-700">Front desk · {new Date().toLocaleDateString()}</p>
                        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Good day, {auth.user.first_name}</h1>
                        <p className="mt-2 text-sm text-slate-500">Manage today’s walk-in queue from one focused workspace.</p>
                    </div>
                    <Link href="/receptionist/walk-ins" className="rounded-xl bg-moss-700 px-5 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-moss-800">
                        Register walk-in
                    </Link>
                </header>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                    {cards.map(({ key, label, icon: Icon, tone }) => (
                        <div key={key} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <span className={`inline-flex rounded-xl p-2.5 ${tone}`}><Icon className="size-5" /></span>
                            <p className="mt-5 text-3xl font-bold text-slate-950">{metrics[key]}</p>
                            <p className="mt-1 text-sm text-slate-500">{label}</p>
                        </div>
                    ))}
                </section>

                <section className="rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div>
                            <p className="text-xs font-bold tracking-[.16em] text-moss-300 uppercase">Current queue number</p>
                            <p className="mt-2 text-5xl font-black tracking-tight">{metrics.currentQueueNumber ?? '—'}</p>
                            <p className="mt-2 text-sm text-slate-400">Processing is prioritized, followed by the next waiting patient.</p>
                        </div>
                        <Link href="/receptionist/queue" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-slate-100">
                            <ListOrdered className="size-4" /> Open queue
                        </Link>
                    </div>
                </section>
            </div>
        </>
    );
}

ReceptionistDashboard.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
