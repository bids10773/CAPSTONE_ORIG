export default function Heading({
    title,
    description,
    variant = 'default',
}: {
    title: string;
    description?: string;
    variant?: 'default' | 'small';
}) {
    return (
        <header className={variant === 'small' ? '' : 'mb-8 space-y-0.5'}>
            <h2
                className={
                    variant === 'small'
                        ? 'mb-0.5 text-base font-semibold tracking-tight text-balance'
                        : 'text-xl font-semibold tracking-tight text-balance'
                }
            >
                {title}
            </h2>
            {description && (
                <p className="text-sm leading-6 text-pretty text-muted-foreground">
                    {description}
                </p>
            )}
        </header>
    );
}
