import AuthLayoutTemplate from '@/layouts/auth/auth-split-layout';
import { Toaster } from "sonner";

export default function AuthLayout({
    children,
    title,
    description,
    ...props
}: {
    children: React.ReactNode;
    title: string;
    description: string;
}) {
    return (
        <AuthLayoutTemplate title={title} description={description} {...props}>
            {children}
            <Toaster position="top-right" richColors />
        </AuthLayoutTemplate>
    );
}
