import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Pencil } from 'lucide-react';
import { useSyncExternalStore } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { LicenseProofDialog } from '@/components/license-proof-dialog';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

type StaffMember = {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    email: string;
    contact: string | null;
    sex: string | null;
    role: string;
    license_no: string | null;
    specialization: string | null;
    is_active: boolean;
    created_at: string;
    license_verification_status: string | null;
    license_verified_at: string | null;
    license_rejection_reason: string | null;
    has_license_document_front: boolean;
    has_license_document_back: boolean;
    signature_url: string | null;
};

function formatDate(value: string | null) {
    return value
        ? new Date(value).toLocaleDateString('en-PH', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              timeZone: 'Asia/Manila',
          })
        : 'Not recorded';
}

function formatTime(value: string) {
    const [hour, minute] = value.split(':').map(Number);
    return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
}

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="min-w-0">
            <dt className="text-sm text-muted-foreground">{label}</dt>
            <dd className="mt-1 font-medium wrap-anywhere whitespace-pre-wrap">
                {value || 'Not recorded'}
            </dd>
        </div>
    );
}

export default function ShowStaff({
    staff,
    roles,
    doctorAvailability,
}: {
    staff: StaffMember;
    roles: Record<string, string>;
    doctorAvailability: { day: string; start: string; end: string }[] | null;
}) {
    const canUseDocument = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false,
    );
    const name = [staff.first_name, staff.middle_name, staff.last_name]
        .filter(Boolean)
        .join(' ');
    const clinical = ['doctor', 'medtech', 'radtech'].includes(staff.role);
    const licenseStatus =
        {
            not_submitted: 'Not submitted',
            pending: 'Pending admin review',
            verified: 'Verified',
            rejected: 'Rejected',
        }[staff.license_verification_status ?? 'not_submitted'] ??
        'Not submitted';

    return (
        <>
            <Head title={`${name} — Staff details`} />
            {canUseDocument &&
                createPortal(
                    <Button
                        asChild
                        className="fixed right-4 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-40 h-12 gap-2 rounded-full px-6 shadow-lg sm:right-6"
                    >
                        <Link href={`/admin/staff/${staff.id}/edit`}>
                            <Pencil className="size-4" /> Edit staff
                        </Link>
                    </Button>,
                    document.body,
                )}
            <div className="mx-auto max-w-6xl space-y-6 p-4 pb-28 sm:p-6 sm:pb-28 lg:p-8 lg:pb-28">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <Button asChild variant="ghost">
                        <Link href="/admin/staff">
                            <ArrowLeft className="size-4" /> Back to staff
                        </Link>
                    </Button>
                </div>
                <div
                    className={`grid gap-6 ${staff.role === 'doctor' ? 'lg:grid-cols-2' : ''}`}
                >
                    <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
                            <div className="min-w-0">
                                <h1 className="text-2xl font-bold wrap-anywhere">
                                    {name}
                                </h1>
                                <p className="mt-1 text-muted-foreground">
                                    {roles[staff.role] ?? staff.role}
                                </p>
                            </div>
                            <span
                                className={`rounded-full px-3 py-1 text-sm font-semibold ${staff.is_active ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200' : 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200'}`}
                            >
                                {staff.is_active ? 'Active' : 'Inactive'}
                            </span>
                        </div>
                        <h2 className="mt-6 text-lg font-semibold">
                            Profile information
                        </h2>
                        <dl
                            className={`mt-4 grid gap-6 sm:grid-cols-2 ${staff.role === 'doctor' ? '' : 'lg:grid-cols-3'}`}
                        >
                            <Detail label="Email address" value={staff.email} />
                            <Detail
                                label="Contact number"
                                value={staff.contact}
                            />
                            <Detail
                                label="Sex"
                                value={
                                    staff.sex
                                        ? staff.sex.charAt(0).toUpperCase() +
                                          staff.sex.slice(1).toLowerCase()
                                        : null
                                }
                            />
                            <Detail
                                label="Specialization"
                                value={staff.specialization}
                            />
                            <Detail
                                label="Account created"
                                value={formatDate(staff.created_at)}
                            />
                        </dl>
                    </section>
                    {staff.role === 'doctor' && (
                        <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        Doctor availability
                                    </h2>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Current weekly schedule · Philippine
                                        time
                                    </p>
                                </div>
                                <Button asChild variant="outline">
                                    <Link
                                        href={`/admin/doctor-availability?doctor_id=${staff.id}`}
                                    >
                                        Manage availability
                                    </Link>
                                </Button>
                            </div>
                            {!doctorAvailability?.length && (
                                <p className="mt-4 text-sm text-muted-foreground">
                                    No availability has been set.
                                </p>
                            )}
                            <dl className="mt-5 divide-y divide-border">
                                {Object.entries({
                                    mon: 'Monday',
                                    tue: 'Tuesday',
                                    wed: 'Wednesday',
                                    thu: 'Thursday',
                                    fri: 'Friday',
                                }).map(([day, label]) => {
                                    const periods = (doctorAvailability ?? [])
                                        .filter((period) => period.day === day)
                                        .sort((a, b) =>
                                            a.start.localeCompare(b.start),
                                        );
                                    return (
                                        <div
                                            key={day}
                                            className="grid gap-1 py-3 first:pt-0 last:pb-0 sm:grid-cols-[7rem_minmax(0,1fr)]"
                                        >
                                            <dt className="font-medium">
                                                {label}
                                            </dt>
                                            <dd className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                                                {periods.length
                                                    ? periods.map((period) => (
                                                          <span
                                                              key={`${period.start}-${period.end}`}
                                                          >
                                                              {formatTime(
                                                                  period.start,
                                                              )}{' '}
                                                              –{' '}
                                                              {formatTime(
                                                                  period.end,
                                                              )}
                                                          </span>
                                                      ))
                                                    : 'Not scheduled'}
                                            </dd>
                                        </div>
                                    );
                                })}
                            </dl>
                        </section>
                    )}
                </div>
                <div className="grid items-start gap-6 lg:grid-cols-2">
                    <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                        <h2 className="text-lg font-semibold">
                            Professional license
                        </h2>
                        {clinical ? (
                            <>
                                <dl className="my-5 grid gap-5 sm:grid-cols-2">
                                    <Detail
                                        label="License number"
                                        value={staff.license_no}
                                    />
                                    <Detail
                                        label="Verification status"
                                        value={licenseStatus}
                                    />
                                    <Detail
                                        label="Verified on"
                                        value={formatDate(
                                            staff.license_verified_at,
                                        )}
                                    />
                                    {staff.license_verification_status ===
                                        'rejected' && (
                                        <Detail
                                            label="Rejection reason"
                                            value={
                                                staff.license_rejection_reason
                                            }
                                        />
                                    )}
                                </dl>
                                {staff.has_license_document_front ||
                                staff.has_license_document_back ? (
                                    <LicenseProofDialog
                                        staffId={staff.id}
                                        name={name}
                                        licenseNumber={staff.license_no}
                                    >
                                        <p className="text-sm text-muted-foreground">
                                            To update verification, open Edit
                                            staff.
                                        </p>
                                    </LicenseProofDialog>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No license proof uploaded.
                                    </p>
                                )}
                            </>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                                A professional license is not required for
                                receptionists.
                            </p>
                        )}
                    </section>
                    <section className="min-w-0 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                        <h2 className="text-lg font-semibold">
                            Electronic signature
                        </h2>
                        {staff.signature_url ? (
                            <div className="mt-4 rounded-xl border border-border bg-white p-4">
                                <img
                                    src={staff.signature_url}
                                    alt={`${name}'s electronic signature`}
                                    className="mx-auto max-h-40 max-w-full object-contain"
                                />
                            </div>
                        ) : (
                            <p className="mt-3 text-sm text-muted-foreground">
                                No electronic signature uploaded.
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </>
    );
}

ShowStaff.layout = (page: ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Staff Management', href: '/admin/staff' },
            { title: 'Staff details', href: '' },
        ]}
    >
        {page}
    </AppLayout>
);
