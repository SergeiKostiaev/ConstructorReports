<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
// use Maatwebsite\Excel\Concerns\WithDrawings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Font;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;
use PhpOffice\PhpSpreadsheet\Worksheet\Drawing;


class ReportExport implements FromArray, WithStyles, ShouldAutoSize
{
    private array $data = [];

    public function __construct($data)
    {
        $this->data = $data;
    }

    public function array(): array
    {
        return $this->data;
    }

    public function styles(Worksheet $sheet)
    {
        // https://docs.laravel-excel.com/3.1/exports/column-formatting.html
        // https://phpspreadsheet.readthedocs.io/en/latest/topics/recipes/#valid-array-keys-for-style-applyfromarray

//        $sheet->getStyle('B2')->getFont()->setBold(true);

        return [
            1 => [
                'font' => [
                    'name' => 'Arial',
                    'bold' => true,
                    'italic' => false,
//                    'underline' => Font::UNDERLINE_DOUBLE,
                    'strikethrough' => false,
                    'color' => [
                        'rgb' => '000000'
                    ]
                ],
                'borders' => [
                    'bottom' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => [
                            'rgb' => '000000'
                        ]
                    ],
                    'right' => [
                        'borderStyle' => Border::BORDER_THIN,
                        'color' => [
                            'rgb' => '000000'
                        ]
                    ],
                ],
                'alignment' => [
                    'horizontal' => Alignment::HORIZONTAL_CENTER,
                    'vertical' => Alignment::VERTICAL_CENTER,
                    'wrapText' => true,
                ],
                'quotePrefix' => true
            ]
        ];
    }

    // public function drawings()
    // {
    //     $drawing = new Drawing();
    //     $drawing->setName('Logo');
    //     $drawing->setDescription('This is my logo');
    //     $drawing->setPath(public_path('/images/test.png'));
    //     $drawing->setHeight(100);
    //     $drawing->setCoordinates('A1');

    //     return $drawing;
    // }
}
