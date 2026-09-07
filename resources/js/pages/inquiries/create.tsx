import { Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    ArrowLeft,
    Building2,
    Clock3,
    LoaderCircle,
    Mail,
    MapPin,
    MessageSquare,
    Phone,
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

function ContactItem({
    icon: Icon,
    label,
    value,
}: {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    label: string;
    value: string;
}) {
    return (
        <div className="flex gap-3.5">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-moss-200">
                <Icon size={18} aria-hidden="true" />
            </span>
            <div>
                <dt className="text-xs font-bold tracking-wide text-moss-200 uppercase">
                    {label}
                </dt>
                <dd className="mt-1 text-sm leading-6 font-semibold text-white">
                    {value}
                </dd>
            </div>
        </div>
    );
}

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
            <main
                className="relative isolate min-h-screen overflow-hidden bg-moss-900 bg-cover bg-fixed bg-center text-white"
                style={{
                    backgroundImage: "url('/images/lmic6.png')",
                }}
            >
                <div
                    className="absolute inset-0 -z-10 bg-moss-950/75"
                    aria-hidden="true"
                />
                <div
                    className="absolute inset-0 -z-10 bg-gradient-to-r from-moss-950/50 via-transparent to-moss-950/30"
                    aria-hidden="true"
                />
                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
                    <div className="mb-6 flex items-center justify-between gap-4">
                        <Link
                            href={isAuthenticated ? '/my-inquiries' : '/'}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
                        >
                            <ArrowLeft className="size-4" />
                            {isAuthenticated ? 'My inquiries' : 'Back to home'}
                        </Link>
                        {!isAuthenticated && (
                            <Link
                                href="/login"
                                className="text-sm font-semibold text-moss-100 transition hover:text-white"
                            >
                                Sign in
                            </Link>
                        )}
                    </div>

                    {page.props.flash?.success && (
                        <div
                            role="status"
                            className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800"
                        >
                            {page.props.flash.success}
                        </div>
                    )}

                    <div className="grid items-start gap-7 lg:grid-cols-[0.72fr_1.28fr]">
                        <aside className="rounded-[1.5rem] border border-white/20 bg-moss-950/80 p-6 shadow-[0_20px_55px_rgba(12,25,15,.22)] backdrop-blur-sm sm:p-8 lg:sticky lg:top-8">
                            <p className="text-xs font-bold tracking-[.18em] text-moss-200 uppercase">
                                Contact · Send inquiry
                            </p>
                            <h1 className="mt-4 text-3xl font-extrabold tracking-[-.04em] text-white sm:text-4xl">
                                How can we help?
                            </h1>
                            <p className="mt-4 text-sm leading-7 text-white/75">
                                Ask about clinic services, appointments, or a
                                company partnership. Our team will review your
                                message and contact you through the details you
                                provide.
                            </p>

                            <dl className="mt-8 space-y-6 border-t border-white/15 pt-7">
                                <ContactItem
                                    icon={MapPin}
                                    label="Clinic address"
                                    value="2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna"
                                />
                                <ContactItem
                                    icon={Phone}
                                    label="Contact number"
                                    value="+63 922 889 6850"
                                />
                                <ContactItem
                                    icon={Mail}
                                    label="Email"
                                    value="livingmythindustrialclinic@gmail.com"
                                />
                                <ContactItem
                                    icon={Clock3}
                                    label="Clinic hours"
                                    value="Monday–Friday, 8:00 AM–5:00 PM"
                                />
                            </dl>
                        </aside>

                        <form
                            onSubmit={submit}
                            className="space-y-6"
                            noValidate
                        >
                            <section className="rounded-[1.5rem] border border-white/25 bg-white p-5 shadow-[0_20px_55px_rgba(12,25,15,.28)] sm:p-6">
                                <div className="mb-5 flex items-center gap-3">
                                    <span className="rounded-xl bg-moss-100 p-2 text-moss-700">
                                        <MessageSquare className="size-5" />
                                    </span>
                                    <div>
                                        <h2 className="font-semibold text-slate-950">
                                            Inquiry details
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Choose the category that best
                                            matches your concern.
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
                                            aria-invalid={
                                                !!form.errors.category
                                            }
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
                                        <InputError
                                            message={form.errors.category}
                                        />
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
                                            message={
                                                form.errors.sender_first_name
                                            }
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
                                            message={
                                                form.errors.sender_middle_name
                                            }
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
                                            message={
                                                form.errors.sender_last_name
                                            }
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
                                        <InputError
                                            message={form.errors.email}
                                        />
                                    </label>
                                    {!showCompany && (
                                        <label className="sm:col-span-2">
                                            {fieldLabel(
                                                'Contact number',
                                                false,
                                            )}
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
                                                message={
                                                    form.errors.contact_number
                                                }
                                            />
                                        </label>
                                    )}
                                </div>
                            </section>

                            {showCompany && (
                                <section className="rounded-[1.5rem] border border-white/25 bg-white p-5 shadow-[0_20px_55px_rgba(12,25,15,.28)] sm:p-6">
                                    <div className="mb-5 flex items-center gap-3">
                                        <span className="rounded-xl bg-moss-100 p-2 text-moss-700">
                                            <Building2 className="size-5" />
                                        </span>
                                        <div>
                                            <h2 className="font-semibold text-slate-950">
                                                Company information
                                            </h2>
                                            <p className="text-xs text-slate-500">
                                                These details are reviewed by
                                                the clinic and are not treated
                                                as verified.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <label>
                                            {fieldLabel(
                                                'Company name',
                                                companyAccount,
                                            )}
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
                                                message={
                                                    form.errors.company_name
                                                }
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
                                                    form.data
                                                        .representative_position
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
                                                    form.errors
                                                        .representative_position
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
                                                message={
                                                    form.errors.contact_number
                                                }
                                            />
                                        </label>
                                    </div>
                                </section>
                            )}

                            <section className="rounded-[1.5rem] border border-white/25 bg-white p-5 shadow-[0_20px_55px_rgba(12,25,15,.28)] sm:p-6">
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
                                        <InputError
                                            message={form.errors.subject}
                                        />
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
                                            <InputError
                                                message={form.errors.message}
                                            />
                                            <span className="ml-auto">
                                                {form.data.message.length}/5,000
                                            </span>
                                        </div>
                                    </label>
                                    <p className="text-xs leading-5 text-slate-500">
                                        Do not include passwords, medical
                                        records, or sensitive clinical results.
                                    </p>
                                </div>
                            </section>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Link
                                    href={
                                        isAuthenticated ? '/my-inquiries' : '/'
                                    }
                                    className="rounded-xl border border-white/40 px-5 py-2.5 text-center font-semibold text-white transition hover:bg-white/10"
                                >
                                    Cancel
                                </Link>
                                <button
                                    disabled={form.processing}
                                    className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 font-semibold text-moss-900 shadow-lg transition hover:bg-moss-50 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {form.processing && (
                                        <LoaderCircle className="size-4 animate-spin" />
                                    )}
                                    {form.processing
                                        ? 'Sending...'
                                        : 'Send Inquiry'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </>
    );

    if (isAuthenticated) return <AppLayout>{content}</AppLayout>;

    return <div className="min-h-screen bg-slate-50">{content}</div>;
}
