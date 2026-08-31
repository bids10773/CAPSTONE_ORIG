import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

function GoogleIcon() {
    return (
        <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
            <path
                fill="#4285F4"
                d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.4Z"
            />
            <path
                fill="#34A853"
                d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.4-4H3.3v2.6A10 10 0 0 0 12 22Z"
            />
            <path
                fill="#FBBC05"
                d="M6.6 14.1a6 6 0 0 1 0-4.2V7.3H3.3a10 10 0 0 0 0 9.4l3.3-2.6Z"
            />
            <path
                fill="#EA4335"
                d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.3 7.3l3.3 2.6a5.8 5.8 0 0 1 5.4-4Z"
            />
        </svg>
    );
}

export default function SocialAuthButtons({
    mode = 'login',
}: {
    mode?: 'login' | 'register';
}) {
    const [connecting, setConnecting] = useState<'google' | 'facebook' | null>(
        null,
    );

    const connect = (provider: 'google' | 'facebook') => {
        if (connecting) return;
        setConnecting(provider);
        window.location.assign(`/auth/${provider}/redirect`);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 py-1" aria-hidden="true">
                <span className="h-px flex-1 bg-slate-200" />
                <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    or
                </span>
                <span className="h-px flex-1 bg-slate-200" />
            </div>
            <button
                type="button"
                disabled={connecting !== null}
                onClick={() => connect('google')}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
                {connecting === 'google' ? (
                    <Spinner className="size-4" />
                ) : (
                    <GoogleIcon />
                )}
                {connecting === 'google'
                    ? 'Connecting to Google...'
                    : `${mode === 'register' ? 'Sign up' : 'Continue'} with Google`}
            </button>
            <button
                type="button"
                disabled={connecting !== null}
                onClick={() => connect('facebook')}
                className="flex h-11 w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
            >
                {connecting === 'facebook' ? (
                    <Spinner className="size-4" />
                ) : (
                    <span className="flex size-4 items-center justify-center rounded-sm bg-[#1877F2] text-xs font-bold text-white">
                        f
                    </span>
                )}
                {connecting === 'facebook'
                    ? 'Connecting to Facebook...'
                    : `${mode === 'register' ? 'Sign up' : 'Continue'} with Facebook`}
            </button>
        </div>
    );
}
