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
import { useEffect, useState } from 'react';
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
    };
    physicalExam: any;
}

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
    { label: 'Extremities', field: 'extremities' },
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

export default function PhysicalExamForm({ appointment, physicalExam }: Props) {
    const { data, setData, post, processing } = useForm<any>({
        height: physicalExam?.height || '',
        weight: physicalExam?.weight || '',
        blood_pressure: physicalExam?.blood_pressure || '',
        pulse_rate: physicalExam?.pulse_rate || '',
        temperature: physicalExam?.temperature || '',
        remarks: physicalExam?.remarks || '',
        present_illness: physicalExam?.present_illness || '',
        past_medical_history: physicalExam?.past_medical_history || '',
        operations_accidents: physicalExam?.operations_accidents || '',
        family_history: physicalExam?.family_history || '',
        allergies: physicalExam?.allergies || '',
        personal_social_history: physicalExam?.personal_social_history || '',
        ob_menstrual_history: physicalExam?.ob_menstrual_history || '',
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
    const [bmi, setBmi] = useState<number | null>(null);

    useEffect(() => {
        const height = Number.parseFloat(data.height);
        const weight = Number.parseFloat(data.weight);
        setBmi(
            height > 0 && weight > 0
                ? Number((weight / (height / 100) ** 2).toFixed(1))
                : null,
        );
    }, [data.height, data.weight]);

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
        post(`/doctor/physical-exam-form/${appointment.id}`);
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
                        icon={Activity}
                        title="Vital signs and measurements"
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
                                        setData('height', event.target.value)
                                    }
                                    placeholder="e.g. 170"
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
                                        setData('weight', event.target.value)
                                    }
                                    placeholder="e.g. 65"
                                />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={HeartPulse}
                                label="Blood pressure"
                                unit="mmHg"
                            >
                                <Input
                                    value={data.blood_pressure}
                                    onChange={(event) =>
                                        setData(
                                            'blood_pressure',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="120/80"
                                />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={Activity}
                                label="Pulse rate"
                                unit="bpm"
                            >
                                <Input
                                    value={data.pulse_rate}
                                    onChange={(event) =>
                                        setData(
                                            'pulse_rate',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g. 72"
                                />
                            </MedicalMetricCard>
                            <MedicalMetricCard
                                icon={Thermometer}
                                label="Temperature"
                                unit="°C"
                            >
                                <Input
                                    value={data.temperature}
                                    onChange={(event) =>
                                        setData(
                                            'temperature',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="e.g. 36.5"
                                />
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
                        title="Physical examination"
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
                                        onChange={(event) =>
                                            setData(
                                                part.field,
                                                event.target.value,
                                            )
                                        }
                                        placeholder="Document findings, if any"
                                    />
                                </article>
                            ))}
                        </div>
                    </ClinicalSection>
                </div>

                <aside className="space-y-5">
                    <ClinicalSection
                        icon={History}
                        title="Medical history"
                        description="Relevant history for this evaluation."
                    >
                        <div className="space-y-4">
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
                                    className="mt-1.5"
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
                                    className="mt-1.5"
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
                        icon={ClipboardList}
                        title="Clinical assessment"
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
