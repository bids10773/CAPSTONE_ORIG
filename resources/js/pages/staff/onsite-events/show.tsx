import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Play, Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

type Role = 'doctor' | 'medtech' | 'radtech';
type Queue = {
    id: number;
    service_role: string;
    status: string;
    appointment: {
        id: number;
        attendance_status: string;
        status: string;
        user: { first_name: string; middle_name?: string; last_name: string };
        patient_profile?: { employee_number?: string | null };
    };
};
type Page<T> = {
    data: T[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
};

const action = (role: Role, queue: Queue) => {
    if (role === 'medtech') return `/medtech/lab-results/${queue.appointment.id}`;
    if (role === 'radtech') return `/radtech/xrays/${queue.appointment.id}`;
    if (queue.service_role === 'doctor')
        return `/doctor/physical-exam-form/${queue.appointment.id}`;
    return `/doctor/final-evaluation/${queue.appointment.id}`;
};
const taskLabel = (task: string) =>
    ({
        doctor: 'Physical examination',
        medtech: 'Laboratory examination',
        radtech: 'X-ray examination',
        drug_verification: 'Official drug-test verification',
        xray_verification: 'Official X-ray verification',
        final_evaluation: 'Final medical evaluation',
    })[task] ?? task.replaceAll('_', ' ');

export default function StaffOnsiteEvent({
    event,
    queues,
    attendance,
    role,
    filters,
}: {
    event: any;
    queues: Page<Queue>;
    attendance: Record<string, number>;
    role: Role;
    filters: { search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const submit = (e: FormEvent) => {
        e.preventDefault();
        router.get(`/${role}/onsite-events/${event.id}`, { search }, { preserveState: true });
    };
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Onsite Event Queue" />
            <header>
                <Link href={`/${role}/onsite-events`} className="mb-3 inline-flex items-center gap-1 text-sm text-moss-700">
                    <ArrowLeft className="size-4" /> Onsite events
                </Link>
                <h1 className="text-3xl font-semibold text-slate-950">
                    {event.company?.company_name ?? 'Company event'}
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                    <Building2 className="mr-1 inline size-4" />
                    {new Date(event.appointment_date).toLocaleDateString()} ·{' '}
                    {event.event_address ?? event.company?.address ?? 'Onsite'}
                </p>
            </header>
            <section className="grid gap-3 sm:grid-cols-4">
                {[
                    ['Employees', 'total'],
                    ['Arrived', 'arrived'],
                    ['Completed', 'completed'],
                    ['My queue', 'mine'],
                ].map(([title, key]) => (
                    <div key={key} className="rounded-xl border bg-white p-4">
                        <p className="text-xs text-slate-500 uppercase">{title}</p>
                        <p className="mt-1 text-2xl font-semibold">
                            {key === 'mine' ? queues.data.length : attendance[key] ?? 0}
                        </p>
                    </div>
                ))}
            </section>
            <form onSubmit={submit} className="flex max-w-lg gap-2">
                <div className="relative flex-1">
                    <Search className="absolute top-2.5 left-3 size-4 text-slate-400" />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee or employee number" className="w-full rounded-lg border py-2 pr-3 pl-9 text-sm" />
                </div>
                <Button type="submit" variant="outline">Search</Button>
            </form>
            <div className="overflow-x-auto rounded-xl border bg-white shadow-sm">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                        <tr><th className="px-5 py-3">Employee</th><th className="px-5 py-3">Employee no.</th><th className="px-5 py-3">Task</th><th className="px-5 py-3">Queue status</th><th /></tr>
                    </thead>
                    <tbody className="divide-y">
                        {queues.data.map((queue) => (
                            <tr key={queue.id} className="hover:bg-slate-50">
                                <td className="px-5 py-4 font-medium">{[queue.appointment.user.first_name, queue.appointment.user.middle_name, queue.appointment.user.last_name].filter(Boolean).join(' ')}</td>
                                <td className="px-5 py-4">{queue.appointment.patient_profile?.employee_number ?? '—'}</td>
                                <td className="px-5 py-4">{taskLabel(queue.service_role)}</td>
                                <td className="px-5 py-4 capitalize">{queue.status.replaceAll('_', ' ')}</td>
                                <td className="px-5 py-4 text-right">
                                    {['assigned', 'in_progress'].includes(queue.status) && (
                                        <Button size="sm" onClick={() => router.visit(action(role, queue))}>
                                            <Play className="size-4" /> {queue.status === 'in_progress' ? 'Continue' : 'Start'}
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {queues.data.length === 0 && <p className="p-10 text-center text-sm text-slate-500">No employees are assigned to your queue for this event.</p>}
            </div>
            <nav className="flex flex-wrap gap-2">
                {queues.links.map((link, index) => (
                    <Link key={index} href={link.url ?? '#'} preserveState className={`rounded border px-3 py-1.5 text-sm ${link.active ? 'bg-moss-600 text-white' : 'bg-white'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                ))}
            </nav>
        </div>
    );
}

StaffOnsiteEvent.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
