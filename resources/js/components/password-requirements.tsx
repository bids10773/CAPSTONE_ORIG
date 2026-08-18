import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Check, Circle } from 'lucide-react';

export type PasswordPolicyResult = {
    hasMinimumLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSymbol: boolean;
    categoriesMet: number;
    isValid: boolean;
};

export function evaluatePassword(password: string): PasswordPolicyResult {
    const hasMinimumLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[^\p{L}\p{N}]/u.test(password);
    const categoriesMet = [
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSymbol,
    ].filter(Boolean).length;

    return {
        hasMinimumLength,
        hasUppercase,
        hasLowercase,
        hasNumber,
        hasSymbol,
        categoriesMet,
        isValid: hasMinimumLength && categoriesMet >= 3,
    };
}

export function PasswordRequirements({ password }: { password: string }) {
    const reduceMotion = useReducedMotion();

    if (password.length === 0) {
        return null;
    }

    const result = evaluatePassword(password);
    const categoryRequirements = [
        ['Uppercase letter', result.hasUppercase],
        ['Lowercase letter', result.hasLowercase],
        ['Number', result.hasNumber],
        ['Symbol', result.hasSymbol],
    ] as const;

    return (
        <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="mt-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-600"
            aria-live="polite"
        >
            <p className="font-medium text-slate-700">Password must:</p>
            <Requirement met={result.hasMinimumLength}>
                Be at least 8 characters long
            </Requirement>
            <Requirement met={result.categoriesMet >= 3}>
                Meet at least 3 of the following:
            </Requirement>
            <ul
                className="mt-1 ml-5 space-y-1"
                aria-label="Password character requirements"
            >
                {categoryRequirements.map(([label, met]) => (
                    <li key={label}>
                        <Requirement met={met}>{label}</Requirement>
                    </li>
                ))}
            </ul>
            <p className="mt-2 font-medium" role="status">
                {result.categoriesMet} of 4 requirements met
            </p>
        </motion.div>
    );
}

export function PasswordMatch({
    password,
    confirmation,
}: {
    password: string;
    confirmation: string;
}) {
    const reduceMotion = useReducedMotion();
    if (!confirmation) return null;
    const matches = password === confirmation;

    return (
        <motion.p
            initial={reduceMotion ? false : { opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className={`mt-1.5 flex items-center gap-1 text-xs ${matches ? 'text-emerald-700' : 'text-red-600'}`}
            role="status"
        >
            {matches ? (
                <Check className="size-3.5" aria-hidden />
            ) : (
                <Circle className="size-3.5" aria-hidden />
            )}
            {matches ? 'Passwords match.' : 'Passwords do not match.'}
        </motion.p>
    );
}

function Requirement({
    met,
    children,
}: {
    met: boolean;
    children: React.ReactNode;
}) {
    const reduceMotion = useReducedMotion();

    return (
        <span
            className={`mt-1 flex items-center gap-1.5 ${met ? 'text-emerald-700' : 'text-slate-500'}`}
        >
            <span className="relative size-3.5 shrink-0" aria-hidden>
                <AnimatePresence initial={false} mode="wait">
                    <motion.span
                        key={met ? 'met' : 'unmet'}
                        initial={
                            reduceMotion ? false : { opacity: 0, scale: 0.82 }
                        }
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.82 }}
                        transition={{ duration: reduceMotion ? 0 : 0.16 }}
                        className="absolute inset-0"
                    >
                        {met ? (
                            <Check className="size-3.5" />
                        ) : (
                            <Circle className="size-3.5" />
                        )}
                    </motion.span>
                </AnimatePresence>
            </span>
            <span>
                {met ? 'Requirement met: ' : 'Requirement not yet met: '}
                {children}
            </span>
        </span>
    );
}
