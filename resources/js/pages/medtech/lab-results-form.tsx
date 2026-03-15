import { Head, Link, useForm, router } from '@inertiajs/react';
import { TestTube, Activity, Save, ArrowLeft } from 'lucide-react';
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
    labResult: any;
    normalValues: any;
}

export default function LabResultsForm(props: Props) {
    const { appointment, labResult, normalValues } = props;

    const { data, setData, post, processing, errors } = useForm({
        hemoglobin: labResult?.hemoglobin || '',
        hematocrit: labResult?.hematocrit || '',
        wbc_count: labResult?.wbc_count || '',
        rbc_count: labResult?.rbc_count || '',
        platelet: labResult?.platelet || '',
        segmenters: labResult?.segmenters || '',
        lymphocytes: labResult?.lymphocytes || '',
        monocytes: labResult?.monocytes || '',
        eosinophils: labResult?.eosinophils || '',
        basophils: labResult?.basophils || '',
        uri_color: labResult?.uri_color || '',
        uri_transparency: labResult?.uri_transparency || '',
        uri_ph: labResult?.uri_ph || '',
        uri_sp_gravity: labResult?.uri_sp_gravity || '',
        uri_sugar: labResult?.uri_sugar || '',
        uri_protein: labResult?.uri_protein || '',
        uri_wbc: labResult?.uri_wbc || '',
        uri_rbc: labResult?.uri_rbc || '',
        remarks: labResult?.remarks || '',
    });

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(`/medtech/lab-results/${appointment.id}`);
    };

    const goBack = () => {
        router.visit('/medtech/appointments');
    };

    const vitalFields = [
        { key: 'hemoglobin', label: 'Hemoglobin (g/dL)', normal: normalValues.hemoglobin?.male },
        { key: 'hematocrit', label: 'Hematocrit (%)', normal: normalValues.hematocrit?.male },
        { key: 'wbc_count', label: 'WBC Count (/cumm)', normal: normalValues.wbc_count?.normal },
        { key: 'rbc_count', label: 'RBC Count (million/cumm)', normal: normalValues.rbc_count?.male },
        { key: 'platelet', label: 'Platelet (/cumm)', normal: normalValues.platelet?.normal },
    ];

    const diffFields = [
        { key: 'segmenters', label: 'Segmenters (%)', normal: normalValues.segmenters?.normal },
        { key: 'lymphocytes', label: 'Lymphocytes (%)', normal: normalValues.lymphocytes?.normal },
        { key: 'monocytes', label: 'Monocytes (%)', normal: normalValues.monocytes?.normal },
        { key: 'eosinophils', label: 'Eosinophils (%)', normal: normalValues.eosinophils?.normal },
        { key: 'basophils', label: 'Basophils (%)', normal: normalValues.basophils?.normal },
    ];

    return (
        <>
            <Head title="Lab Results Form - MedTech" />

            <div className="p-6 max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={goBack}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Laboratory Results</h1>
                        <p className="text-gray-500">Patient: {appointment.user.first_name} {appointment.user.last_name} | Service: {appointment.service_type}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* CBC Panel */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TestTube className="w-5 h-5" />
                                Complete Blood Count (CBC)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {vitalFields.map((field) => (
                                <div key={field.key} className="space-y-1">
                                    <Label htmlFor={field.key}>{field.label}</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id={field.key}
                                            type="number"
                                            step="0.01"
                                            value={data[field.key as keyof typeof data] || ''}
                                            onChange={(e) => setData(field.key as any, e.target.value)}
                                            className="flex-1"
                                        />
                                        <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                            {field.normal}
                                        </span>
                                    </div>
                                    {errors[field.key as keyof typeof errors] && (
                                        <p className="text-sm text-red-600">{errors[field.key as keyof typeof errors]}</p>
                                    )}
                                </div>
                            ))}

                            {/* Differential Count */}
                            <div className="pt-6 border-t">
                                <h4 className="font-semibold mb-4">Differential Count</h4>
                                {diffFields.map((field) => (
                                    <div key={field.key} className="space-y-1">
                                        <Label htmlFor={field.key}>{field.label}</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id={field.key}
                                                type="number"
                                                step="0.1"
                                                value={data[field.key as keyof typeof data] || ''}
                                                onChange={(e) => setData(field.key as any, e.target.value)}
                                                className="flex-1"
                                            />
                                            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                                {field.normal}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Urinalysis & Other Tests */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TestTube className="w-5 h-5" />
                                Urinalysis & Other Tests
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Color</Label>
                                <Select value={data.uri_color} onValueChange={(value) => setData('uri_color', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select color" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="yellow">Yellow</SelectItem>
                                        <SelectItem value="amber">Amber</SelectItem>
                                        <SelectItem value="colorless">Colorless</SelectItem>
                                        <SelectItem value="cloudy">Cloudy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Transparency</Label>
                                <Select value={data.uri_transparency} onValueChange={(value) => setData('uri_transparency', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select transparency" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="clear">Clear</SelectItem>
                                        <SelectItem value="hazy">Hazy</SelectItem>
                                        <SelectItem value="cloudy">Cloudy</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="uri_ph">pH</Label>
                                    <Input
                                        id="uri_ph"
                                        type="number"
                                        step="0.1"
                                        value={data.uri_ph}
                                        onChange={(e) => setData('uri_ph', e.target.value)}
                                    />
                                    <span className="text-xs text-gray-500">Normal: 4.5-8.0</span>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="uri_sp_gravity">Specific Gravity</Label>
                                    <Input
                                        id="uri_sp_gravity"
                                        placeholder="1.010"
                                        value={data.uri_sp_gravity}
                                        onChange={(e) => setData('uri_sp_gravity', e.target.value)}
                                    />
                                    <span className="text-xs text-gray-500">Normal: 1.005-1.030</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Sugar</Label>
                                    <Select value={data.uri_sugar} onValueChange={(value) => setData('uri_sugar', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="negative">-</SelectItem>
                                            <SelectItem value="trace">Trace</SelectItem>
                                            <SelectItem value="1+">1+</SelectItem>
                                            <SelectItem value="2+">2+</SelectItem>
                                            <SelectItem value="3+">3+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Protein</Label>
                                    <Select value={data.uri_protein} onValueChange={(value) => setData('uri_protein', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="negative">-</SelectItem>
                                            <SelectItem value="trace">Trace</SelectItem>
                                            <SelectItem value="1+">1+</SelectItem>
                                            <SelectItem value="2+">2+</SelectItem>
                                            <SelectItem value="3+">3+</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Additional Remarks</Label>
                                <textarea
                                    id="remarks"
                                    rows={3}
                                    value={data.remarks}
                                    onChange={(e) => setData('remarks', e.target.value)}
                                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    placeholder="Drug tests, hepatitis screening, pregnancy test, FBS, etc."
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="flex gap-4 mt-8">
                    <Button onClick={onSubmit} disabled={processing} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        {processing ? 'Saving...' : 'Save Lab Results'}
                    </Button>
                    <Button variant="outline" onClick={goBack} disabled={processing}>
                        Cancel
                    </Button>
                </div>
            </div>
        </>
    );
}

LabResultsForm.layout = (page: any) => <AppLayout>{page}</AppLayout>;

