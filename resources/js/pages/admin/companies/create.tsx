import { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Building2, ArrowLeft, Save, Mail, Phone, User } from 'lucide-react';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Companies Management', href: '/admin/companies' },
    { title: 'Create Company', href: '' },
];

export default function AdminCreateCompany() {
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        status: 'active',
        is_partnered: false,
        // Representative fields
        representative_name: '',
        representative_email: '',
        representative_contact: '',
        send_invitation: true,
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
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        setIsSubmitting(true);
        setErrors({});

        router.post('/admin/companies', formData, {
            onError: (errors: any) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
        });
    };

    return (
        <>
            <Head title="Add Company - Admin" />

            <div className="mx-auto max-w-5xl p-6">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Link
                        href="/admin/companies"
                        className="rounded-lg p-2 transition hover:bg-gray-100"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600" />
                    </Link>

                    <div>
                        <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
                            <Building2 className="h-6 w-6" />
                            Add Company
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Register a new company with partner portal access
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Company Information */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
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
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                    placeholder="Enter company name"
                                />

                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
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
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    name="is_partnered"
                                    id="is_partnered"
                                    checked={formData.is_partnered}
                                    onChange={handleChange}
                                    className="h-4 w-4 rounded border-gray-300 text-moss-600 focus:ring-moss-500"
                                />
                                <label
                                    htmlFor="is_partnered"
                                    className="ml-2 text-sm font-medium text-gray-700"
                                >
                                    Is Partnered
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-semibold text-gray-900">
                            Address
                        </h2>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    Company Address
                                </label>

                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2"
                                    placeholder="Enter company address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Representative Information */}
                    <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center gap-2">
                            <User className="h-5 w-5 text-moss-600" />
                            <h2 className="text-lg font-semibold text-gray-900">
                                Company Representative
                            </h2>
                        </div>

                        <p className="mb-4 text-sm text-gray-500">
                            Add the company's HR or admin representative who
                            will manage the company portal. An account will be
                            created with auto-verified email.
                        </p>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    <User className="mr-1 inline h-4 w-4" />
                                    Representative Name *
                                </label>

                                <input
                                    type="text"
                                    name="representative_name"
                                    value={formData.representative_name}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                    placeholder="Enter representative's full name"
                                />

                                {errors.representative_name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.representative_name}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    <Mail className="mr-1 inline h-4 w-4" />
                                    Representative Email *
                                </label>

                                <input
                                    type="email"
                                    name="representative_email"
                                    value={formData.representative_email}
                                    onChange={handleChange}
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                    placeholder="hr@company.com"
                                />

                                {errors.representative_email && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.representative_email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                    <Phone className="mr-1 inline h-4 w-4" />
                                    Representative Contact *
                                </label>

                                <input
                                    type="tel"
                                    name="representative_contact"
                                    value={formData.representative_contact}
                                    onChange={handleChange}
                                    maxLength={11}
                                    pattern="[0-9]*"
                                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-moss-500 focus:ring-2 focus:ring-moss-500"
                                    placeholder="+63 9XX XXX XXXX (max 11 digits)"
                                />

                                {errors.representative_contact && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.representative_contact}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <div className="flex items-center rounded-lg border border-moss-200 bg-moss-50 p-4">
                                    <input
                                        type="checkbox"
                                        name="send_invitation"
                                        id="send_invitation"
                                        checked={formData.send_invitation}
                                        onChange={handleChange}
                                        className="h-4 w-4 rounded border-gray-300 text-moss-600 focus:ring-moss-500"
                                    />
                                    <label
                                        htmlFor="send_invitation"
                                        className="ml-2 text-sm font-medium text-gray-700"
                                    >
                                        Send invitation email to representative
                                        with login credentials
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {errors.general && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                            {errors.general}
                        </div>
                    )}

                    {/* Buttons */}
                    <div className="flex justify-end gap-4">
                        <Link
                            href="/admin/companies"
                            className="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 rounded-lg bg-moss-600 px-6 py-2 text-white hover:bg-moss-700 disabled:opacity-50"
                        >
                            <Save className="h-4 w-4" />
                            {isSubmitting ? 'Creating...' : 'Create Company'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}

AdminCreateCompany.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
