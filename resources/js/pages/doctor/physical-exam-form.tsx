import { router, useForm } from '@inertiajs/react';
import {
    Activity,
    ArrowLeft,
    ClipboardList,
    HeartPulse,
    History,
    Ruler,
    Save,
    Stethoscope,
    Thermometer,
    UserRound,
    Weight,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import {
    ClinicalSection,
    MedicalMetricCard,
    PatientSummaryCard,
    SegmentedChoice,
    StickyActionFooter,
    WorkflowTimeline,
} from '@/components/clinical-workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctor Queue', href: '/doctor/appointments' },
    { title: 'Physical Examination', href: '' },
];

interface Props {
    appointment: {
        id: number;
        user: { first_name: string; last_name: string };
        patient_profile?: {
            sex?: string;
            birthdate?: string;
            civil_status?: string;
        };
        medical_history?: Record<string, string | null>;
    };
    physicalExam: any;
    medicalExamination: { id: number; status: string };
    childSummaries: Array<{
        key: string;
        label: string;
        status: 'completed' | 'draft' | 'pending' | 'awaiting_result';
        summary: string;
    }>;
    submitUrl: string;
    vitalLimits: Record<string, { min: number; max: number }>;
}

type VitalField =
    | 'height'
    | 'weight'
    | 'pulse_rate'
    | 'temperature'
    | 'systolic_pressure'
    | 'diastolic_pressure';

const decimalPattern = /^\d+(?:\.\d)?$/;
const integerPattern = /^\d+$/;

const bodyParts = [
    { label: 'Head and scalp', field: 'head_scalp' },
    { label: 'Eyes', field: 'eyes' },
    { label: 'Ears', field: 'ears' },
    { label: 'Nose and sinuses', field: 'nose_sinuses' },
    { label: 'Mouth and throat', field: 'mouth_throat' },
    { label: 'Neck and thyroid', field: 'neck_thyroid' },
    { label: 'Chest and breasts', field: 'chest_breast' },
    { label: 'Lungs', field: 'lungs' },
    { label: 'Heart', field: 'heart' },
    { label: 'Abdomen', field: 'abdomen' },
    { label: 'Back and spine', field: 'back' },
    { label: 'Anus and rectum', field: 'anus' },
    { label: 'Genitourinary', field: 'genitals' },
    { label: 'Extremities', field: 'extremities' },
    { label: 'Skin', field: 'skin' },
    { label: 'Dental', field: 'dental' },
];

const historyFields = [
    ['Present illness', 'present_illness'],
    ['Past medical history', 'past_medical_history'],
    ['Operations or accidents', 'operations_accidents'],
    ['Family history', 'family_history'],
    ['Allergies', 'allergies'],
] as const;

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
    medicalExamination,
    childSummaries,
    submitUrl,
    vitalLimits,
}: Props) {
    const [initialSystolic = '', initialDiastolic = ''] = String(
        physicalExam?.blood_pressure || '',
    ).split('/');
    const { data, setData, post, processing, errors } = useForm<any>({
        height: physicalExam?.height || '',
        weight: physicalExam?.weight || '',
        systolic_pressure: initialSystolic,
        diastolic_pressure: initialDiastolic,
        pulse_rate: physicalExam?.pulse_rate || '',
        respiration_rate: physicalExam?.respiration_rate || '',
        temperature: physicalExam?.temperature || '',
        visual_acuity: physicalExam?.visual_acuity || '',
        hearing: physicalExam?.hearing || '',
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
    const [vitalErrors, setVitalErrors] = useState<
        Partial<Record<VitalField, string>>
    >({});

    const validateVital = (field: VitalField, value: unknown): string => {
        const text = String(value ?? '').trim();
        const label = field.replace('_rate', '').replace('_pressure', '');

        if (!text) {
            return field.includes('pressure')
                ? 'Please enter both systolic and diastolic blood pressure.'
                : `${label.charAt(0).toUpperCase() + label.slice(1)} is required.`;
        }

        const decimal = ['height', 'weight', 'temperature'].includes(field);
        if (!(decimal ? decimalPattern : integerPattern).test(text)) {
            return decimal
                ? 'Enter a number with no more than one decimal place.'
                : 'Enter a whole number only.';
        }

        const valueNumber = Number(text);
        const { min, max } = vitalLimits[field];
        if (valueNumber < min || valueNumber > max) {
            const units: Record<VitalField, string> = {
                height: 'cm',
                weight: 'kg',
                pulse_rate: 'bpm',
                temperature: '°C',
                systolic_pressure: 'mm Hg',
                diastolic_pressure: 'mm Hg',
            };
            return `Value must be between ${min} and ${max} ${units[field]}.`;
        }

        if (
            field === 'systolic_pressure' &&
            integerPattern.test(String(data.diastolic_pressure).trim()) &&
            valueNumber <= Number(data.diastolic_pressure)
        ) {
            return 'Systolic pressure must be greater than diastolic pressure.';
        }
        if (
            field === 'diastolic_pressure' &&
            integerPattern.test(String(data.systolic_pressure).trim()) &&
            Number(data.systolic_pressure) <= valueNumber
        ) {
            return 'Systolic pressure must be greater than diastolic pressure.';
        }

        return '';
    };

    const updateVital = (field: VitalField, value: string) => {
        setData(field, value);
        if (vitalErrors[field]) {
            const message = validateVital(field, value);
            setVitalErrors((current) => ({ ...current, [field]: message }));
        }
    };

    const blurVital = (field: VitalField) => {
        const message = validateVital(field, data[field]);
        setVitalErrors((current) => ({ ...current, [field]: message }));
    };
    const height = Number.parseFloat(data.height);
    const weight = Number.parseFloat(data.weight);
    const bmi =
        height > 0 && weight > 0
            ? Number((weight / (height / 100) ** 2).toFixed(1))
            : null;

    const bmiCategory =
        bmi === null
            ? null
            : bmi < 18.5
              ? 'Underweight'
              : bmi < 25
                ? 'Normal'
                : bmi < 30
                  ? 'Overweight'
                  : 'Obese';

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        const fields: VitalField[] = [
            'height',
            'weight',
            'pulse_rate',
            'temperature',
            'systolic_pressure',
            'diastolic_pressure',
        ];
        const nextErrors = Object.fromEntries(
            fields.map((field) => [field, validateVital(field, data[field])]),
        ) as Record<VitalField, string>;
        setVitalErrors(nextErrors);
        if (Object.values(nextErrors).some(Boolean)) {
            document
                .getElementById('physical-exam-errors')
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        post(submitUrl, {
            preserveScroll: true,
            onError: () =>
                document
                    .getElementById('physical-exam-errors')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        });
    };

    const patientName = `${appointment.user.first_name} ${appointment.user.last_name}`;

    return (
        <form
            onSubmit={onSubmit}
            className="mx-auto max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8"
        >
            <PatientSummaryCard
                name={patientName}
                subtitle="Occupational health physical examination"
                stage="Physical Examination"
                details={[
                    {
                        label: 'Age',
                        value: getAge(appointment.patient_profile?.birthdate),
                        icon: UserRound,
                    },
                    {
                        label: 'Sex',
                        value: appointment.patient_profile?.sex,
                    },
                    {
                        label: 'Civil status',
                        value: appointment.patient_profile?.civil_status,
                    },
                    {
                        label: 'Queue',
                        value: `#${appointment.id}`,
                    },
                ]}
            />

            {(Object.keys(errors).length > 0 ||
                Object.values(vitalErrors).some(Boolean)) && (
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

            <WorkflowTimeline
                current={3}
                steps={[
                    'Appointment',
                    'Registration',
                    'Vital Signs',
                    'Physical Exam',
                    'Laboratory',
                    'X-Ray',
                    'Final Evaluation',
                ]}
            />

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
                <div className="space-y-5">
                    <ClinicalSection
                        icon={History}
                        title="I. Medical history"
                        description="Record the history fields in the same order as the official LMIC PE form."
                    >
                        <div className="grid gap-4 md:grid-cols-2">
                            {historyFields.map(([label, field]) => (
                                <div key={field}>
                                    <Label htmlFor={field}>{label}</Label>
                                    <Textarea
                                        id={field}
                                        className="mt-1.5 min-h-24"
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
                                    className="mt-1.5 min-h-24"
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
                                    className="mt-1.5 min-h-24"
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
                        title="II. Physical examination — vital signs"
                        description="Record the patient's current measurements. BMI is calculated automatically."
                    >
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <MedicalMetricCard
                                icon={Ruler}
                                label="Height"
                                unit="cm"
                            >
                                <Input
                                    value={data.height}
                                    inputMode="decimal"
                                    onChange={(event) =>
                                        updateVital(
                                            'height',
                                            event.target.value,
                                        )
                                    }
                                    onBlur={() => blurVital('height')}
                                    maxLength={5}
                                    placeholder="e.g. 170"
                                />
                                <FieldError
                                    message={
                                        vitalErrors.height || errors.height
                                    }
                                />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={Weight}
                                label="Weight"
                                unit="kg"
                            >
                                <Input
                                    value={data.weight}
                                    inputMode="decimal"
                                    onChange={(event) =>
                                        updateVital(
                                            'weight',
                                            event.target.value,
                                        )
                                    }
                                    onBlur={() => blurVital('weight')}
                                    maxLength={5}
                                    placeholder="e.g. 65"
                                />
                                <FieldError
                                    message={
                                        vitalErrors.weight || errors.weight
                                    }
                                />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={HeartPulse}
                                label="Blood pressure"
                                unit="mm Hg"
                            >
                                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                                    <Input
                                        aria-label="Systolic pressure"
                                        value={data.systolic_pressure}
                                        inputMode="numeric"
                                        onChange={(event) =>
                                            updateVital(
                                                'systolic_pressure',
                                                event.target.value,
                                            )
                                        }
                                        onBlur={() =>
                                            blurVital('systolic_pressure')
                                        }
                                        maxLength={3}
                                        placeholder="120"
                                    />
                                    <span
                                        aria-hidden="true"
                                        className="font-semibold text-slate-500"
                                    >
                                        /
                                    </span>
                                    <Input
                                        aria-label="Diastolic pressure"
                                        value={data.diastolic_pressure}
                                        inputMode="numeric"
                                        onChange={(event) =>
                                            updateVital(
                                                'diastolic_pressure',
                                                event.target.value,
                                            )
                                        }
                                        onBlur={() =>
                                            blurVital('diastolic_pressure')
                                        }
                                        maxLength={3}
                                        placeholder="80"
                                    />
                                </div>
                                <p className="text-xs text-slate-500">
                                    Systolic / Diastolic
                                </p>
                                <FieldError
                                    message={
                                        vitalErrors.systolic_pressure ||
                                        vitalErrors.diastolic_pressure ||
                                        errors.systolic_pressure ||
                                        errors.diastolic_pressure
                                    }
                                />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={Activity}
                                label="Pulse rate"
                                unit="bpm"
                            >
                                <Input
                                    value={data.pulse_rate}
                                    inputMode="numeric"
                                    onChange={(event) =>
                                        updateVital(
                                            'pulse_rate',
                                            event.target.value,
                                        )
                                    }
                                    onBlur={() => blurVital('pulse_rate')}
                                    maxLength={3}
                                    placeholder="e.g. 72"
                                />
                                <FieldError
                                    message={
                                        vitalErrors.pulse_rate ||
                                        errors.pulse_rate
                                    }
                                />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={Thermometer}
                                label="Temperature"
                                unit="°C"
                            >
                                <Input
                                    value={data.temperature}
                                    inputMode="decimal"
                                    onChange={(event) =>
                                        updateVital(
                                            'temperature',
                                            event.target.value,
                                        )
                                    }
                                    onBlur={() => blurVital('temperature')}
                                    maxLength={4}
                                    placeholder="e.g. 36.5"
                                />
                                <FieldError
                                    message={
                                        vitalErrors.temperature ||
                                        errors.temperature
                                    }
                                />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={Activity}
                                label="Respiration rate"
                                unit="breaths/min"
                            >
                                <Input
                                    value={data.respiration_rate}
                                    inputMode="numeric"
                                    onChange={(event) =>
                                        setData(
                                            'respiration_rate',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g. 16"
                                />
                                <FieldError message={errors.respiration_rate} />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={UserRound}
                                label="Visual acuity"
                            >
                                <Input
                                    value={data.visual_acuity}
                                    onChange={(event) =>
                                        setData(
                                            'visual_acuity',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g. 20/20 OU"
                                />
                                <FieldError message={errors.visual_acuity} />
                            </MedicalMetricCard>
                            <MedicalMetricCard icon={UserRound} label="Hearing">
                                <Input
                                    value={data.hearing}
                                    onChange={(event) =>
                                        setData('hearing', event.target.value)
                                    }
                                    placeholder="e.g. Normal bilateral"
                                />
                                <FieldError message={errors.hearing} />
                            </MedicalMetricCard>
                            <div className="flex flex-col justify-center rounded-2xl border border-moss-200 bg-moss-50 p-4">
                                <p className="text-xs font-semibold text-moss-700">
                                    Body mass index
                                </p>
                                <div className="mt-2 flex items-end gap-2">
                                    <strong className="text-3xl text-moss-900">
                                        {bmi ?? '—'}
                                    </strong>
                                    {bmiCategory && (
                                        <span className="mb-1 rounded-full bg-white px-2 py-1 text-xs font-semibold text-moss-700">
                                            {bmiCategory}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </ClinicalSection>

                    <ClinicalSection
                        icon={Stethoscope}
                        title="II. Physical examination — findings"
                        description="Mark each system as normal or document the relevant finding."
                    >
                        <div className="grid gap-3 lg:grid-cols-2">
                            {bodyParts.map((part) => (
                                <article
                                    key={part.field}
                                    className="rounded-2xl border border-border p-4"
                                >
                                    <h3 className="mb-3 text-sm font-semibold text-slate-900">
                                        {part.label}
                                    </h3>
                                    <SegmentedChoice
                                        ariaLabel={`${part.label} assessment`}
                                        value={data[`${part.field}_status`]}
                                        onChange={(status) =>
                                            setData(
                                                `${part.field}_status`,
                                                status,
                                            )
                                        }
                                        options={[
                                            {
                                                value: 'normal',
                                                label: 'Normal',
                                            },
                                            {
                                                value: 'with_findings',
                                                label: 'With findings',
                                                tone: 'warning',
                                            },
                                        ]}
                                    />
                                    <Input
                                        className="mt-3"
                                        value={data[part.field]}
                                        disabled={
                                            data[`${part.field}_status`] ===
                                            'normal'
                                        }
                                        onChange={(event) =>
                                            setData(
                                                part.field,
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Document findings, if any"
                                    />
                                    <FieldError message={errors[part.field]} />
                                </article>
                            ))}
                        </div>
                    </ClinicalSection>
                </div>

                <aside className="space-y-5">
                    <ClinicalSection
                        icon={ClipboardList}
                        title={`III–VI. Diagnostic results · PE #${medicalExamination.id}`}
                        description="Child results are summarized dynamically from their source records."
                    >
                        <div className="space-y-2">
                            {childSummaries.map((child) => (
                                <details
                                    key={child.key}
                                    className="rounded-xl border border-slate-200 bg-white"
                                >
                                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-3">
                                        <span className="text-sm font-bold text-slate-800">
                                            {child.label}
                                        </span>
                                        <span
                                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${child.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : child.status === 'draft' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}
                                        >
                                            {child.status}
                                        </span>
                                    </summary>
                                    <p className="border-t border-slate-100 p-3 text-sm text-slate-600">
                                        {child.summary}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </ClinicalSection>

                    <ClinicalSection
                        icon={ClipboardList}
                        title="Examining physician notes"
                        description="Overall notes and recommendations for the next stage."
                    >
                        <Label htmlFor="remarks">Assessment and remarks</Label>
                        <Textarea
                            id="remarks"
                            className="mt-1.5 min-h-40"
                            value={data.remarks}
                            onChange={(event) =>
                                setData('remarks', event.target.value)
                            }
                            placeholder="Enter assessment, recommendations, and follow-up notes"
                        />
                    </ClinicalSection>
                </aside>
            </div>

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
