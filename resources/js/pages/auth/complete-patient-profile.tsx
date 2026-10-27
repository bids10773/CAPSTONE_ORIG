import { Form, Head } from '@inertiajs/react';
import { ChevronDown, Mail, MapPin, Phone, UserRound } from 'lucide-react';
import BirthdateInput from '@/components/birthdate-input';
import InputError from '@/components/input-error';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';

type Profile = {
    first_name?: string;
    middle_name?: string;
    last_name?: string;
    email: string;
    contact?: string;
    birthdate?: string;
    sex?: string;
    civil_status?: string;
    address?: string;
};

export default function CompletePatientProfile({
    profile,
}: {
    profile: Profile;
}) {
    return (
        <>
            <Head title="Complete your patient profile" />
            <AuthLayout variant="register">
                <header className="mb-7">
                    <p className="text-xs font-semibold tracking-[.16em] text-moss-600 uppercase">
                        Complete your profile
                    </p>
                    <h1 className="mt-2 text-3xl font-semibold tracking-[-0.035em] text-slate-950">
                        A few details before you continue
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        We need this clinic information before you can access
                        appointment services.
                    </p>
                </header>
                <Form
                    action="/complete-patient-profile"
                    method="put"
                    className="registration-form space-y-5"
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
                                            defaultValue={profile.first_name}
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
                                            defaultValue={profile.last_name}
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
                                            defaultValue={profile.middle_name}
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
                                            defaultValue={profile.contact}
                                            inputMode="numeric"
                                            maxLength={11}
                                            autoComplete="tel"
                                            placeholder="09XX XXX XXXX"
                                            className="auth-input"
                                        />
                                    </div>
                                </Field>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-[minmax(18rem,2fr)_minmax(6.5rem,.65fr)_minmax(8rem,.85fr)]">
                                <Field label="Birthdate">
                                    <BirthdateInput
                                        required
                                        minimumAge={18}
                                        showPartLabels={false}
                                        value={profile.birthdate}
                                        error={errors.birthdate}
                                    />
                                </Field>
                                <Field label="Sex" error={errors.sex}>
                                    <Select
                                        name="sex"
                                        defaultValue={profile.sex}
                                        options={['Male', 'Female']}
                                    />
                                </Field>
                                <Field
                                    label="Civil status"
                                    error={errors.civil_status}
                                >
                                    <Select
                                        name="civil_status"
                                        defaultValue={profile.civil_status}
                                        options={[
                                            'Single',
                                            'Married',
                                            'Divorced',
                                            'Widowed',
                                        ]}
                                    />
                                </Field>
                            </div>
                            <Field label="Address" error={errors.address}>
                                <div className="auth-input-wrap">
                                    <MapPin className="auth-input-icon" />
                                    <input
                                        name="address"
                                        type="text"
                                        required
                                        defaultValue={profile.address}
                                        autoComplete="street-address"
                                        placeholder="House/Unit, Street, Barangay, City/Municipality"
                                        className="auth-input"
                                    />
                                </div>
                            </Field>
                            <Field label="Email address">
                                <div className="auth-input-wrap">
                                    <Mail className="auth-input-icon" />
                                    <input
                                        type="email"
                                        value={profile.email}
                                        readOnly
                                        autoComplete="email"
                                        className="auth-input bg-slate-50 text-slate-500"
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Your verified email address
                                </p>
                            </Field>
                            <button
                                type="submit"
                                disabled={processing}
                                className="auth-primary-button"
                            >
                                {processing ? (
                                    <>
                                        <Spinner className="size-4" /> Saving
                                        profile...
                                    </>
                                ) : (
                                    'Save and continue'
                                )}
                            </button>
                        </>
                    )}
                </Form>
            </AuthLayout>
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
                {label}
                {optional && (
                    <span className="font-normal text-slate-400">
                        {' '}
                        (optional)
                    </span>
                )}
            </label>
            {children}
            <InputError message={error} className="mt-1.5" />
        </div>
    );
}

function Select({
    name,
    defaultValue,
    options,
}: {
    name: string;
    defaultValue?: string;
    options: string[];
}) {
    return (
        <div className="auth-input-wrap">
            <select
                name={name}
                required
                defaultValue={defaultValue ?? ''}
                className="auth-select"
            >
                <option value="" disabled>
                    Select
                </option>
                {options.map((option) => (
                    <option key={option} value={option}>
                        {option}
                    </option>
                ))}
            </select>
            <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-slate-400" />
        </div>
    );
}
