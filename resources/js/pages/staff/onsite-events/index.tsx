import { Head, Link } from '@inertiajs/react';
import { Building2, CalendarDays, ClipboardList } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

type Role = 'doctor' | 'medtech' | 'radtech';
type Event = {
    id: number;
    appointment_date: string;
    status: string;
    event_address?: string | null;
    bulk_employees_count: number;
    arrived_count: number;
    completed_count: number;
    my_active_queue_count: number;
    company?: { company_name: string };
};
type Page<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const label = (role: Role) =>
    ({ doctor: 'Doctor', medtech: 'Medical Technology', radtech: 'Radiology' })[
        role
    ];

export default function StaffOnsiteEvents({
    events,
    role,
}: {
    events: Page<Event>;
    role: Role;
}) {
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Onsite Events" />
            <header>
                <p className="text-xs font-semibold tracking-widest text-moss-600 uppercase">
                    {label(role)} workspace
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-slate-950">
                    Onsite Bulk Appointments
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Company events assigned to you. Open an event to process
                    your personal employee queue.
                </p>
            </header>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
                <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr>
                            <th className="px-5 py-3">Company</th>
                            <th className="px-5 py-3">Schedule</th>
                            <th className="px-5 py-3">Event progress</th>
                            <th className="px-5 py-3">My active queue</th>
                            <th className="px-5 py-3">Status</th>
                            <th />
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {events.data.map((event) => (
                            <tr key={event.id} className="hover:bg-slate-50">
                                <td className="px-5 py-4 font-medium">
                                    <span className="flex items-center gap-2">
                                        <Building2 className="size-4 text-moss-600" />
                                        {event.company?.company_name ?? 'Company'}
                                    </span>
                                </td>
                                <td className="px-5 py-4">
                                    <span className="flex items-center gap-2">
                                        <CalendarDays className="size-4" />
                                        {new Date(event.appointment_date).toLocaleDateString()}
                                    </span>
                                    {event.event_address && (
                                        <p className="mt-1 text-xs text-slate-500">
                                            {event.event_address}
                                        </p>
                                    )}
                                </td>
                                <td className="px-5 py-4">
                                    {event.arrived_count} arrived ·{' '}
                                    {event.completed_count} completed /{' '}
                                    {event.bulk_employees_count}
                                </td>
                                <td className="px-5 py-4 font-semibold text-moss-700">
                                    {event.my_active_queue_count}
                                </td>
                                <td className="px-5 py-4 capitalize">
                                    {event.status.replaceAll('_', ' ')}
                                </td>
                                <td className="px-5 py-4 text-right">
                                    <Button asChild size="sm">
                                        <Link href={`/${role}/onsite-events/${event.id}`}>
                                            <ClipboardList className="size-4" /> Open queue
                                        </Link>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {events.data.length === 0 && (
                    <p className="p-10 text-center text-sm text-slate-500">
                        No onsite events are assigned to you.
                    </p>
                )}
            </div>
            <nav className="flex flex-wrap gap-2">
                {events.links.map((link, index) => (
                    <Link
                        key={index}
                        href={link.url ?? '#'}
                        className={`rounded border px-3 py-1.5 text-sm ${link.active ? 'bg-moss-600 text-white' : 'bg-white'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </nav>
        </div>
    );
}

StaffOnsiteEvents.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
