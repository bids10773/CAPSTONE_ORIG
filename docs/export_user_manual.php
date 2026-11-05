<?php

// Render the print HTML produced by export_user_manual.py using the app's PDF engine.
require dirname(__DIR__).'/vendor/autoload.php';

$app = require dirname(__DIR__).'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$html = file_get_contents(__DIR__.'/USER_MANUAL.html');
if ($html === false) {
    throw new RuntimeException('Generate USER_MANUAL.html with export_user_manual.py first.');
}

$pdf = Barryvdh\DomPDF\Facade\Pdf::loadHTML($html)->setPaper('a4', 'portrait');
$pdf->render();
$dompdf = $pdf->getDomPDF();
$dompdf->add_info('Title', 'LMIC Medical Services Management System - User Manual');
$font = $dompdf->getFontMetrics()->getFont('DejaVu Sans', 'normal');
$dompdf->getCanvas()->page_text(410, 817, 'Page {PAGE_NUM} of {PAGE_COUNT}', $font, 8, [0.37, 0.45, 0.39]);
$pdf->save(__DIR__.'/USER_MANUAL.pdf');

echo 'Created docs/USER_MANUAL.pdf ('.$dompdf->getCanvas()->get_page_count()." pages).\n";
