import { Transition } from '@headlessui/react';
import { Form, Head } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useRef, useState } from 'react';
import PasswordController from '@/actions/App/Http/Controllers/Settings/PasswordController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import {
    evaluatePassword,
    PasswordMatch,
    PasswordRequirements,
} from '@/components/password-requirements';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import { edit } from '@/routes/user-password';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Password settings',
        href: edit(),
    },
];

export default function Password() {
    const passwordInput = useRef<HTMLInputElement>(null);
    const currentPasswordInput = useRef<HTMLInputElement>(null);
    const [password, setPassword] = useState('');
    const [confirmation, setConfirmation] = useState('');
    const [shown, setShown] = useState({
        current: false,
        password: false,
        confirmation: false,
    });
    const matches = confirmation.length > 0 && password === confirmation;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Password settings" />

            <h1 className="sr-only">Password settings</h1>

            <SettingsLayout>
                <div className="space-y-6">
                    <Heading
                        variant="small"
                        title="Update password"
                        description="Ensure your account is using a long, random password to stay secure"
                    />

                    <Form
                        {...PasswordController.update.form()}
                        options={{
                            preserveScroll: true,
                        }}
                        resetOnError={[
                            'password',
                            'password_confirmation',
                            'current_password',
                        ]}
                        resetOnSuccess
                        onError={(errors) => {
                            if (errors.password) {
                                passwordInput.current?.focus();
                            }

                            if (errors.current_password) {
                                currentPasswordInput.current?.focus();
                            }
                        }}
                        className="space-y-6"
                    >
                        {({ errors, processing, recentlySuccessful }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label htmlFor="current_password">
                                        Current password
                                    </Label>

                                    <div className="relative">
                                        <Input
                                            id="current_password"
                                            ref={currentPasswordInput}
                                            name="current_password"
                                            type={
                                                shown.current
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            className="mt-1 block w-full pr-11"
                                            autoComplete="current-password"
                                            placeholder="Current password"
                                        />
                                        <PasswordToggle
                                            shown={shown.current}
                                            onClick={() =>
                                                setShown((value) => ({
                                                    ...value,
                                                    current: !value.current,
                                                }))
                                            }
                                            label="current password"
                                        />
                                    </div>

                                    <InputError
                                        message={errors.current_password}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password">
                                        New password
                                    </Label>

                                    <div className="relative">
                                        <Input
                                            id="password"
                                            ref={passwordInput}
                                            name="password"
                                            type={
                                                shown.password
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={password}
                                            onChange={(event) =>
                                                setPassword(event.target.value)
                                            }
                                            className="mt-1 block w-full pr-11"
                                            autoComplete="new-password"
                                            placeholder="New password"
                                        />
                                        <PasswordToggle
                                            shown={shown.password}
                                            onClick={() =>
                                                setShown((value) => ({
                                                    ...value,
                                                    password: !value.password,
                                                }))
                                            }
                                            label="new password"
                                        />
                                    </div>

                                    <InputError message={errors.password} />
                                    <PasswordRequirements password={password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>

                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            name="password_confirmation"
                                            type={
                                                shown.confirmation
                                                    ? 'text'
                                                    : 'password'
                                            }
                                            value={confirmation}
                                            onChange={(event) =>
                                                setConfirmation(
                                                    event.target.value,
                                                )
                                            }
                                            className="mt-1 block w-full pr-11"
                                            autoComplete="new-password"
                                            placeholder="Confirm password"
                                        />
                                        <PasswordToggle
                                            shown={shown.confirmation}
                                            onClick={() =>
                                                setShown((value) => ({
                                                    ...value,
                                                    confirmation:
                                                        !value.confirmation,
                                                }))
                                            }
                                            label="password confirmation"
                                        />
                                    </div>

                                    <InputError
                                        message={errors.password_confirmation}
                                    />
                                    <PasswordMatch
                                        password={password}
                                        confirmation={confirmation}
                                    />
                                </div>

                                <div className="flex items-center gap-4">
                                    <Button
                                        disabled={
                                            processing ||
                                            !evaluatePassword(password)
                                                .isValid ||
                                            !matches
                                        }
                                        data-test="update-password-button"
                                    >
                                        Save password
                                    </Button>

                                    <Transition
                                        show={recentlySuccessful}
                                        enter="transition ease-in-out"
                                        enterFrom="opacity-0"
                                        leave="transition ease-in-out"
                                        leaveTo="opacity-0"
                                    >
                                        <p className="text-sm text-neutral-600">
                                            Saved
                                        </p>
                                    </Transition>
                                </div>
                            </>
                        )}
                    </Form>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

function PasswordToggle({
    shown,
    onClick,
    label,
}: {
    shown: boolean;
    onClick: () => void;
    label: string;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="absolute top-0 right-0 flex h-full w-11 items-center justify-center text-slate-500 hover:text-slate-800"
            aria-label={`${shown ? 'Hide' : 'Show'} ${label}`}
            aria-pressed={shown}
        >
            {shown ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
    );
}
