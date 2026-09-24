const paginationEntities: Record<string, string> = {
    '&amp;': '&',
    '&apos;': "'",
    '&#039;': "'",
    '&gt;': '>',
    '&laquo;': '«',
    '&lt;': '<',
    '&quot;': '"',
    '&raquo;': '»',
};

/** Decode Laravel pagination labels without injecting server-provided HTML. */
export function paginationLabel(label: string): string {
    return label
        .replace(/<[^>]*>/g, '')
        .replace(
            /&(amp|apos|#039|gt|laquo|lt|quot|raquo);/g,
            (entity) => paginationEntities[entity] ?? entity,
        );
}
