import { Head, usePage, Link, router } from '@inertiajs/react';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    Save,
    Lock,
    User,
    Mail,
    Phone,
    BadgeCheck,
    Stethoscope,
} from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Staff Management', href: '/admin/staff' },
    { title: 'Create Staff', href: '' },
];

export default function CreateStaff() {
    const props = usePage().props as any;
    const { roles } = props;

    const [formData, setFormData] = useState({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        contact: '',
        sex: '',
        role: 'doctor',
        specialization: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const { name, value } = e.target;

        if (name === 'contact') {
            // This regex strips out any character that is NOT a number (0-9)
            const onlyNums = value.replace(/[^0-9]/g, '');

            setFormData((prev) => ({
                ...prev,
                [name]: onlyNums,
            }));
        } else {
            // Everything else (name, email, specialization) stays as is
            setFormData((prev) => ({
                ...prev,
                [name]: value,
            }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/admin/staff', formData, {
            onError: (err) => {
                setErrors(err);
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const inputStyle =
        'w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-moss-500/20 focus:border-moss-500 transition-all outline-none';
    const selectStyle =
        'w-full px-4 py-2 border border-gray-200 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-moss-500/20 focus:border-moss-500 transition-all outline-none cursor-pointer';

    return (
        <>
            <Head title="Add Staff Member" />

            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mx-auto max-w-4xl p-6"
            >
                {/* Header Section */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/admin/staff"
                            className="rounded-full border border-gray-200 bg-white p-2 shadow-sm transition-colors hover:bg-gray-50"
                        >
                            <ArrowLeft className="h-4 w-4 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">
                                Add New Staff
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Register a new medical or administrative
                                professional.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        {/* Left Column: Role & Credentials */}
                        <div className="space-y-6 lg:col-span-1">
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2 text-moss-600">
                                    <BadgeCheck className="h-4 w-4" />
                                    <h2 className="text-sm font-bold tracking-wider uppercase">
                                        Access Role
                                    </h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="mb-2 block text-[11px] font-bold text-muted-foreground uppercase">
                                            System Role
                                        </Label>
                                        <select
                                            name="role"
                                            value={formData.role}
                                            onChange={handleChange}
                                            className={selectStyle}
                                        >
                                            {(
                                                Object.entries(roles) as [
                                                    string,
                                                    string,
                                                ][]
                                            ).map(([val, label]) => (
                                                <option
                                                    key={val}
                                                    value={val}
                                                    className="bg-white"
                                                >
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.role && (
                                            <InputError message={errors.role} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-xl border border-moss-200 bg-moss-50 p-6 shadow-sm">
                                <div className="mb-4 flex items-center gap-2 text-amber-600">
                                    <Lock className="h-4 w-4" />
                                    <h2 className="text-sm font-bold tracking-wider uppercase">
                                        Security
                                    </h2>
                                </div>
                                <p className="text-sm leading-6 text-moss-900">
                                    A secure temporary password will be
                                    generated on the server and sent directly to
                                    the staff member’s email address.
                                </p>
                                <p className="mt-2 text-xs leading-5 text-moss-700">
                                    The staff member must replace it after their
                                    first successful login.
                                </p>
                            </div>
                        </div>

                        {/* Right Column: Personal & Professional Info */}
                        <div className="space-y-6 lg:col-span-2">
                            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                                <div className="mb-6 flex items-center gap-2 text-emerald-600">
                                    <User className="h-4 w-4" />
                                    <h2 className="text-sm font-bold tracking-wider uppercase">
                                        Profile Information
                                    </h2>
                                </div>

                                <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="relative">
                                        <Label className="mb-2 block text-[11px] font-bold text-muted-foreground uppercase">
                                            First Name
                                        </Label>
                                        <User className="absolute top-[38px] left-3 h-4 w-4 text-gray-400" />
                                        <input
                                            name="first_name"
                                            value={formData.first_name}
                                            onChange={handleChange}
                                            className={inputStyle}
                                            placeholder="John"
                                        />
                                        {errors.first_name && (
                                            <InputError
                                                message={errors.first_name}
                                            />
                                        )}
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-[11px] font-bold text-muted-foreground uppercase">
                                            Middle Name
                                        </Label>
                                        <input
                                            name="middle_name"
                                            value={formData.middle_name}
                                            onChange={handleChange}
                                            className={inputStyle.replace(
                                                'pl-10',
                                                'pl-4',
                                            )}
                                            placeholder="Quincy"
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-[11px] font-bold text-muted-foreground uppercase">
                                            Last Name
                                        </Label>
                                        <input
                                            name="last_name"
                                            value={formData.last_name}
                                            onChange={handleChange}
                                            className={inputStyle.replace(
                                                'pl-10',
                                                'pl-4',
                                            )}
                                            placeholder="Doe"
                                        />
                                        {errors.last_name && (
                                            <InputError
                                                message={errors.last_name}
                                            />
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div className="relative">
                                        <Label className="mb-2 block text-[11px] font-bold text-muted-foreground uppercase">
                                            Email Address
                                        </Label>
                                        <Mail className="absolute top-[38px] left-3 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            className={inputStyle}
                                            placeholder="john.doe@clinic.com"
                                        />
                                        {errors.email && (
                                            <InputError
                                                message={errors.email}
                                            />
                                        )}
                                    </div>
                                    <div className="relative">
                                        <Label className="mb-2 block text-[11px] font-bold text-muted-foreground uppercase">
                                            Contact Number
                                        </Label>
                                        <Phone className="absolute top-[38px] left-3 h-4 w-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            name="contact"
                                            value={formData.contact}
                                            onChange={handleChange}
                                            className={`${inputStyle} pl-10`}
                                            pattern="[0-9]*"
                                            minLength={11}
                                            maxLength={11}
                                            placeholder="09123456789"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label className="mb-2 block text-[11px] font-bold text-muted-foreground uppercase">
                                            Sex
                                        </Label>

                                        <select
                                            name="sex"
                                            value={formData.sex}
                                            onChange={handleChange}
                                            className={selectStyle}
                                            required
                                        >
                                            <option value="">Select Sex</option>
                                            <option value="male">Male</option>
                                            <option value="female">
                                                Female
                                            </option>
                                        </select>

                                        {errors.sex && (
                                            <InputError message={errors.sex} />
                                        )}
                                    </div>
                                </div>
                            </div>

                            {['doctor', 'radtech', 'medtech'].includes(
                                formData.role,
                            ) && (
                                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all">
                                    {/* Section Header */}
                                    <div className="mb-6 flex items-center gap-2 text-purple-600">
                                        <Stethoscope className="h-4 w-4" />
                                        <h2 className="text-sm font-bold tracking-wider text-gray-700 uppercase">
                                            Professional Credentials
                                        </h2>
                                    </div>

                                    <div className="grid grid-cols-1 gap-6">
                                        {/* Specialization Selection */}
                                        <div className="space-y-2">
                                            <Label className="ml-1 text-[11px] font-bold text-muted-foreground uppercase">
                                                Specialization
                                            </Label>
                                            <select
                                                name="specialization"
                                                value={formData.specialization}
                                                onChange={handleChange}
                                                className={`${selectStyle} cursor-pointer focus:ring-2 focus:ring-purple-500/20`}
                                                required
                                            >
                                                <option
                                                    value=""
                                                    disabled
                                                    className="text-gray-400"
                                                >
                                                    Select Department
                                                </option>

                                                {/* Role-specific logic: Doctors */}
                                                {formData.role === 'doctor' && (
                                                    <>
                                                        <option value="General Medicine">
                                                            General Medicine
                                                        </option>
                                                        <option value="Occupational Health">
                                                            Occupational Health
                                                            (Industrial)
                                                        </option>
                                                        <option value="Internal Medicine">
                                                            Internal Medicine
                                                        </option>
                                                        <option value="Cardiology">
                                                            Cardiology
                                                        </option>
                                                    </>
                                                )}

                                                {/* Role-specific logic: RadTechs */}
                                                {formData.role ===
                                                    'radtech' && (
                                                    <>
                                                        <option value="Diagnostic Radiography">
                                                            Diagnostic
                                                            Radiography
                                                        </option>
                                                        <option value="CT/MRI Specialist">
                                                            CT/MRI Specialist
                                                        </option>
                                                        <option value="X-Ray Specialist">
                                                            X-Ray Specialist
                                                        </option>
                                                    </>
                                                )}

                                                {/* Role-specific logic: MedTechs */}
                                                {formData.role ===
                                                    'medtech' && (
                                                    <>
                                                        <option value="Hematology">
                                                            Hematology
                                                        </option>
                                                        <option value="Clinical Microscopy">
                                                            Clinical Microscopy
                                                        </option>
                                                        <option value="Bacteriology">
                                                            Bacteriology
                                                        </option>
                                                    </>
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Submit Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-gray-100 pt-4">
                        <Link
                            href="/admin/staff"
                            className="px-6 py-2 text-sm font-bold text-gray-500 transition-colors hover:text-gray-700"
                        >
                            Cancel
                        </Link>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="h-11 gap-2 px-8 shadow-lg shadow-moss-500/20"
                        >
                            {isSubmitting ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Create Staff Account
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </>
    );
}

CreateStaff.layout = (page: any) => {
    return <AppLayout breadcrumbs={breadcrumbs}>{page}</AppLayout>;
};
