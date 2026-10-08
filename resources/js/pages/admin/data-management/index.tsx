import { Head, router, useForm } from '@inertiajs/react';
import {
    Archive,
    CalendarClock,
    DatabaseBackup,
    Download,
    HardDriveDownload,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Data Management', href: '/admin/data-management' },
];

type Policy = {
    retention_years: number;
    inactivity_months: number;
    scheduled_backups_enabled: boolean;
    backup_interval_months: number;
    automatic_deletion_enabled: boolean;
};

type Backup = {
    id: number;
    type: string;
    status: string;
    size_bytes: number | null;
    checksum_sha256: string | null;
    created_by: string;
    created_at: string;
    completed_at: string | null;
    download_url: string | null;
};

type Props = {
    policy: Policy;
    retentionSummary: {
        medical_records: number;
        inactive_accounts: number;
        expired_backups: number;
    };
    nextScheduledBackupAt: string | null;
    backups: Backup[];
};

function formatDate(value: string | null): string {
    if (!value) return 'Not scheduled';
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function formatBytes(value: number | null): string {
    if (!value) return '—';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(value) / Math.log(1024)), 3);
    return `${(value / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

export default function DataManagement({
    policy,
    retentionSummary,
    nextScheduledBackupAt,
    backups,
}: Props) {
    const form = useForm({ ...policy });

    const savePolicy = (event: FormEvent) => {
        event.preventDefault();
        form.patch('/admin/data-management', { preserveScroll: true });
    };

    const createBackup = () => {
        router.post(
            '/admin/data-management/backups',
            {},
            { preserveScroll: true },
        );
    };

    const enforceRetention = () => {
        if (
            window.confirm(
                'Create a backup, then permanently remove all data currently beyond the configured retention periods?',
            )
        ) {
            router.post(
                '/admin/data-management/enforce',
                {},
                { preserveScroll: true },
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Data Management" />

            <main className="space-y-6 p-4 sm:p-6 lg:p-8">
                <section>
                    <p className="text-xs font-bold tracking-[0.16em] text-moss-700 uppercase">
                        Administration
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-slate-950 dark:text-slate-100">
                        Data retention and backups
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                        Control how long clinic records and inactive accounts
                        are retained. Backups are stored privately and always
                        run before retention deletion.
                    </p>
                </section>

                <section className="grid gap-4 md:grid-cols-3">
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                        <Archive className="size-5 text-moss-700" />
                        <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                            {policy.retention_years} years
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Medical record retention
                        </p>
                    </article>
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                        <CalendarClock className="size-5 text-moss-700" />
                        <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                            Every 6 months
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Next: {formatDate(nextScheduledBackupAt)}
                        </p>
                    </article>
                    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                        <ShieldCheck className="size-5 text-moss-700" />
                        <p className="mt-4 text-2xl font-semibold text-slate-950 dark:text-slate-100">
                            {retentionSummary.medical_records +
                                retentionSummary.inactive_accounts +
                                retentionSummary.expired_backups}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                            Items currently eligible
                        </p>
                    </article>
                </section>

                <form
                    onSubmit={savePolicy}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-border dark:bg-card"
                >
                    <div className="flex items-start gap-3">
                        <DatabaseBackup className="mt-0.5 size-5 text-moss-700" />
                        <div>
                            <h2 className="font-semibold text-slate-950 dark:text-slate-100">
                                Retention policy
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Minimum inactivity is six months. Automatic
                                deletion remains off until explicitly enabled.
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-5 md:grid-cols-2">
                        <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <span>Medical record retention (years)</span>
                            <input
                                type="number"
                                min={1}
                                max={25}
                                value={form.data.retention_years}
                                onChange={(event) =>
                                    form.setData(
                                        'retention_years',
                                        Number(event.target.value),
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-950 outline-none focus:border-moss-500 dark:border-border dark:bg-background dark:text-slate-100"
                            />
                            {form.errors.retention_years && (
                                <span className="block text-xs text-red-600">
                                    {form.errors.retention_years}
                                </span>
                            )}
                        </label>
                        <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                            <span>Inactive account retention (months)</span>
                            <input
                                type="number"
                                min={6}
                                max={300}
                                value={form.data.inactivity_months}
                                onChange={(event) =>
                                    form.setData(
                                        'inactivity_months',
                                        Number(event.target.value),
                                    )
                                }
                                className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-slate-950 outline-none focus:border-moss-500 dark:border-border dark:bg-background dark:text-slate-100"
                            />
                            {form.errors.inactivity_months && (
                                <span className="block text-xs text-red-600">
                                    {form.errors.inactivity_months}
                                </span>
                            )}
                        </label>
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2">
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 dark:border-border">
                            <input
                                type="checkbox"
                                checked={form.data.scheduled_backups_enabled}
                                onChange={(event) =>
                                    form.setData(
                                        'scheduled_backups_enabled',
                                        event.target.checked,
                                    )
                                }
                                className="mt-0.5 size-4 accent-moss-700"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    Automatic six-month backups
                                </span>
                                <span className="mt-1 block text-xs text-slate-500">
                                    Includes medical records, patient accounts,
                                    staff accounts, and stored documents.
                                </span>
                            </span>
                        </label>
                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-red-200 p-4 dark:border-red-900/60">
                            <input
                                type="checkbox"
                                checked={form.data.automatic_deletion_enabled}
                                onChange={(event) =>
                                    form.setData(
                                        'automatic_deletion_enabled',
                                        event.target.checked,
                                    )
                                }
                                className="mt-0.5 size-4 accent-red-700"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-red-700 dark:text-red-400">
                                    Automatic permanent deletion
                                </span>
                                <span className="mt-1 block text-xs text-slate-500">
                                    Runs daily against the periods above and
                                    creates a backup before deleting anything.
                                </span>
                            </span>
                        </label>
                    </div>

                    <div className="mt-6 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5 dark:border-border">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={enforceRetention}
                            disabled={
                                retentionSummary.medical_records +
                                    retentionSummary.inactive_accounts +
                                    retentionSummary.expired_backups ===
                                0
                            }
                            className="text-red-700 hover:text-red-800"
                        >
                            <Trash2 className="size-4" />
                            Run retention now
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Save policy
                        </Button>
                    </div>
                </form>

                <section className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 p-5 sm:p-6 dark:border-border">
                        <div>
                            <h2 className="font-semibold text-slate-950 dark:text-slate-100">
                                Backup history
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Private archives are available only to
                                administrators.
                            </p>
                        </div>
                        <Button type="button" onClick={createBackup}>
                            <HardDriveDownload className="size-4" />
                            Create manual backup
                        </Button>
                    </div>

                    {backups.length === 0 ? (
                        <p className="p-8 text-center text-sm text-slate-500">
                            No backups have been created yet.
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[760px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:bg-muted/40">
                                    <tr>
                                        <th className="px-5 py-3">Created</th>
                                        <th className="px-5 py-3">Type</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Size</th>
                                        <th className="px-5 py-3">
                                            Created by
                                        </th>
                                        <th className="px-5 py-3 text-right">
                                            Archive
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-border">
                                    {backups.map((backup) => (
                                        <tr key={backup.id}>
                                            <td className="px-5 py-4 text-slate-700 dark:text-slate-200">
                                                {formatDate(backup.created_at)}
                                            </td>
                                            <td className="px-5 py-4 font-medium text-slate-700 capitalize dark:text-slate-200">
                                                {backup.type}
                                            </td>
                                            <td
                                                className={`px-5 py-4 font-semibold capitalize ${
                                                    backup.status ===
                                                    'completed'
                                                        ? 'text-emerald-700 dark:text-emerald-400'
                                                        : backup.status ===
                                                            'failed'
                                                          ? 'text-red-700 dark:text-red-400'
                                                          : 'text-amber-700 dark:text-amber-400'
                                                }`}
                                            >
                                                {backup.status}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {formatBytes(backup.size_bytes)}
                                            </td>
                                            <td className="px-5 py-4 text-slate-500">
                                                {backup.created_by}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {backup.download_url ? (
                                                    <a
                                                        href={
                                                            backup.download_url
                                                        }
                                                        className="inline-flex items-center gap-1.5 font-semibold text-moss-700 hover:underline dark:text-moss-300"
                                                    >
                                                        <Download className="size-4" />
                                                        Download
                                                    </a>
                                                ) : (
                                                    <span className="text-slate-400">
                                                        Unavailable
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </main>
        </AppLayout>
    );
}
