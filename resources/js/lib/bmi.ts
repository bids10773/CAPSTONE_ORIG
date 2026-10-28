// WHO adult BMI categories. Children require an age-specific assessment.
export function getBmiClassification(
    value: number | string | null | undefined,
): string | null {
    if (value == null || String(value).trim() === '') return null;
    const bmi = Number(value);
    if (!Number.isFinite(bmi) || bmi <= 0) return null;
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal weight';
    if (bmi < 30) return 'Overweight';
    return 'Obesity';
}
