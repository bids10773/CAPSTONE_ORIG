import { router, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ChevronDown,
    History,
    Save,
    UserRound,
} from 'lucide-react';
import type React from 'react';
import {
    ClinicalSection,
    StickyActionFooter,
} from '@/components/clinical-workflow';
import { IntakeMeasurements } from '@/components/intake-measurements';
import { PhysicalFindingRow } from '@/components/physical-finding-row';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSessionDraft } from '@/hooks/use-session-draft';
import AppLayout from '@/layouts/app-layout';
import { bodyParts, historyFields } from '@/lib/clinical-exam-fields';
import { promptAction } from '@/lib/dialogs';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctor Queue', href: '/doctor/appointments' },
    { title: 'Physical Examination', href: '' },
];

interface Props {
    appointment: {
        id: number;
        reference_code: string;
        user: { first_name: string; last_name: string };
        patient_profile?: {
            sex?: string;
            birthdate?: string;
            civil_status?: string;
            employee_number?: string | null;
        };
        medical_history?: Record<string, string | null>;
    };
    physicalExam: any;
    latestVitalSign: any | null;
    vitalSignHistory: any[];
    pendingVitalRecheck: any | null;
    submitUrl: string;
    vitalLimits: Record<string, { min: number; max: number }>;
    locked: boolean;
}

function getAge(birthdate?: string) {
    if (!birthdate) return 'Not available';
    const today = new Date();
    const birth = new Date(birthdate);
    if (Number.isNaN(birth.getTime())) return 'Not available';
    let age = today.getFullYear() - birth.getFullYear();
    const beforeBirthday =
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() &&
            today.getDate() < birth.getDate());
    if (beforeBirthday) age -= 1;
    return age >= 0 ? `${age} years` : 'Not available';
}

export default function PhysicalExamForm({
    appointment,
    physicalExam,
    latestVitalSign,
    vitalSignHistory,
    pendingVitalRecheck,
    submitUrl,
    locked,
}: Props) {
    const { data, setData, post, isDirty, processing, errors } = useForm<any>({
        vital_signs_override_reason: '',
        remarks: physicalExam?.remarks || '',
        present_illness: appointment.medical_history?.present_illness || '',
        past_medical_history:
            appointment.medical_history?.past_medical_history || '',
        operations_accidents:
            appointment.medical_history?.operations_accidents || '',
        family_history: appointment.medical_history?.family_history || '',
        allergies: appointment.medical_history?.allergies || '',
        personal_social_history:
            appointment.medical_history?.personal_social_history || '',
        ob_menstrual_history:
            appointment.medical_history?.ob_menstrual_history || '',
        ...Object.fromEntries(
            bodyParts.flatMap(({ field }) => [
                [field, physicalExam?.[field] || ''],
                [
                    `${field}_status`,
                    physicalExam?.[field] ? 'with_findings' : 'normal',
                ],
            ]),
        ),
    });
    const { clearDraft } = useSessionDraft(
        `physical-exam-${appointment.id}`,
        data,
        isDirty,
        (draft) => setData((current: any) => ({ ...current, ...draft })),
        !locked,
    );
    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        post(submitUrl, {
            preserveScroll: true,
            onSuccess: clearDraft,
            onError: () =>
                document
                    .getElementById('physical-exam-errors')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        });
    };

    const patientName = `${appointment.user.first_name} ${appointment.user.last_name}`;
    const patientDetails = [
        { label: 'Age', value: getAge(appointment.patient_profile?.birthdate) },
        { label: 'Sex', value: appointment.patient_profile?.sex },
        {
            label: 'Civil status',
            value: appointment.patient_profile?.civil_status,
        },
        { label: 'Queue', value: appointment.reference_code },
        ...(appointment.patient_profile?.employee_number
            ? [
                  {
                      label: 'Company Employee No.',
                      value: appointment.patient_profile.employee_number,
                  },
              ]
            : []),
    ];

    return (
        <form
            onSubmit={onSubmit}
            className="mx-auto max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8"
        >
            <section
                aria-label="Patient Details"
                className="sticky top-[88px] z-20 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-[0_18px_48px_-24px_rgba(31,41,55,.32)] backdrop-blur-xl sm:px-5"
            >
                <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <UserRound
                            className="size-5 shrink-0 text-moss-600"
                            aria-hidden="true"
                        />
                        <div className="min-w-0">
                            <p className="text-xs font-medium text-muted-foreground">
                                Patient Details
                            </p>
                            <p className="text-base font-semibold break-words text-foreground">
                                {patientName}
                            </p>
                        </div>
                    </div>
                    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:flex sm:flex-wrap sm:gap-x-8">
                        {patientDetails.map(({ label, value }) => (
                            <div key={label} className="min-w-0">
                                <dt className="text-xs text-muted-foreground">
                                    {label}
                                </dt>
                                <dd className="mt-0.5 text-sm font-semibold break-words text-foreground">
                                    {value || 'Not available'}
                                </dd>
                            </div>
                        ))}
                    </dl>
                </div>
            </section>

            {Object.keys(errors).length > 0 && (
                <div
                    id="physical-exam-errors"
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-800"
                >
                    <p className="font-bold">Unable to save the examination</p>
                    <p className="mt-1 text-sm">
                        {errors.form ||
                            'Review the highlighted fields below and try again.'}
                    </p>
                </div>
            )}

            <div>
                <div className="grid items-start gap-5 lg:grid-cols-2">
                    <ClinicalSection
                        icon={History}
                        title="I. Medical history"
                        description="Review and document the patient’s history before the physical examination."
                    >
                        <div className="grid gap-4">
                            {historyFields.map(([label, field]) => (
                                <div key={field}>
                                    <Label htmlFor={field}>{label}</Label>
                                    <Textarea
                                        id={field}
                                        className="mt-2 min-h-28 text-base leading-7"
                                        value={data[field]}
                                        onChange={(event) =>
                                            setData(field, event.target.value)
                                        }
                                    />
                                </div>
                            ))}
                            <div>
                                <Label htmlFor="personal_social_history">
                                    Personal and social history
                                </Label>
                                <Textarea
                                    id="personal_social_history"
                                    className="mt-2 min-h-28 text-base leading-7"
                                    value={data.personal_social_history}
                                    onChange={(event) =>
                                        setData(
                                            'personal_social_history',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                            <div>
                                <Label htmlFor="ob_menstrual_history">
                                    OB / menstrual history
                                </Label>
                                <Textarea
                                    id="ob_menstrual_history"
                                    className="mt-2 min-h-28 text-base leading-7"
                                    value={data.ob_menstrual_history}
                                    onChange={(event) =>
                                        setData(
                                            'ob_menstrual_history',
                                            event.target.value,
                                        )
                                    }
                                />
                            </div>
                        </div>
                    </ClinicalSection>

                    <ClinicalSection
                        icon={Activity}
                        title="II. Physical examination"
                        description="Document your physical examination findings. Open the floating vital signs panel whenever you need the intake readings."
                    >
                        <h3 className="mb-4 text-lg font-semibold">Findings</h3>
                        <div className="divide-y divide-border">
                            {bodyParts.map((part) => (
                                <PhysicalFindingRow
                                    key={part.field}
                                    field={part.field}
                                    label={part.label}
                                    status={data[`${part.field}_status`]}
                                    finding={data[part.field]}
                                    onStatusChange={(status) =>
                                        setData(`${part.field}_status`, status)
                                    }
                                    onFindingChange={(finding) =>
                                        setData(part.field, finding)
                                    }
                                    error={
                                        errors[part.field] ||
                                        errors[`${part.field}_status`]
                                    }
                                />
                            ))}
                        </div>
                    </ClinicalSection>
                </div>
            </div>

            <aside
                aria-label="Recorded vital signs panel"
                className="fixed right-4 bottom-44 z-30 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2 sm:bottom-24"
            >
                <details
                    open={
                        !latestVitalSign ||
                        Boolean(errors.vital_signs_override_reason)
                    }
                    aria-labelledby="recorded-vital-signs-heading"
                    className="group max-w-full overflow-hidden rounded-2xl border border-moss-200 bg-card shadow-xl open:w-[calc(100vw-2rem)] open:max-w-md"
                >
                    <summary
                        id="recorded-vital-signs-heading"
                        className="flex cursor-pointer list-none items-center gap-3 bg-moss-50 px-4 py-3 text-sm font-semibold text-moss-900 marker:hidden focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none dark:bg-moss-950 dark:text-moss-100 [&::-webkit-details-marker]:hidden"
                    >
                        <Activity
                            className="size-4 shrink-0"
                            aria-hidden="true"
                        />
                        Recorded Vital Signs
                        <ChevronDown
                            className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180"
                            aria-hidden="true"
                        />
                    </summary>
                    <div className="max-h-[60dvh] overflow-y-auto overscroll-contain border-t border-border p-4">
                        <IntakeMeasurements
                            measurements={latestVitalSign}
                            compact
                        />
                        {latestVitalSign ? (
                            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
                                <strong>
                                    Recorded by{' '}
                                    {latestVitalSign.recorded_by?.name ??
                                        'Reception staff'}
                                </strong>
                                <span className="ml-2">
                                    {new Date(
                                        latestVitalSign.measured_at,
                                    ).toLocaleString()}
                                </span>
                                {latestVitalSign.notes && (
                                    <p className="mt-1">
                                        Observation: {latestVitalSign.notes}
                                    </p>
                                )}
                                {pendingVitalRecheck && (
                                    <p className="mt-2 font-semibold text-amber-700">
                                        Recheck pending:{' '}
                                        {pendingVitalRecheck.reason}
                                    </p>
                                )}
                                <div className="mt-3 flex flex-wrap gap-3">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={async () => {
                                            const reason = await promptAction(
                                                'Explain why these measurements should be rechecked.',
                                            );
                                            if (reason)
                                                router.post(
                                                    `/doctor/appointments/${appointment.id}/vital-signs/recheck`,
                                                    { reason },
                                                    {
                                                        preserveScroll: true,
                                                    },
                                                );
                                        }}
                                    >
                                        Request recheck
                                    </Button>
                                    <details>
                                        <summary className="cursor-pointer py-2 font-semibold text-moss-700">
                                            View repeated readings (
                                            {vitalSignHistory.length})
                                        </summary>
                                        <div className="mt-2 space-y-2">
                                            {vitalSignHistory.map((reading) => (
                                                <p
                                                    key={reading.id}
                                                    className="rounded-lg bg-white p-2 text-xs"
                                                >
                                                    {new Date(
                                                        reading.measured_at,
                                                    ).toLocaleString()}{' '}
                                                    · BP{' '}
                                                    {reading.systolic_pressure}/
                                                    {reading.diastolic_pressure}{' '}
                                                    · Pulse {reading.heart_rate}{' '}
                                                    · Temp {reading.temperature}
                                                    °C · SpO₂{' '}
                                                    {reading.oxygen_saturation}%
                                                    · Visual acuity:{' '}
                                                    {reading.visual_acuity ??
                                                        'Not recorded'}{' '}
                                                    · Hearing:{' '}
                                                    {reading.hearing ??
                                                        'Not recorded'}{' '}
                                                    · recorded by{' '}
                                                    {reading.recorded_by
                                                        ?.name ?? 'Staff'}
                                                </p>
                                            ))}
                                        </div>
                                    </details>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                                <p className="font-semibold text-amber-900">
                                    No vital signs have been recorded for this
                                    consultation.
                                </p>
                                <p className="mt-1 text-sm text-amber-800">
                                    Routine intake should be completed by
                                    reception. Urgent care may proceed only with
                                    a documented reason.
                                </p>
                                <Textarea
                                    className="mt-3 bg-white"
                                    value={data.vital_signs_override_reason}
                                    onChange={(event) =>
                                        setData(
                                            'vital_signs_override_reason',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Urgent override reason"
                                />
                                <FieldError
                                    message={errors.vital_signs_override_reason}
                                />
                            </div>
                        )}
                    </div>
                </details>
            </aside>

            <StickyActionFooter hint="Saving completes this examination stage using the existing clinical workflow.">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.visit('/doctor/appointments')}
                >
                    <ArrowLeft className="size-4" />
                    Back to queue
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save className="size-4" />
                    {processing ? 'Saving examination…' : 'Save examination'}
                </Button>
            </StickyActionFooter>
        </form>
    );
}

PhysicalExamForm.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);

function FieldError({ message }: { message?: string }) {
    if (!message) return null;

    return (
        <p className="mt-1.5 text-xs font-semibold text-red-600">{message}</p>
    );
}
