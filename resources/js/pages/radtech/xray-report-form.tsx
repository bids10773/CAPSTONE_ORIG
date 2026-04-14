import { Head, useForm, router } from '@inertiajs/react';
import { Image, Save, ArrowLeft, Upload } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  appointment: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
    };
    service_type: string;
  };
  xrayReport?: {
    view?: string;
    findings?: string;
    impression?: string;
    remarks?: string;
  };
  viewOptions?: Record<string, string>;
}

export default function XrayReportForm({ appointment, xrayReport, viewOptions }: Props) {

    const { data, setData, post, processing, errors } = useForm({

        // ✅ NEW (Physical-style logic)
        chest_status: xrayReport?.findings ? 'findings' : 'normal',
        chest_findings: xrayReport?.findings || '',
        impression: xrayReport?.impression || '',
        remarks: xrayReport?.remarks || '',
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();

           post(`/radtech/xrays/${appointment.id}`);
    };

    const goBack = () => {
        router.visit('/radtech/appointments');
    };

    return (
        <>
            <Head title="X-Ray Report - RadTech" />

            <div className="p-6 max-w-4xl mx-auto">
                {/* HEADER */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={goBack} className="p-2 hover:bg-gray-100 rounded">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold">X-Ray Report</h1>
                        <p className="text-sm text-gray-500">
                            Patient: {appointment.user.first_name} {appointment.user.last_name}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="w-5 h-5" />
                            X-Ray Details
                        </CardTitle>
                        <CardDescription>Radiologic evaluation of the patient</CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">


                        {/* ✅ CHEST X-RAY (LIKE PHYSICAL EXAM STYLE) */}
                        <div className="space-y-3">
                            <Label className="font-semibold">Chest X-Ray</Label>

                            {/* RADIO BUTTONS */}
                            <div className="flex gap-6">
                                {['normal', 'findings'].map((status) => (
                                    <label key={status} className="flex items-center gap-2 text-xs font-bold uppercase">
                                        <input
                                            type="radio"
                                            checked={data.chest_status === status}
                                            onChange={() => {
    setData('chest_status', status);

    if (status === 'normal') {
        setData('chest_findings', `BOTH LUNGS ARE CLEAR
HEART SIZE IS NOT ENLARGED
THE REST OF THE CHEST FINDINGS ARE UNREMARKABLE`);

        setData('impression', 'ESSENTIALLY NORMAL CHEST X-RAY.');
    } else {
        setData('chest_findings', '');
        setData('impression', '');
    }
}}
                                        />
                                        {status}
                                    </label>
                                ))}
                            </div>

                            {/* FINDINGS INPUT */}
                            <textarea
                                rows={5}
                                value={data.chest_findings}
                                disabled={data.chest_status === 'normal'}
                                onChange={(e) => setData('chest_findings', e.target.value)}
                                placeholder="Enter findings if abnormal..."
                                className="w-full p-2 border rounded"
                            />

                            {errors.chest_findings && (
                                <p className="text-sm text-red-600">{errors.chest_findings}</p>
                            )}
                        </div>

                        {/* IMPRESSION */}
                        <div className="space-y-2">
                            <Label>Impression</Label>
                            <textarea
                                rows={4}
                                value={data.impression}
                                disabled={data.chest_status === 'normal'}
                                onChange={(e) => setData('impression', e.target.value)}
                                placeholder="Radiological impression..."
                                className="w-full p-2 border rounded"
                            />
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-4 pt-4">
                            <Button onClick={onSubmit} disabled={processing} className="flex-1">
                                <Save className="w-4 h-4 mr-2" />
                                {processing ? 'Saving...' : 'Save X-Ray Report'}
                            </Button>

                            <Button variant="outline" onClick={goBack}>
                                Cancel
                            </Button>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </>
    );
}

XrayReportForm.layout = (page: any) => <AppLayout>{page}</AppLayout>;