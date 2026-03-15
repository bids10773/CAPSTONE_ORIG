import { Form, Head, usePage } from '@inertiajs/react';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { logout } from '@/routes';
import { send } from '@/routes/verification';
import { motion } from 'framer-motion';

export default function VerifyEmail() {
    const pageProps = usePage().props as Record<string, unknown>;
    const status = pageProps.status as string | undefined;

    return (
        <AuthLayout
            title="Verify email"
            description="Almost there! Please check your inbox for the verification link we just sent."
        >
            <Head title="Email verification" />

            {/* Success Message - Made it Blue/Emerald to match theme */}
            {status === 'verification-link-sent' && (
                <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-xl bg-emerald-50 text-center text-sm font-semibold text-emerald-600 border border-emerald-100"
                >
                    A fresh verification link has been sent to your email address.
                </motion.div>
            )}

            <Form {...send.form()} className="space-y-6 text-center">
                {({ processing }) => (
                    <>
                        {/* Custom Blue Button Design */}
                        <Button 
                            disabled={processing} 
                            className="w-full bg-[#246AFE] hover:bg-blue-700 text-white py-6 rounded-2xl shadow-lg shadow-blue-500/20 transition-all active:scale-95"
                        >
                            {processing ? <Spinner className="mr-2 h-4 w-4" /> : null}
                            Resend verification email
                        </Button>

                        <div className="flex flex-col gap-4">
                            <TextLink
                                href={logout()}
                                method="post" // Crucial for Fortify logouts
                                as="button"
                                className="mx-auto block text-sm font-medium text-white-500 hover:text-[#246AFE] transition-colors"
                            >
                                Use a different email? Log out
                            </TextLink>
                        </div>
                    </>
                )}
            </Form>
        </AuthLayout>
    );
}
