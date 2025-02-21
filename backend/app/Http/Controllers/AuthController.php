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

        $validateFail = validateFailed($request->all(), [
            'company_id' => 'required|string|max:255|exists:companies,name',
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string',
        ]);

        if (!$validateFail) {
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
            $user = User::where('email',  $request->email)->first();
            $checkCompany = Company::where('name', $request->company_id)->first();
            if (!$user || !Hash::check($request->password, $user->password) || !$checkCompany)
            {
                return error('Неверные данные для авторизации', 401);
            }

            $user->generateToken();

            return success(['api_token' => $user->api_token, 'user' => $user]);
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
        if ($request->role_id) $user->where('role_id', $request->role_id);
        if ($request->company_id) $user->where('company_id', $request->company_id);
        if ($request->confirmed) $user->where('confirmed', 1);
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
}
