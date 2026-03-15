import { useState } from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Users, ArrowLeft, Save, Lock, Eye, EyeOff } from 'lucide-react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';

export default function CreateStaff() {

    const props = usePage().props as any;
    const { roles } = props;

    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        contact: '',
        role: 'doctor',
        license_no: '',
        specialization: '',
        password: '',
        password_confirmation: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;

        setFormData((prev) => ({
            ...prev,
            [name]: value,
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

        router.post('/admin/staff', formData, {
            onError: (errors) => {
                setErrors(errors);
                setIsSubmitting(false);
            },
        });
    };

    const showSpecialization = formData.role === 'doctor';
    const showLicense = formData.role !== 'company';

    const inputStyle =
        "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500";

    return (
        <>
            <Head title="Add Staff Member" />

            <div className="p-6">

                {/* Header */}
                <div className="flex items-center gap-4 mb-6">

                    <Link
                        href="/admin/staff"
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </Link>

                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Users className="w-6 h-6 text-blue-600" />
                            Add Staff Member
                        </h1>

                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                            Create a new staff account for the clinic
                        </p>
                    </div>

                </div>

                <div className="max-w-3xl mx-auto">


                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Role Selection */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Role Selection
                            </h2>

                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className={inputStyle}
                            >
                                {(Object.entries(roles) as [string, string][]).map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>

                            {errors.role && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.role}
                                </p>
                            )}

                        </div>

                        {/* Personal Information */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Personal Information
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <input
                                    type="text"
                                    name="first_name"
                                    value={formData.first_name}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    placeholder="Enter first name"
                                />

                                <input
                                    type="text"
                                    name="middle_name"
                                    value={formData.middle_name}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    placeholder="Enter middle name"
                                />

                                <input
                                    type="text"
                                    name="last_name"
                                    value={formData.last_name}
                                    onChange={handleChange}
                                    className={inputStyle}
                                    placeholder="Enter last name"
                                />

                                <input
                                    type="tel"
                                    name="contact"
                                    value={formData.contact}
                                    onChange={handleChange}
                                    maxLength={11}
                                    pattern="[0-9]*"
                                    className={inputStyle}
                                    placeholder="Enter contact number (max 11 digits)"
                                />

                            </div>

                        </div>

                        {/* Professional Information */}
                        {formData.role !== 'patient' && (

                            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                                <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                    Professional Information
                                </h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                    {showLicense && (
                                        <input
                                            type="text"
                                            name="license_no"
                                            value={formData.license_no}
                                            onChange={handleChange}
                                            maxLength={7}
                                            pattern="[0-9]*"
                                            className={inputStyle}
                                            placeholder="PRC license (max 7 digits)"
                                        />
                                    )}

                                    {showSpecialization && (
                                        <select
                                            name="specialization"
                                            value={formData.specialization}
                                            onChange={handleChange}
                                            className={inputStyle}
                                        >
                                            <option value="">Select specialization</option>
                                            <option value="General Medicine">General Medicine</option>
                                            <option value="Internal Medicine">Internal Medicine</option>
                                            <option value="Cardiology">Cardiology</option>
                                            <option value="Pediatrics">Pediatrics</option>
                                            <option value="Surgery">Surgery</option>
                                        </select>
                                    )}

                                </div>

                            </div>

                        )}

                        {/* Credentials */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">

                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
                                Account Credentials
                            </h2>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="email" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Email Address
                                    </Label>
                                    <div className="relative">
                                        <input
                                            id="email"
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={inputStyle}
                                            placeholder="Enter email address"
                                        />
                                    </div>
                                    {errors.email && <InputError message={errors.email} />}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleChange}
                                            className={`${inputStyle} pl-10 pr-10`}
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {errors.password && <InputError message={errors.password} />}
                                </div>


                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Confirm Password
                                    </Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            id="password_confirmation"
                                            type={showPassword ? "text" : "password"}
                                            name="password_confirmation"
                                            value={formData.password_confirmation}
                                            onChange={handleChange}
                                            className={`${inputStyle} pl-10`}
                                            placeholder="Confirm password"
                                        />
                                    </div>
                                    {errors.password_confirmation && <InputError message={errors.password_confirmation} />}
                                </div>


                            </div>

                        </div>

                        {/* Buttons */}
                        <div className="flex justify-end gap-4">

                            <Link
                                href="/admin/staff"
                                className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                                Cancel
                            </Link>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {isSubmitting ? 'Creating...' : 'Create Staff Member'}
                            </button>

                        </div>

                    </form>

                </div>

            </div>
        </>
    );
}

CreateStaff.layout = (page: any) => {
    return <AppLayout>{page}</AppLayout>;
};