import { usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import ClinicDashboardLayout from '@/layouts/custom-layout';
import PatientPortalLayout from '@/layouts/patient-portal-layout';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth, flash, errors } = usePage().props as any;
    const lastMessage = useRef<string | null>(null);

    useEffect(() => {
        if (!flash && !errors) return;

        // ✅ SUCCESS
        if (flash?.success && lastMessage.current !== flash.success) {
            toast.success(flash.success, {
                id: `flash-success-${flash.success}`,
            });
            lastMessage.current = flash.success;
        }

        // ✅ FLASH ERROR
        if (flash?.error && lastMessage.current !== flash.error) {
            toast.error(flash.error, {
                id: `flash-error-${flash.error}`,
            });
            lastMessage.current = flash.error;
        }

        // 🔥 LOGIN ERROR (IMPORTANT FIX)
        if (errors?.email && lastMessage.current !== errors.email) {
            toast.error(errors.email, {
                id: `validation-email-${errors.email}`,
            });
            lastMessage.current = errors.email;
        }
    }, [flash, errors]);

    if (auth?.user?.role === 'patient') {
        return <PatientPortalLayout>{children}</PatientPortalLayout>;
    }

    return (
        <ClinicDashboardLayout breadcrumbs={breadcrumbs}>
            {children}
        </ClinicDashboardLayout>
    );
}
