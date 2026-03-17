import ClinicDashboardLayout from '@/layouts/custom-layout';
import type { AppLayoutProps } from '@/types';
import { Toaster } from 'sonner';

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    return (
        <ClinicDashboardLayout breadcrumbs={breadcrumbs}>
            {children}
            <Toaster position="top-right" richColors />
        </ClinicDashboardLayout>
    );
}
