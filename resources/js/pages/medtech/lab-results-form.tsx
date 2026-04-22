import { useForm, router} from '@inertiajs/react';
import { Microscope, Save, ArrowLeft, Beaker, ShieldCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Med Tech Queue', href: "/medtech/appointments" },
    { title: 'Laboratory Examination', href: "" },
];


interface PatientProfile {
    sex?: string;
    birthdate?: string;
    civil_status?: string;
}

interface Appointment {
    id: number;
    user: {
        first_name: string;
        last_name: string;
    };
        patient_profile?: PatientProfile; 
}

interface Props {
    appointment: Appointment;
    labResult: any;
}

export default function LabResultsForm({ appointment, labResult }: Props) {
    



    const { data, setData, post, processing } = useForm<any>({
        cbc_status: labResult?.cbc_status || 'normal',
        cbc_findings: labResult?.cbc_findings || '',
        urinalysis_status: labResult?.urinalysis_status || 'normal',
        urinalysis_findings: labResult?.urinalysis_findings || '',
        fecalysis_status: labResult?.fecalysis_status || 'normal',
        fecalysis_findings: labResult?.fecalysis_findings || '',
        hepa_b_status: labResult?.hepa_b_status || 'non-reactive',
        hepa_a_status: labResult?.hepa_a_status || 'non-reactive',
        pregnancy_test_status: labResult?.pregnancy_test_status || 'negative',
        meth_status: labResult?.meth_status || 'negative',
        marijuana_status: labResult?.marijuana_status || 'negative',
        remarks: labResult?.remarks || '',
    });

    const labParts = [
        { label: 'A. Complete Blood Count (CBC)', field: 'cbc' },
        { label: 'B. Urinalysis', field: 'urinalysis' },
        { label: 'C. Fecalysis', field: 'fecalysis' },
    ];

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/medtech/lab-results/${appointment.id}`);
    };

    const getAge = (birthdate?: string) => {
    if (!birthdate) return 'N/A';

    const today = new Date();
    const birth = new Date(birthdate);

    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();

    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    return age;
};

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">

            {/* HEADER */}
            <div className="flex items-center justify-between bg-white/70 backdrop-blur-md border border-white p-4 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
    <Button 
        variant="ghost" 
        onClick={() => router.visit('/medtech/dashboard')}
        className="hover:bg-blue-50 transition"
    >
        <ArrowLeft className="w-5 h-5 text-[#246AFE]" />
    </Button>

    <div>
        <h1 className="text-xl font-bold text-gray-900 uppercase tracking-tight mb-2">
            Laboratory Examination
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
                    {appointment?.patient_profile?.civil_status || 'N/A'}
                </p>
            </div>

        </div>
    </div>
</div>

                <Button 
                    onClick={onSubmit} 
                    disabled={processing}
                    className="bg-[#246AFE] hover:bg-blue-700 text-white transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50"
                >
                    <Save className="w-4 h-4 mr-2"/> 
                    {processing ? 'Saving...' : 'Save & Forward'}
                </Button>
            </div>

            {/* LAB CHECKLIST */}
            <Card className="overflow-visible">
                <CardHeader className="bg-gray-50/70 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                        <Microscope className="w-4 h-4 text-[#246AFE]" /> 
                        Laboratory Clearance Checklist
                    </CardTitle>
                </CardHeader>

                <CardContent className="divide-y p-0">
                    {labParts.map((part) => (
                        <div key={part.field} className="p-4 grid md:grid-cols-12 gap-4 items-center">
                            
                            <Label className="md:col-span-4 text-sm font-medium">
                                {part.label}
                            </Label>

                            <div className="md:col-span-3 flex gap-6">
                                {['normal', 'findings'].map((status) => (
                                    <label key={status} className="flex items-center gap-2 text-xs font-semibold uppercase">
                                        <input 
                                            type="radio"
                                            checked={data[`${part.field}_status`] === status}
                                            onChange={() => {
                                                setData(`${part.field}_status`, status);
                                                if (status === 'normal') setData(`${part.field}_findings`, '');
                                            }}
                                            className="w-4 h-4 text-[#246AFE] focus:ring-[#246AFE]"
                                        />
                                        {status}
                                    </label>
                                ))}
                            </div>

                            <div className="md:col-span-5">
                                <Input
                                    placeholder="Specify findings..."
                                    value={data[`${part.field}_findings`]}
                                    disabled={data[`${part.field}_status`] === 'normal'}
                                    onChange={e => setData(`${part.field}_findings`, e.target.value)}
                                    className="h-9 text-sm focus:ring-[#246AFE] focus:border-[#246AFE]"
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    {/* RAPID TESTS */}
    <CardContent className="p-4 space-y-4 ">

    {/* ✅ HEP A + B SIDE BY SIDE */}
    <div className="grid grid-cols-2 gap-4">

    {/* Hepatitis B */}
    <div className="p-3 border rounded-xl bg-gray-50/70">
        <Label className="text-xs font-bold text-gray-500 uppercase">
            Hepatitis B
        </Label>
        <Select 
            value={data.hepa_b_status ?? ''} 
            onValueChange={(v) => setData('hepa_b_status', v)}
        >
            <SelectTrigger className="h-9 mt-2">
                <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent className="z-50">
                <SelectItem value="non-reactive">Non-reactive</SelectItem>
                <SelectItem value="reactive">Reactive</SelectItem>
            </SelectContent>
        </Select>
    </div>

    {/* Hepatitis A */}
    <div className="p-3 border rounded-xl bg-gray-50/70">
        <Label className="text-xs font-bold text-gray-500 uppercase">
            Hepatitis A
        </Label>
        <Select 
            value={data.hepa_a_status ?? ''} 
            onValueChange={(v) => setData('hepa_a_status', v)}
        >
            <SelectTrigger className="h-9 mt-2">
                <SelectValue placeholder="Select result" />
            </SelectTrigger>
            <SelectContent className="z-50">
                <SelectItem value="non-reactive">Non-reactive</SelectItem>
                <SelectItem value="reactive">Reactive</SelectItem>
            </SelectContent>
        </Select>
    </div>

</div>

    {/* ✅ PREGNANCY (ONLY IF FEMALE) */}
    {appointment?.patient_profile?.sex?.toLowerCase() === 'female' && (
        <div>
            <Label className="text-xs font-bold text-gray-500 uppercase">
                Pregnancy Test
            </Label>
            <Select 
                value={data.pregnancy_test_status ?? ''} 
                onValueChange={(v) => setData('pregnancy_test_status', v)}
            >
                <SelectTrigger className="h-9">
                    <SelectValue placeholder="Select result" />
                </SelectTrigger>
                <SelectContent className="z-50">
                    <SelectItem value="negative">Negative</SelectItem>
                    <SelectItem value="positive">Positive</SelectItem>
                    <SelectItem value="na">N/A</SelectItem>
                </SelectContent>
            </Select>
        </div>
    )}

</CardContent>

    {/* DRUG SCREENING */}
    <Card>
        <CardHeader className="bg-gray-50/70 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2 text-gray-700">
                <ShieldCheck className="w-4 h-4 text-[#246AFE]" /> Drug Screening
            </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
            {[
                { label: 'Methamphetamine', field: 'meth_status' },
                { label: 'Marijuana', field: 'marijuana_status' },
            ].map((item) => (
                <div key={item.field}>
                    <Label className="text-xs font-bold text-gray-500 uppercase">{item.label}</Label>
                    <div className="flex gap-4 p-2 border rounded-md bg-gray-50/50">
                        {['negative', 'positive'].map((s) => (
                            <label key={s} className="flex items-center gap-2 text-xs font-bold uppercase">
                                <input
                                    type="radio"
                                    checked={data[item.field] === s}
                                    onChange={() => setData(item.field, s)}
                                    className="w-4 h-4 text-[#246AFE]"
                                />
                                {s}
                            </label>
                        ))}
                    </div>
                </div>
            ))}
        </CardContent>
    </Card>

</div>
</div>
    );
}


LabResultsForm.layout = (page: any) => (
    <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
);