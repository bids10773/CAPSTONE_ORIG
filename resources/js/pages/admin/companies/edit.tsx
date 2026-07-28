import { useState } from 'react';
import { Head, usePage, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { ArrowLeft, Save, Mail } from 'lucide-react';
import { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Companies Management', href: '/admin/companies' },
    { title: 'Edit Company', href: '' },
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

    const [errors, setErrors] = useState<Record<string, string | undefined>>(
        {},
    );
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (
        e: React.ChangeEvent<
            HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >,
    ) => {
        const { name, value, type } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]:
                type === 'checkbox'
                    ? (e.target as HTMLInputElement).checked
                    : value,
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
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-gray-700 transition hover:bg-gray-200"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Companies
                        </Link>
                    </div>

                    {/* FORM */}
                    <form
                        onSubmit={handleSubmit}
                        className="mb-6 space-y-6 p-4"
                    >
                        {/* COMPANY INFO */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-lg font-semibold text-gray-900">
                                Company Information
                            </h2>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Company Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-moss-500"
                                        placeholder="Enter company name"
                                    />
                                    {errors.name && (
                                        <p className="mt-1 text-sm text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                        Status
                                    </label>
                                    <select
                                        name="status"
                                        value={formData.status}
                                        onChange={handleChange}
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-moss-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">
                                            Inactive
                                        </option>
                                    </select>
                                </div>

                                <div className="mt-6 flex items-center">
                                    <input
                                        type="checkbox"
                                        name="is_partnered"
                                        checked={formData.is_partnered}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-gray-300 text-moss-600 focus:ring-moss-500"
                                    />
                                    <label className="ml-2 text-sm text-gray-700">
                                        Is Partnered
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* ADDRESS */}
                        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h2 className="mb-6 text-lg font-semibold text-gray-900">
                                Address
                            </h2>

                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={3}
                                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:ring-2 focus:ring-moss-500"
                                placeholder="Enter company address"
                            />
                        </div>

                        {/* REPRESENTATIVE */}
                        {company.representative_email && (
                            <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6">
                                <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-yellow-900">
                                    <Mail className="h-5 w-5" />
                                    Company Representative
                                </h3>

                                <div className="space-y-1 text-sm text-gray-700">
                                    <p>
                                        <strong>Name:</strong>{' '}
                                        {company.representative_name}
                                    </p>
                                    <p>
                                        <strong>Email:</strong>{' '}
                                        {company.representative_email}
                                    </p>
                                    <p>
                                        <strong>Contact:</strong>{' '}
                                        {company.representative_contact}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={() =>
                                        router.post(
                                            `/admin/companies/${company.id}/resend-invitation`,
                                        )
                                    }
                                    className="mt-4 rounded-lg bg-yellow-600 px-4 py-2 text-white transition hover:bg-yellow-700"
                                >
                                    Resend Invitation Email
                                </button>
                            </div>
                        )}

                        {/* ERROR */}
                        {errors.general && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-600">
                                {errors.general}
                            </div>
                        )}

                        {/* ACTIONS */}
                        <div className="flex justify-end gap-4">
                            <Link
                                href="/admin/companies"
                                className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 transition hover:bg-gray-100"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 rounded-lg bg-moss-600 px-6 py-2 text-white transition hover:bg-moss-700 disabled:opacity-50"
                            >
                                <Save className="h-4 w-4" />
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
