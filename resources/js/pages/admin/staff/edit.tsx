import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Download, Save, ShieldCheck, ShieldX } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type StaffMember = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    contact: string | null;
    role: string;
    license_no: string | null;
    specialization: string | null;
    is_active: boolean;
    license_verification_status:
        | 'not_submitted'
        | 'pending'
        | 'verified'
        | 'rejected';
    license_verified_at: string | null;
    license_rejection_reason: string | null;
    has_license_document_front: boolean;
    has_license_document_back: boolean;
};

const specializationOptions: Record<string, string[]> = {
    doctor: [
        'General Medicine',
        'Occupational Health',
        'Internal Medicine',
        'Cardiology',
    ],
    radtech: [
        'Diagnostic Radiography',
        'CT/MRI Specialist',
        'X-Ray Specialist',
    ],
    medtech: ['Hematology', 'Clinical Microscopy', 'Bacteriology'],
};

export default function EditStaff({
    staff,
    roles,
    canChangeRole,
}: {
    staff: StaffMember;
    roles: Record<string, string>;
    canChangeRole: boolean;
}) {
    const form = useForm({
        first_name: staff.first_name,
        middle_name: staff.middle_name ?? '',
        last_name: staff.last_name,
        email: staff.email,
        contact: staff.contact ?? '',
        role: staff.role,
        license_no: staff.license_no ?? '',
        specialization: staff.specialization ?? '',
        is_active: staff.is_active,
    });
    const reviewForm = useForm({
        status: 'verified',
        rejection_reason: staff.license_rejection_reason ?? '',
    });

    function reviewLicense(status: 'verified' | 'rejected') {
        reviewForm.transform((data) => ({
            ...data,
            status,
            rejection_reason:
                status === 'rejected' ? data.rejection_reason : '',
        }));
        reviewForm.patch(`/admin/staff/${staff.id}/license-verification`, {
            preserveScroll: true,
        });
    }

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        form.patch(`/admin/staff/${staff.id}`, {
            preserveScroll: true,
        });
    }

    const availableSpecializations =
        specializationOptions[form.data.role] ?? [];
    const displayedSpecializations =
        form.data.specialization &&
        !availableSpecializations.includes(form.data.specialization)
            ? [form.data.specialization, ...availableSpecializations]
            : availableSpecializations;

    return (
        <>
            <Head title={`Edit ${staff.first_name} ${staff.last_name}`} />
            <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Link
                        href="/admin/staff"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-moss-700 dark:text-slate-300 dark:hover:text-moss-300"
                    >
                        <ArrowLeft className="size-4" />
                        Back to staff
                    </Link>
                    <div className="text-right">
                        <p className="text-xs font-bold tracking-wider text-moss-700 uppercase dark:text-moss-300">
                            Staff Management
                        </p>
                        <h1 className="text-2xl font-bold text-slate-950 dark:text-slate-100">
                            Edit Staff Account
                        </h1>
                    </div>
                </div>

                <form
                    onSubmit={submit}
                    className="space-y-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-border dark:bg-card"
                >
                    <div>
                        <h2 className="font-bold text-slate-950 dark:text-slate-100">
                            Profile Information
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Update identity, contact, role, and professional
                            details.
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <Field
                            label="First Name"
                            error={form.errors.first_name}
                        >
                            <Input
                                value={form.data.first_name}
                                onChange={(event) =>
                                    form.setData(
                                        'first_name',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field
                            label="Middle Name"
                            error={form.errors.middle_name}
                        >
                            <Input
                                value={form.data.middle_name}
                                onChange={(event) =>
                                    form.setData(
                                        'middle_name',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label="Last Name" error={form.errors.last_name}>
                            <Input
                                value={form.data.last_name}
                                onChange={(event) =>
                                    form.setData(
                                        'last_name',
                                        event.target.value,
                                    )
                                }
                                required
                            />
                        </Field>
                        <Field label="Email" error={form.errors.email}>
                            <Input
                                type="email"
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                required
                            />
                        </Field>
                        <Field label="Contact" error={form.errors.contact}>
                            <Input
                                inputMode="numeric"
                                value={form.data.contact}
                                onChange={(event) =>
                                    form.setData(
                                        'contact',
                                        event.target.value.replace(/\D/g, ''),
                                    )
                                }
                                maxLength={20}
                            />
                        </Field>
                        <Field label="Role" error={form.errors.role}>
                            <select
                                value={form.data.role}
                                onChange={(event) => {
                                    const role = event.target.value;
                                    form.setData({
                                        ...form.data,
                                        role,
                                        specialization:
                                            role === form.data.role
                                                ? form.data.specialization
                                                : '',
                                    });
                                }}
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                required
                                disabled={!canChangeRole}
                            >
                                {Object.entries(roles).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                            {!canChangeRole && !form.errors.role && (
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Role changes are locked because this staff
                                    member is linked to existing records.
                                </p>
                            )}
                        </Field>
                        {['doctor', 'medtech', 'radtech'].includes(
                            form.data.role,
                        ) && (
                            <Field
                                label="License Number"
                                error={form.errors.license_no}
                            >
                                <Input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]{5,7}"
                                    minLength={5}
                                    maxLength={7}
                                    placeholder="5 to 7 digit PRC number"
                                    value={form.data.license_no}
                                    onChange={(event) =>
                                        form.setData(
                                            'license_no',
                                            event.target.value
                                                .replace(/\D/g, '')
                                                .slice(0, 7),
                                        )
                                    }
                                />
                            </Field>
                        )}
                        {displayedSpecializations.length > 0 && (
                            <Field
                                label="Specialization"
                                error={form.errors.specialization}
                            >
                                <select
                                    value={form.data.specialization}
                                    onChange={(event) =>
                                        form.setData(
                                            'specialization',
                                            event.target.value,
                                        )
                                    }
                                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                    required
                                >
                                    <option value="">
                                        Select specialization
                                    </option>
                                    {displayedSpecializations.map(
                                        (specialization) => (
                                            <option
                                                key={specialization}
                                                value={specialization}
                                            >
                                                {specialization}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </Field>
                        )}
                    </div>

                    <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-border dark:bg-muted/30">
                        <input
                            type="checkbox"
                            checked={form.data.is_active}
                            onChange={(event) =>
                                form.setData('is_active', event.target.checked)
                            }
                            className="mt-0.5 size-4 accent-moss-700"
                        />
                        <span>
                            <span className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Account active
                            </span>
                            <span className="block text-xs text-slate-500 dark:text-slate-400">
                                Inactive staff cannot sign in, but their
                                clinical history is preserved.
                            </span>
                        </span>
                    </label>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end dark:border-border">
                        <Button variant="outline" asChild>
                            <Link href="/admin/staff">Cancel</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={form.processing}
                            className="gap-2"
                        >
                            <Save className="size-4" />
                            {form.processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>

                {['doctor', 'medtech', 'radtech'].includes(staff.role) && (
                    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7 dark:border-border dark:bg-card">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div>
                                <p className="text-xs font-bold tracking-wider text-moss-700 uppercase dark:text-moss-300">
                                    Credential Review
                                </p>
                                <h2 className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-100">
                                    Professional License
                                </h2>
                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Confirm that the submitted proof matches{' '}
                                    {staff.license_no ||
                                        'the saved license number'}{' '}
                                    before approval.
                                </p>
                            </div>
                            <span
                                className={`status-text-only w-fit text-xs font-bold ${
                                    staff.license_verification_status ===
                                    'verified'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : staff.license_verification_status ===
                                            'pending'
                                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                          : staff.license_verification_status ===
                                              'rejected'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                }`}
                            >
                                {staff.license_verification_status.replace(
                                    '_',
                                    ' ',
                                )}
                            </span>
                        </div>

                        {staff.has_license_document_front &&
                        staff.has_license_document_back ? (
                            <div className="mt-5 space-y-4 border-t border-slate-100 pt-5 dark:border-border">
                                <div className="flex flex-wrap gap-3">
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="gap-2"
                                    >
                                        <a
                                            href={`/admin/staff/${staff.id}/license-document/front`}
                                        >
                                            <Download className="size-4" />
                                            Review ID front
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="gap-2"
                                    >
                                        <a
                                            href={`/admin/staff/${staff.id}/license-document/back`}
                                        >
                                            <Download className="size-4" />
                                            Review ID back
                                        </a>
                                    </Button>
                                </div>
                                <div className="grid gap-3 lg:grid-cols-[1fr_auto_auto] lg:items-start">
                                    <div>
                                        <Label htmlFor="rejection_reason">
                                            Reason if rejected
                                        </Label>
                                        <Input
                                            id="rejection_reason"
                                            value={
                                                reviewForm.data.rejection_reason
                                            }
                                            onChange={(event) =>
                                                reviewForm.setData(
                                                    'rejection_reason',
                                                    event.target.value,
                                                )
                                            }
                                            placeholder="Explain what must be corrected"
                                            className="mt-1.5"
                                        />
                                        <InputError
                                            message={
                                                reviewForm.errors
                                                    .rejection_reason
                                            }
                                            className="mt-1.5"
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={() =>
                                            reviewLicense('verified')
                                        }
                                        disabled={reviewForm.processing}
                                        className="gap-2 lg:mt-6"
                                    >
                                        <ShieldCheck className="size-4" />{' '}
                                        Verify
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        onClick={() =>
                                            reviewLicense('rejected')
                                        }
                                        disabled={
                                            reviewForm.processing ||
                                            !reviewForm.data.rejection_reason.trim()
                                        }
                                        className="gap-2 lg:mt-6"
                                    >
                                        <ShieldX className="size-4" /> Reject
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-5 border-t border-slate-100 pt-5 text-sm text-slate-500 dark:border-border dark:text-slate-400">
                                Both the front and back of the PRC ID are
                                required before review.
                            </p>
                        )}
                    </section>
                )}
            </main>
        </>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

EditStaff.layout = (page: React.ReactNode) => {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Staff Management', href: '/admin/staff' },
        { title: 'Edit Staff', href: '' },
    ];

    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
