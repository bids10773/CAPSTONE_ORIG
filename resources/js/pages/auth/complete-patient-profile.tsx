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
                    <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
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
                                            defaultValue={profile.first_name}
                                            autoComplete="given-name"
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
                                            className="auth-input"
                                        />
                                    </div>
                                </Field>
                            </div>
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
                                        className="auth-input"
                                    />
                                </div>
                            </Field>
                            <Field label="Email address">
                                <div className="auth-input-wrap">
                                    <Mail className="auth-input-icon" />
                                    <input
                                        value={profile.email}
                                        readOnly
                                        className="auth-input bg-slate-50 text-slate-500"
                                    />
                                </div>
                                <p className="mt-1.5 text-xs text-slate-500">
                                    Verified authentication email
                                </p>
                            </Field>
                            <div className="grid gap-4 sm:grid-cols-3">
                                <Field
                                    label="Birthdate"
                                    error={errors.birthdate}
                                >
                                    <BirthdateInput
                                        required
                                        minimumAge={18}
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
                            <Field
                                label="Contact number"
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
                            <Field label="Address" error={errors.address}>
                                <div className="auth-input-wrap items-start">
                                    <MapPin className="auth-input-icon top-4" />
                                    <textarea
                                        name="address"
                                        required
                                        defaultValue={profile.address}
                                        autoComplete="street-address"
                                        rows={3}
                                        className="auth-input h-auto py-3"
                                    />
                                </div>
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
