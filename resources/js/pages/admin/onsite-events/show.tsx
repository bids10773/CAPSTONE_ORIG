import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    CheckCircle2,
    FileSpreadsheet,
    UserPlus,
    UsersRound,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type Role = 'doctor' | 'medtech' | 'radtech' | 'receptionist';
type Staff = { id: number; first_name: string; last_name: string; role: Role };
type Deployment = {
    id: number;
    service_role: Role;
    queue_capacity: number;
    is_active: boolean;
    user: Staff;
};
type Recommendation = {
    required: boolean;
    recommended: number;
    active_available: number;
    employees_per_staff: number;
};
type Employee = {
    id: number;
    user: {
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        patient_profile?: { employee_number?: string | null };
    };
    service_progress: Record<
        'physical_exam' | 'laboratory' | 'drug_test' | 'xray' | 'final_evaluation',
        string
    >;
};
type Page<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};
const roles: Role[] = ['doctor', 'medtech', 'radtech', 'receptionist'];
const roleName = (role: Role) =>
    ({
        doctor: 'Doctors',
        medtech: 'Medical Technologists',
        radtech: 'Radiologic Technologists',
        receptionist: 'Receptionists',
    })[role];
const progressLabel = (status: string) =>
    ({
        completed: 'Completed',
        awaiting_result: 'For verification',
        draft: 'Pending',
        pending: 'Pending',
        ready: 'Ready',
        locked: 'Locked',
        not_required: 'N/A',
    })[status] ?? status.replaceAll('_', ' ');
const progressClass = (status: string) =>
    status === 'completed'
        ? 'bg-emerald-50 text-emerald-700'
        : status === 'ready'
          ? 'bg-blue-50 text-blue-700'
          : status === 'not_required'
            ? 'bg-slate-50 text-slate-400'
            : 'bg-amber-50 text-amber-700';

export default function AdminOnsiteEvent({
    event,
    attendance,
    employees,
    staffing,
    staffOptions,
}: {
    event: any;
    attendance: Record<string, number>;
    employees: Page<Employee>;
    staffing: {
        ready: boolean;
        missing_roles: Role[];
        recommendations: Record<Role, Recommendation>;
        default_queue_capacity: number;
    };
    staffOptions: Staff[];
}) {
    const [capacity, setCapacity] = useState(staffing.default_queue_capacity);
    const [mode, setMode] = useState<'manual' | 'recommended'>('manual');
    const approve = () =>
        router.patch(`/admin/appointments/${event.id}/status`, {
            status: 'accepted',
        });
    const assigned = (role: Role) =>
        event.onsite_staff.filter(
            (d: Deployment) => d.service_role === role && d.is_active,
        );
    const add = (staff: Staff) =>
        router.post(
            `/admin/onsite-events/${event.id}/staff`,
            {
                user_id: staff.id,
                service_role: staff.role,
                queue_capacity: capacity,
            },
            { preserveScroll: true },
        );
    const remove = (deployment: Deployment) => {
        if (
            confirm(
                `Remove ${deployment.user.first_name} ${deployment.user.last_name} from this event?`,
            )
        )
            router.delete(
                `/admin/onsite-events/${event.id}/staff/${deployment.id}`,
                { preserveScroll: true },
            );
    };
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Onsite Event Preparation" />
            <header>
                <Link
                    href="/admin/bulk-appointments"
                    className="mb-3 inline-flex items-center gap-1 text-sm text-moss-700"
                >
                    <ArrowLeft className="size-4" /> Bulk requests
                </Link>
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold tracking-widest text-moss-600 uppercase">
                            Admin event preparation
                        </p>
                        <h1 className="mt-1 text-3xl font-semibold">
                            {event.company?.company_name}
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            <Building2 className="mr-1 inline size-4" />
                            {new Date(
                                event.appointment_date,
                            ).toLocaleDateString()}{' '}
                            · {event.event_address ?? event.company?.address}
                        </p>
                    </div>
                    <span
                        className={`rounded-full px-3 py-1.5 text-sm font-medium ${staffing.ready ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}
                    >
                        {staffing.ready
                            ? 'Required team complete'
                            : `Missing: ${staffing.missing_roles.join(', ')}`}
                    </span>
                </div>
            </header>
            <section className="grid gap-3 sm:grid-cols-5">
                {[
                    ['Employees', 'total'],
                    ['Arrived', 'arrived'],
                    ['Not arrived', 'not_arrived'],
                    ['Absent', 'absent'],
                    ['Completed', 'completed'],
                    ['Onsite procedures finished', 'onsite_procedures_finished'],
                    ['Drug verification', 'verifying_drug_test'],
                    ['X-Ray verification', 'verifying_xray'],
                    ['Both verifying', 'verifying_both'],
                    ['Final evaluation', 'for_final_evaluation'],
                ].map(([title, key]) => (
                    <div key={key} className="rounded-xl border bg-white p-4">
                        <p className="text-xs text-slate-500 uppercase">
                            {title}
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                            {attendance[key] ?? 0}
                        </p>
                    </div>
                ))}
            </section>
            <section className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h2 className="font-semibold">
                            Employee masterlist review
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Expected: {event.expected_employee_count ?? '—'} ·
                            Uploaded: {attendance.total}
                        </p>
                        {event.expected_employee_count !== attendance.total && (
                            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                The uploaded masterlist differs from the
                                company&apos;s expected employee count.
                            </p>
                        )}
                    </div>
                    {event.status === 'pending' && (
                        <Button
                            onClick={approve}
                            disabled={attendance.total === 0}
                        >
                            <CheckCircle2 className="size-4" /> Approve bulk
                            request
                        </Button>
                    )}
                </div>
                <div className="mt-4 overflow-hidden rounded-lg border">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Employee number</th>
                                <th className="px-4 py-3">PE</th>
                                <th className="px-4 py-3">Lab</th>
                                <th className="px-4 py-3">Drug Test</th>
                                <th className="px-4 py-3">X-Ray</th>
                                <th className="px-4 py-3">Final</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {employees.data.map((employee) => (
                                <tr key={employee.id}>
                                    <td className="px-4 py-3 font-medium">
                                        {[
                                            employee.user.first_name,
                                            employee.user.middle_name,
                                            employee.user.last_name,
                                        ]
                                            .filter(Boolean)
                                            .join(' ')}
                                    </td>
                                    <td className="px-4 py-3">
                                        {employee.user.patient_profile
                                            ?.employee_number ?? '—'}
                                    </td>
                                    {([
                                        'physical_exam',
                                        'laboratory',
                                        'drug_test',
                                        'xray',
                                        'final_evaluation',
                                    ] as const).map((service) => {
                                        const status = employee.service_progress[service];
                                        return (
                                            <td key={service} className="px-4 py-3">
                                                <span className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-semibold ${progressClass(status)}`}>
                                                    {progressLabel(status)}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {employees.data.length === 0 && (
                        <p className="p-6 text-center text-sm text-red-600">
                            No employees are attached. This request cannot be
                            approved.
                        </p>
                    )}
                </div>
                <nav className="mt-4 flex flex-wrap gap-2">
                    {employees.links.map((link, index) => (
                        <Link
                            key={index}
                            href={link.url ?? '#'}
                            preserveState
                            className={`rounded border px-3 py-1.5 text-sm ${link.active ? 'bg-moss-600 text-white' : 'bg-white'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                        />
                    ))}
                </nav>
            </section>
            <section className="rounded-xl border bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="font-semibold">Staff assignment</h2>
                        <p className="text-sm text-slate-500">
                            Choose active staff for this event. Availability and
                            schedule conflicts are validated when assigned.
                        </p>
                    </div>
                    <div className="flex rounded-lg border p-1">
                        <button
                            onClick={() => setMode('manual')}
                            className={`rounded px-3 py-1.5 text-sm ${mode === 'manual' ? 'bg-moss-600 text-white' : ''}`}
                        >
                            Manual selection
                        </button>
                        <button
                            onClick={() => setMode('recommended')}
                            className={`rounded px-3 py-1.5 text-sm ${mode === 'recommended' ? 'bg-moss-600 text-white' : ''}`}
                        >
                            Recommended staffing
                        </button>
                    </div>
                </div>
                {mode === 'recommended' && (
                    <div className="mt-5 grid gap-3 sm:grid-cols-4">
                        {roles.map((role) => {
                            const r = staffing.recommendations[role];
                            return (
                                <div
                                    key={role}
                                    className="rounded-lg border bg-slate-50 p-4"
                                >
                                    <p className="text-xs font-medium text-slate-500 uppercase">
                                        {roleName(role)}
                                    </p>
                                    <p className="mt-1 text-2xl font-semibold">
                                        {r.recommended}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                        1 per {r.employees_per_staff} employees
                                        · {r.active_available} active
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}
                <label className="mt-5 block text-sm font-medium">
                    Queue capacity per staff{' '}
                    <input
                        type="number"
                        min="1"
                        max="100"
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="ml-2 w-20 rounded border px-2 py-1.5"
                    />
                </label>
                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                    {roles.map((role) => {
                        const deployments = assigned(role);
                        const recommendation = staffing.recommendations[role];
                        return (
                            <div key={role} className="rounded-xl border p-4">
                                <div className="flex justify-between">
                                    <h3 className="font-semibold">
                                        {roleName(role)}
                                    </h3>
                                    <span className="text-xs text-slate-500">
                                        {deployments.length} selected /{' '}
                                        {recommendation.recommended} recommended
                                    </span>
                                </div>
                                {deployments.length <
                                    recommendation.recommended && (
                                    <p className="mt-2 rounded bg-amber-50 p-2 text-xs text-amber-800">
                                        Below the recommendation; employees may
                                        experience longer queues.
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {deployments.map((d: Deployment) => (
                                        <span
                                            key={d.id}
                                            className="inline-flex items-center gap-2 rounded-full bg-moss-50 px-3 py-1.5 text-sm text-moss-800"
                                        >
                                            {d.user.first_name}{' '}
                                            {d.user.last_name}
                                            <button
                                                aria-label="Remove staff"
                                                onClick={() => remove(d)}
                                            >
                                                <X className="size-3.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {staffOptions
                                        .filter(
                                            (s) =>
                                                s.role === role &&
                                                !deployments.some(
                                                    (d: Deployment) =>
                                                        d.user.id === s.id,
                                                ),
                                        )
                                        .map((staff) => (
                                            <Button
                                                key={staff.id}
                                                size="sm"
                                                variant="outline"
                                                disabled={
                                                    event.status === 'pending'
                                                }
                                                onClick={() => add(staff)}
                                            >
                                                <UserPlus className="size-4" />
                                                {staff.first_name}{' '}
                                                {staff.last_name}
                                            </Button>
                                        ))}
                                </div>
                                {staffOptions.filter((s) => s.role === role)
                                    .length === 0 && (
                                    <p className="mt-3 text-sm text-red-600">
                                        No active staff accounts are available
                                        for this role.
                                    </p>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
            <section className="rounded-xl border bg-white p-5">
                <h2 className="flex items-center gap-2 font-semibold">
                    <UsersRound className="size-4" /> Responsibility boundary
                </h2>
                <p className="mt-2 text-sm text-slate-600">
                    Attendance is view-only here. The assigned receptionist
                    verifies employees and records Arrived or Absent from the
                    dedicated Bulk Attendance workspace.
                </p>
                <div className="mt-4">
                    <Link
                        href={`/admin/onsite-events/${event.id}/medical-results`}
                        className="mb-3 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        <FileSpreadsheet className="size-4" /> Review company medical results
                    </Link>
                    <div>
                    {['activities_completed', 'results_completed', 'closed'].includes(event.onsite_event_status) ? (
                        <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-700">
                            {event.onsite_event_status === 'closed'
                                ? 'Event closed — final report released'
                                : event.onsite_event_status === 'results_completed'
                                  ? 'Results processing completed'
                                  : 'Onsite completed — results processing'}
                        </span>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() =>
                                router.patch(
                                    `/admin/onsite-events/${event.id}/complete-activities`,
                                )
                            }
                        >
                            <CheckCircle2 className="size-4" /> Mark onsite activities completed
                        </Button>
                    )}
                    </div>
                </div>
            </section>
        </div>
    );
}
AdminOnsiteEvent.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
