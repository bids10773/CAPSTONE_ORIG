import { Form, Head } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ChevronDown,
    Eye,
    EyeOff,
    LockKeyhole,
    Mail,
    Phone,
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
import SocialAuthButtons from '@/components/social-auth-buttons';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');

    const matches = confirmation.length > 0 && password === confirmation;
    const passwordIsValid = evaluatePassword(password).isValid;

    return (
        <>
            <Head title="Create your account" />
            <AuthLayout variant="register">
                <header className="mb-7">
                    <p className="text-xs font-semibold tracking-[.16em] text-moss-600 uppercase">
                        Patient registration
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                        Create your account
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        Register to access the Medical Services Management
                        System.
                    </p>
                </header>

                <div className="mb-6">
                    <SocialAuthButtons mode="register" />
                </div>

                <Form
                    {...store.form()}
                    resetOnSuccess={['password', 'password_confirmation']}
                    className="space-y-5"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="First name"
                                    error={errors.first_name}
                                >
                                    <div className="auth-input-wrap">
                                        <UserRound className="auth-input-icon" />
                                        <input
                                            name="first_name"
                                            required
                                            autoFocus
                                            autoComplete="given-name"
                                            placeholder="Juan"
                                            className="auth-input"
                                        />
                                    </div>
                                </Field>
                                <Field
                                    label="Last name"
                                    error={errors.last_name}
                                >
                                    <div className="auth-input-wrap">
                                        <UserRound className="auth-input-icon" />
                                        <input
                                            name="last_name"
                                            required
                                            autoComplete="family-name"
                                            placeholder="Dela Cruz"
                                            className="auth-input"
                                        />
                                    </div>
                                </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Middle name"
                                    optional
                                    error={errors.middle_name}
                                >
                                    <div className="auth-input-wrap">
                                        <UserRound className="auth-input-icon" />
                                        <input
                                            name="middle_name"
                                            autoComplete="additional-name"
                                            placeholder="Optional"
                                            className="auth-input"
                                        />
                                    </div>
                                </Field>
                                <Field
                                    label="Phone number"
                                    error={errors.contact}
                                >
                                    <div className="auth-input-wrap">
                                        <Phone className="auth-input-icon" />
                                        <input
                                            name="contact"
                                            type="tel"
                                            required
                                            inputMode="numeric"
                                            maxLength={11}
                                            pattern="09[0-9]{9}"
                                            autoComplete="tel"
                                            placeholder="09XX XXX XXXX"
                                            className="auth-input"
                                        />
                                    </div>
                                </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="Birthdate">
                                    <BirthdateInput
                                        required
                                        minimumAge={18}
                                        error={errors.birthdate}
                                    />
                                </Field>
                                <Field label="Sex" error={errors.sex}>
                                    <div className="auth-input-wrap">
                                        <select
                                            name="sex"
                                            required
                                            defaultValue=""
                                            className="auth-select"
                                        >
                                            <option value="" disabled>
                                                Select
                                            </option>
                                            <option value="Male">Male</option>
                                            <option value="Female">
                                                Female
                                            </option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </Field>
                                <Field
                                    label="Civil status"
                                    error={errors.civil_status}
                                >
                                    <div className="auth-input-wrap">
                                        <select
                                            name="civil_status"
                                            required
                                            defaultValue=""
                                            className="auth-select"
                                        >
                                            <option value="" disabled>
                                                Select
                                            </option>
                                            <option value="Single">
                                                Single
                                            </option>
                                            <option value="Married">
                                                Married
                                            </option>
                                            <option value="Divorced">
                                                Divorced
                                            </option>
                                            <option value="Widowed">
                                                Widowed
                                            </option>
                                        </select>
                                        <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-400" />
                                    </div>
                                </Field>
                            </div>

                            <Field label="Email address" error={errors.email}>
                                <div className="auth-input-wrap">
                                    <Mail className="auth-input-icon" />
                                    <input
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        className="auth-input"
                                    />
                                </div>
                            </Field>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field label="Password" error={errors.password}>
                                    <div className="auth-input-wrap">
                                        <LockKeyhole className="auth-input-icon" />
                                        <input
                                            name="password"
                                            value={password}
                                            onChange={(e) =>
                                                setPassword(e.target.value)
                                            }
                                            type={
                                                showPassword
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            required
                                            autoComplete="new-password"
                                            placeholder="At least 8 characters"
                                            className="auth-input pr-11"
                                        />
                                        <PasswordToggle
                                            shown={showPassword}
                                            onClick={() =>
                                                setShowPassword(!showPassword)
                                            }
                                        />
                                    </div>
                                    <PasswordRequirements password={password} />
                                </Field>
                                <Field
                                    label="Confirm password"
                                    error={errors.password_confirmation}
                                >
                                    <div className="auth-input-wrap">
                                        <LockKeyhole className="auth-input-icon" />
                                        <input
                                            name="password_confirmation"
                                            value={confirmation}
                                            onChange={(e) =>
                                                setConfirmation(e.target.value)
                                            }
                                            type={
                                                showConfirm
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            required
                                            autoComplete="new-password"
                                            placeholder="Repeat your password"
                                            className={`auth-input pr-11 ${confirmation && !matches ? 'auth-input-error' : ''}`}
                                        />
                                        <PasswordToggle
                                            shown={showConfirm}
                                            onClick={() =>
                                                setShowConfirm(!showConfirm)
                                            }
                                        />
                                    </div>
                                    <PasswordMatch
                                        password={password}
                                        confirmation={confirmation}
                                    />
                                </Field>
                            </div>

                            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3.5">
                                <Checkbox
                                    id="terms"
                                    name="terms"
                                    checked={acceptedTerms}
                                    onCheckedChange={(value) =>
                                        setAcceptedTerms(!!value)
                                    }
                                    required
                                    className="mt-0.5 size-5 rounded border-slate-300 data-[state=checked]:border-moss-600 data-[state=checked]:bg-moss-600"
                                />
                                <label
                                    htmlFor="terms"
                                    className="text-xs leading-5 text-slate-600"
                                >
                                    I agree to the{' '}
                                    <button
                                        type="button"
                                        onClick={() => setShowTerms(true)}
                                        className="font-semibold text-moss-600 underline-offset-2 hover:underline"
                                    >
                                        Terms of Service and Privacy Policy
                                    </button>
                                    .
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    processing ||
                                    !acceptedTerms ||
                                    !passwordIsValid ||
                                    !matches
                                }
                                className="auth-primary-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-4" /> Creating
                                        your account…
                                    </>
                                ) : (
                                    'Create account'
                                )}
                            </button>
                        </>
                    )}
                </Form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    Already have an account?{' '}
                    <TextLink
                        href={login()}
                        className="font-semibold text-moss-600 hover:text-moss-700"
                    >
                        Sign in
                    </TextLink>
                </div>
            </AuthLayout>

            <AnimatePresence>
                {showTerms && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-moss-950/25 p-5 backdrop-blur-sm"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="terms-title"
                        onMouseDown={(e) =>
                            e.target === e.currentTarget && setShowTerms(false)
                        }
                    >
                        <motion.div
                            initial={{ scale: 0.96, y: 10 }}
                            animate={{ scale: 1, y: 0 }}
                            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <span className="flex size-10 items-center justify-center rounded-xl bg-moss-50 text-moss-600">
                                        <ShieldCheck className="size-5" />
                                    </span>
                                    <div>
                                        <h2
                                            id="terms-title"
                                            className="font-semibold text-slate-900"
                                        >
                                            Terms & Privacy
                                        </h2>
                                        <p className="text-xs text-slate-500">
                                            Your data, handled responsibly
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowTerms(false)}
                                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                    aria-label="Close"
                                >
                                    <X className="size-5" />
                                </button>
                            </div>
                            <div className="max-h-[55vh] space-y-4 overflow-y-auto px-6 py-5 text-sm leading-6 text-slate-600">
                                <p className="font-semibold text-slate-900">
                                    Living Myth Industrial Clinic Data Privacy
                                    Agreement
                                </p>
                                <p>
                                    Your medical and personal information is
                                    handled in accordance with the Data Privacy
                                    Act of 2012 (RA 10173).
                                </p>
                                <p>
                                    We collect your name, email, contact number,
                                    and profile information only for medical
                                    record verification, patient care, and
                                    appointment scheduling.
                                </p>
                                <p>
                                    Your data is stored securely, accessed only
                                    by authorized personnel, and retained only
                                    as long as necessary for legitimate clinic
                                    operations.
                                </p>
                            </div>
                            <div className="border-t border-slate-100 bg-slate-50 px-6 py-4">
                                <button
                                    onClick={() => {
                                        setAcceptedTerms(true);
                                        setShowTerms(false);
                                    }}
                                    className="auth-primary-button ml-auto max-w-52"
                                >
                                    Accept and continue
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

function Field({
    label,
    optional,
    error,
    children,
}: {
    label: string;
    optional?: boolean;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
                {label}{' '}
                {optional && (
                    <span className="font-normal text-slate-400">
                        (optional)
                    </span>
                )}
            </label>
            {children}
            <InputError message={error} className="mt-1.5 text-xs" />
        </div>
    );
}

function PasswordToggle({
    shown,
    onClick,
}: {
    shown: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="auth-password-toggle"
            aria-label={shown ? 'Hide password' : 'Show password'}
        >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
    );
}
