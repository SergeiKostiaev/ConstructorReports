<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthCheck
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        $findUser = User::where('api_token', $token)->first();

        if (!$token || !$findUser || !$findUser->confirmed) {
            return forriden();
        }

        $request->merge(['user'=>$findUser]);
        return $next($request);
    }
}
