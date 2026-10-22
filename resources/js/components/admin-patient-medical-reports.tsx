import { Link } from '@inertiajs/react';
import {
    CalendarDays,
    ChevronDown,
    ClipboardCheck,
    Eye,
    FlaskConical,
    ScanLine,
    Stethoscope,
    UserRoundCheck,
} from 'lucide-react';
import { StatusBadge } from '@/components/status-badge';

export type ReportSummary = Record<
    string,
    string | number | boolean | string[] | null
> & { url: string };

export type MedicalReportSet = {
    physical_exam: ReportSummary | null;
    laboratory: ReportSummary | null;
    xray: ReportSummary | null;
};

export type AdminPatientMedicalReport = {
    id: number;
    reference_code: string;
    appointment_date: string | null;
    status: string;
    type: string;
    service_types: string[];
    company: string | null;
    assigned_staff: Array<{
        id: number;
        name: string;
        role: string;
        responsibilities: string[];
    }>;
    reports: MedicalReportSet;
    appointment_url: string;
};

const reportMeta = {
    physical_exam: {
        label: 'Medical Examination Report',
        icon: Stethoscope,
    },
    laboratory: { label: 'Laboratory Report', icon: FlaskConical },
    xray: { label: 'X-Ray Report', icon: ScanLine },
} as const;

function formatDate(value: string | null): string {
    if (!value) return 'Date unavailable';
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

function humanize(value: string): string {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function displayValue(value: ReportSummary[string]): string {
    if (Array.isArray(value)) return value.join(', ');
    if (value === true) return 'Yes';
    if (value === false) return 'No';
    return value === null || value === '' ? 'Not recorded' : String(value);
}

export function MedicalReportCards({ reports }: { reports: MedicalReportSet }) {
    const availableReports = Object.entries(reports).filter(
        ([, report]) => report !== null,
    );

    if (availableReports.length === 0) {
        return (
            <p className="text-sm text-slate-500">
                No medical reports are available for this visit yet.
            </p>
        );
    }

    return (
        <div className="grid gap-3 lg:grid-cols-2">
            {availableReports.map(([key, report]) => {
                if (!report) return null;
                const meta = reportMeta[key as keyof typeof reportMeta];
                const Icon = meta.icon;
                const previewUrl = `${report.url}${report.url.includes('?') ? '&' : '?'}preview=1`;

                return (
                    <article
                        key={key}
                        className="rounded-xl border border-slate-200 p-4 dark:border-border"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h5 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-slate-100">
                                <Icon className="size-4 text-moss-600" />
                                {meta.label}
                            </h5>
                            <a
                                href={previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-moss-700 hover:underline dark:text-moss-300"
                            >
                                <Eye className="size-3.5" />
                                View
                            </a>
                        </div>
                        <dl className="mt-3 space-y-2">
                            {Object.entries(report)
                                .filter(([label]) => label !== 'url')
                                .map(([label, value]) => (
                                    <div
                                        key={label}
                                        className="grid grid-cols-[120px_1fr] gap-3 text-sm"
                                    >
                                        <dt className="text-xs font-semibold text-slate-500">
                                            {humanize(label)}
                                        </dt>
                                        <dd className="text-slate-800 dark:text-slate-200">
                                            {displayValue(value)}
                                        </dd>
                                    </div>
                                ))}
                        </dl>
                    </article>
                );
            })}
        </div>
    );
}

export function AdminPatientMedicalReports({
    reports,
}: {
    reports: AdminPatientMedicalReport[];
}) {
    if (!reports.length) {
        return (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center dark:border-border dark:bg-muted/20">
                <ClipboardCheck className="mx-auto size-9 text-slate-300" />
                <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                    No medical reports recorded
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {reports.map((visit, index) => (
                <details
                    key={visit.id}
                    open={index === 0}
                    className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card"
                >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 p-5 marker:content-none sm:p-6">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-slate-950 dark:text-slate-100">
                                    {formatDate(visit.appointment_date)}
                                </span>
                                <span className="rounded-full bg-moss-100 px-2.5 py-1 text-[11px] font-semibold text-moss-700 dark:bg-moss-900 dark:text-moss-200">
                                    {visit.reference_code}
                                </span>
                                <StatusBadge
                                    status={visit.status}
                                    className="text-[11px]"
                                />
                            </div>
                            <p className="mt-1 truncate text-sm text-slate-500">
                                {visit.service_types.join(' · ') ||
                                    'Clinical visit'}
                                {visit.company ? ` · ${visit.company}` : ''}
                            </p>
                        </div>
                        <ChevronDown className="size-5 shrink-0 text-slate-400 transition-transform group-open:rotate-180" />
                    </summary>

                    <div className="space-y-5 border-t border-slate-100 p-5 sm:p-6 dark:border-border">
                        <section>
                            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                <UserRoundCheck className="size-4 text-moss-600" />
                                Assigned Doctor and Staff
                            </h4>
                            {visit.assigned_staff.length ? (
                                <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                    {visit.assigned_staff.map((staff) => (
                                        <div
                                            key={staff.id}
                                            className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-border dark:bg-muted/30"
                                        >
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">
                                                {staff.name}
                                            </p>
                                            <p className="mt-0.5 text-xs font-medium text-moss-700 dark:text-moss-300">
                                                {staff.role}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                {staff.responsibilities.join(
                                                    ' · ',
                                                )}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-2 text-sm text-slate-500">
                                    No doctor or staff assignment was recorded.
                                </p>
                            )}
                        </section>

                        <section>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Medical Reports
                            </h4>
                            <div className="mt-3">
                                <MedicalReportCards reports={visit.reports} />
                            </div>
                        </section>

                        <Link
                            href={visit.appointment_url}
                            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-moss-300 hover:bg-moss-50 hover:text-moss-800 dark:border-border dark:text-slate-200"
                        >
                            <CalendarDays className="size-3.5" /> Open complete
                            appointment
                        </Link>
                    </div>
                </details>
            ))}
        </div>
    );
}
