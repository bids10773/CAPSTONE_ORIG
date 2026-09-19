import { Head, router, useForm } from '@inertiajs/react';
import {
    CalendarClock,
    CheckCircle2,
    CircleSlash,
    Clock3,
    Plus,
    Save,
    Trash2,
    UserRound,
    XCircle,
} from 'lucide-react';
import type { FormEvent, ReactElement } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { SearchFilterToolbar } from '@/components/search-filter-toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

type Period = { day: string; start: string; end: string };
type Doctor = {
    id: number;
    first_name: string;
    last_name: string;
    specialization: string | null;
    is_active: boolean;
    availability: Period[] | null;
};
type AffectedAppointment = {
    id: number;
    patient_name: string;
    appointment_date: string;
    start_time: string;
    end_time: string;
    status: string;
};
type AvailabilityRequest = {
    id: number;
    doctor_id: number;
    doctor: Pick<Doctor, 'id' | 'first_name' | 'last_name' | 'specialization'>;
    status?: string;
    current_availability?: Period[];
    requested_availability?: Period[];
    affected_appointments?: AffectedAppointment[];
    created_at: string;
};
type Props = {
    doctors: Doctor[];
    days: Record<string, string>;
    selectedDoctorId?: number;
    filters: { search?: string; status?: string };
    availabilityHours: { opensAt: string; closesAt: string };
    isAdmin: boolean;
    pendingRequests: AvailabilityRequest[];
    selectedRequest: AvailabilityRequest | null;
};
export default function DoctorAvailability({
    doctors,
    days,
    selectedDoctorId,
    filters,
    availabilityHours,
    isAdmin,
    pendingRequests,
    selectedRequest,
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
    }, [selected?.id, selected?.availability, setData, clearErrors]);

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
    }, [search, status, isAdmin]);

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
            {
                day,
                start: availabilityHours.opensAt,
                end: availabilityHours.closesAt,
            },
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
        patch(
            isAdmin
                ? '/admin/doctor-availability'
                : '/doctor/doctor-availability',
            { preserveScroll: true },
        );
    };
    const clearSchedule = () => {
        if (
            !selected ||
            !window.confirm(
                isAdmin
                    ? `Clear all recurring availability for Dr. ${selected.last_name}? Existing future appointments will prevent this change.`
                    : 'Submit a request to clear your recurring availability?',
            )
        )
            return;
        router.patch(
            isAdmin
                ? '/admin/doctor-availability'
                : '/doctor/doctor-availability',
            { doctor_id: selected.id, availability: [], action: 'clear' },
            { preserveScroll: true },
        );
    };

    return (
        <>
            <Head title="Doctor Availability" />
            <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                {!isAdmin && (
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <h1 className="text-2xl font-semibold tracking-[-.03em] text-slate-950 dark:text-slate-100">
                            Doctor Availability
                        </h1>
                        {selected && (
                            <Button
                                form="availability-form"
                                disabled={
                                    processing || Boolean(selectedRequest)
                                }
                            >
                                <Save className="h-4 w-4" />
                                {processing
                                    ? 'Submitting…'
                                    : selectedRequest
                                      ? 'Request pending'
                                      : 'Submit change request'}
                            </Button>
                        )}
                    </div>
                )}

                {isAdmin && (
                    <SearchFilterToolbar
                        title="Doctor Availability"
                        search={{
                            value: search,
                            onChange: (event) => setSearch(event.target.value),
                            placeholder: 'Search doctor or specialization',
                            'aria-label': 'Search doctors',
                        }}
                        onSubmit={(event) => event.preventDefault()}
                        sections={[
                            {
                                label: 'Status',
                                content: (
                                    <select
                                        value={status}
                                        onChange={(event) =>
                                            setStatus(event.target.value)
                                        }
                                        className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm"
                                    >
                                        <option value="">All statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                ),
                            },
                        ]}
                        actions={
                            selected && (
                                <Button
                                    form="availability-form"
                                    disabled={processing}
                                    className="h-12"
                                >
                                    <Save className="h-4 w-4" />
                                    {processing ? 'Saving…' : 'Save schedule'}
                                </Button>
                            )
                        }
                    />
                )}

                {!isAdmin && selectedRequest && (
                    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
                        <div className="flex items-start gap-3">
                            <Clock3 className="mt-0.5 size-5 shrink-0" />
                            <div>
                                <h2 className="font-bold">
                                    Availability change pending
                                </h2>
                                <p className="mt-1 text-sm">
                                    Your current approved schedule remains
                                    active while an administrator reviews your
                                    request.
                                </p>
                            </div>
                        </div>
                    </section>
                )}

                {isAdmin && pendingRequests.length > 0 && (
                    <section className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                        <div className="mb-4 flex items-center gap-3">
                            <Clock3 className="size-5 text-amber-600" />
                            <div>
                                <h2 className="font-bold">
                                    Pending availability requests
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {pendingRequests.length} request
                                    {pendingRequests.length === 1
                                        ? ''
                                        : 's'}{' '}
                                    waiting for review
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {pendingRequests.map((changeRequest) => (
                                <button
                                    key={changeRequest.id}
                                    type="button"
                                    onClick={() =>
                                        router.get(
                                            '/admin/doctor-availability',
                                            {
                                                doctor_id:
                                                    changeRequest.doctor_id,
                                                request_id: changeRequest.id,
                                            },
                                            { preserveState: true },
                                        )
                                    }
                                    className={`rounded-xl border px-4 py-3 text-left text-sm transition ${selectedRequest?.id === changeRequest.id ? 'border-moss-500 bg-moss-50 text-moss-900' : 'border-slate-200 hover:border-moss-300'}`}
                                >
                                    <span className="block font-bold">
                                        Dr. {changeRequest.doctor.first_name}{' '}
                                        {changeRequest.doctor.last_name}
                                    </span>
                                    <span className="mt-0.5 block text-xs text-slate-500">
                                        {new Date(
                                            changeRequest.created_at,
                                        ).toLocaleString('en-PH')}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {isAdmin && selectedRequest && (
                    <AvailabilityRequestReview
                        request={selectedRequest}
                        days={days}
                    />
                )}

                <div
                    className={`grid gap-6 ${isAdmin ? 'lg:grid-cols-[280px_minmax(0,1fr)]' : 'grid-cols-1'}`}
                >
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
                                {isAdmin && (
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
                                )}
                                <div
                                    className={`grid items-start gap-4 md:grid-cols-2 ${isAdmin ? '2xl:grid-cols-2' : 'xl:grid-cols-3'}`}
                                >
                                    {Object.entries(days).map(
                                        ([day, label]) => (
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
                                                        onClick={() =>
                                                            addPeriod(day)
                                                        }
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
                                                                        availabilityHours.opensAt
                                                                    }
                                                                    max={
                                                                        availabilityHours.closesAt
                                                                    }
                                                                    value={
                                                                        period.start
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updatePeriod(
                                                                            day,
                                                                            index,
                                                                            'start',
                                                                            e
                                                                                .target
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
                                                                        availabilityHours.opensAt
                                                                    }
                                                                    max={
                                                                        availabilityHours.closesAt
                                                                    }
                                                                    value={
                                                                        period.end
                                                                    }
                                                                    onChange={(
                                                                        e,
                                                                    ) =>
                                                                        updatePeriod(
                                                                            day,
                                                                            index,
                                                                            'end',
                                                                            e
                                                                                .target
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
                                        ),
                                    )}
                                </div>
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
                                        disabled={
                                            processing ||
                                            (!isAdmin &&
                                                Boolean(selectedRequest))
                                        }
                                        className="text-red-600"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Clear schedule
                                    </Button>
                                    <Button
                                        disabled={
                                            processing ||
                                            (!isAdmin &&
                                                Boolean(selectedRequest))
                                        }
                                    >
                                        <Save className="h-4 w-4" />
                                        {isAdmin
                                            ? 'Save schedule'
                                            : selectedRequest
                                              ? 'Request pending'
                                              : 'Submit change request'}
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

function AvailabilityRequestReview({
    request,
    days,
}: {
    request: AvailabilityRequest;
    days: Record<string, string>;
}) {
    const [processing, setProcessing] = useState(false);
    const review = (decision: 'approve' | 'reject') => {
        setProcessing(true);
        router.patch(
            `/admin/doctor-availability-requests/${request.id}/${decision}`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
            },
        );
    };

    return (
        <section className="overflow-hidden rounded-2xl border border-moss-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-4 bg-moss-800 px-5 py-5 text-white sm:flex-row sm:items-center">
                <div>
                    <p className="text-xs font-bold tracking-wider text-moss-200 uppercase">
                        Admin review
                    </p>
                    <h2 className="mt-1 text-xl font-bold">
                        Dr. {request.doctor.first_name}{' '}
                        {request.doctor.last_name}
                    </h2>
                    <p className="mt-1 text-sm text-moss-100/80">
                        Requested{' '}
                        {new Date(request.created_at).toLocaleString('en-PH')}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        disabled={processing}
                        onClick={() => review('reject')}
                        className="border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
                    >
                        <XCircle className="size-4" />
                        Reject
                    </Button>
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={() => review('approve')}
                        className="bg-white text-moss-800 hover:bg-moss-50"
                    >
                        <CheckCircle2 className="size-4" />
                        Accept request
                    </Button>
                </div>
            </div>

            <div className="grid gap-5 p-5 lg:grid-cols-2">
                <SchedulePreview
                    title="Current approved availability"
                    periods={request.current_availability ?? []}
                    days={days}
                />
                <SchedulePreview
                    title="Requested availability"
                    periods={request.requested_availability ?? []}
                    days={days}
                    requested
                />
            </div>

            <div className="border-t border-slate-200 px-5 py-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                    <h3 className="font-bold">
                        Potentially affected appointments
                    </h3>
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                        {request.affected_appointments?.length ?? 0}
                    </span>
                </div>
                {request.affected_appointments?.length ? (
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50 text-left text-xs text-slate-500 uppercase">
                                <tr>
                                    <th className="px-4 py-3">Patient</th>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3">Current time</th>
                                    <th className="px-4 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {request.affected_appointments.map(
                                    (appointment) => (
                                        <tr
                                            key={appointment.id}
                                            className="border-t border-slate-100"
                                        >
                                            <td className="px-4 py-3 font-semibold">
                                                {appointment.patient_name}
                                            </td>
                                            <td className="px-4 py-3">
                                                {new Date(
                                                    `${appointment.appointment_date}T00:00:00`,
                                                ).toLocaleDateString('en-PH')}
                                            </td>
                                            <td className="px-4 py-3">
                                                {appointment.start_time}–
                                                {appointment.end_time}
                                            </td>
                                            <td className="px-4 py-3 capitalize">
                                                {appointment.status.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </td>
                                        </tr>
                                    ),
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="rounded-xl bg-moss-50 p-4 text-sm text-moss-800">
                        No existing appointments fall outside the requested
                        availability.
                    </p>
                )}
            </div>
        </section>
    );
}

function SchedulePreview({
    title,
    periods,
    days,
    requested = false,
}: {
    title: string;
    periods: Period[];
    days: Record<string, string>;
    requested?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border p-4 ${requested ? 'border-moss-300 bg-moss-50/70' : 'border-slate-200 bg-slate-50/70'}`}
        >
            <h3 className="text-sm font-bold">{title}</h3>
            <div className="mt-3 space-y-2">
                {Object.entries(days).map(([day, label]) => {
                    const dayPeriods = periods.filter(
                        (period) => period.day === day,
                    );
                    if (!dayPeriods.length) return null;

                    return (
                        <div
                            key={day}
                            className="flex items-start justify-between gap-3 text-sm"
                        >
                            <span className="font-semibold">{label}</span>
                            <span className="text-right text-slate-600">
                                {dayPeriods
                                    .map(
                                        (period) =>
                                            `${period.start}–${period.end}`,
                                    )
                                    .join(', ')}
                            </span>
                        </div>
                    );
                })}
                {!periods.length && (
                    <p className="text-sm text-slate-500">No availability</p>
                )}
            </div>
        </div>
    );
}

DoctorAvailability.layout = (page: ReactElement<Props>) => (
    <AppLayout
        breadcrumbs={[
            {
                title: 'Doctor Availability',
                href: page.props.isAdmin
                    ? '/admin/doctor-availability'
                    : '/doctor/doctor-availability',
            },
        ]}
    >
        {page}
    </AppLayout>
);
