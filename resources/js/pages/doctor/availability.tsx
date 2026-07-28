import { Head, useForm, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
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
import { CalendarDays, Clock, Save, X } from 'lucide-react';

interface Props {
    availability: Array<{
        day: string;
        start: string;
        end: string;
    }>;
    days: Record<string, string>;
}

export default function DoctorAvailability(props: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        availability: props.availability,
    });

    const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

    const updateSlot = (day: string, field: 'start' | 'end', value: string) => {
        setData(
            'availability',
            data.availability.map((slot) =>
                slot.day === day ? { ...slot, [field]: value } : slot,
            ),
        );
    };

    const toggleDay = (day: string) => {
        const exists = data.availability.some((slot: any) => slot.day === day);

        if (exists) {
            setData(
                'availability',
                data.availability.filter((slot: any) => slot.day !== day),
            );
        } else {
            setData('availability', [
                ...data.availability,
                { day, start: '08:00', end: '17:00' }, // ✅ FIXED
            ]);
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        patch('/doctor/availability', {
            preserveState: true,
            onSuccess: () => router.visit('/doctor/dashboard'),
        });
    };

    return (
        <AppLayout>
            <Head title="Availability" />

            <div className="max-w-4xl space-y-6 p-6">
                <div className="flex items-center gap-3">
                    <CalendarDays className="h-8 w-8 text-moss-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Set Your Availability
                        </h1>
                        <p className="text-gray-500">
                            Manage your weekly schedule. Patients can book
                            within these times.
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Set Weekly Availability</CardTitle>
                        <CardDescription>
                            Toggle days and adjust time ranges. Default
                            30-minute appointment slots.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={submit} className="space-y-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
                                {dayOrder.map((dayKey) => {
                                    const slot = data.availability.find(
                                        (s: any) => s.day === dayKey,
                                    );
                                    const isActive = !!slot;
                                    return (
                                        <div key={dayKey} className="space-y-3">
                                            <Label className="flex cursor-pointer items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isActive}
                                                    onChange={() =>
                                                        toggleDay(dayKey)
                                                    }
                                                    className="h-4 w-4 rounded"
                                                />
                                                <span>
                                                    {props.days[dayKey]}
                                                </span>
                                            </Label>
                                            {isActive && (
                                                <div className="space-y-2 pl-6">
                                                    <div>
                                                        <Label className="text-xs tracking-wider text-gray-500 uppercase">
                                                            Start Time
                                                        </Label>
                                                        <Input
                                                            type="time"
                                                            step="1800"
                                                            value={
                                                                slot?.start ||
                                                                '08:00'
                                                            }
                                                            onChange={(e) =>
                                                                updateSlot(
                                                                    dayKey,
                                                                    'start',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full"
                                                            disabled={
                                                                processing
                                                            }
                                                        />
                                                    </div>
                                                    <div>
                                                        <Label className="text-xs tracking-wider text-gray-500 uppercase">
                                                            End Time
                                                        </Label>
                                                        <Input
                                                            type="time"
                                                            step="1800"
                                                            value={
                                                                slot?.end ||
                                                                '17:00'
                                                            }
                                                            onChange={(e) =>
                                                                updateSlot(
                                                                    dayKey,
                                                                    'end',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="w-full"
                                                            disabled={
                                                                processing
                                                            }
                                                        />
                                                    </div>
                                                    <Clock
                                                        className={`mx-auto h-4 w-4 ${isActive ? 'text-green-500' : 'text-gray-400'}`}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex gap-3 pt-6">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="flex-1 gap-2"
                                >
                                    <Save className="h-4 w-4" />
                                    Save Availability
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        router.visit('/doctor/dashboard')
                                    }
                                    disabled={processing}
                                    className="flex-1"
                                >
                                    <X className="h-4 w-4" />
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
