import ClinicDashboardLayout from '@/layouts/custom-layout';
import type { AppLayoutProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    const { flash } = usePage().props as any;
const lastMessage = useRef<string | null>(null);

useEffect(() => {
    if (!flash) return;

    if (flash.success && lastMessage.current !== flash.success) {
        toast.success(flash.success);
        lastMessage.current = flash.success;
    }

    if (flash.error && lastMessage.current !== flash.error) {
        toast.error(flash.error);
        lastMessage.current = flash.error;
    }
}, [flash]);

    return (
        <ClinicDashboardLayout breadcrumbs={breadcrumbs}>
            {children}
            <Toaster position="top-right" richColors />
        </ClinicDashboardLayout>
    );
}
