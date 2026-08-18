import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarClock,
    CircleSlash,
    Plus,
    Save,
    Search,
    Trash2,
    UserRound,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Period = { day: string; start: string; end: string };
type Doctor = {
    id: number;
    first_name: string;
    last_name: string;
    specialization: string | null;
    is_active: boolean;
    availability: Period[] | null;
};
type Props = {
    doctors: Doctor[];
    days: Record<string, string>;
    selectedDoctorId?: number;
    filters: { search?: string; status?: string };
    clinicHours: { opens_at: string; closes_at: string };
    isAdmin: boolean;
};
const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctor Availability', href: '/admin/doctor-availability' },
];

export default function DoctorAvailability({
    doctors,
    days,
    selectedDoctorId,
    filters,
    clinicHours,
    isAdmin,
}: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const selected =
        doctors.find((doctor) => doctor.id === selectedDoctorId) ?? doctors[0];
    const { data, setData, patch, processing, errors, clearErrors } = useForm<{
        doctor_id: number;
        availability: Period[];
        action: string;
    }>({
        doctor_id: selected?.id ?? 0,
        availability: selected?.availability ?? [],
        action: 'save',
    });

    useEffect(() => {
        setData({
            doctor_id: selected?.id ?? 0,
            availability: selected?.availability ?? [],
            action: 'save',
        });
        clearErrors();
    }, [selected?.id]);

    useEffect(() => {
        if (!isAdmin) return;
        const timer = window.setTimeout(
            () =>
                router.get(
                    '/admin/doctor-availability',
                    {
                        search: search || undefined,
                        status: status || undefined,
                    },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        replace: true,
                    },
                ),
            300,
        );
        return () => window.clearTimeout(timer);
    }, [search, status]);

    const grouped = useMemo(
        () =>
            Object.keys(days).reduce<Record<string, Period[]>>(
                (result, day) => ({
                    ...result,
                    [day]: data.availability.filter(
                        (period) => period.day === day,
                    ),
                }),
                {},
            ),
        [data.availability, days],
    );
    const addPeriod = (day: string) =>
        setData('availability', [
            ...data.availability,
            { day, start: clinicHours.opens_at, end: clinicHours.closes_at },
        ]);
    const updatePeriod = (
        day: string,
        index: number,
        field: 'start' | 'end',
        value: string,
    ) => {
        let seen = -1;
        setData(
            'availability',
            data.availability.map((period) =>
                period.day === day && ++seen === index
                    ? { ...period, [field]: value }
                    : period,
            ),
        );
    };
    const removePeriod = (day: string, index: number) => {
        let seen = -1;
        setData(
            'availability',
            data.availability.filter(
                (period) => !(period.day === day && ++seen === index),
            ),
        );
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();
        setData('action', 'save');
        patch('/admin/doctor-availability', { preserveScroll: true });
    };
    const clearSchedule = () => {
        if (
            !selected ||
            !window.confirm(
                `Clear all recurring availability for Dr. ${selected.last_name}? Existing future appointments will prevent this change.`,
            )
        )
            return;
        router.patch(
            '/admin/doctor-availability',
            { doctor_id: selected.id, availability: [], action: 'clear' },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Doctor Availability" />
            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-semibold text-moss-600">
                            Management
                        </p>
                        <h1 className="text-2xl font-bold text-slate-950">
                            Doctor availability
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Set recurring clinic periods. Hours are limited to{' '}
                            {clinicHours.opens_at}–{clinicHours.closes_at}.
                        </p>
                    </div>
                    {selected && (
                        <Button form="availability-form" disabled={processing}>
                            <Save className="h-4 w-4" />
                            {processing ? 'Saving…' : 'Save schedule'}
                        </Button>
                    )}
                </div>

                {isAdmin && (
                    <div className="grid gap-3 rounded-2xl border bg-white p-3 shadow-sm sm:grid-cols-[1fr_180px]">
                        <div className="relative">
                            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search doctor or specialization"
                                className="pl-9"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="h-10 rounded-md border bg-white px-3 text-sm"
                        >
                            <option value="">All statuses</option>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                    {isAdmin && (
                        <aside className="space-y-2 rounded-2xl border bg-white p-3 shadow-sm">
                            <p className="px-2 py-1 text-xs font-bold tracking-wider text-slate-500 uppercase">
                                Doctors ({doctors.length})
                            </p>
                            {doctors.map((doctor) => (
                                <button
                                    key={doctor.id}
                                    onClick={() =>
                                        router.get(
                                            '/admin/doctor-availability',
                                            {
                                                doctor_id: doctor.id,
                                                search: search || undefined,
                                                status: status || undefined,
                                            },
                                            { preserveState: true },
                                        )
                                    }
                                    className={`motion-press flex w-full items-center gap-3 rounded-xl p-3 text-left transition-[background-color,box-shadow,color] duration-200 ${doctor.id === selected?.id ? 'bg-moss-50 ring-1 ring-moss-200' : 'hover:bg-slate-50'}`}
                                >
                                    <span className="grid h-9 w-9 place-items-center rounded-full bg-moss-100 text-moss-700">
                                        <UserRound className="h-4 w-4" />
                                    </span>
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate text-sm font-semibold">
                                            Dr. {doctor.first_name}{' '}
                                            {doctor.last_name}
                                        </span>
                                        <span className="block truncate text-xs text-slate-500">
                                            {doctor.specialization ||
                                                'General practice'}
                                        </span>
                                    </span>
                                    <span
                                        className={`h-2 w-2 rounded-full ${doctor.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                    />
                                </button>
                            ))}
                            {!doctors.length && (
                                <p className="p-6 text-center text-sm text-slate-500">
                                    No doctors match these filters.
                                </p>
                            )}
                        </aside>
                    )}

                    <section className="min-w-0">
                        {!selected ? (
                            <div className="rounded-2xl border border-dashed bg-white p-16 text-center text-slate-500">
                                <CircleSlash className="mx-auto mb-3 h-8 w-8" />
                                No doctor is available to schedule.
                            </div>
                        ) : (
                            <form
                                id="availability-form"
                                onSubmit={submit}
                                className="space-y-4"
                            >
                                <div className="rounded-2xl border bg-white p-5 shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <CalendarClock className="h-5 w-5 text-moss-600" />
                                        <div>
                                            <h2 className="font-bold">
                                                Dr. {selected.first_name}{' '}
                                                {selected.last_name}
                                            </h2>
                                            <p className="text-sm text-slate-500">
                                                {selected.specialization ||
                                                    'General practice'}{' '}
                                                ·{' '}
                                                {selected.is_active
                                                    ? 'Active'
                                                    : 'Inactive account'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                {Object.entries(days).map(([day, label]) => (
                                    <div
                                        key={day}
                                        className="rounded-2xl border bg-white p-4 shadow-sm transition-colors duration-200 hover:border-moss-200 sm:p-5"
                                    >
                                        <div className="mb-3 flex items-center justify-between">
                                            <div>
                                                <h3 className="font-semibold">
                                                    {label}
                                                </h3>
                                                <p className="text-xs text-slate-500">
                                                    {grouped[day].length
                                                        ? `${grouped[day].length} period${grouped[day].length > 1 ? 's' : ''}`
                                                        : 'Unavailable'}
                                                </p>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addPeriod(day)}
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add period
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {grouped[day].map(
                                                (period, index) => (
                                                    <div
                                                        key={`${day}-${index}`}
                                                        className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 rounded-xl bg-slate-50 p-3 transition-colors duration-200 focus-within:bg-moss-50/60"
                                                    >
                                                        <Input
                                                            type="time"
                                                            min={
                                                                clinicHours.opens_at
                                                            }
                                                            max={
                                                                clinicHours.closes_at
                                                            }
                                                            value={period.start}
                                                            onChange={(e) =>
                                                                updatePeriod(
                                                                    day,
                                                                    index,
                                                                    'start',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <span className="text-sm text-slate-400">
                                                            to
                                                        </span>
                                                        <Input
                                                            type="time"
                                                            min={
                                                                clinicHours.opens_at
                                                            }
                                                            max={
                                                                clinicHours.closes_at
                                                            }
                                                            value={period.end}
                                                            onChange={(e) =>
                                                                updatePeriod(
                                                                    day,
                                                                    index,
                                                                    'end',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() =>
                                                                removePeriod(
                                                                    day,
                                                                    index,
                                                                )
                                                            }
                                                            aria-label={`Remove ${label} period`}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    </div>
                                                ),
                                            )}
                                            {!grouped[day].length && (
                                                <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                                                    No clinic hours set.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {Object.values(errors).length > 0 && (
                                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                                        {Object.values(errors).map(
                                            (error, index) => (
                                                <p key={index}>{error}</p>
                                            ),
                                        )}
                                    </div>
                                )}
                                <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={clearSchedule}
                                        className="text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Clear schedule
                                    </Button>
                                    <Button disabled={processing}>
                                        <Save className="h-4 w-4" />
                                        Save schedule
                                    </Button>
                                </div>
                            </form>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

DoctorAvailability.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
