import { router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Beaker,
    CheckCircle2,
    ClipboardCheck,
    FlaskConical,
    Microscope,
    Save,
    ShieldCheck,
    TestTube2,
    UserRound,
} from 'lucide-react';
import type React from 'react';
import {
    ClinicalSection,
    PatientSummaryCard,
    SegmentedChoice,
    StickyActionFooter,
    WorkflowTimeline,
} from '@/components/clinical-workflow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'MedTech Queue', href: '/medtech/appointments' },
    { title: 'Laboratory Examination', href: '' },
];

interface PatientProfile {
    sex?: string;
    birthdate?: string;
    civil_status?: string;
}

interface Appointment {
    id: number;
    user: { first_name: string; last_name: string };
    patient_profile?: PatientProfile;
}

interface Props {
    appointment: Appointment;
    labResult: any;
}

const labParts = [
    {
        label: 'Complete Blood Count',
        shortLabel: 'CBC',
        field: 'cbc',
        icon: TestTube2,
    },
    {
        label: 'Urinalysis',
        shortLabel: 'Urinalysis',
        field: 'urinalysis',
        icon: Beaker,
    },
    {
        label: 'Fecalysis',
        shortLabel: 'Fecalysis',
        field: 'fecalysis',
        icon: Microscope,
    },
];

function getAge(birthdate?: string) {
    if (!birthdate) return 'Not available';
    const birth = new Date(birthdate);
    if (Number.isNaN(birth.getTime())) return 'Not available';
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    if (
        today.getMonth() < birth.getMonth() ||
        (today.getMonth() === birth.getMonth() &&
            today.getDate() < birth.getDate())
    )
        age -= 1;
    return age >= 0 ? `${age} years` : 'Not available';
}

export default function LabResultsForm({ appointment, labResult }: Props) {
    const { data, setData, post, processing } = useForm<any>({
        cbc_status: labResult?.cbc_status || 'normal',
        cbc_findings: labResult?.cbc_findings || '',
        urinalysis_status: labResult?.urinalysis_status || 'normal',
        urinalysis_findings: labResult?.urinalysis_findings || '',
        fecalysis_status: labResult?.fecalysis_status || 'normal',
        fecalysis_findings: labResult?.fecalysis_findings || '',
        hepa_b_status: labResult?.hepa_b_status || 'non-reactive',
        hepa_a_status: labResult?.hepa_a_status || 'non-reactive',
        pregnancy_test_status: labResult?.pregnancy_test_status || 'negative',
        meth_status: labResult?.meth_status || 'negative',
        marijuana_status: labResult?.marijuana_status || 'negative',
        remarks: labResult?.remarks || '',
    });

    const onSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        post(`/medtech/lab-results/${appointment.id}`);
    };
    const patientName = `${appointment.user.first_name} ${appointment.user.last_name}`;

    return (
        <form
            onSubmit={onSubmit}
            className="mx-auto max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8"
        >
            <PatientSummaryCard
                name={patientName}
                subtitle="Laboratory diagnostic workflow"
                stage="Laboratory Examination"
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
                    { label: 'Queue', value: `#${appointment.id}` },
                ]}
            />

            <WorkflowTimeline
                current={3}
                steps={[
                    'Patient',
                    'Requested Tests',
                    'Specimen Collection',
                    'Result Entry',
                    'Review',
                    'Complete',
                ]}
            />

            <ClinicalSection
                icon={FlaskConical}
                title="Requested laboratory examinations"
                description="Complete each requested examination and document notable findings."
            >
                <div className="grid gap-3 md:grid-cols-3">
                    {labParts.map(
                        ({ label, shortLabel, icon: Icon, field }) => {
                            const abnormal =
                                data[`${field}_status`] === 'findings';
                            return (
                                <article
                                    key={field}
                                    className="rounded-2xl border border-border bg-slate-50/50 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="flex size-10 items-center justify-center rounded-xl bg-white text-moss-700 shadow-sm">
                                            <Icon className="size-5" />
                                        </span>
                                        <span
                                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                                abnormal
                                                    ? 'border-amber-200 bg-amber-50 text-amber-800'
                                                    : 'border-green-200 bg-green-50 text-green-800'
                                            }`}
                                        >
                                            {abnormal
                                                ? 'Findings recorded'
                                                : 'Normal'}
                                        </span>
                                    </div>
                                    <h3 className="mt-4 text-sm font-semibold text-slate-900">
                                        {label}
                                    </h3>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {shortLabel} · Routine priority
                                    </p>
                                </article>
                            );
                        },
                    )}
                </div>
            </ClinicalSection>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
                <ClinicalSection
                    icon={Microscope}
                    title="Laboratory result entry"
                    description="Normal results are clearly distinguished from results requiring clinical attention."
                >
                    <div className="space-y-4">
                        {labParts.map(({ label, field, icon: Icon }) => (
                            <article
                                key={field}
                                className="rounded-2xl border border-border p-4 sm:p-5"
                            >
                                <div className="flex items-center gap-2">
                                    <Icon className="size-4 text-moss-600" />
                                    <h3 className="text-sm font-semibold text-slate-900">
                                        {label}
                                    </h3>
                                </div>
                                <div className="mt-4 grid gap-4 lg:grid-cols-[280px_1fr]">
                                    <SegmentedChoice
                                        ariaLabel={`${label} result`}
                                        value={data[`${field}_status`]}
                                        onChange={(status) => {
                                            setData(`${field}_status`, status);
                                            if (status === 'normal')
                                                setData(
                                                    `${field}_findings`,
                                                    '',
                                                );
                                        }}
                                        options={[
                                            {
                                                value: 'normal',
                                                label: 'Normal',
                                            },
                                            {
                                                value: 'findings',
                                                label: 'With findings',
                                                tone: 'warning',
                                            },
                                        ]}
                                    />
                                    <div>
                                        <Label
                                            htmlFor={`${field}-findings`}
                                            className="sr-only"
                                        >
                                            {label} findings
                                        </Label>
                                        <Input
                                            id={`${field}-findings`}
                                            value={data[`${field}_findings`]}
                                            disabled={
                                                data[`${field}_status`] ===
                                                'normal'
                                            }
                                            onChange={(event) =>
                                                setData(
                                                    `${field}_findings`,
                                                    event.target.value,
                                                )
                                            }
                                            placeholder={
                                                data[`${field}_status`] ===
                                                'normal'
                                                    ? 'No abnormal findings'
                                                    : 'Document abnormal or critical findings'
                                            }
                                        />
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </ClinicalSection>

                <aside className="space-y-5">
                    <ClinicalSection
                        icon={ClipboardCheck}
                        title="Specimen progress"
                        description="Visual guide for the current laboratory stage."
                    >
                        <ol className="space-y-1">
                            {[
                                'Requested',
                                'Collected',
                                'Received',
                                'Processing',
                            ].map((step, index) => (
                                <li
                                    key={step}
                                    className="flex items-center gap-3 rounded-xl px-2 py-2.5"
                                >
                                    <span
                                        className={`flex size-8 items-center justify-center rounded-full ${
                                            index < 3
                                                ? 'bg-moss-100 text-moss-700'
                                                : 'bg-amber-100 text-amber-700'
                                        }`}
                                    >
                                        {index < 3 ? (
                                            <CheckCircle2 className="size-4" />
                                        ) : (
                                            <Microscope className="size-4" />
                                        )}
                                    </span>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">
                                            {step}
                                        </p>
                                        <p className="text-[11px] text-slate-400">
                                            {index < 3
                                                ? 'Stage acknowledged'
                                                : 'Current result entry stage'}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </ClinicalSection>

                    <ClinicalSection
                        icon={Beaker}
                        title="Rapid and serology tests"
                    >
                        <div className="space-y-4">
                            {[
                                ['Hepatitis B', 'hepa_b_status'],
                                ['Hepatitis A', 'hepa_a_status'],
                            ].map(([label, field]) => (
                                <div key={field}>
                                    <Label>{label}</Label>
                                    <Select
                                        value={data[field] ?? ''}
                                        onValueChange={(value) =>
                                            setData(field, value)
                                        }
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="non-reactive">
                                                Non-reactive
                                            </SelectItem>
                                            <SelectItem value="reactive">
                                                Reactive
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                            {appointment.patient_profile?.sex?.toLowerCase() ===
                                'female' && (
                                <div>
                                    <Label>Pregnancy test</Label>
                                    <Select
                                        value={data.pregnancy_test_status ?? ''}
                                        onValueChange={(value) =>
                                            setData(
                                                'pregnancy_test_status',
                                                value,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="mt-1.5">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="negative">
                                                Negative
                                            </SelectItem>
                                            <SelectItem value="positive">
                                                Positive
                                            </SelectItem>
                                            <SelectItem value="na">
                                                Not applicable
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </div>
                    </ClinicalSection>

                    <ClinicalSection icon={ShieldCheck} title="Drug screening">
                        <div className="space-y-4">
                            {[
                                ['Methamphetamine', 'meth_status'],
                                ['Marijuana', 'marijuana_status'],
                            ].map(([label, field]) => (
                                <div key={field}>
                                    <Label className="mb-2 block">
                                        {label}
                                    </Label>
                                    <SegmentedChoice
                                        ariaLabel={`${label} result`}
                                        value={data[field]}
                                        onChange={(value) =>
                                            setData(field, value)
                                        }
                                        options={[
                                            {
                                                value: 'negative',
                                                label: 'Negative',
                                            },
                                            {
                                                value: 'positive',
                                                label: 'Positive',
                                                tone: 'warning',
                                            },
                                        ]}
                                    />
                                </div>
                            ))}
                        </div>
                    </ClinicalSection>
                </aside>
            </div>

            <ClinicalSection
                icon={ClipboardCheck}
                title="Laboratory notes"
                description="Document specimen quality, critical values, or communication notes."
            >
                <Textarea
                    value={data.remarks}
                    onChange={(event) => setData('remarks', event.target.value)}
                    placeholder="Enter laboratory notes and relevant observations"
                />
            </ClinicalSection>

            <StickyActionFooter hint="Submitting forwards the completed laboratory stage through the existing workflow.">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.visit('/medtech/appointments')}
                >
                    <ArrowLeft className="size-4" />
                    Back to queue
                </Button>
                <Button type="submit" disabled={processing}>
                    <Save className="size-4" />
                    {processing
                        ? 'Completing laboratory…'
                        : 'Complete laboratory'}
                </Button>
            </StickyActionFooter>
        </form>
    );
}

LabResultsForm.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
