import type { PaginatedResponse } from './pagination';

export type MedicalCertificateStatus =
    | 'draft'
    | 'pending_approval'
    | 'changes_requested'
    | 'approved'
    | 'issued'
    | 'void';

export type MedicalCertificatePatient = {
    id: number;
    patient_reference_code?: string | null;
    name?: string | null;
    full_name?: string | null;
    first_name?: string | null;
    middle_name?: string | null;
    last_name?: string | null;
    birthdate?: string | null;
    age?: number | null;
    sex?: string | null;
    civil_status?: string | null;
};

export type MedicalCertificatePhysician = {
    id: number;
    name: string;
    license_no?: string | null;
    license_verification_status?: string | null;
    specialization?: string | null;
};

export type MedicalCertificateConsultation = {
    id: number;
    reference_code?: string | null;
    consultation_date?: string | null;
    appointment_date?: string | null;
    reason_for_consultation?: string | null;
    reason?: string | null;
    notes?: string | null;
    clinical_impression?: string | null;
    final_diagnosis?: string | null;
    recommendation?: string | null;
    recommendations?: string | null;
    attending_physician_id?: number | null;
    physician_license_no?: string | null;
};

export type MedicalCertificatePermissions = {
    view?: boolean;
    create?: boolean;
    edit?: boolean;
    submit?: boolean;
    approve?: boolean;
    request_changes?: boolean;
    issue?: boolean;
    void?: boolean;
    print?: boolean;
    download_pdf?: boolean;
};

export type MedicalCertificateRecord = {
    id: number;
    certificate_number?: string | null;
    certificate_id?: string | null;
    reference_code?: string | null;
    status: MedicalCertificateStatus | string;
    patient_id?: number | null;
    appointment_id?: number | null;
    attending_physician_id?: number | null;
    salutation?: string | null;
    consultation_date?: string | null;
    reason_for_consultation?: string | null;
    clinical_impression?: string | null;
    recommendation?: string | null;
    rest_start_date?: string | null;
    rest_end_date?: string | null;
    date_issued?: string | null;
    patient_name?: string | null;
    patient_reference_code?: string | null;
    patient_age?: number | null;
    patient_sex?: string | null;
    patient_civil_status?: string | null;
    physician_name?: string | null;
    physician_license_no?: string | null;
    attending_physician_name?: string | null;
    attending_physician_license_no?: string | null;
    correction_notes?: string | null;
    void_reason?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    issued_at?: string | null;
    patient?: MedicalCertificatePatient | null;
    attending_physician?: MedicalCertificatePhysician | null;
    physician?: MedicalCertificatePhysician | null;
    can?: MedicalCertificatePermissions;
};

export type MedicalCertificateAudit = {
    id: number;
    event?: string | null;
    action?: string | null;
    from_status?: string | null;
    to_status?: string | null;
    notes?: string | null;
    created_at: string;
    user?: { id?: number; name?: string | null } | null;
    actor?: { id?: number; name?: string | null } | null;
};

export type MedicalCertificateDetail = MedicalCertificateRecord & {
    audits?: MedicalCertificateAudit[];
};

export type MedicalCertificatePaginator =
    PaginatedResponse<MedicalCertificateRecord>;

export type MedicalCertificateFormValues = {
    patient_id: string;
    patient_age: string;
    patient_sex: string;
    patient_civil_status: string;
    appointment_id: string;
    attending_physician_id: string;
    physician_license_no: string;
    salutation: string;
    consultation_date: string;
    reason_for_consultation: string;
    clinical_impression: string;
    recommendation: string;
    rest_start_date: string;
    rest_end_date: string;
    date_issued: string;
};
