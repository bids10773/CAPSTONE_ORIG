import { useState } from 'react'
import { Head, router, Link } from '@inertiajs/react'
import AppLayout from '@/layouts/app-layout'
import { Building2, ArrowLeft, Save, Mail, Phone, User } from 'lucide-react'
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Create Companies',
        href: "",
    },
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
    })

    const [errors, setErrors] = useState<Record<string, string | undefined>>({})
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target

        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
        }))

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }))
        }
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        setIsSubmitting(true)
        setErrors({})

        router.post('/admin/companies', formData, {
            onError: (errors: any) => {
                setErrors(errors)
                setIsSubmitting(false)
            },
        })
    }

    return (
        <>
            <Head title="Add Company - Admin" />

            <div className="p-6 max-w-5xl mx-auto">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">

                    <Link
                        href="/admin/companies"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Building2 className="w-6 h-6" />
                            Add Company
                        </h1>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Register a new company with partner portal access
                        </p>
                    </div>

                </div>


                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Company Information */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
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
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="Enter company name"
                                />

                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.name}
                                    </p>
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
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
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
                                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="is_partnered" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Is Partnered
                                </label>
                            </div>

                        </div>
                    </div>


                    {/* Address */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Address
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Company Address
                                </label>

                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    rows={2}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-800 dark:text-white"
                                    placeholder="Enter company address"
                                />

                            </div>

                        </div>
                    </div>


                    {/* Representative Information */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                        <div className="flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-blue-600" />
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                                Company Representative
                            </h2>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                            Add the company's HR or admin representative who will manage the company portal. An account will be created with auto-verified email.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <User className="w-4 h-4 inline mr-1" />
                                    Representative Name *
                                </label>

                                <input
                                    type="text"
                                    name="representative_name"
                                    value={formData.representative_name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="Enter representative's full name"
                                />

                                {errors.representative_name && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.representative_name}
                                    </p>
                                )}
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Mail className="w-4 h-4 inline mr-1" />
                                    Representative Email *
                                </label>

                                <input
                                    type="email"
                                    name="representative_email"
                                    value={formData.representative_email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="hr@company.com"
                                />

                                {errors.representative_email && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.representative_email}
                                    </p>
                                )}
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    <Phone className="w-4 h-4 inline mr-1" />
                                    Representative Contact *
                                </label>

                                <input
                                    type="tel"
                                    name="representative_contact"
                                    value={formData.representative_contact}
                                    onChange={handleChange}
                                    maxLength={11}
                                    pattern="[0-9]*"
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                                    placeholder="+63 9XX XXX XXXX (max 11 digits)"
                                />

                                {errors.representative_contact && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.representative_contact}
                                    </p>
                                )}
                            </div>


                            <div className="md:col-span-2">
                                <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <input
                                        type="checkbox"
                                        name="send_invitation"
                                        id="send_invitation"
                                        checked={formData.send_invitation}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <label htmlFor="send_invitation" className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Send invitation email to representative with login credentials
                                    </label>
                                </div>
                            </div>

                        </div>
                    </div>


                    {/* Error Message */}
                    {errors.general && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                            {errors.general}
                        </div>
                    )}


                    {/* Buttons */}
                    <div className="flex justify-end gap-4">

                        <Link
                            href="/admin/companies"
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                            Cancel
                        </Link>

                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                            <Save className="w-4 h-4" />
                            {isSubmitting ? 'Creating...' : 'Create Company'}
                        </button>

                    </div>

                </form>

            </div>
        </>
    )
}

AdminCreateCompany.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>
}

