<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->all();

        $validateFail = validateFailed($data, [
            'company_id' => 'required|string|max:255|exists:companies,name',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|max:255',
        ]);

        if (!$validateFail) {
            if (isset($request->user) && $request->user->isSuperAdmin()) {
                $data['role_id'] = User::$idAdmin;
                $data['confirmed'] = 1;
            }

            $data['password'] = Hash::make($data['password']);
            $data['company_id'] = Company::where('name', $data['company_id'])->first()->id;
            User::create($data);

            return success('Успешная регистрация');
        }

        return $validateFail;
    }

    public function login(Request $request){
        $validateFail = validateFailed($request->all(), [
            'company_id' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'required|string',
        ]);

        if (!$validateFail) {
            $user = User::with('company')->where('email',  $request->email)->first();

            if (!$user ||
                !Hash::check($request->password, $user->password))
                return error('Неверные данные для авторизации', 401);

            if (($user->isSuperAdmin() && $request->company_id === Company::$mainCompany) ||
                (isset($user->company->name) && $request->company_id === $user->company->name)
            ) {
                $user->generateToken();
                return success(['api_token' => $user->api_token, 'user' => $user]);
            }

            return error('Неверные данные для авторизации', 401);
        }

        return $validateFail;
    }

    public function logout(Request $request){
        $request->user->clearToken();
        return success(null, 204);
    }

    public function list(Request $request){
        // TODO возвращать отчеты только определенной компании, а не всех
        $user = User::with(['role', 'company']);
        if ($request->s) $user->where('name', 'like', '%' . $request->s .'%');
        if ($request->role_id && $request->user->isAdmin()) $user->where('role_id', $request->role_id);
        if ($request->company_id || !$request->user->isSuperAdmin()) $user->where('company_id', $request->user->isSuperAdmin() ? $request->company_id : $request->user->company_id);
        if ($request->confirmed) $user->where('confirmed', 1);
        if ($request->user->isUser()) $user->where('role_id', '<>', User::$idAdmin);

        return success($user->get());

//        Role::with('users')->get()
//            'role' => $request->user->role,
    }

    public function roles(){
        return success(Role::all());
//        Role::with('users')->get()
//            'role' => $request->user->role,
    }

    public function confirmed(Request $request) {
        return $request->user->confirmed($request->user_id);
    }

    public function delete(Request $request) {
        return $request->user->remove($request->user_id);
    }

    public function change(Request $request, $id) {
        $data = $request->all();

        $validateFail = validateFailed($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255',
            'password' => 'string|max:255',
        ]);

        if (!$validateFail) {
            return $request->user->updateById($id, $data);
        }

        return $validateFail;
    }
}
