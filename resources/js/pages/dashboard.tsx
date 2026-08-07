import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    Check,
    Clock3,
    Download,
    FileHeart,
    FlaskConical,
    HeartPulse,
    Plus,
    ScanLine,
    Stethoscope,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';

type Patient = { first_name?: string; name?: string };
type Appointment = {
    id: number;
    appointment_date: string;
    start_time?: string | null;
    status: string;
    type?: string;
    service_types?: string[] | null;
    company?: { company_name?: string } | null;
    physical_exam?: unknown;
    lab_result?: unknown;
    xray_report?: unknown;
    medical_workflow?: {
        status: string;
        finalized: boolean;
        report_available: boolean;
    };
};
type PageProps = {
    auth: { user: Patient };
    appointments?: Appointment[];
    upcomingAppointments?: Appointment[];
    stats?: { total?: number; completed?: number };
};

const statusLabels: Record<string, string> = {
    pending: 'Awaiting confirmation',
    accepted: 'Appointment confirmed',
    arrived: 'Ready for examination',
    for_diagnostics: 'Laboratory in progress',
    for_xray: 'X-ray in progress',
    awaiting_xray_result: 'X-ray performed — awaiting official result',
    for_final_evaluation: 'Awaiting final evaluation',
    completed: 'Medical visit completed',
    cancelled: 'Cancelled',
};

const statusTone: Record<string, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    accepted: 'border-blue-200 bg-blue-50 text-blue-700',
    arrived: 'border-moss-200 bg-moss-50 text-moss-700',
    for_diagnostics: 'border-violet-200 bg-violet-50 text-violet-700',
    for_xray: 'border-sky-200 bg-sky-50 text-sky-700',
    awaiting_xray_result: 'border-amber-200 bg-amber-50 text-amber-700',
    for_final_evaluation: 'border-orange-200 bg-orange-50 text-orange-700',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

const laboratoryServices = [
    'CBC',
    'Urinalysis',
    'Fecalysis',
    'Drug Test',
    'Hepatitis',
    'Pregnancy Test',
    'FBS',
    'Blood Chemistry',
    'Blood Typing',
];

function dateDetails(value: string) {
    const date = new Date(value);
    return {
        short: date.toLocaleDateString('en-PH', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        }),
        long: date.toLocaleDateString('en-PH', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
        }),
    };
}

function nextAction(appointment?: Appointment) {
    if (!appointment)
        return 'Book an appointment whenever you need clinic services.';
    if (
        appointment.service_types?.includes('PE') &&
        appointment.status === 'completed' &&
        !appointment.medical_workflow?.report_available
    ) {
        return appointment.medical_workflow?.finalized
            ? 'Your examination is finalized and is awaiting release by the doctor.'
            : 'Your clinic visit is complete, but the final medical report is still being prepared.';
    }

    return (
        {
            pending: 'Your request is being reviewed by the clinic.',
            accepted:
                'Your schedule is confirmed. Please arrive before your appointment time.',
            arrived:
                'Please wait for the doctor to begin your physical examination.',
            for_diagnostics:
                'Please proceed to the laboratory for your selected tests.',
            for_xray: 'Please proceed to radiology for your X-ray examination.',
            awaiting_xray_result:
                'Your X-ray procedure is complete. The official result is still being prepared.',
            for_final_evaluation:
                'Your results are ready for the doctor’s final evaluation.',
            completed:
                'Your visit is complete. You may view and download your medical forms.',
        }[appointment.status] ??
        'Check your appointment details for the latest update.'
    );
}

function careSteps(appointment: Appointment) {
    const services = appointment.service_types ?? [];
    const steps = [
        { label: 'Appointment', icon: CalendarDays },
        ...(services.includes('PE')
            ? [{ label: 'Physical exam', icon: Stethoscope }]
            : []),
        ...(services.includes('PE') ||
        services.some((service) => laboratoryServices.includes(service))
            ? [{ label: 'Laboratory', icon: FlaskConical }]
            : []),
        ...(services.includes('PE') || services.includes('X-Ray')
            ? [{ label: 'X-ray', icon: ScanLine }]
            : []),
        { label: 'Final clearance', icon: FileHeart },
    ];
    const completedThrough =
        {
            pending: 0,
            accepted: 1,
            arrived: 1,
            for_diagnostics: services.includes('PE') ? 2 : 1,
            for_xray: steps.findIndex((step) => step.label === 'X-ray'),
            awaiting_xray_result: steps.findIndex(
                (step) => step.label === 'X-ray',
            ),
            for_final_evaluation: steps.length - 1,
            completed: steps.length,
        }[appointment.status] ?? 0;

    return steps.map((step, index) => ({
        ...step,
        completed: index < completedThrough,
        current:
            index === completedThrough && appointment.status !== 'completed',
    }));
}

export default function PatientDashboard() {
    const {
        auth,
        appointments = [],
        upcomingAppointments = [],
        stats = {},
    } = usePage<PageProps>().props;
    const firstName =
        auth.user.first_name || auth.user.name?.split(' ')[0] || 'there';
    const nextAppointment = upcomingAppointments[0];
    const records = appointments.filter(
        (appointment) => {
            const hasRecord =
                appointment.physical_exam ||
                appointment.lab_result ||
                appointment.xray_report;
            const isPe = appointment.service_types?.includes('PE');

            return hasRecord &&
                (!isPe || appointment.medical_workflow?.report_available);
        },
    );

    return (
        <>
            <Head title="My Health" />
            <div className="mx-auto max-w-6xl space-y-7 p-4 sm:p-6 lg:p-8">
                <section className="relative overflow-hidden rounded-[2rem] bg-moss-800 px-6 py-8 text-white shadow-xl sm:px-9 sm:py-10">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_20%,rgba(190,215,185,.25),transparent_25rem)]" />
                    <div className="relative flex flex-col justify-between gap-7 md:flex-row md:items-end">
                        <div>
                            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-moss-100">
                                <HeartPulse className="size-4" /> My health
                                portal
                            </span>
                            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                                Hello, {firstName}.
                            </h1>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-moss-100 sm:text-base">
                                See what comes next in your clinic visit and
                                access your completed medical documents.
                            </p>
                        </div>
                        <Link
                            href="/appointment"
                            className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-moss-900 hover:bg-moss-50"
                        >
                            <Plus className="size-4" /> Book appointment
                        </Link>
                    </div>
                </section>

                <section className="grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-bold tracking-wider text-moss-700 uppercase">
                                    Your next step
                                </p>
                                <h2 className="mt-1 text-xl font-black text-slate-950">
                                    {nextAppointment
                                        ? statusLabels[nextAppointment.status]
                                        : 'No upcoming appointment'}
                                </h2>
                            </div>
                            {nextAppointment && (
                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone[nextAppointment.status]}`}
                                >
                                    {nextAppointment.status.replaceAll(
                                        '_',
                                        ' ',
                                    )}
                                </span>
                            )}
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-600">
                            {nextAction(nextAppointment)}
                        </p>

                        {nextAppointment ? (
                            <>
                                <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                                    <div className="flex items-center gap-3">
                                        <span className="rounded-xl bg-white p-2 text-moss-700 shadow-sm">
                                            <CalendarDays className="size-5" />
                                        </span>
                                        <div>
                                            <p className="font-bold text-slate-900">
                                                {
                                                    dateDetails(
                                                        nextAppointment.appointment_date,
                                                    ).long
                                                }
                                            </p>
                                            <p className="text-xs text-slate-500">
                                                {nextAppointment.company
                                                    ?.company_name ||
                                                    'Individual appointment'}{' '}
                                                ·{' '}
                                                {(
                                                    nextAppointment.service_types ??
                                                    []
                                                ).join(', ')}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {careSteps(nextAppointment).map(
                                        ({
                                            label,
                                            icon: Icon,
                                            completed,
                                            current,
                                        }) => (
                                            <div
                                                key={label}
                                                className={`rounded-2xl border p-3 ${current ? 'border-moss-400 bg-moss-50' : 'border-slate-200'}`}
                                            >
                                                <span
                                                    className={`grid size-8 place-items-center rounded-full ${completed ? 'bg-emerald-600 text-white' : current ? 'bg-moss-700 text-white' : 'bg-slate-100 text-slate-400'}`}
                                                >
                                                    {completed ? (
                                                        <Check className="size-4" />
                                                    ) : (
                                                        <Icon className="size-4" />
                                                    )}
                                                </span>
                                                <p className="mt-2 text-sm font-bold text-slate-800">
                                                    {label}
                                                </p>
                                                <p className="text-xs text-slate-500">
                                                    {completed
                                                        ? 'Completed'
                                                        : current
                                                          ? 'Current stage'
                                                          : 'Upcoming'}
                                                </p>
                                            </div>
                                        ),
                                    )}
                                </div>
                            </>
                        ) : (
                            <Link
                                href="/appointment"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-moss-700"
                            >
                                Schedule a clinic visit{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                        )}
                    </article>

                    <aside className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                        <h2 className="font-black text-slate-950">
                            My care at a glance
                        </h2>
                        <div className="mt-5 grid grid-cols-2 gap-3">
                            <div className="rounded-2xl bg-moss-50 p-4">
                                <strong className="text-3xl text-moss-900">
                                    {stats.total ?? 0}
                                </strong>
                                <p className="mt-1 text-xs font-semibold text-moss-700">
                                    Total appointments
                                </p>
                            </div>
                            <div className="rounded-2xl bg-emerald-50 p-4">
                                <strong className="text-3xl text-emerald-900">
                                    {stats.completed ?? 0}
                                </strong>
                                <p className="mt-1 text-xs font-semibold text-emerald-700">
                                    Completed visits
                                </p>
                            </div>
                        </div>
                        <Link
                            href="/appointments"
                            className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                            View all appointments{' '}
                            <ArrowRight className="size-4" />
                        </Link>
                    </aside>
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-xs font-bold tracking-wider text-moss-700 uppercase">
                                Medical documents
                            </p>
                            <h2 className="mt-1 text-xl font-black text-slate-950">
                                Your available records
                            </h2>
                        </div>
                        <Download className="size-5 text-moss-700" />
                    </div>
                    {records.length ? (
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {records.slice(0, 4).map((appointment) => (
                                <Link
                                    key={appointment.id}
                                    href={`/appointments/${appointment.id}`}
                                    className="flex items-center gap-3 rounded-2xl border border-slate-200 p-4 transition hover:border-moss-300 hover:bg-moss-50"
                                >
                                    <span className="rounded-xl bg-moss-100 p-2 text-moss-700">
                                        <FileHeart className="size-5" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block font-bold text-slate-900">
                                            Appointment #{appointment.id}
                                        </span>
                                        <span className="block truncate text-xs text-slate-500">
                                            {
                                                dateDetails(
                                                    appointment.appointment_date,
                                                ).short
                                            }{' '}
                                            ·{' '}
                                            {(
                                                appointment.service_types ?? []
                                            ).join(', ')}
                                        </span>
                                    </span>
                                    <ArrowRight className="size-4 text-slate-400" />
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="mt-5 rounded-2xl bg-slate-50 p-7 text-center">
                            <FileHeart className="mx-auto size-8 text-slate-300" />
                            <p className="mt-3 text-sm font-semibold text-slate-600">
                                Completed medical forms will appear here.
                            </p>
                        </div>
                    )}
                </section>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-slate-950">
                            Recent appointments
                        </h2>
                        <Link
                            href="/appointments"
                            className="text-sm font-bold text-moss-700"
                        >
                            View history
                        </Link>
                    </div>
                    <div className="mt-4 divide-y divide-slate-100">
                        {appointments.slice(0, 5).map((appointment) => (
                            <Link
                                key={appointment.id}
                                href={`/appointments/${appointment.id}`}
                                className="grid gap-3 py-4 sm:grid-cols-[1fr_1fr_auto] sm:items-center"
                            >
                                <div>
                                    <p className="font-bold text-slate-900">
                                        {(appointment.service_types ?? []).join(
                                            ', ',
                                        ) || 'Medical appointment'}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        {
                                            dateDetails(
                                                appointment.appointment_date,
                                            ).short
                                        }
                                    </p>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {appointment.company?.company_name ||
                                        appointment.type?.replaceAll(
                                            '_',
                                            ' ',
                                        ) ||
                                        'Individual'}
                                </p>
                                <span
                                    className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${statusTone[appointment.status]}`}
                                >
                                    {statusLabels[appointment.status] ??
                                        appointment.status}
                                </span>
                            </Link>
                        ))}
                        {!appointments.length && (
                            <div className="py-8 text-center text-sm text-slate-500">
                                <Clock3 className="mx-auto mb-2 size-6" />
                                No appointment history yet.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

PatientDashboard.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
