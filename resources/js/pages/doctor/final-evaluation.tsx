import { Head, Link, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    FlaskConical,
    LoaderCircle,
    ScanLine,
    Stethoscope,
    TriangleAlert,
} from 'lucide-react';

import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctor Queue', href: '/doctor/appointments' },
    { title: 'Final Evaluation', href: '' },
];

const laboratoryMapping: Record<string, { label: string; column: string }> = {
    CBC: { label: 'Complete Blood Count', column: 'cbc_results' },
    Urinalysis: { label: 'Urinalysis', column: 'urinalysis_results' },
    Fecalysis: { label: 'Fecalysis', column: 'fecalysis_results' },
    'Drug Test': { label: 'Drug Test', column: 'drug_test_results' },
    Hepatitis: { label: 'Hepatitis Screening', column: 'serology_results' },
    'Pregnancy Test': { label: 'Pregnancy Test', column: 'pregnancy_test' },
    FBS: { label: 'Fasting Blood Sugar', column: 'blood_chemistry_results' },
    'Blood Chemistry': {
        label: 'Blood Chemistry',
        column: 'blood_chemistry_results',
    },
    'Blood Typing': { label: 'Blood Typing', column: 'blood_type' },
};

type ChildSummary = {
    key: string;
    label: string;
    status: 'completed' | 'draft' | 'pending';
    summary: string;
};

type Props = {
    appointment: any;
    selectedServices: string[];
    medicalExamination: any;
    childSummaries: ChildSummary[];
    readyForFinalEvaluation: boolean;
};

export default function FinalEvaluation({
    appointment,
    selectedServices = [],
    medicalExamination,
    childSummaries = [],
    readyForFinalEvaluation,
}: Props) {
    const form = useForm({
        medical_class: '',
        final_diagnosis: '',
        final_remarks: '',
        recommendations: '',
    });
    const patient = appointment.user;
    const profile = appointment.patient_profile;
    const physical = appointment.physical_exam;
    const history = appointment.medical_history;
    const lab = appointment.lab_result;
    const xray = appointment.xray_report;
    const has = (service: string) => selectedServices.includes(service);
    const selectedLabs = selectedServices
        .filter((service) => laboratoryMapping[service])
        .map((service) => ({ service, ...laboratoryMapping[service] }))
        .filter(
            (item, index, items) =>
                items.findIndex((other) => other.column === item.column) ===
                index,
        );
    const incomplete = childSummaries
        .filter((child) => child.status !== 'completed')
        .map((child) => child.label);
    const birthday = profile?.birthdate ? new Date(profile.birthdate) : null;
    const age = birthday
        ? Math.max(
              0,
              new Date().getFullYear() -
                  birthday.getFullYear() -
                  (new Date() <
                  new Date(
                      new Date().getFullYear(),
                      birthday.getMonth(),
                      birthday.getDate(),
                  )
                      ? 1
                      : 0),
          )
        : null;
    const name = [
        patient?.last_name ? `${patient.last_name},` : '',
        patient?.first_name,
        patient?.middle_name,
    ]
        .filter(Boolean)
        .join(' ');
    const setClass = (value: string) => {
        form.setData('medical_class', value);
        form.setData(
            'final_remarks',
            {
                A: 'FIT TO WORK — Physically fit for all types of work with no noted defects.',
                B: 'FIT TO WORK — Minor defect or ailment noted that offers no handicap to the work applied for.',
                C: 'Employment at the risk and discretion of management.',
                pending:
                    'Pending further examination, result, or specialist clearance.',
                unfit: 'Not medically fit for the work applied for.',
            }[value] ?? '',
        );
    };
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(`/doctor/final-evaluation/${appointment.id}`);
    };

    return (
        <>
            <Head title="Final Medical Evaluation" />
            <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
                <Link
                    href="/doctor/appointments"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-moss-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to doctor queue
                </Link>
                <header className="overflow-hidden rounded-2xl bg-moss-700 p-6 text-white shadow-sm">
                    <p className="text-xs font-bold tracking-[.16em] text-moss-200 uppercase">
                        Living Myth Industrial Clinic
                    </p>
                    <div className="mt-2 flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <h1 className="text-2xl font-bold">
                                Final medical evaluation
                            </h1>
                            <p className="mt-1 text-moss-100">
                                Reviewing only the services selected for this
                                appointment.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm sm:grid-cols-4">
                            <Meta label="Patient" value={name} />
                            <Meta
                                label="Age / Sex"
                                value={`${age ?? '—'} / ${profile?.sex ?? patient?.sex ?? '—'}`}
                            />
                            <Meta
                                label="Company"
                                value={
                                    appointment.company?.company_name ??
                                    appointment.company_name ??
                                    'OPD'
                                }
                            />
                            <Meta
                                label="Appointment"
                                value={`#${appointment.id}`}
                            />
                            <Meta
                                label="PE master"
                                value={`#${medicalExamination.id}`}
                            />
                        </div>
                    </div>
                </header>

                <section className="rounded-2xl border border-moss-100 bg-white p-5 shadow-sm">
                    <div className="flex items-center gap-2">
                        <ClipboardCheck className="h-5 w-5 text-moss-700" />
                        <h2 className="font-bold text-slate-900">
                            Selected services
                        </h2>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {selectedServices.length ? (
                            selectedServices.map((service) => (
                                <span
                                    key={service}
                                    className="rounded-full border border-moss-200 bg-moss-50 px-3 py-1.5 text-sm font-semibold text-moss-800"
                                >
                                    {service}
                                </span>
                            ))
                        ) : (
                            <span className="text-sm text-red-700">
                                No services are attached to this appointment.
                            </span>
                        )}
                    </div>
                </section>

                {incomplete.length > 0 && (
                    <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                        <TriangleAlert className="h-5 w-5 shrink-0" />
                        <div>
                            <p className="font-bold">
                                Selected services are incomplete
                            </p>
                            <p className="text-sm">
                                Complete: {incomplete.join(', ')} before issuing
                                final clearance.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid gap-5 lg:grid-cols-2">
                    {has('PE') && (
                        <ReviewSection
                            icon={<Stethoscope />}
                            title="Physical Examination"
                            complete={!!physical}
                        >
                            {physical ? (
                                <>
                                    <ResultGrid
                                        values={{
                                            Height:
                                                physical.height &&
                                                `${physical.height} cm`,
                                            Weight:
                                                physical.weight &&
                                                `${physical.weight} kg`,
                                            'Blood Pressure':
                                                physical.blood_pressure,
                                            Pulse:
                                                physical.pulse_rate &&
                                                `${physical.pulse_rate} bpm`,
                                            Temperature:
                                                physical.temperature &&
                                                `${physical.temperature} °C`,
                                        }}
                                    />
                                    <Findings
                                        values={Object.fromEntries(
                                            [
                                                'head_scalp',
                                                'eyes',
                                                'ears',
                                                'nose_sinuses',
                                                'mouth_throat',
                                                'neck_thyroid',
                                                'chest_breast',
                                                'lungs',
                                                'heart',
                                                'abdomen',
                                                'back',
                                                'anus',
                                                'genitals',
                                                'extremities',
                                                'skin',
                                                'dental',
                                            ].map((key) => [
                                                title(key),
                                                physical[key] || 'Normal',
                                            ]),
                                        )}
                                    />
                                    {history && (
                                        <Findings
                                            heading="Medical history"
                                            values={Object.fromEntries(
                                                Object.entries(history)
                                                    .filter(
                                                        ([key, value]) =>
                                                            ![
                                                                'id',
                                                                'appointment_id',
                                                                'created_at',
                                                                'updated_at',
                                                            ].includes(key) &&
                                                            value,
                                                    )
                                                    .map(([key, value]) => [
                                                        title(key),
                                                        String(value),
                                                    ]),
                                            )}
                                        />
                                    )}
                                </>
                            ) : (
                                <Missing />
                            )}
                        </ReviewSection>
                    )}

                    {selectedLabs.length > 0 && (
                        <ReviewSection
                            icon={<FlaskConical />}
                            title="Requested Laboratory Services"
                            complete={!!lab?.is_completed}
                        >
                            {lab ? (
                                <div className="space-y-4">
                                    {selectedLabs.map((item) => (
                                        <article
                                            key={item.column}
                                            className="rounded-xl border border-slate-200 p-4"
                                        >
                                            <div className="flex items-center justify-between gap-3">
                                                <h3 className="font-bold text-slate-900">
                                                    {item.label}
                                                </h3>
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${lab.is_completed ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                                                >
                                                    {lab.is_completed
                                                        ? 'Finalized'
                                                        : 'Draft'}
                                                </span>
                                            </div>
                                            <Findings
                                                values={normalizeResults(
                                                    lab[item.column],
                                                )}
                                            />
                                        </article>
                                    ))}
                                    {lab.remarks && (
                                        <p className="rounded-xl bg-slate-50 p-3 text-sm">
                                            <strong>Remarks:</strong>{' '}
                                            {lab.remarks}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <Missing />
                            )}
                        </ReviewSection>
                    )}

                    {has('X-Ray') && (
                        <ReviewSection
                            icon={<ScanLine />}
                            title="Chest X-Ray"
                            complete={!!xray?.is_completed}
                        >
                            {xray ? (
                                <Findings
                                    values={{
                                        Findings:
                                            xray.findings ||
                                            'No findings documented',
                                        Impression:
                                            xray.impression ||
                                            'No impression documented',
                                    }}
                                />
                            ) : (
                                <Missing />
                            )}
                        </ReviewSection>
                    )}

                    {has('ECG') && (
                        <ReviewSection
                            icon={<Activity />}
                            title="Electrocardiogram"
                            complete={!!appointment.ecg_status}
                        >
                            <Findings
                                values={{
                                    Result: appointment.ecg_status || 'Pending',
                                }}
                            />
                        </ReviewSection>
                    )}
                    {has('Audiometry') && (
                        <ReviewSection
                            icon={<Activity />}
                            title="Audiometry"
                            complete={!!appointment.audiometry_status}
                        >
                            <Findings
                                values={{
                                    Result:
                                        appointment.audiometry_status ||
                                        'Pending',
                                }}
                            />
                        </ReviewSection>
                    )}
                    {has('Neuro Psychiatric Test') && (
                        <ReviewSection
                            icon={<Activity />}
                            title="Neuro Psychiatric Test"
                            complete={!!appointment.neuro_psychiatric_status}
                        >
                            <Findings
                                values={{
                                    Result:
                                        appointment.neuro_psychiatric_status ||
                                        'Pending',
                                }}
                            />
                        </ReviewSection>
                    )}
                </div>

                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                    <h2 className="font-bold text-slate-900">
                        Medical classification
                    </h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                        {[
                            ['A', 'Class A', 'Fit to work'],
                            ['B', 'Class B', 'Fit with minor findings'],
                            ['C', 'Class C', 'Management discretion'],
                            ['pending', 'Pending', 'Further clearance needed'],
                            ['unfit', 'Unfit', 'Not fit for work'],
                        ].map(([value, label, description]) => (
                            <label
                                key={value}
                                className={`cursor-pointer rounded-xl border p-4 transition ${form.data.medical_class === value ? 'border-moss-500 bg-moss-50 ring-2 ring-moss-500/20' : 'border-slate-200 hover:border-moss-300'}`}
                            >
                                <input
                                    type="radio"
                                    className="sr-only"
                                    name="medical_class"
                                    value={value}
                                    checked={form.data.medical_class === value}
                                    onChange={() => setClass(value)}
                                />
                                <span className="block font-bold text-slate-900">
                                    {label}
                                </span>
                                <span className="mt-1 block text-xs text-slate-500">
                                    {description}
                                </span>
                            </label>
                        ))}
                    </div>
                    <InputError message={form.errors.medical_class} />
                    <label
                        htmlFor="final_diagnosis"
                        className="mt-5 block text-sm font-bold text-slate-800"
                    >
                        Final diagnosis <span className="text-red-600">*</span>
                    </label>
                    <textarea
                        id="final_diagnosis"
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15"
                        value={form.data.final_diagnosis}
                        onChange={(event) =>
                            form.setData('final_diagnosis', event.target.value)
                        }
                    />
                    <InputError message={form.errors.final_diagnosis} />
                    <label
                        htmlFor="final_remarks"
                        className="mt-5 block text-sm font-bold text-slate-800"
                    >
                        Final remarks
                    </label>
                    <textarea
                        id="final_remarks"
                        rows={4}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15"
                        value={form.data.final_remarks}
                        onChange={(event) =>
                            form.setData('final_remarks', event.target.value)
                        }
                    />
                    <InputError message={form.errors.final_remarks} />
                    <label
                        htmlFor="recommendations"
                        className="mt-5 block text-sm font-bold text-slate-800"
                    >
                        Recommendations
                    </label>
                    <textarea
                        id="recommendations"
                        rows={3}
                        className="mt-1 w-full rounded-xl border border-slate-300 p-3 outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15"
                        value={form.data.recommendations}
                        onChange={(event) =>
                            form.setData('recommendations', event.target.value)
                        }
                    />
                    <InputError message={form.errors.recommendations} />
                    <div className="mt-5 flex justify-end">
                        <button
                            disabled={
                                form.processing ||
                                !form.data.medical_class ||
                                !form.data.final_diagnosis ||
                                !readyForFinalEvaluation ||
                                selectedServices.length === 0
                            }
                            className="inline-flex items-center gap-2 rounded-xl bg-moss-600 px-5 py-2.5 font-bold text-white disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {form.processing ? (
                                <LoaderCircle className="h-4 w-4 animate-spin" />
                            ) : (
                                <CheckCircle2 className="h-4 w-4" />
                            )}
                            Issue final evaluation
                        </button>
                    </div>
                </form>
            </main>
        </>
    );
}

function ReviewSection({
    icon,
    title: heading,
    complete,
    children,
}: {
    icon: React.ReactNode;
    title: string;
    complete: boolean;
    children: React.ReactNode;
}) {
    return (
        <details
            open
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
        >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 border-b border-slate-100 p-4 marker:hidden">
                <div className="flex items-center gap-2 text-moss-700">
                    <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
                    <h2 className="font-bold text-slate-900">{heading}</h2>
                </div>
                <span
                    className={`rounded-full px-2.5 py-1 text-xs font-bold ${complete ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}
                >
                    {complete ? 'Complete' : 'Pending'}
                </span>
            </summary>
            <div className="p-4">{children}</div>
        </details>
    );
}
function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-[10px] font-bold tracking-wide text-moss-200 uppercase">
                {label}
            </p>
            <p className="max-w-44 truncate font-semibold capitalize">
                {value}
            </p>
        </div>
    );
}
function ResultGrid({ values }: { values: Record<string, any> }) {
    return (
        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(values)
                .filter(([, value]) => value)
                .map(([label, value]) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs font-bold text-slate-500">
                            {label}
                        </dt>
                        <dd className="mt-1 font-semibold text-slate-900">
                            {String(value)}
                        </dd>
                    </div>
                ))}
        </dl>
    );
}
function Findings({
    heading,
    values,
}: {
    heading?: string;
    values: Record<string, any>;
}) {
    const entries = Object.entries(values).filter(
        ([, value]) => value !== null && value !== undefined && value !== '',
    );
    return (
        <div className="mt-4">
            {heading && (
                <h3 className="mb-2 text-sm font-bold text-slate-800">
                    {heading}
                </h3>
            )}
            <dl className="divide-y divide-slate-100">
                {entries.map(([label, value]) => (
                    <div
                        key={label}
                        className="grid grid-cols-[140px_1fr] gap-3 py-2 text-sm"
                    >
                        <dt className="font-semibold text-slate-600">
                            {label}
                        </dt>
                        <dd className="break-words text-slate-900">
                            {String(value)}
                        </dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
function Missing() {
    return (
        <p className="text-sm text-amber-800">
            No completed result is available for this selected service.
        </p>
    );
}
function normalizeResults(value: unknown): Record<string, any> {
    if (value && typeof value === 'object' && !Array.isArray(value))
        return Object.fromEntries(
            Object.entries(value as Record<string, any>).map(([key, item]) => [
                title(key),
                item,
            ]),
        );
    return { Result: value || 'Not recorded' };
}
function title(value: string) {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

FinalEvaluation.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
