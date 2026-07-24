import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ChangeTemporaryPassword() {
    const [visibleFields, setVisibleFields] = useState({
        current: false,
        password: false,
        confirmation: false,
    });

    const toggleVisibility = (field: keyof typeof visibleFields) => {
        setVisibleFields((current) => ({ ...current, [field]: !current[field] }));
    };

    return (
        <>
            <Head title="Change temporary password" />
            <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
                <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <ShieldCheck className="size-6" />
                    </div>
                    <h1 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Create your private password</h1>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Your temporary password worked. Set a new password before accessing clinic modules.
                    </p>

                    <Form method="put" action="/temporary-password" className="mt-7 space-y-5" resetOnSuccess>
                        {({ errors, processing }) => (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="current_password">Current temporary password</Label>
                                    <div className="relative">
                                        <KeyRound className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input id="current_password" name="current_password" type={visibleFields.current ? 'text' : 'password'} autoComplete="current-password" className="h-11 px-10" required autoFocus />
                                        <button
                                            type="button"
                                            onClick={() => toggleVisibility('current')}
                                            className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-r-md text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            aria-label={visibleFields.current ? 'Hide current password' : 'Show current password'}
                                            aria-pressed={visibleFields.current}
                                        >
                                            {visibleFields.current ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.current_password} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password">New password</Label>
                                    <div className="relative">
                                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input id="password" name="password" type={visibleFields.password ? 'text' : 'password'} autoComplete="new-password" className="h-11 px-10" required />
                                        <button
                                            type="button"
                                            onClick={() => toggleVisibility('password')}
                                            className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-r-md text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            aria-label={visibleFields.password ? 'Hide new password' : 'Show new password'}
                                            aria-pressed={visibleFields.password}
                                        >
                                            {visibleFields.password ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password} />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation">Confirm new password</Label>
                                    <div className="relative">
                                        <LockKeyhole className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                                        <Input id="password_confirmation" name="password_confirmation" type={visibleFields.confirmation ? 'text' : 'password'} autoComplete="new-password" className="h-11 px-10" required />
                                        <button
                                            type="button"
                                            onClick={() => toggleVisibility('confirmation')}
                                            className="absolute right-0 top-0 flex size-11 items-center justify-center rounded-r-md text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                                            aria-label={visibleFields.confirmation ? 'Hide password confirmation' : 'Show password confirmation'}
                                            aria-pressed={visibleFields.confirmation}
                                        >
                                            {visibleFields.confirmation ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                        </button>
                                    </div>
                                    <InputError message={errors.password_confirmation} />
                                </div>

                                <p className="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-5 text-blue-800">
                                    Use at least eight characters and avoid reusing the temporary password.
                                </p>

                                <Button type="submit" disabled={processing} className="h-11 w-full">
                                    {processing && <LoaderCircle className="size-4 animate-spin" />}
                                    Save password and continue
                                </Button>
                            </>
                        )}
                    </Form>
                </section>
            </main>
        </>
    );
}
