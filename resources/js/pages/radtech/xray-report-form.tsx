import { Head, Link, useForm, router } from '@inertiajs/react';
import { Image, Save, ArrowLeft, Upload, FileImage } from 'lucide-react';
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
  viewOptions?: Record<string, string>; // <-- this is important
}

export default function XrayReportForm(props: Props) {
    const { appointment, xrayReport, viewOptions } = props;

    const { data, setData, post, processing, errors } = useForm({
        view: xrayReport?.view || '',
        findings: xrayReport?.findings || '',
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
            <Head title="X-Ray Report Form - RadTech" />

            <div className="p-6 max-w-4xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={goBack}
                        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">X-Ray Report</h1>
                        <p className="text-gray-500">Patient: {appointment.user.first_name} {appointment.user.last_name}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Image className="w-5 h-5" />
                            X-Ray Report Details
                        </CardTitle>
                        <CardDescription>Complete the radiological findings and impression</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="view">View / Projection</Label>
                                <Select value={data.view} onValueChange={(value) => setData('view', value)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select view" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(viewOptions || {}).map(([key, value]) => (
    <SelectItem key={key} value={key}>
        {value}
    </SelectItem>
))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="findings">Findings</Label>
                                <textarea
  id="findings"
  rows={6}
  value={data.findings}
  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('findings', e.target.value)}
  placeholder="Describe the radiological findings in detail..."
  className="w-full p-2 border rounded resize-vertical"
/>
                                {errors.findings && <p className="text-sm text-red-600">{errors.findings}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="impression">Impression / Diagnosis</Label>
                               <textarea
  id="impression"
  rows={4}
  value={data.impression}
  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('impression', e.target.value)}
  placeholder="Radiological impression..."
  className="w-full p-2 border rounded resize-vertical"
/>
                                {errors.impression && <p className="text-sm text-red-600">{errors.impression}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="remarks">Additional Remarks</Label>
                               <textarea
  id="remarks"
  rows={3}
  value={data.remarks}
  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setData('remarks', e.target.value)}
  placeholder="Any additional clinical correlation or recommendations..."
  className="w-full p-2 border rounded resize-vertical"
/>
                                {errors.remarks && <p className="text-sm text-red-600">{errors.remarks}</p>}
                            </div>
                        </div>

                        {/* Image Upload */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Upload className="w-5 h-5" />
                                    Image Upload
                                </CardTitle>
                                <CardDescription>Upload X-Ray images (JPEG, PNG, max 2MB each)</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <Input
                                        id="images"
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    />
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Chest PA</span>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Lateral View</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-4 pt-6 border-t">
                            <Button onClick={onSubmit} disabled={processing} size="lg" className="flex items-center gap-2 flex-1">
                                <Save className="w-4 h-4" />
                                {processing ? 'Saving Report...' : 'Save X-Ray Report'}
                            </Button>
                            <Button variant="outline" onClick={goBack} disabled={processing} size="lg">
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

