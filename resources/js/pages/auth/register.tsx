import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck, User, Mail, Phone, Lock, Eye, EyeOff } from 'lucide-react';

export default function Register() {
const [showPassword, setShowPassword] = useState(false);
const [showTermsModal, setShowTermsModal] = useState(false);
const [acceptedTerms, setAcceptedTerms] = useState(false);

return (
    <>
        {/* TERMS & PRIVACY MODAL */}
        <AnimatePresence>
            {showTermsModal && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-md"
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl shadow-blue-500/20 overflow-hidden"
                    >
                        <div className="p-6 border-b flex items-center justify-between bg-gradient-to-r from-blue-600 to-blue-700">
                            <div className="flex items-center gap-3 text-white">
                                <ShieldCheck className="h-7 w-7" />
                                <h2 className="text-xl font-bold">Terms & Privacy Policy</h2>
                            </div>
                            <button
                                onClick={() => setShowTermsModal(false)}
                                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X className="h-5 w-5 text-white" />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto text-gray-600 text-sm leading-relaxed space-y-4 max-h-[60vh]">
                            <p className="font-bold text-gray-900 text-base">
                                Living Myth Industrial Clinic Data Privacy Agreement
                            </p>
                            <p>
                                By registering, you agree that your medical information will be handled in accordance with the <strong>Data Privacy Act of 2012 (RA 10173)</strong>.
                            </p>
                            <p>
                                We collect your Name, Email, and Contact Number solely for medical record verification and appointment scheduling.
                            </p>
                            <p>
                                <strong>Disclaimer:</strong> This portal is for official industrial clinic use only.
                            </p>
                            <p>
                                <strong>Retention:</strong> Your data is stored securely and retained only as necessary.
                            </p>
                        </div>

                        <div className="p-6 border-t bg-gray-50 flex justify-end">
                            <Button
                                onClick={() => {
                                setAcceptedTerms(true);  
                                setShowTermsModal(false);
                            }}
                                className="px-10 h-11 bg-[#246AFE] hover:bg-blue-700"
                            >
                                I Understand & Accept
                            </Button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>

        <AuthLayout
            title="Create an account"
            variant="register"   // ← add this
        >
            <Head title="Register" />

            <Form
    {...store.form()}
    resetOnSuccess={['password', 'password_confirmation']}
    className="flex flex-col gap-0 w-full"
>
    {({ processing, errors }) => (
        <div className="space-y-3">

            {/* ROW 1 — First + Last name */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="first_name" className="text-xs font-semibold text-gray-700">First Name</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"/>
                        <Input id="first_name" name="first_name" required autoFocus placeholder="First name" className="pl-9 h-9 text-sm"/>
                    </div>
                    <InputError message={errors.first_name}/>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="last_name" className="text-xs font-semibold text-gray-700">Last Name</Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"/>
                        <Input id="last_name" name="last_name" required placeholder="Last name" className="pl-9 h-9 text-sm"/>
                    </div>
                    <InputError message={errors.last_name}/>
                </div>
            </div>

            {/* ROW 2 — Middle name + Contact */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="middle_name" className="text-xs font-semibold text-gray-700">
                        Middle Name <span className="text-gray-400 font-normal">(Optional)</span>
                    </Label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"/>
                        <Input id="middle_name" name="middle_name" placeholder="Middle name" className="pl-9 h-9 text-sm"/>
                    </div>
                    <InputError message={errors.middle_name}/>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="contact" className="text-xs font-semibold text-gray-700">Contact Number</Label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"/>
                        <Input id="contact" type="tel" name="contact" required maxLength={11} placeholder="09XXXXXXXXX" className="pl-9 h-9 text-sm"/>
                    </div>
                    <InputError message={errors.contact}/>
                </div>
            </div>

            {/* ROW 3 — Birthdate + Sex + Civil Status */}
<div className="grid grid-cols-3 gap-3">

    {/* Birthdate */}
    <div className="space-y-1">
        <Label
            htmlFor="birthdate"
            className="text-xs font-semibold text-gray-700"
        >
            Birthdate
        </Label>

        <Input
            id="birthdate"
            type="date"
            name="birthdate"
            required
            max={new Date().toISOString().split('T')[0]}
            className="h-9 text-sm"
        />

        <InputError message={errors.birthdate}/>
    </div>

    {/* Sex */}
    <div className="space-y-1">
        <Label
            htmlFor="sex"
            className="text-xs font-semibold text-gray-700"
        >
            Sex
        </Label>

        <select
            id="sex"
            name="sex"
            required
            className="
                w-full h-9 px-3 text-sm
                border border-input
                rounded-md
                bg-background
                focus:ring-2 focus:ring-[#0097A7]
                outline-none
            "
        >
            <option value="">Select</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
        </select>

        <InputError message={errors.sex}/>
    </div>

    {/* Civil Status */}
    <div className="space-y-1">
        <Label
            htmlFor="civil_status"
            className="text-xs font-semibold text-gray-700"
        >
            Civil Status
        </Label>

        <select
            id="civil_status"
            name="civil_status"
            required
            className="
                w-full h-9 px-3 text-sm
                border border-input
                rounded-md
                bg-background
                focus:ring-2 focus:ring-[#0097A7]
                outline-none
            "
        >
            <option value="">Select</option>
            <option value="Single">Single</option>
            <option value="Married">Married</option>
            <option value="Divorced">Divorced</option>
            <option value="Widowed">Widowed</option>
        </select>

        <InputError message={errors.civil_status}/>
    </div>
</div>

            {/* ROW 3 — Email full width */}
            <div className="space-y-1">
                <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email Address</Label>
                <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"/>
                    <Input id="email" type="email" name="email" required placeholder="email@example.com" className="pl-9 h-9 text-sm"/>
                </div>
                <InputError message={errors.email}/>
            </div>

            {/* ROW 4 — Password + Confirm Password */}
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"/>
                        <Input id="password" name="password" type={showPassword ? "text" : "password"} required className="pl-9 pr-9 h-9 text-sm"/>
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                            {showPassword ? <EyeOff className="h-3.5 w-3.5"/> : <Eye className="h-3.5 w-3.5"/>}
                        </button>
                    </div>
                    <InputError message={errors.password}/>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="password_confirmation" className="text-xs font-semibold text-gray-700">Confirm Password</Label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400"/>
                        <Input id="password_confirmation" name="password_confirmation" type={showPassword ? "text" : "password"} required className="pl-9 h-9 text-sm"/>
                    </div>
                    <InputError message={errors.password_confirmation}/>
                </div>
            </div>

            {/* TERMS */}
            <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                    id="terms"
                    name="terms"
                    checked={acceptedTerms}
                    onCheckedChange={(value) => setAcceptedTerms(!!value)}
                    required
                />
                <Label htmlFor="terms" className="text-xs text-gray-700 leading-tight">
                    I agree to the{" "}
                    <button type="button" onClick={() => setShowTermsModal(true)} className="text-[#0097A7] font-semibold hover:underline">
                        Terms & Privacy Policy
                    </button>
                </Label>
            </div>

            {/* SUBMIT */}
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button type="submit" className="w-full h-10 bg-[#2E7D32] hover:bg-[#6FC276] text-white font-bold text-sm rounded-xl">
                    {processing ? <Spinner className="text-white"/> : "Create Account"}
                </Button>
            </motion.div>

            {/* SIGN IN */}
            <div className="text-center text-xs text-gray-600 pt-1">
                Already have an account?{" "}
                <TextLink href={login()} className="text-[#0097A7] font-bold hover:underline">
                    Sign in
                </TextLink>
            </div>

        </div>
    )}
</Form>
        </AuthLayout>
    </>
);

}