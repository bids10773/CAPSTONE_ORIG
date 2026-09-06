import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, Edit, Mail, MapPin, Phone } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Companies', href: '/admin/companies' },
    { title: 'Details', href: '' },
];
export default function ShowCompany({ company }: any) {
    const account = company.account?.[0];
    return (
        <>
            <Head title={company.company_name} />
            <main className="mx-auto max-w-5xl p-4 sm:p-6">
                <Link
                    href="/admin/companies"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to companies
                </Link>
                <section className="overflow-hidden rounded-2xl border border-moss-100 bg-white shadow-sm">
                    <header className="flex flex-col gap-4 bg-moss-700 p-6 text-white sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            {company.logo_path ? (
                                <img
                                    src={`/storage/${company.logo_path}`}
                                    className="h-16 w-16 rounded-xl bg-white object-contain p-1"
                                    alt=""
                                />
                            ) : (
                                <span className="rounded-xl bg-white/15 p-4">
                                    <Building2 />
                                </span>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {company.company_name}
                                </h1>
                                <p className="text-moss-100">
                                    {company.industry_type}
                                </p>
                            </div>
                        </div>
                        <span className="self-start rounded-full bg-white/15 px-3 py-1 text-sm font-semibold capitalize">
                            {company.status}
                        </span>
                    </header>
                    <div className="grid gap-5 p-6 sm:grid-cols-2">
                        <Info
                            icon={<Building2 />}
                            label="Representative"
                            value={account?.name ?? 'Not provided'}
                        />
                        <Info
                            icon={<Building2 />}
                            label="Position / job title"
                            value={account?.position ?? 'Not provided'}
                        />
                        <Info
                            icon={<Mail />}
                            label="Official email"
                            value={company.email}
                        />
                        <Info
                            icon={<Phone />}
                            label="Contact number"
                            value={company.contact_number}
                        />
                        <div className="sm:col-span-2">
                            <Info
                                icon={<MapPin />}
                                label="Business address"
                                value={company.address}
                            />
                        </div>
                    </div>
                    <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-100 p-5">
                        <button
                            onClick={() =>
                                router.post(
                                    `/admin/companies/${company.id}/resend-invitation`,
                                )
                            }
                            disabled={company.status !== 'active'}
                            className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 font-semibold disabled:opacity-50"
                        >
                            <Mail className="h-4 w-4" />
                            Resend credentials
                        </button>
                        <Link
                            href={`/admin/companies/${company.id}/edit`}
                            className="inline-flex items-center gap-2 rounded-xl bg-moss-600 px-4 py-2 font-semibold text-white"
                        >
                            <Edit className="h-4 w-4" />
                            Edit company
                        </Link>
                    </footer>
                </section>
            </main>
        </>
    );
}
function Info({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value?: string | null;
}) {
    return (
        <div className="flex gap-3 text-slate-700">
            <span className="mt-0.5 text-moss-700 [&>svg]:h-5 [&>svg]:w-5">
                {icon}
            </span>
            <div>
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                    {label}
                </p>
                <p className="mt-1 font-medium">{value || 'Not provided'}</p>
            </div>
        </div>
    );
}
ShowCompany.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
