import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, ArrowLeft, RotateCcw, Save, CircleSlash, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctors Availability', href: "/admin/staff" },
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

  const { data, setData, patch, processing, errors } = useForm({
    doctor_id: 0,
    availability: [] as any[],
  });

  useEffect(() => {
    if (doctors.length > 0 && queryDoctorId) {
      const doctor = doctors.find(d => d.id === queryDoctorId);
      if (doctor) {
        setSelectedDoctor(doctor);
        setData({
          doctor_id: doctor.id,
          availability: Array.isArray(doctor.availability) ? doctor.availability : [],
        });
      } else {
        router.visit('/admin/staff');
      }
    }
  }, [doctors, queryDoctorId]);

  if (!selectedDoctor)
    return <div className="flex h-screen items-center justify-center text-muted-foreground animate-pulse">Initializing schedule...</div>;

  const updateSlot = (day: string, field: 'start' | 'end', value: string) => {
    setData('availability', data.availability.map(slot => (slot.day === day ? { ...slot, [field]: value } : slot)));
  };

  const toggleDay = (day: string) => {
    const exists = data.availability.some(slot => slot.day === day);
    if (exists) {
      setData('availability', data.availability.filter(slot => slot.day !== day));
    } else {
      setData('availability', [...data.availability, { day, start: '09:00', end: '17:00' }]);
    }
  };

  // Your original Reset logic: Clears availability in the DB
  const resetAvailability = () => {
    if (!selectedDoctor) return;
    if (!confirm('Are you sure you want to clear all availability for this doctor? This cannot be undone.')) return;

    router.patch(
      '/admin/doctor-availability',
      {
        doctor_id: selectedDoctor.id,
        availability: [],
      },
      {
        preserveState: true,
        onSuccess: () => {
          toast.success('Doctor availability cleared successfully!');
          setData('availability', []);
          router.reload({ only: ['doctors'] });
        },
      }
    );
  };

  // Revert UI to the last saved state without hitting the DB
  const discardChanges = () => {
    setData('availability', Array.isArray(selectedDoctor.availability) ? selectedDoctor.availability : []);
    toast.info('Changes discarded');
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch('/admin/doctor-availability', {
      preserveState: true,
      onSuccess: () => toast.success('Schedule updated successfully!'),
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title={`Schedule: ${selectedDoctor.first_name}`} />

      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/staff"
              className="group flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {selectedDoctor.first_name} {selectedDoctor.last_name}
              </h1>
              <p className="text-muted-foreground italic">Clinical Availability & Hours</p>
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

            <Button form="availability-form" disabled={processing} className="px-8 shadow-lg shadow-primary/20">
              {processing ? 'Saving...' : 'Save Schedule'}
            </Button>
          </div>
        </div>

        <form id="availability-form" onSubmit={submit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main List */}
          <div className="lg:col-span-8 space-y-4">
            {dayOrder.map((dayKey) => {
              const slot = data.availability.find(s => s.day === dayKey);
              const isActive = !!slot;

              return (
                <div 
                  key={dayKey}
                  className={cn(
                    "group relative rounded-xl border-2 p-5 transition-all duration-200",
                    isActive 
                      ? "bg-card border-primary/40 shadow-sm" 
                      : "bg-muted/30 border-transparent opacity-70"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex items-center gap-4 min-w-[140px]">
                        <div 
                           onClick={() => toggleDay(dayKey)}
                           className={cn(
                            "w-12 h-6 rounded-full cursor-pointer transition-colors relative",
                            isActive ? "bg-primary" : "bg-gray-300 dark:bg-gray-700"
                           )}
                        >
                            <div className={cn(
                             "absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform",
                             isActive ? "translate-x-6" : ""
                            )} />
                        </div>
                      <Label className="text-lg font-semibold capitalize cursor-pointer">
                        {days[dayKey]}
                      </Label>
                    </div>

                    {isActive ? (
                      <div className="flex items-center gap-3 flex-1 max-w-xs">
                        <Input
                          type="time"
                          value={slot?.start || '09:00'}
                          onChange={e => updateSlot(dayKey, 'start', e.target.value)}
                          className="bg-background h-10"
                        />
                        <span className="text-muted-foreground font-medium">to</span>
                        <Input
                          type="time"
                          value={slot?.end || '17:00'}
                          onChange={e => updateSlot(dayKey, 'end', e.target.value)}
                          className="bg-background h-10"
                        />
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground italic">Clinic Closed</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-4">
            <Card className="sticky top-8 border-none bg-blue-50/50 dark:bg-blue-900/10 ring-1 ring-blue-100 dark:ring-blue-900/30">
              <CardHeader>
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400">
                  Weekly Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.availability.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2">
                    <CircleSlash className="w-8 h-8 opacity-20" />
                    <p className="text-sm">No days active</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {data.availability.map((s: any) => (
                      <div key={s.day} className="flex justify-between text-sm border-b border-blue-100 dark:border-blue-800 pb-2">
                        <span className="font-bold capitalize">{days[s.day]}</span>
                        <span className="text-blue-700 dark:text-blue-300 font-mono">{s.start} - {s.end}</span>
                      </div>
                    ))}
                  </div>
                )}
                {/* Reset Button (Database Clear) */}
            <Button 
                type="button" 
                variant="outline" 
                onClick={resetAvailability}
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-red-900/30 dark:hover:bg-red-900/20"
            >
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
            </Button>
                
                {Object.keys(errors).length > 0 && (
                  <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-xs">
                    {Object.values(errors).map((msg, i) => <p key={i}>• {msg as string}</p>)}
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