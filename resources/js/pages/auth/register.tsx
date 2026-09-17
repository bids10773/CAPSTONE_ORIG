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
import type { ChangeEvent, FocusEvent } from 'react';
import BirthdateInput from '@/components/birthdate-input';
import InputError from '@/components/input-error';
import {
    evaluatePassword,
    PasswordMatch,
    PasswordRequirements,
} from '@/components/password-requirements';
import SocialAuthButtons from '@/components/social-auth-buttons';
import TermsPrivacyContent from '@/components/terms-privacy-content';
import TextLink from '@/components/text-link';
import { Checkbox } from '@/components/ui/checkbox';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { login } from '@/routes';
import { store } from '@/routes/register';

type ValidatedField =
    | 'first_name'
    | 'last_name'
    | 'middle_name'
    | 'contact'
    | 'sex'
    | 'civil_status'
    | 'email';

function validateField(field: ValidatedField, value: string): string {
    const trimmed = value.trim();

    switch (field) {
        case 'first_name':
        case 'last_name':
            if (!trimmed)
                return `${field === 'first_name' ? 'First' : 'Last'} name is required.`;
            return value.length > 255
                ? 'Name must be 255 characters or fewer.'
                : '';
        case 'middle_name':
            return value.length > 255
                ? 'Middle name must be 255 characters or fewer.'
                : '';
        case 'contact':
            return /^09\d{9}$/.test(value)
                ? ''
                : 'Enter an 11-digit Philippine mobile number starting with 09.';
        case 'sex':
            return ['Male', 'Female'].includes(value)
                ? ''
                : 'Please select your sex.';
        case 'civil_status':
            return ['Single', 'Married', 'Divorced', 'Widowed'].includes(value)
                ? ''
                : 'Please select your civil status.';
        case 'email':
            if (!trimmed) return 'Email address is required.';
            return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) &&
                value.length <= 255
                ? ''
                : 'Enter a valid email address, such as name@example.com.';
    }
}

export default function Register() {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [showTerms, setShowTerms] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [fieldErrors, setFieldErrors] = useState<
        Partial<Record<ValidatedField, string>>
    >({});

    const validateOnBlur = (
        event: FocusEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const field = event.currentTarget.name as ValidatedField;
        const value = event.currentTarget.value;
        setFieldErrors((previous) => ({
            ...previous,
            [field]: validateField(field, value),
        }));
    };

    const validateOnChange = (
        event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
    ) => {
        const field = event.currentTarget.name as ValidatedField;
        const value = event.currentTarget.value;
        setFieldErrors((previous) =>
            field in previous
                ? { ...previous, [field]: validateField(field, value) }
                : previous,
        );
    };

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
                                    error={
                                        fieldErrors.first_name ||
                                        errors.first_name
                                    }
                                >
                                    <div className="auth-input-wrap">
                                        <UserRound className="auth-input-icon" />
                                        <input
                                            name="first_name"
                                            aria-invalid={Boolean(
                                                fieldErrors.first_name ||
                                                errors.first_name,
                                            )}
                                            onBlur={validateOnBlur}
                                            onChange={validateOnChange}
                                            required
                                            autoFocus
                                            autoComplete="given-name"
                                            placeholder="Juan"
                                            className={`auth-input ${fieldErrors.first_name ? 'auth-input-error' : ''}`}
                                        />
                                    </div>
                                </Field>
                                <Field
                                    label="Last name"
                                    error={
                                        fieldErrors.last_name ||
                                        errors.last_name
                                    }
                                >
                                    <div className="auth-input-wrap">
                                        <UserRound className="auth-input-icon" />
                                        <input
                                            name="last_name"
                                            aria-invalid={Boolean(
                                                fieldErrors.last_name ||
                                                errors.last_name,
                                            )}
                                            onBlur={validateOnBlur}
                                            onChange={validateOnChange}
                                            required
                                            autoComplete="family-name"
                                            placeholder="Dela Cruz"
                                            className={`auth-input ${fieldErrors.last_name ? 'auth-input-error' : ''}`}
                                        />
                                    </div>
                                </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Middle name"
                                    optional
                                    error={
                                        fieldErrors.middle_name ||
                                        errors.middle_name
                                    }
                                >
                                    <div className="auth-input-wrap">
                                        <UserRound className="auth-input-icon" />
                                        <input
                                            name="middle_name"
                                            aria-invalid={Boolean(
                                                fieldErrors.middle_name ||
                                                errors.middle_name,
                                            )}
                                            onBlur={validateOnBlur}
                                            onChange={validateOnChange}
                                            autoComplete="additional-name"
                                            placeholder="Optional"
                                            className={`auth-input ${fieldErrors.middle_name ? 'auth-input-error' : ''}`}
                                        />
                                    </div>
                                </Field>
                                <Field
                                    label="Phone number"
                                    error={
                                        fieldErrors.contact || errors.contact
                                    }
                                >
                                    <div className="auth-input-wrap">
                                        <Phone className="auth-input-icon" />
                                        <input
                                            name="contact"
                                            aria-invalid={Boolean(
                                                fieldErrors.contact ||
                                                errors.contact,
                                            )}
                                            onBlur={validateOnBlur}
                                            onChange={validateOnChange}
                                            type="tel"
                                            required
                                            inputMode="numeric"
                                            maxLength={11}
                                            pattern="09[0-9]{9}"
                                            autoComplete="tel"
                                            placeholder="09XX XXX XXXX"
                                            className={`auth-input ${fieldErrors.contact ? 'auth-input-error' : ''}`}
                                        />
                                    </div>
                                </Field>
                            </div>

                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field label="Birthdate">
                                    <BirthdateInput
                                        required
                                        validateRequiredOnBlur
                                        minimumAge={18}
                                        error={errors.birthdate}
                                    />
                                </Field>
                                <Field
                                    label="Sex"
                                    error={fieldErrors.sex || errors.sex}
                                >
                                    <div className="auth-input-wrap">
                                        <select
                                            name="sex"
                                            aria-invalid={Boolean(
                                                fieldErrors.sex || errors.sex,
                                            )}
                                            onBlur={validateOnBlur}
                                            onChange={validateOnChange}
                                            required
                                            defaultValue=""
                                            className={`auth-select ${fieldErrors.sex ? 'auth-input-error' : ''}`}
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
                                    error={
                                        fieldErrors.civil_status ||
                                        errors.civil_status
                                    }
                                >
                                    <div className="auth-input-wrap">
                                        <select
                                            name="civil_status"
                                            aria-invalid={Boolean(
                                                fieldErrors.civil_status ||
                                                errors.civil_status,
                                            )}
                                            onBlur={validateOnBlur}
                                            onChange={validateOnChange}
                                            required
                                            defaultValue=""
                                            className={`auth-select ${fieldErrors.civil_status ? 'auth-input-error' : ''}`}
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

                            <Field
                                label="Email address"
                                error={fieldErrors.email || errors.email}
                            >
                                <div className="auth-input-wrap">
                                    <Mail className="auth-input-icon" />
                                    <input
                                        name="email"
                                        aria-invalid={Boolean(
                                            fieldErrors.email || errors.email,
                                        )}
                                        onBlur={validateOnBlur}
                                        onChange={validateOnChange}
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        className={`auth-input ${fieldErrors.email ? 'auth-input-error' : ''}`}
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

                <div className="mt-6">
                    <SocialAuthButtons mode="register" />
                </div>

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
                            <div className="max-h-[60vh] overflow-y-auto px-6 py-5 text-sm leading-6 text-slate-600">
                                <TermsPrivacyContent />
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
            <div aria-live="polite">
                <InputError message={error} className="mt-1.5 text-xs" />
            </div>
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
