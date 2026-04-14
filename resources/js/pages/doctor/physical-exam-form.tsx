import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { HeartPulse, Activity, Save, ArrowLeft, Scale, Thermometer } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    appointment: {
        id: number;
        user: { first_name: string; last_name: string; };
    };
    physicalExam: any;
}

export default function PhysicalExamForm({ appointment, physicalExam }: Props) {
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
    }, [flash]);

    const { data, setData, post, processing } = useForm<any>({
    height: physicalExam?.height || '',
    weight: physicalExam?.weight || '',
    blood_pressure: physicalExam?.blood_pressure || '',
    pulse_rate: physicalExam?.pulse_rate || '',
    temperature: physicalExam?.temperature || '',
    remarks: physicalExam?.remarks || '',

    // ✅ ADD MEDICAL HISTORY HERE
    present_illness: physicalExam?.present_illness || '',
    past_medical_history: physicalExam?.past_medical_history || '',
    operations_accidents: physicalExam?.operations_accidents || '',
    family_history: physicalExam?.family_history || '',
    allergies: physicalExam?.allergies || '',
    personal_social_history: physicalExam?.personal_social_history || '',
    ob_menstrual_history: physicalExam?.ob_menstrual_history || '',

    // Body Systems (your existing dynamic fields)
    ...Object.fromEntries(
        [
            'head_scalp', 'eyes', 'ears', 'nose_sinuses', 'mouth_throat',
            'neck_thyroid', 'chest_breast', 'lungs', 'heart', 'abdomen',
            'back', 'anus', 'genitals', 'extremities', 'skin', 'dental'
        ].flatMap(field => [
            [field, physicalExam?.[field] || ''],
            [`${field}_status`, physicalExam?.[field] ? 'with_findings' : 'normal']
        ])
    )
});

    const bodyParts = [
        { label: 'Head/Scalp', field: 'head_scalp' },
        { label: 'Eyes', field: 'eyes' },
        { label: 'Ears', field: 'ears' },
        { label: 'Nose/Sinuses', field: 'nose_sinuses' },
        { label: 'Mouth/Throat', field: 'mouth_throat' },
        { label: 'Neck/Thyroid', field: 'neck_thyroid' },
        { label: 'Chest/Breasts', field: 'chest_breast' },
        { label: 'Lungs', field: 'lungs' },
        { label: 'Heart', field: 'heart' },
        { label: 'Abdomen', field: 'abdomen' },
        { label: 'Extremities', field: 'extremities' },
    ];

    // --- BMI CALCULATION LOGIC ---
    const [bmi, setBmi] = useState<number | null>(null);

    useEffect(() => {
        const h = parseFloat(data.height); // in cm
        const w = parseFloat(data.weight); // in kg
        if (h > 0 && w > 0) {
            const bmiValue = w / ((h / 100) ** 2);
            setBmi(Number(bmiValue.toFixed(1)));
        } else {
            setBmi(null);
        }
    }, [data.height, data.weight]);

    const getBMICategory = (val: number) => {
        if (val < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
        if (val < 25) return { label: 'Normal', color: 'text-green-600' };
        if (val < 30) return { label: 'Overweight', color: 'text-orange-500' };
        return { label: 'Obese', color: 'text-red-600' };
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/doctor/physical-exam-form/${appointment.id}`);
    };

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border shadow-sm">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => router.visit('/doctor/dashboard')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold">Physical Examination</h1>
                        <p className="text-sm text-gray-500 font-medium">Patient: {appointment.user.first_name} {appointment.user.last_name}</p>
                    </div>
                </div>
                <Button onClick={onSubmit} disabled={processing} className="bg-blue-600 hover:bg-blue-700">
                    <Save className="w-4 h-4 mr-2" /> Save & Forward to Lab
                </Button>
            </div>

             {/* Medical History Section */}
<div className="mt-8 pt-8 border-t border-gray-200 dark:border-neutral-700">
  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
    <HeartPulse className="w-5 h-5 text-red-500" />
    Medical History
  </h3>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

    <div>
      <label className="text-sm font-medium">Present Illness</label>
      <textarea
        value={data.present_illness}
        onChange={(e) => setData('present_illness', e.target.value)}
        className="w-full p-2 border rounded"
      />
    </div>

    <div>
      <label className="text-sm font-medium">Past Medical History</label>
      <textarea
        value={data.past_medical_history}
        onChange={(e) => setData('past_medical_history', e.target.value)}
        className="w-full p-2 border rounded"
      />
    </div>

    <div>
      <label className="text-sm font-medium">Operations / Accidents</label>
      <textarea
        value={data.operations_accidents}
        onChange={(e) => setData('operations_accidents', e.target.value)}
        className="w-full p-2 border rounded"
      />
    </div>

    <div>
      <label className="text-sm font-medium">Family History</label>
      <textarea
        value={data.family_history}
        onChange={(e) => setData('family_history', e.target.value)}
        className="w-full p-2 border rounded"
      />
    </div>

    <div>
      <label className="text-sm font-medium">Allergies</label>
      <textarea
        value={data.allergies}
        onChange={(e) => setData('allergies', e.target.value)}
        className="w-full p-2 border rounded"
      />
    </div>

    <div className="md:col-span-2">
      <label className="text-sm font-medium">Personal / Social History</label>
      <textarea
        value={data.personal_social_history}
        onChange={(e) => setData('personal_social_history', e.target.value)}
        className="w-full p-2 border rounded"
      />
    </div>

    <div className="md:col-span-2">
      <label className="text-sm font-medium">OB / Menstrual History</label>
      <textarea
        value={data.ob_menstrual_history}
        onChange={(e) => setData('ob_menstrual_history', e.target.value)}
        className="w-full p-2 border rounded"
      />
    </div>

  </div>
</div>

            {/* Vitals & BMI Section */}
            <Card className="overflow-hidden">
                <CardHeader className="bg-gray-50 dark:bg-gray-900 border-b">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" /> Vitals Indicators
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                        <div className="md:col-span-8 grid grid-cols-2 md:grid-cols-5 gap-4">
                            {['height', 'weight', 'blood_pressure', 'pulse_rate', 'temperature'].map((v) => (
                                <div key={v} className="space-y-1.5">
                                    <Label className="capitalize text-[11px] font-bold text-gray-500">{v.replace('_', ' ')}</Label>
                                    <Input 
                                        type={['height', 'weight', 'temperature'].includes(v) ? 'number' : 'text'}
                                        value={data[v]} 
                                        onChange={e => setData(v, e.target.value)} 
                                        className="h-9 focus:ring-blue-500"
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Automatic BMI Result Display */}
                        <div className="md:col-span-4 flex flex-col items-center justify-center border-l dark:border-gray-700 pl-6 h-full">
                            <Label className="text-[10px] uppercase font-bold text-gray-400 mb-1">Body Mass Index (BMI)</Label>
                            <div className="text-4xl font-black text-gray-900 dark:text-white">
                                {bmi || '--.-'}
                            </div>
                            {bmi && (
                                <span className={`mt-1 text-xs font-bold px-2 py-0.5 rounded-full bg-opacity-10 ${getBMICategory(bmi).color}`}>
                                    {getBMICategory(bmi).label}
                                </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Systems Review */}
            <Card>
                <CardHeader><CardTitle className="text-sm font-semibold flex items-center gap-2"><HeartPulse className="w-4 h-4 text-red-500" /> Systems Review</CardTitle></CardHeader>
                <CardContent className="divide-y divide-gray-100 dark:divide-gray-800">
                    {bodyParts.map((part) => (
                        <div key={part.field} className="py-3 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                            <Label className="md:col-span-3 text-sm font-medium">{part.label}</Label>
                            <div className="md:col-span-3 flex gap-4">
                                {['normal', 'with_findings'].map((status) => (
                                    <label key={status} className="flex items-center gap-2 cursor-pointer text-xs">
                                        <input 
                                            type="radio" 
                                            checked={data[`${part.field}_status`] === status}
                                            onChange={() => {
                                                setData(`${part.field}_status`, status);
                                                if (status === 'normal') setData(part.field, '');
                                            }}
                                            className="w-3.5 h-3.5 text-blue-600"
                                        />
                                        {status === 'normal' ? 'Normal' : 'Findings'}
                                    </label>
                                ))}
                            </div>
                            <div className="md:col-span-6">
                                <Input 
                                    placeholder="Enter findings if abnormal..."
                                    value={data[part.field]}
                                    disabled={data[`${part.field}_status`] === 'normal'}
                                    onChange={e => setData(part.field, e.target.value)}
                                    className="h-8 text-sm"
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>
        </div>
    );
}

PhysicalExamForm.layout = (page: any) => <AppLayout>{page}</AppLayout>;