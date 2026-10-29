<?php

namespace App\Services;

use App\Models\BulkMedicalReport;
use Illuminate\Support\Facades\Storage;
use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Worksheet\MemoryDrawing;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;

class VerifiedWorkbookService
{
    public function contents(BulkMedicalReport $report): string
    {
        $data = app(ReportVerificationService::class)->documentData($report);
        if ($data === []) {
            return Storage::disk('local')->get($report->file_path);
        }
        $book = IOFactory::load(Storage::disk('local')->path($report->file_path));
        $activeSheet = $book->getActiveSheetIndex();
        if ($existing = $book->getSheetByName('Verification')) {
            $book->removeSheetByIndex($book->getIndex($existing));
        }
        $sheet = $book->createSheet()->setTitle('Verification');
        $sheet->setCellValue('A1', 'Living Myth Medical Clinic — Report verification');
        $sheet->setCellValue('A2', 'Document reference: '.$data['verificationReference']);
        $sheet->setCellValue('A3', 'Released: '.$report->released_at?->format('F j, Y'));
        $sheet->setCellValueExplicit('A4', $data['verificationUrl'], DataType::TYPE_STRING);
        $sheet->getCell('A4')->getHyperlink()->setUrl($data['verificationUrl']);
        $sheet->setCellValue('A5', 'Scan to confirm the clinic record and its current status.');
        $sheet->getColumnDimension('A')->setWidth(110);
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
        $sheet->getStyle('A4')->getFont()->getColor()->setARGB('FF285C3B');
        $drawing = new MemoryDrawing;
        $drawing->setName('Report verification QR');
        $drawing->setDescription('Scan to verify report');
        $drawing->setImageResource(imagecreatefromstring(base64_decode(substr($data['verificationQrDataUri'], strlen('data:image/png;base64,')))));
        $drawing->setRenderingFunction(MemoryDrawing::RENDERING_PNG)->setMimeType(MemoryDrawing::MIMETYPE_PNG);
        $drawing->setCoordinates('A7')->setHeight(180)->setWorksheet($sheet);
        $book->setActiveSheetIndex(min($activeSheet, $book->getSheetCount() - 1));
        ob_start();
        try {
            (new Xlsx($book))->save('php://output');

            return (string) ob_get_contents();
        } finally {
            ob_end_clean();
            $book->disconnectWorksheets();
        }
    }
}
