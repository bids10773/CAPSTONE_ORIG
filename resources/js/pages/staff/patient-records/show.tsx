import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    CalendarDays,
    ExternalLink,
    FileHeart,
    Mail,
    MapPin,
    Phone,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { MedicalReportCards } from '@/components/admin-patient-medical-reports';
import type { MedicalReportSet } from '@/components/admin-patient-medical-reports';
import { StatusBadge } from '@/components/status-badge';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Role = 'doctor' | 'medtech' | 'radtech' | 'receptionist';

type Patient = {
    id: number;
    name: string;
    patient_reference_code: string;
    email: string;
    contact: string | null;
    company: string | null;
    profile: {
        birthdate: string | null;
        age: number | null;
        sex: string | null;
        civil_status: string | null;
        address: string | null;
        employee_number: string | null;
    } | null;
};

type RecordItem = {
    id: number;
    reference_code: string;
    appointment_date: string;
    status: string;
    service_types: string[];
    company?: string | null;
    reports: MedicalReportSet;
    manage_url?: string | null;
};

const roleHome: Record<Role, string> = {
    doctor: '/doctor/dashboard',
    medtech: '/medtech/dashboard',
    radtech: '/radtech/dashboard',
    receptionist: '/receptionist/dashboard',
};

function formatDate(value?: string | null): string {
    if (!value) return 'Not provided';

    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
    }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export default function StaffPatientRecordShow({
    patient,
    records,
    role,
}: {
    patient: Patient;
    records: RecordItem[];
    role: Role;
}) {
    const [activeTab, setActiveTab] = useState<'details' | 'records'>(
        'records',
    );
    const recordsPath = `/${role}/patient-records`;
    const profile = patient.profile;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: roleHome[role] },
        { title: 'Patient Records', href: recordsPath },
        { title: patient.name, href: `${recordsPath}/${patient.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${patient.name} · Patient Record`} />
            <main className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
                <Link
                    href={recordsPath}
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-moss-700"
                >
                    <ArrowLeft className="size-4" /> Back to patient records
                </Link>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="bg-moss-700 p-6 text-white sm:p-8">
                        <p className="text-xs font-semibold tracking-[.15em] text-moss-100 uppercase">
                            Patient Record
                        </p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                            {patient.name}
                        </h1>
                        <p className="mt-1 text-sm text-moss-100">
                            {patient.patient_reference_code}
                            {profile?.employee_number
                                ? ` · Company Employee No. ${profile.employee_number}`
                                : ''}
                        </p>
                    </div>

                    {activeTab === 'details' && (
                        <div className="grid gap-4 p-5 text-sm sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
                            <ProfileDetail
                                icon={<Mail className="size-4" />}
                                label="Email"
                                value={patient.email}
                            />
                            <ProfileDetail
                                icon={<Phone className="size-4" />}
                                label="Contact"
                                value={patient.contact ?? 'Not provided'}
                            />
                            <ProfileDetail
                                icon={<UserRound className="size-4" />}
                                label="Personal details"
                                value={`${profile?.sex ?? 'Not specified'} · ${profile?.age ?? 'Age unavailable'}${typeof profile?.age === 'number' ? ' years old' : ''} · ${profile?.civil_status ?? 'Civil status unavailable'}`}
                            />
                            <ProfileDetail
                                icon={<MapPin className="size-4" />}
                                label="Address"
                                value={profile?.address ?? 'Not provided'}
                            />
                            <ProfileDetail
                                icon={<CalendarDays className="size-4" />}
                                label="Birthdate"
                                value={formatDate(profile?.birthdate)}
                            />
                            <ProfileDetail
                                icon={<BriefcaseBusiness className="size-4" />}
                                label="Company"
                                value={patient.company ?? 'Not provided'}
                            />
                        </div>
                    )}
                </section>

                <nav
                    aria-label="Patient record sections"
                    className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm sm:inline-grid sm:grid-cols-2 dark:border-border dark:bg-card"
                >
                    <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${activeTab === 'details' ? 'bg-moss-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-muted'}`}
                    >
                        <UserRound className="size-4" /> Patient Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('records')}
                        className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${activeTab === 'records' ? 'bg-moss-700 text-white' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-muted'}`}
                    >
                        <FileHeart className="size-4" /> Medical Records
                    </button>
                </nav>

                {activeTab === 'records' && (
                    <section className="space-y-4">
                        <div>
                            <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
                                Medical records
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Only visits and documents available to your role
                                are shown.
                            </p>
                        </div>

                        {records.map((record) => {
                            return (
                                <article
                                    key={record.id}
                                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card"
                                >
                                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <h3 className="font-semibold text-slate-950 dark:text-slate-100">
                                                    {formatDate(
                                                        record.appointment_date,
                                                    )}
                                                </h3>
                                                <StatusBadge
                                                    status={record.status}
                                                />
                                            </div>
                                            <p className="mt-1 font-mono text-xs font-semibold text-moss-700">
                                                {record.reference_code}
                                            </p>
                                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                                {record.service_types.join(
                                                    ', ',
                                                ) || 'General consultation'}
                                                {record.company
                                                    ? ` · ${record.company}`
                                                    : ''}
                                            </p>
                                        </div>
                                        {record.manage_url && (
                                            <Link
                                                href={record.manage_url}
                                                className="inline-flex w-fit items-center gap-1.5 rounded-xl bg-moss-700 px-3 py-2 text-xs font-bold text-white hover:bg-moss-800"
                                            >
                                                Manage record
                                                <ExternalLink className="size-3.5" />
                                            </Link>
                                        )}
                                    </div>

                                    <div className="mt-4 border-t border-slate-100 pt-4 dark:border-border">
                                        {role === 'receptionist' ? (
                                            <p className="text-sm text-slate-500">
                                                Clinical documents are
                                                restricted for receptionist
                                                accounts.
                                            </p>
                                        ) : (
                                            <MedicalReportCards
                                                reports={record.reports}
                                            />
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </section>
                )}
            </main>
        </AppLayout>
    );
}

function ProfileDetail({
    icon,
    label,
    value,
}: {
    icon?: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="min-w-0 rounded-xl bg-slate-50 p-4 dark:bg-muted/40">
            <p className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {icon}
                {label}
            </p>
            <p className="mt-1.5 font-medium break-words text-slate-900 dark:text-slate-100">
                {value}
            </p>
        </div>
    );
}
