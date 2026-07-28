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
                        className="absolute inset-0 cursor-default bg-moss-950/25 backdrop-blur-sm disabled:pointer-events-none"
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
                        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20"
                    >
                        <button
                            type="button"
                            onClick={dismiss}
                            disabled={isLoggingOut}
                            aria-label="Close"
                            className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-40"
                        >
                            <X className="size-4" />
                        </button>

                        <div className="px-6 pt-7 pb-5 sm:px-7">
                            <span className="flex size-12 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-red-600">
                                <LogOut className="size-5" aria-hidden="true" />
                            </span>
                            <h2
                                id="logout-dialog-title"
                                className="mt-5 pr-9 text-xl font-semibold tracking-[-.025em] text-slate-950"
                            >
                                Log Out of Your Account?
                            </h2>
                            <p
                                id="logout-dialog-description"
                                className="mt-2 text-sm leading-6 text-slate-500"
                            >
                                You will need to sign in again to access your
                                account and clinic services.
                            </p>

                            {errorMessage && (
                                <div
                                    role="alert"
                                    className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-5 text-red-700"
                                >
                                    <CircleAlert className="mt-0.5 size-4 shrink-0" />
                                    <span>{errorMessage}</span>
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                ref={cancelButtonRef}
                                type="button"
                                onClick={dismiss}
                                disabled={isLoggingOut}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 focus-visible:ring-4 focus-visible:ring-moss-500/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmLogout}
                                disabled={isLoggingOut}
                                className="flex h-11 min-w-32 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus-visible:ring-4 focus-visible:ring-red-500/20 focus-visible:outline-none active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-70"
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
