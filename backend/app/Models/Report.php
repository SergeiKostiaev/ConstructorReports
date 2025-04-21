<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Report extends Model
{
    use HasFactory;

    static public string $addReport = 'Отчет добавлен';
    static public string $changeReport = 'Отчет изменен';
    static public string $notForridenFound = 'Отчет не найден или у вас нет доступа';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'category_id',
        'name',
        'extension',
        'user_id',
        'headers',
        'data',
        'whereData'
    ];

    protected $casts = [
        'headers' => 'array',
        'data' => 'array',
        'whereData' => 'array',
        'created_at'  => 'date:d.m.Y в H:i',
        'updated_at'  => 'date:d.m.Y в H:i',
    ];

    protected $hidden = [
        'password',
        'api_token',
        'role_id',
        'company_id',
        'confirmed',
        'email',
    ];

    static public array $allowedExtensions = ['xlsx', 'xls', 'ods', 'csv', 'json'];
    static public array $allowedWhere = ['==', '>', '<', '>=', '<='];

    public function category() {
        return $this->belongsTo(
            Category::class,
        );
    }

    public function status() {
        return $this->belongsTo(
            Status::class,
        );
    }

    public function user() {
        return $this->belongsTo(
            User::class,
        );
    }

    static public function remove($id, $idCompany) {
        $report = Report::join('users', 'users.id', '=', 'reports.user_id')
            ->where('reports.id', $id)
            ->where('users.company_id', $idCompany)
            ->first('reports.id');
        if (!$report) return error(self::$notForridenFound, 404);
        $report->delete();
        return success('Отчет удален');
    }

    static public function basket($id, $idCompany) {
        $report = Report::join('users', 'users.id', '=', 'reports.user_id')
            ->where('reports.id', $id)
            ->where('users.company_id', $idCompany)
            ->first('reports.id');
        if (!$report) return error(self::$notForridenFound, 404);
        $report->basket = 1;
        $report->save();
        return success('Отчет добавлен в корзину');
    }
}
