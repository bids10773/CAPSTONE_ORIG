import { Head, usePage } from '@inertiajs/react';
import { Activity, FlaskConical } from 'lucide-react';
import { ClinicalStaffDashboard } from '@/components/clinical-staff-dashboard';
import type { ClinicalDashboardAppointment } from '@/components/clinical-staff-dashboard';
import type { OnsiteOverview } from '@/components/onsite-overview-card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'MedTech Dashboard', href: '' },
];

interface Props {
    completedTests: number;
    pendingTests: number;
    labCapacity: string;
    todayCount: number;
    onsiteSummary: OnsiteOverview;
    pendingAppointments: ClinicalDashboardAppointment[];
}

export default function MedTechDashboard({
    completedTests,
    pendingTests,
    labCapacity,
    todayCount,
    onsiteSummary,
    pendingAppointments,
}: Props) {
    const { auth } = usePage().props as any;

    return (
        <>
            <Head title="MedTech Dashboard" />
            <ClinicalStaffDashboard
                role="MedTech"
                name={auth?.user?.name ?? 'MedTech'}
                description="Review laboratory requests and keep diagnostic results moving."
                icon={FlaskConical}
                todayCount={todayCount}
                todayLabel={
                    todayCount === 1
                        ? 'patient for lab today'
                        : 'patients for lab today'
                }
                pendingCount={pendingTests}
                pendingLabel="Pending lab tests"
                completedCount={completedTests}
                completedLabel="Completed appointments today"
                appointments={pendingAppointments}
                appointmentsTitle="Upcoming lab requests"
                emptyMessage="No pending lab tests."
                actionTitle="Laboratory requests"
                actionLabel="Review requests"
                appointmentsHref="/medtech/appointments"
                onsiteHref="/medtech/onsite-events"
                onsiteSummary={onsiteSummary}
                extraStat={{
                    label: 'Lab workload',
                    value: labCapacity,
                    icon: Activity,
                }}
            />
        </>
    );
}

MedTechDashboard.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);
