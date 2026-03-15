import { Head, Link, useForm, router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';
import { HeartPulse, Scale, Activity, Save, ArrowLeft, CheckCircle } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
    appointment: {
        id: number;
        user: {
            first_name: string;
            last_name: string;
        };
    };
    physicalExam: any;
}

export default function PhysicalExamForm(props: Props) {
    const { appointment, physicalExam } = props;
    

    const { data, setData, post, processing, errors } = useForm({
        height: physicalExam?.height || '',
        weight: physicalExam?.weight || '',
        blood_pressure: physicalExam?.blood_pressure || '',
        pulse_rate: physicalExam?.pulse_rate || '',
        temperature: physicalExam?.temperature || '',
        remarks: physicalExam?.remarks || '',
    });

    const [bmi, setBmi] = useState<number | null>(null);
    const [bmiCategory, setBmiCategory] = useState<string>('');

    const getBmiCategory = (value: number): string => {
        if (value < 18.5) return 'Underweight';
        if (value < 25.0) return 'Normal';
        if (value < 30.0) return 'Overweight';
        return 'Obese';
    };

    useEffect(() => {
        const heightCm = parseFloat(data.height || '0');
        const weightKg = parseFloat(data.weight || '0');

        if (heightCm > 0 && weightKg > 0) {
            const heightM = heightCm / 100;
            const calculatedBmi = weightKg / (heightM * heightM);
            setBmi(Number(calculatedBmi.toFixed(1)));
            setBmiCategory(getBmiCategory(calculatedBmi));
        } else {
            setBmi(null);
            setBmiCategory('');
        }
    }, [data.height, data.weight]);

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/doctor/physical-exam-form/${appointment.id}`);
    };

    const goBack = () => {
        router.visit('/doctor/appointments');
    };

    return (
        <>
            <Head title="Physical Exam Form - Doctor" />

            <div className="p-6 max-w-4xl mx-auto">

                {/* HEADER */}
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={goBack}
                        className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Physical Examination
                        </h1>

                        <p className="text-gray-500 dark:text-gray-300">
                            Patient: {appointment.user.first_name} {appointment.user.last_name}
                        </p>
                    </div>
                </div>

                {/* VITAL SIGNS */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HeartPulse className="w-5 h-5" />
                            Vital Signs
                        </CardTitle>
                        <CardDescription>
                            Record the patient's vital signs
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="height">Height (cm)</Label>
                                <Input
                                    id="height"
                                    type="number"
                                    step="0.1"
                                    value={data.height}
                                    onChange={(e) => setData('height', e.target.value)}
                                />
                                {errors.height && <p className="text-sm text-red-600">{errors.height}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="weight">Weight (kg)</Label>
                                <Input
                                    id="weight"
                                    type="number"
                                    step="0.1"
                                    value={data.weight}
                                    onChange={(e) => setData('weight', e.target.value)}
                                />
                                {errors.weight && <p className="text-sm text-red-600">{errors.weight}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blood_pressure">Blood Pressure</Label>
                                <Input
                                    id="blood_pressure"
                                    placeholder="120/80"
                                    value={data.blood_pressure}
                                    onChange={(e) => setData('blood_pressure', e.target.value)}
                                />
                                {errors.blood_pressure && <p className="text-sm text-red-600">{errors.blood_pressure}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="pulse_rate">Pulse Rate (bpm)</Label>
                                <Input
                                    id="pulse_rate"
                                    type="number"
                                    value={data.pulse_rate}
                                    onChange={(e) => setData('pulse_rate', e.target.value)}
                                />
                                {errors.pulse_rate && <p className="text-sm text-red-600">{errors.pulse_rate}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="temperature">Temperature (°C)</Label>
                                <Input
                                    id="temperature"
                                    type="number"
                                    step="0.1"
                                    value={data.temperature}
                                    onChange={(e) => setData('temperature', e.target.value)}
                                />
                                {errors.temperature && <p className="text-sm text-red-600">{errors.temperature}</p>}
                            </div>

                        </div>

                        {/* REMARKS */}
                        <div className="space-y-2">
                            <Label htmlFor="remarks">Remarks / Notes</Label>

                            <textarea
                                id="remarks"
                                rows={4}
                                value={data.remarks}
                                onChange={(e) => setData('remarks', e.target.value)}
                                className="w-full p-3 border rounded-lg bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:ring-2 focus:ring-blue-500"
                                placeholder="Additional observations..."
                            />

                            {errors.remarks && <p className="text-sm text-red-600">{errors.remarks}</p>}
                        </div>

                        {/* BUTTONS */}
                        <div className="flex gap-4 pt-4">

                            <Button onClick={onSubmit} disabled={processing} className="flex items-center gap-2">
                                <Save className="w-4 h-4" />
                                {processing ? 'Saving...' : 'Save Physical Exam'}
                            </Button>

                            <Button variant="outline" onClick={goBack} disabled={processing}>
                                Cancel
                            </Button>

                        </div>

                    </CardContent>
                </Card>

                {/* BMI + FINAL */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* BMI */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Activity className="w-5 h-5" />
                                BMI Calculation
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-6">

                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                Live BMI calculation from height and weight.
                            </p>

                            {bmi ? (
                                <div
                                    className={`p-6 rounded-2xl border-2 text-center ${
                                        bmiCategory === 'Normal'
                                            ? 'bg-green-50 border-green-400 text-green-900'
                                            : bmiCategory === 'Underweight'
                                            ? 'bg-yellow-50 border-yellow-400 text-yellow-900'
                                            : bmiCategory === 'Overweight'
                                            ? 'bg-orange-50 border-orange-400 text-orange-900'
                                            : 'bg-red-50 border-red-400 text-red-900'
                                    }`}
                                >
                                    <p className="text-4xl font-black">{bmi}</p>
                                    <p className="text-xl font-bold">{bmiCategory}</p>
                                    <p className="text-sm opacity-70">Body Mass Index</p>
                                </div>
                            ) : (
                                <div className="p-6 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl text-center">

                                    <Scale className="w-16 h-16 mx-auto mb-4 text-gray-400" />

                                    <p className="text-lg font-semibold text-gray-600 dark:text-gray-300">
                                        Ready to Calculate
                                    </p>

                                    <p className="text-gray-500 dark:text-gray-400">
                                        Enter height and weight above
                                    </p>
                                </div>
                            )}

                        </CardContent>
                    </Card>

                    {/* FINAL DIAGNOSIS */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <HeartPulse className="w-5 h-5" />
                                Final Diagnosis
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-6">

                            <Button asChild size="lg" className="w-full">

                                <Link href={`/doctor/physical-exams/${appointment.id}/final`}>
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Complete Final Evaluation
                                </Link>

                            </Button>

                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                Mark appointment as completed after physical exam
                            </p>

                        </CardContent>
                    </Card>

                </div>
            </div>
        </>
    );
}

PhysicalExamForm.layout = (page: any) => <AppLayout>{page}</AppLayout>;