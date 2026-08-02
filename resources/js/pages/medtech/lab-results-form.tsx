import { Head, Link, useForm } from '@inertiajs/react';
import {
    Download,
    FlaskConical,
    LoaderCircle,
    LockKeyhole,
    Save,
    ShieldCheck,
} from 'lucide-react';

import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'MedTech Queue', href: '/medtech/appointments' },
    { title: 'Laboratory Examination', href: '' },
];

type Field = {
    key: string;
    label: string;
    type: 'text' | 'number' | 'select';
    unit?: string | null;
    normal?: string | null;
    options: string[];
};
type Section = { label: string; column: string; fields: Field[] };
type Props = {
    appointment: { id: number };
    patientSummary: {
        name: string;
        age?: number;
        sex?: string;
        birthdate?: string;
        company?: string;
        employee_number?: string;
        date?: string;
        doctor?: string;
    };
    sections: Record<string, Section>;
    labResult?: Record<string, any> | null;
    locked: boolean;
    submitUrl: string;
};

function initialResults(
    sections: Record<string, Section>,
    result?: Record<string, any> | null,
) {
    return Object.fromEntries(
        Object.entries(sections).map(([key, section]) => {
            const stored = result?.[section.column];
            if (key === 'pregnancy')
                return [key, { pregnancy_test: stored ?? '' }];
            if (key === 'blood_type')
                return [key, { blood_type: stored ?? '' }];
            return [
                key,
                Object.fromEntries(
                    section.fields.map((field) => [
                        field.key,
                        stored?.[field.key] ?? '',
                    ]),
                ),
            ];
        }),
    );
}

export default function LaboratoryResultsForm({
    appointment,
    patientSummary,
    sections,
    labResult,
    locked,
    submitUrl,
}: Props) {
    const form = useForm({
        results: initialResults(sections, labResult),
        remarks: labResult?.remarks ?? '',
        finalize: false,
    });
    const inputClass =
        'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15 disabled:bg-slate-100';
    const update = (section: string, field: string, value: string) =>
        form.setData('results', {
            ...form.data.results,
            [section]: { ...form.data.results[section], [field]: value },
        });
    const submit = (finalize: boolean) => {
        form.transform((data) => ({ ...data, finalize }));
        form.post(submitUrl);
    };

    return (
        <>
            <Head title="Laboratory Results" />
            <main className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6">
                <header className="overflow-hidden rounded-2xl bg-moss-700 text-white shadow-sm">
                    <div className="grid gap-5 p-6 lg:grid-cols-[1fr_auto]">
                        <div>
                            <p className="text-xs font-bold tracking-[.16em] text-moss-100 uppercase">
                                Living Myth Industrial Clinic
                            </p>
                            <h1 className="mt-1 text-2xl font-bold">
                                Laboratory result entry
                            </h1>
                            <p className="mt-2 text-sm text-moss-100">
                                Appointment #{appointment.id} ·{' '}
                                {patientSummary.date ?? 'Date unavailable'}
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-3">
                            <Summary
                                label="Patient"
                                value={patientSummary.name}
                            />
                            <Summary
                                label="Age / Sex"
                                value={`${patientSummary.age ?? '—'} / ${patientSummary.sex ?? '—'}`}
                            />
                            <Summary
                                label="Company"
                                value={patientSummary.company ?? 'OPD'}
                            />
                            <Summary
                                label="Birthdate"
                                value={patientSummary.birthdate ?? '—'}
                            />
                            <Summary
                                label="Employee No."
                                value={patientSummary.employee_number ?? '—'}
                            />
                            <Summary
                                label="Doctor"
                                value={patientSummary.doctor ?? 'Unassigned'}
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
                {Object.keys(sections).length === 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-800">
                        This appointment has no supported laboratory services.
                        Review its requested service types before entering
                        results.
                    </div>
                )}
                <form
                    className="space-y-6"
                    onSubmit={(event) => event.preventDefault()}
                >
                    {Object.entries(sections).map(([sectionKey, section]) => (
                        <section
                            key={sectionKey}
                            className="overflow-hidden rounded-2xl border border-moss-100 bg-white shadow-sm"
                        >
                            <div className="flex items-center gap-3 border-b border-moss-100 bg-moss-50 px-5 py-4">
                                <FlaskConical className="h-5 w-5 text-moss-700" />
                                <h2 className="font-bold text-slate-900">
                                    {section.label}
                                </h2>
                            </div>
                            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                                {section.fields.map((field) => {
                                    const value =
                                        form.data.results[sectionKey]?.[
                                            field.key
                                        ] ?? '';
                                    const error = (
                                        form.errors as Record<string, string>
                                    )[`results.${sectionKey}.${field.key}`];
                                    return (
                                        <div key={field.key}>
                                            <label
                                                htmlFor={`${sectionKey}-${field.key}`}
                                                className="text-sm font-semibold text-slate-700"
                                            >
                                                {field.label}
                                                <span className="ml-1 text-red-600">
                                                    *
                                                </span>
                                            </label>
                                            {field.normal && (
                                                <p className="text-xs text-slate-500">
                                                    Reference: {field.normal}
                                                    {field.unit
                                                        ? ` ${field.unit}`
                                                        : ''}
                                                </p>
                                            )}
                                            {field.type === 'select' ? (
                                                <select
                                                    id={`${sectionKey}-${field.key}`}
                                                    disabled={locked}
                                                    className={inputClass}
                                                    value={value}
                                                    onChange={(e) =>
                                                        update(
                                                            sectionKey,
                                                            field.key,
                                                            e.target.value,
                                                        )
                                                    }
                                                >
                                                    <option value="">
                                                        Select result
                                                    </option>
                                                    {field.options.map(
                                                        (option) => (
                                                            <option
                                                                key={option}
                                                                value={option}
                                                            >
                                                                {option}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            ) : (
                                                <div className="relative">
                                                    <input
                                                        id={`${sectionKey}-${field.key}`}
                                                        disabled={locked}
                                                        type={field.type}
                                                        step="any"
                                                        className={`${inputClass} ${field.unit ? 'pr-20' : ''}`}
                                                        value={value}
                                                        onChange={(e) =>
                                                            update(
                                                                sectionKey,
                                                                field.key,
                                                                e.target.value,
                                                            )
                                                        }
                                                    />
                                                    {field.unit && (
                                                        <span className="absolute top-1/2 right-3 mt-0.5 -translate-y-1/2 text-xs text-slate-400">
                                                            {field.unit}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                            <InputError message={error} />
                                        </div>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <label
                            htmlFor="remarks"
                            className="font-bold text-slate-900"
                        >
                            Laboratory remarks
                        </label>
                        <textarea
                            id="remarks"
                            disabled={locked}
                            rows={4}
                            className={inputClass}
                            value={form.data.remarks}
                            onChange={(e) =>
                                form.setData('remarks', e.target.value)
                            }
                            placeholder="Optional technical notes or critical-value communication"
                        />
                        <InputError message={form.errors.remarks} />
                        <InputError
                            message={
                                (form.errors as Record<string, string>).form
                            }
                        />
                    </section>
                    <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <ShieldCheck className="h-5 w-5 text-moss-700" />
                            Finalizing locks this report and advances the
                            patient workflow.
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={`/clinical-forms/${appointment.id}/laboratory.pdf?preview=1`}
                                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700"
                            >
                                <Download className="h-4 w-4" />
                                Preview PDF
                            </Link>
                            {!locked && (
                                <>
                                    <button
                                        type="button"
                                        disabled={form.processing}
                                        onClick={() => submit(false)}
                                        className="inline-flex items-center gap-2 rounded-xl border border-moss-300 px-4 py-2.5 font-semibold text-moss-800"
                                    >
                                        <Save className="h-4 w-4" />
                                        Save draft
                                    </button>
                                    <button
                                        type="button"
                                        disabled={
                                            form.processing ||
                                            Object.keys(sections).length === 0
                                        }
                                        onClick={() => submit(true)}
                                        className="inline-flex items-center gap-2 rounded-xl bg-moss-600 px-4 py-2.5 font-semibold text-white disabled:opacity-50"
                                    >
                                        {form.processing ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <ShieldCheck className="h-4 w-4" />
                                        )}
                                        Finalize report
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

function Summary({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold tracking-wide text-moss-200 uppercase">
                {label}
            </p>
            <p className="max-w-48 truncate font-semibold">{value}</p>
        </div>
    );
}
LaboratoryResultsForm.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
