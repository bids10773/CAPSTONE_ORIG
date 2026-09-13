import { Head, Link } from '@inertiajs/react';
import { ChevronLeft } from 'lucide-react';

import CompanyAccountForm from '@/components/company-account-form';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Companies', href: '/admin/companies' },
    { title: 'Create account', href: '' },
];
export default function CreateCompany({
    industryTypes,
    prefill,
    sourceInquiryId,
}: {
    industryTypes: Record<string, string>;
    prefill?: Record<string, string | null> | null;
    sourceInquiryId?: number | null;
}) {
    return (
        <>
            <Head title="Create Company Account" />
            <main className="w-full max-w-7xl overflow-x-hidden p-4 sm:p-6">
                <div className="mb-6 flex min-w-0 flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <Link
                        href="/admin/companies"
                        className="relative inline-flex h-12 w-36 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-base font-semibold text-slate-600 shadow-sm transition-colors hover:border-moss-200 hover:bg-moss-50 hover:text-moss-700"
                    >
                        <ChevronLeft
                            className="absolute left-4 h-7 w-7"
                            strokeWidth={2.25}
                        />
                        Back
                    </Link>
                    <div className="min-w-0 text-right">
                        <h1 className="text-2xl font-bold break-words text-slate-950 sm:text-3xl">
                            Create company account
                        </h1>
                        <p className="mt-2 break-words text-slate-600">
                            Add only the business details needed to manage
                            healthcare services and portal access.
                        </p>
                    </div>
                </div>
                <CompanyAccountForm
                    industryTypes={industryTypes}
                    prefill={prefill ?? undefined}
                    sourceInquiryId={sourceInquiryId}
                />
            </main>
        </>
    );
}
CreateCompany.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
