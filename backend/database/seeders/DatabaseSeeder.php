<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Company;
use App\Models\Role;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Role::create([
            'name' => 'Сотрудник'
        ]);
        Role::create([
            'name' => 'Админ'
        ]);
        Role::create([
            'name' => 'Супер админ'
        ]);

        Company::create([
            'name' => 'TESTCOMPANYID123'
        ]);
        Company::create([
            'name' => '234587234852345'
        ]);

        Category::create([
            'name' => 'Отчеты по проектам'
        ]);
        Category::create([
            'name' => 'Отчеты по задачам'
        ]);

        User::create([
            'role_id' => 2,
            'company_id' => 1,
            'confirmed' => 1,
            'name' => 'Adminov Manager',
            'email' => 'admin@example.com',
            'password' => Hash::make("1234"),
        ]);

        User::create([
            'role_id' => 3,
            'confirmed' => 1,
            'name' => 'Superov Admin',
            'email' => 'super_admin@example.com',
            'password' => Hash::make("1234"),
        ]);

        // User::factory(10)->create();
    }
}
