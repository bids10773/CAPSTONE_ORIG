import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    LoaderCircle,
    Mail,
    MessageSquare,
} from 'lucide-react';
import InputError from '@/components/input-error';
import AppLayout from '@/layouts/app-layout';

type CategoryOption = {
    value: string;
    label: string;
    uses_company_fields: boolean;
};

type InitialValues = {
    category: string;
    sender_first_name: string;
    sender_middle_name: string;
    sender_last_name: string;
    representative_position: string;
    company_name: string;
    email: string;
    contact_number: string;
    subject: string;
    message: string;
};

export default function CreateInquiry({
    categories,
    submissionKey,
    initialValues,
    isAuthenticated,
}: {
    categories: CategoryOption[];
    submissionKey: string;
    initialValues: InitialValues;
    isAuthenticated: boolean;
}) {
    const page = usePage<{
        flash?: { success?: string };
        [key: string]: unknown;
    }>();
    const form = useForm({ ...initialValues, submission_key: submissionKey });
    const selected = categories.find(
        (category) => category.value === form.data.category,
    );
    const showCompany = selected?.uses_company_fields ?? false;
    const companyAccount = form.data.category === 'company_account';
    const input =
        'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-moss-600 focus:ring-4 focus:ring-moss-500/15';

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.post('/inquiries', { preserveScroll: true });
    }

    const fieldLabel = (label: string, required = true) => (
        <span className="text-sm font-semibold text-slate-700">
            {label}
            {required && <span className="ml-1 text-red-600">*</span>}
        </span>
    );

    const content = (
        <>
            <Head title="Send an Inquiry" />
            <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <Link
                        href={isAuthenticated ? '/my-inquiries' : '/'}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-moss-700"
                    >
                        <ArrowLeft className="size-4" />
                        {isAuthenticated ? 'My inquiries' : 'Back to home'}
                    </Link>
                    {!isAuthenticated && (
                        <Link
                            href="/login"
                            className="text-sm font-semibold text-moss-700 hover:text-moss-900"
                        >
                            Sign in
                        </Link>
                    )}
                </div>

                <header className="mb-7">
                    <p className="text-sm font-semibold text-moss-700">
                        Contact LMIC
                    </p>
                    <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
                        Send an inquiry
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                        Ask about clinic services, appointments, or company
                        partnership. An inquiry does not create an account or
                        appointment.
                    </p>
                </header>

                {page.props.flash?.success && (
                    <div
                        role="status"
                        className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
                    >
                        {page.props.flash.success}
                    </div>
                )}

                <form onSubmit={submit} className="space-y-6" noValidate>
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <span className="rounded-xl bg-moss-100 p-2 text-moss-700">
                                <MessageSquare className="size-5" />
                            </span>
                            <div>
                                <h2 className="font-semibold text-slate-950">
                                    Inquiry details
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Choose the category that best matches your
                                    concern.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <label className="sm:col-span-2">
                                {fieldLabel('Inquiry category')}
                                <select
                                    className={input}
                                    value={form.data.category}
                                    onChange={(event) =>
                                        form.setData(
                                            'category',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={!!form.errors.category}
                                >
                                    {categories.map((category) => (
                                        <option
                                            key={category.value}
                                            value={category.value}
                                        >
                                            {category.label}
                                        </option>
                                    ))}
                                </select>
                                <InputError message={form.errors.category} />
                            </label>
                            <label>
                                {fieldLabel(
                                    showCompany
                                        ? 'Representative first name'
                                        : 'First name',
                                )}
                                <input
                                    className={input}
                                    maxLength={100}
                                    value={form.data.sender_first_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'sender_first_name',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={
                                        !!form.errors.sender_first_name
                                    }
                                />
                                <InputError
                                    message={form.errors.sender_first_name}
                                />
                            </label>
                            <label>
                                {fieldLabel(
                                    showCompany
                                        ? 'Representative middle name'
                                        : 'Middle name',
                                    false,
                                )}
                                <input
                                    className={input}
                                    maxLength={100}
                                    value={form.data.sender_middle_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'sender_middle_name',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={
                                        !!form.errors.sender_middle_name
                                    }
                                />
                                <InputError
                                    message={form.errors.sender_middle_name}
                                />
                            </label>
                            <label>
                                {fieldLabel(
                                    showCompany
                                        ? 'Representative last name'
                                        : 'Last name',
                                )}
                                <input
                                    className={input}
                                    maxLength={100}
                                    value={form.data.sender_last_name}
                                    onChange={(event) =>
                                        form.setData(
                                            'sender_last_name',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={
                                        !!form.errors.sender_last_name
                                    }
                                />
                                <InputError
                                    message={form.errors.sender_last_name}
                                />
                            </label>
                            <label>
                                {fieldLabel(
                                    showCompany
                                        ? 'Company email address'
                                        : 'Email address',
                                )}
                                <input
                                    type="email"
                                    autoComplete="email"
                                    className={input}
                                    maxLength={255}
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={!!form.errors.email}
                                />
                                <InputError message={form.errors.email} />
                            </label>
                            {!showCompany && (
                                <label className="sm:col-span-2">
                                    {fieldLabel('Contact number', false)}
                                    <input
                                        type="tel"
                                        className={input}
                                        maxLength={30}
                                        placeholder="Optional"
                                        value={form.data.contact_number}
                                        onChange={(event) =>
                                            form.setData(
                                                'contact_number',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!form.errors.contact_number
                                        }
                                    />
                                    <InputError
                                        message={form.errors.contact_number}
                                    />
                                </label>
                            )}
                        </div>
                    </section>

                    {showCompany && (
                        <section className="rounded-2xl border border-moss-100 bg-white p-5 shadow-sm sm:p-6">
                            <div className="mb-5 flex items-center gap-3">
                                <span className="rounded-xl bg-moss-100 p-2 text-moss-700">
                                    <Building2 className="size-5" />
                                </span>
                                <div>
                                    <h2 className="font-semibold text-slate-950">
                                        Company information
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        These details are reviewed by the clinic
                                        and are not treated as verified.
                                    </p>
                                </div>
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <label>
                                    {fieldLabel('Company name', companyAccount)}
                                    <input
                                        className={input}
                                        maxLength={255}
                                        value={form.data.company_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'company_name',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!form.errors.company_name
                                        }
                                    />
                                    <InputError
                                        message={form.errors.company_name}
                                    />
                                </label>
                                <label>
                                    {fieldLabel(
                                        'Representative position / job title',
                                        false,
                                    )}
                                    <input
                                        className={input}
                                        maxLength={100}
                                        value={
                                            form.data.representative_position
                                        }
                                        onChange={(event) =>
                                            form.setData(
                                                'representative_position',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!form.errors
                                                .representative_position
                                        }
                                    />
                                    <InputError
                                        message={
                                            form.errors.representative_position
                                        }
                                    />
                                </label>
                                <label className="sm:col-span-2">
                                    {fieldLabel(
                                        'Company contact number',
                                        companyAccount,
                                    )}
                                    <input
                                        type="tel"
                                        className={input}
                                        maxLength={30}
                                        placeholder="e.g. +63 912 345 6789 or (049) 833-3127"
                                        value={form.data.contact_number}
                                        onChange={(event) =>
                                            form.setData(
                                                'contact_number',
                                                event.target.value,
                                            )
                                        }
                                        aria-invalid={
                                            !!form.errors.contact_number
                                        }
                                    />
                                    <InputError
                                        message={form.errors.contact_number}
                                    />
                                </label>
                            </div>
                        </section>
                    )}

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="mb-5 flex items-center gap-3">
                            <span className="rounded-xl bg-moss-100 p-2 text-moss-700">
                                <Mail className="size-5" />
                            </span>
                            <h2 className="font-semibold text-slate-950">
                                Your message
                            </h2>
                        </div>
                        <div className="space-y-5">
                            <label className="block">
                                {fieldLabel('Subject')}
                                <input
                                    className={input}
                                    maxLength={150}
                                    value={form.data.subject}
                                    onChange={(event) =>
                                        form.setData(
                                            'subject',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={!!form.errors.subject}
                                />
                                <InputError message={form.errors.subject} />
                            </label>
                            <label className="block">
                                {fieldLabel('Message')}
                                <textarea
                                    rows={7}
                                    className={input}
                                    maxLength={5000}
                                    value={form.data.message}
                                    onChange={(event) =>
                                        form.setData(
                                            'message',
                                            event.target.value,
                                        )
                                    }
                                    aria-invalid={!!form.errors.message}
                                />
                                <div className="mt-1 flex justify-between gap-3 text-xs text-slate-500">
                                    <InputError message={form.errors.message} />
                                    <span className="ml-auto">
                                        {form.data.message.length}/5,000
                                    </span>
                                </div>
                            </label>
                            <p className="text-xs leading-5 text-slate-500">
                                Do not include passwords, medical records, or
                                sensitive clinical results.
                            </p>
                        </div>
                    </section>

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                        <Link
                            href={isAuthenticated ? '/my-inquiries' : '/'}
                            className="rounded-xl border border-slate-300 px-5 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </Link>
                        <button
                            disabled={form.processing}
                            className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-moss-700 px-5 py-2.5 font-semibold text-white hover:bg-moss-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {form.processing && (
                                <LoaderCircle className="size-4 animate-spin" />
                            )}
                            {form.processing ? 'Sending...' : 'Send Inquiry'}
                        </button>
                    </div>
                </form>
            </main>
        </>
    );

    if (isAuthenticated) return <AppLayout>{content}</AppLayout>;

    return <div className="min-h-screen bg-slate-50">{content}</div>;
}
