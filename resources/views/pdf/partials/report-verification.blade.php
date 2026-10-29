@if(filled($verificationQrDataUri ?? null))
    @if($compact ?? false)
        <div style="position:absolute; right:0; top:0; width:19mm; text-align:center; font-family:DejaVu Sans,sans-serif; font-size:7px; line-height:1.2;">
            <a href="{{ $verificationUrl }}"><img src="{{ $verificationQrDataUri }}" alt="Scan to verify report" style="display:block; width:19mm; height:19mm;"></a>
            <a href="{{ $verificationUrl }}" style="display:block; margin-top:1mm; color:#285c3b;">Scan to verify</a>
        </div>
    @else
    <div style="margin-top:4mm; padding-top:2mm; border-top:1px solid #d1d5db; page-break-inside:avoid; font-family:DejaVu Sans,sans-serif; font-size:8pt; line-height:1.2;">
        <img src="{{ $verificationQrDataUri }}" alt="Scan to verify report" style="display:block; width:{{ $qrSize ?? 23 }}mm; height:{{ $qrSize ?? 23 }}mm;">
        <a href="{{ $verificationUrl }}" style="display:block; margin-top:1mm; color:#285c3b;">Scan to verify / Verify online</a>
    </div>
    @endif
@endif
