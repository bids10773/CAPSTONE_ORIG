import { Head, router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardCheck,
    MonitorCheck,
    Save,
    ScanLine,
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'RadTech Queue', href: '/radtech/appointments' },
    { title: 'X-Ray Examination', href: '' },
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
        service_types: string;
    };
    xrayReport?: any;
    submitUrl: string;
}

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

export default function XrayReportForm({
    appointment,
    xrayReport,
    submitUrl,
}: Props) {
    const form = useForm({
        workflow_action: 'complete',
        chest_status: xrayReport?.findings ? 'findings' : 'normal',
        chest_findings: xrayReport?.findings || '',
        impression: xrayReport?.impression || '',
        recommendation: xrayReport?.recommendation || '',
        remarks: xrayReport?.remarks || '',
    });
    const { data, setData, processing } = form;

    const submit = (action: 'performed' | 'complete') => {
        form.transform((values) => ({
            ...values,
            workflow_action: action,
        }));
        form.post(submitUrl, { preserveScroll: true });
    };
    const patientName = `${appointment.user.first_name} ${appointment.user.last_name}`;

    return (
        <>
            <Head title="X-Ray Report" />
            <form
                onSubmit={(event) => event.preventDefault()}
                className="mx-auto max-w-[1500px] space-y-5 px-4 py-6 sm:px-6 lg:px-8"
            >
                <PatientSummaryCard
                    name={patientName}
                    subtitle="Diagnostic imaging workflow"
                    stage="Image Review and Reporting"
                    details={[
                        {
                            label: 'Age',
                            value: getAge(
                                appointment.patient_profile?.birthdate,
                            ),
                            icon: UserRound,
                        },
                        {
                            label: 'Sex',
                            value: appointment.patient_profile?.sex,
                        },
                        {
                            label: 'Examination',
                            value: appointment.service_types || 'Chest X-ray',
                            icon: ScanLine,
                        },
                        { label: 'Queue', value: `#${appointment.id}` },
                    ]}
                />

                <WorkflowTimeline
                    current={3}
                    steps={[
                        'Patient',
                        'Requested X-Ray',
                        'Examination',
                        'Result Entry',
                        'Review',
                        'Complete',
                    ]}
                />

                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_400px]">
                    <div className="space-y-5">
                        <ClinicalSection
                            icon={ScanLine}
                            title="Requested X-ray examination"
                            description="Confirm the requested examination before documenting the result."
                        >
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-slate-50/60 p-4">
                                    <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                        Examination
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        {appointment.service_types ||
                                            'Chest X-ray'}
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-border bg-slate-50/60 p-4">
                                    <p className="text-[10px] font-semibold tracking-wide text-slate-400 uppercase">
                                        Priority
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-slate-900">
                                        Routine
                                    </p>
                                </div>
                                <div className="rounded-2xl border border-moss-200 bg-moss-50 p-4">
                                    <p className="text-[10px] font-semibold tracking-wide text-moss-600 uppercase">
                                        Current task
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-moss-900">
                                        Enter X-ray result
                                    </p>
                                </div>
                            </div>
                        </ClinicalSection>

                        <ClinicalSection
                            icon={ScanLine}
                            title="Structured findings"
                            description="Choose the result classification, then document observable findings."
                        >
                            <div className="max-w-lg">
                                <Label className="mb-2 block">
                                    Result classification
                                </Label>
                                <SegmentedChoice
                                    ariaLabel="Chest X-ray result"
                                    value={data.chest_status}
                                    onChange={(status) => {
                                        setData('chest_status', status);
                                        if (status === 'normal') {
                                            setData(
                                                'chest_findings',
                                                `BOTH LUNGS ARE CLEAR
HEART SIZE IS NOT ENLARGED
THE REST OF THE CHEST FINDINGS ARE UNREMARKABLE`,
                                            );
                                            setData(
                                                'impression',
                                                'ESSENTIALLY NORMAL CHEST X-RAY.',
                                            );
                                        } else {
                                            setData('chest_findings', '');
                                            setData('impression', '');
                                        }
                                    }}
                                    options={[
                                        {
                                            value: 'normal',
                                            label: 'Normal study',
                                        },
                                        {
                                            value: 'findings',
                                            label: 'With findings',
                                            tone: 'warning',
                                        },
                                    ]}
                                />
                            </div>

                            <div className="mt-5">
                                <Label htmlFor="chest-findings">
                                    Radiographic findings
                                </Label>
                                <Textarea
                                    id="chest-findings"
                                    className="mt-1.5 min-h-52 font-mono text-sm leading-6"
                                    value={data.chest_findings}
                                    disabled={data.chest_status === 'normal'}
                                    onChange={(event) =>
                                        setData(
                                            'chest_findings',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Describe the lungs, cardiac silhouette, mediastinum, pleura, and osseous structures"
                                />
                            </div>
                        </ClinicalSection>
                    </div>

                    <aside className="space-y-5">
                        <ClinicalSection
                            icon={MonitorCheck}
                            title="X-ray examination status"
                            description="Current position in the examination workflow."
                        >
                            <ol className="space-y-1">
                                {[
                                    'Waiting',
                                    'In progress',
                                    'Examined',
                                    'Result entry',
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
                                                <MonitorCheck className="size-4" />
                                            )}
                                        </span>
                                        <div>
                                            <p className="text-sm font-semibold text-slate-800">
                                                {step}
                                            </p>
                                            <p className="text-[11px] text-slate-400">
                                                {index < 3
                                                    ? 'Stage acknowledged'
                                                    : 'Current result stage'}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ol>
                        </ClinicalSection>

                        <ClinicalSection
                            icon={ClipboardCheck}
                            title="Radiologic impression"
                            description="Provide a concise diagnostic summary."
                        >
                            <Label htmlFor="impression">Impression</Label>
                            <Textarea
                                id="impression"
                                className="mt-1.5 min-h-40"
                                value={data.impression}
                                disabled={data.chest_status === 'normal'}
                                onChange={(event) =>
                                    setData('impression', event.target.value)
                                }
                                placeholder="Enter the radiologic impression"
                            />

                            <Label htmlFor="remarks" className="mt-5 block">
                                Technologist notes
                            </Label>
                            <Textarea
                                id="remarks"
                                className="mt-1.5 min-h-28"
                                value={data.remarks}
                                onChange={(event) =>
                                    setData('remarks', event.target.value)
                                }
                                placeholder="Document positioning, image quality, or relevant notes"
                            />

                            <Label
                                htmlFor="recommendation"
                                className="mt-5 block"
                            >
                                Recommendation
                            </Label>
                            <Textarea
                                id="recommendation"
                                className="mt-1.5 min-h-28"
                                value={data.recommendation}
                                onChange={(event) =>
                                    setData(
                                        'recommendation',
                                        event.target.value,
                                    )
                                }
                                placeholder="Optional follow-up recommendation"
                            />
                        </ClinicalSection>
                    </aside>
                </div>

                <StickyActionFooter hint="Submitting forwards the completed imaging report through the existing workflow.">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.visit('/radtech/appointments')}
                    >
                        <ArrowLeft className="size-4" />
                        Back to queue
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={processing || !!xrayReport?.performed_at}
                        onClick={() => submit('performed')}
                    >
                        <ScanLine className="size-4" />
                        Mark procedure performed
                    </Button>
                    <Button
                        type="button"
                        disabled={processing}
                        onClick={() => submit('complete')}
                    >
                        <Save className="size-4" />
                        {processing
                            ? 'Completing imaging…'
                            : 'Verify official result'}
                    </Button>
                </StickyActionFooter>
            </form>
        </>
    );
}

XrayReportForm.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
