import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    BriefcaseMedical,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    Download,
    FileClock,
    FileHeart,
    FlaskConical,
    Hash,
    HeartPulse,
    ScanLine,
    Stethoscope,
    UserRound,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import {
    appointmentStatusLabel,
    examinationPurposeLabel,
} from '@/lib/appointment-status';

type LaboratorySection = {
    label: string;
    column: string;
};

type AppointmentRecordProps = {
    appointment: any;
    appointmentsIndexUrl: string;
    laboratorySections: Record<string, LaboratorySection>;
};

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function formatTime(value?: string | null): string {
    if (!value) return 'Time not assigned';

    const [hours, minutes] = value.split(':').map(Number);
    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(2000, 0, 1, hours, minutes));
}

function visitTypeLabel(value: string): string {
    const labels: Record<string, string> = {
        individual: 'Individual appointment',
        company_referral: 'Company referral',
        company_bulk: 'Company bulk appointment',
        walk_in: 'Walk-in',
    };

    return labels[value] ?? value.replaceAll('_', ' ');
}

export default function AppointmentRecord({
    appointment,
    appointmentsIndexUrl,
    laboratorySections = {},
}: AppointmentRecordProps) {
    const patient = appointment.user;
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const profile = patient.patient_profile;
    const services: string[] = appointment.service_types ?? [];
    const laboratoryEntries = Object.entries(laboratorySections);
    const patientDocumentsAvailable =
        auth.user.role !== 'patient' || appointment.status === 'completed';
    const peDocumentsAvailable =
        patientDocumentsAvailable &&
        (auth.user.role !== 'patient' ||
            !services.includes('PE') ||
            Boolean(appointment.medical_examination?.released_at));
    const patientName = [
        patient.first_name,
        patient.middle_name,
        patient.last_name,
    ]
        .filter(Boolean)
        .join(' ');
    const documents = [
        ...(services.includes('PE')
            ? [
                  {
                      key: 'physical-exam',
                      icon: <Stethoscope />,
                      title: 'Complete PE Report',
                      description:
                          'PE summary and completed diagnostic results',
                      ready:
                          Boolean(appointment.physical_exam) &&
                          peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/physical-exam.pdf`,
                  },
                  {
                      key: 'medical-history',
                      icon: <ClipboardList />,
                      title: 'Medical History',
                      description: 'Reported health and medical history',
                      ready:
                          Boolean(appointment.medical_history) &&
                          peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/medical-history.pdf`,
                  },
                  {
                      key: 'physical-findings',
                      icon: <Stethoscope />,
                      title: 'Physical Examination',
                      description: 'Vital signs and physical findings',
                      ready:
                          Boolean(appointment.physical_exam) &&
                          peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/physical-findings.pdf`,
                  },
                  {
                      key: 'final-evaluation',
                      icon: <HeartPulse />,
                      title: 'Final Medical Evaluation',
                      description:
                          'Classification, diagnosis, and recommendations',
                      ready:
                          Boolean(
                              appointment.medical_examination?.finalized_at,
                          ) && peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/final-evaluation.pdf`,
                  },
              ]
            : []),
        ...laboratoryEntries.map(([key, section]) => ({
            key: `laboratory-${key}`,
            icon: <FlaskConical />,
            title: `${section.label} Result`,
            description: 'Verified laboratory findings and remarks',
            ready:
                Boolean(appointment.lab_result?.[section.column]) &&
                peDocumentsAvailable,
            href: `/clinical-forms/${appointment.id}/laboratory/${key}.pdf`,
        })),
        ...(laboratoryEntries.length > 1
            ? [
                  {
                      key: 'combined-laboratory',
                      icon: <FlaskConical />,
                      title: 'Combined Laboratory Report',
                      description:
                          'All requested laboratory results in one file',
                      ready:
                          Boolean(appointment.lab_result) &&
                          peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/laboratory.pdf`,
                  },
              ]
            : []),
        ...(services.includes('X-Ray')
            ? [
                  {
                      key: 'xray',
                      icon: <ScanLine />,
                      title: 'X-Ray Report',
                      description: 'Radiographic findings and impression',
                      ready:
                          Boolean(appointment.xray_report) &&
                          peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/xray.pdf`,
                  },
              ]
            : []),
    ];
    const completedDocuments = documents.filter(
        (document) => document.ready,
    ).length;

    return (
        <>
            <Head title={`${patientName} · Medical Record`} />
            <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link
                        href={appointmentsIndexUrl}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-moss-300 hover:bg-moss-50 hover:text-moss-800 dark:border-border dark:bg-card dark:text-slate-200"
                    >
                        <ArrowLeft className="size-4" />
                        Back to appointments
                    </Link>
                    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-border dark:bg-card dark:text-slate-300">
                        <Hash className="size-3.5" /> Record {appointment.id}
                    </span>
                </div>

                <header className="relative overflow-hidden rounded-3xl bg-moss-700 p-6 text-white shadow-xl shadow-moss-900/10 sm:p-8">
                    <div className="absolute -top-20 -right-16 size-64 rounded-full border-[36px] border-white/5" />
                    <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5 blur-2xl" />
                    <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <div className="flex items-center gap-4">
                                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                                    <FileHeart className="size-7" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-moss-100">
                                        Patient medical record
                                    </p>
                                    <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                                        {patientName}
                                    </h1>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-2">
                                <PatientChip
                                    icon={<UserRound />}
                                    label={profile?.sex ?? 'Sex not provided'}
                                />
                                <PatientChip
                                    icon={<CalendarDays />}
                                    label={
                                        profile?.age !== null &&
                                        profile?.age !== undefined
                                            ? `${profile.age} years old`
                                            : 'Age not provided'
                                    }
                                />
                                {patient.email && (
                                    <PatientChip label={patient.email} />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3 lg:justify-end">
                            <HeroStat
                                label="Appointment"
                                value={`#${appointment.id}`}
                            />
                            <HeroStat
                                label="Status"
                                value={appointmentStatusLabel(
                                    appointment.status,
                                )}
                                highlighted
                            />
                        </div>
                    </div>
                </header>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-border dark:bg-card">
                    <div className="mb-5 flex items-center gap-3">
                        <span className="grid size-10 place-items-center rounded-xl bg-moss-100 text-moss-700 dark:bg-moss-950 dark:text-moss-300">
                            <BriefcaseMedical className="size-5" />
                        </span>
                        <div>
                            <h2 className="font-bold text-slate-950 dark:text-slate-100">
                                Visit overview
                            </h2>
                            <p className="text-sm text-slate-500">
                                Scheduling and examination details
                            </p>
                        </div>
                    </div>

                    <div className="grid gap-px overflow-hidden rounded-2xl border border-slate-200 bg-slate-200 sm:grid-cols-2 lg:grid-cols-4 dark:border-border dark:bg-border">
                        <InfoItem
                            icon={<CalendarDays />}
                            label="Scheduled date"
                            value={formatDate(appointment.appointment_date)}
                            detail={formatTime(appointment.start_time)}
                        />
                        <InfoItem
                            icon={<Stethoscope />}
                            label="Examination purpose"
                            value={examinationPurposeLabel(
                                appointment.examination_purpose,
                            )}
                        />
                        <InfoItem
                            icon={<UserRound />}
                            label="Visit type"
                            value={visitTypeLabel(appointment.type)}
                        />
                        <InfoItem
                            icon={<Building2 />}
                            label="Company"
                            value={
                                appointment.company?.company_name ??
                                'Not applicable'
                            }
                        />
                    </div>

                    <div className="mt-5">
                        <p className="text-xs font-bold tracking-wider text-slate-500 uppercase">
                            Requested services
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {services.length ? (
                                services.map((service) => (
                                    <span
                                        key={service}
                                        className="rounded-full border border-moss-200 bg-moss-50 px-3 py-1.5 text-xs font-semibold text-moss-800 dark:border-moss-800 dark:bg-moss-950/50 dark:text-moss-200"
                                    >
                                        {service}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-slate-500">
                                    No services recorded
                                </span>
                            )}
                        </div>
                    </div>
                </section>

                <section>
                    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold tracking-wider text-moss-700 uppercase dark:text-moss-300">
                                Documents
                            </p>
                            <h2 className="mt-1 text-xl font-bold text-slate-950 dark:text-slate-100">
                                Clinical forms
                            </h2>
                        </div>
                        <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {completedDocuments} of {documents.length} available
                        </span>
                    </div>

                    {documents.length ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {documents.map(({ key, ...document }) => (
                                <DocumentCard key={key} {...document} />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-border dark:bg-card">
                            <FileClock className="mx-auto size-8 text-slate-400" />
                            <p className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
                                No clinical forms requested
                            </p>
                        </div>
                    )}
                </section>
            </main>
        </>
    );
}

function PatientChip({
    icon,
    label,
}: {
    icon?: React.ReactNode;
    label: string;
}) {
    return (
        <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold text-white ring-1 ring-white/15 backdrop-blur-sm">
            {icon && <span className="[&>svg]:size-3.5">{icon}</span>}
            <span className="truncate">{label}</span>
        </span>
    );
}

function HeroStat({
    label,
    value,
    highlighted = false,
}: {
    label: string;
    value: string;
    highlighted?: boolean;
}) {
    return (
        <div
            className={`min-w-32 rounded-2xl px-4 py-3 ring-1 backdrop-blur-sm ${
                highlighted
                    ? 'bg-white text-moss-900 ring-white'
                    : 'bg-white/10 text-white ring-white/15'
            }`}
        >
            <p
                className={`text-[10px] font-bold tracking-wider uppercase ${highlighted ? 'text-moss-600' : 'text-moss-100'}`}
            >
                {label}
            </p>
            <p className="mt-1 text-sm font-bold capitalize">{value}</p>
        </div>
    );
}

function InfoItem({
    icon,
    label,
    value,
    detail,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    detail?: string;
}) {
    return (
        <div className="min-w-0 bg-white p-4 dark:bg-card">
            <span className="text-moss-600 dark:text-moss-300 [&>svg]:size-4">
                {icon}
            </span>
            <p className="mt-3 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                {label}
            </p>
            <p
                className="mt-1 truncate text-sm font-bold text-slate-900 dark:text-slate-100"
                title={value}
            >
                {value}
            </p>
            {detail && (
                <p className="mt-0.5 text-xs text-slate-500">{detail}</p>
            )}
        </div>
    );
}

function DocumentCard({
    icon,
    title,
    description,
    ready,
    href,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    ready: boolean;
    href: string;
}) {
    return (
        <article
            className={`group flex min-h-56 flex-col rounded-3xl border p-5 transition ${
                ready
                    ? 'border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-moss-300 hover:shadow-lg hover:shadow-moss-900/5 dark:border-border dark:bg-card'
                    : 'border-slate-200/80 bg-slate-50/70 dark:border-border dark:bg-card/60'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <span
                    className={`grid size-11 place-items-center rounded-2xl [&>svg]:size-5 ${
                        ready
                            ? 'bg-moss-100 text-moss-700 dark:bg-moss-950 dark:text-moss-300'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                    }`}
                >
                    {icon}
                </span>
                <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                        ready
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                >
                    {ready ? (
                        <CheckCircle2 className="size-3" />
                    ) : (
                        <Clock3 className="size-3" />
                    )}
                    {ready ? 'Available' : 'Pending'}
                </span>
            </div>
            <h3 className="mt-4 font-bold text-slate-950 dark:text-slate-100">
                {title}
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
            </p>
            <div className="mt-auto pt-5">
                {ready ? (
                    <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss-800 focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none"
                    >
                        <Download className="size-4" />
                        View or download PDF
                    </a>
                ) : (
                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-2.5 text-center text-xs font-semibold text-slate-400 dark:border-slate-700">
                        Awaiting completion
                    </div>
                )}
            </div>
        </article>
    );
}

AppointmentRecord.layout = (
    page: React.ReactElement<AppointmentRecordProps>,
) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Appointments',
                href: page.props.appointmentsIndexUrl,
            },
            { title: 'Medical record', href: '' },
        ]}
    >
        {page}
    </AppLayout>
);
