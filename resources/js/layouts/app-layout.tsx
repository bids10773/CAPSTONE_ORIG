import { router, usePage } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
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
    const initialMessages = useRef<ToastProps>({ flash, errors });

    useEffect(() => {
        showToastMessages(initialMessages.current);

        return router.on('success', (event) => {
            showToastMessages(event.detail.page.props as ToastProps);
        });
    }, []);

    if (auth?.user?.role === 'patient') {
        return <PatientPortalLayout>{children}</PatientPortalLayout>;
    }

    return (
        <ClinicDashboardLayout breadcrumbs={breadcrumbs}>
            {children}
        </ClinicDashboardLayout>
    );
}
