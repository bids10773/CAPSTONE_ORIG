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
                        className="absolute inset-0 bg-gray-950/60 backdrop-blur-md"
                    />
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white rounded-[2rem] shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-blue-50/50">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="text-[#246AFE] h-6 w-6" />
                                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                <X className="h-5 w-5 text-gray-500" />
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="p-8 overflow-y-auto text-gray-600 leading-relaxed text-sm">
                            {content}
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-gray-100 flex justify-end bg-gray-50">
                            <Button onClick={onClose} className="bg-[#246AFE] px-8">
                                I Understand
                            </Button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
