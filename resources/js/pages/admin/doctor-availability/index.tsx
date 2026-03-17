import AppLayout from '@/layouts/app-layout';
import { Head, useForm, router, usePage,Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Save, X, ArrowLeft} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

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

  // Convert query param to number to match doctor ids
 const queryDoctorId = props.selectedDoctorId || 0;

  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  const dayOrder = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

  const { data, setData, patch, processing, errors } = useForm({
    doctor_id: 0,
    availability: [] as any[],
  });

  // Load doctor based on queryDoctorId
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
        // If doctor not found, go back to staff list
        router.visit('/admin/staff');
      }
    }
  }, [doctors, queryDoctorId]);

  if (!selectedDoctor)
    return <div className="p-6 text-center text-gray-500">Loading doctor availability...</div>;

  const updateSlot = (day: string, field: 'start' | 'end', value: string) => {
    setData(
      'availability',
      data.availability.map(slot => (slot.day === day ? { ...slot, [field]: value } : slot))
    );
  };

  const toggleDay = (day: string) => {
    const exists = data.availability.some(slot => slot.day === day);
    if (exists) {
      setData('availability', data.availability.filter(slot => slot.day !== day));
    } else {
      setData('availability', [...data.availability, { day, start: '09:00', end: '17:00' }]);
    }
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    patch('/admin/doctor-availability', {
      preserveState: true,
      onSuccess: () => {
          toast.success('Doctor availability updated!');
        setData({ doctor_id: selectedDoctor.id, availability: [] });
        setSelectedDoctor({ ...selectedDoctor, availability: [] });
      },
    });
  };

 const resetAvailability = () => {
  if (!selectedDoctor) return;

  if (!confirm('Are you sure you want to clear this doctor’s availability?')) return;

  router.patch(
    '/admin/doctor-availability',
    {
      doctor_id: selectedDoctor.id,
      availability: [], // ✅ guaranteed empty
    },
    {
      preserveState: true,
      onSuccess: () => {
         toast.success('Doctor availability cleared successfully!');

        // clear UI immediately
        setData({
          doctor_id: selectedDoctor.id,
          availability: [],
        });

        router.reload({ only: ['doctors'] });
      },
    }
  );
};

  return (
    <AppLayout>
      <Head title="Doctor Availability Management" />

      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
                <div className="flex items-center gap-4 mb-6">

                    <Link
                        href="/admin/staff"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Clock className="w-6 h-6 text-blue-600" />
                            Edit Doctors Availability
                        </h1>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Toggle days and set time ranges.
                        </p>
                    </div>

                </div>
        <Card>
          <CardHeader>
            <CardTitle>
              {selectedDoctor.first_name} {selectedDoctor.last_name}'s Availability
            </CardTitle>
          </CardHeader>

          <CardContent>
            <form onSubmit={submit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {dayOrder.map(dayKey => {
                  const slot = data.availability.find(s => s.day === dayKey);
                  const isActive = !!slot;
                  return (
                    <div key={dayKey} className="space-y-3">
                      <Label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={() => toggleDay(dayKey)}
                          className="w-5 h-5 text-blue-600"
                        />
                        <span className="font-medium">{days[dayKey]}</span>
                      </Label>

                      {isActive && (
                        <div className="space-y-2 pl-6">
                          <Input
                            type="time"
                            value={slot?.start || '09:00'}
                            onChange={e => updateSlot(dayKey, 'start', e.target.value)}
                          />
                          <Input
                            type="time"
                            value={slot?.end || '17:00'}
                            onChange={e => updateSlot(dayKey, 'end', e.target.value)}
                          />
                          <Clock className="w-4 h-4 mx-auto text-green-500" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {Object.keys(errors).length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  {Object.values(errors).map((msg, i) => (
                    <p key={i} className="text-sm text-red-600">{msg}</p>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button type="submit" disabled={processing} className="flex-1">
                  <Save className="w-4 h-4 mr-2" />
                  {processing ? 'Saving...' : 'Save'}
                </Button>

                <Button type="button" variant="outline" onClick={resetAvailability} className="flex-1">
                  <X className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}