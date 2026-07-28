import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Clock,
    ArrowLeft,
    RotateCcw,
    Save,
    CircleSlash,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctors Availability', href: '/admin/staff' },
];

interface Doctor {
    id: number;
    first_name: string;
    last_name: string;
    specialization: string | null;
    availability: Array<{
        day: string;
        start: string;
        end: string;
    }>;
}

interface Props {
    doctors: Doctor[];
    days: Record<string, string>;
    selectedDoctorId?: number;
}

export default function AdminDoctorAvailability({ doctors, days }: Props) {
    const props = usePage().props as any;
    const queryDoctorId = props.selectedDoctorId || 0;
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
    const [hasChanges, setHasChanges] = useState(false);

    const { data, setData, patch, processing, errors } = useForm({
        doctor_id: 0,
        availability: [] as any[],
    });

    const formatTime = (time: string) => {
        if (!time) return '';

        const [hour, minute] = time.split(':').map(Number);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;

        return `${formattedHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
    };

    useEffect(() => {
        if (doctors.length > 0 && queryDoctorId) {
            const doctor = doctors.find((d) => d.id === queryDoctorId);
            if (doctor) {
                setSelectedDoctor(doctor);
                setData({
                    doctor_id: doctor.id,
                    availability: Array.isArray(doctor.availability)
                        ? doctor.availability
                        : [],
                });
            } else {
                router.visit('/admin/staff');
            }
        }
    }, [doctors, queryDoctorId]);

    if (!selectedDoctor)
        return (
            <div className="flex h-screen animate-pulse items-center justify-center text-muted-foreground">
                Initializing schedule...
            </div>
        );

    const updateSlot = (day: string, field: 'start' | 'end', value: string) => {
        setData(
            'availability',
            data.availability.map((slot) =>
                slot.day === day ? { ...slot, [field]: value } : slot,
            ),
        );

        setHasChanges(true); // ✅ user edited
    };

    const toggleDay = (day: string) => {
        const exists = data.availability.some((slot) => slot.day === day);

        if (exists) {
            setData(
                'availability',
                data.availability.filter((slot) => slot.day !== day),
            );
        } else {
            setData('availability', [
                ...data.availability,
                { day, start: '08:00', end: '17:00' },
            ]);
        }

        setHasChanges(true); // ✅ user changed something
    };

    // Your original Reset logic: Clears availability in the DB
    const resetAvailability = () => {
        if (!selectedDoctor) return;
        if (
            !confirm(
                'Are you sure you want to clear all availability for this doctor? This cannot be undone.',
            )
        )
            return;

        router.patch(
            '/admin/doctor-availability',
            {
                doctor_id: selectedDoctor.id,
                availability: [],
                action: 'clear',
            },
            {
                preserveState: true,
                onSuccess: () => {
                    setData('availability', []);
                    router.reload({ only: ['doctors'] });
                },
            },
        );
    };

    // Revert UI to the last saved state without hitting the DB
    const discardChanges = () => {
        setData(
            'availability',
            Array.isArray(selectedDoctor.availability)
                ? selectedDoctor.availability
                : [],
        );
        toast.info('Changes discarded');
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();

        patch('/admin/doctor-availability', {
            preserveState: true,
            onSuccess: () => {
                setHasChanges(false); // 🔒 lock after saving
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Schedule: ${selectedDoctor.first_name}`} />

            <div className="mx-auto max-w-6xl space-y-8 p-4 md:p-8">
                {/* Header Section */}
                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/staff"
                            className="group flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background transition-all hover:border-primary/30 hover:bg-primary/5"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">
                                {selectedDoctor.first_name}{' '}
                                {selectedDoctor.last_name}
                            </h1>
                            <p className="text-muted-foreground italic">
                                Clinical Availability & Hours
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={discardChanges}
                        >
                            Discard
                        </Button>

                        <Button
                            form="availability-form"
                            disabled={processing || !hasChanges}
                        >
                            {processing
                                ? 'Saving...'
                                : hasChanges
                                  ? 'Save Schedule'
                                  : 'Saved'}
                        </Button>
                    </div>
                </div>

                <form
                    id="availability-form"
                    onSubmit={submit}
                    className="grid grid-cols-1 gap-8 lg:grid-cols-12"
                >
                    {/* Main List */}
                    <div className="space-y-4 lg:col-span-8">
                        {dayOrder.map((dayKey) => {
                            const slot = data.availability.find(
                                (s) => s.day === dayKey,
                            );
                            const isActive = !!slot;

                            return (
                                <div
                                    key={dayKey}
                                    className={cn(
                                        'group relative rounded-xl border-2 p-5 transition-all duration-200',
                                        isActive
                                            ? 'border-primary/40 bg-card shadow-sm'
                                            : 'border-transparent bg-muted/30 opacity-70',
                                    )}
                                >
                                    <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
                                        <div className="flex min-w-[140px] items-center gap-4">
                                            <div
                                                onClick={() =>
                                                    toggleDay(dayKey)
                                                }
                                                className={cn(
                                                    'relative h-6 w-12 cursor-pointer rounded-full transition-colors',
                                                    isActive
                                                        ? 'bg-primary'
                                                        : 'bg-gray-300',
                                                )}
                                            >
                                                <div
                                                    className={cn(
                                                        'absolute top-1 left-1 h-4 w-4 rounded-full bg-white transition-transform',
                                                        isActive
                                                            ? 'translate-x-6'
                                                            : '',
                                                    )}
                                                />
                                            </div>
                                            <Label className="cursor-pointer text-lg font-semibold capitalize">
                                                {days[dayKey]}
                                            </Label>
                                        </div>

                                        {isActive ? (
                                            <div className="flex max-w-xs flex-1 items-center gap-3">
                                                <Input
                                                    type="time"
                                                    value={
                                                        slot?.start || '08:00'
                                                    }
                                                    onChange={(e) =>
                                                        updateSlot(
                                                            dayKey,
                                                            'start',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 bg-background"
                                                />
                                                <span className="font-medium text-muted-foreground">
                                                    to
                                                </span>
                                                <Input
                                                    type="time"
                                                    value={slot?.end || '17:00'}
                                                    onChange={(e) =>
                                                        updateSlot(
                                                            dayKey,
                                                            'end',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="h-10 bg-background"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-muted-foreground italic">
                                                Clinic Closed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Sidebar Summary */}
                    <div className="lg:col-span-4">
                        <Card className="sticky top-8 border-none bg-moss-50/50 ring-1 ring-moss-100">
                            <CardHeader>
                                <CardTitle className="text-xs font-bold tracking-widest text-moss-600 uppercase">
                                    Weekly Summary
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {data.availability.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center gap-2 py-8 text-muted-foreground">
                                        <CircleSlash className="h-8 w-8 opacity-20" />
                                        <p className="text-sm">
                                            No days active
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {data.availability.map((s: any) => (
                                            <div
                                                key={s.day}
                                                className="flex justify-between border-b border-moss-100 pb-2 text-sm"
                                            >
                                                <span className="font-bold capitalize">
                                                    {days[s.day]}
                                                </span>
                                                <span className="font-mono text-moss-700">
                                                    {formatTime(s.start)} -{' '}
                                                    {formatTime(s.end)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                {/* Reset Button (Database Clear) */}
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={resetAvailability}
                                    className="border-red-200 text-red-500 hover:bg-red-50 hover:text-red-600"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Clear All
                                </Button>

                                {Object.keys(errors).length > 0 && (
                                    <div className="mt-4 rounded-lg bg-red-100 p-3 text-xs text-red-600">
                                        {Object.values(errors).map((msg, i) => (
                                            <p key={i}>• {msg as string}</p>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
