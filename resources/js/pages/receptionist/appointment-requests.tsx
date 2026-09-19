import { Head, router } from '@inertiajs/react';
import {
    CalendarCheck2,
    CheckCircle2,
    Clock3,
    Search,
    UserRound,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { PaginatedResponse } from '@/types/pagination';

type AppointmentStatus = 'pending' | 'accepted' | 'rejected';

type Appointment = {
    id: number;
    appointment_date: string;
    start_time: string | null;
    end_time: string | null;
    status: AppointmentStatus;
    service_types: string[] | null;
    examination_purpose?: string | null;
    rejection_reason?: string | null;
    rejection_details?: string | null;
    processed_at?: string | null;
    user: {
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        email: string;
        contact?: string | null;
        patient_profile?: {
            birthdate?: string | null;
            sex?: string | null;
        } | null;
    };
    doctor?: {
        first_name: string;
        last_name: string;
    } | null;
    processed_by?: {
        first_name: string;
        last_name: string;
    } | null;
};

const rejectionReasons = {
    doctor_unavailable: 'Doctor unavailable',
    schedule_adjustment: 'Schedule adjustment required',
    clinic_unavailable: 'Clinic unavailable',
    incomplete_requirements: 'Incomplete patient requirements',
    duplicate_appointment: 'Duplicate appointment',
    other: 'Other',
};

const statusStyles: Record<AppointmentStatus, string> = {
    pending:
        'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
    accepted:
        'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300',
    rejected:
        'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300',
};

function patientName(appointment: Appointment) {
    return [
        appointment.user.first_name,
        appointment.user.middle_name,
        appointment.user.last_name,
    ]
        .filter(Boolean)
        .join(' ');
}

function formatDate(value: string) {
    const date = value.slice(0, 10);
    return new Intl.DateTimeFormat('en-PH', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(`${date}T00:00:00`));
}

function formatTime(value: string | null) {
    if (!value) return 'Time unavailable';
    const match = value.match(/(\d{2}):(\d{2})/);
    if (!match) return value;
    const date = new Date(2000, 0, 1, Number(match[1]), Number(match[2]));
    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(date);
}

export default function AppointmentRequests({
    appointments,
    filters,
    pendingCount,
}: {
    appointments: PaginatedResponse<Appointment>;
    filters: { search: string; status: string };
    pendingCount: number;
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [processingId, setProcessingId] = useState<number | null>(null);
    const [confirmingAppointment, setConfirmingAppointment] =
        useState<Appointment | null>(null);
    const [rejectingAppointment, setRejectingAppointment] =
        useState<Appointment | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [rejectionDetails, setRejectionDetails] = useState('');
    const [rejectionError, setRejectionError] = useState('');

    function visit(status = filters.status, query = search) {
        router.get(
            '/receptionist/appointment-requests',
            { status, search: query, per_page: appointments.per_page },
            { preserveState: true, replace: true },
        );
    }

    function submitSearch(event: FormEvent) {
        event.preventDefault();
        visit(filters.status, search.trim());
    }

    function approve() {
        if (!confirmingAppointment) return;
        setProcessingId(confirmingAppointment.id);
        router.patch(
            `/receptionist/appointment-requests/${confirmingAppointment.id}/approve`,
            {},
            {
                preserveScroll: true,
                onSuccess: () => setConfirmingAppointment(null),
                onError: (errors) =>
                    toast.error(
                        String(
                            Object.values(errors)[0] ??
                                'Unable to confirm this appointment.',
                        ),
                    ),
                onFinish: () => setProcessingId(null),
            },
        );
    }

    function openReject(appointment: Appointment) {
        setRejectionReason('');
        setRejectionDetails('');
        setRejectionError('');
        setRejectingAppointment(appointment);
    }

    function reject() {
        if (
            !rejectingAppointment ||
            !rejectionReason ||
            (rejectionReason === 'other' && !rejectionDetails.trim())
        ) {
            setRejectionError(
                'Select a reason and provide details when required.',
            );
            return;
        }

        setProcessingId(rejectingAppointment.id);
        router.patch(
            `/receptionist/appointment-requests/${rejectingAppointment.id}/reject`,
            { reason: rejectionReason, details: rejectionDetails },
            {
                preserveScroll: true,
                onSuccess: () => setRejectingAppointment(null),
                onError: (errors) =>
                    setRejectionError(
                        String(
                            Object.values(errors)[0] ??
                                'Unable to reject this appointment.',
                        ),
                    ),
                onFinish: () => setProcessingId(null),
            },
        );
    }

    return (
        <AppLayout>
            <Head title="Appointment Requests" />
            <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="mb-1 text-sm font-semibold text-moss-700 dark:text-moss-300">
                            Receptionist workflow
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950 dark:text-foreground">
                            Appointment Requests
                        </h1>
                        <p className="mt-2 text-slate-600 dark:text-muted-foreground">
                            Review and confirm individual online bookings before
                            patients arrive.
                        </p>
                    </div>
                    <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
                        <Clock3 className="size-4" />
                        {pendingCount} pending{' '}
                        {pendingCount === 1 ? 'request' : 'requests'}
                    </div>
                </header>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row dark:border-border">
                        <form
                            onSubmit={submitSearch}
                            className="flex min-w-0 flex-1 gap-2"
                        >
                            <label className="relative min-w-0 flex-1">
                                <span className="sr-only">
                                    Search appointment requests
                                </span>
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search patient name or email"
                                    className="h-11 w-full rounded-xl border border-slate-300 bg-white pr-3 pl-10 text-sm transition outline-none focus:border-moss-600 focus:ring-4 focus:ring-moss-500/15 dark:border-border dark:bg-background"
                                />
                            </label>
                            <Button type="submit" variant="outline">
                                Search
                            </Button>
                        </form>
                        <select
                            aria-label="Filter request status"
                            value={filters.status}
                            onChange={(event) => visit(event.target.value)}
                            className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm font-medium outline-none focus:border-moss-600 focus:ring-4 focus:ring-moss-500/15 dark:border-border dark:bg-background"
                        >
                            <option value="pending">Pending requests</option>
                            <option value="accepted">Accepted requests</option>
                            <option value="rejected">Rejected requests</option>
                            <option value="">All requests</option>
                        </select>
                    </div>

                    {appointments.data.length === 0 ? (
                        <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
                            <span className="mb-4 grid size-16 place-items-center rounded-full bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300">
                                <CalendarCheck2 className="size-8" />
                            </span>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-foreground">
                                No appointment requests found
                            </h2>
                            <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
                                New online requests will appear here for review.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200 dark:divide-border">
                            {appointments.data.map((appointment) => (
                                <article
                                    key={appointment.id}
                                    className="grid gap-5 p-5 transition hover:bg-slate-50/70 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center dark:hover:bg-accent/40"
                                >
                                    <div className="flex min-w-0 items-center gap-3">
                                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-moss-50 text-moss-700 dark:bg-moss-950 dark:text-moss-300">
                                            <UserRound className="size-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <h2 className="truncate font-bold text-slate-900 dark:text-foreground">
                                                {patientName(appointment)}
                                            </h2>
                                            <p className="truncate text-sm text-slate-500 dark:text-muted-foreground">
                                                {appointment.user.email}
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-foreground">
                                            {formatDate(
                                                appointment.appointment_date,
                                            )}
                                        </p>
                                        <p className="text-sm text-slate-500 dark:text-muted-foreground">
                                            {formatTime(appointment.start_time)}
                                            {appointment.end_time
                                                ? ` – ${formatTime(appointment.end_time)}`
                                                : ''}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="font-semibold text-slate-900 dark:text-foreground">
                                            Dr.{' '}
                                            {appointment.doctor
                                                ? `${appointment.doctor.first_name} ${appointment.doctor.last_name}`
                                                : 'Unassigned'}
                                        </p>
                                        <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
                                            {appointment.service_types?.join(
                                                ', ',
                                            ) || 'No services selected'}
                                        </p>
                                        {appointment.status === 'rejected' &&
                                            appointment.rejection_reason && (
                                                <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                                                    {
                                                        rejectionReasons[
                                                            appointment.rejection_reason as keyof typeof rejectionReasons
                                                        ]
                                                    }
                                                </p>
                                            )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-start gap-2 lg:justify-end">
                                        {appointment.status === 'pending' ? (
                                            <>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    disabled={
                                                        processingId ===
                                                        appointment.id
                                                    }
                                                    onClick={() =>
                                                        openReject(appointment)
                                                    }
                                                    className="border-rose-200 text-rose-700 hover:bg-rose-50 hover:text-rose-800"
                                                >
                                                    <XCircle className="size-4" />
                                                    Reject
                                                </Button>
                                                <Button
                                                    type="button"
                                                    disabled={
                                                        processingId ===
                                                        appointment.id
                                                    }
                                                    onClick={() =>
                                                        setConfirmingAppointment(
                                                            appointment,
                                                        )
                                                    }
                                                    className="bg-moss-700 text-white hover:bg-moss-800"
                                                >
                                                    <CheckCircle2 className="size-4" />
                                                    Accept
                                                </Button>
                                            </>
                                        ) : (
                                            <span
                                                className={`status-text-only text-xs font-bold capitalize ${statusStyles[appointment.status]}`}
                                            >
                                                {appointment.status}
                                            </span>
                                        )}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                    <Pagination
                        pagination={appointments}
                        label="appointment requests"
                    />
                </section>
            </main>

            <Dialog
                open={confirmingAppointment !== null}
                onOpenChange={(open) => !open && setConfirmingAppointment(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Accept appointment request?</DialogTitle>
                        <DialogDescription>
                            This confirms the schedule for{' '}
                            {confirmingAppointment
                                ? patientName(confirmingAppointment)
                                : 'this patient'}
                            . The patient and assigned doctor will be notified.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmingAppointment(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={processingId !== null}
                            onClick={approve}
                            className="bg-moss-700 text-white hover:bg-moss-800"
                        >
                            Accept request
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={rejectingAppointment !== null}
                onOpenChange={(open) => !open && setRejectingAppointment(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject appointment request</DialogTitle>
                        <DialogDescription>
                            Select a reason. The patient will be notified and
                            the reserved slot will become available again.
                        </DialogDescription>
                    </DialogHeader>
                    <label className="space-y-2 text-sm font-semibold">
                        <span>Reason</span>
                        <select
                            value={rejectionReason}
                            onChange={(event) => {
                                setRejectionReason(event.target.value);
                                setRejectionError('');
                            }}
                            className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal outline-none focus:border-moss-600 focus:ring-4 focus:ring-moss-500/15 dark:border-border dark:bg-background"
                        >
                            <option value="">Select a reason</option>
                            {Object.entries(rejectionReasons).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                    </label>
                    <label className="space-y-2 text-sm font-semibold">
                        <span>
                            Additional details{' '}
                            {rejectionReason === 'other'
                                ? '(required)'
                                : '(optional)'}
                        </span>
                        <textarea
                            rows={4}
                            maxLength={500}
                            value={rejectionDetails}
                            onChange={(event) => {
                                setRejectionDetails(event.target.value);
                                setRejectionError('');
                            }}
                            className="w-full resize-none rounded-xl border border-slate-300 bg-white p-3 font-normal outline-none focus:border-moss-600 focus:ring-4 focus:ring-moss-500/15 dark:border-border dark:bg-background"
                        />
                    </label>
                    {rejectionError && (
                        <p role="alert" className="text-sm text-rose-600">
                            {rejectionError}
                        </p>
                    )}
                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRejectingAppointment(null)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            disabled={processingId !== null}
                            onClick={reject}
                            className="bg-rose-700 text-white hover:bg-rose-800"
                        >
                            Reject request
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
