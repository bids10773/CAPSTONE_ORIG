import { Head, Link, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    CheckCircle2,
    FlaskConical,
    LoaderCircle,
    ScanLine,
    TriangleAlert,
} from 'lucide-react';
import type { CSSProperties } from 'react';

import InputError from '@/components/input-error';
import { MedicalReportClinicalReview } from '@/components/medical-report-clinical-review';
import {
    MedicalReportCertification,
    MedicalReportDiagnosticSummary,
} from '@/components/medical-report-template';
import { useSidebar } from '@/components/ui/sidebar';
import { useSessionDraft } from '@/hooks/use-session-draft';
import AppLayout from '@/layouts/app-layout';
import { confirmAction } from '@/lib/dialogs';
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
    Hepatitis: { label: 'Hepatitis B Screening', column: 'serology_results' },
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
    canFinalize: boolean;
    reportPhysicians?: { examining: string | null; classifying: string | null };
    savedDraft?: Record<string, string | null> | null;
};

export default function FinalEvaluation({
    appointment,
    selectedServices = [],
    medicalExamination,
    childSummaries = [],
    readyForFinalEvaluation,
    canFinalize,
    reportPhysicians,
    savedDraft,
}: Props) {
    const { open: sidebarOpen } = useSidebar();
    const form = useForm({
        medical_class: savedDraft?.medical_class ?? '',
        final_diagnosis: savedDraft?.final_diagnosis ?? '',
        final_remarks: savedDraft?.final_remarks ?? '',
        recommendations: savedDraft?.recommendations ?? '',
    });
    const { clearDraft } = useSessionDraft(
        `final-evaluation-${appointment.id}`,
        form.data,
        form.isDirty,
        (draft) => form.setData((current) => ({ ...current, ...draft })),
        canFinalize && !medicalExamination.finalized_at,
    );
    const releaseForm = useForm({});
    const drugForm = useForm({
        result: 'negative',
        official_reference_number: '',
        official_result_date: new Date().toISOString().slice(0, 10),
        remarks: '',
        supporting_document: null as File | null,
    });
    const patient = appointment.user;
    const profile = appointment.patient_profile;
    const physical = appointment.physical_exam;
    const history = appointment.medical_history;
    const lab = appointment.lab_result;
    const xray = appointment.xray_report;
    const drugWorkflow = medicalExamination.diagnostic_results?.find(
        (result: any) => result.service_key === 'drug_test',
    );
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
        save('complete');
    };
    const save = (action: 'draft' | 'complete') => {
        form.transform((values) => ({ ...values, save_action: action }));
        form.post(`/doctor/final-evaluation/${appointment.id}`, {
            preserveScroll: true,
            onSuccess: action === 'complete' ? clearDraft : undefined,
        });
    };

    return (
        <>
            <Head title="Final Medical Evaluation" />
            <div
                style={
                    {
                        '--report-sidebar-inset': sidebarOpen
                            ? 'var(--sidebar-width)'
                            : 'var(--sidebar-width-icon)',
                    } as CSSProperties
                }
                className={`mx-auto w-full max-w-6xl space-y-4 p-4 sm:p-5 ${medicalExamination.finalized_at ? 'pb-64 sm:pb-40' : 'pb-24 sm:pb-24'}`}
            >
                <Link
                    href="/doctor/appointments"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-moss-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to doctor queue
                </Link>
                <article className="bg-white p-3 shadow-sm sm:p-5">
                    <header className="border border-moss-400 bg-white">
                        <div className="border-b border-moss-400 px-3 py-3 text-center">
                            <h1 className="text-xl font-bold tracking-wide text-moss-800 sm:text-2xl">
                                Medical Examination Report
                            </h1>
                            <p className="mt-1 text-xs text-slate-500">
                                {appointment.reference_code} · Final medical
                                evaluation
                            </p>
                        </div>
                        <div className="grid sm:grid-cols-[100px_minmax(0,1fr)]">
                            <div className="hidden items-center justify-center border-r border-moss-400 p-3 sm:flex">
                                <div className="flex aspect-square w-full items-center justify-center border border-moss-300 p-2 text-center text-xs text-moss-700">
                                    1 × 1<br />
                                    ID picture
                                </div>
                            </div>
                            <div className="grid gap-x-4 gap-y-2 p-3 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                                <Meta label="Name" value={name} />
                                <Meta
                                    label="Age / Sex"
                                    value={`${age ?? '—'} / ${profile?.sex ?? patient?.sex ?? '—'}`}
                                />
                                <Meta
                                    label="Address"
                                    value={profile?.address || 'Not recorded'}
                                />
                                <Meta
                                    label="Civil status"
                                    value={
                                        profile?.civil_status || 'Not recorded'
                                    }
                                />
                                <Meta
                                    label="Company / Agency"
                                    value={
                                        appointment.company?.company_name ||
                                        appointment.company_name ||
                                        'No company'
                                    }
                                />
                                <Meta
                                    label="Appointment"
                                    value={appointment.reference_code}
                                />
                                <Meta
                                    label="Date of examination"
                                    value={
                                        String(
                                            medicalExamination.examination_date ||
                                                appointment.appointment_date ||
                                                '',
                                        ).slice(0, 10) || 'Not recorded'
                                    }
                                />
                                {profile?.employee_number && (
                                    <Meta
                                        label="Employee no."
                                        value={profile.employee_number}
                                    />
                                )}
                            </div>
                        </div>
                    </header>

                    {medicalExamination.finalized_at && (
                        <section
                            aria-label="Finalized report actions"
                            className="fixed right-4 bottom-4 left-4 z-30 flex max-h-[calc(100dvh-2rem)] flex-col justify-between gap-3 overflow-y-auto rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-lg transition-[left] duration-200 motion-reduce:transition-none sm:right-6 sm:bottom-6 sm:left-6 sm:flex-row sm:items-center md:left-[calc(var(--report-sidebar-inset)+1.5rem)]"
                        >
                            <div className="min-w-0">
                                <p className="font-bold text-emerald-900">
                                    Medical Examination Report finalized
                                </p>
                                <p className="text-sm text-emerald-800">
                                    {medicalExamination.released_at
                                        ? 'The finalized report has been forwarded to clinic reception. Reception handles printed results and records in-person collection.'
                                        : 'Forward the finalized report to clinic reception. The patient must visit the clinic to collect the printed results.'}
                                </p>
                            </div>
                            {!medicalExamination.released_at && (
                                <div className="shrink-0">
                                    <button
                                        type="button"
                                        disabled={releaseForm.processing}
                                        onClick={async () => {
                                            if (
                                                !(await confirmAction(
                                                    'Forward the finalized Medical Examination Report to clinic reception? The patient will collect the printed results in person.',
                                                ))
                                            )
                                                return;
                                            releaseForm.post(
                                                `/doctor/final-evaluation/${appointment.id}/release`,
                                            );
                                        }}
                                        className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-emerald-600 bg-emerald-700 px-5 py-3 text-sm font-bold text-white shadow-lg transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 enabled:hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                                    >
                                        {releaseForm.processing && (
                                            <LoaderCircle
                                                aria-hidden="true"
                                                className="mr-2 size-4 animate-spin"
                                            />
                                        )}
                                        {releaseForm.processing
                                            ? 'Forwarding to clinic reception…'
                                            : 'Forward to clinic reception'}
                                    </button>
                                </div>
                            )}
                        </section>
                    )}

                    <p className="border-x border-b border-moss-400 px-3 py-1.5 text-xs text-slate-600">
                        <span className="font-semibold">
                            Requested services:
                        </span>{' '}
                        {selectedServices.join(', ') || 'No services selected'}
                    </p>

                    {incomplete.length > 0 && (
                        <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                            <TriangleAlert className="h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-bold">
                                    Selected services are incomplete
                                </p>
                                <p className="text-sm">
                                    Complete: {incomplete.join(', ')} before
                                    issuing final clearance.
                                </p>
                            </div>
                        </div>
                    )}

                    {has('Drug Test') &&
                        drugWorkflow &&
                        drugWorkflow.status !== 'verified' && (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    drugForm.post(
                                        `/doctor/final-evaluation/${appointment.id}/drug-test`,
                                        { forceFormData: true },
                                    );
                                }}
                                className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm"
                            >
                                <h2 className="font-bold text-slate-900">
                                    Verify official Drug Test result
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Encode this summary only after reviewing the
                                    official result. Current status:{' '}
                                    <strong>{drugWorkflow.status}</strong>
                                </p>
                                <div className="mt-4 grid gap-4 md:grid-cols-2">
                                    <label className="text-sm font-semibold text-slate-700">
                                        Summarized result
                                        <select
                                            value={drugForm.data.result}
                                            onChange={(event) =>
                                                drugForm.setData(
                                                    'result',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-xl border-slate-300"
                                        >
                                            <option value="negative">
                                                Negative
                                            </option>
                                            <option value="positive_confirmed">
                                                Positive — Confirmed
                                            </option>
                                            <option value="inconclusive_repeat">
                                                Inconclusive / For Repeat
                                            </option>
                                            <option value="cancelled">
                                                Cancelled
                                            </option>
                                        </select>
                                    </label>
                                    <label className="text-sm font-semibold text-slate-700">
                                        Official result date
                                        <input
                                            type="date"
                                            value={
                                                drugForm.data
                                                    .official_result_date
                                            }
                                            onChange={(event) =>
                                                drugForm.setData(
                                                    'official_result_date',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-xl border-slate-300"
                                        />
                                    </label>
                                    <label className="text-sm font-semibold text-slate-700">
                                        Reference number
                                        <input
                                            value={
                                                drugForm.data
                                                    .official_reference_number
                                            }
                                            onChange={(event) =>
                                                drugForm.setData(
                                                    'official_reference_number',
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full rounded-xl border-slate-300"
                                        />
                                    </label>
                                    <label className="text-sm font-semibold text-slate-700">
                                        Supporting document
                                        <input
                                            type="file"
                                            accept=".pdf,.jpg,.jpeg,.png"
                                            onChange={(event) =>
                                                drugForm.setData(
                                                    'supporting_document',
                                                    event.target.files?.[0] ??
                                                        null,
                                                )
                                            }
                                            className="mt-1 block w-full text-sm"
                                        />
                                    </label>
                                </div>
                                <InputError message={drugForm.errors.result} />
                                <button
                                    disabled={drugForm.processing}
                                    className="mt-4 cursor-pointer rounded-xl bg-moss-700 px-5 py-2.5 text-sm font-bold text-white transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-700 enabled:hover:bg-moss-800 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Verify Drug Test result
                                </button>
                            </form>
                        )}

                    <MedicalReportClinicalReview
                        history={history}
                        physical={physical}
                    />
                    <MedicalReportDiagnosticSummary
                        services={selectedServices}
                        diagnostics={medicalExamination.diagnostic_results}
                        laboratory={lab}
                        xray={xray}
                        ecg={appointment.ecg_status}
                        audiometry={appointment.audiometry_status}
                        neuro={appointment.neuro_psychiatric_status}
                    />

                    {!medicalExamination.finalized_at && canFinalize && (
                        <form
                            onSubmit={submit}
                            className="border-x border-b border-moss-400 bg-white"
                        >
                            <h2 className="border-b border-moss-400 px-3 py-1.5 text-sm font-bold text-moss-800">
                                Medical classification and final evaluation
                            </h2>
                            <p className="px-3 py-2 text-xs text-slate-600">
                                Save incomplete work as a draft. Finalization
                                still requires all requested examinations and
                                the doctor's completed assessment.
                            </p>
                            {Object.values(form.errors).length > 0 && (
                                <p
                                    role="alert"
                                    className="px-3 py-2 text-sm text-red-600"
                                >
                                    {Object.values(form.errors).join(' ')}
                                </p>
                            )}
                            <div className="grid lg:grid-cols-[66fr_34fr]">
                                <div className="p-3">
                                    <fieldset>
                                        <legend className="mb-2 text-sm font-semibold text-slate-800">
                                            Medical classification
                                        </legend>
                                        <div className="space-y-1">
                                            {[
                                                [
                                                    'A',
                                                    'Class A',
                                                    'Physically fit for all types of work. Has no noted defects.',
                                                ],
                                                [
                                                    'B',
                                                    'Class B',
                                                    'Physically fit for all types of work. Has minor defects or ailments that offer no handicap to the job applied for.',
                                                ],
                                                [
                                                    'C',
                                                    'Class C',
                                                    'Employment at the risk and discretion of management.',
                                                ],
                                                [
                                                    'pending',
                                                    'Pending',
                                                    'Further clearance needed',
                                                ],
                                                [
                                                    'unfit',
                                                    'Unfit',
                                                    'Not fit for work',
                                                ],
                                            ].map(
                                                ([
                                                    value,
                                                    label,
                                                    description,
                                                ]) => (
                                                    <label
                                                        key={value}
                                                        className={`flex cursor-pointer items-start gap-2 px-1 py-1.5 text-sm transition focus-within:ring-2 focus-within:ring-moss-500 ${form.data.medical_class === value ? 'bg-moss-50' : 'hover:bg-moss-50/50'}`}
                                                    >
                                                        <input
                                                            type="radio"
                                                            className="mt-0.5 size-4 shrink-0 accent-moss-700"
                                                            name="medical_class"
                                                            value={value}
                                                            checked={
                                                                form.data
                                                                    .medical_class ===
                                                                value
                                                            }
                                                            onChange={() =>
                                                                setClass(value)
                                                            }
                                                        />
                                                        <span>
                                                            <span className="font-bold text-moss-800">
                                                                {label}
                                                            </span>
                                                            <span className="ml-2 text-xs text-slate-700">
                                                                {description}
                                                            </span>
                                                        </span>
                                                    </label>
                                                ),
                                            )}
                                        </div>
                                        <InputError
                                            message={form.errors.medical_class}
                                        />
                                    </fieldset>
                                    <div className="mt-3 border-t border-moss-200 pt-3">
                                        <label
                                            htmlFor="final_diagnosis"
                                            className="block text-sm font-bold text-slate-800"
                                        >
                                            Final diagnosis{' '}
                                            <span className="text-red-600">
                                                *
                                            </span>
                                        </label>
                                        <textarea
                                            id="final_diagnosis"
                                            rows={2}
                                            className="mt-1 w-full rounded border border-slate-300 p-2 text-sm outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15"
                                            value={form.data.final_diagnosis}
                                            onChange={(event) =>
                                                form.setData(
                                                    'final_diagnosis',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                form.errors.final_diagnosis
                                            }
                                        />
                                        <label
                                            htmlFor="final_remarks"
                                            className="mt-3 block text-sm font-bold text-slate-800"
                                        >
                                            Final remarks
                                        </label>
                                        <textarea
                                            id="final_remarks"
                                            rows={3}
                                            className="mt-1 w-full rounded border border-slate-300 p-2 text-sm outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15"
                                            value={form.data.final_remarks}
                                            onChange={(event) =>
                                                form.setData(
                                                    'final_remarks',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={form.errors.final_remarks}
                                        />
                                        <label
                                            htmlFor="recommendations"
                                            className="mt-3 block text-sm font-bold text-slate-800"
                                        >
                                            Recommendations
                                        </label>
                                        <textarea
                                            id="recommendations"
                                            rows={2}
                                            className="mt-1 w-full rounded border border-slate-300 p-2 text-sm outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/15"
                                            value={form.data.recommendations}
                                            onChange={(event) =>
                                                form.setData(
                                                    'recommendations',
                                                    event.target.value,
                                                )
                                            }
                                        />
                                        <InputError
                                            message={
                                                form.errors.recommendations
                                            }
                                        />
                                    </div>
                                </div>
                                <MedicalReportCertification
                                    physical={physical}
                                />
                            </div>
                            <div className="fixed right-4 bottom-4 left-4 z-40 flex justify-end gap-2 sm:right-6 sm:bottom-6 sm:left-auto">
                                <button
                                    type="button"
                                    disabled={form.processing}
                                    onClick={() => save('draft')}
                                    className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-lg disabled:opacity-50"
                                >
                                    Save draft
                                </button>
                                <button
                                    type="submit"
                                    disabled={
                                        form.processing ||
                                        !form.data.medical_class ||
                                        !form.data.final_diagnosis ||
                                        !readyForFinalEvaluation ||
                                        selectedServices.length === 0
                                    }
                                    className="inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-moss-500 bg-moss-700 px-5 py-3 text-sm font-bold text-white shadow-lg transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-moss-600 enabled:hover:bg-moss-800 disabled:cursor-not-allowed disabled:bg-slate-500 disabled:opacity-80 sm:w-auto"
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
                    )}
                    {(medicalExamination.finalized_at || !canFinalize) && (
                        <div className="grid border-x border-b border-moss-400 lg:grid-cols-[66fr_34fr]">
                            <section className="p-3">
                                <h2 className="text-sm font-bold text-moss-800">
                                    Medical classification and final evaluation
                                </h2>
                                <Findings
                                    values={{
                                        Classification:
                                            medicalExamination.medical_classification ||
                                            'Not finalized',
                                        'Final diagnosis':
                                            medicalExamination.final_diagnosis ||
                                            'Not recorded',
                                        Remarks:
                                            medicalExamination.final_remarks ||
                                            'Not recorded',
                                        Recommendations:
                                            medicalExamination.recommendations ||
                                            'Not recorded',
                                    }}
                                />
                            </section>
                            <MedicalReportCertification physical={physical} />
                        </div>
                    )}
                    <div className="grid border-x border-b border-moss-400 sm:grid-cols-3">
                        <SignatureLine
                            label="Classifying physician"
                            name={reportPhysicians?.classifying || ''}
                        />
                        <SignatureLine
                            label="Examining physician"
                            name={reportPhysicians?.examining || ''}
                        />
                        <SignatureLine
                            label="Signature over printed name"
                            name={name}
                        />
                    </div>
                </article>
                <details className="border border-moss-300 bg-white">
                    <summary className="cursor-pointer px-3 py-3 text-sm font-semibold text-moss-800">
                        Supporting laboratory and diagnostic results
                    </summary>
                    <div className="p-3">
                        <div className="space-y-4">
                            {selectedLabs.length > 0 && (
                                <ReviewSection
                                    icon={<FlaskConical />}
                                    title="III. Laboratory examination"
                                    complete={!!lab?.is_completed}
                                >
                                    {lab ? (
                                        <div className="grid items-start gap-3 lg:grid-cols-2">
                                            {selectedLabs.map((item) => (
                                                <article
                                                    key={item.column}
                                                    className="min-w-0 border border-moss-200 p-3"
                                                >
                                                    <div className="flex items-center justify-between gap-3">
                                                        <h3 className="font-bold text-slate-900">
                                                            {item.label}
                                                        </h3>
                                                        <span
                                                            className={`status-text-only text-xs font-bold ${lab.is_completed ? 'text-emerald-800' : 'text-amber-800'}`}
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
                                                <p className="bg-slate-50 p-3 text-sm lg:col-span-2">
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
                                    title="IV. Chest X-ray"
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
                                            Result:
                                                appointment.ecg_status ||
                                                'Pending',
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
                                    complete={
                                        !!appointment.neuro_psychiatric_status
                                    }
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
                    </div>
                </details>
            </div>
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
        <section className="min-w-0 border border-moss-300 bg-white">
            <div className="flex items-center justify-between gap-3 border-b border-moss-300 bg-moss-50 px-3 py-2">
                <div className="flex items-center gap-2 text-moss-700">
                    <span aria-hidden="true" className="[&>svg]:size-4">
                        {icon}
                    </span>
                    <h2 className="text-sm font-bold text-moss-800">
                        {heading}
                    </h2>
                </div>
                <span
                    className={`status-text-only text-xs font-bold ${complete ? 'text-emerald-800' : 'text-amber-800'}`}
                >
                    {complete ? 'Complete' : 'Pending'}
                </span>
            </div>
            <div className="p-3">{children}</div>
        </section>
    );
}
function Meta({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-xs sm:text-sm">
            <p className="shrink-0 font-medium text-moss-800">{label}</p>
            <p className="min-w-0 flex-1 border-b border-moss-200 font-semibold break-words whitespace-pre-wrap text-slate-900">
                {value}
            </p>
        </div>
    );
}
function SignatureLine({ label, name }: { label: string; name: string }) {
    return (
        <div className="px-4 pt-7 pb-3 text-center text-xs text-moss-800">
            <p className="min-h-5 border-b border-moss-300 font-semibold text-slate-900">
                {name || '\u00a0'}
            </p>
            <p className="mt-1">{label}</p>
        </div>
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
        <div className="mt-2">
            {heading && (
                <h3 className="mb-2 text-sm font-bold text-slate-800">
                    {heading}
                </h3>
            )}
            <dl className="divide-y divide-slate-100">
                {entries.map(([label, value]) => (
                    <div
                        key={label}
                        className="grid gap-1 py-2 text-sm sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] sm:gap-3"
                    >
                        <dt className="font-semibold text-slate-600">
                            {label}
                        </dt>
                        <dd className="min-w-0 leading-5 break-words whitespace-pre-wrap text-slate-900">
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
