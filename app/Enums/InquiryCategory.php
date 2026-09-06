<?php

namespace App\Enums;

enum InquiryCategory: string
{
    case General = 'general';
    case MedicalServices = 'medical_services';
    case AppointmentConcern = 'appointment_concern';
    case CompanyServices = 'company_services';
    case CompanyAccount = 'company_account';
    case BulkOnsiteServices = 'bulk_onsite_services';
    case CompanyReferralServices = 'company_referral_services';
    case TechnicalConcern = 'technical_concern';
    case Other = 'other';

    public function label(): string
    {
        return match ($this) {
            self::General => 'General Inquiry',
            self::MedicalServices => 'Medical Services',
            self::AppointmentConcern => 'Appointment Concern',
            self::CompanyServices => 'Company Services',
            self::CompanyAccount => 'Company Account Inquiry',
            self::BulkOnsiteServices => 'Bulk / Onsite Medical Services',
            self::CompanyReferralServices => 'Company Referral Services',
            self::TechnicalConcern => 'Technical Concern',
            self::Other => 'Other',
        };
    }

    public function usesCompanyFields(): bool
    {
        return in_array($this, [
            self::CompanyServices,
            self::CompanyAccount,
            self::BulkOnsiteServices,
            self::CompanyReferralServices,
        ], true);
    }

    /** @return array<int, array{value: string, label: string, uses_company_fields: bool}> */
    public static function options(): array
    {
        return array_map(fn (self $category): array => [
            'value' => $category->value,
            'label' => $category->label(),
            'uses_company_fields' => $category->usesCompanyFields(),
        ], self::cases());
    }
}
