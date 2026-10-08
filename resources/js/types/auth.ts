export interface User {
    id: number;

    first_name: string;
    middle_name?: string;
    last_name: string;
    position?: string | null;

    email: string;
    email_verified_at?: string | null;
    name: string;
    full_name?: string;
    avatar?: string;
    role?: string;
    license_no?: string | null;
    license_verification_status?:
        | 'not_submitted'
        | 'pending'
        | 'verified'
        | 'rejected';
    license_verified_at?: string | null;
    license_rejection_reason?: string | null;
    specialization?: string | null;
    signature_path?: string | null;

    contact?: string;
    company?: {
        id: number;
        company_name: string;
        email?: string | null;
        contact_number?: string | null;
    } | null;

    patient_profile?: {
        birthdate?: string;
        sex?: string;
        civil_status?: string;
        address?: string;
    };
}

export interface Auth {
    user: User;
}

export interface TwoFactorSetupData {
    svg: string;
}

export interface TwoFactorSecretKey {
    secretKey: string;
}
