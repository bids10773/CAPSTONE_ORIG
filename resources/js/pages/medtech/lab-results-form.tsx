import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import React, { useEffect } from 'react';
import { Microscope, Activity, Save, ArrowLeft, Beaker, ShieldCheck } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
    appointment: {
        id: number;
        user: { first_name: string; last_name: string; };
    };
    labResult: any;
}

export default function LabResultsForm({ appointment, labResult }: Props) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
    }, [flash]);

    const { data, setData, post, processing } = useForm<any>({
        // Section A-C Logic (Same as your Physical Exam style)
        cbc_status: labResult?.cbc_status || 'normal',
        cbc_findings: labResult?.cbc_findings || '',
        urinalysis_status: labResult?.urinalysis_status || 'normal',
        urinalysis_findings: labResult?.urinalysis_findings || '',
        fecalysis_status: labResult?.fecalysis_status || 'normal',
        fecalysis_findings: labResult?.fecalysis_findings || '',
        
        // Rapid Tests & Screening
        hepa_b_status: labResult?.hepa_b_status || 'non-reactive',
        hepa_a_status: labResult?.hepa_a_status || 'non-reactive',
        pregnancy_test: labResult?.pregnancy_test || 'negative',
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

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            {/* Header Header */}
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.visit('/medtech/dashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold uppercase tracking-tight">III. Laboratory</h1>
                        <p className="text-sm text-gray-500 font-medium">Patient: {appointment.user.first_name} {appointment.user.last_name}</p>
                    </div>
                </div>
                <Button onClick={onSubmit} disabled={processing} className="bg-green-600 hover:bg-green-700">
                    <Save className="w-4 h-4 mr-2" /> Save & Forward to X-Ray
                </Button>
            </div>

            {/* Checklist Section (CBC, Urinalysis, Fecalysis) */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Microscope className="w-4 h-4 text-green-600" /> Laboratory Clearance Checklist
                    </CardTitle>
                </CardHeader>
                <CardContent className="divide-y divide-gray-100 dark:divide-gray-800 p-0">
                    {labParts.map((part) => (
                        <div key={part.field} className="p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <Label className="md:col-span-4 text-sm font-medium">{part.label}</Label>
                            <div className="md:col-span-3 flex gap-6">
                                {['normal', 'findings'].map((status) => (
                                    <label key={status} className="flex items-center gap-2 cursor-pointer text-xs font-semibold uppercase">
                                        <input 
                                            type="radio" 
                                            checked={data[`${part.field}_status`] === status}
                                            onChange={() => {
                                                setData(`${part.field}_status`, status);
                                                if (status === 'normal') setData(`${part.field}_findings`, '');
                                            }}
                                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
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
                                    className="h-9 text-sm focus:ring-green-500"
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Rapid Tests & Screenings (Hepatitis & Drug Test) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hepatitis & Pregnancy */}
                <Card>
                    <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <Beaker className="w-4 h-4 text-blue-500" /> Rapid Tests
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {[
                            { label: 'Hepatitis B (HBs Ag)', field: 'hepa_b_status', opts: ['non-reactive', 'reactive'] },
                            { label: 'Hepatitis A (Anti-HAV IgM)', field: 'hepa_a_status', opts: ['non-reactive', 'reactive'] },
                            { label: 'Pregnancy Test', field: 'pregnancy_test', opts: ['negative', 'positive', 'na'] },
                        ].map((item) => (
                            <div key={item.field} className="flex flex-col gap-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">{item.label}</Label>
                                <Select value={data[item.field]} onValueChange={v => setData(item.field, v)}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {item.opts.map(o => <SelectItem key={o} value={o} className="capitalize">{o}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Drug Screening */}
                <Card>
                    <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b">
                        <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-red-500" /> Drug Screening
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 space-y-4">
                        {[
                            { label: 'a. Methamphetamine (Shabu)', field: 'meth_status' },
                            { label: 'b. Marijuana', field: 'marijuana_status' },
                        ].map((item) => (
                            <div key={item.field} className="flex flex-col gap-1.5">
                                <Label className="text-[11px] font-bold text-gray-500 uppercase">{item.label}</Label>
                                <div className="flex gap-4 p-2 border rounded-md bg-gray-50/50">
                                    {['negative', 'positive'].map((s) => (
                                        <label key={s} className="flex items-center gap-2 cursor-pointer text-xs font-bold uppercase">
                                            <input 
                                                type="radio" 
                                                checked={data[item.field] === s}
                                                onChange={() => setData(item.field, s)}
                                                className="w-4 h-4 text-red-600"
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

            {/* Remarks Section */}
            <div className="space-y-2">
                <Label className="text-xs font-bold text-gray-500 uppercase">Additional Remarks / Findings</Label>
                <textarea 
                    className="w-full min-h-[100px] p-3 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all dark:bg-gray-800 dark:border-gray-700"
                    placeholder="Enter final laboratory notes here..."
                    value={data.remarks}
                    onChange={e => setData('remarks', e.target.value)}
                />
            </div>
        </div>
    );
}

LabResultsForm.layout = (page: any) => <AppLayout>{page}</AppLayout>;