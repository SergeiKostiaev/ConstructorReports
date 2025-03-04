<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Company extends Model
{
    use HasFactory;

    protected $table = 'companies';

    static public string $mainCompany = 'CONSTRUCTORHACK2024';

    static private string $notFound = 'Компания не найдена';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
    ];

    static public function remove($id) {
        $company = Company::where('id', $id)->first();
        if (!$company) return error(self::$notFound, 404);
        $company->delete();
        return success('Компания удалена');
    }
}
