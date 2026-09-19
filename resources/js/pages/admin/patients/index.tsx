import { Head, router } from '@inertiajs/react';
import { CalendarDays, Mail, MapPin, Phone, UsersRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Pagination } from '@/components/pagination';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type { PaginatedResponse } from '@/types/pagination';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Patients', href: '/admin/patients' },
];

type Patient = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    contact: string | null;
    created_at: string;
    email_verified_at: string | null;
    has_account: boolean;
    appointments_count: number;
    is_online: boolean;
    last_active_at: string | null;
    profile: {
        birthdate: string | null;
        age: number | null;
        sex: string | null;
        civil_status: string | null;
        address: string | null;
        employee_number: string | null;
    } | null;
};

type Props = {
    patients: PaginatedResponse<Patient>;
    filters: { search: string; presence: string };
};

function fullName(patient: Patient): string {
    return [patient.first_name, patient.middle_name, patient.last_name]
        .filter(Boolean)
        .join(' ');
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function lastActiveLabel(patient: Patient): string {
    if (patient.is_online) return 'Active now';
    if (!patient.last_active_at) return 'No recent session';

    return `Last active ${new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(patient.last_active_at))}`;
}

function TruncatedText({
    value,
    className,
}: {
    value: string;
    className?: string;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span className={`block truncate ${className ?? ''}`}>
                    {value}
                </span>
            </TooltipTrigger>
            <TooltipContent
                side="top"
                className="max-w-xs border border-moss-700 bg-moss-950 text-white shadow-lg [&>svg]:fill-moss-950"
            >
                {value}
            </TooltipContent>
        </Tooltip>
    );
}

export default function AdminPatientsIndex({ patients, filters }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [presence, setPresence] = useState(filters.presence ?? '');

    useEffect(() => {
        const debounce = window.setTimeout(() => {
            router.get(
                '/admin/patients',
                {
                    search: search || undefined,
                    presence: presence || undefined,
                    per_page: patients.per_page,
                    page: 1,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                },
            );
        }, 300);

        return () => window.clearTimeout(debounce);
    }, [search, presence, patients.per_page]);

    useEffect(() => {
        const refresh = window.setInterval(() => {
            router.reload({ only: ['patients'] });
        }, 60_000);

        return () => window.clearInterval(refresh);
    }, []);

    return (
        <>
            <Head title="Patient Management" />

            <main className="mx-auto max-w-[1600px] space-y-4 p-4 sm:p-6">
                <SearchFilterToolbar
                    title="Patients"
                    search={{
                        value: search,
                        onChange: (event) => setSearch(event.target.value),
                        placeholder:
                            'Search patient name, email, contact, address, or employee number...',
                        'aria-label': 'Search patients',
                    }}
                    onSubmit={(event) => event.preventDefault()}
                    sections={[
                        {
                            label: 'Presence',
                            content: (
                                <select
                                    value={presence}
                                    onChange={(event) =>
                                        setPresence(event.target.value)
                                    }
                                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-input dark:bg-card"
                                >
                                    <option value="">Online and offline</option>
                                    <option value="online">Online only</option>
                                    <option value="offline">
                                        Offline only
                                    </option>
                                </select>
                            ),
                        },
                    ]}
                />

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    {patients.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[1200px] table-fixed text-left text-sm">
                                    <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase dark:border-border dark:bg-muted dark:text-slate-400">
                                        <tr>
                                            <th className="w-[7%] px-4 py-3">
                                                ID
                                            </th>
                                            <th className="w-[17%] px-4 py-3">
                                                Patient
                                            </th>
                                            <th className="w-[17%] px-4 py-3">
                                                Contact
                                            </th>
                                            <th className="w-[14%] px-4 py-3">
                                                Personal Details
                                            </th>
                                            <th className="w-[13%] px-4 py-3">
                                                Address
                                            </th>
                                            <th className="w-[11%] px-4 py-3 text-center whitespace-nowrap">
                                                Appointments
                                            </th>
                                            <th className="w-[10%] px-4 py-3 whitespace-nowrap">
                                                Account
                                            </th>
                                            <th className="w-[11%] px-4 py-3 whitespace-nowrap">
                                                Presence
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-border">
                                        {patients.data.map((patient) => (
                                            <tr
                                                key={patient.id}
                                                className="transition-colors hover:bg-moss-50/60 dark:hover:bg-moss-900/25"
                                            >
                                                <td className="px-4 py-3 font-semibold text-slate-500 dark:text-slate-400">
                                                    #
                                                    {String(
                                                        patient.id,
                                                    ).padStart(4, '0')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-moss-100 text-xs font-bold text-moss-700 dark:bg-moss-900 dark:text-moss-300">
                                                            {patient.first_name.charAt(
                                                                0,
                                                            )}
                                                            {patient.last_name.charAt(
                                                                0,
                                                            )}
                                                            <span
                                                                role="status"
                                                                aria-label={
                                                                    patient.is_online
                                                                        ? 'Active now'
                                                                        : 'Offline'
                                                                }
                                                                title={
                                                                    patient.is_online
                                                                        ? 'Active now'
                                                                        : 'Offline'
                                                                }
                                                                className={`absolute -right-0.5 -bottom-0.5 size-3 rounded-full border-2 border-white dark:border-card ${patient.is_online ? 'bg-emerald-500' : 'bg-slate-400'}`}
                                                            />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <TruncatedText
                                                                value={fullName(
                                                                    patient,
                                                                )}
                                                                className="font-semibold text-slate-900 dark:text-slate-100"
                                                            />
                                                            <p className="mt-0.5 text-xs text-slate-400">
                                                                Joined{' '}
                                                                {formatDate(
                                                                    patient.created_at,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="flex min-w-0 items-center gap-2 text-slate-700 dark:text-slate-200">
                                                        <Mail className="size-3.5 shrink-0 text-moss-600" />
                                                        <TruncatedText
                                                            value={
                                                                patient.email
                                                            }
                                                            className="min-w-0"
                                                        />
                                                    </p>
                                                    <div className="mt-1 flex min-w-0 items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                        <Phone className="size-3.5 shrink-0" />
                                                        <TruncatedText
                                                            value={
                                                                patient.contact ??
                                                                'No contact number'
                                                            }
                                                            className="min-w-0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-slate-700 dark:text-slate-200">
                                                    <TruncatedText
                                                        value={`${patient.profile?.sex ?? 'Not specified'}${patient.profile?.age ? ` · ${patient.profile.age} years old` : ''}`}
                                                    />
                                                    <TruncatedText
                                                        value={`${patient.profile?.civil_status ?? 'Civil status unavailable'}${patient.profile?.employee_number ? ` · Employee ${patient.profile.employee_number}` : ''}`}
                                                        className="mt-1 text-xs text-slate-500 dark:text-slate-400"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex min-w-0 items-start gap-2 text-slate-600 dark:text-slate-300">
                                                        <MapPin className="mt-0.5 size-3.5 shrink-0 text-moss-600" />
                                                        <TruncatedText
                                                            value={
                                                                patient.profile
                                                                    ?.address ??
                                                                'No address provided'
                                                            }
                                                            className="min-w-0"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-100">
                                                        <CalendarDays className="size-4 text-moss-600" />
                                                        {patient.appointments_count.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                                                            patient.has_account
                                                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                                        }`}
                                                    >
                                                        {patient.has_account
                                                            ? 'Has account'
                                                            : 'No account'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p
                                                        className={`font-semibold ${patient.is_online ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
                                                    >
                                                        {patient.is_online
                                                            ? 'Online'
                                                            : 'Offline'}
                                                    </p>
                                                    <TruncatedText
                                                        value={lastActiveLabel(
                                                            patient,
                                                        )}
                                                        className="mt-1 text-[11px] leading-4 text-slate-400"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <Pagination
                                pagination={patients}
                                label="patients"
                            />
                        </>
                    ) : (
                        <div className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
                            <UsersRound className="size-10 text-slate-300" />
                            <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                No patients found
                            </p>
                            <p className="mt-1 text-sm text-slate-400">
                                Try changing the search or presence filter.
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

AdminPatientsIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
