@php
    $staff = $staff ?? null;
    $verifiedAt = $verifiedAt ?? null;
    $signature = $staff?->signatureDataUri();
    $compact = $compact ?? false;
    $verificationLabel = $verificationLabel ?? 'Electronically verified';
@endphp

<div style="text-align:center; page-break-inside:avoid;">
    <div style="height:{{ $compact ? '20px' : '34px' }};">
        @if($signature)
            <img
                src="{{ $signature }}"
                alt="Electronic signature"
                style="max-width:150px; max-height:{{ $compact ? '20px' : '34px' }};"
            >
        @endif
    </div>
    <div style="border-bottom:1px solid #455e4a; color:#111; font-size:{{ $compact ? '7px' : '9px' }}; font-weight:700;">
        {{ strtoupper($staff?->name ?? 'AUTHORIZED CLINICAL STAFF') }}
    </div>
    @if($staff?->license_no && $staff?->license_verification_status === 'verified')
        <div style="font-size:{{ $compact ? '6px' : '8px' }};">LIC. NO. {{ $staff->license_no }}</div>
    @endif
    <div style="color:#455e4a; font-size:{{ $compact ? '6px' : '8px' }}; font-weight:700;">
        {{ $role ?? $staff?->specialization ?? $staff?->role_label ?? 'Authorized Clinical Staff' }}
    </div>
    @if($verifiedAt)
        <div style="margin-top:2px; color:#5f6f63; font-size:{{ $compact ? '5.5px' : '7px' }};">
            {{ $verificationLabel }} · {{ $verifiedAt->format('M j, Y g:i A') }}
        </div>
    @endif
</div>
