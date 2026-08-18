import { Form, Head, Link, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    Eye,
    EyeOff,
    KeyRound,
    LockKeyhole,
    Pencil,
    ShieldBan,
    ShieldCheck,
    UserRound,
    X,
} from 'lucide-react';
import { useState } from 'react';
import BirthdateInput from '@/components/birthdate-input';
import InputError from '@/components/input-error';
import {
    evaluatePassword,
    PasswordMatch,
    PasswordRequirements,
} from '@/components/password-requirements';
import TwoFactorRecoveryCodes from '@/components/two-factor-recovery-codes';
import TwoFactorSetupModal from '@/components/two-factor-setup-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useTwoFactorAuth } from '@/hooks/use-two-factor-auth';
import AppLayout from '@/layouts/app-layout';
import { disable, enable } from '@/routes/two-factor';
import type { BreadcrumbItem, SharedData } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Profile Settings', href: '/settings/profile' },
];
const civilStatuses = ['Single', 'Married', 'Divorced', 'Widowed'] as const;

function friendlyDate(value?: string): string {
    if (!value) return 'Not provided';
    const date = new Date(`${value.slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Not provided';
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    }).format(date);
}

function Detail({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="border-b border-slate-100 py-4 last:border-0 sm:grid sm:grid-cols-[180px_1fr] sm:gap-6">
            <dt className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                {label}
            </dt>
            <dd className="mt-1 text-sm font-medium text-slate-900 sm:mt-0">
                {value || 'Not provided'}
            </dd>
        </div>
    );
}

export default function Profile({
    mustVerifyEmail,
    twoFactorAvailable = false,
    twoFactorEnabled = false,
    requiresTwoFactorConfirmation = false,
    canManageTwoFactor = false,
}: {
    mustVerifyEmail: boolean;
    status?: string;
    twoFactorAvailable?: boolean;
    twoFactorEnabled?: boolean;
    requiresTwoFactorConfirmation?: boolean;
    canManageTwoFactor?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const user = auth.user;
    const profile = user.patient_profile;
    const isPatient = user.role === 'patient';
    const [editing, setEditing] = useState(false);
    const [editingPassword, setEditingPassword] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showPasswordConfirmation, setShowPasswordConfirmation] =
        useState(false);
    const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
    const [editSession, setEditSession] = useState(0);
    const initial = () => ({
        first_name: user.first_name ?? '',
        middle_name: user.middle_name ?? '',
        last_name: user.last_name ?? '',
        email: user.email ?? '',
        contact: user.contact ?? '',
        birthdate: profile?.birthdate?.slice(0, 10) ?? '',
        sex: profile?.sex ?? '',
        civil_status: profile?.civil_status ?? '',
    });
    const form = useForm(initial());
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });
    const twoFactor = useTwoFactorAuth();
    const passwordIsValid = evaluatePassword(
        passwordForm.data.password,
    ).isValid;
    const passwordsMatch =
        passwordForm.data.password_confirmation.length > 0 &&
        passwordForm.data.password === passwordForm.data.password_confirmation;
    const initials =
        `${user.first_name?.[0] ?? ''}${user.last_name?.[0] ?? ''}`.toUpperCase() ||
        'PT';

    function cancelEditing() {
        form.setData(initial());
        form.clearErrors();
        setEditSession((value) => value + 1);
        setEditing(false);
    }

    function submit(event: React.FormEvent) {
        event.preventDefault();
        form.patch('/settings/profile', {
            preserveScroll: true,
            onSuccess: () => setEditing(false),
        });
    }

    function submitPassword(event: React.FormEvent) {
        event.preventDefault();
        passwordForm.put('/settings/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                setEditingPassword(false);
            },
        });
    }

    function cancelPasswordEditing() {
        passwordForm.reset();
        passwordForm.clearErrors();
        setEditingPassword(false);
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Profile Settings" />
            <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <header>
                    <h1 className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                        Profile Settings
                    </h1>
                    <p className="mt-1 text-sm text-slate-500">
                        Manage your personal information and account settings.
                    </p>
                </header>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-moss-100 text-lg font-bold text-moss-800">
                                {initials}
                            </div>
                            <div>
                                <h2 className="font-semibold text-slate-950">
                                    {user.name}
                                </h2>
                                <p className="text-sm text-slate-500">
                                    {user.email}
                                </p>
                                <p className="mt-1 text-xs font-medium text-moss-700 capitalize">
                                    {user.role ?? 'patient'}
                                </p>
                            </div>
                        </div>
                        {!editing && (
                            <Button
                                type="button"
                                onClick={() => setEditing(true)}
                                className="gap-2"
                            >
                                <Pencil className="size-4" /> Edit Profile
                            </Button>
                        )}
                    </div>

                    {!editing ? (
                        <dl className="px-5 sm:px-6">
                            <Detail label="Full Name" value={user.name} />
                            <Detail label="Email Address" value={user.email} />
                            <Detail
                                label="Contact Number"
                                value={user.contact}
                            />
                            {isPatient && (
                                <>
                                    <Detail
                                        label="Birthdate"
                                        value={friendlyDate(profile?.birthdate)}
                                    />
                                    <Detail label="Sex" value={profile?.sex} />
                                    <Detail
                                        label="Civil Status"
                                        value={profile?.civil_status}
                                    />
                                </>
                            )}
                        </dl>
                    ) : (
                        <form
                            onSubmit={submit}
                            className="space-y-6 p-5 sm:p-6"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-moss-800">
                                <UserRound className="size-4" /> Editing Profile
                            </div>
                            <div className="grid gap-5 sm:grid-cols-2">
                                <Field
                                    label="First Name"
                                    error={form.errors.first_name}
                                >
                                    <Input
                                        value={form.data.first_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'first_name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </Field>
                                <Field
                                    label="Middle Name"
                                    error={form.errors.middle_name}
                                    optional
                                >
                                    <Input
                                        value={form.data.middle_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'middle_name',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field
                                    label="Last Name"
                                    error={form.errors.last_name}
                                >
                                    <Input
                                        value={form.data.last_name}
                                        onChange={(event) =>
                                            form.setData(
                                                'last_name',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </Field>
                                <Field
                                    label="Email Address"
                                    error={form.errors.email}
                                >
                                    <Input
                                        type="email"
                                        value={form.data.email}
                                        onChange={(event) =>
                                            form.setData(
                                                'email',
                                                event.target.value,
                                            )
                                        }
                                        required
                                    />
                                </Field>
                                <Field
                                    label="Contact Number"
                                    error={form.errors.contact}
                                >
                                    <Input
                                        type="tel"
                                        inputMode="numeric"
                                        value={form.data.contact}
                                        onChange={(event) =>
                                            form.setData(
                                                'contact',
                                                event.target.value,
                                            )
                                        }
                                    />
                                </Field>
                            </div>

                            {isPatient && (
                                <div className="grid gap-5 border-t border-slate-100 pt-6 sm:grid-cols-2">
                                    <Field label="Birthdate">
                                        <BirthdateInput
                                            key={editSession}
                                            value={form.data.birthdate}
                                            onChange={(value) =>
                                                form.setData('birthdate', value)
                                            }
                                            error={form.errors.birthdate}
                                        />
                                    </Field>
                                    <Field label="Sex" error={form.errors.sex}>
                                        <select
                                            value={form.data.sex}
                                            onChange={(event) =>
                                                form.setData(
                                                    'sex',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="">Select sex</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">
                                                Female
                                            </option>
                                        </select>
                                    </Field>
                                    <Field
                                        label="Civil Status"
                                        error={form.errors.civil_status}
                                    >
                                        <select
                                            value={form.data.civil_status}
                                            onChange={(event) =>
                                                form.setData(
                                                    'civil_status',
                                                    event.target.value,
                                                )
                                            }
                                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="">
                                                Select civil status
                                            </option>
                                            {civilStatuses.map((status) => (
                                                <option
                                                    key={status}
                                                    value={status}
                                                >
                                                    {status}
                                                </option>
                                            ))}
                                        </select>
                                    </Field>
                                </div>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={cancelEditing}
                                    disabled={form.processing}
                                    className="gap-2"
                                >
                                    <X className="size-4" /> Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.processing}
                                >
                                    {form.processing
                                        ? 'Saving...'
                                        : 'Save Changes'}
                                </Button>
                            </div>
                        </form>
                    )}
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="flex items-center gap-2 font-semibold text-slate-950">
                                <ShieldCheck className="size-5 text-moss-700" />{' '}
                                Account Security
                            </h2>
                            <div className="mt-3 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                                <span className="text-slate-500">
                                    Email status{' '}
                                    <strong className="ml-2 text-slate-900">
                                        {user.email_verified_at
                                            ? 'Verified'
                                            : 'Verification required'}
                                    </strong>
                                </span>
                                <span className="text-slate-500">
                                    Password{' '}
                                    <strong className="ml-2 tracking-widest text-slate-900">
                                        ••••••••
                                    </strong>
                                </span>
                            </div>
                            {mustVerifyEmail && !user.email_verified_at && (
                                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-700">
                                    <CheckCircle2 className="size-3.5" /> Verify
                                    your email to continue using all patient
                                    services.
                                </p>
                            )}
                        </div>
                        {!editingPassword && (
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setEditingPassword(true)}
                                className="gap-2"
                            >
                                <KeyRound className="size-4" /> Change Password
                            </Button>
                        )}
                    </div>

                    {editingPassword && (
                        <form
                            onSubmit={submitPassword}
                            className="mt-6 space-y-6 border-t border-slate-100 pt-6"
                        >
                            <div className="flex items-center gap-2 text-sm font-semibold text-moss-800">
                                <LockKeyhole className="size-4" /> Editing
                                Password
                            </div>
                            <div className="grid gap-5 lg:grid-cols-3">
                                <PasswordField
                                    label="Current Password"
                                    value={passwordForm.data.current_password}
                                    shown={showCurrentPassword}
                                    onToggle={() =>
                                        setShowCurrentPassword(
                                            (shown) => !shown,
                                        )
                                    }
                                    onChange={(value) =>
                                        passwordForm.setData(
                                            'current_password',
                                            value,
                                        )
                                    }
                                    error={passwordForm.errors.current_password}
                                    autoComplete="current-password"
                                />
                                <div>
                                    <PasswordField
                                        label="New Password"
                                        value={passwordForm.data.password}
                                        shown={showNewPassword}
                                        onToggle={() =>
                                            setShowNewPassword(
                                                (shown) => !shown,
                                            )
                                        }
                                        onChange={(value) =>
                                            passwordForm.setData(
                                                'password',
                                                value,
                                            )
                                        }
                                        error={passwordForm.errors.password}
                                        autoComplete="new-password"
                                    />
                                    <PasswordRequirements
                                        password={passwordForm.data.password}
                                    />
                                </div>
                                <div>
                                    <PasswordField
                                        label="Confirm New Password"
                                        value={
                                            passwordForm.data
                                                .password_confirmation
                                        }
                                        shown={showPasswordConfirmation}
                                        onToggle={() =>
                                            setShowPasswordConfirmation(
                                                (shown) => !shown,
                                            )
                                        }
                                        onChange={(value) =>
                                            passwordForm.setData(
                                                'password_confirmation',
                                                value,
                                            )
                                        }
                                        error={
                                            passwordForm.errors
                                                .password_confirmation
                                        }
                                        autoComplete="new-password"
                                        invalid={Boolean(
                                            passwordForm.data
                                                .password_confirmation &&
                                            !passwordsMatch,
                                        )}
                                    />
                                    <PasswordMatch
                                        password={passwordForm.data.password}
                                        confirmation={
                                            passwordForm.data
                                                .password_confirmation
                                        }
                                    />
                                </div>
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={cancelPasswordEditing}
                                    disabled={passwordForm.processing}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        passwordForm.processing ||
                                        !passwordIsValid ||
                                        !passwordsMatch
                                    }
                                >
                                    {passwordForm.processing
                                        ? 'Saving...'
                                        : 'Save Password'}
                                </Button>
                            </div>
                        </form>
                    )}
                </section>

                {twoFactorAvailable && (
                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <h2 className="flex items-center gap-2 font-semibold text-slate-950">
                                    <ShieldCheck className="size-5 text-moss-700" />{' '}
                                    Two-Factor Authentication
                                </h2>
                                <div className="mt-2">
                                    <Badge
                                        variant={
                                            twoFactorEnabled
                                                ? 'default'
                                                : 'destructive'
                                        }
                                    >
                                        {twoFactorEnabled
                                            ? 'Enabled'
                                            : 'Disabled'}
                                    </Badge>
                                </div>
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
                                    Require a code from your authenticator app
                                    when signing in. Security changes require
                                    password confirmation.
                                </p>
                            </div>
                            {!canManageTwoFactor ? (
                                <Button asChild variant="outline">
                                    <Link href="/settings/profile/two-factor">
                                        Confirm Password to Manage
                                    </Link>
                                </Button>
                            ) : twoFactorEnabled ? (
                                <Form
                                    {...disable.form()}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <Button
                                            variant="destructive"
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2"
                                        >
                                            <ShieldBan className="size-4" />{' '}
                                            {processing
                                                ? 'Disabling...'
                                                : 'Disable 2FA'}
                                        </Button>
                                    )}
                                </Form>
                            ) : twoFactor.hasSetupData ? (
                                <Button
                                    type="button"
                                    onClick={() => setShowTwoFactorSetup(true)}
                                >
                                    Continue Setup
                                </Button>
                            ) : (
                                <Form
                                    {...enable.form()}
                                    options={{ preserveScroll: true }}
                                    onSuccess={() =>
                                        setShowTwoFactorSetup(true)
                                    }
                                >
                                    {({ processing }) => (
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                            className="gap-2"
                                        >
                                            <ShieldCheck className="size-4" />{' '}
                                            {processing
                                                ? 'Enabling...'
                                                : 'Enable 2FA'}
                                        </Button>
                                    )}
                                </Form>
                            )}
                        </div>
                        {twoFactorEnabled && canManageTwoFactor && (
                            <div className="mt-6 border-t border-slate-100 pt-6">
                                <TwoFactorRecoveryCodes
                                    recoveryCodesList={
                                        twoFactor.recoveryCodesList
                                    }
                                    fetchRecoveryCodes={
                                        twoFactor.fetchRecoveryCodes
                                    }
                                    errors={twoFactor.errors}
                                />
                            </div>
                        )}
                        {canManageTwoFactor && (
                            <TwoFactorSetupModal
                                isOpen={showTwoFactorSetup}
                                onClose={() => setShowTwoFactorSetup(false)}
                                requiresConfirmation={
                                    requiresTwoFactorConfirmation
                                }
                                twoFactorEnabled={twoFactorEnabled}
                                qrCodeSvg={twoFactor.qrCodeSvg}
                                manualSetupKey={twoFactor.manualSetupKey}
                                clearSetupData={twoFactor.clearSetupData}
                                fetchSetupData={twoFactor.fetchSetupData}
                                errors={twoFactor.errors}
                            />
                        )}
                    </section>
                )}
            </main>
        </AppLayout>
    );
}

function Field({
    label,
    error,
    optional,
    children,
}: {
    label: string;
    error?: string;
    optional?: boolean;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>
                {label}
                {optional && (
                    <span className="ml-1 font-normal text-slate-400">
                        (optional)
                    </span>
                )}
            </Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function PasswordField({
    label,
    value,
    shown,
    onToggle,
    onChange,
    error,
    autoComplete,
    invalid = false,
}: {
    label: string;
    value: string;
    shown: boolean;
    onToggle: () => void;
    onChange: (value: string) => void;
    error?: string;
    autoComplete: 'current-password' | 'new-password';
    invalid?: boolean;
}) {
    return (
        <div className="grid gap-2">
            <Label>{label}</Label>
            <div className="relative">
                <Input
                    type={shown ? 'text' : 'password'}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    autoComplete={autoComplete}
                    required
                    className={`pr-11 ${invalid ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
                />
                <button
                    type="button"
                    onClick={onToggle}
                    className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label={
                        shown
                            ? `Hide ${label.toLowerCase()}`
                            : `Show ${label.toLowerCase()}`
                    }
                >
                    {shown ? (
                        <EyeOff className="size-4" />
                    ) : (
                        <Eye className="size-4" />
                    )}
                </button>
            </div>
            <InputError message={error} />
        </div>
    );
}
