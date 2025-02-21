<?php

namespace App\Http\Controllers;

use App\Exports\ReportExport;
use App\Imports\ReportImport;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Transliterate;
//use Illuminate\Http\UploadedFile;
//use Illuminate\Support\Facades\Storage;
//use Illuminate\Support\Str;


class ReportController extends Controller
{
    private function mappedReportData($headers, $data): array
    {
        $dataReport = [];
        foreach ($headers as $v) {
            $dataReport[0][] = $v['title'];
        }
        foreach ($data as $v) {
            $dataReport[] = $v;
        }
        return $dataReport;
    }

    public function listWhere()
    {
        return success(Report::$allowedWhere);
    }

    public function index(Request $request, $id)
    {
        $report = Report::with(['category', 'user'])
            ->join('users', 'users.id', '=', 'reports.user_id')
            ->where('reports.id', $id)
            ->where('users.company_id', $request->user->company_id)
            ->first(['reports.id', 'reports.category_id', 'reports.name', 'reports.extension', 'reports.user_id', 'reports.headers', 'reports.data', 'reports.whereData']);
        if (!$report) return error(Report::$notForridenFound, 404);
        return success($report);
    }

    public function exportPreview(Request $request, $id)
    {
        $data = $request->all();
        $data['id'] = $id;

        $validateFail = validateFailed($data, [
            'id' => 'required|exists:reports',
            'format' => 'required|string|max:255|in:' . implode(',', Report::$allowedExtensions),
            'name' => 'required|string|max:255',
            'headers' => 'required|array',
            'data' => 'required|array',
        ]);

        if (!$validateFail) {
            $dataReport = $this->mappedReportData($data['headers'], $data['data']);

            if ($data['format'] ==='json') {
                return response()->json($dataReport, 200, JSON_HEADERS, JSON_UNESCAPED_UNICODE);
            }

            return Excel::download(new ReportExport($dataReport), $data['name'] . '.' . $data['format']);
        }

        return $validateFail;
    }

    public function change(Request $request)
    {
        $data = $request->all();
        unset($data['user']);

        $validateFail = validateFailed($data, [
            'id' => 'required|integer|exists:reports',
            'category_id' => 'nullable|integer|exists:categories,id',
            'name' => 'nullable|string|max:255',
            'extension' => 'nullable|string|max:255|in:' . implode(',', Report::$allowedExtensions),
            'headers' => 'nullable|array',
            'whereData' => 'nullable|array',
        ]);


        if (!$validateFail) {
            // foreach ($data['headers'] as &$k) {
            //     if (!$k['name']) $k['name'] = Transliterate::slugify($k['title']);
            // }
            Report::where('id', $data['id'])->update($data);
            return success(Report::$changeReport);
        }

        return $validateFail;
    }

    public function add(Request $request)
    {
        $data = $request->all();

        $validateFail = validateFailed($data, [
            'category_id' => 'nullable|integer|exists:categories,id',
            'name' => 'required|string|max:255',
            'extension' => 'required|string|max:255|in:' . implode(',', Report::$allowedExtensions),
            'headers' => 'required|array',
            'data' => 'required|array',
        ]);

        if (!$validateFail) {
            Report::create($data);
            return success(Report::$addReport);
        }

        return $validateFail;
    }

    public function extensions() {
        return success(Report::$allowedExtensions);
    }

    public function import(Request $request)
    {
        // TODO обрабатывает только пока первый лист
        $validateFail = validateFailed($request->all(), [
            // fixme implode(',', Report::$allowedExtensions) добавить
            'file' => 'required|file|max:10000|mimes:xlsx,xls,ods,csv,txt,json' // https://docs.laravel-excel.com/3.1/imports/import-formats.html
        ]);

        if (!$validateFail) {
            $file = $request->file('file');
            $extension = $file->getClientOriginalExtension();

            if ($extension === 'json') {
                $fileData = jsonObject($file->getContent());
            } else {
                $fileData = Excel::toArray(new ReportImport(), $file);
            }

            $headers = $fileData[0][0];
            array_shift($fileData[0]);


            foreach ($headers as &$val) {
                $nameHeader = isset($val) ? Transliterate::slugify($val) : "";

                $val = [
                    'title' => $val,
                    'name' => str_replace('-', '_', $nameHeader), // TODO сделать уникальными, если название столбца одинаковое "_1" и тд
                    'fx' => '',
                    'type' => 'a', //или fx
                    'where' => []
                ];
            }

            Report::create([
                'name' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                'extension' => $extension,
                'user_id' => $request->user->id,
                'headers' => $headers,
                'data' => $fileData[0],
            ]);

            return success(Report::$addReport);
        }

        return $validateFail;

        //            if ($request->saveFormat) {
//                // TODO если нужно, оставить стили, как в исходном отчете, пока не нашел рабочего решения
//                $randName = time() . Str::random() . '.' . $file->getClientOriginalExtension();
//                Storage::disk('local')->put($randName, $file->getContent());
//
        //'1728911166w12rOmMXFSAQ80Gi.xlsx'

//                $data = Excel::toArray([], new UploadedFile(storage_path('app/private/1728911166w12rOmMXFSAQ80Gi.xlsx'), '1728911166w12rOmMXFSAQ80Gi.xlsx'))[0];
//            }
    }

    public function list(Request $request)
    {
        $report = Report::with(['category', 'user'])
            ->join('users', 'users.id', '=', 'reports.user_id')
            ->where('users.company_id', $request->user->company_id);
        if ($request->basket) $report->where('reports.basket', 1);
        if ($request->s) $report->where('reports.name', 'like', '%' . $request->s .'%');
        if ($request->category_id) $report->where('reports.category_id', $request->category_id);
        if ($request->user_id) $report->where('reports.user_id', $request->user_id);
        return success($report->get(['reports.id', 'reports.name', 'reports.extension', 'reports.basket', 'reports.category_id', 'reports.user_id', 'reports.created_at', 'reports.updated_at']));
    }

    public function export(Request $request, $id)
    {
        $data = $request->all();
        $data['id'] = $id;

        $validateFail = validateFailed($data, [
            'id' => 'required|exists:reports',
            'format' => 'in:' . implode(',', Report::$allowedExtensions) // https://docs.laravel-excel.com/3.1/exports/export-formats.html
        ]);

        if (!$validateFail) {
            $report = Report::find($id);
            $dataReport = $this->mappedReportData($report->headers, $report->whereData ? $report->whereData : $report->data);
            $format = $data['format'] ?? $report->extension;

            if ($format ==='json') {
                return response()->json($dataReport, 200, JSON_HEADERS, JSON_UNESCAPED_UNICODE);
            }

            return Excel::download(new ReportExport($dataReport), $report->name . '.' . $format);
        }

        return $validateFail;

        //        Excel::load(public_path('/files/test.xlsx'), function($doc){
//            $sheet = $doc->getActiveSheet();
//            $sheet->setCellValue('A4', 'dadadadadada');
//        })
//            ->store('xls', storage_path('Excel'));
    }

    public function delete(Request $request) {
        if ($request->basket) return Report::basket($request->report_id, $request->user->company_id);
        return Report::remove($request->report_id, $request->user->company_id);
    }
}
