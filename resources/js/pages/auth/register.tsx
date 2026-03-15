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
                                onClick={() => setShowTermsModal(false)}
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
            description="Join Living Myth Industrial Clinic today"
        >
            <Head title="Register" />

            <Form
                {...store.form()}
                resetOnSuccess={['password', 'password_confirmation']}
                className="flex flex-col gap-5"
            >
                {({ processing, errors }) => (
                    <div className="space-y-5">

                        {/* NAME */}
                        <div className="grid grid-cols-2 gap-4">

                            <div className="space-y-2">
                                <Label htmlFor="first_name" className="text-sm font-semibold text-white">
                                    First Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                    <Input id="first_name" name="first_name" required autoFocus placeholder="First name" className="pl-10 h-11"/>
                                </div>
                                <InputError message={errors.first_name}/>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="last_name" className="text-sm font-semibold text-white">
                                    Last Name
                                </Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                    <Input id="last_name" name="last_name" required placeholder="Last name" className="pl-10 h-11"/>
                                </div>
                                <InputError message={errors.last_name}/>
                            </div>

                        </div>

                        {/* MIDDLE NAME */}
                        <div className="space-y-2">
                            <Label htmlFor="middle_name" className="text-sm font-semibold text-white">
                                Middle Name <span className="text-gray-300">(Optional)</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <Input id="middle_name" name="middle_name" placeholder="Middle name" className="pl-10 h-11"/>
                            </div>
                            <InputError message={errors.middle_name}/>
                        </div>

                        {/* EMAIL */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-semibold text-white">
                                Email Address
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <Input id="email" type="email" name="email" required placeholder="email@example.com" className="pl-10 h-11"/>
                            </div>
                            <InputError message={errors.email}/>
                        </div>

                        {/* CONTACT */}
                        <div className="space-y-2">
                            <Label htmlFor="contact" className="text-sm font-semibold text-white">
                                Contact Number
                            </Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                <Input id="contact" type="tel" name="contact" required maxLength={11} placeholder="09XXXXXXXXX" className="pl-10 h-11"/>
                            </div>
                            <InputError message={errors.contact}/>
                        </div>

                        {/* PASSWORD */}
                        <div className="grid grid-cols-2 gap-4">

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-sm font-semibold text-white">
                                    Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                    <Input id="password" name="password" type={showPassword ? "text":"password"} required className="pl-10 pr-10 h-11"/>
                                    <button type="button" onClick={()=>setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                        {showPassword ? <EyeOff className="h-4 w-4"/> : <Eye className="h-4 w-4"/>}
                                    </button>
                                </div>
                                <InputError message={errors.password}/>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password_confirmation" className="text-sm font-semibold text-white">
                                    Confirm Password
                                </Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"/>
                                    <Input id="password_confirmation" name="password_confirmation" type={showPassword ? "text":"password"} required className="pl-10 h-11"/>
                                </div>
                                <InputError message={errors.password_confirmation}/>
                            </div>

                        </div>

                        {/* TERMS */}
                        <div className="flex items-start space-x-3 pt-2">
                            <Checkbox id="terms" name="terms" required/>
                            <Label htmlFor="terms" className="text-sm text-white leading-tight">
                                I agree to the{" "}
                                <button type="button" onClick={()=>setShowTermsModal(true)} className="text-black font-semibold hover:underline">
                                    Terms & Privacy Policy
                                </button>
                            </Label>
                        </div>

                        {/* BUTTON */}
                        <motion.div whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}>
                            <Button type="submit" className="w-full h-12 bg-[#246AFE] hover:bg-blue-700 text-white font-bold text-base rounded-xl">
                                {processing ? <Spinner className="text-white"/> : "Create Account"}
                            </Button>
                        </motion.div>

                        {/* LOGIN */}
                        <div className="text-center text-sm text-white pt-2">
                            Already have an account?{" "}
                            <TextLink href={login()} className="text-black font-bold hover:underline">
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