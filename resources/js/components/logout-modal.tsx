import { router } from '@inertiajs/react';
import { AnimatePresence, motion } from 'framer-motion';
import { CircleAlert, Loader2, LogOut, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLogoutModal } from '@/contexts/logout-modal-context';
import { logout } from '@/routes';

const FOCUSABLE_SELECTOR = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

type LogoutModalProps = {
    userId?: number;
};

export default function LogoutModal({ userId }: LogoutModalProps) {
    const { isOpen, closeModal } = useLogoutModal();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const dialogRef = useRef<HTMLDivElement>(null);
    const cancelButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        cancelButtonRef.current?.focus();

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape' && !isLoggingOut) {
                event.preventDefault();
                closeModal();
                return;
            }

            if (event.key !== 'Tab' || !dialogRef.current) return;

            const focusableElements = Array.from(
                dialogRef.current.querySelectorAll<HTMLElement>(
                    FOCUSABLE_SELECTOR,
                ),
            );
            if (!focusableElements.length) return;

            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (event.shiftKey && document.activeElement === firstElement) {
                event.preventDefault();
                lastElement.focus();
            } else if (
                !event.shiftKey &&
                document.activeElement === lastElement
            ) {
                event.preventDefault();
                firstElement.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeModal, isLoggingOut, isOpen]);

    const dismiss = () => {
        if (isLoggingOut) return;
        setErrorMessage('');
        closeModal();
    };

    const confirmLogout = () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);
        setErrorMessage('');

        router.post(
            logout().url,
            {},
            {
                preserveScroll: false,
                preserveState: false,
                onSuccess: () => {
                    if (userId !== undefined) {
                        localStorage.removeItem(`appointment-draft-${userId}`);
                    }
                    closeModal();
                },
                onError: () => {
                    setErrorMessage(
                        'We could not complete the logout request. Please check your connection and try again.',
                    );
                },
                onFinish: () => {
                    setIsLoggingOut(false);
                },
            },
        );
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.button
                        type="button"
                        aria-label="Close logout dialog"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={dismiss}
                        disabled={isLoggingOut}
                        className="absolute inset-0 cursor-default bg-moss-950/45 backdrop-blur-sm disabled:pointer-events-none"
                    />

                    <motion.div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="logout-dialog-title"
                        aria-describedby="logout-dialog-description"
                        initial={{ scale: 0.96, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.96, opacity: 0, y: 12 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-moss-200 bg-white shadow-2xl shadow-moss-950/25"
                    >
                        <button
                            type="button"
                            onClick={dismiss}
                            disabled={isLoggingOut}
                            aria-label="Close"
                            className="absolute top-5 right-5 z-10 flex size-9 items-center justify-center rounded-xl text-moss-100 transition hover:bg-white/15 hover:text-white focus-visible:ring-4 focus-visible:ring-white/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="relative overflow-hidden bg-moss-800 px-7 pt-8 pb-7 text-white sm:px-8">
                            <div className="absolute -top-14 -right-10 size-40 rounded-full bg-white/10 blur-2xl" />
                            <span className="relative flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-moss-100">
                                <LogOut className="size-5" aria-hidden="true" />
                            </span>
                            <h2
                                id="logout-dialog-title"
                                className="relative mt-5 pr-9 text-2xl font-bold tracking-tight text-white"
                            >
                                Log out of your account?
                            </h2>
                            <p
                                id="logout-dialog-description"
                                className="relative mt-2 text-sm leading-6 text-moss-100/85"
                            >
                                You will need to sign in again to access your
                                account and clinic services.
                            </p>

                            {errorMessage && (
                                <div
                                    role="alert"
                                    className="relative mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-5 text-red-700"
                                >
                                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-3 bg-moss-50 px-7 py-5 sm:flex-row sm:justify-end sm:px-8">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                onClick={dismiss}
                                disabled={isLoggingOut}
                                className="h-11 rounded-xl border border-moss-200 bg-white px-5 text-sm font-bold text-moss-800 transition hover:bg-moss-50 focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogout}
                                disabled={isLoggingOut}
                                className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 focus-visible:ring-4 focus-visible:ring-red-500/20 focus-visible:outline-none active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <Loader2
                                            className="size-4 animate-spin"
                                            aria-hidden="true"
                                        />
                                        Logging Out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut
                                            className="size-4"
                                            aria-hidden="true"
                                        />
                                        Log Out
                                    </>
                                )}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
