import { Head, router, useForm } from '@inertiajs/react';
import axios from 'axios';
import {
    Check,
    History,
    Printer,
    Search,
    SkipForward,
    UserPlus,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import AppLayout from '@/layouts/app-layout';

type Patient = {
    id: number;
    first_name: string;
    middle_name?: string;
    last_name: string;
    email?: string;
    contact?: string;
};
type WalkIn = {
    id: number;
    queue_number: string;
    status: 'pending' | 'accepted' | 'arrived' | 'completed' | 'cancelled';
    type: 'walk_in' | 'individual' | 'company_referral';
    service_types: string[];
    appointment_date: string;
    notes?: string;
    user: Patient;
};

const statusLabels = {
    pending: 'Waiting',
    accepted: 'Scheduled',
    arrived: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
} as const;
const statusStyles = {
    pending: 'bg-amber-50 text-amber-700',
    accepted: 'bg-sky-50 text-sky-700',
    arrived: 'bg-violet-50 text-violet-700',
    completed: 'bg-emerald-50 text-emerald-700',
    cancelled: 'bg-rose-50 text-rose-700',
} as const;

export default function WalkIns({
    walkIns,
    serviceTypes,
    filters,
    mode,
}: {
    walkIns: WalkIn[];
    serviceTypes: Record<string, string>;
    filters: { status: string; search: string };
    mode: 'queue' | 'patients';
}) {
    const [showRegistration, setShowRegistration] = useState(
        mode !== 'patients',
    );
    const [patientQuery, setPatientQuery] = useState('');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(
        null,
    );
    const form = useForm({
        patient_type: 'existing',
        user_id: null as number | null,
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        contact: '',
        birthdate: '',
        sex: '',
        civil_status: '',
        service_types: [] as string[],
        notes: '',
    });

    async function searchPatients() {
        if (patientQuery.trim().length < 2) return;
        const response = await axios.get('/receptionist/patients/search', {
            params: { q: patientQuery },
        });
        setPatients(response.data);
    }

    function selectPatient(patient: Patient) {
        setSelectedPatient(patient);
        form.setData('user_id', patient.id);
        setPatients([]);
    }

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/receptionist/walk-ins', {
            onSuccess: () => {
                form.reset();
                setSelectedPatient(null);
            },
        });
    }

    function updateStatus(walkIn: WalkIn, status: WalkIn['status']) {
        router.patch(
            `/receptionist/walk-ins/${walkIn.id}/status`,
            { status },
            { preserveScroll: true },
        );
    }

    function filter(status = '', search = filters.search) {
        router.get(
            '/receptionist/queue',
            { status, search },
            { preserveState: true, replace: true },
        );
    }

    const activeQueue = walkIns.filter(
        (appointment) =>
            !['completed', 'cancelled'].includes(appointment.status),
    );
    const queueHistory = walkIns.filter((appointment) =>
        ['completed', 'cancelled'].includes(appointment.status),
    );

    return (
        <>
            <Head title="Walk-in Patients" />
            <div className="space-y-6 p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-semibold text-moss-700">
                            Reception desk
                        </p>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">
                            Today’s walk-in patients
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Register patients, assign services, and move the
                            queue forward.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowRegistration(!showRegistration)}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-moss-700 px-5 py-3 text-sm font-semibold text-white hover:bg-moss-800"
                    >
                        <UserPlus className="size-4" /> New walk-in
                    </button>
                </header>

                {showRegistration && (
                    <form
                        onSubmit={submit}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <div className="mb-5 flex gap-2">
                            {(['existing', 'new'] as const).map((kind) => (
                                <button
                                    type="button"
                                    key={kind}
                                    onClick={() => {
                                        form.setData('patient_type', kind);
                                        setSelectedPatient(null);
                                    }}
                                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${form.data.patient_type === kind ? 'bg-moss-100 text-moss-800' : 'bg-slate-50 text-slate-500'}`}
                                >
                                    {kind === 'existing'
                                        ? 'Existing patient'
                                        : 'Register new patient'}
                                </button>
                            ))}
                        </div>

                        {form.data.patient_type === 'existing' ? (
                            <div className="relative max-w-xl">
                                <label className="text-sm font-semibold text-slate-700">
                                    Patient search
                                </label>
                                <div className="mt-2 flex gap-2">
                                    <input
                                        value={patientQuery}
                                        onChange={(e) =>
                                            setPatientQuery(e.target.value)
                                        }
                                        onKeyDown={(e) =>
                                            e.key === 'Enter' &&
                                            (e.preventDefault(),
                                            searchPatients())
                                        }
                                        placeholder="Name, email, or contact"
                                        className="w-full rounded-xl border border-slate-200 px-4 py-2.5"
                                    />
                                    <button
                                        type="button"
                                        onClick={searchPatients}
                                        className="rounded-xl border border-slate-200 px-4"
                                    >
                                        <Search className="size-4" />
                                    </button>
                                </div>
                                {patients.length > 0 && (
                                    <div className="absolute z-10 mt-1 w-full rounded-xl border bg-white p-2 shadow-xl">
                                        {patients.map((patient) => (
                                            <button
                                                type="button"
                                                key={patient.id}
                                                onClick={() =>
                                                    selectPatient(patient)
                                                }
                                                className="block w-full rounded-lg p-3 text-left hover:bg-slate-50"
                                            >
                                                <span className="font-semibold">
                                                    {patient.first_name}{' '}
                                                    {patient.last_name}
                                                </span>
                                                <span className="block text-xs text-slate-500">
                                                    {patient.email ||
                                                        patient.contact ||
                                                        'No contact details'}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {selectedPatient && (
                                    <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800">
                                        <Check className="size-4" />{' '}
                                        {selectedPatient.first_name}{' '}
                                        {selectedPatient.last_name}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-3">
                                <input
                                    required
                                    placeholder="First name"
                                    value={form.data.first_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'first_name',
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                />
                                <input
                                    placeholder="Middle name"
                                    value={form.data.middle_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'middle_name',
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                />
                                <input
                                    required
                                    placeholder="Last name"
                                    value={form.data.last_name}
                                    onChange={(e) =>
                                        form.setData(
                                            'last_name',
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                />
                                <input
                                    type="email"
                                    placeholder="Email (optional)"
                                    value={form.data.email}
                                    onChange={(e) =>
                                        form.setData('email', e.target.value)
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                />
                                <input
                                    placeholder="Contact number"
                                    value={form.data.contact}
                                    onChange={(e) =>
                                        form.setData('contact', e.target.value)
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                />
                                <input
                                    type="date"
                                    value={form.data.birthdate}
                                    onChange={(e) =>
                                        form.setData(
                                            'birthdate',
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                />
                                <select
                                    value={form.data.sex}
                                    onChange={(e) =>
                                        form.setData('sex', e.target.value)
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                >
                                    <option value="">Sex</option>
                                    <option>Male</option>
                                    <option>Female</option>
                                </select>
                                <select
                                    value={form.data.civil_status}
                                    onChange={(e) =>
                                        form.setData(
                                            'civil_status',
                                            e.target.value,
                                        )
                                    }
                                    className="rounded-xl border border-slate-200 px-4 py-2.5"
                                >
                                    <option value="">Civil status</option>
                                    {[
                                        'Single',
                                        'Married',
                                        'Divorced',
                                        'Widowed',
                                        'Separated',
                                    ].map((value) => (
                                        <option key={value}>{value}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mt-6">
                            <p className="text-sm font-semibold text-slate-700">
                                Assign services
                            </p>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {Object.entries(serviceTypes).map(
                                    ([value, label]) => {
                                        const selected =
                                            form.data.service_types.includes(
                                                value,
                                            );
                                        return (
                                            <button
                                                type="button"
                                                key={value}
                                                onClick={() =>
                                                    form.setData(
                                                        'service_types',
                                                        selected
                                                            ? form.data.service_types.filter(
                                                                  (item) =>
                                                                      item !==
                                                                      value,
                                                              )
                                                            : [
                                                                  ...form.data
                                                                      .service_types,
                                                                  value,
                                                              ],
                                                    )
                                                }
                                                className={`rounded-full border px-3 py-2 text-xs font-semibold ${selected ? 'border-moss-600 bg-moss-50 text-moss-800' : 'border-slate-200 text-slate-600'}`}
                                            >
                                                {label}
                                            </button>
                                        );
                                    },
                                )}
                            </div>
                        </div>
                        <textarea
                            value={form.data.notes}
                            onChange={(e) =>
                                form.setData('notes', e.target.value)
                            }
                            placeholder="Front-desk notes (optional)"
                            className="mt-5 min-h-20 w-full rounded-xl border border-slate-200 px-4 py-3"
                        />
                        {Object.keys(form.errors).length > 0 && (
                            <p className="mt-3 text-sm text-rose-600">
                                Please review the patient and service
                                information.
                            </p>
                        )}
                        <button
                            disabled={
                                form.processing ||
                                form.data.service_types.length === 0 ||
                                (form.data.patient_type === 'existing' &&
                                    !form.data.user_id)
                            }
                            className="mt-5 rounded-xl bg-moss-700 px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
                        >
                            Add to queue
                        </button>
                    </form>
                )}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex gap-2">
                            {[
                                ['', 'All'],
                                ['pending', 'Waiting'],
                                ['arrived', 'Processing'],
                                ['completed', 'Completed'],
                                ['cancelled', 'Cancelled'],
                            ].map(([value, label]) => (
                                <button
                                    key={value}
                                    onClick={() => filter(value)}
                                    className={`rounded-lg px-3 py-2 text-xs font-semibold ${filters.status === value ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-600'}`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600"
                        >
                            <Printer className="size-4" /> Print queue
                        </button>
                    </div>
                    {activeQueue.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            <Users className="mx-auto mb-3 size-8 text-slate-300" />
                            No active patients found for today.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {activeQueue.map((walkIn) => (
                                <article
                                    key={walkIn.id}
                                    className="grid gap-4 p-5 md:grid-cols-[90px_1fr_1fr_auto] md:items-center"
                                >
                                    <div className="text-2xl font-black text-slate-900">
                                        {walkIn.queue_number}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-slate-900">
                                            {walkIn.user.first_name}{' '}
                                            {walkIn.user.last_name}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            {walkIn.user.email ||
                                                walkIn.user.contact ||
                                                'Walk-in patient'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                        {walkIn.service_types?.map(
                                            (service) => (
                                                <span
                                                    key={service}
                                                    className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600"
                                                >
                                                    {service}
                                                </span>
                                            ),
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={walkIn.status}
                                            onChange={(e) =>
                                                updateStatus(
                                                    walkIn,
                                                    e.target
                                                        .value as WalkIn['status'],
                                                )
                                            }
                                            className={`rounded-xl border-0 px-3 py-2 text-xs font-bold ${statusStyles[walkIn.status]}`}
                                        >
                                            {Object.entries(statusLabels).map(
                                                ([value, label]) => (
                                                    <option
                                                        key={value}
                                                        value={value}
                                                    >
                                                        {label}
                                                    </option>
                                                ),
                                            )}
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        'Skip this appointment? It will be moved to history as cancelled.',
                                                    )
                                                )
                                                    updateStatus(
                                                        walkIn,
                                                        'cancelled',
                                                    );
                                            }}
                                            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-50"
                                        >
                                            <SkipForward className="size-3.5" />
                                            Skip
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center gap-2 border-b border-slate-100 p-5">
                        <History className="size-5 text-slate-500" />
                        <h2 className="font-bold text-slate-900">
                            Today&apos;s queue history
                        </h2>
                    </div>
                    {queueHistory.length === 0 ? (
                        <p className="p-8 text-center text-sm text-slate-500">
                            No completed or skipped appointments yet.
                        </p>
                    ) : (
                        <div className="divide-y divide-slate-100">
                            {queueHistory.map((appointment) => (
                                <article
                                    key={appointment.id}
                                    className="grid gap-3 p-5 sm:grid-cols-[90px_1fr_1fr_auto] sm:items-center"
                                >
                                    <strong>{appointment.queue_number}</strong>
                                    <span className="font-semibold text-slate-900">
                                        {appointment.user.first_name}{' '}
                                        {appointment.user.last_name}
                                    </span>
                                    <span className="text-sm text-slate-500">
                                        {appointment.service_types.join(', ')}
                                    </span>
                                    <span
                                        className={`w-fit rounded-full px-3 py-1 text-xs font-bold ${statusStyles[appointment.status]}`}
                                    >
                                        {statusLabels[appointment.status]}
                                    </span>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

WalkIns.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
