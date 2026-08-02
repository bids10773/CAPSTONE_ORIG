import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Mail } from 'lucide-react';

import CompanyAccountForm from '@/components/company-account-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Companies', href: '/admin/companies' },
    { title: 'Edit account', href: '' },
];
export default function EditCompany({ company, industryTypes }: any) {
    const pending = company.account?.[0]?.must_change_password;
    return (
        <>
            <Head title={`Edit ${company.company_name}`} />
            <main className="mx-auto max-w-5xl p-4 sm:p-6">
                <Link
                    href="/admin/companies"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-moss-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to companies
                </Link>
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-sm font-semibold text-moss-700">
                            Company management
                        </p>
                        <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                            Edit company account
                        </h1>
                        <p className="mt-2 text-slate-600">
                            Account and contact changes stay synchronized with
                            the company login.
                        </p>
                    </div>
                    {pending && (
                        <button
                            onClick={() =>
                                router.post(
                                    `/admin/companies/${company.id}/resend-invitation`,
                                )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-moss-300 bg-white px-4 py-2.5 font-semibold text-moss-800 hover:bg-moss-50"
                        >
                            <Mail className="h-4 w-4" />
                            Resend credentials
                        </button>
                    )}
                </div>
                <CompanyAccountForm
                    company={company}
                    industryTypes={industryTypes}
                />
            </main>
        </>
    );
}
EditCompany.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
