import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLogoutModal } from '@/contexts/logout-modal-context';
import { router } from '@inertiajs/react';
import { logout } from '@/routes';

export default function LogoutModal() {
    const { isOpen, closeModal } = useLogoutModal();

    const handleConfirm = () => {
        router.post(logout());
        closeModal();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center">
                    {/* Full screen overlay */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeModal}
                        className="absolute inset-0 bg-gray-950/80 backdrop-blur-sm"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg mx-4 overflow-hidden bg-white rounded-3xl shadow-2xl"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 rounded-full">
                                    <LogOut className="text-red-600 h-6 w-6" />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900">Log Out</h2>
                            </div>
                            <button 
                                onClick={closeModal} 
                                className="p-3 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <X className="h-6 w-6 text-gray-500" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-8 text-gray-600">
                            <p className="text-xl">Are you sure you want to logout?</p>
                            <p className="mt-3 text-base text-gray-500">
                                You will need to sign in again to access your account.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-gray-100 flex gap-4 justify-end bg-gray-50">
                            <Button 
                                onClick={closeModal} 
                                variant="secondary"
                                className="px-8 py-3 text-base"
                            >
                                No, Cancel
                            </Button>
                            <Button 
                                onClick={handleConfirm}
                                variant="destructive"
                                className="px-8 py-3 text-base"
                            >
                                Yes, Logout
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
