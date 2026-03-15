import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function RadTechDashboard() {
    const { auth } = usePage().props as any;
    
    return (
        <>
            <Head title="RadTech Dashboard" />

            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    RadTech Dashboard
                </h1>
                <p className="text-gray-500 mt-1">
                    Welcome, {auth?.user?.name || 'RadTech'}!
                </p>
            </div>
        </>
    );
}

RadTechDashboard.layout = (page: any) => {
    return <AppLayout>{page}</AppLayout>;
};

