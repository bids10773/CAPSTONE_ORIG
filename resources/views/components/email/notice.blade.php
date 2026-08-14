@props(['label' => 'Security notice', 'tone' => 'moss'])
@php
    $colors = $tone === 'warning'
        ? ['background' => '#fffbeb', 'border' => '#f3d38a', 'label' => '#92400e', 'text' => '#78350f']
        : ['background' => '#f3f7f2', 'border' => '#c9ddc5', 'label' => '#455e4a', 'text' => '#394c3d'];
@endphp
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;background-color:{{ $colors['background'] }};border:1px solid {{ $colors['border'] }};border-radius:12px;">
    <tr>
        <td style="padding:16px 18px;">
            <p style="margin:0 0 5px;color:{{ $colors['label'] }};font-size:12px;line-height:18px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">{{ $label }}</p>
            <div style="color:{{ $colors['text'] }};font-size:14px;line-height:21px;">{{ $slot }}</div>
        </td>
    </tr>
</table>
