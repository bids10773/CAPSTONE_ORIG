import { createContext, useContext, useState, ReactNode } from 'react';

interface LogoutModalContextType {
    isOpen: boolean;
    openModal: () => void;
    closeModal: () => void;
}

const LogoutModalContext = createContext<LogoutModalContextType | undefined>(undefined);

export function LogoutModalProvider({ children }: { children: ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);

    const openModal = () => setIsOpen(true);
    const closeModal = () => setIsOpen(false);

    return (
        <LogoutModalContext.Provider value={{ isOpen, openModal, closeModal }}>
            {children}
        </LogoutModalContext.Provider>
    );
}

export function useLogoutModal() {
    const context = useContext(LogoutModalContext);
    if (context === undefined) {
        throw new Error('useLogoutModal must be used within a LogoutModalProvider');
    }
    return context;
}
