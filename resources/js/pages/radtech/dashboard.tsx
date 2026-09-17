import { Head, usePage } from '@inertiajs/react';
import { ScanLine } from 'lucide-react';
import { ClinicalStaffDashboard } from '@/components/clinical-staff-dashboard';
import type { ClinicalDashboardAppointment } from '@/components/clinical-staff-dashboard';
import type { OnsiteOverview } from '@/components/onsite-overview-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'RadTech Dashboard', href: '' },
];

interface Props {
    completedScans: number;
    pendingScans: number;
    todayScans: number;
    onsiteSummary: OnsiteOverview;
    pendingAppointments: ClinicalDashboardAppointment[];
}

export default function RadTechDashboard({
    completedScans,
    pendingScans,
    todayScans,
    onsiteSummary,
    pendingAppointments,
}: Props) {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="RadTech Dashboard" />
            <ClinicalStaffDashboard
                role="RadTech"
                name={auth?.user?.name ?? 'RadTech'}
                description="Track X-ray requests and prepare the next patient for imaging."
                icon={ScanLine}
                todayCount={todayScans}
                todayLabel={
                    todayScans === 1
                        ? 'scan in queue today'
                        : 'scans in queue today'
                }
                pendingCount={pendingScans}
                pendingLabel="Pending scans"
                completedCount={completedScans}
                completedLabel="Completed appointments today"
                appointments={pendingAppointments}
                appointmentsTitle="Upcoming scans"
                emptyMessage="No pending X-ray requests."
                actionTitle="X-ray requests"
                actionLabel="Review scans"
                appointmentsHref="/radtech/appointments"
                onsiteHref="/radtech/onsite-events"
                onsiteSummary={onsiteSummary}
            />
        </>
    );
}

RadTechDashboard.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
