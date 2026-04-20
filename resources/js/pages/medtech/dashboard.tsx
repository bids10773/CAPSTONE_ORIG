import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'MedTech Dashboard', href: "" },
];

export default function MedTechDashboard() {
    const { auth } = usePage().props as any;
    
    return (
        <>
            <Head title="MedTech Dashboard" />

            <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900">
                     Welcome, Med Tech {auth?.user?.name || 'MedTech'}!
                </h1>
                <p className="text-gray-500 mt-1">Here's what's happening with your appointments today</p>
            </div>
        </>
    );
}

MedTechDashboard.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};

