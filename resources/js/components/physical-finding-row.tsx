type Props = {
    field: string;
    label: string;
    status: string;
    finding: string;
    error?: string;
    onStatusChange: (status: string) => void;
    onFindingChange: (finding: string) => void;
};

export function PhysicalFindingRow({
    field,
    label,
    status,
    finding,
    error,
    onStatusChange,
    onFindingChange,
}: Props) {
    return (
        <div className="py-3 first:pt-0 last:pb-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <label
                    htmlFor={`${field}-status`}
                    className="text-sm font-semibold text-foreground"
                >
                    {label}
                </label>
                <select
                    id={`${field}-status`}
                    aria-label={`${label} assessment`}
                    value={status}
                    onChange={(event) => onStatusChange(event.target.value)}
                    className={`h-9 max-w-full rounded-lg border px-2.5 text-sm focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none ${status === 'with_findings' ? 'border-amber-300 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100' : 'border-border bg-background text-foreground'}`}
                >
                    <option value="normal">Normal</option>
                    <option value="with_findings">With findings</option>
                </select>
            </div>
            {status === 'with_findings' && (
                <>
                    <label htmlFor={`${field}-finding`} className="sr-only">
                        {label} findings
                    </label>
                    <textarea
                        id={`${field}-finding`}
                        value={finding}
                        rows={2}
                        onChange={(event) =>
                            onFindingChange(event.target.value)
                        }
                        placeholder="Document the finding"
                        aria-invalid={Boolean(error)}
                        aria-describedby={error ? `${field}-error` : undefined}
                        className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-6 text-foreground focus-visible:ring-2 focus-visible:ring-moss-500 focus-visible:outline-none"
                    />
                </>
            )}
            {error && (
                <p
                    id={`${field}-error`}
                    className="mt-1 text-xs font-semibold text-red-600"
                >
                    {error}
                </p>
            )}
        </div>
    );
}
