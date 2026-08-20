import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Download, FileCheck2, FileSpreadsheet, LockKeyhole } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';

type Column = { key: string; label: string };
type Props = {
    event: { id: number; appointment_date: string; service_types: string[]; company: { company_name: string } };
    summary: { total: number; completed: number; absent: number; pending: number; ready: boolean; blockers: Array<{ id: number; name: string; status: string }> };
    preview: { columns: Column[]; rows: Array<Record<string, string | number>> };
    report?: { status: string; generated_at: string; released_at?: string | null; generated_by?: { name: string }; released_by?: { name: string } } | null;
};

export default function BulkMedicalResults({ event, summary, preview, report }: Props) {
    const released = Boolean(report?.released_at);
    return (
        <div className="space-y-6 p-4 sm:p-6 lg:p-8">
            <Head title="Company Medical Results" />
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <Link href={`/admin/onsite-events/${event.id}`} className="mb-3 inline-flex items-center gap-1 text-sm text-moss-700"><ArrowLeft className="size-4" /> Event preparation</Link>
                    <h1 className="text-3xl font-semibold">Company Medical Results</h1>
                    <p className="mt-2 text-sm text-slate-500">{event.company.company_name} · {new Date(event.appointment_date).toLocaleDateString()}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {report && <a href={`/admin/onsite-events/${event.id}/medical-results/download`}><Button variant="outline"><Download className="size-4" /> Download review copy</Button></a>}
                    {!released && <Button disabled={!summary.ready} onClick={() => router.post(`/admin/onsite-events/${event.id}/medical-results/generate`)}><FileSpreadsheet className="size-4" /> {report ? 'Regenerate final Excel' : 'Generate final Excel'}</Button>}
                    {report && !released && <Button className="bg-emerald-700 hover:bg-emerald-800" onClick={() => confirm('Release this reviewed report to the company? It will be locked.') && router.post(`/admin/onsite-events/${event.id}/medical-results/release`)}><FileCheck2 className="size-4" /> Release to company</Button>}
                </div>
            </header>

            <section className={`rounded-xl border p-5 ${summary.ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <div className="grid gap-4 sm:grid-cols-4">
                    {[['Employees', summary.total], ['Completed', summary.completed], ['Absent', summary.absent], ['Unresolved', summary.pending]].map(([label, value]) => <div key={label}><p className="text-xs font-semibold uppercase text-slate-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}
                </div>
                <p className="mt-4 text-sm font-medium">{released ? <><LockKeyhole className="mr-1 inline size-4" /> Released and locked for company download.</> : summary.ready ? 'All employees are completed or absent. The final report can be generated.' : 'Generation is blocked while employee results, verification, or final evaluation remain unresolved.'}</p>
                {!summary.ready && summary.blockers.length > 0 && <p className="mt-2 text-xs text-slate-600">Examples: {summary.blockers.map((item) => `${item.name} (${item.status.replaceAll('_', ' ')})`).join(', ')}</p>}
            </section>

            <section className="overflow-hidden rounded-xl border bg-white">
                <div className="border-b p-5"><h2 className="font-semibold">Live admin preview</h2><p className="mt-1 text-xs text-slate-500">Columns follow this appointment's selected services. This preview is never exposed to the company.</p></div>
                <div className="overflow-x-auto"><table className="min-w-full text-left text-xs"><thead className="bg-slate-800 text-white"><tr>{preview.columns.map((column) => <th key={column.key} className="whitespace-nowrap px-3 py-3 font-semibold">{column.label}</th>)}</tr></thead><tbody className="divide-y">{preview.rows.map((row, index) => <tr key={index}>{preview.columns.map((column) => <td key={column.key} className="max-w-64 px-3 py-3 align-top text-slate-700">{row[column.key] ?? '-'}</td>)}</tr>)}</tbody></table></div>
            </section>
        </div>
    );
}

BulkMedicalResults.layout = (page: React.ReactNode) => <AppLayout>{page}</AppLayout>;
