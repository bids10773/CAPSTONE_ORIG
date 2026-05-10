import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

export default function ReceptionistDashboard() {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="Receptionist Dashboard" />
            <div className="p-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Good day, {auth.user.first_name}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Receptionist · Info Staff
                </p>
            </div>
        </>
    );
}

ReceptionistDashboard.layout = (page: any) => <AppLayout>{page}</AppLayout>;