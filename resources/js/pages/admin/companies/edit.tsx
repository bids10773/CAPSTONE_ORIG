import { useState } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ArrowLeft, Save, Mail } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Edit Company',
        href: "",
    },
];

interface Company {
    id: number;
    name: string;
    address: string | null;
    status: string;
    is_partnered: boolean;
    representative_email?: string;
    representative_name?: string;
    representative_contact?: string;
}

export default function AdminEditCompany() {
    const props = usePage().props as any;
    const { company } = props;

    const [formData, setFormData] = useState({
        name: company.name || '',
        address: company.address || '',
        status: company.status || 'active',
        is_partnered: company.is_partnered || false,
    });

    const [errors, setErrors] = useState<Record<string, string | undefined>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
        }));

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrors({});

        router.put(`/admin/companies/${company.id}`, formData, {
            onError: (errors: any) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Edit Company - Admin" />

            <div className="p-6">

                <div className="max-w-3xl space-y-6">

                    {/* BACK BUTTON */}
                    <div>
                        <Link
                            href="/admin/companies"
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg 
                            bg-gray-100 dark:bg-gray-800 
                            text-gray-700 dark:text-gray-300 
                            hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Companies
                        </Link>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="space-y-6 p-4 mb-6">

                        {/* COMPANY INFO */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                Company Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-700 
                                        text-gray-900 dark:text-gray-100 
                                        rounded-lg focus:ring-2 focus:ring-blue-500"
                                        placeholder="Enter company name"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                                        bg-white dark:bg-gray-700 
                                        text-gray-900 dark:text-gray-100 
                                        rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                <div className="flex items-center mt-6">
                                    <input
                                        type="checkbox"
                                        name="is_partnered"
                                        checked={formData.is_partnered}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                                    />
                                    <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                                        Is Partnered
                                    </label>
                                </div>

                            </div>
                        </div>

                        {/* ADDRESS */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                                Address
                            </h2>

                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 
                                bg-white dark:bg-gray-700 
                                text-gray-900 dark:text-gray-100 
                                rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="Enter company address"
                            />
                        </div>

                        {/* REPRESENTATIVE */}
                        {company.representative_email && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-6">
                                <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-4 flex items-center gap-2">
                                    <Mail className="w-5 h-5" />
                                    Company Representative
                                </h3>

                                <div className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
                                    <p><strong>Name:</strong> {company.representative_name}</p>
                                    <p><strong>Email:</strong> {company.representative_email}</p>
                                    <p><strong>Contact:</strong> {company.representative_contact}</p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => router.post(`/admin/companies/${company.id}/resend-invitation`)}
                                    className="mt-4 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                                >
                                    Resend Invitation Email
                                </button>
                            </div>
                        )}

                        {/* ERROR */}
                        {errors.general && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 px-4 py-3 rounded-lg">
                                {errors.general}
                            </div>
                        )}

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href="/admin/companies"
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 
                                text-gray-700 dark:text-gray-300 
                                rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                    </form>
                </div>
            </div>
        </>
    );
}

AdminEditCompany.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};