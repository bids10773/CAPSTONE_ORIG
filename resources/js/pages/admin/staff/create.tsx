import { useState, useEffect} from 'react';
import { Head, usePage, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Users, ArrowLeft, Save, Lock, Eye, EyeOff, 
    User, Mail, Phone, BadgeCheck, Stethoscope 
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { BreadcrumbItem } from '@/types';
import { motion } from "framer-motion";

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Staff Management', href: "/admin/staff" },
    { title: 'Create Staff', href: "" },
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

  // Add 'license_no' to the numeric-only check
  if (name === 'contact' || name === 'license_no') {
    // This regex strips out any character that is NOT a number (0-9)
    const onlyNums = value.replace(/[^0-9]/g, '');
    
    setFormData(prev => ({ 
        ...prev, 
        [name]: onlyNums 
    }));
  } else {
    // Everything else (name, email, specialization) stays as is
    setFormData(prev => ({ 
        ...prev, 
        [name]: value 
    }));
  }
};

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/admin/staff', formData, {
            onError: (err) => {
                setErrors(err);
                setIsSubmitting(false);
            },
        });
    };

    const showSpecialization = formData.role === 'doctor';
    const showLicense = formData.role !== 'company';

    const inputStyle = "w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none";
    const selectStyle = "w-full px-4 py-2 border border-gray-200 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none cursor-pointer";

    return (
        <>
            <Head title="Add Staff Member" />

            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto p-6"
            >
                {/* Header Section */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/staff" className="p-2 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm">
                            <ArrowLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Add New Staff</h1>
                            <p className="text-sm text-muted-foreground">Register a new medical or administrative professional.</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Left Column: Role & Credentials */}
                        <div className="lg:col-span-1 space-y-6">
                            <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
                                    <BadgeCheck className="w-4 h-4" />
                                    <h2 className="text-sm font-bold uppercase tracking-wider">Access Role</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-2 block">System Role</Label>
                                        <select name="role" value={formData.role} onChange={handleChange} className={selectStyle}>
                                            {(Object.entries(roles) as [string, string][]).map(([val, label]) => (
                                                <option key={val} value={val} className="dark:bg-gray-950">{label}</option>
                                            ))}
                                        </select>
                                        {errors.role && <InputError message={errors.role} />}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-4 text-amber-600 dark:text-amber-400">
                                    <Lock className="w-4 h-4" />
                                    <h2 className="text-sm font-bold uppercase tracking-wider">Security</h2>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-2 block">Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type={showPassword ? "text" : "password"} name="password" value={formData.password} onChange={handleChange} className={inputStyle} placeholder="••••••••" />
                                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500">
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {errors.password && <InputError message={errors.password} />}
                                    </div>
                                    <div>
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-2 block">Confirm Password</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            <input type={showPassword ? "text" : "password"} name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} className={inputStyle} placeholder="••••••••" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Personal & Professional Info */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                                <div className="flex items-center gap-2 mb-6 text-emerald-600 dark:text-emerald-400">
                                    <User className="w-4 h-4" />
                                    <h2 className="text-sm font-bold uppercase tracking-wider">Profile Information</h2>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div className="relative">
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-2 block">First Name</Label>
                                        <User className="absolute left-3 top-[38px] w-4 h-4 text-gray-400" />
                                        <input name="first_name" value={formData.first_name} onChange={handleChange} className={inputStyle} placeholder="John" />
                                        {errors.first_name && <InputError message={errors.first_name} />}
                                    </div>
                                    <div>
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-2 block">Middle Name</Label>
                                        <input name="middle_name" value={formData.middle_name} onChange={handleChange} className={inputStyle.replace('pl-10', 'pl-4')} placeholder="Quincy" />
                                    </div>
                                    <div>
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-2 block">Last Name</Label>
                                        <input name="last_name" value={formData.last_name} onChange={handleChange} className={inputStyle.replace('pl-10', 'pl-4')} placeholder="Doe" />
                                        {errors.last_name && <InputError message={errors.last_name} />}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="relative">
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-2 block">Email Address</Label>
                                        <Mail className="absolute left-3 top-[38px] w-4 h-4 text-gray-400" />
                                        <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputStyle} placeholder="john.doe@clinic.com" />
                                        {errors.email && <InputError message={errors.email} />}
                                    </div>
                                    <div className="relative">
                                        <Label className="text-[11px] font-bold uppercase text-muted-foreground mb-2 block">Contact Number</Label>
                                        <Phone className="absolute left-3 top-[38px] w-4 h-4 text-gray-400" />
                                        <input type="tel" name="contact" value={formData.contact} onChange={handleChange} className={`${inputStyle} pl-10`} pattern="[0-9]*" minLength={11}
            maxLength={11} placeholder="09123456789" required/>
                                    </div>
                                </div>
                            </div>

                           {['doctor', 'radtech', 'medtech'].includes(formData.role) && (
    <div className="bg-white dark:bg-gray-950 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm transition-all">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-6 text-purple-600 dark:text-purple-400">
            <Stethoscope className="w-4 h-4" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                Professional Credentials
            </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRC License Input */}
            <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">
                    PRC License No.
                </Label>
                <div className="relative group">
                    <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-purple-500 transition-colors" />
                    <input 
                        type="text"
                        name="license_no" 
                        value={formData.license_no} 
                        onChange={handleChange} 
                        className={`${inputStyle} pl-10 focus:ring-2 focus:ring-purple-500/20`} 
                        placeholder="7-digit License #" 
                        maxLength={7}
                        pattern="\d{7}" // Validates exactly 7 digits
                        required
                    />
                </div>
            </div>

            {/* Specialization Selection */}
            <div className="space-y-2">
                <Label className="text-[11px] font-bold uppercase text-muted-foreground ml-1">
                    Specialization
                </Label>
                <select 
                    name="specialization" 
                    value={formData.specialization} 
                    onChange={handleChange} 
                    className={`${selectStyle} cursor-pointer focus:ring-2 focus:ring-purple-500/20`}
                    required
                >
                    <option value="" disabled className="text-gray-400">Select Department</option>
                    
                    {/* Role-specific logic: Doctors */}
                    {formData.role === 'doctor' && (
                        <>
                            <option value="General Medicine">General Medicine</option>
                            <option value="Occupational Health">Occupational Health (Industrial)</option>
                            <option value="Internal Medicine">Internal Medicine</option>
                            <option value="Cardiology">Cardiology</option>
                        </>
                    )}

                    {/* Role-specific logic: RadTechs */}
                    {formData.role === 'radtech' && (
                        <>
                            <option value="Diagnostic Radiography">Diagnostic Radiography</option>
                            <option value="CT/MRI Specialist">CT/MRI Specialist</option>
                            <option value="X-Ray Specialist">X-Ray Specialist</option>
                        </>
                    )}

                    {/* Role-specific logic: MedTechs */}
                    {formData.role === 'medtech' && (
                        <>
                            <option value="Hematology">Hematology</option>
                            <option value="Clinical Microscopy">Clinical Microscopy</option>
                            <option value="Bacteriology">Bacteriology</option>
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
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
                        <Link href="/admin/staff" className="px-6 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            Cancel
                        </Link>
                        <Button type="submit" disabled={isSubmitting} className="h-11 px-8 gap-2 shadow-lg shadow-blue-500/20">
                            {isSubmitting ? (
                                <>Processing...</>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
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