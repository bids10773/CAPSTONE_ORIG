import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, HeartPulse, History, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { BmiSummary } from '@/components/bmi-summary';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSessionDraft } from '@/hooks/use-session-draft';
import AppLayout from '@/layouts/app-layout';
import { getBmiClassification } from '@/lib/bmi';
import type { BreadcrumbItem } from '@/types';

type Vital = {
    id: number;
    systolic_pressure: number | null;
    diastolic_pressure: number | null;
    heart_rate: number | null;
    respiratory_rate: number | null;
    temperature: string | null;
    oxygen_saturation: string | null;
    height: string | null;
    weight: string | null;
    bmi: string | null;
    visual_acuity: string | null;
    hearing: string | null;
    notes: string | null;
    measurement_type: string;
    measured_at: string;
    recorded_by?: { name: string };
    not_assessed?: Record<string, string> | null;
};
type Props = {
    appointment: any;
    latestVitalSign: Vital | null;
    history: Vital[];
    pendingRecheck: { reason: string } | null;
    requiredFields: string[];
    savedDraft?: Record<string, unknown> | null;
};
const fields = [
    ['systolic_pressure', 'Systolic pressure', 'mmHg'],
    ['diastolic_pressure', 'Diastolic pressure', 'mmHg'],
    ['heart_rate', 'Heart / pulse rate', 'bpm'],
    ['respiratory_rate', 'Respiratory rate', 'breaths/min'],
    ['temperature', 'Body temperature', '°C'],
    ['oxygen_saturation', 'Oxygen saturation (SpO₂)', '%'],
    ['height', 'Height', 'cm'],
    ['weight', 'Weight', 'kg'],
] as const;
const value = (input: unknown) => (input == null ? '' : String(input));

export default function VitalSigns({
    appointment,
    latestVitalSign,
    history,
    pendingRecheck,
    requiredFields,
    savedDraft,
}: Props) {
    const isRepeat = Boolean(latestVitalSign);
    const draft =
        (savedDraft?.supersedes_id ?? null) === (latestVitalSign?.id ?? null)
            ? savedDraft
            : null;
    const form = useForm({
        submission_key: crypto.randomUUID(),
        measurement_type: pendingRecheck
            ? 'recheck'
            : isRepeat
              ? 'correction'
              : 'initial',
        supersedes_id: latestVitalSign?.id ?? null,
        systolic_pressure: value(draft?.systolic_pressure),
        diastolic_pressure: value(draft?.diastolic_pressure),
        heart_rate: value(draft?.heart_rate),
        respiratory_rate: value(draft?.respiratory_rate),
        temperature: value(draft?.temperature),
        oxygen_saturation: value(draft?.oxygen_saturation),
        height: value(draft?.height),
        weight: value(draft?.weight),
        visual_acuity: value(draft?.visual_acuity),
        hearing: value(draft?.hearing),
        notes: value(draft?.notes),
        not_assessed: (draft?.not_assessed ?? {}) as Record<string, string>,
    });
    const { clearDraft } = useSessionDraft(
        `vital-signs-${appointment.id}-${latestVitalSign?.id ?? 'initial'}`,
        form.data,
        form.isDirty,
        (data) =>
            form.setData((current) => ({
                ...current,
                ...data,
                submission_key: current.submission_key,
                measurement_type: current.measurement_type,
                supersedes_id: current.supersedes_id,
            })),
    );
    const height = Number(form.data.height);
    const weight = Number(form.data.weight);
    const bmi =
        height > 0 && weight > 0
            ? (weight / (height / 100) ** 2).toFixed(1)
            : null;
    const submit = (event: FormEvent) => {
        event.preventDefault();
        save('complete');
    };
    const save = (action: 'draft' | 'complete') => {
        form.transform((values) => ({ ...values, save_action: action }));
        form.post(`/receptionist/appointments/${appointment.id}/vital-signs`, {
            preserveScroll: true,
            onSuccess: action === 'complete' ? clearDraft : undefined,
        });
    };
    const assessmentException = (
        key: (typeof fields)[number][0] | 'visual_acuity' | 'hearing',
        label: string,
    ) => {
        const skipped = key in form.data.not_assessed;
        return (
            <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                    <input
                        type="checkbox"
                        checked={skipped}
                        onChange={(event) => {
                            const reasons = { ...form.data.not_assessed };
                            if (event.target.checked) reasons[key] = '';
                            else delete reasons[key];
                            form.setData((current) => ({
                                ...current,
                                [key]: event.target.checked ? '' : current[key],
                                not_assessed: reasons,
                            }));
                        }}
                    />
                    Not assessed
                    <span className="sr-only">: {label}</span>
                </label>
                {skipped && (
                    <Textarea
                        aria-label={`${label}: reason not assessed`}
                        placeholder="Explain why this measurement was not assessed"
                        value={form.data.not_assessed[key]}
                        maxLength={1000}
                        onChange={(event) =>
                            form.setData('not_assessed', {
                                ...form.data.not_assessed,
                                [key]: event.target.value,
                            })
                        }
                    />
                )}
            </div>
        );
    };
    const name =
        appointment.user.name ||
        [
            appointment.user.first_name,
            appointment.user.middle_name,
            appointment.user.last_name,
        ]
            .filter(Boolean)
            .join(' ');
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Receptionist Queue', href: '/receptionist/queue' },
        { title: 'Record Vital Signs', href: '' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Record Vital Signs" />
            <div className="mx-auto max-w-6xl space-y-5 p-4 md:p-8">
                <header className="rounded-3xl bg-moss-800 p-6 text-white">
                    <div className="flex items-center gap-3">
                        <HeartPulse className="size-8" />
                        <div>
                            <p className="text-sm text-moss-100">
                                Patient intake
                            </p>
                            <h1 className="text-2xl font-bold">
                                Record Vital Signs
                            </h1>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
                        <div>
                            <span className="text-moss-200">Patient</span>
                            <strong className="block">{name}</strong>
                        </div>
                        <div>
                            <span className="text-moss-200">Patient ID</span>
                            <strong className="block">
                                {appointment.user.patient_reference_code}
                            </strong>
                        </div>
                        <div>
                            <span className="text-moss-200">Encounter</span>
                            <strong className="block">
                                {appointment.reference_code} ·{' '}
                                {new Date().toLocaleDateString()}
                            </strong>
                        </div>
                    </div>
                </header>
                {pendingRecheck && (
                    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                        <strong>Doctor requested a recheck:</strong>{' '}
                        {pendingRecheck.reason}
                    </div>
                )}
                {isRepeat && (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-950">
                        This creates a new timestamped measurement. The existing
                        reading will remain in history.
                    </div>
                )}
                <form
                    onSubmit={submit}
                    className="rounded-3xl border bg-white p-5 shadow-sm md:p-7"
                >
                    <p className="mb-5 text-sm text-slate-600">
                        You can save a draft with missing measurements. Before
                        completing intake, record each required measurement or
                        select Not assessed and explain why.
                    </p>
                    {Object.values(form.errors).length > 0 && (
                        <p role="alert" className="mb-4 text-sm text-red-600">
                            {Object.values(form.errors).join(' ')}
                        </p>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {fields.map(([key, label, unit]) => (
                            <div key={key}>
                                <Label htmlFor={key}>
                                    {label}
                                    {requiredFields.includes(key) && (
                                        <span className="text-red-600"> *</span>
                                    )}
                                </Label>
                                <div className="relative mt-2">
                                    <Input
                                        id={key}
                                        value={form.data[key]}
                                        inputMode="decimal"
                                        disabled={key in form.data.not_assessed}
                                        onChange={(e) =>
                                            form.setData(key, e.target.value)
                                        }
                                        className="pr-20"
                                    />
                                    <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-slate-500">
                                        {unit}
                                    </span>
                                </div>
                                {assessmentException(key, label)}
                                {form.errors[key] && (
                                    <p className="mt-1 text-xs font-semibold text-red-600">
                                        {form.errors[key]}
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                    <fieldset className="mt-6">
                        <legend className="text-sm font-semibold text-slate-900">
                            Vision and hearing screening
                        </legend>
                        <p className="mt-1 text-sm text-slate-500">
                            Record the screening results for the doctor to
                            review.
                        </p>
                        <div className="mt-3 grid gap-5 sm:grid-cols-2">
                            {(
                                [
                                    [
                                        'visual_acuity',
                                        'Visual acuity',
                                        'e.g. 20/20 OU',
                                    ],
                                    [
                                        'hearing',
                                        'Hearing',
                                        'e.g. Normal bilateral',
                                    ],
                                ] as const
                            ).map(([key, label, placeholder]) => (
                                <div key={key}>
                                    <Label htmlFor={key}>
                                        {label}{' '}
                                        <span className="text-red-600">*</span>
                                    </Label>
                                    <Input
                                        id={key}
                                        value={form.data[key]}
                                        onChange={(event) =>
                                            form.setData(
                                                key,
                                                event.target.value,
                                            )
                                        }
                                        placeholder={placeholder}
                                        required={
                                            !(key in form.data.not_assessed)
                                        }
                                        disabled={key in form.data.not_assessed}
                                        maxLength={100}
                                        className="mt-2"
                                        aria-invalid={Boolean(form.errors[key])}
                                        aria-describedby={
                                            form.errors[key]
                                                ? `${key}-error`
                                                : undefined
                                        }
                                    />
                                    {assessmentException(key, label)}
                                    {form.errors[key] && (
                                        <p
                                            id={`${key}-error`}
                                            className="mt-1 text-xs font-semibold text-red-600"
                                        >
                                            {form.errors[key]}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </fieldset>
                    <div className="mt-5">
                        <BmiSummary bmi={bmi} />
                    </div>
                    <div className="mt-5">
                        <Label htmlFor="notes">
                            Additional observations (optional)
                        </Label>
                        <Textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(e) =>
                                form.setData('notes', e.target.value)
                            }
                            className="mt-2"
                        />
                        <p className="mt-1 text-xs text-slate-500">
                            Record observations only; diagnoses remain the
                            physician’s responsibility.
                        </p>
                        {form.errors.notes && (
                            <p className="text-xs text-red-600">
                                {form.errors.notes}
                            </p>
                        )}
                    </div>
                    <div className="mt-6 flex flex-wrap justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit('/receptionist/queue')}
                        >
                            <ArrowLeft className="size-4" />
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            disabled={form.processing}
                            onClick={() => save('draft')}
                        >
                            <Save className="size-4" />
                            Save draft
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            <Save className="size-4" />
                            {form.processing
                                ? 'Saving…'
                                : isRepeat
                                  ? 'Save New Measurement'
                                  : 'Save Vital Signs'}
                        </Button>
                    </div>
                </form>
                <section className="rounded-3xl border bg-white p-5">
                    <h2 className="flex items-center gap-2 text-lg font-bold">
                        <History className="size-5" />
                        Measurements this encounter
                    </h2>
                    {history.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">
                            No vital signs have been recorded for this
                            consultation.
                        </p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {history.map((v) => (
                                <article
                                    key={v.id}
                                    className="rounded-2xl bg-slate-50 p-4 text-sm"
                                >
                                    <div className="flex justify-between">
                                        <strong>
                                            {v.measurement_type.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </strong>
                                        <span>
                                            {new Date(
                                                v.measured_at,
                                            ).toLocaleString()}
                                        </span>
                                    </div>
                                    <p className="mt-2 text-slate-700">
                                        BP {value(v.systolic_pressure)}/
                                        {value(v.diastolic_pressure)} mmHg ·
                                        Pulse {value(v.heart_rate)} bpm · RR{' '}
                                        {value(v.respiratory_rate)} · Temp{' '}
                                        {value(v.temperature)}°C · SpO₂{' '}
                                        {value(v.oxygen_saturation)}% ·{' '}
                                        {value(v.height)} cm · {value(v.weight)}{' '}
                                        kg · BMI {value(v.bmi)}
                                        {getBmiClassification(v.bmi) &&
                                            ` (${getBmiClassification(v.bmi)})`}
                                    </p>
                                    <p className="mt-1 text-slate-700">
                                        Visual acuity:{' '}
                                        {v.visual_acuity ?? 'Not recorded'} ·
                                        Hearing: {v.hearing ?? 'Not recorded'}
                                    </p>
                                    {Object.entries(v.not_assessed ?? {}).map(
                                        ([field, reason]) => (
                                            <p
                                                key={field}
                                                className="mt-2 text-amber-800"
                                            >
                                                {field.replaceAll('_', ' ')} —
                                                Not assessed: {reason}
                                            </p>
                                        ),
                                    )}
                                    <p className="mt-1 text-xs text-slate-500">
                                        Recorded by{' '}
                                        {v.recorded_by?.name ??
                                            'Staff unavailable'}
                                        {v.notes ? ` · ${v.notes}` : ''}
                                    </p>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AppLayout>
    );
}
