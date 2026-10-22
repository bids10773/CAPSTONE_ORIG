import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import ClinicDashboardLayout from '@/layouts/custom-layout';
import PatientPortalLayout from '@/layouts/patient-portal-layout';
import type { AppLayoutProps } from '@/types';

type ToastProps = {
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
    };
    errors?: Record<string, string>;
};

function showToastMessages(props: ToastProps) {
    if (props.flash?.success) {
        toast.success(props.flash.success);
    }

    const validationError = Object.values(props.errors ?? {}).find(
        (message) => typeof message === 'string' && message.length > 0,
    );

    if (props.flash?.error) {
        toast.error(props.flash.error);
    } else if (validationError) {
        toast.error(validationError);
    }

    if (props.flash?.warning) {
        toast.warning(props.flash.warning, { duration: 8000 });
    }
}

export default function AppLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth, flash, errors } = usePage().props as any;
    const successMessage = flash?.success as string | undefined;
    const errorMessage = flash?.error as string | undefined;
    const warningMessage = flash?.warning as string | undefined;
    const validationError = Object.values(errors ?? {}).find(
        (message) => typeof message === 'string' && message.length > 0,
    ) as string | undefined;

    useEffect(() => {
        showToastMessages({
            flash: {
                success: successMessage,
                error: errorMessage,
                warning: warningMessage,
            },
            errors: validationError ? { validationError } : {},
        });
    }, [successMessage, errorMessage, warningMessage, validationError]);

    if (auth?.user?.role === 'patient') {
        return <PatientPortalLayout>{children}</PatientPortalLayout>;
    }

    return (
        <ClinicDashboardLayout breadcrumbs={breadcrumbs}>
            {children}
        </ClinicDashboardLayout>
    );
}
