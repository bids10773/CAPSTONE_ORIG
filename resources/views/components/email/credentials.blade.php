@props(['email', 'password', 'role' => null])
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:24px 0;background-color:#f3f7f2;border:1px solid #c9ddc5;border-radius:12px;">
    <tr>
        <td style="padding:18px 20px;">
            <p style="margin:0 0 14px;color:#455e4a;font-size:12px;line-height:18px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;">Temporary sign-in details</p>
            @if($role)
                <p style="margin:0 0 9px;color:#374151;font-size:14px;line-height:21px;"><strong>Assigned role:</strong> {{ $role }}</p>
            @endif
            <p style="margin:0 0 9px;color:#374151;font-size:14px;line-height:21px;"><strong>Login email:</strong> {{ $email }}</p>
            <p style="margin:0;color:#374151;font-size:14px;line-height:21px;"><strong>Temporary password:</strong> <span style="font-family:Consolas,'Courier New',monospace;font-size:15px;letter-spacing:.4px;">{{ $password }}</span></p>
        </td>
    </tr>
</table>
