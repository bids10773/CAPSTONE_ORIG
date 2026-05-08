export interface User {
    id: number;

    first_name: string;
    middle_name?: string;
    last_name: string;

    email: string;
    email_verified_at?: string | null;

    contact?: string;

    patient_profile?: {
        birthdate?: string;
        sex?: string;
        civil_status?: string;
    };
}

export interface Auth {
    user: User
}