<?php
use App\Http\Controllers\AnalyticController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\CompanyController;
use App\Http\Controllers\ReportController;
use Illuminate\Support\Facades\Route;


Route::post('/user', [AuthController::class, 'register']);
Route::post('/auth', [AuthController::class, 'login']);

Route::middleware('auth')->group(function () {
    Route::get('/logout', [AuthController::class, 'logout']);

    Route::get('/where', [ReportController::class, 'listWhere']);
    Route::get('/categories', [CategoryController::class, 'list']);
    Route::get('/analytics', [AnalyticController::class, 'index']); // fixme потом сделать

    Route::get('/report/extensions', [ReportController::class, 'extensions']);
    Route::post('/report/import', [ReportController::class, 'import']);
    Route::get('/report/export/{id}', [ReportController::class, 'export']);
    Route::get('/report/list', [ReportController::class, 'list']);
    Route::delete('/report', [ReportController::class, 'delete']);

    Route::get('/report/{id}', [ReportController::class, 'index']);
    Route::post('/report/export/{id}/preview', [ReportController::class, 'exportPreview']);
    Route::patch('/report', [ReportController::class, 'change']);
    Route::post('/report', [ReportController::class, 'add']);

    Route::middleware('checkAdmin')->group(function () {
        Route::get('/users', [AuthController::class, 'list']);
        Route::patch('/user/confirmed', [AuthController::class, 'confirmed']);
        Route::delete('/user', [AuthController::class, 'delete']);
        Route::get('/roles', [AuthController::class, 'roles']);
        Route::get('/companies', [CompanyController::class, 'list']);
    });

    Route::middleware('checkSuperAdmin')->group(function () {
        Route::post('/user/admin', [AuthController::class, 'register']);
        Route::post('/company', [CompanyController::class, 'add']);
    });
});

Route::any('{any}', function () {
    return response('', 404);
})->where('any', '.*');
