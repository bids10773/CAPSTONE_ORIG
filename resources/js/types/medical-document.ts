export type MedicalDocumentStatus =
    | 'pending'
    | 'for_review'
    | 'approved'
    | 'ready_for_pickup'
    | 'released'
    | 'cancelled'
    | 'voided';

export interface MedicalDocument {
    id: number;
    document_number: string;
    document_type: string;
    title: string;
    related_service: string | null;
    status: MedicalDocumentStatus;
    requested_at: string | null;
    ready_at: string | null;
    released_at: string | null;
    release_instructions: string | null;
    appointment?: {
        id: number;
        reference_code: string;
        appointment_date: string | null;
        start_time: string | null;
        status: string;
    } | null;
    patient?: { id: number; name: string };
    pdf_url?: string | null;
    can?: {
        mark_ready: boolean;
        release: boolean;
        reverse: boolean;
        grouped_pe_release: boolean;
        review: boolean;
        reviewed: boolean;
    };
    releases?: Array<{
        id: number;
        recipient_type: string;
        recipient_name: string | null;
        representative_verification: string | null;
        release_method: string;
        remarks: string | null;
        released_at: string;
        released_by: string | null;
        reversed_at: string | null;
        reversed_by: string | null;
        reversal_reason: string | null;
    }>;
}
