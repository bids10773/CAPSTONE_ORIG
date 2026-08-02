import { Head, Link, usePage } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Activity,
    ArrowRight,
    Bell,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ClipboardCheck,
    Clock3,
    FileText,
    HeartPulse,
    LogOut,
    MapPin,
    Menu,
    Plus,
    Settings,
    ShieldCheck,
    Stethoscope,
    UserRound,
    X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import logo from '/resources/images/full_logo2.png';
import { useLogoutModal } from '@/contexts/logout-modal-context';
import AppLayout from '@/layouts/app-layout';

type User = {
    first_name?: string;
    last_name?: string;
    name?: string;
    email?: string;
};
type Appointment = {
    id: number;
    appointment_date: string;
    start_time?: string | null;
    type?: string;
    status: string;
    service_types?: string[] | null;
    company?: { company_name?: string } | null;
};

type PageProps = {
    auth: { user: User };
    appointments?: Appointment[];
    upcomingAppointments?: Appointment[];
    stats?: {
        total?: number;
        completed?: number;
        pending?: number;
        accepted?: number;
        physical?: number;
        laboratory?: number;
        final_evaluation?: number;
    };
};

const statusStyles: Record<string, string> = {
    pending: 'border-amber-200 bg-amber-50 text-amber-700',
    accepted: 'border-moss-200 bg-moss-50 text-moss-700',
    arrived: 'border-moss-200 bg-moss-50 text-moss-700',
    completed: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    cancelled: 'border-rose-200 bg-rose-50 text-rose-700',
};

const statCards: {
    icon: LucideIcon;
    value: (stats: PageProps['stats']) => number;
    label: string;
    hint: string;
}[] = [
    {
        icon: CalendarDays,
        value: (stats) => stats?.pending ?? 0,
        label: 'Pending',
        hint: 'Awaiting clinic confirmation',
    },
    {
        icon: CheckCircle2,
        value: (stats) => stats?.accepted ?? 0,
        label: 'Accepted',
        hint: 'Confirmed by the clinic',
    },
    {
        icon: Stethoscope,
        value: (stats) => stats?.physical ?? 0,
        label: 'For physical exam',
        hint: 'Checked in and ready',
    },
    {
        icon: Activity,
        value: (stats) => stats?.laboratory ?? 0,
        label: 'For laboratory',
        hint: 'Laboratory stage in progress',
    },
    {
        icon: ClipboardCheck,
        value: (stats) => stats?.final_evaluation ?? 0,
        label: 'For final evaluation',
        hint: 'Awaiting doctor clearance',
    },
    {
        icon: CheckCircle2,
        value: (stats) => stats?.completed ?? 0,
        label: 'Completed visits',
        hint: 'Care milestones achieved',
    },
];

const serviceCards: { icon: LucideIcon; title: string; text: string }[] = [
    {
        icon: Stethoscope,
        title: 'Occupational exams',
        text: 'PEME, APE and fit-to-work care',
    },
    { icon: Activity, title: 'Diagnostics', text: 'Laboratory, X-ray and ECG' },
    {
        icon: HeartPulse,
        title: 'Wellness care',
        text: 'Vaccination and preventive health',
    },
    {
        icon: MapPin,
        title: 'Corporate programs',
        text: 'On-site care for your team',
    },
];

function formatDate(date: string) {
    const value = new Date(date);
    return Number.isNaN(value.getTime())
        ? { day: '—', month: '', long: 'Date to be confirmed', time: '' }
        : {
              day: value.toLocaleDateString('en-US', { day: '2-digit' }),
              month: value
                  .toLocaleDateString('en-US', { month: 'short' })
                  .toUpperCase(),
              long: value.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
              }),
              time: value.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
              }),
          };
}

function serviceLabel(appointment: Appointment) {
    if (
        Array.isArray(appointment.service_types) &&
        appointment.service_types.length
    )
        return appointment.service_types.slice(0, 2).join(' · ');
    return appointment.type?.replaceAll('_', ' ') || 'Medical examination';
}

function AccountMenu({ user }: { user: User }) {
    const [open, setOpen] = useState(false);
    const { openModal } = useLogoutModal();
    const initials =
        `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}` ||
        user.name?.[0] ||
        'U';
    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-2 rounded-xl p-1.5 pr-2 text-left transition hover:bg-slate-50"
                aria-expanded={open}
                aria-label="Open account menu"
            >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-moss-700 text-xs font-extrabold text-white">
                    {initials.toUpperCase()}
                </span>
                <ChevronDown
                    size={15}
                    className={`hidden text-slate-400 transition sm:block ${open ? 'rotate-180' : ''}`}
                />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        className="absolute top-12 right-0 z-50 w-64 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-900/10"
                    >
                        <div className="border-b border-slate-100 px-3 py-3">
                            <p className="text-sm font-bold text-slate-950">
                                {user.name ||
                                    `${user.first_name ?? ''} ${user.last_name ?? ''}`}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                                {user.email}
                            </p>
                        </div>
                        <Link
                            href="/settings/profile"
                            className="mt-1 flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-moss-50 hover:text-moss-800"
                        >
                            <Settings size={16} /> Account settings
                        </Link>
                        <Link
                            href="/appointments"
                            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-moss-50 hover:text-moss-800"
                        >
                            <CalendarDays size={16} /> My appointments
                        </Link>
                        <button
                            onClick={(event) => openModal(event.currentTarget)}
                            className="mt-1 flex w-full items-center gap-3 rounded-xl border-t border-slate-100 px-3 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50"
                        >
                            <LogOut size={16} /> Sign out
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function Navigation({ user }: { user: User }) {
    const [open, setOpen] = useState(false);
    const links = [
        ['Overview', '#overview'],
        ['My care', '#appointments'],
        ['Services', '#services'],
    ];
    return (
        <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
            <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-7">
                <Link
                    href="/dashboard"
                    className="flex items-center gap-3"
                    aria-label="Living Myth Industrial Clinic dashboard"
                >
                    <span className="flex h-10 w-[66px] items-center justify-center rounded-xl bg-moss-800 p-1.5">
                        <img
                            src={logo}
                            alt="Living Myth Industrial Clinic"
                            className="h-full w-full object-contain"
                        />
                    </span>
                    <span className="hidden leading-tight sm:block">
                        <strong className="block text-sm tracking-[-.03em] text-slate-950">
                            LIVING MYTH
                        </strong>
                        <small className="block text-[9px] font-bold tracking-[.16em] text-moss-700 uppercase">
                            Patient portal
                        </small>
                    </span>
                </Link>
                <nav className="hidden items-center gap-7 lg:flex">
                    {links.map(([label, href]) => (
                        <a
                            href={href}
                            key={label}
                            className="text-sm font-bold text-slate-500 transition hover:text-moss-700"
                        >
                            {label}
                        </a>
                    ))}
                </nav>
                <div className="flex items-center gap-2">
                    <button
                        className="grid h-9 w-9 place-items-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                        aria-label="Notifications"
                    >
                        <Bell size={18} />
                    </button>
                    <Link
                        href="/appointment"
                        className="hidden items-center gap-2 rounded-xl bg-moss-800 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-moss-700 sm:flex"
                    >
                        <Plus size={16} /> Book appointment
                    </Link>
                    <AccountMenu user={user} />
                    <button
                        onClick={() => setOpen(!open)}
                        className="grid h-9 w-9 place-items-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden"
                        aria-label="Toggle navigation"
                    >
                        {open ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>
            <AnimatePresence>
                {open && (
                    <motion.nav
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden border-t border-slate-100 bg-white px-5 lg:hidden"
                    >
                        {links.map(([label, href]) => (
                            <a
                                onClick={() => setOpen(false)}
                                href={href}
                                key={label}
                                className="block py-3 text-sm font-bold text-slate-600"
                            >
                                {label}
                            </a>
                        ))}
                        <Link
                            href="/appointment"
                            className="mb-3 block rounded-xl bg-moss-700 px-4 py-3 text-center text-sm font-bold text-white"
                        >
                            Book appointment
                        </Link>
                    </motion.nav>
                )}
            </AnimatePresence>
        </header>
    );
}

export default function Dashboard() {
    const {
        auth,
        appointments = [],
        upcomingAppointments = [],
        stats = {},
    } = usePage<PageProps>().props;
    const user = auth.user;
    const displayName = user.first_name || user.name?.split(' ')[0] || 'there';
    const nextAppointment = upcomingAppointments[0];

    return (
        <>
            <Head title="My Health Dashboard" />
            <AppLayout
                breadcrumbs={[
                    { title: 'My Health Overview', href: '/dashboard' },
                ]}
            >
                <div className="min-h-full bg-background text-slate-900">
                    <main className="mx-auto max-w-7xl px-5 pt-8 pb-14 sm:px-7 sm:pt-11">
                        <section
                            id="overview"
                            className="relative overflow-hidden rounded-[1.75rem] bg-moss-800 px-6 py-8 text-white shadow-[0_24px_60px_rgba(15,23,42,.16)] sm:px-9 sm:py-10"
                        >
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_87%_20%,rgba(168,195,160,.24),transparent_24rem),radial-gradient(circle_at_15%_110%,rgba(107,143,113,.18),transparent_22rem)]" />
                            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                                <div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-moss-300/20 bg-moss-300/10 px-3 py-1.5 text-xs font-bold text-moss-200">
                                        <HeartPulse size={14} /> Your
                                        occupational health hub
                                    </span>
                                    <h1 className="mt-5 text-3xl font-extrabold tracking-[-.045em] sm:text-4xl">
                                        Good{' '}
                                        {new Date().getHours() < 12
                                            ? 'morning'
                                            : new Date().getHours() < 18
                                              ? 'afternoon'
                                              : 'evening'}
                                        , {displayName}.
                                    </h1>
                                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                                        Stay on top of your medical
                                        appointments, requirements, and
                                        workplace wellness journey—all in one
                                        secure place.
                                    </p>
                                </div>
                                <Link
                                    href="/appointment"
                                    className="inline-flex w-fit items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-moss-50"
                                >
                                    Book a consultation <ArrowRight size={16} />
                                </Link>
                            </div>
                        </section>

                        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {statCards.map(
                                ({ icon: Icon, value, label, hint }, i) => (
                                    <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.06 }}
                                        key={label}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                                    >
                                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-moss-50 text-moss-700">
                                            <Icon size={20} />
                                        </span>
                                        <div className="mt-5 flex items-end justify-between">
                                            <div>
                                                <strong className="block text-3xl leading-none tracking-[-.05em] text-slate-950">
                                                    {value(stats)}
                                                </strong>
                                                <span className="mt-2 block text-sm font-bold text-slate-800">
                                                    {label}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">
                                            {hint}
                                        </p>
                                    </motion.div>
                                ),
                            )}
                        </section>

                        <section
                            id="appointments"
                            className="mt-8 grid gap-6 lg:grid-cols-[1.4fr_.85fr]"
                        >
                            <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold tracking-[.16em] text-moss-700 uppercase">
                                            Next visit
                                        </p>
                                        <h2 className="mt-1 text-xl font-extrabold tracking-[-.035em] text-slate-950">
                                            Your upcoming appointment
                                        </h2>
                                    </div>
                                    <Link
                                        href="/appointments"
                                        className="hidden text-sm font-bold text-moss-700 hover:text-moss-900 sm:block"
                                    >
                                        View all
                                    </Link>
                                </div>
                                {nextAppointment ? (
                                    <div className="mt-6 rounded-2xl border border-moss-100 bg-moss-50 p-5">
                                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                            <div className="flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl bg-moss-700 text-white">
                                                <strong className="text-2xl leading-none">
                                                    {
                                                        formatDate(
                                                            nextAppointment.appointment_date,
                                                        ).day
                                                    }
                                                </strong>
                                                <small className="mt-1 text-[10px] font-bold tracking-wider">
                                                    {
                                                        formatDate(
                                                            nextAppointment.appointment_date,
                                                        ).month
                                                    }
                                                </small>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-extrabold capitalize ${statusStyles[nextAppointment.status] ?? 'border-slate-200 bg-white text-slate-600'}`}
                                                >
                                                    {nextAppointment.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </span>
                                                <h3 className="mt-3 truncate text-lg font-extrabold text-slate-950">
                                                    {serviceLabel(
                                                        nextAppointment,
                                                    )}
                                                </h3>
                                                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                                                    <Clock3
                                                        size={15}
                                                        className="text-moss-700"
                                                    />
                                                    {
                                                        formatDate(
                                                            nextAppointment.appointment_date,
                                                        ).long
                                                    }{' '}
                                                    ·{' '}
                                                    {
                                                        formatDate(
                                                            nextAppointment.appointment_date,
                                                        ).time
                                                    }
                                                </p>
                                                {nextAppointment.company
                                                    ?.company_name && (
                                                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                                                        <UserRound size={15} />
                                                        {
                                                            nextAppointment
                                                                .company
                                                                .company_name
                                                        }
                                                    </p>
                                                )}
                                            </div>
                                            <Link
                                                href={`/appointments/${nextAppointment.id}`}
                                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-moss-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-moss-700"
                                            >
                                                Details <ArrowRight size={15} />
                                            </Link>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-8 text-center">
                                        <CalendarDays
                                            className="mx-auto text-slate-400"
                                            size={28}
                                        />
                                        <h3 className="mt-3 font-bold text-slate-900">
                                            No upcoming visit yet
                                        </h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            Book an appointment when you’re
                                            ready.
                                        </p>
                                        <Link
                                            href="/appointment"
                                            className="mt-4 inline-flex rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-bold text-white"
                                        >
                                            Schedule now
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <div className="rounded-[1.5rem] bg-moss-700 p-6 text-white shadow-lg shadow-moss-800/10">
                                <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/15">
                                    <ShieldCheck size={22} />
                                </span>
                                <h2 className="mt-6 text-xl font-extrabold tracking-[-.035em]">
                                    Your health records are protected.
                                </h2>
                                <p className="mt-3 text-sm leading-6 text-moss-100">
                                    Your medical information is handled securely
                                    and confidentially under the Data Privacy
                                    Act.
                                </p>
                                <Link
                                    href="/settings/profile"
                                    className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-white underline decoration-moss-300 underline-offset-4"
                                >
                                    Manage my profile <ArrowRight size={15} />
                                </Link>
                            </div>
                        </section>

                        <section className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
                            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                                <div>
                                    <p className="text-xs font-bold tracking-[.16em] text-moss-700 uppercase">
                                        Recent activity
                                    </p>
                                    <h2 className="mt-1 text-xl font-extrabold tracking-[-.035em] text-slate-950">
                                        Your appointments
                                    </h2>
                                </div>
                                <Link
                                    href="/appointments"
                                    className="inline-flex items-center gap-2 text-sm font-bold text-moss-700 hover:text-moss-900"
                                >
                                    See appointment history{' '}
                                    <ArrowRight size={15} />
                                </Link>
                            </div>
                            <div className="mt-6 divide-y divide-slate-100">
                                {appointments.length ? (
                                    appointments
                                        .slice(0, 5)
                                        .map((appointment) => (
                                            <div
                                                key={appointment.id}
                                                className="flex flex-col gap-4 py-4 first:pt-0 sm:flex-row sm:items-center"
                                            >
                                                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-600">
                                                    <ClipboardCheck size={19} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="truncate text-sm font-extrabold text-slate-900">
                                                        {serviceLabel(
                                                            appointment,
                                                        )}
                                                    </h3>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        {
                                                            formatDate(
                                                                appointment.appointment_date,
                                                            ).long
                                                        }{' '}
                                                        ·{' '}
                                                        {
                                                            formatDate(
                                                                appointment.appointment_date,
                                                            ).time
                                                        }
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[11px] font-extrabold capitalize ${statusStyles[appointment.status] ?? 'border-slate-200 bg-slate-50 text-slate-600'}`}
                                                >
                                                    {appointment.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </span>
                                                <Link
                                                    href={`/appointments/${appointment.id}`}
                                                    className="text-sm font-bold text-moss-700 hover:text-moss-900"
                                                >
                                                    View
                                                </Link>
                                            </div>
                                        ))
                                ) : (
                                    <div className="py-10 text-center">
                                        <FileText
                                            className="mx-auto text-slate-300"
                                            size={30}
                                        />
                                        <p className="mt-3 text-sm font-semibold text-slate-600">
                                            Your appointment history will appear
                                            here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section id="services" className="mt-8">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs font-bold tracking-[.16em] text-moss-700 uppercase">
                                        Clinic services
                                    </p>
                                    <h2 className="mt-1 text-xl font-extrabold tracking-[-.035em] text-slate-950">
                                        Care designed around your work and
                                        wellbeing.
                                    </h2>
                                </div>
                                <Link
                                    href="/appointment"
                                    className="hidden text-sm font-bold text-moss-700 sm:block"
                                >
                                    Explore all services
                                </Link>
                            </div>
                            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                {serviceCards.map(
                                    ({ icon: Icon, title, text }) => (
                                        <motion.div
                                            whileHover={{ y: -3 }}
                                            key={title}
                                            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition"
                                        >
                                            <span className="grid h-10 w-10 place-items-center rounded-xl bg-moss-50 text-moss-700">
                                                <Icon size={19} />
                                            </span>
                                            <h3 className="mt-5 text-sm font-extrabold text-slate-950">
                                                {title}
                                            </h3>
                                            <p className="mt-2 text-xs leading-5 text-slate-500">
                                                {text}
                                            </p>
                                        </motion.div>
                                    ),
                                )}
                            </div>
                        </section>
                    </main>
                </div>
            </AppLayout>
        </>
    );
}
