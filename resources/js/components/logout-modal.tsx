import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X , Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogoutModal } from '@/contexts/logout-modal-context';
import { router } from '@inertiajs/react';
import { logout } from '@/routes';
import { useEffect, useState } from 'react';

export default function LogoutModal() {
    const { isOpen, closeModal } = useLogoutModal();
    const [isLoggingOut, setIsLoggingOut] = useState(false);


    useEffect(() => {
    if (isOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }

    return () => {
        document.body.style.overflow = '';
    };
}, [isOpen]);

   const handleConfirm = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isLoggingOut) return;

    setIsLoggingOut(true);

    router.post(logout().url, {}, {
        preserveScroll: false,
        preserveState: false,

        onSuccess: () => {
            closeModal();
        },

        onFinish: () => {
            setIsLoggingOut(false);
        },
    });
};
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={!isLoggingOut ? closeModal : undefined}
                        className="absolute inset-0 bg-gray-950/75 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 8 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 8 }}
                        transition={{ duration: 0.15 }}
                        className="relative w-full max-w-sm bg-white dark:bg-neutral-900 rounded-[20px] border border-gray-200 dark:border-neutral-700 overflow-hidden shadow-xl"
                    >
                        {/* Header */}
                        <div className="flex items-start gap-3.5 p-7 pb-5">
                            <div className="w-[42px] h-[42px] rounded-xl bg-red-50 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                                <LogOut className="w-5 h-5 text-red-700 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-base font-medium text-gray-900 dark:text-white mb-1">
                                    Log out of LMIC?
                                </p>
                                <p className="text-[13px] text-gray-500 dark:text-gray-400 leading-relaxed">
                                    You'll need to sign in again to access your account and appointments.
                                </p>
                            </div>
                        </div>

                        <div className="mx-7 border-t border-gray-100 dark:border-neutral-800" />

                        {/* Actions */}
                        <div className="flex flex-col gap-2 p-7 pt-4">
                            <button
                                onClick={handleConfirm}
                                disabled={isLoggingOut}
                                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-[10px] bg-red-700 hover:bg-red-800 text-red-50 text-sm font-medium transition disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Logging out…
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="w-4 h-4" />
                                        Yes, log me out
                                    </>
                                )}
                            </button>
                            <button
                                onClick={closeModal}
                                disabled={isLoggingOut}
                                className="w-full py-2.5 rounded-[10px] border border-gray-200 dark:border-neutral-700 text-gray-500 dark:text-gray-400 text-sm hover:bg-gray-50 dark:hover:bg-neutral-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                No, stay signed in
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
