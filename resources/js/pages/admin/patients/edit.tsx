import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import type { FormEvent } from 'react';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

type Patient = {
    id: number;
    patient_reference_code: string;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    contact: string | null;
    patient_profile: {
        birthdate: string | null;
        sex: string | null;
        civil_status: string | null;
        address: string | null;
        employee_number: string | null;
    } | null;
};

export default function EditPatient({ patient }: { patient: Patient }) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Patients', href: '/admin/patients' },
        { title: 'Edit patient', href: `/admin/patients/${patient.id}/edit` },
    ];
    const form = useForm({
        first_name: patient.first_name,
        middle_name: patient.middle_name ?? '',
        last_name: patient.last_name,
        email: patient.email,
        contact: patient.contact ?? '',
        birthdate: patient.patient_profile?.birthdate ?? '',
        sex: patient.patient_profile?.sex ?? '',
        civil_status: patient.patient_profile?.civil_status ?? '',
        address: patient.patient_profile?.address ?? '',
        employee_number: patient.patient_profile?.employee_number ?? '',
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.patch(`/admin/patients/${patient.id}`);
    };

    const fieldClass =
        'mt-1.5 h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none focus:border-moss-600 focus:ring-2 focus:ring-moss-600/20 dark:border-input dark:bg-card dark:text-foreground';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Edit ${patient.first_name} ${patient.last_name}`} />
            <main className="mx-auto w-full max-w-4xl space-y-5 p-4 sm:p-6">
                <div>
                    <Link
                        href="/admin/patients"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-moss-700 hover:underline dark:text-moss-300"
                    >
                        <ArrowLeft className="size-4" /> Back to patients
                    </Link>
                    <h1 className="mt-3 text-2xl font-bold text-slate-950 dark:text-foreground">
                        Edit patient
                    </h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-muted-foreground">
                        {patient.patient_reference_code}
                    </p>
                </div>

                <form
                    onSubmit={submit}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 dark:border-border dark:bg-card"
                >
                    <div className="grid gap-5 sm:grid-cols-2">
                        <Field
                            label="First name"
                            error={form.errors.first_name}
                        >
                            <input
                                className={fieldClass}
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
                            label="Middle name"
                            error={form.errors.middle_name}
                        >
                            <input
                                className={fieldClass}
                                value={form.data.middle_name}
                                onChange={(event) =>
                                    form.setData(
                                        'middle_name',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label="Last name" error={form.errors.last_name}>
                            <input
                                className={fieldClass}
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
                            <input
                                type="email"
                                className={fieldClass}
                                value={form.data.email}
                                onChange={(event) =>
                                    form.setData('email', event.target.value)
                                }
                                required
                            />
                        </Field>
                        <Field
                            label="Contact number"
                            error={form.errors.contact}
                        >
                            <input
                                className={fieldClass}
                                value={form.data.contact}
                                onChange={(event) =>
                                    form.setData('contact', event.target.value)
                                }
                            />
                        </Field>
                        <Field label="Birthdate" error={form.errors.birthdate}>
                            <input
                                type="date"
                                className={fieldClass}
                                value={form.data.birthdate}
                                onChange={(event) =>
                                    form.setData(
                                        'birthdate',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field label="Sex" error={form.errors.sex}>
                            <select
                                className={fieldClass}
                                value={form.data.sex}
                                onChange={(event) =>
                                    form.setData('sex', event.target.value)
                                }
                            >
                                <option value="">Not specified</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </Field>
                        <Field
                            label="Civil status"
                            error={form.errors.civil_status}
                        >
                            <select
                                className={fieldClass}
                                value={form.data.civil_status}
                                onChange={(event) =>
                                    form.setData(
                                        'civil_status',
                                        event.target.value,
                                    )
                                }
                            >
                                <option value="">Not specified</option>
                                {[
                                    'Single',
                                    'Married',
                                    'Divorced',
                                    'Widowed',
                                ].map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Employee number"
                            error={form.errors.employee_number}
                        >
                            <input
                                className={fieldClass}
                                value={form.data.employee_number}
                                onChange={(event) =>
                                    form.setData(
                                        'employee_number',
                                        event.target.value,
                                    )
                                }
                            />
                        </Field>
                        <Field
                            label="Address"
                            error={form.errors.address}
                            className="sm:col-span-2"
                        >
                            <textarea
                                className={`${fieldClass} min-h-24 py-3`}
                                value={form.data.address}
                                onChange={(event) =>
                                    form.setData('address', event.target.value)
                                }
                            />
                        </Field>
                    </div>
                    <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-border">
                        <Link
                            href="/admin/patients"
                            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold dark:border-input"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={form.processing}
                            className="inline-flex items-center gap-2 rounded-xl bg-moss-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss-800 disabled:opacity-60"
                        >
                            <Save className="size-4" />
                            {form.processing ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </form>
            </main>
        </AppLayout>
    );
}

function Field({
    label,
    error,
    className = '',
    children,
}: {
    label: string;
    error?: string;
    className?: string;
    children: React.ReactNode;
}) {
    return (
        <label className={`text-sm font-semibold ${className}`}>
            {label}
            {children}
            <InputError message={error} className="mt-1.5" />
        </label>
    );
}
