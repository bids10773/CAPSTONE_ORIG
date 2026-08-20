import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlertCircle,
    ArrowRight,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    FileCheck2,
    FileSpreadsheet,
    History,
    LoaderCircle,
    Plus,
    RefreshCw,
    ShieldCheck,
    UploadCloud,
    UserCheck,
    Users,
    X,
    XCircle,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

interface Appointment {
    id: number;
    patient_name?: string | null;
    appointment_date: string;
    status: string;
    appointment_type: string;
}

interface BulkAppointment {
    id: number;
    appointment_date: string;
    status: string;
    service_types: string[];
    report_status?: string | null;
    report_released_at?: string | null;
    report_download_url?: string | null;
}

interface ImportError {
    field: string;
    message: string;
}

interface PreviewRow {
    row: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    sex: 'Male' | 'Female' | null;
    birthdate: string | null;
    civil_status: string | null;
    employee_number: string | null;
    age: number | null;
    status: 'valid' | 'invalid' | 'duplicate';
    errors: ImportError[];
    warnings: ImportError[];
}

interface ImportSummary {
    total: number;
    valid: number;
    invalid: number;
    duplicates: number;
}

interface ImportPreview {
    token: string;
    file_name: string;
    rows: PreviewRow[];
    summary: ImportSummary;
}

interface UploadHistory {
    id: number;
    status: string;
    file_name: string;
    total: number;
    imported: number;
    duplicates: number;
    failed: number;
    created_at: string;
}

interface ImportResult {
    total: number;
    imported: number;
    duplicates: number;
    failed: number;
    updated: number;
    attached: number;
    report_token: string;
}

interface CompanyReferral {
    id: number;
    referral_number: string;
    employee_name: string;
    status: string;
    valid_until: string;
    appointment_date?: string | null;
    can_cancel: boolean;
}

interface DashboardProps {
    company: {
        id: number;
        company_name: string;
        address?: string | null;
        representative_name?: string | null;
        representative_email?: string | null;
    };
    appointments: Appointment[];
    bulkAppointments: BulkAppointment[];
    stats: { total: number; upcoming: number; completed: number };
    employeeStats: {
        total: number;
        active: number;
        preregistered: number;
        rejected: number;
    };
    uploads: UploadHistory[];
    importPreview?: ImportPreview;
    bulkUploadId?: number | null;
    flash?: { import_result?: ImportResult | null };
    referrals: CompanyReferral[];
    referralStats: {
        pending: number;
        scheduled: number;
        completed: number;
        expired: number;
    };
    serviceTypes: Record<string, string>;
    [key: string]: unknown;
}

const formatBytes = (bytes: number) =>
    bytes < 1024 * 1024
        ? `${(bytes / 1024).toFixed(1)} KB`
        : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

const formatDate = (value: string) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    }).format(new Date(value));

const statusStyle: Record<PreviewRow['status'], string> = {
    valid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/15',
    invalid: 'bg-red-50 text-red-700 ring-red-600/15',
    duplicate: 'bg-amber-50 text-amber-700 ring-amber-600/15',
};

export default function CompanyDashboard() {
    const {
        company,
        appointments,
        bulkAppointments,
        stats,
        employeeStats,
        uploads,
        importPreview,
        bulkUploadId,
        flash,
        referrals,
        referralStats,
        serviceTypes,
    } = usePage<DashboardProps>().props;
    const [isUploadOpen, setIsUploadOpen] = useState(
        !!importPreview || !!bulkUploadId,
    );
    const [dragging, setDragging] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [isReferralOpen, setIsReferralOpen] = useState(false);
    const fileInput = useRef<HTMLInputElement>(null);
    const previewForm = useForm<{
        file: File | null;
        bulk_appointment_id: string;
    }>({
        file: null,
        bulk_appointment_id: bulkUploadId ? String(bulkUploadId) : '',
    });
    const importResult = flash?.import_result;
    const referralForm = useForm({
        first_name: '',
        last_name: '',
        email: '',
        service_types: [] as string[],
    });

    const submitReferral = () => {
        referralForm.post('/company/referrals', {
            preserveScroll: true,
            onSuccess: () => {
                referralForm.reset();
                setIsReferralOpen(false);
                toast.success('Employee referral created.');
            },
            onError: () => {
                toast.error('Please correct the highlighted referral details.');
            },
        });
    };

    const chooseFile = (file?: File) => {
        if (!file) return;
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !['xlsx', 'xls', 'csv'].includes(extension)) {
            toast.error('Choose an XLSX, XLS, or CSV spreadsheet.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('The spreadsheet must not exceed 10 MB.');
            return;
        }
        previewForm.setData('file', file);
        previewForm.clearErrors();
    };

    const preview = () => {
        if (!previewForm.data.file || previewForm.processing) {
            if (!previewForm.data.file)
                toast.error('Select an employee spreadsheet first.');
            return;
        }
        previewForm.post('/company/employees/import/preview', {
            forceFormData: true,
            preserveScroll: true,
            onError: () =>
                toast.error('Review the upload error and try again.'),
        });
    };

    const confirm = () => {
        if (
            !importPreview ||
            confirming ||
            importPreview.summary.valid + importPreview.summary.duplicates === 0
        )
            return;
        setConfirming(true);
        router.post(
            '/company/employees/import/confirm',
            { preview_token: importPreview.token },
            {
                preserveScroll: true,
                onError: () =>
                    toast.error('The import could not be completed.'),
                onFinish: () => setConfirming(false),
            },
        );
    };

    const resetUpload = () => {
        previewForm.reset();
        previewForm.clearErrors();
        if (fileInput.current) fileInput.current.value = '';
        if (importPreview)
            router.visit('/company/dashboard', { preserveScroll: true });
    };

    return (
        <AppLayout>
            <Head title="Company Dashboard" />
            <main className="space-y-6 pb-10">
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-5 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-start gap-4">
                            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-moss-600 text-white shadow-lg shadow-moss-600/20">
                                <Building2 className="size-6" />
                            </span>
                            <div>
                                <p className="text-xs font-bold tracking-[.15em] text-moss-600 uppercase">
                                    Company healthcare portal
                                </p>
                                <h1 className="mt-1 text-2xl font-semibold tracking-[-.03em] text-slate-950 sm:text-3xl">
                                    {company.company_name}
                                </h1>
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                                    Manage your employee registry, spreadsheet
                                    uploads, and clinic appointments in one
                                    secure workspace.
                                </p>
                                {company.address && (
                                    <p className="mt-2 text-xs text-slate-400">
                                        {company.address}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsReferralOpen(true)}
                                className="h-11 rounded-xl px-4"
                            >
                                <Plus className="mr-2 size-4" /> Create employee
                                referral
                            </Button>
                            <a
                                href="/company/employees/import/template"
                                className="inline-flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            >
                                <Download className="size-4" /> Download
                                template
                            </a>
                            <Button
                                type="button"
                                onClick={() => setIsUploadOpen(true)}
                                className="h-11 rounded-xl bg-moss-600 px-4 hover:bg-moss-700"
                            >
                                <UploadCloud className="mr-2 size-4" /> Upload
                                employee Excel file
                            </Button>
                        </div>
                    </div>
                    <div className="grid border-t border-slate-100 bg-slate-50/70 sm:grid-cols-2 lg:grid-cols-4">
                        <Stat
                            label="Total employees"
                            value={employeeStats.total}
                            icon={Users}
                            tone="blue"
                        />
                        <Stat
                            label="Active records"
                            value={employeeStats.active}
                            icon={UserCheck}
                            tone="green"
                        />
                        <Stat
                            label="Pre-registered"
                            value={employeeStats.preregistered}
                            icon={Clock3}
                            tone="amber"
                        />
                        <Stat
                            label="Rejected rows"
                            value={employeeStats.rejected}
                            icon={XCircle}
                            tone="red"
                        />
                    </div>
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="font-semibold text-slate-950">
                                Individual referrals
                            </h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Administrative status only. Medical findings are
                                not shared here.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs">
                            <span className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-amber-700">
                                Pending: {referralStats.pending}
                            </span>
                            <span className="rounded-lg bg-blue-50 px-2.5 py-1.5 text-blue-700">
                                Scheduled: {referralStats.scheduled}
                            </span>
                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1.5 text-emerald-700">
                                Completed: {referralStats.completed}
                            </span>
                            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-slate-600">
                                Expired: {referralStats.expired}
                            </span>
                        </div>
                    </div>
                    <div className="mt-5 overflow-x-auto">
                        <table className="w-full min-w-[680px] text-left text-sm">
                            <thead className="border-b border-slate-100 text-[10px] tracking-wider text-slate-400 uppercase">
                                <tr>
                                    <th className="py-3">Employee</th>
                                    <th>Referral</th>
                                    <th>Valid until</th>
                                    <th>Schedule</th>
                                    <th>Status</th>
                                    <th className="text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {referrals.map((item) => (
                                    <tr key={item.id}>
                                        <td className="py-3 font-medium">
                                            {item.employee_name}
                                        </td>
                                        <td className="text-xs text-slate-500">
                                            {item.referral_number}
                                        </td>
                                        <td className="text-xs">
                                            {formatDate(item.valid_until)}
                                        </td>
                                        <td className="text-xs">
                                            {item.appointment_date
                                                ? formatDate(
                                                      item.appointment_date,
                                                  )
                                                : 'Not scheduled'}
                                        </td>
                                        <td className="text-xs capitalize">
                                            {item.status.replaceAll('_', ' ')}
                                        </td>
                                        <td className="text-right">
                                            {item.can_cancel && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const reason =
                                                            window.prompt(
                                                                'Cancellation reason',
                                                            );
                                                        if (reason)
                                                            router.patch(
                                                                `/company/referrals/${item.id}/cancel`,
                                                                { reason },
                                                                {
                                                                    preserveScroll: true,
                                                                },
                                                            );
                                                    }}
                                                    className="text-xs font-semibold text-red-600"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!referrals.length && (
                            <p className="py-8 text-center text-sm text-slate-500">
                                No individual referrals yet.
                            </p>
                        )}
                    </div>
                </section>

                {isReferralOpen && (
                    <section className="rounded-2xl border border-moss-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="font-semibold">
                                    Create employee referral
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    The employee chooses their own date, doctor,
                                    and time.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsReferralOpen(false)}
                                aria-label="Close referral form"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {(
                                [
                                    ['first_name', 'First name'],
                                    ['last_name', 'Last name'],
                                    ['email', 'Gmail address'],
                                ] as const
                            ).map(([field, label]) => (
                                <label
                                    key={field}
                                    className="text-xs font-semibold text-slate-700"
                                >
                                    {label}
                                    <input
                                        type={
                                            field === 'email' ? 'email' : 'text'
                                        }
                                        value={referralForm.data[field]}
                                        onChange={(e) =>
                                            referralForm.setData(
                                                field,
                                                e.target.value,
                                            )
                                        }
                                        className="mt-1.5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-normal outline-none focus:border-moss-500"
                                    />
                                    <InputError
                                        message={referralForm.errors[field]}
                                        className="mt-1"
                                    />
                                </label>
                            ))}
                        </div>
                        <div className="mt-5">
                            <p className="text-xs font-semibold text-slate-700">
                                Required medical services
                            </p>
                            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {Object.entries(serviceTypes).map(
                                    ([value, label]) => (
                                        <label
                                            key={value}
                                            className="flex items-center gap-2 rounded-xl border border-slate-200 p-3 text-xs"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={referralForm.data.service_types.includes(
                                                    value,
                                                )}
                                                onChange={(e) =>
                                                    referralForm.setData(
                                                        'service_types',
                                                        e.target.checked
                                                            ? [
                                                                  ...referralForm
                                                                      .data
                                                                      .service_types,
                                                                  value,
                                                              ]
                                                            : referralForm.data.service_types.filter(
                                                                  (item) =>
                                                                      item !==
                                                                      value,
                                                              ),
                                                    )
                                                }
                                            />
                                            {label}
                                        </label>
                                    ),
                                )}
                            </div>
                            <InputError
                                message={referralForm.errors.service_types}
                                className="mt-1"
                            />
                        </div>
                        <div className="mt-5 flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsReferralOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                onClick={submitReferral}
                                disabled={referralForm.processing}
                                className="bg-moss-600 hover:bg-moss-700"
                            >
                                Create referral
                            </Button>
                        </div>
                    </section>
                )}

                {importResult && <ImportResultBanner result={importResult} />}

                {isUploadOpen && (
                    <section
                        aria-labelledby="upload-title"
                        className="overflow-hidden rounded-2xl border border-moss-100 bg-white shadow-[0_18px_50px_-36px_rgba(37,99,235,.45)]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
                            <div>
                                <h2
                                    id="upload-title"
                                    className="font-semibold text-slate-950"
                                >
                                    Upload employee spreadsheet
                                </h2>
                                <p className="mt-1 text-xs leading-5 text-slate-500">
                                    Preview and validate every row before
                                    anything is saved.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsUploadOpen(false)}
                                aria-label="Close upload panel"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X className="size-4" />
                            </button>
                        </div>

                        {!importPreview ? (
                            <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                                <div>
                                    <label
                                        htmlFor="bulk-appointment"
                                        className="mb-2 block text-xs font-semibold text-slate-700"
                                    >
                                        Bulk appointment
                                    </label>
                                    <select
                                        id="bulk-appointment"
                                        value={
                                            previewForm.data.bulk_appointment_id
                                        }
                                        onChange={(event) =>
                                            previewForm.setData(
                                                'bulk_appointment_id',
                                                event.target.value,
                                            )
                                        }
                                        className="mb-4 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-moss-500 focus:ring-4 focus:ring-moss-500/10"
                                    >
                                        <option value="">
                                            Import employees only
                                        </option>
                                        {bulkAppointments.map((appointment) => (
                                            <option
                                                key={appointment.id}
                                                value={appointment.id}
                                            >
                                                {formatDate(
                                                    appointment.appointment_date,
                                                )}{' '}
                                                - {appointment.status}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError
                                        message={
                                            previewForm.errors
                                                .bulk_appointment_id
                                        }
                                        className="mb-3"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            fileInput.current?.click()
                                        }
                                        onDragEnter={(event) => {
                                            event.preventDefault();
                                            setDragging(true);
                                        }}
                                        onDragOver={(event) =>
                                            event.preventDefault()
                                        }
                                        onDragLeave={() => setDragging(false)}
                                        onDrop={(event) => {
                                            event.preventDefault();
                                            setDragging(false);
                                            chooseFile(
                                                event.dataTransfer.files[0],
                                            );
                                        }}
                                        className={`flex min-h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 text-center transition focus-visible:ring-4 focus-visible:ring-moss-500/15 focus-visible:outline-none ${dragging ? 'border-moss-500 bg-moss-50' : 'border-slate-200 bg-slate-50/60 hover:border-moss-300 hover:bg-moss-50/40'}`}
                                    >
                                        <span className="flex size-12 items-center justify-center rounded-2xl bg-white text-moss-600 shadow-sm">
                                            <FileSpreadsheet className="size-6" />
                                        </span>
                                        <span className="mt-4 text-sm font-semibold text-slate-800">
                                            Drop your spreadsheet here or browse
                                        </span>
                                        <span className="mt-1 text-xs text-slate-500">
                                            XLSX, XLS, or CSV · maximum 10 MB
                                        </span>
                                    </button>
                                    <input
                                        ref={fileInput}
                                        type="file"
                                        accept=".xlsx,.xls,.csv"
                                        onChange={(event) =>
                                            chooseFile(event.target.files?.[0])
                                        }
                                        className="sr-only"
                                        aria-label="Employee spreadsheet"
                                    />
                                    {previewForm.data.file && (
                                        <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3">
                                            <div className="flex min-w-0 items-center gap-3">
                                                <FileCheck2 className="size-5 shrink-0 text-emerald-600" />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-medium">
                                                        {
                                                            previewForm.data
                                                                .file.name
                                                        }
                                                    </p>
                                                    <p className="text-xs text-slate-400">
                                                        {formatBytes(
                                                            previewForm.data
                                                                .file.size,
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={resetUpload}
                                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                                                aria-label="Remove selected file"
                                            >
                                                <X className="size-4" />
                                            </button>
                                        </div>
                                    )}
                                    <InputError
                                        message={previewForm.errors.file}
                                        className="mt-2"
                                    />
                                    <Button
                                        type="button"
                                        onClick={preview}
                                        disabled={
                                            !previewForm.data.file ||
                                            previewForm.processing
                                        }
                                        className="mt-4 h-11 w-full rounded-xl bg-moss-600 hover:bg-moss-700 sm:w-auto"
                                    >
                                        {previewForm.processing ? (
                                            <>
                                                <LoaderCircle className="mr-2 size-4 animate-spin" />{' '}
                                                Validating spreadsheet…
                                            </>
                                        ) : (
                                            <>
                                                <ArrowRight className="mr-2 size-4" />{' '}
                                                Preview employee records
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <ImportInstructions />
                            </div>
                        ) : (
                            <PreviewTable
                                preview={importPreview}
                                processing={confirming}
                                onCancel={resetUpload}
                                onConfirm={confirm}
                            />
                        )}
                    </section>
                )}

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,.8fr)]">
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <h2 className="flex items-center gap-2 font-semibold"><FileSpreadsheet className="size-4 text-moss-600" /> Bulk medical reports</h2>
                        <p className="mt-1 text-xs text-slate-500">Final employee results become downloadable only after clinic review and release.</p>
                        <div className="mt-4 space-y-2">
                            {bulkAppointments.map((appointment) => (
                                <div key={appointment.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3">
                                    <div><p className="text-sm font-medium">{formatDate(appointment.appointment_date)}</p><p className="mt-0.5 text-[11px] text-slate-400">{appointment.service_types.join(', ')}</p></div>
                                    {appointment.report_download_url ? (
                                        <a href={appointment.report_download_url} className="inline-flex items-center gap-2 rounded-lg bg-moss-600 px-3 py-2 text-xs font-semibold text-white hover:bg-moss-700"><Download className="size-3.5" /> Download final Excel</a>
                                    ) : (
                                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">{appointment.report_status === 'ready_for_review' ? 'Under clinic review' : 'Not yet released'}</span>
                                    )}
                                </div>
                            ))}
                            {bulkAppointments.length === 0 && <p className="py-5 text-center text-xs text-slate-400">No bulk appointments yet.</p>}
                        </div>
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 font-semibold">
                                    <History className="size-4 text-moss-600" />{' '}
                                    Recent uploads
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Your latest employee import activity.
                                </p>
                            </div>
                        </div>
                        {uploads.length ? (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[620px] text-left">
                                    <thead>
                                        <tr className="border-b border-slate-100 text-[10px] tracking-wider text-slate-400 uppercase">
                                            <th className="pb-3 font-semibold">
                                                File
                                            </th>
                                            <th className="pb-3 font-semibold">
                                                Processed
                                            </th>
                                            <th className="pb-3 font-semibold">
                                                Imported
                                            </th>
                                            <th className="pb-3 font-semibold">
                                                Skipped
                                            </th>
                                            <th className="pb-3 text-right font-semibold">
                                                Date
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {uploads.map((upload) => (
                                            <tr
                                                key={upload.id}
                                                className="text-sm"
                                            >
                                                <td className="py-3.5">
                                                    <p className="max-w-52 truncate font-medium text-slate-800">
                                                        {upload.file_name}
                                                    </p>
                                                    <p className="mt-0.5 text-[11px] text-slate-400 capitalize">
                                                        {upload.status}
                                                    </p>
                                                </td>
                                                <td className="py-3.5 text-slate-600">
                                                    {upload.total}
                                                </td>
                                                <td className="py-3.5 font-medium text-emerald-700">
                                                    {upload.imported}
                                                </td>
                                                <td className="py-3.5 text-amber-700">
                                                    {upload.duplicates +
                                                        upload.failed}
                                                </td>
                                                <td className="py-3.5 text-right text-xs text-slate-500">
                                                    {formatDate(
                                                        upload.created_at,
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <EmptyState
                                icon={FileSpreadsheet}
                                title="No uploads yet"
                                description="Your completed employee imports will appear here."
                            />
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 font-semibold">
                                    <CalendarDays className="size-4 text-moss-600" />{' '}
                                    Recent appointments
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    {stats.upcoming} upcoming ·{' '}
                                    {stats.completed} completed
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/company/appointments/create"
                                    className="text-xs font-semibold text-moss-600 hover:text-moss-700"
                                >
                                    Create
                                </Link>
                                <Link
                                    href="/company/appointments"
                                    className="text-xs font-semibold text-moss-600 hover:text-moss-700"
                                >
                                    View all
                                </Link>
                            </div>
                        </div>
                        {appointments.length ? (
                            <div className="space-y-2">
                                {appointments.slice(0, 5).map((appointment) => (
                                    <Link
                                        key={appointment.id}
                                        href="/company/appointments"
                                        className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-moss-100 hover:bg-moss-50/40"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-slate-800">
                                                {appointment.patient_name ||
                                                    'Employee appointment'}
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-slate-400">
                                                {formatDate(
                                                    appointment.appointment_date,
                                                )}
                                            </p>
                                        </div>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 capitalize">
                                            {appointment.status.replaceAll(
                                                '_',
                                                ' ',
                                            )}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={CalendarDays}
                                title="No appointments yet"
                                description="Appointments connected to your company will appear here."
                            />
                        )}
                    </section>
                </div>
            </main>
        </AppLayout>
    );
}

function Stat({
    label,
    value,
    icon: Icon,
    tone,
}: {
    label: string;
    value: number;
    icon: typeof Users;
    tone: 'blue' | 'green' | 'amber' | 'red';
}) {
    const tones = {
        blue: 'bg-moss-100 text-moss-700',
        green: 'bg-emerald-100 text-emerald-700',
        amber: 'bg-amber-100 text-amber-700',
        red: 'bg-red-100 text-red-700',
    };
    return (
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 last:border-b-0 sm:border-r sm:border-b-0 sm:last:border-r-0">
            <span
                className={`flex size-9 items-center justify-center rounded-xl ${tones[tone]}`}
            >
                <Icon className="size-4" />
            </span>
            <div>
                <p className="text-xl font-semibold tracking-tight text-slate-900">
                    {value}
                </p>
                <p className="text-[11px] text-slate-500">{label}</p>
            </div>
        </div>
    );
}

function ImportInstructions() {
    return (
        <aside className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold">
                <ShieldCheck className="size-4 text-moss-600" /> File
                requirements
            </h3>
            <ul className="mt-4 space-y-3 text-xs leading-5 text-slate-600">
                <li>
                    <strong className="text-slate-800">Required:</strong> First
                    first_name, last_name, sex, birthdate, civil_status
                </li>
                <li>
                    <strong className="text-slate-800">Optional:</strong>{' '}
                    middle_name and employee_number
                </li>
                <li>
                    <strong className="text-slate-800">Date format:</strong>{' '}
                    YYYY-MM-DD is recommended
                </li>
                <li>
                    <strong className="text-slate-800">Sex values:</strong>{' '}
                    Male, Female, M, or F
                </li>
                <li>
                    <strong className="text-slate-800">Files:</strong> XLSX,
                    XLS, or CSV up to 10 MB
                </li>
            </ul>
            <a
                href="/company/employees/import/template"
                className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-moss-600 hover:text-moss-700"
            >
                <Download className="size-3.5" /> Download the formatted
                template
            </a>
        </aside>
    );
}

function PreviewTable({
    preview,
    processing,
    onCancel,
    onConfirm,
}: {
    preview: ImportPreview;
    processing: boolean;
    onCancel: () => void;
    onConfirm: () => void;
}) {
    return (
        <div className="p-5 sm:p-6">
            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <p className="text-sm font-semibold text-slate-900">
                        {preview.file_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                        Review validation results before confirming.
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <SummaryBadge
                        label="Total"
                        value={preview.summary.total}
                        className="bg-slate-100 text-slate-700"
                    />
                    <SummaryBadge
                        label="Ready"
                        value={preview.summary.valid}
                        className="bg-emerald-50 text-emerald-700"
                    />
                    <SummaryBadge
                        label="Invalid"
                        value={preview.summary.invalid}
                        className="bg-red-50 text-red-700"
                    />
                    <SummaryBadge
                        label="Duplicate"
                        value={preview.summary.duplicates}
                        className="bg-amber-50 text-amber-700"
                    />
                </div>
            </div>
            <div className="max-h-[480px] overflow-auto rounded-xl border border-slate-200">
                <table className="w-full min-w-[1080px] text-left">
                    <thead className="sticky top-0 z-10 bg-slate-50">
                        <tr className="text-[10px] tracking-wider text-slate-400 uppercase">
                            <th className="px-3 py-3 font-semibold">Row</th>
                            <th className="px-3 py-3 font-semibold">
                                First name
                            </th>
                            <th className="px-3 py-3 font-semibold">
                                Middle name
                            </th>
                            <th className="px-3 py-3 font-semibold">
                                Last name
                            </th>
                            <th className="px-3 py-3 font-semibold">Sex</th>
                            <th className="px-3 py-3 font-semibold">
                                Birthdate
                            </th>
                            <th className="px-3 py-3 font-semibold">Age</th>
                            <th className="px-3 py-3 font-semibold">
                                Civil status
                            </th>
                            <th className="px-3 py-3 font-semibold">
                                Employee no.
                            </th>
                            <th className="px-3 py-3 font-semibold">Status</th>
                            <th className="px-3 py-3 font-semibold">Message</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {preview.rows.map((row) => (
                            <tr
                                key={row.row}
                                className="text-xs text-slate-700"
                            >
                                <td className="px-3 py-3 text-slate-400">
                                    {row.row}
                                </td>
                                <td className="px-3 py-3 font-medium">
                                    {row.first_name || '—'}
                                </td>
                                <td className="px-3 py-3">
                                    {row.middle_name || '—'}
                                </td>
                                <td className="px-3 py-3 font-medium">
                                    {row.last_name || '—'}
                                </td>
                                <td className="px-3 py-3">{row.sex || '—'}</td>
                                <td className="px-3 py-3">
                                    {row.birthdate || '—'}
                                </td>
                                <td className="px-3 py-3">{row.age ?? '—'}</td>
                                <td className="px-3 py-3">
                                    {row.civil_status || '—'}
                                </td>
                                <td className="px-3 py-3">
                                    {row.employee_number || '—'}
                                </td>
                                <td className="px-3 py-3">
                                    <span
                                        className={`inline-flex rounded-full px-2 py-1 text-[10px] font-semibold capitalize ring-1 ring-inset ${statusStyle[row.status]}`}
                                    >
                                        {row.status === 'valid'
                                            ? 'Ready to import'
                                            : row.status}
                                    </span>
                                </td>
                                <td className="max-w-64 px-3 py-3 text-slate-500">
                                    {row.errors
                                        .map((error) => error.message)
                                        .join(' ') ||
                                        row.warnings
                                            .map((warning) => warning.message)
                                            .join(' ') ||
                                        (row.status === 'duplicate'
                                            ? 'Existing employee; will be skipped.'
                                            : 'Validated successfully.')}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {preview.summary.invalid > 0 && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" /> Invalid
                    rows will not be imported. Correct them in the spreadsheet
                    and upload again for a complete import.
                </div>
            )}
            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={processing}
                    className="h-10 rounded-xl"
                >
                    <RefreshCw className="mr-2 size-4" /> Upload another file
                </Button>
                <Button
                    type="button"
                    onClick={onConfirm}
                    disabled={
                        processing ||
                        preview.summary.valid + preview.summary.duplicates === 0
                    }
                    className="h-10 rounded-xl bg-moss-600 hover:bg-moss-700"
                >
                    {processing ? (
                        <>
                            <LoaderCircle className="mr-2 size-4 animate-spin" />{' '}
                            Importing…
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="mr-2 size-4" /> Confirm{' '}
                            {preview.summary.valid} new and{' '}
                            {preview.summary.duplicates} existing employees
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}

function SummaryBadge({
    label,
    value,
    className,
}: {
    label: string;
    value: number;
    className: string;
}) {
    return (
        <span
            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold ${className}`}
        >
            {label}: {value}
        </span>
    );
}

function ImportResultBanner({ result }: { result: ImportResult }) {
    return (
        <section className="flex flex-col gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div>
                    <h2 className="text-sm font-semibold text-emerald-900">
                        Employee import completed
                    </h2>
                    <p className="mt-1 text-xs leading-5 text-emerald-700">
                        {result.total} rows processed: {result.imported}{' '}
                        imported, {result.attached} attached to the bulk batch,{' '}
                        {result.duplicates} duplicates skipped, and{' '}
                        {result.failed} invalid rows rejected.
                    </p>
                </div>
            </div>
            {result.failed > 0 && (
                <a
                    href={`/company/employees/import/errors/${result.report_token}`}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-700"
                >
                    <Download className="size-3.5" /> Error report
                </a>
            )}
        </section>
    );
}

function EmptyState({
    icon: Icon,
    title,
    description,
}: {
    icon: typeof FileSpreadsheet;
    title: string;
    description: string;
}) {
    return (
        <div className="flex min-h-44 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
            <Icon className="size-6 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">{title}</p>
            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                {description}
            </p>
        </div>
    );
}
