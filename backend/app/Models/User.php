<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    static public int $idUser = 1;

    static public int $idAdmin = 2;
    static public int $idSuperAdmin = 3;

    static private string $notFound = 'Пользователь не найден';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'role_id',
        'company_id',
        'confirmed',
        'api_token',
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'password',
        'api_token'
    ];

    public function isUser() {
        return $this->role_id == self::$idUser;
    }

    public function isAdmin() {
        return $this->role_id == self::$idAdmin || $this->role_id == self::$idSuperAdmin;
    }

    public function isSuperAdmin() {
        return $this->role_id == self::$idSuperAdmin;
    }

    public function updateById($id, $data) {
        $user = User::where('id', $id)->first();
        if (!$user) return error(self::$notFound, 404);

        if ($user->email !== $data['email']) {
            $checkUser = User::where('email', $data['email'])->first();
            if (!$checkUser) {
                $user->email = $data['email'];
            } else return error("Такой email уже занят");
        };

        $user->name = $data['name'];
        if (isset($data['password'])) $user->password = Hash::make($data['password']);
        $user->save();
        return success('Пользователь изменен');
    }

    public function confirmed($id) {
        $user = User::where('id', $id)->first();
        if (!$user) return error(self::$notFound, 404);
        $user->confirmed = 1;
        $user->save();
        return success('Пользователь подтвержден');
    }
    public function remove($id) {
        $user = User::where('id', $id)->first();
        if (!$user) return error(self::$notFound, 404);
        $user->delete();
        return success('Пользователь удален');
    }


    public function generateToken() {
        $this->api_token = Str::random();
        $this->save();
    }

    public function clearToken() {
        $this->api_token = null;
        $this->save();
    }

    public function role() {
        return $this->belongsTo(
            Role::class,
//            'role_id',
//            'id'
        );
    }

    public function company() {
        return $this->belongsTo(
            Company::class,
//            'role_id',
//            'id'
        );
    }
}
