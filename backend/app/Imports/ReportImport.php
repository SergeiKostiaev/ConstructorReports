<?php

namespace App\Imports;

use Maatwebsite\Excel\Concerns\ToArray;

class ReportImport implements ToArray
{
    public function array(array $array)
    {
        return $array;
    }
}
