import { Link, usePage } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import ClinicDashboardLayout from '@/layouts/custom-layout';
import PatientPortalLayout from '@/layouts/patient-portal-layout';
import type { AppLayoutProps } from '@/types';

type ToastProps = {
    toastEventId: string;
    flash?: {
        success?: string;
        error?: string;
        warning?: string;
    };
    errors?: Record<string, string>;
};

function showToastMessages(props: ToastProps) {
    if (props.flash?.success) {
        toast.success(props.flash.success, {
            id: `${props.toastEventId}:success`,
        });
    }

    const validationError = Object.values(props.errors ?? {}).find(
        (message) => typeof message === 'string' && message.length > 0,
    );

    if (props.flash?.error) {
        toast.error(props.flash.error, {
            id: `${props.toastEventId}:error`,
        });
    } else if (validationError) {
        toast.error(validationError, {
            id: `${props.toastEventId}:validation`,
        });
    }

    if (props.flash?.warning) {
        toast.warning(props.flash.warning, {
            id: `${props.toastEventId}:warning`,
            duration: 8000,
        });
    }
}

export default function AppLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth, flash, errors, toastEventId } = usePage().props as any;
    const successMessage = flash?.success as string | undefined;
    const errorMessage = flash?.error as string | undefined;
    const warningMessage = flash?.warning as string | undefined;
    const validationError = Object.values(errors ?? {}).find(
        (message) => typeof message === 'string' && message.length > 0,
    ) as string | undefined;

    useEffect(() => {
        showToastMessages({
            toastEventId,
            flash: {
                success: successMessage,
                error: errorMessage,
                warning: warningMessage,
            },
            errors: validationError ? { validationError } : {},
        });
    }, [
        toastEventId,
        successMessage,
        errorMessage,
        warningMessage,
        validationError,
    ]);

    if (auth?.user?.role === 'patient') {
        return <PatientPortalLayout>{children}</PatientPortalLayout>;
    }

    return (
        <ClinicDashboardLayout breadcrumbs={breadcrumbs}>
            {auth?.requiresLicenseVerification && (
                <div
                    role="status"
                    className="mx-4 mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 sm:mx-6 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200"
                >
                    An administrator must verify your professional license
                    before you can conduct medical examinations.{' '}
                    <Link
                        href="/settings/profile"
                        className="font-semibold underline underline-offset-4"
                    >
                        Review your license details
                    </Link>
                </div>
            )}
            {children}
        </ClinicDashboardLayout>
    );
}
