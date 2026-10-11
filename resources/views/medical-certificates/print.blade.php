<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow, noarchive">
    <title>Medical Certificate</title>
</head>
<body>
    @include('medical-certificates.partials.document', [
        'certificate' => $certificate,
        'documentMode' => 'print',
    ])

    <script>
        window.addEventListener('load', () => window.print());
    </script>
</body>
</html>
