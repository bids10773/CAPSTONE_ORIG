import { Head, Link, router } from '@inertiajs/react';
import {
    Download,
    Eye,
    FileHeart,
    FilePlus2,
    PenLine,
    Printer,
    UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { MedicalCertificateStatus } from '@/components/medical-certificate-status';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type {
    MedicalCertificatePaginator,
    MedicalCertificatePermissions,
    MedicalCertificateRecord,
} from '@/types/medical-certificate';

type Props = {
    certificates: MedicalCertificatePaginator;
    filters?: {
        search?: string;
        status?: string;
        date_from?: string;
        date_to?: string;
    };
    statuses?: string[] | Record<string, string>;
    can?: MedicalCertificatePermissions;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Medical Certificates', href: '/medical-certificates' },
];

const defaultStatuses: Record<string, string> = {
    draft: 'Draft',
    pending_approval: 'Pending approval',
    changes_requested: 'Changes requested',
    approved: 'Approved',
    issued: 'Issued',
    void: 'Void',
};

function identifier(certificate: MedicalCertificateRecord): string {
    return (
        certificate.certificate_number ||
        certificate.certificate_id ||
        certificate.reference_code ||
        `Certificate #${certificate.id}`
    );
}

function patientDisplayName(certificate: MedicalCertificateRecord): string {
    return (
        certificate.patient_name ||
        certificate.patient?.full_name ||
        certificate.patient?.name ||
        [
            certificate.patient?.first_name,
            certificate.patient?.middle_name,
            certificate.patient?.last_name,
        ]
            .filter(Boolean)
            .join(' ') ||
        'Patient unavailable'
    );
}

function patientReference(certificate: MedicalCertificateRecord): string {
    return (
        certificate.patient_reference_code ||
        certificate.patient?.patient_reference_code ||
        'No patient ID'
    );
}

function physicianName(certificate: MedicalCertificateRecord): string {
    return (
        certificate.physician_name ||
        certificate.attending_physician_name ||
        certificate.attending_physician?.name ||
        certificate.physician?.name ||
        'Not assigned'
    );
}

function formatDate(value?: string | null): string {
    if (!value) return 'Not set';
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat('en-PH', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function canPerform(
    certificate: MedicalCertificateRecord,
    action: keyof MedicalCertificatePermissions,
): boolean {
    const value = certificate.can?.[action];
    return typeof value === 'boolean' ? value : false;
}

export default function MedicalCertificatesIndex({
    certificates,
    filters = {},
    statuses = defaultStatuses,
    can,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');
    const [loading, setLoading] = useState(false);
    const statusOptions = useMemo(() => {
        if (Array.isArray(statuses)) {
            return statuses.map((value) => [
                value,
                defaultStatuses[value] ||
                    value
                        .replaceAll('_', ' ')
                        .replace(/\b\w/g, (letter) => letter.toUpperCase()),
            ]);
        }
        return Object.entries(statuses);
    }, [statuses]);

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            setLoading(true);
            router.get(
                '/medical-certificates',
                {
                    search: search || undefined,
                    status: status || undefined,
                    date_from: dateFrom || undefined,
                    date_to: dateTo || undefined,
                    per_page: certificates.per_page,
                    page: 1,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                    onFinish: () => setLoading(false),
                },
            );
        }, 350);

        return () => window.clearTimeout(timeout);
    }, [certificates.per_page, dateFrom, dateTo, search, status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Medical Certificates" />
            <div className="mx-auto w-full max-w-[1600px] space-y-5 p-4 sm:p-6 lg:p-8">
                <header className="rounded-2xl border border-moss-200 bg-gradient-to-r from-moss-50 to-white p-5 shadow-sm sm:p-6 dark:border-border dark:from-moss-950 dark:to-card">
                    <p className="text-xs font-bold tracking-[.16em] text-moss-700 uppercase dark:text-moss-300">
                        Clinical documents
                    </p>
                    <div className="mt-2 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">
                                Medical Certificates
                            </h1>
                            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
                                Coordinate physician-reviewed certificates and
                                access issued records without deleting their
                                history.
                            </p>
                        </div>
                        {can?.create && (
                            <Link
                                href="/medical-certificates/create"
                                className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-moss-700 px-5 text-sm font-semibold text-white shadow-sm hover:bg-moss-800"
                            >
                                <FilePlus2 className="size-4" /> Create
                                certificate
                            </Link>
                        )}
                    </div>
                </header>

                <nav
                    aria-label="Medical certificate record views"
                    className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-border dark:bg-card"
                >
                    {[
                        ['', 'Certificate records'],
                        ['draft', 'Draft certificates'],
                        ['issued', 'Issued certificates'],
                    ].map(([value, label]) => (
                        <button
                            key={value || 'all'}
                            type="button"
                            onClick={() => setStatus(value)}
                            aria-current={status === value ? 'page' : undefined}
                            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                                status === value
                                    ? 'bg-moss-700 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-moss-50 hover:text-moss-800 dark:text-slate-300 dark:hover:bg-moss-950 dark:hover:text-moss-200'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </nav>

                <SearchFilterToolbar
                    search={{
                        value: search,
                        onChange: (event) => setSearch(event.target.value),
                        placeholder: 'Search certificate ID or patient name…',
                        'aria-label': 'Search medical certificates',
                    }}
                    loading={loading}
                    onSubmit={(event) => event.preventDefault()}
                    sections={[
                        {
                            label: 'Certificate status',
                            defaultOpen: true,
                            content: (
                                <select
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(event.target.value)
                                    }
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-input dark:bg-card"
                                >
                                    <option value="">All statuses</option>
                                    {statusOptions.map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </select>
                            ),
                        },
                        {
                            label: 'Date issued',
                            content: (
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        From
                                        <input
                                            type="date"
                                            value={dateFrom}
                                            max={dateTo || undefined}
                                            onChange={(event) =>
                                                setDateFrom(event.target.value)
                                            }
                                            className="mt-1 w-full"
                                        />
                                    </label>
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                                        To
                                        <input
                                            type="date"
                                            value={dateTo}
                                            min={dateFrom || undefined}
                                            onChange={(event) =>
                                                setDateTo(event.target.value)
                                            }
                                            className="mt-1 w-full"
                                        />
                                    </label>
                                </div>
                            ),
                        },
                    ]}
                    actions={
                        (search || status || dateFrom || dateTo) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch('');
                                    setStatus('');
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                                className="h-12 rounded-xl px-4 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-accent"
                            >
                                Clear
                            </button>
                        )
                    }
                />

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    {certificates.data.length > 0 ? (
                        <>
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full min-w-[980px] text-left text-sm">
                                    <thead>
                                        <tr>
                                            <th>Certificate ID</th>
                                            <th>Patient</th>
                                            <th>Date issued</th>
                                            <th>Attending physician</th>
                                            <th>Status</th>
                                            <th className="text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {certificates.data.map(
                                            (certificate) => (
                                                <CertificateTableRow
                                                    key={certificate.id}
                                                    certificate={certificate}
                                                />
                                            ),
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="divide-y divide-slate-100 md:hidden dark:divide-border">
                                {certificates.data.map((certificate) => (
                                    <CertificateMobileCard
                                        key={certificate.id}
                                        certificate={certificate}
                                    />
                                ))}
                            </div>
                            <Pagination
                                pagination={certificates}
                                label="medical certificates"
                            />
                        </>
                    ) : (
                        <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                            <FileHeart className="size-11 text-slate-300" />
                            <p className="mt-3 font-semibold text-slate-800 dark:text-slate-100">
                                No medical certificates found
                            </p>
                            <p className="mt-1 max-w-md text-sm text-slate-500">
                                {search || status || dateFrom || dateTo
                                    ? 'Try changing the search or filters.'
                                    : 'Certificate drafts and issued records will appear here.'}
                            </p>
                            {can?.create &&
                                !search &&
                                !status &&
                                !dateFrom &&
                                !dateTo && (
                                    <Link
                                        href="/medical-certificates/create"
                                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss-800"
                                    >
                                        <FilePlus2 className="size-4" /> Create
                                        first certificate
                                    </Link>
                                )}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}

function CertificateTableRow({
    certificate,
}: {
    certificate: MedicalCertificateRecord;
}) {
    return (
        <tr>
            <td>
                <Link
                    href={`/medical-certificates/${certificate.id}`}
                    className="font-mono text-xs font-bold text-moss-700 hover:underline dark:text-moss-300"
                >
                    {identifier(certificate)}
                </Link>
            </td>
            <td>
                <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-moss-100 text-moss-700 dark:bg-moss-900 dark:text-moss-200">
                        <UserRound className="size-4" />
                    </span>
                    <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900 dark:text-slate-100">
                            {patientDisplayName(certificate)}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                            {patientReference(certificate)}
                        </p>
                    </div>
                </div>
            </td>
            <td className="whitespace-nowrap text-slate-700 dark:text-slate-200">
                {formatDate(certificate.date_issued)}
            </td>
            <td>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                    {physicianName(certificate)}
                </p>
            </td>
            <td>
                <MedicalCertificateStatus status={certificate.status} />
            </td>
            <td>
                <CertificateActions certificate={certificate} align="right" />
            </td>
        </tr>
    );
}

function CertificateMobileCard({
    certificate,
}: {
    certificate: MedicalCertificateRecord;
}) {
    return (
        <article className="space-y-4 p-4">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <Link
                        href={`/medical-certificates/${certificate.id}`}
                        className="font-mono text-xs font-bold text-moss-700 hover:underline dark:text-moss-300"
                    >
                        {identifier(certificate)}
                    </Link>
                    <h2 className="mt-1 truncate font-bold text-slate-900 dark:text-slate-100">
                        {patientDisplayName(certificate)}
                    </h2>
                    <p className="text-xs text-slate-500">
                        {patientReference(certificate)}
                    </p>
                </div>
                <MedicalCertificateStatus
                    status={certificate.status}
                    className="shrink-0"
                />
            </div>
            <dl className="grid grid-cols-2 gap-3 text-sm">
                <div>
                    <dt className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                        Date issued
                    </dt>
                    <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
                        {formatDate(certificate.date_issued)}
                    </dd>
                </div>
                <div>
                    <dt className="text-[10px] font-bold tracking-wide text-slate-400 uppercase">
                        Physician
                    </dt>
                    <dd className="mt-0.5 text-slate-700 dark:text-slate-200">
                        {physicianName(certificate)}
                    </dd>
                </div>
            </dl>
            <CertificateActions certificate={certificate} />
        </article>
    );
}

function CertificateActions({
    certificate,
    align = 'left',
}: {
    certificate: MedicalCertificateRecord;
    align?: 'left' | 'right';
}) {
    return (
        <div
            className={`flex flex-wrap items-center gap-1.5 ${align === 'right' ? 'justify-end' : ''}`}
        >
            <ActionLink
                href={`/medical-certificates/${certificate.id}`}
                label="View"
                icon={<Eye />}
            />
            {canPerform(certificate, 'edit') && (
                <ActionLink
                    href={`/medical-certificates/${certificate.id}/edit`}
                    label="Edit"
                    icon={<PenLine />}
                />
            )}
            {canPerform(certificate, 'print') && (
                <ActionLink
                    href={`/medical-certificates/${certificate.id}/print`}
                    label="Print"
                    icon={<Printer />}
                    external
                />
            )}
            {canPerform(certificate, 'download_pdf') && (
                <ActionLink
                    href={`/medical-certificates/${certificate.id}/pdf`}
                    label="PDF"
                    icon={<Download />}
                    external
                />
            )}
        </div>
    );
}

function ActionLink({
    href,
    label,
    icon,
    external = false,
}: {
    href: string;
    label: string;
    icon: React.ReactNode;
    external?: boolean;
}) {
    const className =
        'inline-flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-slate-600 hover:bg-moss-50 hover:text-moss-800 dark:text-slate-300 dark:hover:bg-accent dark:hover:text-moss-200 [&>svg]:size-3.5';

    if (external) {
        return (
            <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className={className}
            >
                {icon} {label}
            </a>
        );
    }

    return (
        <Link href={href} className={className}>
            {icon} {label}
        </Link>
    );
}
