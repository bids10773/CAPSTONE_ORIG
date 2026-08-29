import { Head, Link } from '@inertiajs/react';
import { Building2, CalendarDays, UsersRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type Event = {
    id: number;
    appointment_date: string;
    status: string;
    bulk_employees_count: number;
    arrived_count: number;
    absent_count: number;
    company?: { company_name: string };
};
type Page<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

export default function OnsiteEventsIndex({ events }: { events: Page<Event> }) {
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Bulk Attendance" />
            <header>
                <p className="text-xs font-semibold tracking-widest text-moss-600 uppercase">
                    Receptionist workspace
                </p>
                <h1 className="mt-1 text-3xl font-semibold text-slate-950">
                    Onsite Bulk Appointments
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    Open an assigned company event to verify employees and
                    manage attendance.
                </p>
            </header>
            <div className="overflow-hidden rounded-xl border bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[820px] text-left text-sm">
                        <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                            <tr>
                                <th className="px-5 py-3">Company</th>
                                <th className="px-5 py-3">Date</th>
                                <th className="px-5 py-3">Employees</th>
                                <th className="px-5 py-3">Progress</th>
                                <th className="px-5 py-3">Status</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {events.data.map((event) => (
                                <tr
                                    key={event.id}
                                    className="hover:bg-slate-50"
                                >
                                    <td className="px-5 py-4 font-medium">
                                        <span className="flex items-center gap-2">
                                            <Building2 className="size-4 text-moss-600" />
                                            {event.company?.company_name ??
                                                'Company'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="flex items-center gap-2">
                                            <CalendarDays className="size-4" />
                                            {new Date(
                                                event.appointment_date,
                                            ).toLocaleDateString()}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        {event.bulk_employees_count}
                                    </td>
                                    <td className="px-5 py-4">
                                        {event.arrived_count} arrived ·{' '}
                                        {event.absent_count} absent
                                    </td>
                                    <td className="px-5 py-4 capitalize">
                                        {event.status.replaceAll('_', ' ')}
                                    </td>
                                    <td className="px-5 py-4 text-right">
                                        <Button asChild size="sm">
                                            <Link
                                                href={`/receptionist/onsite-events/${event.id}`}
                                            >
                                                <UsersRound className="size-4" />{' '}
                                                Manage attendance
                                            </Link>
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {events.data.length === 0 && (
                    <div className="p-10 text-center text-sm text-slate-500">
                        No scheduled onsite events are assigned to you.
                    </div>
                )}
            </div>
            <nav className="flex flex-wrap gap-2">
                {events.links.map((link, i) => (
                    <Link
                        key={i}
                        href={link.url ?? '#'}
                        className={`rounded border px-3 py-1.5 text-sm ${link.active ? 'bg-moss-600 text-white' : 'bg-white'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`}
                        dangerouslySetInnerHTML={{ __html: link.label }}
                    />
                ))}
            </nav>
        </div>
    );
}
OnsiteEventsIndex.layout = (page: React.ReactNode) => (
    <AppLayout>{page}</AppLayout>
);
