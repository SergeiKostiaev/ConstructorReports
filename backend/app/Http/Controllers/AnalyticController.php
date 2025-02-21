<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AnalyticController extends Controller
{
    public function index() {
        // TODO данные только по своей компании
        return success(['key' => 'fixme в разработке']);
    }
}
