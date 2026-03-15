import ClinicDashboardLayout from '@/layouts/custom-layout';
import type { AppLayoutProps } from '@/types';

export default function AppLayout({ children, breadcrumbs = [] }: AppLayoutProps) {
    return (
        <ClinicDashboardLayout breadcrumbs={breadcrumbs}>
            {children}
        </ClinicDashboardLayout>
    );
}
