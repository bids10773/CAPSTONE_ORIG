import ClinicDashboardLayout from '@/layouts/custom-layout';
import type { AppLayoutProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast, Toaster } from 'sonner';

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    const { flash, errors } = usePage().props as any; // ✅ ADD errors
    const lastMessage = useRef<string | null>(null);

    useEffect(() => {
        if (!flash && !errors) return;

        // ✅ SUCCESS
        if (flash?.success && lastMessage.current !== flash.success) {
            toast.success(flash.success);
            lastMessage.current = flash.success;
        }

        // ✅ FLASH ERROR
        if (flash?.error && lastMessage.current !== flash.error) {
            toast.error(flash.error);
            lastMessage.current = flash.error;
        }

        // 🔥 LOGIN ERROR (IMPORTANT FIX)
        if (errors?.email && lastMessage.current !== errors.email) {
            toast.error(errors.email);
            lastMessage.current = errors.email;
        }

    }, [flash, errors]);

    return (
        <ClinicDashboardLayout breadcrumbs={breadcrumbs}>
            {children}
            <Toaster position="top-right" richColors />
        </ClinicDashboardLayout>
    );
}