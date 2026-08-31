import { Form, Head } from '@inertiajs/react';
import { Mail, ShieldCheck } from 'lucide-react';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

export default function SocialEmail() {
    return (
        <>
            <Head title="Complete account setup" />
            <AuthLayout variant="login">
                <header className="mb-7">
                    <div className="mb-5 flex size-11 items-center justify-center rounded-xl bg-moss-50 text-moss-600">
                        <ShieldCheck className="size-5" />
                    </div>
                    <p className="text-xs font-semibold tracking-[.16em] text-moss-600 uppercase">
                        Complete account setup
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                        Add your email address
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Facebook did not provide an email address. Enter one
                        below and we will send a verification link before
                        continuing.
                    </p>
                </header>
                <Form
                    action="/auth/social/email"
                    method="post"
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div>
                                <label
                                    htmlFor="email"
                                    className="mb-2 block text-sm font-medium text-slate-700"
                                >
                                    Email address *
                                </label>
                                <div className="auth-input-wrap">
                                    <Mail className="auth-input-icon" />
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        autoFocus
                                        autoComplete="email"
                                        className="auth-input"
                                        placeholder="you@example.com"
                                    />
                                </div>
                                <InputError
                                    message={errors.email}
                                    className="mt-1.5"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="auth-primary-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-4" /> Sending
                                        verification email...
                                    </>
                                ) : (
                                    'Send verification email'
                                )}
                            </button>
                        </>
                    )}
                </Form>
            </AuthLayout>
        </>
    );
}
