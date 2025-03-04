<?php

namespace App\Http\Controllers;

use App\Models\Company;
use Illuminate\Http\Request;

class CompanyController extends Controller
{
    public function list() {
        return success(Company::all());
    }

    public function remove($id) {
        return Company::remove($id);
    }

    public function add(Request $request) {
        $data = $request->all();

        $validateFail = validateFailed($request->all(), [
            'name' => 'required|string|max:255|unique:companies'
        ]);

        if (!$validateFail) {
            Company::create($data);
            return success('Компания добавлена');
        }

        return $validateFail;
    }
}
