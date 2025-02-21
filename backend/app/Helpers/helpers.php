<?php

use Illuminate\Support\Facades\Validator;


const JSON_HEADERS = ['Content-Type' => 'application/json;charset=UTF-8', 'Charset' => 'utf-8'];

if (!function_exists('json')) {
    function json($data)
    {
        return json_encode($data, JSON_UNESCAPED_UNICODE);
    }
}

if (!function_exists('jsonObject')) {
    function jsonObject($data)
    {
        return json_decode($data, true);
    }
}

if (!function_exists('success')) {
    function success($data = false, $status = 200)
    {
        $resp = [
            'success' => true
        ];

        if ($data) {
            if (gettype($data) === 'string') {
                $resp['message'] = $data;
            } else $resp['data'] = $data;
        }

        return response()->json($resp, $status, JSON_HEADERS, JSON_UNESCAPED_UNICODE);
    }
}

if (!function_exists('forriden')) {
    function forriden($msg = 'Нет доступа или вы уже сбросили токен')
    {
        return response()->json([
            'success'=>false,
            'message'=>$msg
        ], 403, JSON_HEADERS, JSON_UNESCAPED_UNICODE);
    }
}

if (!function_exists('error')) {
    function error($data = false, $status = 422)
    {
        $resp = [
            'success' => false
        ];

        if ($data) {
            if (gettype($data) === 'string') {
                $resp['message'] = $data;
            } else $resp['data'] = $data;
        }

        return response()->json($resp, $status, JSON_HEADERS, JSON_UNESCAPED_UNICODE);
    }
}

if (!function_exists('validateFailed')) {
    function validateFailed($data, $rules, $msg = [])
    {
        $validate = Validator::make($data, $rules, $msg);

        if ($validate->fails()) {
            return response()->json([
                'success' => false,
                'data' => $validate->errors()
            ], 422, JSON_HEADERS, JSON_UNESCAPED_UNICODE);
        }

        return false;
    }
}
