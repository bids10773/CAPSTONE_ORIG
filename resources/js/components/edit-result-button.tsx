import { Pencil } from 'lucide-react';

export function EditResultButton({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-yellow-700 transition-colors hover:text-yellow-800 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-yellow-600"
        >
            <Pencil className="size-3.5" />
            Edit Result
        </button>
    );
}
