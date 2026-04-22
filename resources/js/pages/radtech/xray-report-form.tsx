import { Head, useForm, router } from '@inertiajs/react';
import { Image, Save, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'RadTech Queue', href: "/radtech/appointments" },
    { title: 'X-Ray Examination', href: "" },
];

interface Props {
  appointment: {
    id: number;
    user: {
      first_name: string;
      last_name: string;
    };
    patient_profile?: {
      sex?: string;
      birthdate?: string;
      civil_status?: string;
    };
    service_types: string;
  };
  xrayReport?: any;
}

export default function XrayReportForm({ appointment, xrayReport }: Props) {

    const getAge = (birthdate?: string) => {
        if (!birthdate) return 'N/A';
        const today = new Date();
        const birth = new Date(birthdate);
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    };

    const { data, setData, post, processing } = useForm({
        chest_status: xrayReport?.findings ? 'findings' : 'normal',
        chest_findings: xrayReport?.findings || '',
        impression: xrayReport?.impression || '',
        remarks: xrayReport?.remarks || '',
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/radtech/xrays/${appointment.id}`);
    };

    return (
        <>
            <Head title="X-Ray Report" />

            <form onSubmit={onSubmit}className="p-6 max-w-5xl mx-auto space-y-6">

    {/* 🔥 HEADER (MATCH LAB STYLE) */}
    <div className="flex items-center justify-between bg-white/70 backdrop-blur-md border border-white p-4 rounded-2xl shadow-sm">

        <div className="flex items-center gap-4">
            <Button 
                variant="ghost" 
                onClick={() => router.visit('/radtech/appointments')}
                className="hover:bg-blue-50 transition"
            >
                <ArrowLeft className="w-5 h-5 text-[#246AFE]" />
            </Button>

            <div>
                <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-2">
                    X-Ray Examination
                </h1>

                {/* ✅ PATIENT INFO GRID */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-gray-50/70 p-3 rounded-xl border">

                    <div>
                        <p className="text-gray-500 text-xs">Patient</p>
                        <p className="font-semibold text-gray-900">
                            {appointment.user.first_name} {appointment.user.last_name}
                        </p>
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs">Gender</p>
                        <p className="font-semibold text-gray-900">
                            {appointment?.patient_profile?.sex || 'N/A'}
                        </p>
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs">Age</p>
                        <p className="font-semibold text-gray-900">
                            {getAge(appointment?.patient_profile?.birthdate)}
                        </p>
                    </div>

                    <div>
                        <p className="text-gray-500 text-xs">Civil Status</p>
                        <p className="font-semibold text-gray-900">
                            {appointment.patient_profile?.civil_status}
                        </p>
                    </div>

                </div>
            </div>
        </div>

        {/* SAVE BUTTON */}
        <Button 
            type="submit"
            disabled={processing}
            className="bg-[#246AFE] hover:bg-blue-700 text-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
        >
            <Save className="w-4 h-4 mr-2"/> 
            {processing ? 'Saving...' : 'Save & Forward'}
        </Button>
    </div>

    {/* 🔥 X-RAY CARD */}
    <Card className="overflow-visible">

        <CardHeader className="bg-gray-50/70 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <Image className="w-4 h-4 text-[#246AFE]" /> 
                Chest X-Ray Result
            </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-6">

            {/* STATUS */}
            <div className="space-y-3">
                <Label className="text-xs font-bold text-gray-500 uppercase">
                    Result Type
                </Label>

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
                                className="w-4 h-4 text-[#246AFE]"
                            />
                            {status}
                        </label>
                    ))}
                </div>
            </div>

            {/* FINDINGS */}
            <div>
                <Label className="text-xs font-bold text-gray-500 uppercase">
                    Findings
                </Label>
                <textarea
                    rows={5}
                    value={data.chest_findings}
                    disabled={data.chest_status === 'normal'}
                    onChange={(e) => setData('chest_findings', e.target.value)}
                    className="w-full mt-2 p-3 border rounded-lg bg-gray-50/50 focus:ring-[#246AFE]"
                />
            </div>

            {/* IMPRESSION */}
            <div>
                <Label className="text-xs font-bold text-gray-500 uppercase">
                    Impression
                </Label>
                <textarea
                    rows={4}
                    value={data.impression}
                    disabled={data.chest_status === 'normal'}
                    onChange={(e) => setData('impression', e.target.value)}
                    className="w-full mt-2 p-3 border rounded-lg bg-gray-50/50"
                />
            </div>

            {/* REMARKS */}
            <div>
                <Label className="text-xs font-bold text-gray-500 uppercase">
                    Remarks
                </Label>
                <textarea
                    rows={3}
                    value={data.remarks}
                    onChange={(e) => setData('remarks', e.target.value)}
                    className="w-full mt-2 p-3 border rounded-lg bg-gray-50/50"
                />
            </div>

        </CardContent>
    </Card>
</form>
        </>
    );
}

XrayReportForm.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;