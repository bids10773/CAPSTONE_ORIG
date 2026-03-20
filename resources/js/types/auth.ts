export interface User {
    id: number
    first_name: string
    middle_name?: string | null
    last_name: string
    email: string
    email_verified_at: string | null
    role?: string
}

export interface Auth {
    user: User
}