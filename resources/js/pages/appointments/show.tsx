import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    CircleX,
    Clock3,
    Download,
    FileClock,
    FileHeart,
    FlaskConical,
    ScanLine,
    Stethoscope,
    UserRound,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { appointmentStatusLabel } from '@/lib/appointment-status';

type LaboratorySection = {
    label: string;
    column: string;
};

type AppointmentRecordProps = {
    appointment: any;
    appointmentsIndexUrl: string;
    completePeReadyForPickup: boolean;
    laboratorySections: Record<string, LaboratorySection>;
};

export default function AppointmentRecord({
    appointment,
    appointmentsIndexUrl,
    completePeReadyForPickup,
    laboratorySections = {},
}: AppointmentRecordProps) {
    const patient = appointment.user;
    const { auth } = usePage().props as { auth: { user: { role: string } } };
    const profile = patient.patient_profile;
    const companyEmployeeId =
        auth.user.role === 'company' ? profile?.employee_number : null;
    const displayedRecordId = companyEmployeeId ?? appointment.reference_code;
    const displayedRecordIdLabel = companyEmployeeId
        ? 'Company Employee No.'
        : 'Appointment';
    const services: string[] = appointment.service_types ?? [];
    const includesPe = services.includes('PE');
    const laboratoryEntries = Object.entries(laboratorySections);
    const isPatientViewer = auth.user.role === 'patient';
    const isPortalRecordViewer = ['patient', 'company'].includes(
        auth.user.role,
    );
    const patientDocumentsAvailable =
        !isPortalRecordViewer || appointment.status === 'completed';
    const peDocumentsAvailable =
        patientDocumentsAvailable &&
        (!isPortalRecordViewer ||
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
        ...(includesPe
            ? [
                  {
                      key: 'physical-exam',
                      icon: <Stethoscope />,
                      title: 'Complete Medical Examination Report',
                      description:
                          'Complete examination summary and diagnostic results',
                      ready: isPatientViewer
                          ? completePeReadyForPickup
                          : Boolean(appointment.physical_exam) &&
                            peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/physical-exam.pdf`,
                  },
              ]
            : []),
        ...(!includesPe && laboratoryEntries.length > 0
            ? [
                  {
                      key: 'laboratory',
                      icon: <FlaskConical />,
                      title: 'Laboratory Report',
                      description:
                          'All requested laboratory results in one file',
                      ready:
                          Boolean(appointment.lab_result) &&
                          (!isPortalRecordViewer ||
                              Boolean(appointment.lab_result?.finalized_at) ||
                              appointment.lab_result?.status === 'finalized') &&
                          peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/laboratory.pdf`,
                  },
              ]
            : []),
        ...(!includesPe && services.includes('X-Ray')
            ? [
                  {
                      key: 'xray',
                      icon: <ScanLine />,
                      title: 'X-Ray Report',
                      description: 'Radiographic findings and impression',
                      ready:
                          Boolean(appointment.xray_report) &&
                          (!isPortalRecordViewer ||
                              (appointment.xray_report?.status ===
                                  'completed' &&
                                  Boolean(
                                      appointment.xray_report?.is_completed,
                                  ) &&
                                  Boolean(
                                      appointment.xray_report?.verified_at,
                                  ))) &&
                          peDocumentsAvailable,
                      href: `/clinical-forms/${appointment.id}/xray.pdf`,
                  },
              ]
            : []),
    ];
    const completedDocuments = documents.filter(
        (document) => document.ready,
    ).length;
    const unavailableDocumentLabel =
        appointment.status === 'cancelled'
            ? 'Appointment cancelled'
            : appointment.status === 'rejected'
              ? 'Appointment rejected'
              : undefined;

    return (
        <>
            <Head
                title={
                    isPatientViewer
                        ? `Medical Record · ${displayedRecordId}`
                        : `${patientName} · Medical Record`
                }
            />
            <div className="mx-auto max-w-[1500px] space-y-4 px-4 pt-2 pb-4 sm:px-6 sm:pt-3 sm:pb-6 lg:px-8 lg:pt-4 lg:pb-8">
                <div>
                    <Link
                        href={appointmentsIndexUrl}
                        className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-moss-300 hover:bg-moss-50 hover:text-moss-800 dark:border-border dark:bg-card dark:text-slate-200"
                    >
                        <ArrowLeft className="size-4" />
                        Back to appointments
                    </Link>
                </div>

                <header className="relative overflow-hidden rounded-3xl bg-moss-700 p-5 text-white shadow-xl shadow-moss-900/10 sm:p-6">
                    <div className="absolute -top-20 -right-16 size-64 rounded-full border-[36px] border-white/5" />
                    <div className="absolute -bottom-24 left-1/3 size-56 rounded-full bg-white/5 blur-2xl" />
                    <div className="relative grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                        <div>
                            <div className="flex items-center gap-4">
                                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur-sm">
                                    <FileHeart className="size-6" />
                                </span>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-moss-100">
                                        {isPatientViewer
                                            ? 'Your visit record'
                                            : 'Patient medical record'}
                                    </p>
                                    <h1 className="mt-1 truncate text-2xl font-bold tracking-tight sm:text-3xl">
                                        {isPatientViewer
                                            ? 'Medical record'
                                            : patientName}
                                    </h1>
                                </div>
                            </div>
                            {isPatientViewer ? (
                                <p className="mt-2 max-w-xl text-sm leading-6 text-moss-100">
                                    Review the visit details and available
                                    clinical forms from this appointment.
                                </p>
                            ) : (
                                <div className="mt-6 flex flex-wrap gap-2">
                                    <PatientChip
                                        icon={<UserRound />}
                                        label={
                                            profile?.sex ?? 'Sex not provided'
                                        }
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
                            )}
                        </div>

                        <div className="flex flex-wrap gap-3 lg:justify-end">
                            <HeroStat
                                label={displayedRecordIdLabel}
                                value={displayedRecordId}
                            />
                            <HeroStat
                                label="Status"
                                value={appointmentStatusLabel(
                                    appointment.status,
                                )}
                                highlighted
                                destructive={['cancelled', 'rejected'].includes(
                                    appointment.status,
                                )}
                            />
                        </div>
                    </div>
                </header>

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
                            {unavailableDocumentLabel ??
                                `${completedDocuments} of ${documents.length} available`}
                        </span>
                    </div>

                    {documents.length ? (
                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {documents.map(({ key, ...document }) => (
                                <DocumentCard
                                    key={key}
                                    {...document}
                                    appointmentId={appointment.id}
                                    patientViewer={isPatientViewer}
                                    unavailableLabel={unavailableDocumentLabel}
                                />
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
            </div>
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
    destructive = false,
}: {
    label: string;
    value: string;
    highlighted?: boolean;
    destructive?: boolean;
}) {
    return (
        <div
            className={`min-w-32 rounded-2xl px-4 py-2.5 ring-1 backdrop-blur-sm ${
                destructive
                    ? 'bg-red-50 text-red-900 ring-red-200 dark:bg-red-950/70 dark:text-red-100 dark:ring-red-800'
                    : highlighted
                      ? 'bg-white text-moss-900 ring-white'
                      : 'bg-white/10 text-white ring-white/15'
            }`}
        >
            <p
                className={`text-[10px] font-bold tracking-wider uppercase ${
                    destructive
                        ? 'text-red-600 dark:text-red-300'
                        : highlighted
                          ? 'text-moss-600'
                          : 'text-moss-100'
                }`}
            >
                {label}
            </p>
            <p className="mt-1 text-sm font-bold capitalize">{value}</p>
        </div>
    );
}

function DocumentCard({
    icon,
    title,
    description,
    ready,
    href,
    appointmentId,
    unavailableLabel,
    patientViewer,
}: {
    icon: React.ReactNode;
    title: string;
    description: string;
    ready: boolean;
    href: string;
    appointmentId: number;
    unavailableLabel?: string;
    patientViewer: boolean;
}) {
    return (
        <article
            className={`group flex min-h-56 flex-col rounded-3xl border p-5 transition ${
                ready
                    ? 'border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-moss-300 hover:shadow-lg hover:shadow-moss-900/5 dark:border-border dark:bg-card'
                    : unavailableLabel
                      ? 'border-red-200 bg-red-50/60 dark:border-red-900 dark:bg-red-950/30'
                      : 'border-slate-200/80 bg-slate-50/70 dark:border-border dark:bg-card/60'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <span
                    className={`grid size-11 place-items-center rounded-2xl [&>svg]:size-5 ${
                        ready
                            ? 'bg-moss-100 text-moss-700 dark:bg-moss-950 dark:text-moss-300'
                            : unavailableLabel
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : 'bg-slate-200 text-slate-500 dark:bg-slate-800'
                    }`}
                >
                    {icon}
                </span>
                <span
                    className={`status-text-only inline-flex items-center gap-1.5 text-[10px] font-bold uppercase ${
                        ready
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                            : unavailableLabel
                              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                              : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                >
                    {ready ? (
                        <CheckCircle2 className="size-3" />
                    ) : unavailableLabel ? (
                        <CircleX className="size-3" />
                    ) : (
                        <Clock3 className="size-3" />
                    )}
                    {ready
                        ? 'Available'
                        : unavailableLabel
                          ? 'Unavailable'
                          : 'Pending'}
                </span>
            </div>
            <h3 className="mt-4 font-bold text-slate-950 dark:text-slate-100">
                {title}
            </h3>
            <p className="mt-1 text-sm leading-5 text-slate-500">
                {description}
            </p>
            <div className="mt-auto pt-5">
                {patientViewer ? (
                    <Link
                        href={`/my-medical-documents?appointment=${appointmentId}`}
                        className="inline-flex w-full items-center justify-center rounded-xl border border-moss-300 px-4 py-2.5 text-sm font-semibold text-moss-800"
                    >
                        Track release status
                    </Link>
                ) : ready ? (
                    <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss-800 focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none"
                    >
                        <Download className="size-4" />
                        View or download PDF
                    </a>
                ) : unavailableLabel ? (
                    <div className="rounded-xl border border-dashed border-red-300 px-4 py-2.5 text-center text-xs font-semibold text-red-600 dark:border-red-800 dark:text-red-300">
                        Not available — {unavailableLabel}
                    </div>
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
