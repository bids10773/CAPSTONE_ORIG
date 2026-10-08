import { Head, Link, router } from '@inertiajs/react';
import { ExternalLink, FolderHeart, UserRound } from 'lucide-react';
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
        id: number;
        name: string;
        patient_reference_code: string;
    };
    company?: string | null;
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
                        placeholder:
                            'Search patient or visit code, name, email, or employee number...',
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
                        <table className="w-full min-w-[760px]">
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
                                    <th className="px-5 py-3 text-right text-xs font-bold tracking-wider text-slate-500 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {records.data.map((record) => {
                                    const destination = `${path}/${record.patient.id}`;

                                    return (
                                        <tr
                                            key={record.id}
                                            role="link"
                                            tabIndex={0}
                                            aria-label={`Open ${record.patient.name}'s patient details and medical records`}
                                            className="cursor-pointer align-top transition-colors hover:bg-slate-50/70 focus-visible:bg-moss-50/60 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-moss-600"
                                            onClick={(event) => {
                                                if (
                                                    (
                                                        event.target as HTMLElement
                                                    ).closest(
                                                        'a, button, input, select, textarea, [role="button"]',
                                                    )
                                                ) {
                                                    return;
                                                }

                                                router.visit(destination);
                                            }}
                                            onKeyDown={(event) => {
                                                if (
                                                    event.target !==
                                                    event.currentTarget
                                                ) {
                                                    return;
                                                }

                                                if (
                                                    event.key === 'Enter' ||
                                                    event.key === ' '
                                                ) {
                                                    event.preventDefault();
                                                    router.visit(destination);
                                                }
                                            }}
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex gap-3">
                                                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-moss-100 text-moss-700">
                                                        <UserRound className="size-5" />
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-slate-900">
                                                            {
                                                                record.patient
                                                                    .name
                                                            }
                                                        </p>
                                                        <p className="font-mono text-xs font-bold text-moss-700">
                                                            {
                                                                record.patient
                                                                    .patient_reference_code
                                                            }
                                                        </p>
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
                                                {record.service_types.join(
                                                    ', ',
                                                ) || 'General consultation'}
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
                                    );
                                })}
                                {!records.data.length && (
                                    <tr>
                                        <td
                                            colSpan={4}
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
