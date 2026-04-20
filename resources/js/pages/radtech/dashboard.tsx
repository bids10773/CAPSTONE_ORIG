import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Radtech Dashboard', href: "" },
];

export default function RadTechDashboard() {
    const { auth } = usePage().props as any;
    
    return (
        <>
            <Head title="RadTech Dashboard" />

            <div className="p-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Welcome, Rad Tech {auth?.user?.name || 'RadTech'}!
                </h1>
                <p className="text-gray-500 mt-1">Here's what's happening with your appointments today</p>
            </div>
        </>
    );
}

RadTechDashboard.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};

