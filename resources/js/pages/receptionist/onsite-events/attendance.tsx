import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Search, UserCheck, UserX } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { StatusBadge } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type Employee = {
    id: number;
    status: string;
    attendance_status: string | null;
    user: {
        first_name: string;
        middle_name?: string;
        last_name: string;
        patient_profile?: { employee_number?: string };
    };
    service_queues: Array<{
        service_role: string;
        status: string;
        assigned_staff?: { first_name: string; last_name: string };
    }>;
};
type Page<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};
const name = (e: Employee) =>
    [e.user.first_name, e.user.middle_name, e.user.last_name]
        .filter(Boolean)
        .join(' ');
export default function Attendance({
    event,
    employees,
    attendance,
    filters,
}: {
    event: any;
    employees: Page<Employee>;
    attendance: Record<string, number>;
    filters: { search: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(
            `/receptionist/onsite-events/${event.id}`,
            search ? { search } : {},
            { preserveState: true, replace: true },
        );
    };
    const mark = (employee: Employee, status: 'arrived' | 'absent') => {
        if (
            !confirm(
                `Verify employee: ${name(employee)}\nEmployee No.: ${employee.user.patient_profile?.employee_number ?? 'Not provided'}\n\nMark this employee ${status.toUpperCase()}?`,
            )
        )
            return;
        router.patch(
            `/receptionist/onsite-employees/${employee.id}/attendance`,
            {
                attendance_status: status,
                ...(status === 'absent' ? { absence_reason: 'no_show' } : {}),
            },
            { preserveScroll: true },
        );
    };
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Onsite Attendance" />
            <header>
                <Link
                    href="/receptionist/onsite-events"
                    className="mb-3 inline-flex items-center gap-1 text-sm text-moss-700"
                >
                    <ArrowLeft className="size-4" /> All onsite events
                </Link>
                <h1 className="text-3xl font-semibold">
                    {event.company?.company_name}
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    Onsite medical examination ·{' '}
                    {new Date(event.appointment_date).toLocaleDateString()} ·{' '}
                    {event.event_address ?? event.company?.address}
                </p>
            </header>
            <section className="grid gap-3 sm:grid-cols-4">
                {[
                    ['Total scheduled', 'total'],
                    ['Arrived', 'arrived'],
                    ['Not yet arrived', 'not_arrived'],
                    ['Absent', 'absent'],
                ].map(([title, key]) => (
                    <div
                        key={key}
                        className="rounded-xl border bg-white p-4 shadow-sm"
                    >
                        <p className="text-xs text-slate-500 uppercase">
                            {title}
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                            {attendance[key] ?? 0}
                        </p>
                    </div>
                ))}
            </section>
            <section className="rounded-xl border bg-white p-4 shadow-sm">
                <form
                    onSubmit={submit}
                    className="flex flex-col gap-2 sm:flex-row"
                >
                    <div className="relative flex-1">
                        <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full rounded-lg border py-2 pr-3 pl-9"
                            placeholder="Search name or employee number"
                        />
                    </div>
                    <Button type="submit" className="sm:shrink-0">
                        Search employee
                    </Button>
                </form>
                <p className="mt-2 text-xs text-slate-500">
                    Results are limited to this company bulk appointment.
                </p>
            </section>
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="px-4 py-3">Employee</th>
                                <th className="px-4 py-3">Employee no.</th>
                                <th className="px-4 py-3">Attendance</th>
                                <th className="px-4 py-3">Current process</th>
                                <th className="px-4 py-3 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {employees.data.map((employee) => (
                                <tr key={employee.id}>
                                    <td className="px-4 py-4 font-medium">
                                        {name(employee)}
                                    </td>
                                    <td className="px-4 py-4">
                                        {employee.user.patient_profile
                                            ?.employee_number ?? '—'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <StatusBadge
                                            status={
                                                employee.attendance_status ??
                                                'not_arrived'
                                            }
                                        />
                                    </td>
                                    <td className="px-4 py-4 capitalize">
                                        {employee.attendance_status ===
                                        'arrived'
                                            ? employee.status.replaceAll(
                                                  '_',
                                                  ' ',
                                              )
                                            : '—'}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex justify-end gap-2 whitespace-nowrap">
                                            <Button
                                                size="sm"
                                                disabled={
                                                    employee.attendance_status ===
                                                    'arrived'
                                                }
                                                onClick={() =>
                                                    mark(employee, 'arrived')
                                                }
                                            >
                                                <UserCheck className="size-4" />{' '}
                                                Arrived
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="destructive"
                                                disabled={
                                                    employee.attendance_status ===
                                                    'absent'
                                                }
                                                onClick={() =>
                                                    mark(employee, 'absent')
                                                }
                                            >
                                                <UserX className="size-4" />{' '}
                                                Absent
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {employees.data.length === 0 && (
                    <div className="p-10 text-center text-sm text-slate-500">
                        No employees match this event search.
                    </div>
                )}
            </div>
            <nav className="flex flex-wrap gap-2">
                {employees.links.map((link, i) => (
                    <Link
                        key={i}
                        href={link.url ?? '#'}
                        preserveState
                        className={`rounded border px-3 py-1.5 text-sm ${link.active ? 'bg-moss-600 text-white' : 'bg-white'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </nav>
        </div>
    );
}
Attendance.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
