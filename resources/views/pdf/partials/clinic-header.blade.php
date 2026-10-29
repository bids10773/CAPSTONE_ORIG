<div class="header">
    @if(file_exists(public_path('images/full_logo2-optimized.png')))<img src="{{ ($documentMode ?? 'pdf') === 'print' ? $logoData : public_path('images/full_logo2-optimized.png') }}" alt="LMIC">@endif
    <h1>Living Myth Industrial Clinic</h1>
    <p>2nd Floor, Serafin Business Center, National Highway Banlic, Cabuyao, Laguna</p>
    <p>Telephone No. (049) 576-0715</p>
</div>
