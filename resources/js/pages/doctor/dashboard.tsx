import { Head, Link, usePage } from '@inertiajs/react';
import {
    Calendar,
    HeartPulse,
    Users,
    ClipboardList,
    Stethoscope,
    ArrowRight,
} from 'lucide-react';
import { OnsiteOverviewCard } from '@/components/onsite-overview-card';
import type { OnsiteOverview } from '@/components/onsite-overview-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Doctor Dashboard', href: '' }];

interface Appointment {
    id: number;
    appointment_date: string;
    start_time?: string | null;
    status: string;
    service_types: string[] | string | null;
    examination_purpose?: string | null;
    user: {
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        email?: string | null;
        contact?: string | null;
        patient_profile?: {
            birthdate?: string | null;
            sex?: string | null;
            civil_status?: string | null;
        } | null;
    };
}

interface AvailabilitySlot {
    day: string;
    start: string;
    end: string;
}

const weekDays = [
    { key: 'mon', label: 'Mon' },
    { key: 'tue', label: 'Tue' },
    { key: 'wed', label: 'Wed' },
    { key: 'thu', label: 'Thu' },
    { key: 'fri', label: 'Fri' },
    { key: 'sat', label: 'Sat' },
    { key: 'sun', label: 'Sun' },
];

interface Props {
    pendingCount: number;
    todayCount: number;
    totalPatients: number;
    completedPhysicalCount: number;
    onsiteSummary: OnsiteOverview;
    upcomingAppointments: Appointment[]; // 👈 ADD
}

function formatAppointmentDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));
}

function formatAppointmentTime(value?: string | null): string | null {
    if (!value) return null;

    const [hours = '0', minutes = '0'] = value.split(':');
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

function formatPurpose(value?: string | null): string {
    if (!value) return 'Not specified';

    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getServices(value: Appointment['service_types']): string[] {
    if (Array.isArray(value)) return value;
    if (!value) return [];

    try {
        const parsed: unknown = JSON.parse(value);

        return Array.isArray(parsed)
            ? parsed.filter((service): service is string =>
                  Boolean(service && typeof service === 'string'),
              )
            : [value];
    } catch {
        return [value];
    }
}

function calculateAge(birthdate?: string | null): number | null {
    if (!birthdate) return null;

    const [year, month, day] = birthdate.slice(0, 10).split('-').map(Number);
    if (!year || !month || !day) return null;

    const today = new Date();
    let age = today.getFullYear() - year;
    const birthdayHasPassed =
        today.getMonth() + 1 > month ||
        (today.getMonth() + 1 === month && today.getDate() >= day);

    if (!birthdayHasPassed) age -= 1;

    return age >= 0 ? age : null;
}

export default function DoctorDashboard(props: Props) {
    const { auth } = usePage().props as any;
    const {
        pendingCount,
        todayCount,
        completedPhysicalCount,
        onsiteSummary,
        upcomingAppointments,
    } = props;

    const availability = (auth?.user?.availability ?? []) as AvailabilitySlot[];

    return (
        <>
            <Head title="Doctor Dashboard" />

            <div className="min-h-screen space-y-6 bg-gray-50 p-6">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                    <section className="relative overflow-hidden rounded-[2rem] bg-moss-800 p-7 text-white shadow-[0_10px_30px_-24px_rgba(48,63,52,.45)] sm:p-9">
                        <div className="absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-3xl" />
                        <div className="absolute -bottom-24 left-1/3 size-48 rounded-full bg-moss-400/20 blur-3xl" />
                        <div className="relative grid min-h-52 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-stretch">
                            <div className="flex flex-col justify-between gap-8">
                                <span className="flex w-fit items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold tracking-[0.16em] text-moss-100 uppercase">
                                    <Stethoscope className="size-3.5" />
                                    Doctor dashboard
                                </span>
                                <div>
                                    <p className="text-sm font-semibold text-moss-200">
                                        Welcome back
                                    </p>
                                    <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
                                        Dr. {auth?.user?.name}
                                    </h1>
                                </div>
                            </div>

                            <div className="min-w-0 rounded-3xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm sm:p-5">
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <div>
                                        <p className="flex items-center gap-2 text-sm font-bold">
                                            <Calendar className="size-4 text-moss-200" />
                                            Weekly availability
                                        </p>
                                        <p className="mt-0.5 text-xs text-moss-200/80">
                                            Your recurring clinic schedule
                                        </p>
                                    </div>
                                    <Link
                                        href="/doctor/availability"
                                        className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-moss-800 transition hover:bg-moss-50"
                                    >
                                        Edit
                                    </Link>
                                </div>

                                <div className="grid grid-cols-7 gap-1.5">
                                    {weekDays.map((day) => {
                                        const slots = availability.filter(
                                            (slot) => slot.day === day.key,
                                        );
                                        const isAvailable = slots.length > 0;
                                        const schedule = slots
                                            .map(
                                                (slot) =>
                                                    `${formatAppointmentTime(slot.start)}–${formatAppointmentTime(slot.end)}`,
                                            )
                                            .join(', ');

                                        return (
                                            <div
                                                key={day.key}
                                                title={
                                                    schedule || 'Not available'
                                                }
                                                className={`flex min-h-24 min-w-0 flex-col items-center rounded-2xl border px-1.5 py-3 text-center ${
                                                    isAvailable
                                                        ? 'border-white/30 bg-white text-moss-900 shadow-sm'
                                                        : 'border-white/10 bg-moss-950/10 text-moss-200/60'
                                                }`}
                                            >
                                                <span className="text-[10px] font-extrabold tracking-wide uppercase">
                                                    {day.label}
                                                </span>
                                                <span
                                                    className={`mt-2 grid size-7 place-items-center rounded-full text-xs font-black ${
                                                        isAvailable
                                                            ? 'bg-moss-700 text-white'
                                                            : 'bg-white/10'
                                                    }`}
                                                >
                                                    {isAvailable ? '✓' : '–'}
                                                </span>
                                                <span className="mt-2 truncate text-[9px] leading-tight font-semibold">
                                                    {isAvailable
                                                        ? formatAppointmentTime(
                                                              slots[0].start,
                                                          )
                                                        : 'Off'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden rounded-[2rem] border border-moss-200 bg-gradient-to-br from-moss-50 via-white to-emerald-50 p-7 shadow-[0_8px_24px_-20px_rgba(47,107,74,.3)] sm:p-8 dark:border-moss-700 dark:from-moss-950 dark:via-card dark:to-emerald-950/40 dark:shadow-[0_8px_24px_-20px_rgba(0,0,0,.45)]">
                        <div className="absolute -top-10 -right-8 size-36 rounded-full bg-moss-200/45 blur-2xl dark:bg-moss-500/10" />
                        <div className="relative flex h-full min-h-44 flex-col justify-between">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-extrabold tracking-[0.14em] text-moss-700 uppercase dark:text-moss-200">
                                    Today
                                </span>
                                <span className="grid size-12 place-items-center rounded-2xl bg-moss-700 text-white shadow-lg shadow-moss-700/20">
                                    <Users className="size-6" />
                                </span>
                            </div>
                            <div className="mt-6 flex items-end gap-3">
                                <strong className="text-6xl leading-none font-black tracking-tight text-moss-900 sm:text-7xl dark:text-white">
                                    {todayCount}
                                </strong>
                                <span className="pb-1.5 text-sm font-bold text-moss-700 dark:text-moss-200">
                                    {todayCount === 1 ? 'patient' : 'patients'}
                                </span>
                            </div>
                        </div>
                    </section>
                </div>

                {/* SUPPORTING STATS */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {/* Pending */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-moss-500/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                            <HeartPulse size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            Pending Consultations
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {pendingCount}
                        </p>
                    </div>

                    {/* Completed Physical Exams */}
                    <div className="rounded-[2rem] border border-white bg-white/60 p-6 shadow-sm backdrop-blur-md transition-all hover:shadow-xl hover:shadow-moss-500/5">
                        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-50 text-purple-600">
                            <ClipboardList size={24} />
                        </div>
                        <p className="text-sm font-medium text-gray-500">
                            Completed Physical Exams
                        </p>
                        <p className="mt-1 text-2xl font-bold text-gray-900">
                            {completedPhysicalCount}
                        </p>
                    </div>

                    {/* Quick Action */}
                    <div className="flex flex-col justify-between rounded-[2rem] border border-moss-200 bg-gradient-to-br from-moss-700 to-moss-900 p-6 text-white shadow-sm transition-all hover:shadow-xl hover:shadow-moss-900/10 sm:col-span-2 xl:col-span-1">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-extrabold tracking-[0.14em] text-moss-200 uppercase">
                                    Quick action
                                </p>
                                <h2 className="mt-2 text-xl font-bold">
                                    Patient consultations
                                </h2>
                            </div>
                            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/10 text-moss-100">
                                <Stethoscope className="size-6" />
                            </span>
                        </div>
                        <Link
                            href="/doctor/appointments"
                            className="mt-6 flex items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-bold text-moss-800 transition hover:-translate-y-0.5 hover:bg-moss-50"
                        >
                            Start consultation
                            <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>

                <OnsiteOverviewCard
                    summary={onsiteSummary}
                    href="/doctor/onsite-events"
                />

                {/* MAIN GRID */}
                <div>
                    {/* UPCOMING */}
                    <div className="overflow-hidden rounded-[2rem] border border-white bg-white/60 shadow-sm backdrop-blur-md">
                        <div className="flex items-center justify-between bg-moss-700 px-6 py-5 text-white">
                            <h2 className="text-xl font-bold">
                                Upcoming Appointments
                            </h2>
                            <Link
                                href="/doctor/appointments"
                                className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-sm font-bold text-white transition hover:bg-white/20"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="space-y-4 p-6">
                            {upcomingAppointments.length > 0 ? (
                                upcomingAppointments.map((apt) => {
                                    const services = getServices(
                                        apt.service_types,
                                    );
                                    const profile = apt.user.patient_profile;
                                    const age = calculateAge(
                                        profile?.birthdate,
                                    );
                                    const patientName = [
                                        apt.user.first_name,
                                        apt.user.middle_name,
                                        apt.user.last_name,
                                    ]
                                        .filter(Boolean)
                                        .join(' ');

                                    return (
                                        <article
                                            key={apt.id}
                                            tabIndex={0}
                                            aria-label={`${patientName}, ${formatAppointmentDate(apt.appointment_date)}. Hover or focus to show appointment details.`}
                                            className="group rounded-2xl border border-transparent bg-gray-50/50 p-4 transition-all duration-300 outline-none hover:border-moss-200 hover:bg-moss-50/40 focus-visible:border-moss-400 focus-visible:ring-4 focus-visible:ring-moss-500/10 dark:hover:border-moss-700"
                                        >
                                            <div className="flex items-center justify-between gap-4">
                                                <div className="flex min-w-0 items-center gap-4">
                                                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-moss-100">
                                                        <Calendar className="size-5 text-moss-600" />
                                                    </div>
                                                    <p className="truncate font-bold text-gray-900">
                                                        {patientName}
                                                    </p>
                                                </div>

                                                <div className="shrink-0 text-right">
                                                    <p className="font-bold text-gray-900">
                                                        {formatAppointmentDate(
                                                            apt.appointment_date,
                                                        )}
                                                    </p>
                                                    {formatAppointmentTime(
                                                        apt.start_time,
                                                    ) && (
                                                        <p className="text-xs text-gray-500">
                                                            {formatAppointmentTime(
                                                                apt.start_time,
                                                            )}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid max-h-0 grid-cols-1 gap-3 overflow-hidden opacity-0 transition-all duration-300 group-hover:mt-4 group-hover:max-h-96 group-hover:opacity-100 group-focus:mt-4 group-focus:max-h-96 group-focus:opacity-100 md:grid-cols-3">
                                                <div className="rounded-xl border border-moss-100 bg-white/70 p-4">
                                                    <p className="text-[10px] font-extrabold tracking-[0.14em] text-moss-600 uppercase">
                                                        Examination purpose
                                                    </p>
                                                    <p className="mt-2 text-sm font-bold text-gray-900">
                                                        {formatPurpose(
                                                            apt.examination_purpose,
                                                        )}
                                                    </p>
                                                    <span className="mt-2 inline-flex rounded-full bg-moss-100 px-2.5 py-1 text-[10px] font-bold text-moss-700 capitalize">
                                                        {apt.status.replaceAll(
                                                            '_',
                                                            ' ',
                                                        )}
                                                    </span>
                                                </div>

                                                <div className="rounded-xl border border-moss-100 bg-white/70 p-4">
                                                    <p className="text-[10px] font-extrabold tracking-[0.14em] text-moss-600 uppercase">
                                                        Personal details
                                                    </p>
                                                    <div className="mt-2 space-y-1 text-xs text-gray-600">
                                                        <p>
                                                            {age !== null
                                                                ? `${age} years old`
                                                                : 'Age not provided'}
                                                            {' · '}
                                                            {profile?.sex ||
                                                                'Sex not provided'}
                                                            {' · '}
                                                            {profile?.civil_status ||
                                                                'Civil status not provided'}
                                                        </p>
                                                        <p>
                                                            {apt.user.contact ||
                                                                'No contact number'}
                                                        </p>
                                                        <p className="truncate">
                                                            {apt.user.email ||
                                                                'No email address'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-moss-100 bg-white/70 p-4">
                                                    <p className="text-[10px] font-extrabold tracking-[0.14em] text-moss-600 uppercase">
                                                        Services
                                                    </p>
                                                    <div className="mt-2 rounded-xl border border-moss-100 bg-moss-50/70 px-3 py-2.5 text-sm leading-6 font-semibold text-gray-800">
                                                        {services.length > 0
                                                            ? services.join(
                                                                  ', ',
                                                              )
                                                            : 'No services listed'}
                                                    </div>
                                                </div>
                                            </div>
                                        </article>
                                    );
                                })
                            ) : (
                                <div className="rounded-xl bg-gray-50/50 p-4 text-sm text-gray-500">
                                    No upcoming appointments
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

DoctorDashboard.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
