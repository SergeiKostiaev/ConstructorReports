<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id()->unsigned();
            $table->foreignId('status_id')->unsigned()->default(1)->constrained('statuses');
            $table->foreignId('category_id')->unsigned()->default(1)->constrained('categories');
            $table->string('name');
            $table->string('extension');
            $table->boolean('basket')->nullable();
            $table->foreignId('user_id')->unsigned()->constrained('users');
            $table->jsonb('headers');
            $table->jsonb('data');
            $table->jsonb('whereData')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
