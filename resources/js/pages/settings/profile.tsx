import { Transition } from '@headlessui/react';
import { Form, Head, Link, usePage } from '@inertiajs/react';
import ProfileController from '@/actions/App/Http/Controllers/Settings/ProfileController';
import DeleteUser from '@/components/delete-user';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/profile';
import { send } from '@/routes/verification';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Profile settings',
        href: edit().url,
    },
];

export default function Profile({
    mustVerifyEmail,
    status,
}: {
    mustVerifyEmail: boolean;
    status?: string;
}) {
    const { auth } = usePage<SharedData>().props;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile settings" />

            <h1 className="sr-only">Profile Settings</h1>

            <SettingsLayout>
            
<div className="space-y-8">
    {/* HEADER CARD */}
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-2xl font-bold text-white shadow-lg shadow-blue-500/20">
                {auth.user.first_name?.[0]}
                {auth.user.last_name?.[0]}
            </div>

            <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                    {auth.user.first_name} {auth.user.last_name}
                </h2>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                    Manage your account and patient information
                </p>
            </div>
        </div>
    </div>

    {/* FORM CARD */}
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 sm:p-8">
        <Heading
            variant="small"
            title="Profile information"
            description="Update your personal and medical details"
        />

        <Form
            {...ProfileController.update.form()}
            options={{
                preserveScroll: true,
            }}
            className="mt-8 space-y-8"
        >
            {({ processing, recentlySuccessful, errors }) => (
                <>
                    {/* PERSONAL INFO */}
                    <div>
                        <div className="mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Personal Information
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                            {/* First Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="first_name">First Name</Label>
                                <Input
                                    id="first_name"
                                    defaultValue={auth.user.first_name}
                                    name="first_name"
                                    required
                                    placeholder="First name"
                                    className="h-11 rounded-xl"
                                />
                                <InputError message={errors.first_name} />
                            </div>

                            {/* Middle Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="middle_name">Middle Name</Label>
                                <Input
                                    id="middle_name"
                                    defaultValue={auth.user.middle_name || ''}
                                    name="middle_name"
                                    placeholder="Middle name"
                                    className="h-11 rounded-xl"
                                />
                                <InputError message={errors.middle_name} />
                            </div>

                            {/* Last Name */}
                            <div className="grid gap-2">
                                <Label htmlFor="last_name">Last Name</Label>
                                <Input
                                    id="last_name"
                                    defaultValue={auth.user.last_name}
                                    name="last_name"
                                    required
                                    placeholder="Last name"
                                    className="h-11 rounded-xl"
                                />
                                <InputError message={errors.last_name} />
                            </div>

                            {/* Email */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    defaultValue={auth.user.email}
                                    name="email"
                                    required
                                    placeholder="Email address"
                                    className="h-11 rounded-xl"
                                />
                                <InputError message={errors.email} />
                            </div>
                        </div>
                    </div>

                    {/* MEDICAL INFO */}
                    <div>
                        <div className="mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                Patient Information
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                            {/* Birthdate */}
                            <div className="grid gap-2">
                                <Label htmlFor="birthdate">Birthdate</Label>
                                <Input
                                    id="birthdate"
                                    type="date"
                                    defaultValue={auth.user.patient_profile?.birthdate || ''}
                                    name="birthdate"
                                    className="h-11 rounded-xl"
                                />
                                <InputError message={errors.birthdate} />
                            </div>

                            {/* Sex */}
                            <div className="grid gap-2">
                                <Label htmlFor="sex">Sex</Label>

                                <select
                                    id="sex"
                                    name="sex"
                                    defaultValue={auth.user.patient_profile?.sex || ''}
                                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Select sex</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>

                                <InputError message={errors.sex} />
                            </div>

                            {/* Civil Status */}
                            <div className="grid gap-2">
                                <Label htmlFor="civil_status">Civil Status</Label>

                                <select
                                    id="civil_status"
                                    name="civil_status"
                                    defaultValue={auth.user.patient_profile?.civil_status || ''}
                                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">Select status</option>
                                    <option value="Single">Single</option>
                                    <option value="Married">Married</option>
                                    <option value="Widowed">Widowed</option>
                                    <option value="Separated">Separated</option>
                                </select>

                                <InputError message={errors.civil_status} />
                            </div>
                        </div>
                    </div>

                    {/* EMAIL VERIFICATION */}
                    {mustVerifyEmail && auth.user.email_verified_at === null && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                            <p className="text-sm text-amber-800 dark:text-amber-300">
                                Your email address is unverified.
                            </p>

                            <Link
                                href={send()}
                                as="button"
                                className="mt-2 inline-block text-sm font-semibold text-amber-700 underline underline-offset-4 dark:text-amber-400"
                            >
                                Resend verification email
                            </Link>

                            {status === 'verification-link-sent' && (
                                <div className="mt-2 text-sm font-medium text-green-600">
                                    Verification email sent.
                                </div>
                            )}
                        </div>
                    )}

                    {/* ACTIONS */}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-6 dark:border-neutral-800">
                        <div>
                            <Transition
                                show={recentlySuccessful}
                                enter="transition ease-in-out"
                                enterFrom="opacity-0"
                                leave="transition ease-in-out"
                                leaveTo="opacity-0"
                            >
                                <p className="text-sm font-medium text-green-600">
                                    Profile updated successfully.
                                </p>
                            </Transition>
                        </div>

                        <Button
                            disabled={processing}
                            data-test="update-profile-button"
                            className="h-11 rounded-xl px-6 font-semibold"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </>
            )}
        </Form>
    </div>
</div>


                <DeleteUser />
            </SettingsLayout>
        </AppLayout>
    );
}