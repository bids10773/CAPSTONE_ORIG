import { Head, Link, useForm } from '@inertiajs/react';
import {
    Download,
    LoaderCircle,
    LockKeyhole,
    Save,
    ScanLine,
    ShieldCheck,
} from 'lucide-react';
import type React from 'react';

import InputError from '@/components/input-error';
import { useSessionDraft } from '@/hooks/use-session-draft';
import AppLayout from '@/layouts/app-layout';
import { formatAppointmentDate } from '@/lib/appointment-date-time';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'RadTech Queue', href: '/radtech/appointments' },
    { title: 'X-Ray Examination', href: '' },
];
const normalFindings =
    'BOTH LUNGS ARE CLEAR\nHEART SIZE IS NOT ENLARGED\nTHE REST OF THE CHEST FINDINGS ARE UNREMARKABLE';
const normalImpression = 'ESSENTIALLY NORMAL CHEST X-RAY.';
const inputClass =
    'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15 disabled:bg-slate-100';

interface Props {
    appointment: {
        id: number;
        appointment_date?: string;
        user: { first_name: string; last_name: string };
        patient_profile?: { sex?: string; birthdate?: string };
        service_types: string;
    };
    xrayReport?: {
        findings?: string | null;
        impression?: string | null;
        recommendation?: string | null;
        remarks?: string | null;
    } | null;
    locked: boolean;
    submitUrl: string;
}

function getAge(birthdate?: string) {
    if (!birthdate) return '—';
    const birth = new Date(`${birthdate.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(birth.getTime())) return '—';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() &&
            today.getDate() < birth.getDate())
    )
        age -= 1;
    return age >= 0 ? String(age) : '—';
}

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-semibold text-moss-100 uppercase">
                {label}
            </p>
            <p className="mt-1 font-semibold text-white">{value}</p>
        </div>
    );
}

export default function XrayReportForm({
    appointment,
    xrayReport,
    locked,
    submitUrl,
}: Props) {
    const isNormal =
        !xrayReport?.findings || xrayReport.findings === normalFindings;
    const form = useForm({
        workflow_action: 'complete',
        chest_status: isNormal ? 'normal' : 'findings',
        chest_findings: isNormal
            ? normalFindings
            : (xrayReport?.findings ?? ''),
        impression: isNormal
            ? xrayReport?.impression || normalImpression
            : (xrayReport?.impression ?? ''),
        recommendation: xrayReport?.recommendation ?? '',
        remarks: xrayReport?.remarks ?? '',
    });
    const { clearDraft } = useSessionDraft(
        `xray-${appointment.id}`,
        form.data,
        form.isDirty,
        (draft) =>
            form.setData({
                ...form.data,
                ...draft,
                workflow_action: 'complete',
            }),
        !locked,
    );

    const submit = (action: 'performed' | 'complete') => {
        form.transform((values) => ({ ...values, workflow_action: action }));
        form.post(submitUrl, { preserveScroll: true, onSuccess: clearDraft });
    };
    const confirmFinalize = () => {
        if (
            window.confirm(
                'Finalize X-Ray Result?\n\nPlease confirm that the findings and impression have been reviewed and verified. Once finalized, this service will be marked as completed and become read-only.',
            )
        ) {
            submit('complete');
        }
    };
    const patientName = `${appointment.user.first_name} ${appointment.user.last_name}`;

    return (
        <>
            <Head title="X-Ray Report" />
            <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                <header className="overflow-hidden rounded-2xl bg-moss-700 text-white shadow-sm">
                    <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto]">
                        <div>
                            <p className="text-xs font-bold tracking-[.16em] text-moss-100 uppercase">
                                Living Myth Industrial Clinic
                            </p>
                            <h1 className="mt-1 text-2xl font-bold">
                                X-Ray result entry
                            </h1>
                            <p className="mt-2 text-sm text-moss-100">
                                Appointment #{appointment.id} ·{' '}
                                {appointment.appointment_date
                                    ? formatAppointmentDate(
                                          appointment.appointment_date,
                                      )
                                    : 'Date unavailable'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                            <Summary label="Patient" value={patientName} />
                            <Summary
                                label="Age / Sex"
                                value={`${getAge(appointment.patient_profile?.birthdate)} / ${appointment.patient_profile?.sex ?? '—'}`}
                            />
                            <Summary
                                label="Birthdate"
                                value={
                                    appointment.patient_profile?.birthdate
                                        ? formatAppointmentDate(
                                              appointment.patient_profile
                                                  .birthdate,
                                          )
                                        : '—'
                                }
                            />
                            <Summary
                                label="Examination"
                                value={
                                    appointment.service_types || 'Chest X-ray'
                                }
                            />
                        </div>
                    </div>
                </header>
                {locked && (
                    <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                        <LockKeyhole className="h-5 w-5 shrink-0" />
                        <p>
                            This report has been finalized and is read-only.
                            Contact an administrator if a correction is
                            required.
                        </p>
                    </div>
                )}
                <form
                    className="space-y-6"
                    onSubmit={(event) => event.preventDefault()}
                >
                    <section className="overflow-hidden rounded-2xl border border-moss-100 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-moss-100 bg-moss-50 px-5 py-4">
                            <ScanLine className="h-5 w-5 text-moss-700" />
                            <h2 className="font-bold text-slate-900">
                                X-Ray findings
                            </h2>
                        </div>
                        <div className="grid gap-5 p-5 lg:grid-cols-2">
                            <div className="lg:col-span-2">
                                <label
                                    htmlFor="chest-status"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Result classification
                                </label>
                                <select
                                    id="chest-status"
                                    className={inputClass}
                                    value={form.data.chest_status}
                                    disabled={locked}
                                    onChange={(event) => {
                                        const status = event.target.value;
                                        form.setData({
                                            ...form.data,
                                            chest_status: status,
                                            chest_findings:
                                                status === 'normal'
                                                    ? normalFindings
                                                    : '',
                                            impression:
                                                status === 'normal'
                                                    ? normalImpression
                                                    : '',
                                        });
                                    }}
                                >
                                    <option value="normal">Normal study</option>
                                    <option value="findings">
                                        With findings
                                    </option>
                                </select>
                                <InputError
                                    message={form.errors.chest_status}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="chest-findings"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Radiographic findings
                                </label>
                                <textarea
                                    id="chest-findings"
                                    className={`${inputClass} min-h-40`}
                                    value={form.data.chest_findings}
                                    disabled={
                                        locked ||
                                        form.data.chest_status === 'normal'
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            'chest_findings',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Describe the radiographic findings"
                                />
                                <InputError
                                    message={form.errors.chest_findings}
                                />
                            </div>
                            <div>
                                <label
                                    htmlFor="impression"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Impression
                                </label>
                                <textarea
                                    id="impression"
                                    className={`${inputClass} min-h-40`}
                                    value={form.data.impression}
                                    disabled={
                                        locked ||
                                        form.data.chest_status === 'normal'
                                    }
                                    onChange={(event) =>
                                        form.setData(
                                            'impression',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Enter the radiologic impression"
                                />
                                <InputError message={form.errors.impression} />
                            </div>
                        </div>
                    </section>
                    <section className="overflow-hidden rounded-2xl border border-moss-100 bg-white shadow-sm">
                        <div className="flex items-center gap-3 border-b border-moss-100 bg-moss-50 px-5 py-4">
                            <ScanLine className="h-5 w-5 text-moss-700" />
                            <h2 className="font-bold text-slate-900">
                                Additional notes
                            </h2>
                        </div>
                        <div className="grid gap-5 p-5 lg:grid-cols-2">
                            <div>
                                <label
                                    htmlFor="remarks"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Technologist notes
                                </label>
                                <textarea
                                    id="remarks"
                                    className={`${inputClass} min-h-28`}
                                    value={form.data.remarks}
                                    disabled={locked}
                                    onChange={(event) =>
                                        form.setData(
                                            'remarks',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Positioning, image quality, or relevant notes"
                                />
                                <InputError message={form.errors.remarks} />
                            </div>
                            <div>
                                <label
                                    htmlFor="recommendation"
                                    className="text-sm font-semibold text-slate-700"
                                >
                                    Recommendation
                                </label>
                                <textarea
                                    id="recommendation"
                                    className={`${inputClass} min-h-28`}
                                    value={form.data.recommendation}
                                    disabled={locked}
                                    onChange={(event) =>
                                        form.setData(
                                            'recommendation',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Optional follow-up recommendation"
                                />
                                <InputError
                                    message={form.errors.recommendation}
                                />
                            </div>
                            <InputError
                                message={
                                    (form.errors as Record<string, string>).form
                                }
                            />
                        </div>
                    </section>
                    <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <ShieldCheck className="h-5 w-5 text-moss-700" />
                            Finalizing locks this report and advances the
                            patient workflow.
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {xrayReport && (
                                <Link
                                    href={`/clinical-forms/${appointment.id}/xray.pdf?preview=1`}
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700"
                                >
                                    <Download className="h-4 w-4" />
                                    Preview PDF
                                </Link>
                            )}
                            {!locked && (
                                <>
                                    <button
                                        type="button"
                                        disabled={form.processing}
                                        onClick={() => submit('performed')}
                                        className="inline-flex items-center gap-2 rounded-xl border border-moss-300 px-4 py-2.5 font-semibold text-moss-800 disabled:opacity-50"
                                    >
                                        <Save className="h-4 w-4" />
                                        Save draft
                                    </button>
                                    <button
                                        type="button"
                                        disabled={form.processing}
                                        onClick={confirmFinalize}
                                        className="inline-flex items-center gap-2 rounded-xl bg-moss-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                                    >
                                        {form.processing ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4" />
                                        )}
                                        Finalize X-Ray
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </main>
        </>
    );
}

XrayReportForm.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
