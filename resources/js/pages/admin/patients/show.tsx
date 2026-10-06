import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseBusiness,
    Mail,
    MapPin,
    Phone,
} from 'lucide-react';
import { AdminPatientMedicalReports } from '@/components/admin-patient-medical-reports';
import type { AdminPatientMedicalReport } from '@/components/admin-patient-medical-reports';
import { PatientMedicalHistory } from '@/components/patient-medical-history';
import type { PatientMedicalRecord } from '@/components/patient-medical-history';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Patient = {
    id: number;
    name: string;
    first_name: string;
    last_name: string;
    email: string;
    contact: string | null;
    company?: { company_name: string } | null;
    patient_profile?: {
        birthdate: string | null;
        age: number | null;
        sex: string | null;
        civil_status: string | null;
        address: string | null;
        employee_number: string | null;
    } | null;
};

function detailDate(value?: string | null): string {
    if (!value) return 'Not provided';
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${value.slice(0, 10)}T00:00:00`));
}

export default function AdminPatientMedicalProfile({
    patient,
    medicalRecords,
    medicalReports,
}: {
    patient: Patient;
    medicalRecords: PatientMedicalRecord[];
    medicalReports: AdminPatientMedicalReport[];
}) {
    const profile = patient.patient_profile;
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Patients', href: '/admin/patients' },
        { title: patient.name, href: `/admin/patients/${patient.id}` },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${patient.name} · Medical Profile`} />
            <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
                <Link
                    href="/admin/patients"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-moss-700"
                >
                    <ArrowLeft className="size-4" /> Back to patients
                </Link>

                <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="bg-moss-700 p-6 text-white sm:p-8">
                        <p className="text-xs font-semibold tracking-[.15em] text-moss-100 uppercase">
                            Patient Profile
                        </p>
                        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
                            {patient.name}
                        </h1>
                        <p className="mt-1 text-sm text-moss-100">
                            Patient #{String(patient.id).padStart(4, '0')}
                            {profile?.employee_number
                                ? ` · Employee ${profile.employee_number}`
                                : ''}
                        </p>
                    </div>

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
                            icon={<BriefcaseBusiness className="size-4" />}
                            label="Personal details"
                            value={`${profile?.sex ?? 'Not specified'} · ${profile?.age ?? 'Age unavailable'}${typeof profile?.age === 'number' ? ' years old' : ''} · ${profile?.civil_status ?? 'Civil status unavailable'}`}
                        />
                        <ProfileDetail
                            icon={<MapPin className="size-4" />}
                            label="Address"
                            value={profile?.address ?? 'Not provided'}
                        />
                        <ProfileDetail
                            label="Birthdate"
                            value={detailDate(profile?.birthdate)}
                        />
                        {patient.company?.company_name && (
                            <ProfileDetail
                                label="Company"
                                value={patient.company.company_name}
                            />
                        )}
                    </div>
                </section>

                <section>
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
                            Vital Signs History
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            The latest recorded height, weight, BMI, blood
                            pressure, pulse, respiration, temperature, vision,
                            and hearing.
                        </p>
                    </div>
                    <PatientMedicalHistory records={medicalRecords} />
                </section>

                <section>
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold text-slate-950 dark:text-slate-100">
                            Medical Reports and Assigned Staff
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            All available reports for every visit, including the
                            assigned doctor and clinical staff who handled each
                            service.
                        </p>
                    </div>
                    <AdminPatientMedicalReports reports={medicalReports} />
                </section>
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
