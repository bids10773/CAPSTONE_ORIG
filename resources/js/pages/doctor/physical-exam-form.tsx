import { useForm, router } from '@inertiajs/react';
import React, { useState, useEffect} from 'react';
import { HeartPulse, Activity, Save, ArrowLeft } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Doctor Queue', href: "/doctor/appointments" },
    { title: 'Physical Examination', href: "" },
];

interface Props {
    appointment: {
        id: number;
        user: { first_name: string; last_name: string; };
        patient_profile?: { 
    sex?: string; 
    birthdate?: string; 
    civil_status?: string;
};
    };
    physicalExam: any;
}

export default function PhysicalExamForm({ appointment, physicalExam }: Props) {
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


    const { data, setData, post, processing } = useForm<any>({
        height: physicalExam?.height || '',
        weight: physicalExam?.weight || '',
        blood_pressure: physicalExam?.blood_pressure || '',
        pulse_rate: physicalExam?.pulse_rate || '',
        temperature: physicalExam?.temperature || '',
        remarks: physicalExam?.remarks || '',
        present_illness: physicalExam?.present_illness || '',
        past_medical_history: physicalExam?.past_medical_history || '',
        operations_accidents: physicalExam?.operations_accidents || '',
        family_history: physicalExam?.family_history || '',
        allergies: physicalExam?.allergies || '',
        personal_social_history: physicalExam?.personal_social_history || '',
        ob_menstrual_history: physicalExam?.ob_menstrual_history || '',
        ...Object.fromEntries([
            'head_scalp','eyes','ears','nose_sinuses','mouth_throat',
            'neck_thyroid','chest_breast','lungs','heart','abdomen',
            'extremities'
        ].flatMap(field => [
            [field, physicalExam?.[field] || ''],
            [`${field}_status`, physicalExam?.[field] ? 'with_findings' : 'normal']
        ]))
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

    const [bmi, setBmi] = useState<number | null>(null);

    useEffect(() => {
        const h = parseFloat(data.height);
        const w = parseFloat(data.weight);
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
        <div className="p-6 max-w-6xl mx-auto space-y-6">

            {/* HEADER */}
            <Card className="bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg border-0">
                <CardContent className="flex justify-between items-center p-5">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => router.visit('/doctor/dashboard')}>
                            <ArrowLeft />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold">Physical Examination</h1>
                            <div className="text-sm opacity-90 grid grid-cols-2 gap-x-6 gap-y-1">
                                <span><b>Patient:</b> {appointment.user.first_name} {appointment.user.last_name}</span>
                                <span><b>Gender:</b> {appointment?.patient_profile?.sex || 'N/A'}</span>
                                <span><b>Age:</b> {getAge(appointment?.patient_profile?.birthdate)}</span>
                                <span><b>Civil Status:</b> {appointment?.patient_profile?.civil_status || 'N/A'}</span>
                            </div>
                        </div>
                    </div>
                    <Button onClick={onSubmit} disabled={processing} className="bg-white text-blue-600">
                        <Save className="mr-2 h-4 w-4"/> Save
                    </Button>
                </CardContent>
            </Card>

            {/* MEDICAL HISTORY */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-500">
                        <HeartPulse size={18}/> Medical History
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                    {[
                        ['Present Illness','present_illness'],
                        ['Past Medical History','past_medical_history'],
                        ['Operations/Accidents','operations_accidents'],
                        ['Family History','family_history'],
                        ['Allergies','allergies']
                    ].map(([label, field]) => (
                        <div key={field}>
                            <Label>{label}</Label>
                            <textarea
                                className="w-full border rounded-md p-2 mt-1 text-sm focus:ring-2 focus:ring-blue-500"
                                value={data[field]}
                                onChange={(e)=>setData(field, e.target.value)}
                            />
                        </div>
                    ))}
                    <div className="md:col-span-2">
                        <Label>Personal/Social History</Label>
                        <textarea
                            className="w-full border rounded-md p-2 mt-1 text-sm"
                            value={data.personal_social_history}
                            onChange={(e)=>setData('personal_social_history', e.target.value)}
                        />
                    </div>
                    <div className="md:col-span-2">
                        <Label>
                            OB / Menstrual History
                        </Label>
                        <textarea
                            value={data.ob_menstrual_history}
                            onChange={(e) => setData('ob_menstrual_history', e.target.value)}
                            className="w-full border rounded-md  p-2 mt-1 text-sm"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* VITALS */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                        <Activity size={18}/> Vitals & BMI
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-6 gap-4 items-end">
                    {['height','weight','blood_pressure','pulse_rate','temperature'].map(v => (
                        <div key={v}>
                            <Label className="capitalize">{v.replace('_',' ')}</Label>
                            <Input
                                type="text"
                                value={data[v]}
                                onChange={(e)=>setData(v,e.target.value)}
                            />
                        </div>
                    ))}

                    <div className="text-center">
                        <p className="text-xs text-gray-500">BMI</p>
                        <p className="text-2xl font-bold">{bmi || '--'}</p>
                        {bmi && <span className={getBMICategory(bmi).color}>{getBMICategory(bmi).label}</span>}
                    </div>
                </CardContent>
            </Card>

            {/* SYSTEM REVIEW */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-red-500">System Review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    {bodyParts.map(part => (
                        <div key={part.field} className="grid md:grid-cols-12 gap-2 items-center border-b pb-2">
                            <span className="md:col-span-3 text-sm font-medium">{part.label}</span>

                            <div className="md:col-span-3 flex gap-3 text-xs">
                                {['normal','with_findings'].map(status => (
                                    <label key={status}>
                                        <input
                                            type="radio"
                                            checked={data[`${part.field}_status`] === status}
                                            onChange={()=>setData(`${part.field}_status`, status)}
                                        /> {status}
                                    </label>
                                ))}
                            </div>

                            <div className="md:col-span-6">
                                <Input
                                    placeholder="Findings..."
                                    value={data[part.field]}
                                    onChange={(e)=>setData(part.field,e.target.value)}
                                />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

        </div>
    );
}

PhysicalExamForm.layout = (page: any) => <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;