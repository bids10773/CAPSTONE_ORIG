import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, FileHeart, FolderHeart, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedResponse } from '@/types/pagination';

type Role = 'doctor' | 'medtech' | 'radtech' | 'receptionist';

type RecordItem = {
    id: number;
    reference_code: string;
    appointment_date: string;
    status: string;
    type: string;
    service_types: string[];
    patient: {
        name: string;
        email: string;
        contact?: string | null;
        birthdate?: string | null;
        age?: number | null;
        sex?: string | null;
        civil_status?: string | null;
        employee_number?: string | null;
    };
    company?: string | null;
    documents: {
        physical_exam: boolean;
        medical_history: boolean;
        final_evaluation: boolean;
        laboratory: boolean;
        xray: boolean;
    };
    manage_url?: string | null;
};

type Props = {
    records: PaginatedResponse<RecordItem>;
    filters: { search: string; status: string };
    role: Role;
};

const roleHome: Record<Role, string> = {
    doctor: '/doctor/dashboard',
    medtech: '/medtech/dashboard',
    radtech: '/radtech/dashboard',
    receptionist: '/receptionist/dashboard',
};

const documentDefinitions = [
    ['physical_exam', 'Physical exam', 'physical-exam'],
    ['medical_history', 'Medical history', 'medical-history'],
    ['final_evaluation', 'Final evaluation', 'final-evaluation'],
    ['laboratory', 'Laboratory', 'laboratory'],
    ['xray', 'X-ray', 'xray'],
] as const;

export default function StaffPatientRecords({ records, filters, role }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const path = `/${role}/patient-records`;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: roleHome[role] },
        { title: 'Patient Records', href: path },
    ];

    useEffect(() => {
        const timeout = window.setTimeout(() => {
            router.get(
                path,
                { search, status, per_page: records.per_page },
                { preserveState: true, preserveScroll: true, replace: true },
            );
        }, 400);

        return () => window.clearTimeout(timeout);
    }, [path, records.per_page, search, status]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Patient Records" />
            <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
                <SearchFilterToolbar
                    className="mb-6"
                    title="Patient Record Management"
                    search={{
                        value: search,
                        onChange: (event) => setSearch(event.target.value),
                        placeholder: 'Search patient name or email...',
                        'aria-label': 'Search assigned patient records',
                    }}
                    onSubmit={(event) => event.preventDefault()}
                    sections={[
                        {
                            label: 'Status',
                            content: (
                                <select
                                    value={status}
                                    onChange={(event) =>
                                        setStatus(event.target.value)
                                    }
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                >
                                    <option value="">All statuses</option>
                                    <option value="accepted">Accepted</option>
                                    <option value="arrived">Arrived</option>
                                    <option value="for_diagnostics">
                                        For diagnostics
                                    </option>
                                    <option value="for_xray">For X-ray</option>
                                    <option value="for_final_evaluation">
                                        Final evaluation
                                    </option>
                                    <option value="completed">Completed</option>
                                </select>
                            ),
                        },
                    ]}
                />

                <div className="mb-4 flex items-center gap-3 rounded-2xl border border-moss-200 bg-moss-50 px-4 py-3 text-sm text-moss-900">
                    <FolderHeart className="size-5 shrink-0" />
                    {role === 'receptionist'
                        ? 'Administrative patient and appointment history is available here. Clinical findings and medical PDFs remain restricted.'
                        : 'Only patients in your role queue, assigned to you, or personally handled by you are shown here.'}
                </div>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[980px]">
                            <thead className="border-b border-slate-200 bg-slate-50">
                                <tr>
                                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Patient
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Visit
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Services
                                    </th>
                                    <th className="px-5 py-3 text-left text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Available records
                                    </th>
                                    <th className="px-5 py-3 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.data.map((record) => (
                                    <tr
                                        key={record.id}
                                        className="align-top hover:bg-slate-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="flex gap-3">
                                                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-moss-100 text-moss-700">
                                                    <UserRound className="size-5" />
                                                </span>
                                                <div>
                                                    <p className="font-bold text-slate-900">
                                                        {record.patient.name}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {record.patient.email}
                                                    </p>
                                                    {record.patient.contact && (
                                                        <p className="text-xs text-slate-500">
                                                            {
                                                                record.patient
                                                                    .contact
                                                            }
                                                        </p>
                                                    )}
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {[
                                                            record.patient.age
                                                                ? `${record.patient.age} years old`
                                                                : null,
                                                            record.patient.sex,
                                                        ]
                                                            .filter(Boolean)
                                                            .join(' · ') ||
                                                            'Profile details unavailable'}
                                                    </p>
                                                    {record.patient
                                                        .employee_number && (
                                                        <p className="mt-1 font-mono text-xs font-bold text-moss-700">
                                                            Company ID:{' '}
                                                            {
                                                                record.patient
                                                                    .employee_number
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-sm">
                                            <p className="font-semibold text-slate-800">
                                                {new Intl.DateTimeFormat(
                                                    'en-PH',
                                                    { dateStyle: 'medium' },
                                                ).format(
                                                    new Date(
                                                        `${record.appointment_date}T00:00:00`,
                                                    ),
                                                )}
                                            </p>
                                            <p className="mt-1 font-mono text-xs font-bold text-moss-700">
                                                {record.reference_code}
                                            </p>
                                            <div className="mt-2">
                                                <StatusBadge
                                                    status={record.status}
                                                />
                                            </div>
                                            {record.company && (
                                                <p className="mt-2 text-xs text-slate-500">
                                                    {record.company}
                                                </p>
                                            )}
                                        </td>
                                        <td className="max-w-64 px-5 py-4 text-sm text-slate-700">
                                            {record.service_types.join(', ') ||
                                                'General consultation'}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex max-w-md flex-wrap gap-2">
                                                {documentDefinitions.map(
                                                    ([key, label, section]) => {
                                                        if (
                                                            !record.documents[
                                                                key
                                                            ]
                                                        )
                                                            return null;
                                                        const href =
                                                            section ===
                                                            'laboratory'
                                                                ? `/clinical-forms/${record.id}/laboratory.pdf?preview=1`
                                                                : section ===
                                                                    'xray'
                                                                  ? `/clinical-forms/${record.id}/xray.pdf?preview=1`
                                                                  : section ===
                                                                      'physical-exam'
                                                                    ? `/clinical-forms/${record.id}/physical-exam.pdf?preview=1`
                                                                    : `/clinical-forms/${record.id}/${section}.pdf?preview=1`;
                                                        return (
                                                            <a
                                                                key={key}
                                                                href={href}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:border-moss-300 hover:bg-moss-50 hover:text-moss-800"
                                                            >
                                                                <FileHeart className="size-3.5" />
                                                                {label}
                                                            </a>
                                                        );
                                                    },
                                                )}
                                                {role === 'receptionist' ? (
                                                    <span className="text-xs font-semibold text-slate-500">
                                                        Clinical records
                                                        restricted
                                                    </span>
                                                ) : !Object.values(
                                                      record.documents,
                                                  ).some(Boolean) ? (
                                                    <span className="text-xs text-slate-400">
                                                        No forms recorded yet
                                                    </span>
                                                ) : null}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            {record.manage_url ? (
                                                <Link
                                                    href={record.manage_url}
                                                    className="inline-flex items-center gap-1.5 rounded-xl bg-moss-700 px-3 py-2 text-xs font-bold text-white hover:bg-moss-800"
                                                >
                                                    Manage record
                                                    <ExternalLink className="size-3.5" />
                                                </Link>
                                            ) : (
                                                <span className="text-xs font-semibold text-slate-400">
                                                    Read only
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                {!records.data.length && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-14 text-center"
                                        >
                                            <FolderHeart className="mx-auto size-10 text-slate-300" />
                                            <p className="mt-3 font-bold text-slate-700">
                                                No assigned patient records
                                                found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                New assignments and records you
                                                handle will appear here.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination pagination={records} label="patient records" />
                </section>
            </main>
        </AppLayout>
    );
}
