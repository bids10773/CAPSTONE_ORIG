import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';

import CompanyAccountForm from '@/components/company-account-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Companies', href: '/admin/companies' },
    { title: 'Create account', href: '' },
];
export default function CreateCompany({
    industryTypes,
}: {
    industryTypes: Record<string, string>;
}) {
    return (
        <>
            <Head title="Create Company Account" />
            <main className="mx-auto max-w-5xl p-4 sm:p-6">
                <Link
                    href="/admin/companies"
                    className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-moss-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to companies
                </Link>
                <div className="mb-6">
                    <p className="text-sm font-semibold text-moss-700">
                        Company management
                    </p>
                    <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                        Create company account
                    </h1>
                    <p className="mt-2 text-slate-600">
                        Add only the business details needed to manage
                        healthcare services and portal access.
                    </p>
                </div>
                <CompanyAccountForm industryTypes={industryTypes} />
            </main>
        </>
    );
}
CreateCompany.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
