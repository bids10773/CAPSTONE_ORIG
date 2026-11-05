export function physicalAssessment(
    value: string | null | undefined,
    completed: boolean,
) {
    for (const [prefix, status] of [
        ['Not assessed: ', 'not_assessed'],
        ['Not applicable: ', 'not_applicable'],
    ]) {
        if (value?.startsWith(prefix)) {
            return { status, finding: value.slice(prefix.length) };
        }
    }

    return {
        status: value ? 'with_findings' : completed ? 'normal' : '',
        finding: value || '',
    };
}
