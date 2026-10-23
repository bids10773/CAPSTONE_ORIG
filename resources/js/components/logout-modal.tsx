import { router } from '@inertiajs/react';
import { CircleAlert, Loader2, LogOut } from 'lucide-react';
import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useLogoutModal } from '@/contexts/logout-modal-context';
import { logout } from '@/routes';

export default function LogoutModal() {
    const { isOpen, userId, closeModal } = useLogoutModal();
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

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
        <Dialog
            open={isOpen}
            onOpenChange={(open) => {
                if (!open) dismiss();
            }}
        >
            <DialogContent
                className="sm:max-w-md"
                showCloseButton={!isLoggingOut}
            >
                <DialogHeader>
                    <div className="mb-1 flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                        <LogOut className="size-5" aria-hidden="true" />
                    </div>
                    <DialogTitle>Log out of your account?</DialogTitle>
                    <DialogDescription>
                        You will need to sign in again to access your account
                        and clinic services.
                    </DialogDescription>
                </DialogHeader>

                {errorMessage && (
                    <div
                        role="alert"
                        className="flex items-start gap-2.5 rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-xs leading-5 text-destructive"
                    >
                        <CircleAlert className="mt-0.5 size-4 shrink-0" />
                        <span>{errorMessage}</span>
                    </div>
                )}

                <DialogFooter>
                    <button
                        type="button"
                        onClick={dismiss}
                        disabled={isLoggingOut}
                        className="inline-flex h-10 touch-manipulation items-center justify-center rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition-[background-color,border-color,color,box-shadow,transform] hover:border-ring/40 hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none active:scale-[0.98] active:bg-accent/80 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground disabled:opacity-70 motion-reduce:transition-none"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={confirmLogout}
                        disabled={isLoggingOut}
                        aria-busy={isLoggingOut}
                        className="inline-flex h-10 min-w-28 touch-manipulation items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-semibold text-destructive-foreground shadow-sm transition-[background-color,color,box-shadow,transform] hover:bg-destructive/90 hover:shadow-md focus-visible:ring-2 focus-visible:ring-destructive/50 focus-visible:ring-offset-2 focus-visible:ring-offset-card focus-visible:outline-none active:scale-[0.98] active:bg-destructive/80 disabled:cursor-wait disabled:bg-destructive/65 disabled:text-destructive-foreground/85 disabled:shadow-none motion-reduce:transition-none"
                    >
                        {isLoggingOut ? (
                            <>
                                <Loader2
                                    className="size-4 animate-spin motion-reduce:animate-none"
                                    aria-hidden="true"
                                />
                                Logging out…
                            </>
                        ) : (
                            'Log out'
                        )}
                    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
