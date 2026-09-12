import { Head, Link } from '@inertiajs/react';
import { ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Security', href: '/admin/security' },
];

type Props = {
    securityAlerts: {
        possibleDuplicateAccounts: number;
        repeatedBookingAttempts: number;
        highCancellationActivity: number;
    };
};

const signals = [
    {
        key: 'possibleDuplicateAccounts' as const,
        label: 'Possible Duplicate Accounts',
        description:
            'Accounts with details that may belong to the same person.',
    },
    {
        key: 'repeatedBookingAttempts' as const,
        label: 'Repeated Booking Attempts',
        description: 'Rapid appointment attempts that may require review.',
    },
    {
        key: 'highCancellationActivity' as const,
        label: 'High Cancellation Activity',
        description: 'Accounts with an unusual pattern of cancellations.',
    },
];

export default function AdminSecurity({ securityAlerts }: Props) {
    const totalAlerts = Object.values(securityAlerts).reduce(
        (total, value) => total + Number(value),
        0,
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Booking & Security Alerts" />

            <main className="space-y-6 p-4 sm:p-6 lg:p-8">
                <header>
                    <h1 className="text-2xl font-semibold tracking-[-.03em] text-slate-950 dark:text-slate-100">
                        Booking &amp; Security Alerts
                    </h1>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                        Informational signals for administrator review; accounts
                        are not automatically suspended.
                    </p>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    {signals.map((signal) => (
                        <article
                            key={signal.key}
                            className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm dark:border-amber-900/60 dark:bg-card"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400">
                                    <ShieldAlert className="size-5" />
                                </span>
                                <span className="text-3xl font-semibold tracking-[-.04em] text-amber-950 dark:text-amber-200">
                                    {securityAlerts[
                                        signal.key
                                    ].toLocaleString()}
                                </span>
                            </div>
                            <h2 className="mt-5 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {signal.label}
                            </h2>
                            <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                {signal.description}
                            </p>
                        </article>
                    ))}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="flex size-11 items-center justify-center rounded-xl bg-moss-50 text-moss-700 dark:bg-moss-900 dark:text-moss-300">
                                <ShieldCheck className="size-5" />
                            </span>
                            <div>
                                <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                                    {totalAlerts === 0
                                        ? 'No alerts require review'
                                        : `${totalAlerts.toLocaleString()} alert${totalAlerts === 1 ? '' : 's'} require review`}
                                </h2>
                                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                                    Review related patients and appointments
                                    before taking administrative action.
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/admin/appointments"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-moss-700 hover:text-moss-800 dark:text-moss-400"
                        >
                            Review appointments
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </section>
            </main>
        </AppLayout>
    );
}
