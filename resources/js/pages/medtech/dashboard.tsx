import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function MedTechDashboard() {
    const { auth } = usePage().props as any;
    
    return (
        <>
            <Head title="MedTech Dashboard" />

            <div className="p-6">
                <h1 className="text-2xl font-bold text-gray-900">
                    MedTech Dashboard
                </h1>
                <p className="text-gray-500 mt-1">
                    Welcome, {auth?.user?.name || 'MedTech'}!
                </p>
            </div>
        </>
    );
}

MedTechDashboard.layout = (page: any) => {
    return <AppLayout>{page}</AppLayout>;
};

