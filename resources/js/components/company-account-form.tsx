import { Link, useForm } from '@inertiajs/react';
import {
    Building2,
    LoaderCircle,
    ShieldCheck,
    Upload,
    UserRound,
} from 'lucide-react';

import InputError from '@/components/input-error';

type Company = {
    id: number;
    company_name: string;
    email: string;
    contact_number: string;
    address: string;
    industry_type: string;
    logo_path?: string | null;
    status: 'active' | 'inactive';
    account?: Array<{
        first_name: string;
        middle_name?: string | null;
        last_name: string;
        position?: string | null;
    }>;
};

type CompanyPrefill = Partial<{
    company_name: string | null;
    email: string | null;
    contact_number: string | null;
    representative_first_name: string | null;
    representative_middle_name: string | null;
    representative_last_name: string | null;
    representative_position: string | null;
}>;

export default function CompanyAccountForm({
    company,
    industryTypes,
    prefill,
    sourceInquiryId,
}: {
    company?: Company;
    industryTypes: Record<string, string>;
    prefill?: CompanyPrefill | null;
    sourceInquiryId?: number | null;
}) {
    const editing = Boolean(company);
    const account = company?.account?.[0];
    const form = useForm({
        company_name: company?.company_name ?? prefill?.company_name ?? '',
        email: company?.email ?? prefill?.email ?? '',
        contact_number:
            company?.contact_number ?? prefill?.contact_number ?? '',
        address: company?.address ?? '',
        industry_type: company?.industry_type ?? '',
        status: company?.status ?? 'active',
        representative_first_name:
            account?.first_name ?? prefill?.representative_first_name ?? '',
        representative_middle_name:
            account?.middle_name ?? prefill?.representative_middle_name ?? '',
        representative_last_name:
            account?.last_name ?? prefill?.representative_last_name ?? '',
        representative_position:
            account?.position ?? prefill?.representative_position ?? '',
        source_inquiry_id: sourceInquiryId ?? null,
        logo: null as File | null,
        remove_logo: false,
        _method: editing ? 'put' : 'post',
    });
    const input =
        'mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-moss-600 focus:ring-4 focus:ring-moss-500/15';
    const submit = (event: React.FormEvent) => {
        event.preventDefault();
        form.post(
            editing ? `/admin/companies/${company!.id}` : '/admin/companies',
            { forceFormData: true },
        );
    };
    const field = (
        name: keyof typeof form.errors,
        label: string,
        required = true,
    ) => (
        <label
            htmlFor={name}
            className="mb-1 block text-sm font-semibold text-slate-700"
        >
            {label}
            {required && (
                <span className="ml-1 text-red-600" aria-hidden="true">
                    *
                </span>
            )}
        </label>
    );

    return (
        <form onSubmit={submit} className="space-y-6" noValidate>
            <section className="overflow-hidden rounded-2xl border border-moss-100 bg-white shadow-sm">
                <div className="border-b border-moss-100 bg-moss-50/70 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-moss-600 p-2 text-white">
                            <Building2 className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Company information
                            </h2>
                            <p className="text-sm text-slate-600">
                                The company email is used for login and all
                                account notifications.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid gap-5 p-6 md:grid-cols-2">
                    <div>
                        {field('company_name', 'Company name')}
                        <input
                            id="company_name"
                            autoFocus
                            autoComplete="organization"
                            className={input}
                            value={form.data.company_name}
                            onChange={(e) =>
                                form.setData('company_name', e.target.value)
                            }
                            aria-invalid={!!form.errors.company_name}
                        />
                        <InputError message={form.errors.company_name} />
                    </div>
                    <div>
                        {field('email', 'Company email address')}
                        <input
                            id="email"
                            type="email"
                            autoComplete="email"
                            className={input}
                            value={form.data.email}
                            onChange={(e) =>
                                form.setData('email', e.target.value)
                            }
                            placeholder="company@example.com"
                            aria-invalid={!!form.errors.email}
                        />
                        <InputError message={form.errors.email} />
                    </div>
                    <div>
                        {field('contact_number', 'Phone or telephone number')}
                        <input
                            id="contact_number"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            maxLength={30}
                            placeholder="e.g. +63 912 345 6789 or (049) 833-3127"
                            className={input}
                            value={form.data.contact_number}
                            onChange={(e) => {
                                const value = e.target.value;
                                const digitCount =
                                    value.match(/\d/g)?.length ?? 0;
                                if (digitCount <= 15) {
                                    form.setData('contact_number', value);
                                }
                            }}
                            aria-invalid={!!form.errors.contact_number}
                        />
                        <InputError message={form.errors.contact_number} />
                        <p className="mt-1 text-xs text-slate-500">
                            Enter the company mobile number or landline,
                            including the area code when applicable.
                        </p>
                    </div>
                    <div>
                        {field('industry_type', 'Industry type')}
                        <select
                            id="industry_type"
                            className={input}
                            value={form.data.industry_type}
                            onChange={(e) =>
                                form.setData('industry_type', e.target.value)
                            }
                            aria-invalid={!!form.errors.industry_type}
                        >
                            <option value="">Select an industry</option>
                            {Object.entries(industryTypes).map(
                                ([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ),
                            )}
                        </select>
                        <InputError message={form.errors.industry_type} />
                    </div>
                    <div className="md:col-span-2">
                        {field('address', 'Complete business address')}
                        <textarea
                            id="address"
                            rows={3}
                            autoComplete="street-address"
                            className={input}
                            value={form.data.address}
                            onChange={(e) =>
                                form.setData('address', e.target.value)
                            }
                            aria-invalid={!!form.errors.address}
                        />
                        <InputError message={form.errors.address} />
                    </div>
                    <div>
                        {field('status', 'Account status')}
                        <select
                            id="status"
                            className={input}
                            value={form.data.status}
                            onChange={(e) =>
                                form.setData(
                                    'status',
                                    e.target.value as 'active' | 'inactive',
                                )
                            }
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                        <InputError message={form.errors.status} />
                    </div>
                    <div>
                        {field('logo', 'Company logo', false)}
                        <label
                            className={`${input} flex cursor-pointer items-center gap-2 text-sm text-slate-600`}
                        >
                            <Upload className="h-4 w-4" />
                            {form.data.logo?.name ??
                                'Choose JPG, PNG, or WebP (max 2 MB)'}
                            <input
                                id="logo"
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                className="sr-only"
                                onChange={(e) =>
                                    form.setData(
                                        'logo',
                                        e.target.files?.[0] ?? null,
                                    )
                                }
                            />
                        </label>
                        <InputError message={form.errors.logo} />
                        {editing && company?.logo_path && (
                            <label className="mt-2 flex items-center gap-2 text-sm text-slate-600">
                                <input
                                    type="checkbox"
                                    checked={form.data.remove_logo}
                                    onChange={(e) =>
                                        form.setData(
                                            'remove_logo',
                                            e.target.checked,
                                        )
                                    }
                                />{' '}
                                Remove current logo
                            </label>
                        )}
                    </div>
                </div>
            </section>
            <section className="overflow-hidden rounded-2xl border border-moss-100 bg-white shadow-sm">
                <div className="border-b border-moss-100 bg-moss-50/70 px-6 py-5">
                    <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-moss-600 p-2 text-white">
                            <UserRound className="h-5 w-5" />
                        </span>
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                Representative information
                            </h2>
                            <p className="text-sm text-slate-600">
                                This person will use the company portal account.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="grid gap-5 p-6 md:grid-cols-2">
                    <div>
                        {field(
                            'representative_first_name',
                            'Representative first name',
                        )}
                        <input
                            id="representative_first_name"
                            autoComplete="given-name"
                            maxLength={100}
                            className={input}
                            value={form.data.representative_first_name}
                            onChange={(e) =>
                                form.setData(
                                    'representative_first_name',
                                    e.target.value,
                                )
                            }
                            aria-invalid={
                                !!form.errors.representative_first_name
                            }
                        />
                        <InputError
                            message={form.errors.representative_first_name}
                        />
                    </div>
                    <div>
                        {field(
                            'representative_middle_name',
                            'Representative middle name',
                            false,
                        )}
                        <input
                            id="representative_middle_name"
                            autoComplete="additional-name"
                            maxLength={100}
                            className={input}
                            value={form.data.representative_middle_name}
                            onChange={(e) =>
                                form.setData(
                                    'representative_middle_name',
                                    e.target.value,
                                )
                            }
                            aria-invalid={
                                !!form.errors.representative_middle_name
                            }
                        />
                        <InputError
                            message={form.errors.representative_middle_name}
                        />
                    </div>
                    <div>
                        {field(
                            'representative_last_name',
                            'Representative last name',
                        )}
                        <input
                            id="representative_last_name"
                            autoComplete="family-name"
                            maxLength={100}
                            className={input}
                            value={form.data.representative_last_name}
                            onChange={(e) =>
                                form.setData(
                                    'representative_last_name',
                                    e.target.value,
                                )
                            }
                            aria-invalid={
                                !!form.errors.representative_last_name
                            }
                        />
                        <InputError
                            message={form.errors.representative_last_name}
                        />
                    </div>
                    <div>
                        {field(
                            'representative_position',
                            'Position / job title',
                            false,
                        )}
                        <input
                            id="representative_position"
                            autoComplete="organization-title"
                            maxLength={100}
                            className={input}
                            value={form.data.representative_position}
                            onChange={(e) =>
                                form.setData(
                                    'representative_position',
                                    e.target.value,
                                )
                            }
                            aria-invalid={!!form.errors.representative_position}
                        />
                        <InputError
                            message={form.errors.representative_position}
                        />
                    </div>
                </div>
            </section>
            {!editing && (
                <section className="rounded-2xl border border-moss-200 bg-moss-50 p-5">
                    <div className="flex gap-3 text-sm text-moss-900">
                        <ShieldCheck className="h-5 w-5 shrink-0" />
                        <div>
                            <h2 className="font-semibold">Account security</h2>
                            <p className="mt-1">
                                A secure temporary password will be emailed to
                                the company. It expires after 48 hours and must
                                be changed on first login.
                            </p>
                        </div>
                    </div>
                </section>
            )}
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Link
                    href="/admin/companies"
                    className="rounded-xl border border-slate-300 px-5 py-2.5 text-center font-semibold text-slate-700 hover:bg-slate-50"
                >
                    Cancel
                </Link>
                <button
                    disabled={form.processing}
                    className="inline-flex min-w-40 items-center justify-center gap-2 rounded-xl bg-moss-600 px-5 py-2.5 font-semibold text-white hover:bg-moss-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {form.processing && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                    )}
                    {form.processing
                        ? 'Saving…'
                        : editing
                          ? 'Save changes'
                          : 'Create account'}
                </button>
            </div>
        </form>
    );
}
