import { Form, Head, usePage, router } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { register } from '@/routes';
import { store } from '@/routes/login';
import { request } from '@/routes/password';
import PasswordInput from '@/components/ui/password-input';
import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Props = {
    status?: string;
    canResetPassword: boolean;
    canRegister: boolean;
};

export default function Login({ status, canResetPassword, canRegister }: Props) {
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const { auth , errors} = usePage().props as any;
    const [formError, setFormError] = useState<string | null>(null);

    useEffect(() => {
    if (errors?.email) {
        setFormError(errors.email);

        // auto remove after 3 seconds
        const timer = setTimeout(() => {
            setFormError(null);
        }, 3000);

        return () => clearTimeout(timer);
    }
}, [errors]);

useEffect(() => {
    if (auth?.user) {
        router.visit('/dashboard');
    }
}, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('verified') === '1') {
            setShowVerifyModal(true);
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, []);

    return (
        <>
           {/* FULL SCREEN MODAL - Reduced Blur & Opacity */}
<AnimatePresence>
    {showVerifyModal && (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            // Changed backdrop-blur-xl to backdrop-blur-sm
            // Changed bg-gray-950/80 to bg-gray-950/40 for more transparency
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/40 backdrop-blur-sm p-4"
        >
            <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                // Added shadow-blue-500/20 to make the modal pop against the now-visible background
                className="bg-white rounded-[2.5rem] p-10 max-w-lg w-full text-center shadow-2xl shadow-blue-500/20 border border-blue-100"
            >
                <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                    className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 mb-8"
                >
                    <CheckCircle2 className="h-14 w-14 text-green-600" />
                </motion.div>
                
                <h2 className="text-4xl font-black text-gray-900 mb-6 tracking-tight uppercase">Verified!</h2>
                
                <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-6 mb-10 text-center">
                    <p className="text-gray-700 text-lg leading-relaxed font-medium">
    Your email has been successfully verified. You may now securely log in to your account.
</p>
                </div>

                <Button 
                    onClick={() => setShowVerifyModal(false)}
                    className="w-full py-8 text-xl bg-[#246AFE] hover:bg-blue-700 text-white rounded-2xl font-bold transition-all shadow-xl active:scale-95"
                >
                    Okay, I'm ready
                </Button>
            </motion.div>
        </motion.div>
    )}
</AnimatePresence>


            <AuthLayout
                title="Log in to your account"
                description="Enter your email and password below to log in"
            >
                <Head title="Log in" />

                <Form
                    {...store.form()}
                    resetOnSuccess={['password']}
                    className="flex flex-col gap-6"
                >
                    {({ processing, errors }) => (
                        <>
                        {formError && (
    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-semibold text-center animate-fade-in">
        {formError}
    </div>
)}
    <div className="grid gap-6">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email address</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        name="email"
                                        required
                                        autoFocus
                                        tabIndex={1}
                                        autoComplete="email"
                                        placeholder="email@example.com"
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        {canResetPassword && (
                                            <TextLink href={request()} className="ml-auto text-sm" tabIndex={5}>
                                                Forgot password?
                                            </TextLink>
                                        )}
                                    </div>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        placeholder="Password"
                                        className={errors.email ? 'border-red-500' : ''}
                                    />
                                </div>

                                <div className="flex items-center space-x-3">
                                    <Checkbox id="remember" name="remember" tabIndex={3} />
                                    <Label htmlFor="remember">Remember me</Label>
                                </div>

                                <Button
                                    type="submit"
                                    className="mt-4 w-full bg-[#246AFE] hover:bg-blue-700"
                                    tabIndex={4}
                                    disabled={processing}
                                    data-test="login-button"
                                >
                                    {processing && <Spinner />}
                                    Log in
                                </Button>
                            </div>

                            {canRegister && (
                                <div className="text-center text-sm text-muted-foreground text-white">
                                    Don't have an account?{' '}
                                    <TextLink href={register()} tabIndex={5}>
                                        Sign up
                                    </TextLink>
                                </div>
                            )}
                        </>
                    )}
                </Form>

{status && (
                    <div className="mt-8 p-6 bg-green-50 border border-green-200 rounded-2xl text-center">
                        <CheckCircle2 className="mx-auto h-12 w-12 text-green-600 mb-4" />
                        <p className="text-lg font-semibold text-green-800 mb-2">{status}</p>
                        <p className="text-green-700">You can now log in with your account.</p>
                    </div>
                )}

            </AuthLayout>
        </>
    );
}
