import { useState, useRef, useEffect } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import axios from 'axios';
import debounce from 'lodash/debounce';
import { motion } from 'framer-motion';
import {
    Calendar,
    Clock,
    Users,
    Activity,
    Plus,
    Search,
    Filter,
} from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ── Breadcrumbs ───────────────────────────────────────────────────────────────

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Staff Dashboard', href: '/staff/appointments' },
    { title: 'Appointments', href: '' },
];

// ── Animation Variants ────────────────────────────────────────────────────────

const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.12 } },
};

const card = {
    hidden: { opacity: 0, y: 24 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

// ── Types ─────────────────────────────────────────────────────────────────────

interface Patient {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
}
interface Doctor {
    id: number;
    first_name: string;
    last_name: string;
}
interface Appointment {
    id: number;
    user: Patient;
    doctor: Doctor | null;
    appointment_date: string;
    start_time: string;
    type: string;
    status: string;
    service_types: string[] | string;
    notes?: string;
}
interface Props {
    appointments: { data: Appointment[]; links: any[] };
    doctors: Doctor[];
    serviceTypes: Record<string, string>;
    statusOptions: string[];
    filters: { search: string; status: string; type: string };
    [key: string]: unknown;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    accepted: 'bg-indigo-100 text-indigo-800',
    arrived: 'bg-moss-100   text-moss-800',
    for_diagnostics: 'bg-purple-100 text-purple-800',
    for_xray: 'bg-orange-100 text-orange-800',
    for_final_evaluation: 'bg-moss-100   text-moss-800',
    completed: 'bg-green-100  text-green-800',
    cancelled: 'bg-red-100    text-red-800',
};

function Badge({ status }: { status: string }) {
    return (
        <span
            className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-800'}`}
        >
            {status.replace(/_/g, ' ')}
        </span>
    );
}

function parseServiceTypes(value: unknown): string[] {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return [];
        }
    }
    return [];
}

function fullName(u: { first_name: string; last_name: string }) {
    return `${u.first_name} ${u.last_name}`;
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

// ── Walk-in Modal ─────────────────────────────────────────────────────────────

function WalkInModal({
    doctors,
    serviceTypes,
    onClose,
}: {
    doctors: Doctor[];
    serviceTypes: Record<string, string>;
    onClose: () => void;
}) {
    const [patientType, setPatientType] = useState<'existing' | 'new'>(
        'existing',
    );
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<Patient[]>([]);
    const [showDropdown, setDrop] = useState(false);

    const { data, setData, post, processing, errors, reset } = useForm({
        patient_type: 'existing' as 'existing' | 'new',
        user_id: '',
        first_name: '',
        last_name: '',
        email: '',
        contact: '',
        // ✅ profile fields
        birthdate: '',
        sex: '',
        civil_status: '',
        // appointment fields
        doctor_id: '',
        appointment_date: new Date().toISOString().split('T')[0],
        start_time: '08:00',
        service_types: [] as string[],
        notes: '',
    });

    useEffect(() => {}, [errors]);

    const doSearch = useRef(
        debounce(async (q: string) => {
            if (q.length < 2) {
                setResults([]);
                return;
            }
            const res = await axios.get('/staff/patients/search', {
                params: { q },
            });
            setResults(res.data);
            setDrop(true);
        }, 300),
    ).current;

    useEffect(() => {
        doSearch(query);
    }, [query]);

    function switchType(type: 'existing' | 'new') {
        setPatientType(type);
        setData('patient_type', type);
        // reset patient fields when switching
        setQuery('');
        setData('user_id', '');
        setData('first_name', '');
        setData('last_name', '');
        setData('email', '');
        setData('contact', '');
    }

    function pickPatient(p: Patient) {
        setData('user_id', String(p.id));
        setQuery(fullName(p));
        setDrop(false);
    }

    function toggleService(key: string) {
        setData(
            'service_types',
            data.service_types.includes(key)
                ? data.service_types.filter((s) => s !== key)
                : [...data.service_types, key],
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        post('/staff/appointments', {
            onSuccess: () => {
                reset();
                onClose();
            },
        });
    }

    const inputClass =
        'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-moss-500 focus:outline-none';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-moss-950/25 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b p-5">
                    <h2 className="text-lg font-bold text-gray-900">
                        New Walk-in Appointment
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-xl text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={submit} className="space-y-4 p-5">
                    {/* Patient Type Toggle */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Patient
                        </label>
                        <div className="flex overflow-hidden rounded-xl border border-gray-200">
                            <button
                                type="button"
                                onClick={() => switchType('existing')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                    patientType === 'existing'
                                        ? 'bg-moss-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                Existing Patient
                            </button>
                            <button
                                type="button"
                                onClick={() => switchType('new')}
                                className={`flex-1 py-2 text-sm font-medium transition-colors ${
                                    patientType === 'new'
                                        ? 'bg-moss-600 text-white'
                                        : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                New Patient
                            </button>
                        </div>
                    </div>

                    {/* Existing Patient Search */}
                    {patientType === 'existing' && (
                        <div className="relative">
                            <input
                                value={query}
                                onChange={(e) => {
                                    setQuery(e.target.value);
                                    setData('user_id', '');
                                }}
                                placeholder="Search by name or email…"
                                className={inputClass}
                            />
                            {showDropdown && results.length > 0 && (
                                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                                    {results.map((p) => (
                                        <li
                                            key={p.id}
                                            onClick={() => pickPatient(p)}
                                            className="cursor-pointer px-4 py-2 text-sm hover:bg-moss-50"
                                        >
                                            <span className="font-medium">
                                                {fullName(p)}
                                            </span>
                                            <span className="ml-2 text-xs text-gray-400">
                                                {p.email}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                            {errors.user_id && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.user_id}
                                </p>
                            )}
                        </div>
                    )}

                    {/* New Patient Fields */}
                    {patientType === 'new' && (
                        <div className="space-y-3 rounded-xl border border-moss-100 bg-moss-50 p-4">
                            <p className="text-xs font-semibold tracking-wide text-moss-600 uppercase">
                                New Patient Info
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                        First Name
                                    </label>
                                    <input
                                        value={data.first_name}
                                        onChange={(e) =>
                                            setData(
                                                'first_name',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Juan"
                                        className={inputClass}
                                    />
                                    {errors.first_name && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.first_name}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="mb-1 block text-xs font-medium text-gray-600">
                                        Last Name
                                    </label>
                                    <input
                                        value={data.last_name}
                                        onChange={(e) =>
                                            setData('last_name', e.target.value)
                                        }
                                        placeholder="Dela Cruz"
                                        className={inputClass}
                                    />
                                    {errors.last_name && (
                                        <p className="mt-1 text-xs text-red-500">
                                            {errors.last_name}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.email}
                                    onChange={(e) =>
                                        setData('email', e.target.value)
                                    }
                                    placeholder="juan@email.com"
                                    className={inputClass}
                                />
                                {errors.email && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-xs font-medium text-gray-600">
                                    Contact{' '}
                                    <span className="text-gray-400">
                                        (optional)
                                    </span>
                                </label>
                                <input
                                    value={data.contact}
                                    onChange={(e) =>
                                        setData('contact', e.target.value)
                                    }
                                    placeholder="09XXXXXXXXX"
                                    className={inputClass}
                                />
                            </div>

                            {/* ✅ Profile fields */}
                            <div className="mt-1 border-t border-moss-200 pt-3">
                                <p className="mb-3 text-xs font-semibold tracking-wide text-moss-500 uppercase">
                                    Patient Profile{' '}
                                    <span className="font-normal text-gray-400 normal-case">
                                        (optional)
                                    </span>
                                </p>
                                <div className="space-y-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-medium text-gray-600">
                                            Birthdate
                                        </label>
                                        <input
                                            type="date"
                                            value={data.birthdate}
                                            onChange={(e) =>
                                                setData(
                                                    'birthdate',
                                                    e.target.value,
                                                )
                                            }
                                            className={inputClass}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                                Sex
                                            </label>
                                            <select
                                                value={data.sex}
                                                onChange={(e) =>
                                                    setData(
                                                        'sex',
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            >
                                                <option value="">
                                                    Select…
                                                </option>
                                                <option value="Male">
                                                    Male
                                                </option>
                                                <option value="Female">
                                                    Female
                                                </option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="mb-1 block text-xs font-medium text-gray-600">
                                                Civil Status
                                            </label>
                                            <select
                                                value={data.civil_status}
                                                onChange={(e) =>
                                                    setData(
                                                        'civil_status',
                                                        e.target.value,
                                                    )
                                                }
                                                className={inputClass}
                                            >
                                                <option value="">
                                                    Select…
                                                </option>
                                                <option value="single">
                                                    Single
                                                </option>
                                                <option value="married">
                                                    Married
                                                </option>
                                                <option value="widowed">
                                                    Widowed
                                                </option>
                                                <option value="separated">
                                                    Separated
                                                </option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Doctor */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Doctor
                        </label>
                        <select
                            value={data.doctor_id}
                            onChange={(e) =>
                                setData('doctor_id', e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Select doctor…</option>
                            {doctors.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {fullName(d)}
                                </option>
                            ))}
                        </select>
                        {errors.doctor_id && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.doctor_id}
                            </p>
                        )}
                    </div>

                    {/* Date & Time */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Date
                            </label>
                            <input
                                type="date"
                                value={data.appointment_date}
                                onChange={(e) =>
                                    setData('appointment_date', e.target.value)
                                }
                                min={new Date().toISOString().split('T')[0]}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={data.start_time}
                                onChange={(e) =>
                                    setData('start_time', e.target.value)
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* Services */}
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Services
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(serviceTypes).map(
                                ([key, label]) => (
                                    <label
                                        key={key}
                                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-sm transition-colors ${
                                            data.service_types.includes(key)
                                                ? 'border-moss-500 bg-moss-50 text-moss-700'
                                                : 'border-gray-200 hover:border-moss-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.service_types.includes(
                                                key,
                                            )}
                                            onChange={() => toggleService(key)}
                                            className="accent-moss-500"
                                        />
                                        {label}
                                    </label>
                                ),
                            )}
                        </div>
                        {errors.service_types && (
                            <p className="mt-1 text-xs text-red-500">
                                {errors.service_types}
                            </p>
                        )}
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Notes (optional)
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={2}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 rounded-xl bg-moss-600 py-2 text-sm font-semibold text-white shadow-lg shadow-moss-500/20 hover:bg-moss-700 disabled:opacity-60"
                        >
                            {processing ? 'Creating…' : 'Create Appointment'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
    appointment,
    doctors,
    serviceTypes,
    onClose,
}: {
    appointment: Appointment;
    doctors: Doctor[];
    serviceTypes: Record<string, string>;
    onClose: () => void;
}) {
    const { data, setData, patch, processing, errors } = useForm({
        doctor_id: String(appointment.doctor?.id ?? ''),
        appointment_date: appointment.appointment_date?.split('T')[0] ?? '',
        start_time: appointment.start_time?.slice(0, 5) ?? '',
        service_types: parseServiceTypes(appointment.service_types),
        notes: appointment.notes ?? '',
    });

    function toggleService(key: string) {
        setData(
            'service_types',
            data.service_types.includes(key)
                ? data.service_types.filter((s) => s !== key)
                : [...data.service_types, key],
        );
    }

    function submit(e: React.FormEvent) {
        e.preventDefault();
        patch(`/staff/appointments/${appointment.id}`, { onSuccess: onClose });
    }

    const inputClass =
        'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-moss-500 focus:outline-none';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-moss-950/25 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b p-5">
                    <h2 className="text-lg font-bold text-gray-900">
                        Edit Appointment
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-xl text-gray-400 hover:text-gray-600"
                    >
                        ✕
                    </button>
                </div>
                <form onSubmit={submit} className="space-y-4 p-5">
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Doctor
                        </label>
                        <select
                            value={data.doctor_id}
                            onChange={(e) =>
                                setData('doctor_id', e.target.value)
                            }
                            className={inputClass}
                        >
                            <option value="">Select doctor…</option>
                            {doctors.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {fullName(d)}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Date
                            </label>
                            <input
                                type="date"
                                value={data.appointment_date}
                                onChange={(e) =>
                                    setData('appointment_date', e.target.value)
                                }
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Start Time
                            </label>
                            <input
                                type="time"
                                value={data.start_time}
                                onChange={(e) =>
                                    setData('start_time', e.target.value)
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="mb-2 block text-sm font-medium text-gray-700">
                            Services
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries(serviceTypes).map(
                                ([key, label]) => (
                                    <label
                                        key={key}
                                        className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2 text-sm transition-colors ${
                                            data.service_types.includes(key)
                                                ? 'border-moss-500 bg-moss-50 text-moss-700'
                                                : 'border-gray-200 hover:border-moss-300'
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={data.service_types.includes(
                                                key,
                                            )}
                                            onChange={() => toggleService(key)}
                                            className="accent-moss-500"
                                        />
                                        {label}
                                    </label>
                                ),
                            )}
                        </div>
                    </div>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-gray-700">
                            Notes
                        </label>
                        <textarea
                            value={data.notes}
                            onChange={(e) => setData('notes', e.target.value)}
                            rows={2}
                            className={`${inputClass} resize-none`}
                        />
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 rounded-xl border border-gray-200 py-2 text-sm text-gray-600 hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="flex-1 rounded-xl bg-moss-600 py-2 text-sm font-semibold text-white shadow-lg shadow-moss-500/20 hover:bg-moss-700 disabled:opacity-60"
                        >
                            {processing ? 'Saving…' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function StaffAppointments() {
    const { appointments, doctors, serviceTypes, statusOptions, filters } =
        usePage<Props>().props;
    const flash = (usePage().props as any).flash as
        | { success?: string }
        | undefined;

    const [showWalkIn, setShowWalkIn] = useState(false);
    const [editing, setEditing] = useState<Appointment | null>(null);
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const [type, setType] = useState(filters.type ?? '');

    const applyFilters = useRef(
        debounce((s: string, st: string, t: string) => {
            router.get(
                '/staff/appointments',
                { search: s, status: st, type: t },
                { preserveState: true, replace: true },
            );
        }, 400),
    ).current;

    useEffect(() => {
        applyFilters(search, status, type);
    }, [search, status, type]);

    function changeStatus(appointment: Appointment, newStatus: string) {
        router.patch(
            `/staff/appointments/${appointment.id}/status`,
            { status: newStatus },
            { preserveScroll: true },
        );
    }

    // Derived stats from current page data
    const total = appointments.data.length;
    const arrived = appointments.data.filter(
        (a) => a.status === 'arrived',
    ).length;
    const pending = appointments.data.filter(
        (a) => a.status === 'pending',
    ).length;
    const completed = appointments.data.filter(
        (a) => a.status === 'completed',
    ).length;

    return (
        <>
            <Head title="Staff — Appointments" />

            <motion.div
                className="space-y-6 p-6"
                variants={container}
                initial="hidden"
                animate="show"
            >
                {/* Flash */}
                {flash?.success && (
                    <motion.div
                        variants={card}
                        className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700"
                    >
                        {flash.success}
                    </motion.div>
                )}

                {/* Header */}
                <motion.div
                    variants={card}
                    className="flex items-center justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Appointments
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Manage walk-ins and online bookings
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setShowWalkIn(true)}
                        className="flex items-center gap-2 rounded-xl bg-moss-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-moss-500/20 transition-colors hover:bg-moss-700"
                    >
                        <Plus className="h-4 w-4" /> Walk-in
                    </motion.button>
                </motion.div>

                {/* Stat Cards */}
                <motion.div
                    variants={container}
                    className="grid grid-cols-2 gap-4 lg:grid-cols-4"
                >
                    {[
                        {
                            label: 'Total (this page)',
                            value: total,
                            icon: (
                                <Calendar className="mt-2 h-5 w-5 text-moss-600" />
                            ),
                        },
                        {
                            label: 'Arrived',
                            value: arrived,
                            icon: (
                                <Users className="mt-2 h-5 w-5 text-indigo-600" />
                            ),
                        },
                        {
                            label: 'Pending',
                            value: pending,
                            icon: (
                                <Clock className="mt-2 h-5 w-5 text-yellow-500" />
                            ),
                        },
                        {
                            label: 'Completed',
                            value: completed,
                            icon: (
                                <Activity className="mt-2 h-5 w-5 text-green-600" />
                            ),
                        },
                    ].map((s, i) => (
                        <motion.div
                            key={i}
                            variants={card}
                            whileHover={{ scale: 1.03 }}
                            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                        >
                            <p className="text-sm text-gray-500">{s.label}</p>
                            <p className="mt-1 text-3xl font-bold text-gray-900">
                                {s.value}
                            </p>
                            {s.icon}
                        </motion.div>
                    ))}
                </motion.div>

                {/* Filters */}
                <motion.div
                    variants={card}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search patient…"
                                className="w-52 rounded-xl border border-gray-200 px-3 py-2 pl-9 text-sm focus:ring-2 focus:ring-moss-500 focus:outline-none"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-400" />
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-moss-500 focus:outline-none"
                            >
                                <option value="">All statuses</option>
                                {statusOptions.map((s) => (
                                    <option key={s} value={s}>
                                        {s.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:ring-2 focus:ring-moss-500 focus:outline-none"
                            >
                                <option value="">All types</option>
                                <option value="walk_in">Walk-in</option>
                                <option value="individual">Individual</option>
                                <option value="company_referral">
                                    Company Referral
                                </option>
                                <option value="company_bulk">
                                    Company Bulk
                                </option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Table */}
                <motion.div
                    variants={card}
                    className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
                >
                    <table className="w-full text-sm">
                        <thead className="border-b border-gray-100 bg-gray-50">
                            <tr>
                                {[
                                    'Patient',
                                    'Doctor',
                                    'Date & Time',
                                    'Type',
                                    'Services',
                                    'Status',
                                    'Actions',
                                ].map((h) => (
                                    <th
                                        key={h}
                                        className="px-4 py-3 text-left text-xs font-semibold tracking-wide text-gray-500 uppercase"
                                    >
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {appointments.data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="px-4 py-12 text-center text-sm text-gray-400"
                                    >
                                        No appointments found.
                                    </td>
                                </tr>
                            ) : (
                                appointments.data.map((appt) => {
                                    const services = parseServiceTypes(
                                        appt.service_types,
                                    );
                                    return (
                                        <tr
                                            key={appt.id}
                                            className="transition-colors hover:bg-gray-50"
                                        >
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-gray-800">
                                                    {appt.user
                                                        ? fullName(appt.user)
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {appt.user?.email}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                {appt.doctor ? (
                                                    fullName(appt.doctor)
                                                ) : (
                                                    <span className="text-gray-300">
                                                        Unassigned
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-600">
                                                <p>
                                                    {appt.appointment_date
                                                        ? formatDate(
                                                              appt.appointment_date,
                                                          )
                                                        : '—'}
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    {appt.start_time?.slice(
                                                        0,
                                                        5,
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-600 capitalize">
                                                {appt.type?.replace(/_/g, ' ')}
                                            </td>
                                            <td className="max-w-[160px] px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {services
                                                        .slice(0, 2)
                                                        .map((s) => (
                                                            <span
                                                                key={s}
                                                                className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-600"
                                                            >
                                                                {s}
                                                            </span>
                                                        ))}
                                                    {services.length > 2 && (
                                                        <span className="text-xs text-gray-400">
                                                            +
                                                            {services.length -
                                                                2}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge status={appt.status} />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        defaultValue={
                                                            appt.status
                                                        }
                                                        onChange={(e) =>
                                                            changeStatus(
                                                                appt,
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="rounded-lg border border-gray-200 bg-white px-2 py-1 text-xs focus:ring-2 focus:ring-moss-500 focus:outline-none"
                                                    >
                                                        {statusOptions.map(
                                                            (s) => (
                                                                <option
                                                                    key={s}
                                                                    value={s}
                                                                >
                                                                    {s.replace(
                                                                        /_/g,
                                                                        ' ',
                                                                    )}
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <button
                                                        onClick={() =>
                                                            setEditing(appt)
                                                        }
                                                        className="rounded-lg px-2 py-1 text-xs font-medium text-moss-600 hover:bg-moss-50 hover:text-moss-800"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </motion.div>

                {/* Pagination */}
                <div className="flex justify-end gap-1">
                    {appointments.links.map((link: any, i: number) => (
                        <button
                            key={i}
                            disabled={!link.url}
                            onClick={() =>
                                link.url &&
                                router.get(
                                    link.url,
                                    {},
                                    { preserveState: true },
                                )
                            }
                            dangerouslySetInnerHTML={{ __html: link.label }}
                            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${
                                link.active
                                    ? 'border-moss-600 bg-moss-600 text-white'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                            } ${!link.url ? 'cursor-not-allowed opacity-40' : ''}`}
                        />
                    ))}
                </div>
            </motion.div>

            {/* Modals */}
            {showWalkIn && (
                <WalkInModal
                    doctors={doctors}
                    serviceTypes={serviceTypes}
                    onClose={() => setShowWalkIn(false)}
                />
            )}
            {editing && (
                <EditModal
                    appointment={editing}
                    doctors={doctors}
                    serviceTypes={serviceTypes}
                    onClose={() => setEditing(null)}
                />
            )}
        </>
    );
}

StaffAppointments.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
