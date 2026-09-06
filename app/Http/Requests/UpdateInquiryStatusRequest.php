<?php

namespace App\Http\Requests;

use App\Enums\InquiryStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateInquiryStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('inquiry')) ?? false;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::enum(InquiryStatus::class)],
        ];
    }
}
