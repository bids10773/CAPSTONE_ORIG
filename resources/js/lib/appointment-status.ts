export const appointmentStatusLabels: Record<string, string> = {
    pending: 'Pending Approval',
    accepted: 'Confirmed',
    arrived: 'Arrived',
    for_diagnostics: 'For Diagnostics',
    for_xray: 'For X-Ray',
    awaiting_xray_result: 'Awaiting X-ray Result',
    for_final_evaluation: 'For Final Evaluation',
    completed: 'Completed',
    rejected: 'Rejected',
    cancelled: 'Cancelled',
};

export function appointmentStatusLabel(status: string): string {
    return appointmentStatusLabels[status] ?? status.replaceAll('_', ' ');
}
