import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    BadgeCheck,
    Ban,
    Download,
    FileCheck2,
    FileClock,
    LoaderCircle,
    MessageSquareWarning,
    PenLine,
    Printer,
    Send,
    ShieldCheck,
    UserRoundCheck,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { MedicalCertificatePreview } from '@/components/medical-certificate-document';
import type { MedicalCertificateDocumentData } from '@/components/medical-certificate-document';
import { MedicalCertificateStatus } from '@/components/medical-certificate-status';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import type {
    MedicalCertificateAudit,
    MedicalCertificateDetail,
    MedicalCertificatePermissions,
} from '@/types/medical-certificate';

type Props = {
    certificate: MedicalCertificateDetail;
    can?: MedicalCertificatePermissions;
};

function identifier(certificate: MedicalCertificateDetail): string {
    return (
        certificate.certificate_number ||
        certificate.certificate_id ||
        certificate.reference_code ||
        `Certificate #${certificate.id}`
    );
}

function patientName(certificate: MedicalCertificateDetail): string {
    return (
        certificate.patient_name ||
        certificate.patient?.full_name ||
        certificate.patient?.name ||
        [
            certificate.patient?.first_name,
            certificate.patient?.middle_name,
            certificate.patient?.last_name,
        ]
            .filter(Boolean)
            .join(' ') ||
        'Patient unavailable'
    );
}

function physicianName(certificate: MedicalCertificateDetail): string {
    return (
        certificate.physician_name ||
        certificate.attending_physician_name ||
        certificate.attending_physician?.name ||
        certificate.physician?.name ||
        ''
    );
}

function physicianLicense(certificate: MedicalCertificateDetail): string {
    return (
        certificate.physician_license_no ||
        certificate.attending_physician_license_no ||
        certificate.attending_physician?.license_no ||
        certificate.physician?.license_no ||
        ''
    );
}

function formatDate(value?: string | null, includeTime = false): string {
    if (!value) return 'Not recorded';
    const date = includeTime
        ? new Date(value)
        : new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat(
        'en-PH',
        includeTime
            ? { dateStyle: 'medium', timeStyle: 'short' }
            : { dateStyle: 'medium' },
    ).format(date);
}

function humanize(value: string): string {
    return value
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function MedicalCertificateShow({ certificate, can }: Props) {
    const permissions = { ...certificate.can, ...can };
    const [activeAction, setActiveAction] = useState<string | null>(null);
    const [requestChangesOpen, setRequestChangesOpen] = useState(false);
    const [voidOpen, setVoidOpen] = useState(false);
    const [reason, setReason] = useState('');
    const [actionError, setActionError] = useState('');
    const number = identifier(certificate);
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Medical Certificates', href: '/medical-certificates' },
        { title: number, href: '' },
    ];
    const previewData: MedicalCertificateDocumentData = {
        certificateNumber: number,
        patientReference:
            certificate.patient_reference_code ||
            certificate.patient?.patient_reference_code,
        consultationDate: certificate.consultation_date,
        status: certificate.status,
        salutation: certificate.salutation,
        patientName: patientName(certificate),
        patientAge:
            certificate.patient_age ?? certificate.patient?.age ?? undefined,
        patientSex:
            certificate.patient_sex || certificate.patient?.sex || undefined,
        patientCivilStatus:
            certificate.patient_civil_status ||
            certificate.patient?.civil_status ||
            undefined,
        reasonForConsultation: certificate.reason_for_consultation,
        clinicalImpression: certificate.clinical_impression,
        recommendation: certificate.recommendation,
        restStartDate: certificate.rest_start_date,
        restEndDate: certificate.rest_end_date,
        dateIssued: certificate.date_issued,
        physicianName: physicianName(certificate),
        physicianLicenseNumber: physicianLicense(certificate),
    };

    function transition(
        action: 'submit' | 'approve' | 'issue' | 'request-changes' | 'void',
        payload: Record<string, string> = {},
    ) {
        setActiveAction(action);
        setActionError('');
        router.patch(
            `/medical-certificates/${certificate.id}/${action}`,
            payload,
            {
                preserveScroll: true,
                onSuccess: () => {
                    setReason('');
                    setRequestChangesOpen(false);
                    setVoidOpen(false);
                },
                onError: (errors) => {
                    const message = Object.values(errors).find(
                        (value) => typeof value === 'string',
                    );
                    setActionError(
                        typeof message === 'string'
                            ? message
                            : 'The workflow action could not be completed.',
                    );
                },
                onFinish: () => setActiveAction(null),
            },
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Medical Certificate ${number}`} />
            <div className="mx-auto w-full max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-end sm:p-6 dark:border-border dark:bg-card">
                    <div>
                        <Link
                            href="/medical-certificates"
                            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-moss-700 dark:text-slate-300 dark:hover:text-moss-300"
                        >
                            <ArrowLeft className="size-4" /> Back to
                            certificates
                        </Link>
                        <div className="mt-5 flex flex-wrap items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl dark:text-slate-100">
                                {number}
                            </h1>
                            <MedicalCertificateStatus
                                status={certificate.status}
                            />
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                            {patientName(certificate)} ·{' '}
                            {certificate.patient_reference_code ||
                                certificate.patient?.patient_reference_code ||
                                'Patient ID unavailable'}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {permissions.edit && (
                            <Button asChild variant="outline" size="sm">
                                <Link
                                    href={`/medical-certificates/${certificate.id}/edit`}
                                >
                                    <PenLine /> Edit draft
                                </Link>
                            </Button>
                        )}
                        {permissions.print && (
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href={`/medical-certificates/${certificate.id}/print`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Printer /> Print
                                </a>
                            </Button>
                        )}
                        {permissions.download_pdf && (
                            <Button asChild variant="outline" size="sm">
                                <a
                                    href={`/medical-certificates/${certificate.id}/pdf`}
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    <Download /> Download PDF
                                </a>
                            </Button>
                        )}
                    </div>
                </header>

                {(certificate.correction_notes || certificate.void_reason) && (
                    <div
                        className={`rounded-xl border px-4 py-3 text-sm ${
                            certificate.status === 'void'
                                ? 'border-red-200 bg-red-50 text-red-900 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200'
                                : 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200'
                        }`}
                    >
                        <strong>
                            {certificate.status === 'void'
                                ? 'Void reason:'
                                : 'Requested changes:'}
                        </strong>{' '}
                        {certificate.void_reason ||
                            certificate.correction_notes}
                    </div>
                )}

                {(permissions.submit ||
                    permissions.approve ||
                    permissions.request_changes ||
                    permissions.issue ||
                    permissions.void) && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-border dark:bg-card">
                        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                            <div>
                                <h2 className="font-bold text-slate-950 dark:text-slate-100">
                                    Certificate workflow
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Actions are recorded in the audit trail.
                                    Issuing makes this an official clinic
                                    document.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {permissions.submit && (
                                    <WorkflowButton
                                        loading={activeAction === 'submit'}
                                        disabled={activeAction !== null}
                                        icon={<Send />}
                                        label="Submit for approval"
                                        onClick={() =>
                                            window.confirm(
                                                'Submit this draft to the attending physician for review?',
                                            ) && transition('submit')
                                        }
                                    />
                                )}
                                {permissions.approve && (
                                    <WorkflowButton
                                        loading={activeAction === 'approve'}
                                        disabled={activeAction !== null}
                                        icon={<BadgeCheck />}
                                        label="Approve"
                                        onClick={() =>
                                            window.confirm(
                                                'Approve this medical certificate after reviewing all clinical details?',
                                            ) && transition('approve')
                                        }
                                    />
                                )}
                                {permissions.request_changes && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={activeAction !== null}
                                        onClick={() => {
                                            setReason('');
                                            setVoidOpen(false);
                                            setRequestChangesOpen(true);
                                        }}
                                    >
                                        <MessageSquareWarning /> Request changes
                                    </Button>
                                )}
                                {permissions.issue && (
                                    <WorkflowButton
                                        loading={activeAction === 'issue'}
                                        disabled={activeAction !== null}
                                        icon={<FileCheck2 />}
                                        label="Issue certificate"
                                        onClick={() =>
                                            window.confirm(
                                                'Issue this approved medical certificate? The issued record will become read-only.',
                                            ) && transition('issue')
                                        }
                                    />
                                )}
                                {permissions.void && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="sm"
                                        disabled={activeAction !== null}
                                        onClick={() => {
                                            setReason('');
                                            setRequestChangesOpen(false);
                                            setVoidOpen(true);
                                        }}
                                    >
                                        <Ban /> Void
                                    </Button>
                                )}
                            </div>
                        </div>

                        {(requestChangesOpen || voidOpen) && (
                            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-border dark:bg-muted/30">
                                <div className="flex items-center justify-between gap-3">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        {voidOpen
                                            ? 'Reason for voiding certificate'
                                            : 'Changes required'}
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRequestChangesOpen(false);
                                            setVoidOpen(false);
                                            setReason('');
                                        }}
                                        className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-slate-700 dark:hover:bg-accent"
                                        aria-label="Close reason form"
                                    >
                                        <X className="size-4" />
                                    </button>
                                </div>
                                <Textarea
                                    className="mt-3"
                                    value={reason}
                                    onChange={(event) =>
                                        setReason(event.target.value)
                                    }
                                    maxLength={1000}
                                    placeholder={
                                        voidOpen
                                            ? 'Document why this issued certificate must be voided'
                                            : 'Describe the corrections needed before approval'
                                    }
                                />
                                <div className="mt-3 flex justify-end">
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant={
                                            voidOpen ? 'destructive' : 'default'
                                        }
                                        disabled={
                                            reason.trim().length < 3 ||
                                            activeAction !== null
                                        }
                                        onClick={() =>
                                            transition(
                                                voidOpen
                                                    ? 'void'
                                                    : 'request-changes',
                                                { reason: reason.trim() },
                                            )
                                        }
                                    >
                                        {activeAction ? (
                                            <LoaderCircle className="animate-spin" />
                                        ) : voidOpen ? (
                                            <Ban />
                                        ) : (
                                            <MessageSquareWarning />
                                        )}
                                        {voidOpen
                                            ? 'Confirm void'
                                            : 'Send correction request'}
                                    </Button>
                                </div>
                            </div>
                        )}
                        {actionError && (
                            <p className="mt-3 text-sm font-medium text-red-600">
                                {actionError}
                            </p>
                        )}
                    </section>
                )}

                <div className="grid min-w-0 gap-6 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-start">
                    <aside className="space-y-5 xl:sticky xl:top-24">
                        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                            <div className="border-b border-slate-100 p-5 dark:border-border">
                                <h2 className="flex items-center gap-2 font-bold text-slate-950 dark:text-slate-100">
                                    <ShieldCheck className="size-5 text-moss-700" />
                                    Record details
                                </h2>
                            </div>
                            <dl className="grid gap-4 p-5 text-sm">
                                <Detail
                                    label="Patient"
                                    value={patientName(certificate)}
                                />
                                <Detail
                                    label="Consultation date"
                                    value={formatDate(
                                        certificate.consultation_date,
                                    )}
                                />
                                <Detail
                                    label="Certificate date"
                                    value={formatDate(certificate.date_issued)}
                                />
                                <Detail
                                    label="Attending physician"
                                    value={
                                        physicianName(certificate) ||
                                        'Not assigned'
                                    }
                                />
                                <Detail
                                    label="Physician license"
                                    value={
                                        physicianLicense(certificate) ||
                                        'Not recorded'
                                    }
                                />
                                <Detail
                                    label="Created"
                                    value={formatDate(
                                        certificate.created_at,
                                        true,
                                    )}
                                />
                                {certificate.issued_at && (
                                    <Detail
                                        label="Issued"
                                        value={formatDate(
                                            certificate.issued_at,
                                            true,
                                        )}
                                    />
                                )}
                            </dl>
                        </section>

                        <AuditTrail audits={certificate.audits || []} />
                    </aside>

                    <div className="min-w-0">
                        <MedicalCertificatePreview
                            data={previewData}
                            initialScale={0.8}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

function WorkflowButton({
    loading,
    disabled,
    icon,
    label,
    onClick,
}: {
    loading: boolean;
    disabled: boolean;
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}) {
    return (
        <Button type="button" size="sm" disabled={disabled} onClick={onClick}>
            {loading ? <LoaderCircle className="animate-spin" /> : icon}
            {label}
        </Button>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[10px] font-bold tracking-[.1em] text-slate-400 uppercase">
                {label}
            </dt>
            <dd className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                {value}
            </dd>
        </div>
    );
}

function AuditTrail({ audits }: { audits: MedicalCertificateAudit[] }) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
            <div className="border-b border-slate-100 p-5 dark:border-border">
                <h2 className="flex items-center gap-2 font-bold text-slate-950 dark:text-slate-100">
                    <FileClock className="size-5 text-moss-700" /> Audit trail
                </h2>
            </div>
            {audits.length ? (
                <ol className="divide-y divide-slate-100 dark:divide-border">
                    {audits.map((audit) => {
                        const actor = audit.user?.name || audit.actor?.name;
                        const action = audit.action || audit.event || 'Updated';
                        return (
                            <li key={audit.id} className="p-4">
                                <div className="flex gap-3">
                                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-moss-100 text-moss-700 dark:bg-moss-900 dark:text-moss-200">
                                        <UserRoundCheck className="size-4" />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                                            {humanize(action)}
                                        </p>
                                        {(audit.from_status ||
                                            audit.to_status) && (
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {audit.from_status
                                                    ? humanize(
                                                          audit.from_status,
                                                      )
                                                    : 'New'}{' '}
                                                →{' '}
                                                {audit.to_status
                                                    ? humanize(audit.to_status)
                                                    : 'Updated'}
                                            </p>
                                        )}
                                        <p className="mt-1 text-xs text-slate-400">
                                            {actor || 'System'} ·{' '}
                                            {formatDate(audit.created_at, true)}
                                        </p>
                                        {audit.notes && (
                                            <p className="mt-2 rounded-lg bg-slate-50 p-2 text-xs leading-5 text-slate-600 dark:bg-muted dark:text-slate-300">
                                                {audit.notes}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            ) : (
                <div className="p-6 text-center text-sm text-slate-500">
                    No audit events are available yet.
                </div>
            )}
        </section>
    );
}
