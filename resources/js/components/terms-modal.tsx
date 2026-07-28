import { motion, AnimatePresence } from 'framer-motion';
import { X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
}

export default function TermsModal({ isOpen, onClose, title, content }: Props) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-moss-950/25 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative flex max-h-[80vh] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-gray-100 bg-moss-50/50 p-6">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-6 w-6 text-moss-600" />
                                <h2 className="text-xl font-bold text-gray-900">
                                    {title}
                                </h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="rounded-full p-2 transition-colors hover:bg-gray-200"
                            >
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="overflow-y-auto p-8 text-sm leading-relaxed text-gray-600">
                            {content}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end border-t border-gray-100 bg-gray-50 p-6">
                            <Button
                                onClick={onClose}
                                className="bg-moss-500 px-8"
                            >
                                I Understand
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
