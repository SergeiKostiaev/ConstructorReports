<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function list() {
        $categories = Category::all(['id', 'name'])->toArray();
//        array_unshift($categories, [
//            'id' => null,
//            'name' => 'Загруженные отчеты'
//        ]);
        return success($categories);
    }
}
